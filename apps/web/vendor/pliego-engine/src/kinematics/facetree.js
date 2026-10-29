// @ts-check
/**
 * Tier R rigid kinematics over the document's faces (engine.md §4).
 *
 * - `FaceTree`: spanning tree of a sheet's face-adjacency graph (across fold-capable edges: M, V,
 *   F, U, J; never B or cut C) from a root face; each child's transform is its parent's composed
 *   with the rotation about the shared edge line (in the flat state) by that edge's fold angle
 *   (valley positive: the child turns toward the sheet's front). Exact for consistent angle sets.
 * - `LoopClosure`: rigid-foldability residuals r_v = vee(log Π R(d_i, ρ_i)) per interior vertex
 *   (Belcastro & Hull 2002; Tachi 2009), Jacobian columns = current crease directions, damped
 *   least-squares drive projection (I − C⁺C)Δρ and Newton correction ρ ← ρ − C⁺r to ‖r‖ < 1e-10,
 *   and the DOF report m − rank(C).
 */
import { rot, mul3, mv3, logVee, symEigenvalues, solveSPD } from './linalg.js';
import { quatRotate } from '../geom.js';

/** Flat (un-placed) 3-D coordinates of document vertex v: (u, 0, −v) with u, v sheet-local. @param {any} doc @param {number} v */
export function flat3(doc, v) {
  const s = doc.sheets[doc.vSheet[v]];
  return [doc.coords[2 * v] - s.offset[0], 0, -(doc.coords[2 * v + 1] - s.offset[1])];
}

const foldable = (/** @type {any} */ doc, /** @type {number} */ e) => doc.assignment[e] !== 'B' && !(doc.assignment[e] === 'C' && doc.treatment[e] === 'cut');

export class FaceTree {
  /** @param {any} doc loaded document (needs faceEdges/edgeFaces from loadDocument) @param {number} sheet @param {number} [root] */
  constructor(doc, sheet, root) {
    this.doc = doc;
    this.sheet = sheet;
    const faces = doc.sheetFaces[sheet];
    this.root = root ?? faces[0];
    /** @type {{face:number, parent:number, edge:number, a:number[], dir:number[], sign:number}[]} */
    this.order = [];
    const seen = new Set([this.root]);
    const queue = [this.root];
    while (queue.length) {
      const f = /** @type {number} */(queue.shift());
      const fe = doc.faceEdges[f];
      for (const e of fe) {
        if (!foldable(doc, e)) continue;
        const g = doc.edgeFaces[2 * e] === f ? doc.edgeFaces[2 * e + 1] : doc.edgeFaces[2 * e];
        if (g < 0 || seen.has(g)) continue;
        seen.add(g); queue.push(g);
        const a = flat3(doc, doc.edges[2 * e]), b = flat3(doc, doc.edges[2 * e + 1]);
        const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const dir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L];
        // sign: a positive (valley) fold must lift the child toward +Y (the front, un-placed)
        const c = centroid(doc, g);
        const R = rot(dir, 1e-3);
        const p = mv3(R, [c[0] - a[0], c[1] - a[1], c[2] - a[2]]);
        this.order.push({ face: g, parent: f, edge: e, a, dir, sign: p[1] > 0 ? 1 : -1 });
      }
    }
    this.reached = seen;
  }

  /**
   * Rigid transforms of every reached face for fold angles ρ (radians per document edge).
   * Returns Map face → {R, t} acting on flat coordinates, in the sheet's placed world frame.
   * @param {ArrayLike<number>} rho
   */
  transforms(rho, rootPose) {
    const s = this.doc.sheets[this.sheet];
    const Rp = rootPose ? rootPose.R : quatToMat(s.placement.rotation), tp = rootPose ? rootPose.t : s.placement.origin;
    /** @type {Map<number, {R:number[], t:number[]}>} */
    const T = new Map([[this.root, { R: Rp, t: tp.slice() }]]);
    for (const o of this.order) {
      const P = /** @type {{R:number[], t:number[]}} */(T.get(o.parent));
      const Rl = rot(o.dir, o.sign * rho[o.edge]);
      // local: x → Rl (x − a) + a ; composed: P.R (Rl (x − a) + a) + P.t
      const R = mul3(P.R, Rl);
      const ra = mv3(Rl, o.a);
      const off = [o.a[0] - ra[0], o.a[1] - ra[1], o.a[2] - ra[2]];
      const po = mv3(P.R, off);
      T.set(o.face, { R, t: [po[0] + P.t[0], po[1] + P.t[1], po[2] + P.t[2]] });
    }
    return T;
  }

  /**
   * Document-vertex positions (3·nV; only this sheet's vertices are written).
   * @param {ArrayLike<number>} rho @param {Float64Array} [out]
   */
  pose(rho, out) {
    const doc = this.doc;
    const X = out ?? new Float64Array(3 * doc.nV);
    const T = this.transforms(rho);
    const done = new Uint8Array(doc.nV);
    for (const [f, tr] of T) {
      for (const v of doc.faces[f]) {
        if (done[v]) continue;
        done[v] = 1;
        const p = mv3(tr.R, flat3(doc, v));
        X[3 * v] = p[0] + tr.t[0]; X[3 * v + 1] = p[1] + tr.t[1]; X[3 * v + 2] = p[2] + tr.t[2];
      }
    }
    return X;
  }
}

