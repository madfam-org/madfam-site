// @ts-check
/**
 * Sparse block (3×3) Cholesky factorisation for the Tier C implicit step.
 *
 * The matrix is symmetric positive definite, made of 3×3 blocks (one per vertex pair), with a
 * sparsity pattern fixed at construction (mesh edges, hinge stencils, join stencils). Values change
 * every refactorisation; the symbolic analysis (ordering, elimination tree, L pattern) is done once.
 *
 * Algorithm: minimum-degree ordering on the vertex graph, then an up-looking block Cholesky in the
 * style of T. Davis, "Direct Methods for Sparse Linear Systems" (SIAM 2006, cs_chol), generalised
 * to dense 3×3 blocks. Deterministic: fixed loop orders, no hashing, no randomness.
 *
 * Storage: A is kept as its upper block triangle in permuted CSC order (`Ap`, `Ai`, `Ax` with 9
 * doubles per block, row-major). `slot(i, j)` (original indices) returns the block offset so the
 * assembler writes in place. L is block CSC with the diagonal block first in each column.
 */

/**
 * Minimum-degree ordering on an undirected graph (explicit elimination graph; fine for the few
 * thousand nodes of a sheet). Ties break on the lowest node index, so the order is deterministic.
 * @param {number} n
 * @param {Int32Array[]} adj neighbour lists (no self loops)
 * @returns {Int32Array} perm, perm[k] = node eliminated k-th
 */
export function minimumDegreeOrder(n, adj) {
  /** @type {Set<number>[]} */
  const g = [];
  for (let v = 0; v < n; v++) g.push(new Set(adj[v]));
  const alive = new Uint8Array(n).fill(1);
  const perm = new Int32Array(n);
  // bucket by degree for speed
  for (let k = 0; k < n; k++) {
    let best = -1;
    let bd = Infinity;
    for (let v = 0; v < n; v++) {
      if (alive[v] && g[v].size < bd) { bd = g[v].size; best = v; if (bd === 0) break; }
    }
    perm[k] = best;
    alive[best] = 0;
    const nb = Array.from(g[best]).sort((a, b) => a - b);
    for (const u of nb) {
      const gu = g[u];
      gu.delete(best);
      for (const w of nb) if (w !== u) gu.add(w);
    }
    g[best].clear();
  }
  return perm;
}

export class BlockCholesky {
  /**
   * @param {number} n number of block rows (free vertices)
   * @param {Array<[number, number]>|Int32Array} pairs off-diagonal block pairs (i ≠ j, either order; duplicates allowed)
   */
  constructor(n, pairs) {
    this.n = n;
    /** @type {number[][]} */
    const nbr = Array.from({ length: n }, () => []);
    const P = pairs instanceof Int32Array ? pairs : Int32Array.from(/** @type {number[]} */([]).concat(...pairs));
    for (let t = 0; t < P.length; t += 2) {
      const i = P[t], j = P[t + 1];
      if (i === j) continue;
      if (i < 0 || j < 0 || i >= n || j >= n) throw new RangeError(`block pair (${i},${j}) out of range`);
      nbr[i].push(j); nbr[j].push(i);
    }
    /** @type {Int32Array[]} */
    const adj = nbr.map((l) => Int32Array.from(new Set(l)).sort());
    this.perm = minimumDegreeOrder(n, adj);
    this.inv = new Int32Array(n);
    for (let k = 0; k < n; k++) this.inv[this.perm[k]] = k;
    // upper pattern of permuted A, by column: rows r < c, plus the diagonal last
    /** @type {number[][]} */
    const cols = Array.from({ length: n }, () => []);
    for (let v = 0; v < n; v++) {
      const pv = this.inv[v];
      for (const u of adj[v]) { const pu = this.inv[u]; if (pu < pv) cols[pv].push(pu); }
    }
    const Ap = new Int32Array(n + 1);
    for (let c = 0; c < n; c++) { cols[c].sort((a, b) => a - b); cols[c].push(c); Ap[c + 1] = Ap[c] + cols[c].length; }
    const Ai = new Int32Array(Ap[n]);
    for (let c = 0; c < n; c++) Ai.set(cols[c], Ap[c]);
    this.Ap = Ap; this.Ai = Ai;
    this.Ax = new Float64Array(9 * Ap[n]);
    // elimination tree
    const parent = new Int32Array(n).fill(-1);
    const anc = new Int32Array(n).fill(-1);
    for (let k = 0; k < n; k++) {
      for (let p = Ap[k]; p < Ap[k + 1]; p++) {
        let i = Ai[p];
        while (i !== -1 && i < k) {
          const next = anc[i];
          anc[i] = k;
          if (next === -1) { parent[i] = k; break; }
          i = next;
        }
      }
    }
    this.parent = parent;
    // column counts of L (strictly lower), via row subtrees
    const flag = new Int32Array(n).fill(-1);
    const cnt = new Int32Array(n);
    for (let k = 0; k < n; k++) {
      flag[k] = k;
      for (let p = Ap[k]; p < Ap[k + 1]; p++) {
        let i = Ai[p];
        for (; flag[i] !== k; i = parent[i]) { cnt[i]++; flag[i] = k; }
      }
    }
    const Lp = new Int32Array(n + 1);
    for (let j = 0; j < n; j++) Lp[j + 1] = Lp[j] + cnt[j] + 1;
    this.Lp = Lp;
    this.Li = new Int32Array(Lp[n]);
    this.Lx = new Float64Array(9 * Lp[n]);
    this._flag = flag;
    this._c = new Int32Array(n);
    this._s = new Int32Array(n);
    this._x = new Float64Array(9 * n);
    this._w = new Float64Array(3 * n);
    this.factored = false;
  }

