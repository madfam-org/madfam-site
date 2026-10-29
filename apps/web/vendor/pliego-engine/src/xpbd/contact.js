// @ts-check
/**
 * Layer contact (engine.md §3.4): vertex–triangle, inter-sheet and self, with memorised sidedness
 * and position-level Coulomb friction; plus the ground plane y = 0.
 *
 * Broad phase every substep: uniform integer spatial hash (cell = max mesh edge, enlarged to 2 × reach when needed) of triangle
 * boxes inflated by the query radius (contact distance + the largest displacement possible this substep).
 * Narrow phase each substep over the candidate pairs. Pairs skip triangles that contain the vertex,
 * one of its mesh neighbours, a copy of it (cut duplicates), or a tab welded to its sheet.
 * Only projections that fall inside the triangle are handled (edge–edge contact is out of scope
 * for v0.1, engine.md §8).
 *
 * Cost (lane E4, 2026-10-18; positions bit-identical to the version before, test `contact-sides`):
 * the candidate pairs come out of the broad phase sorted by (vertex, triangle), so the memorised
 * sides live in an Int8Array beside the pairs and carry over from one broad phase to the next by a
 * merge, not a Map lookup per pair; the pair buffers are reused, not sliced; the hash entries are
 * laid out in bucket order with their triangle's bounding sphere, so the scan reads them in order;
 * Math.hypot (a builtin call that allocates) is replaced by fastmath.js's bit-identical hypot2/3.
 */
import { hypot2, hypot3 } from '../fastmath.js';

export class Contact {
  /** @param {any} w World */
  constructor(w) {
    const mesh = w.mesh;
    this.mesh = mesh;
    // vertex adjacency (CSR)
    const deg = new Int32Array(mesh.nV + 1);
    for (let e = 0; e < mesh.nE; e++) { deg[mesh.edges[2 * e] + 1]++; deg[mesh.edges[2 * e + 1] + 1]++; }
    for (let v = 0; v < mesh.nV; v++) deg[v + 1] += deg[v];
    const adj = new Int32Array(deg[mesh.nV]);
    const fill = deg.slice(0, mesh.nV);
    for (let e = 0; e < mesh.nE; e++) { const a = mesh.edges[2 * e], b = mesh.edges[2 * e + 1]; adj[fill[a]++] = b; adj[fill[b]++] = a; }
    this.adjStart = deg; this.adj = adj;
    let maxE = 0;
    for (let e = 0; e < mesh.nE; e++) maxE = Math.max(maxE, mesh.edgeLen[e]);
    this.cell = maxE;
    this.tc = new Float64Array(mesh.nV);
    this.mu = new Float64Array(mesh.nV);
    for (let v = 0; v < mesh.nV; v++) {
      const d = w.doc.sheets[mesh.vSheet[v]].derived;
      this.tc[v] = Math.max(d.collision_thickness, 0.05);
      this.mu[v] = d.friction;
    }
    /** candidate pairs (`nPairs` of them, sorted by vertex then triangle) and their memorised sides (0 unknown, ±1) */
    this.pv = new Int32Array(1024); this.pt = new Int32Array(1024); this.ps = new Int8Array(1024); this.nPairs = 0;
    /** @type {Int32Array|null} pair → first pair with the same (v, t); only when two cells of a triangle share a 32-bit key */
    this.canon = null;
    /** triangles that are in some pair (their normals are needed each pass) */
    this.used = new Uint8Array(mesh.nT);
    /** @type {{v: Int32Array, t: Int32Array, s: Int8Array, n: number}|null} sides of the previous candidates (reused) */
    this._prev = null;
    /** @type {{v: Int32Array, t: Int32Array, s: Int8Array, n: number}|null} sides restored from a snapshot, carried over by the next broad phase */
    this._restored = null;
    /** broad-phase scratch, declared here so a Contact keeps one hidden class */
    /** @type {Float64Array|null} */ this._sph = null; /** @type {Uint32Array|null} */ this._ek = null; /** @type {Int32Array|null} */ this._et = null;
    /** @type {Int32Array|null} */ this._bs = null; /** @type {Int32Array|null} */ this._bf = null; /** @type {Uint32Array|null} */ this._bk = null;
    /** @type {Int32Array|null} */ this._bt = null; /** @type {Float64Array|null} */ this._bsph = null; /** @type {Uint8Array|null} */ this._triFixed = null;
    /** @type {Float64Array|null} */ this._tn = null;
    this.active = 0;
    this.weldSheet = new Int32Array(mesh.nV);
    this.setWeldExclusion(w.weldSheet);
    this.mark = new Int32Array(mesh.nV).fill(-1);
    /** @type {Uint8Array|null} lip vertices of interlocking slits (edgecontact.js holds them against other sheets) */
    this.lipVert = null;
    // faceOrders [f, g, s] (FOLD: f lies on side s of g's normal; partial in v1 — a missing pair is
    // "unknown"): seeds the sidedness of a vertex of face f against a triangle of face g
    /** @type {Map<number, number>} */
    this.faceSide = new Map();
    this.nF = w.doc.nF;
    for (const fo of w.doc.faceOrders ?? []) if (Array.isArray(fo) && fo.length === 3 && fo[2] !== 0) this.faceSide.set(fo[0] * this.nF + fo[1], fo[2] > 0 ? 1 : -1);
  }