/** @param {any} doc @param {number} f */
function centroid(doc, f) {
  const c = [0, 0, 0];
  for (const v of doc.faces[f]) { const p = flat3(doc, v); c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }
  const n = doc.faces[f].length;
  return [c[0] / n, c[1] / n, c[2] / n];
}

/** @param {number[]} q [x,y,z,w] */
export function quatToMat(q) {
  const ex = quatRotate(q, [1, 0, 0]), ey = quatRotate(q, [0, 1, 0]), ez = quatRotate(q, [0, 0, 1]);
  return [ex[0], ey[0], ez[0], ex[1], ey[1], ez[1], ex[2], ey[2], ez[2]];
}

export class LoopClosure {
  /** @param {any} doc @param {number} sheet */
  constructor(doc, sheet) {
    this.doc = doc;
    /** variables: fold-capable non-J edges of the sheet */
    /** @type {number[]} */
    this.vars = [];
    /** @type {Map<number, number>} */
    this.varOf = new Map();
    for (let e = 0; e < doc.nE; e++) {
      if (doc.eSheet[e] !== sheet || !foldable(doc, e) || doc.assignment[e] === 'J') continue;
      this.varOf.set(e, this.vars.length);
      this.vars.push(e);
    }
    // interior vertices: every incident edge foldable (no B or cut)
    /** @type {{v:number, edges:number[], dirs:number[][]}[]} */
    this.loops = [];
    const inc = Array.from({ length: doc.nV }, () => /** @type {number[]} */([]));
    for (let e = 0; e < doc.nE; e++) if (doc.eSheet[e] === sheet) { inc[doc.edges[2 * e]].push(e); inc[doc.edges[2 * e + 1]].push(e); }
    for (let v = 0; v < doc.nV; v++) {
      if (doc.vSheet[v] !== sheet || !inc[v].length) continue;
      if (inc[v].some((e) => !foldable(doc, e))) continue;
      const pv = flat3(doc, v);
      const items = inc[v].map((e) => {
        const o = doc.edges[2 * e] === v ? doc.edges[2 * e + 1] : doc.edges[2 * e];
        const po = flat3(doc, o);
        const d = [po[0] - pv[0], po[1] - pv[1], po[2] - pv[2]];
        const L = Math.hypot(...d);
        // counter-clockwise in (u, v) = angle of (d_u, −d_z)
        return { e, d: [d[0] / L, d[1] / L, d[2] / L], ang: Math.atan2(-d[2], d[0]) };
      }).sort((a, b) => a.ang - b.ang);
      this.loops.push({ v, edges: items.map((i) => i.e), dirs: items.map((i) => i.d) });
    }
    this.m = this.vars.length;
    this.rows = 3 * this.loops.length;
    // column structure of the Jacobian: the loops (3 rows each) in which each variable appears, in
    // ascending order, so the normal equations can be assembled from nonzeros only (see solve)
    /** @type {number[][]} */
    this.colLoops = Array.from({ length: this.m }, () => []);
    this.loops.forEach((L, k) => { for (const e of L.edges) { const j = this.varOf.get(e); if (j !== undefined && !this.colLoops[j].includes(k)) this.colLoops[j].push(k); } });
    for (const c of this.colLoops) c.sort((a, b) => a - b);
  }