  /** Number of stored blocks of L (fill measure). */
  get nnzL() { return this.Lp[this.n]; }

  /**
   * Offset (in doubles) of block (i, j) inside `Ax`, original indices. The stored block is
   * A(perm-min, perm-max) row-major: when the permuted row index is greater than the column index
   * the caller must write the transpose — `slot` returns a negative-encoded offset in that case
   * (−offset − 1) so assemblers can add the transpose.
   * @param {number} i @param {number} j
   */
  slot(i, j) {
    let r = this.inv[i], c = this.inv[j];
    let sign = 1;
    if (r > c) { const t = r; r = c; c = t; sign = -1; }
    const Ai = this.Ai;
    let lo = this.Ap[c], hi = this.Ap[c + 1] - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const v = Ai[mid];
      if (v === r) return sign > 0 ? 9 * mid : -9 * mid - 1;
      if (v < r) lo = mid + 1; else hi = mid - 1;
    }
    throw new RangeError(`block (${i},${j}) not in pattern`);
  }

  /** Zero all stored values of A. */
  clear() { this.Ax.fill(0); }

  /**
   * Add a 3×3 block `b` (row-major, as the (i, j) block of the original matrix) at a slot from
   * `slot(i, j)`. Diagonal blocks must be added symmetric.
   * @param {number} s @param {Float64Array|number[]} b @param {number} [bo] offset into b @param {number} [scale]
   */
  add(s, b, bo = 0, scale = 1) {
    const Ax = this.Ax;
    if (s >= 0) {
      for (let q = 0; q < 9; q++) Ax[s + q] += scale * b[bo + q];
    } else {
      const o = -s - 1;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) Ax[o + 3 * r + c] += scale * b[bo + 3 * c + r];
    }
  }

  /** Numeric factorisation. Throws if the matrix is not positive definite. */
  factor() {
    const n = this.n, Ap = this.Ap, Ai = this.Ai, Ax = this.Ax, Lp = this.Lp, Li = this.Li, Lx = this.Lx;
    const parent = this.parent, flag = this._flag, c = this._c, s = this._s, x = this._x;
    for (let j = 0; j < n; j++) c[j] = Lp[j] + 1; // diagonal goes first
    flag.fill(-1);
    for (let k = 0; k < n; k++) {
      let top = n;
      flag[k] = k;
      const k9 = 9 * k;
      for (let q = 0; q < 9; q++) x[k9 + q] = 0;
      for (let p = Ap[k]; p < Ap[k + 1]; p++) {
        let i = Ai[p];
        const i9 = 9 * i, a9 = 9 * p;
        for (let q = 0; q < 9; q++) x[i9 + q] = Ax[a9 + q];
        let len = 0;
        for (; flag[i] !== k; i = parent[i]) { s[len++] = i; flag[i] = k; }
        while (len > 0) s[--top] = s[--len];
      }
      // d = A_kk
      let d0 = x[k9], d1 = x[k9 + 1], d2 = x[k9 + 2], d4 = x[k9 + 4], d5 = x[k9 + 5], d8 = x[k9 + 8];
      for (let q = 0; q < 9; q++) x[k9 + q] = 0;
      for (; top < n; top++) {
        const i = s[top];
        const i9 = 9 * i;
        // y = L_ii^{-1} x_i (forward substitution, L_ii lower triangular)
        const li = 9 * Lp[i];
        const l00 = Lx[li], l10 = Lx[li + 3], l11 = Lx[li + 4], l20 = Lx[li + 6], l21 = Lx[li + 7], l22 = Lx[li + 8];
        // (column by column, unrolled: no allocation in the inner loop)
        const y0 = x[i9] / l00, y1 = x[i9 + 1] / l00, y2 = x[i9 + 2] / l00;
        const y3 = (x[i9 + 3] - l10 * y0) / l11, y4 = (x[i9 + 4] - l10 * y1) / l11, y5 = (x[i9 + 5] - l10 * y2) / l11;
        const y6 = (x[i9 + 6] - l20 * y0 - l21 * y3) / l22, y7 = (x[i9 + 7] - l20 * y1 - l21 * y4) / l22, y8 = (x[i9 + 8] - l20 * y2 - l21 * y5) / l22;
        for (let q = 0; q < 9; q++) x[i9 + q] = 0;
        // x_r -= L_ri * y for rows r already in column i (r < k)
        const end = c[i];
        for (let p = Lp[i] + 1; p < end; p++) {
          const r9 = 9 * Li[p], l = 9 * p;
          const a0 = Lx[l], a1 = Lx[l + 1], a2 = Lx[l + 2], a3 = Lx[l + 3], a4 = Lx[l + 4], a5 = Lx[l + 5], a6 = Lx[l + 6], a7 = Lx[l + 7], a8 = Lx[l + 8];
          x[r9] -= a0 * y0 + a1 * y3 + a2 * y6;
          x[r9 + 1] -= a0 * y1 + a1 * y4 + a2 * y7;
          x[r9 + 2] -= a0 * y2 + a1 * y5 + a2 * y8;
          x[r9 + 3] -= a3 * y0 + a4 * y3 + a5 * y6;
          x[r9 + 4] -= a3 * y1 + a4 * y4 + a5 * y7;
          x[r9 + 5] -= a3 * y2 + a4 * y5 + a5 * y8;
          x[r9 + 6] -= a6 * y0 + a7 * y3 + a8 * y6;
          x[r9 + 7] -= a6 * y1 + a7 * y4 + a8 * y7;
          x[r9 + 8] -= a6 * y2 + a7 * y5 + a8 * y8;
        }
        // d -= y^T y ; L_ki = y^T
        d0 -= y0 * y0 + y3 * y3 + y6 * y6;
        d1 -= y0 * y1 + y3 * y4 + y6 * y7;
        d2 -= y0 * y2 + y3 * y5 + y6 * y8;
        d4 -= y1 * y1 + y4 * y4 + y7 * y7;
        d5 -= y1 * y2 + y4 * y5 + y7 * y8;
        d8 -= y2 * y2 + y5 * y5 + y8 * y8;
        const p = c[i]++;
        Li[p] = k;
        const l = 9 * p;
        Lx[l] = y0; Lx[l + 1] = y3; Lx[l + 2] = y6;
        Lx[l + 3] = y1; Lx[l + 4] = y4; Lx[l + 5] = y7;
        Lx[l + 6] = y2; Lx[l + 7] = y5; Lx[l + 8] = y8;
      }
      // L_kk = chol(d)
      if (!(d0 > 0)) throw new Error(`BlockCholesky: matrix not positive definite at block ${k}`);
      const m00 = Math.sqrt(d0);
      const m10 = d1 / m00, m20 = d2 / m00;
      const e11 = d4 - m10 * m10;
      if (!(e11 > 0)) throw new Error(`BlockCholesky: matrix not positive definite at block ${k}`);
      const m11 = Math.sqrt(e11);
      const m21 = (d5 - m20 * m10) / m11;
      const e22 = d8 - m20 * m20 - m21 * m21;
      if (!(e22 > 0)) throw new Error(`BlockCholesky: matrix not positive definite at block ${k}`);
      const m22 = Math.sqrt(e22);
      const l = 9 * Lp[k];
      Li[Lp[k]] = k;
      Lx[l] = m00; Lx[l + 1] = 0; Lx[l + 2] = 0;
      Lx[l + 3] = m10; Lx[l + 4] = m11; Lx[l + 5] = 0;
      Lx[l + 6] = m20; Lx[l + 7] = m21; Lx[l + 8] = m22;
    }
    this.factored = true;
  }

  /**
   * Solve A·x = b in place. `b` is 3n doubles in ORIGINAL vertex order.
   * @param {Float64Array} b
   */
  solve(b) {
    if (!this.factored) throw new Error('BlockCholesky: solve before factor');
    const n = this.n, Lp = this.Lp, Li = this.Li, Lx = this.Lx, perm = this.perm, w = this._w;
    for (let k = 0; k < n; k++) { const v = 3 * perm[k]; w[3 * k] = b[v]; w[3 * k + 1] = b[v + 1]; w[3 * k + 2] = b[v + 2]; }
    // forward: L z = w (column oriented)
    for (let j = 0; j < n; j++) {
      const l = 9 * Lp[j], j3 = 3 * j;
      const z0 = w[j3] / Lx[l];
      const z1 = (w[j3 + 1] - Lx[l + 3] * z0) / Lx[l + 4];
      const z2 = (w[j3 + 2] - Lx[l + 6] * z0 - Lx[l + 7] * z1) / Lx[l + 8];
      w[j3] = z0; w[j3 + 1] = z1; w[j3 + 2] = z2;
      for (let p = Lp[j] + 1; p < Lp[j + 1]; p++) {
        const r3 = 3 * Li[p], q = 9 * p;
        w[r3] -= Lx[q] * z0 + Lx[q + 1] * z1 + Lx[q + 2] * z2;
        w[r3 + 1] -= Lx[q + 3] * z0 + Lx[q + 4] * z1 + Lx[q + 5] * z2;
        w[r3 + 2] -= Lx[q + 6] * z0 + Lx[q + 7] * z1 + Lx[q + 8] * z2;
      }
    }
    // backward: L^T x = z
    for (let j = n - 1; j >= 0; j--) {
      const j3 = 3 * j;
      let s0 = w[j3], s1 = w[j3 + 1], s2 = w[j3 + 2];
      for (let p = Lp[j] + 1; p < Lp[j + 1]; p++) {
        const r3 = 3 * Li[p], q = 9 * p;
        const x0 = w[r3], x1 = w[r3 + 1], x2 = w[r3 + 2];
        s0 -= Lx[q] * x0 + Lx[q + 3] * x1 + Lx[q + 6] * x2;
        s1 -= Lx[q + 1] * x0 + Lx[q + 4] * x1 + Lx[q + 7] * x2;
        s2 -= Lx[q + 2] * x0 + Lx[q + 5] * x1 + Lx[q + 8] * x2;
      }
      const l = 9 * Lp[j];
      const x2 = s2 / Lx[l + 8];
      const x1 = (s1 - Lx[l + 7] * x2) / Lx[l + 4];
      const x0 = (s0 - Lx[l + 3] * x1 - Lx[l + 6] * x2) / Lx[l];
      w[j3] = x0; w[j3 + 1] = x1; w[j3 + 2] = x2;
    }
    for (let k = 0; k < n; k++) { const v = 3 * perm[k]; b[v] = w[3 * k]; b[v + 1] = w[3 * k + 1]; b[v + 2] = w[3 * k + 2]; }
    return b;
  }
}