  /**
   * Contact exclusion around welds: a vertex within two mesh rings of a vertex glued to sheet b
   * does not collide with b (the hinge at a glue line lies on b; its side is undetermined there).
   * Step-gated glue (spec §5.19) calls this again when it switches.
   * @param {Int32Array} weldSheet per vertex: the sheet it is welded to, or −1
   */
  setWeldExclusion(weldSheet) {
    const n = this.mesh.nV, deg = this.adjStart, adj = this.adj;
    const near = Int32Array.from(weldSheet);
    for (let ring = 0; ring < 2; ring++) {
      const prev = Int32Array.from(near);
      for (let v = 0; v < n; v++) {
        if (prev[v] >= 0) continue;
        for (let q = deg[v]; q < deg[v + 1]; q++) { const u = adj[q]; if (prev[u] >= 0) { near[v] = prev[u]; break; } }
      }
    }
    this.weldSheet = near;
  }

  /** Rebuild candidate pairs. @param {Float64Array} x @param {Uint8Array} fixed @param {number} reach extra radius (mm) */
  broadPhase(x, fixed, reach) {
    const m = this.mesh, T = m.tris;
    // the sides memorised on the previous candidates (or restored), sorted by (vertex, triangle)
    const prev = this._restored ?? this._sided();
    this._restored = null;
    let cell = Math.max(this.cell, reach * 2, 1e-3);
    // integer spatial hash of cells; the table is typed-array CSR rebuilt each call (no Map, no
    // per-cell arrays: backlog item 22). Entries keep their full 32-bit cell key, so a query sees
    // exactly its own cell's triangles, in ascending order — the same candidates, in the same
    // order, as a Map keyed by the cell.
    const key = (/** @type {number} */ i, /** @type {number} */ j, /** @type {number} */ k) => ((Math.imul(i, 73856093) ^ Math.imul(j, 19349663) ^ Math.imul(k, 83492791)) >>> 0);
    let rmax = 0;
    for (let v = 0; v < m.nV; v++) rmax = Math.max(rmax, this.tc[v]);
    const R = rmax + reach;
    // bounding sphere of every triangle (centroid + farthest vertex), once per broad phase: the
    // narrow filter below is then one squared distance per candidate
    const S = this._sph ?? (this._sph = new Float64Array(4 * m.nT));
    let ext = 0;
    for (let t = 0; t < m.nT; t++) {
      const a = 3 * T[3 * t], b = 3 * T[3 * t + 1], c = 3 * T[3 * t + 2];
      const cx = (x[a] + x[b] + x[c]) / 3, cy = (x[a + 1] + x[b + 1] + x[c + 1]) / 3, cz = (x[a + 2] + x[b + 2] + x[c + 2]) / 3;
      const ra = hypot3(x[a] - cx, x[a + 1] - cy, x[a + 2] - cz), rb = hypot3(x[b] - cx, x[b + 1] - cy, x[b + 2] - cz), rc = hypot3(x[c] - cx, x[c + 1] - cy, x[c + 2] - cz);
      S[4 * t] = cx; S[4 * t + 1] = cy; S[4 * t + 2] = cz; S[4 * t + 3] = Math.max(ra, rb, rc) + R;
      if (S[4 * t + 3] > ext) ext = S[4 * t + 3];
    }
    // a triangle blown up far beyond the mesh size (a diverged simulation) would fill billions of
    // cells and abort the step with "Invalid typed array length": coarsen the grid so no triangle
    // spans more than about four cells per axis. The sphere test below still decides the pairs; on a
    // sane mesh (triangles ≤ 1.25 h, cells ≥ the longest edge) this never triggers.
    if (2 * ext > 8 * cell) cell = (2 * ext) / 8;
    // pass 1: (cell key, triangle) entries, triangles ascending
    let ek = this._ek ?? new Uint32Array(8 * m.nT), et = this._et ?? new Int32Array(8 * m.nT);
    let ne = 0;
    for (let t = 0; t < m.nT; t++) {
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (let i = 0; i < 3; i++) { const v = 3 * T[3 * t + i]; x0 = Math.min(x0, x[v]); x1 = Math.max(x1, x[v]); y0 = Math.min(y0, x[v + 1]); y1 = Math.max(y1, x[v + 1]); z0 = Math.min(z0, x[v + 2]); z1 = Math.max(z1, x[v + 2]); }
      const i0 = Math.floor((x0 - R) / cell), i1 = Math.floor((x1 + R) / cell);
      const j0 = Math.floor((y0 - R) / cell), j1 = Math.floor((y1 + R) / cell);
      const k0 = Math.floor((z0 - R) / cell), k1 = Math.floor((z1 + R) / cell);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
        if (ne === ek.length) { const k2 = new Uint32Array(2 * ne); k2.set(ek); ek = k2; const t2 = new Int32Array(2 * ne); t2.set(et); et = t2; }
        ek[ne] = key(i, j, k); et[ne] = t; ne++;
      }
    }
    this._ek = ek; this._et = et;
    // pass 2: counting sort of the entries by bucket (stable: triangles stay ascending)
    let B = 1;
    while (B < 2 * ne) B <<= 1;
    const mask = B - 1;
    let start = this._bs;
    if (!start || start.length < B + 1) start = this._bs = new Int32Array(B + 1);
    start.fill(0, 0, B + 1);
    for (let e = 0; e < ne; e++) start[(ek[e] & mask) + 1]++;
    for (let b = 0; b < B; b++) start[b + 1] += start[b];
    let fill = this._bf;
    if (!fill || fill.length < B) fill = this._bf = new Int32Array(B);
    fill.set(start.subarray(0, B));
    // the entries in bucket order, each with its triangle's sphere beside it (the scan reads them in order)
    let bk = this._bk, bt = this._bt, bs = this._bsph;
    if (!bk || !bt || !bs || bk.length < ne) { bk = this._bk = new Uint32Array(ek.length); bt = this._bt = new Int32Array(ek.length); bs = this._bsph = new Float64Array(4 * ek.length); }
    for (let e = 0; e < ne; e++) { const q = fill[ek[e] & mask]++; bk[q] = ek[e]; bt[q] = et[e]; }
    for (let q = 0; q < ne; q++) { const t = bt[q]; bs[4 * q] = S[4 * t]; bs[4 * q + 1] = S[4 * t + 1]; bs[4 * q + 2] = S[4 * t + 2]; bs[4 * q + 3] = S[4 * t + 3]; }
    let PV = this.pv, PT = this.pt, PS = this.ps;
    /** @type {Int32Array|null} */
    let canon = null;
    let np = 0, si = 0;
    const SV = prev.v, ST = prev.t, SS = prev.s, ns = prev.n, used = this.used;
    used.fill(0);
    const mark = this.mark, vGroup = m.vGroup, weld = this.weldSheet, triSheet = m.triSheet, vSheet = m.vSheet;
    const adjStart = this.adjStart, adj = this.adj, lipVert = this.lipVert;
    // triangles whose three vertices are all driven: a driven vertex never pairs with them
    const triFixed = this._triFixed ?? (this._triFixed = new Uint8Array(m.nT));
    for (let t = 0; t < m.nT; t++) triFixed[t] = fixed[T[3 * t]] && fixed[T[3 * t + 1]] && fixed[T[3 * t + 2]] ? 1 : 0;
    // The pair filters are pure predicates joined by AND, so their order does not change the pairs or
    // their order; the cheapest rejections (bounding sphere, driven triangle) run first (backlog
    // item 22: the broad phase was 60 % of a 3,900-vertex step).
    for (let v = 0; v < m.nV; v++) {
      const vx = x[3 * v], vy = x[3 * v + 1], vz = x[3 * v + 2];
      const kv = key(Math.floor(vx / cell), Math.floor(vy / cell), Math.floor(vz / cell));
      const b = kv & mask, q0 = start[b], q1 = start[b + 1];
      if (q0 === q1) continue;
      mark[v] = v;
      for (let q = adjStart[v]; q < adjStart[v + 1]; q++) mark[adj[q]] = v;
      const fv = fixed[v], g = vGroup[v], ws = weld[v], sv = vSheet[v], lip = lipVert !== null && lipVert[v] === 1;
      for (let q = q0; q < q1; q++) {
        if (bk[q] !== kv) continue;
        // outside the triangle's bounding sphere grown by R (same test as distance − radius > R)
        const dx = vx - bs[4 * q], dy = vy - bs[4 * q + 1], dz = vz - bs[4 * q + 2], rr = bs[4 * q + 3];
        if (dx * dx + dy * dy + dz * dz > rr * rr) continue;
        const t = bt[q];
        if (fv && triFixed[t]) continue;
        if (ws >= 0 && triSheet[t] === ws) continue;
        if (lip && triSheet[t] !== sv) continue;
        const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
        if (mark[a] === v || mark[b] === v || mark[c] === v) continue;
        if (vGroup[a] === g || vGroup[b] === g || vGroup[c] === g) continue;
        if (weld[a] === sv && weld[b] === sv && weld[c] === sv) continue;
        if (np === PV.length) {
          const n2 = 2 * np;
          const a2 = new Int32Array(n2); a2.set(PV); PV = a2; const b2 = new Int32Array(n2); b2.set(PT); PT = b2; const s2 = new Int8Array(n2); s2.set(PS); PS = s2;
          if (canon) { const c2 = new Int32Array(n2); c2.set(canon); canon = c2; }
        }
        PV[np] = v; PT[np] = t; used[t] = 1;
        // a pair keeps the side it memorised as a candidate of the previous broad phase; one that was
        // not a candidate then starts unknown (the Map this replaces kept exactly those)
        while (si < ns && (SV[si] < v || (SV[si] === v && ST[si] < t))) si++;
        let side = si < ns && SV[si] === v && ST[si] === t ? SS[si] : 0;
        if (np > 0 && PV[np - 1] === v && PT[np - 1] === t) {
          // two of the triangle's cells share this 32-bit key: the pair is a candidate twice (swept
          // twice, as before) and both copies share one side, as they shared one Map key
          if (!canon) { canon = new Int32Array(PV.length); for (let i = 0; i < np; i++) canon[i] = i; }
          canon[np] = canon[np - 1];
          side = 0;
        } else if (canon) canon[np] = np;
        PS[np] = side;
        np++;
      }
    }
    for (let v = 0; v < m.nV; v++) mark[v] = -1;
    this.pv = PV; this.pt = PT; this.ps = PS; this.canon = canon; this.nPairs = np;
  }

  /** The current candidates' memorised sides, compacted (sorted by vertex, then triangle). */
  _sided() {
    const n = this.nPairs, PV = this.pv, PT = this.pt, PS = this.ps;
    let c = 0;
    for (let p = 0; p < n; p++) if (PS[p] !== 0) c++;
    let out = this._prev;
    if (!out || out.v.length < c) { const k = Math.max(1024, 2 * c); out = this._prev = { v: new Int32Array(k), t: new Int32Array(k), s: new Int8Array(k), n: 0 }; }
    let k = 0;
    for (let p = 0; p < n; p++) if (PS[p] !== 0) { out.v[k] = PV[p]; out.t[k] = PT[p]; out.s[k] = PS[p]; k++; }
    out.n = k;
    return out;
  }

  /** Memorised sides as [v·nT + t, side] entries (World.snapshot). @returns {Array<[number, number]>} */
  sideEntries() {
    const nT = this.mesh.nT, r = this._restored ?? this._sided();
    /** @type {Array<[number, number]>} */
    const out = [];
    for (let i = 0; i < r.n; i++) out.push([r.v[i] * nT + r.t[i], r.s[i]]);
    return out;
  }

  /** Restore sides saved by sideEntries() (any order); the next broad phase carries them over. @param {Array<[number, number]>} entries */
  restoreSides(entries) {
    const nT = this.mesh.nT, e = entries.slice().sort((p, q) => p[0] - q[0]);
    const v = new Int32Array(e.length), t = new Int32Array(e.length), s = new Int8Array(e.length);
    for (let i = 0; i < e.length; i++) { v[i] = Math.floor(e[i][0] / nT); t[i] = e[i][0] - v[i] * nT; s[i] = e[i][1]; }
    this._restored = { v, t, s, n: e.length };
    this.nPairs = 0; this.canon = null;
  }

  /**
   * Project contacts (one Gauss–Seidel pass) with friction. `xs` = positions at substep start.
   * @param {Float64Array} x @param {Float64Array} xs @param {Float64Array} w inverse masses
   */
  project(x, xs, w) {
    const m = this.mesh, T = m.tris;
    if (!this.nPairs) { this.active = 0; return 0; }
    // unit normals of the triangles in play, once per pass (cheap rejection by signed distance)
    const N = this._tn ?? (this._tn = new Float64Array(3 * m.nT));
    const used = this.used, PV = this.pv, PT = this.pt, PS = this.ps, canon = this.canon, tcv = this.tc, muv = this.mu;
    for (let t = 0; t < m.nT; t++) {
      if (!used[t]) continue;
      const a = 3 * T[3 * t], b = 3 * T[3 * t + 1], c = 3 * T[3 * t + 2];
      const e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
      const e2x = x[c] - x[a], e2y = x[c + 1] - x[a + 1], e2z = x[c + 2] - x[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const L = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const il = L > 0 ? 1 / L : 0;
      N[3 * t] = nx * il; N[3 * t + 1] = ny * il; N[3 * t + 2] = nz * il;
    }
    let active = 0;
    for (let p = 0; p < this.nPairs; p++) {
      const v = PV[p], t = PT[p];
      const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
      const tc = 0.5 * (tcv[v] + tcv[a]);
      const nx = N[3 * t], ny = N[3 * t + 1], nz = N[3 * t + 2];
      if (nx === 0 && ny === 0 && nz === 0) continue;
      const ax = x[3 * a], ay = x[3 * a + 1], az = x[3 * a + 2];
      const px = x[3 * v] - ax, py = x[3 * v + 1] - ay, pz = x[3 * v + 2] - az;
      const d = px * nx + py * ny + pz * nz;
      if (Math.abs(d) > 2 * tc) continue;
      const e1x = x[3 * b] - ax, e1y = x[3 * b + 1] - ay, e1z = x[3 * b + 2] - az;
      const e2x = x[3 * c] - ax, e2y = x[3 * c + 1] - ay, e2z = x[3 * c + 2] - az;
      // barycentric of the projection
      const d11 = e1x * e1x + e1y * e1y + e1z * e1z, d12 = e1x * e2x + e1y * e2y + e1z * e2z, d22 = e2x * e2x + e2y * e2y + e2z * e2z;
      const p1 = px * e1x + py * e1y + pz * e1z, p2 = px * e2x + py * e2y + pz * e2z;
      const den = d11 * d22 - d12 * d12;
      if (!(den > 1e-12 * d11 * d22)) continue; // degenerate triangle
      const bb = (d22 * p1 - d12 * p2) / den, bc = (d11 * p2 - d12 * p1) / den, ba = 1 - bb - bc;
      if (!(ba >= -1e-3 && bb >= -1e-3 && bc >= -1e-3)) continue;
      const sp = canon === null ? p : canon[p];
      let s = PS[sp];
      if (s === 0 && this.faceSide.size) {
        const fs = this.faceSide.get(m.vFace[v] * this.nF + m.triFace[t]);
        if (fs !== undefined) { s = fs; PS[sp] = s; }
      }
      if (s === 0) {
        // sidedness from the substep start (before this substep's motion)
        const sx = xs[3 * v] - (ba * xs[3 * a] + bb * xs[3 * b] + bc * xs[3 * c]);
        const sy = xs[3 * v + 1] - (ba * xs[3 * a + 1] + bb * xs[3 * b + 1] + bc * xs[3 * c + 1]);
        const sz = xs[3 * v + 2] - (ba * xs[3 * a + 2] + bb * xs[3 * b + 2] + bc * xs[3 * c + 2]);
        const ds = sx * nx + sy * ny + sz * nz;
        s = ds >= 0 ? 1 : -1;
        PS[sp] = s;
      }
      const C = s * d - tc;
      if (C >= 0) continue;
      active++;
      const wv = w[v], wa = w[a], wb = w[b], wc = w[c];
      const sumw = wv + ba * ba * wa + bb * bb * wb + bc * bc * wc;
      if (sumw === 0) continue;
      const lam = -C / sumw;
      const dnx = s * nx * lam, dny = s * ny * lam, dnz = s * nz * lam;
      x[3 * v] += wv * dnx; x[3 * v + 1] += wv * dny; x[3 * v + 2] += wv * dnz;
      x[3 * a] -= wa * ba * dnx; x[3 * a + 1] -= wa * ba * dny; x[3 * a + 2] -= wa * ba * dnz;
      x[3 * b] -= wb * bb * dnx; x[3 * b + 1] -= wb * bb * dny; x[3 * b + 2] -= wb * bb * dnz;
      x[3 * c] -= wc * bc * dnx; x[3 * c + 1] -= wc * bc * dny; x[3 * c + 2] -= wc * bc * dnz;
      // friction: relative tangential displacement over the substep
      const mu = Math.max(muv[v], muv[a]);
      let rx = (x[3 * v] - xs[3 * v]) - (ba * (x[3 * a] - xs[3 * a]) + bb * (x[3 * b] - xs[3 * b]) + bc * (x[3 * c] - xs[3 * c]));
      let ry = (x[3 * v + 1] - xs[3 * v + 1]) - (ba * (x[3 * a + 1] - xs[3 * a + 1]) + bb * (x[3 * b + 1] - xs[3 * b + 1]) + bc * (x[3 * c + 1] - xs[3 * c + 1]));
      let rz = (x[3 * v + 2] - xs[3 * v + 2]) - (ba * (x[3 * a + 2] - xs[3 * a + 2]) + bb * (x[3 * b + 2] - xs[3 * b + 2]) + bc * (x[3 * c + 2] - xs[3 * c + 2]));
      const rn = rx * nx + ry * ny + rz * nz;
      rx -= rn * nx; ry -= rn * ny; rz -= rn * nz;
      const rt = hypot3(rx, ry, rz);
      if (rt === 0) continue;
      const lim = mu * -C;
      const f = rt <= lim ? 1 : lim / rt;
      const fl = f / sumw;
      x[3 * v] -= wv * rx * fl; x[3 * v + 1] -= wv * ry * fl; x[3 * v + 2] -= wv * rz * fl;
      x[3 * a] += wa * ba * rx * fl; x[3 * a + 1] += wa * ba * ry * fl; x[3 * a + 2] += wa * ba * rz * fl;
      x[3 * b] += wb * bb * rx * fl; x[3 * b + 1] += wb * bb * ry * fl; x[3 * b + 2] += wb * bb * rz * fl;
      x[3 * c] += wc * bc * rx * fl; x[3 * c + 1] += wc * bc * ry * fl; x[3 * c + 2] += wc * bc * rz * fl;
    }
    this.active = active;
    return active;
  }

  /** Ground plane y ≥ 0 with friction. @param {Float64Array} x @param {Float64Array} xs @param {Float64Array} w */
  ground(x, xs, w) {
    let n = 0;
    for (let v = 0; v < this.mesh.nV; v++) {
      if (w[v] === 0) continue;
      const r = 0; // documents lay sheets on the table at y = 0 (mid-surface on the plane)
      const y = x[3 * v + 1];
      if (y >= r) continue;
      n++;
      const pen = r - y;
      x[3 * v + 1] = r;
      const dx = x[3 * v] - xs[3 * v], dz = x[3 * v + 2] - xs[3 * v + 2];
      const dt = hypot2(dx, dz);
      if (dt === 0) continue;
      const lim = this.mu[v] * pen;
      const f = dt <= lim ? 1 : lim / dt;
      x[3 * v] -= dx * f; x[3 * v + 2] -= dz * f;
    }
    return n;
  }
}