  /** Residual vector (3 per interior vertex). @param {ArrayLike<number>} rho per document edge */
  residual(rho) {
    const r = new Float64Array(this.rows);
    this.loops.forEach((L, k) => {
      let F = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      // the face on the CCW side of each crease turns by +ρ about the outward crease direction
      for (let i = 0; i < L.edges.length; i++) F = mul3(F, rot(L.dirs[i], rho[L.edges[i]]));
      const w = logVee(F);
      r[3 * k] = w[0]; r[3 * k + 1] = w[1]; r[3 * k + 2] = w[2];
    });
    return r;
  }

  /** Jacobian (rows × m, row-major): column j = current direction of crease j within each loop. @param {ArrayLike<number>} rho */
  jacobian(rho) {
    const J = new Float64Array(this.rows * this.m);
    this.loops.forEach((L, k) => {
      let F = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      for (let i = 0; i < L.edges.length; i++) {
        const j = this.varOf.get(L.edges[i]);
        if (j !== undefined) {
          const d = mv3(F, L.dirs[i]);
          for (let c = 0; c < 3; c++) J[(3 * k + c) * this.m + j] += d[c];
        }
        F = mul3(F, rot(L.dirs[i], rho[L.edges[i]]));
      }
    });
    return J;
  }

  /** Degrees of freedom m − rank(C) at ρ (rank by eigenvalues of CᵀC above 1e-9·max). @param {ArrayLike<number>} rho */
  dof(rho) {
    if (!this.rows) return this.m;
    const J = this.jacobian(rho);
    const m = this.m, n = this.rows;
    const G = new Float64Array(m * m);
    for (let a = 0; a < m; a++) for (let b = a; b < m; b++) {
      let s = 0;
      for (let r = 0; r < n; r++) s += J[r * m + a] * J[r * m + b];
      G[a * m + b] = s; G[b * m + a] = s;
    }
    const ev = symEigenvalues(G, m);
    const tol = 1e-9 * Math.max(ev[0], 1e-300);
    return m - ev.filter((x) => x > tol).length;
  }

  /**
   * Newton/DLS solve: keep the edges in `fixed` at their values and correct the rest until
   * ‖r‖ < tol. Returns {rho, residual, iterations}.
   * @param {Float64Array} rho0 per document edge (copied) @param {Map<number, number>} fixed @param {{tol?:number, lambda?:number, maxIter?:number}} [o]
   */
  solve(rho0, fixed, o = {}) {
    const rho = Float64Array.from(rho0);
    for (const [e, a] of fixed) rho[e] = a;
    const free = this.vars.filter((e) => !fixed.has(e));
    const tol = o.tol ?? 1e-10, lam = o.lambda ?? 1e-9;
    let res = Infinity, it = 0;
    for (; it < (o.maxIter ?? 50); it++) {
      const r = this.residual(rho);
      res = Math.sqrt(r.reduce((s, x) => s + x * x, 0));
      if (res < tol) break;
      const J = this.jacobian(rho);
      const n = this.rows, k = free.length, m = this.m;
      // Δ = −Cᵀ (C Cᵀ + λ² I)⁻¹ r over the free columns. C Cᵀ is assembled column by column from the
      // nonzero rows only (a column touches the 3 rows of each of its one or two loops): the same
      // additions in the same order as the dense triple loop, so the result is bit-identical, at
      // O(columns) instead of O(rows² · columns) — the dense loop took 87 % of a 547-vertex
      // kinematic tessellation's frame (sim readiness, lane S)
      const M = new Float64Array(n * n);
      for (let a = 0; a < n; a++) M[a * n + a] = lam * lam;
      const rowsOf = (/** @type {number} */ j) => { const R = []; for (const q of this.colLoops[j]) R.push(3 * q, 3 * q + 1, 3 * q + 2); return R; };
      const fj = free.map((e) => /** @type {number} */(this.varOf.get(e)));
      for (const j of fj) {
        const R = rowsOf(j);
        for (let p = 0; p < R.length; p++) for (let q = p; q < R.length; q++) {
          const a = R[p], b = R[q];
          M[a * n + b] += J[a * m + j] * J[b * m + j];
        }
      }
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) M[b * n + a] = M[a * n + b];
      // damped least squares: λ² scaled to the system so the flat (singular) state stays solvable
      let tr = 0;
      for (let a = 0; a < n; a++) tr += M[a * n + a];
      const damp = Math.max(1e-14, 1e-10 * tr / n);
      for (let a = 0; a < n; a++) M[a * n + a] += damp;
      const y = solveSPD(M, Array.from(r), n);
      for (let q = 0; q < k; q++) {
        const e = free[q], j = fj[q];
        let s = 0;
        for (const a of rowsOf(j)) s += J[a * m + j] * y[a];
        rho[e] -= s;
      }
    }
    return { rho, residual: res, iterations: it };
  }

  /**
   * Follow a drive: step the driven edge from its current value to `target` in `steps` increments,
   * projecting each increment onto the motion (null space) and re-closing the loops.
   * @param {Float64Array} rho0 @param {number} edge @param {number} target @param {number} [steps]
   */
  track(rho0, edge, target, steps = 32) {
    let rho = Float64Array.from(rho0);
    const a0 = rho[edge];
    let worst = 0;
    for (let s = 1; s <= steps; s++) {
      const a = a0 + ((target - a0) * s) / steps;
      // predictor: first-order null-space step from the previous state
      const J = this.jacobian(rho);
      const j = /** @type {number} */(this.varOf.get(edge));
      const da = a - rho[edge];
      const free = this.vars.filter((e) => e !== edge);
      const n = this.rows;
      if (n && free.length) {
        // solve C_f δ_f = −c_j·da in least squares (minimum norm)
        const M = new Float64Array(n * n);
        for (let p = 0; p < n; p++) for (let q = p; q < n; q++) {
          let sum = p === q ? 1e-18 : 0;
          for (const e of free) { const c = /** @type {number} */(this.varOf.get(e)); sum += J[p * this.m + c] * J[q * this.m + c]; }
          M[p * n + q] = sum; M[q * n + p] = sum;
        }
        let tr = 0;
        for (let p = 0; p < n; p++) tr += M[p * n + p];
        for (let p = 0; p < n; p++) M[p * n + p] += Math.max(1e-14, 1e-10 * tr / n);
        const rhs = [];
        for (let p = 0; p < n; p++) rhs.push(-J[p * this.m + j] * da);
        const y = solveSPD(M, rhs, n);
        for (const e of free) { const c = /** @type {number} */(this.varOf.get(e)); let sum = 0; for (let p = 0; p < n; p++) sum += J[p * this.m + c] * y[p]; rho[e] += sum; }
      }
      rho[edge] = a;
      const r = this.solve(rho, new Map([[edge, a]]));
      rho = r.rho;
      worst = Math.max(worst, r.residual);
    }
    return { rho, worstResidual: worst };
  }
}

/**
 * Rigid transform of face f from flat coordinates to positions X (3 per document vertex), from its
 * best-conditioned vertex triangle (orthonormal frames).
 * @param {any} doc @param {number} f @param {Float64Array} X
 */
export function faceRigidPose(doc, f, X) {
  const fv = doc.faces[f];
  let best = -1, tri = [fv[0], fv[1], fv[2]];
  for (let j = 1; j < fv.length; j++) for (let k = j + 1; k < fv.length; k++) {
    const a = flat3(doc, fv[0]), b = flat3(doc, fv[j]), c = flat3(doc, fv[k]);
    const ar = Math.abs((b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]));
    if (ar > best) { best = ar; tri = [fv[0], fv[j], fv[k]]; }
  }
  const frame = (/** @type {number[][]} */ p) => {
    const u = norm([p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]]);
    const w0 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
    const n = norm(cross(u, w0)), v = cross(n, u);
    return [u, v, n];
  };
  const F = frame(tri.map((v) => flat3(doc, v)));
  const G = frame(tri.map((v) => [X[3 * v], X[3 * v + 1], X[3 * v + 2]]));
  const R = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) R[3 * i + j] += G[k][i] * F[k][j];
  const f0 = flat3(doc, tri[0]), r0 = mv3(R, f0);
  return { R, t: [X[3 * tri[0]] - r0[0], X[3 * tri[0] + 1] - r0[1], X[3 * tri[0] + 2] - r0[2]] };
}

/** @param {number[]} a */
function norm(a) { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; }
/** @param {number[]} a @param {number[]} b */
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
