// @ts-check
/**
 * Render-side views of a World: the render mesh (vertices split into smoothing groups along fold
 * hinges), crease/cut polylines for overlays, and ray picking, all presented (spec §5.16,
 * presentation.js). Buffers are allocated once and refreshed in place.
 *
 * Lane E4 (2026-10-18), for the Studio's engine Worker: `update()` and `creaseLines()` recompute only
 * when the World's `poseVersion` moved since they last did (an asleep or paused world costs nothing
 * per frame), or write into caller-provided Float32Arrays (`out`), which skips the copy a Worker
 * would otherwise make before transferring them; `pick()` reuses one scratch array.
 */
import { hypot3 } from '../fastmath.js';

const KIND = /** @type {Record<string, number>} */ ({ score: 2, perforation: 3, cut: 4 });

export class RenderBuffers {
  /** @param {any} w World */
  constructor(w) {
    this.w = w;
    const r = w.mesh.render;
    this.positions = new Float32Array(3 * r.nR);
    this.normals = new Float32Array(3 * r.nR);
    this.uvs = r.uv;
    this.sheetIds = Float32Array.from(r.sheet);
    this.indices = r.indices;
    /** pose version the shared buffers show (-1: none yet) */
    this._version = -1; this._linesVersion = -1;
    /** @type {Float64Array|null} */ this._pickX = null;
    this.out = { positions: this.positions, normals: this.normals, uvs: this.uvs, sheetIds: this.sheetIds, indices: this.indices, vertexCount: r.nR, triangleCount: w.mesh.nT };
    // crease polylines
    const doc = w.doc;
    /** @type {number[]} */ const seg = [], kinds = [], segEdge = [];
    for (let e = 0; e < doc.nE; e++) {
      const t = doc.treatment[e];
      let k;
      if (t === 'crease') k = doc.assignment[e] === 'M' ? 0 : 1;
      else if (KIND[t] !== undefined) k = KIND[t];
      else continue;
      const chain = w.mesh.docEdgeChain[e];
      for (let i = 0; i + 1 < chain.length; i++) { seg.push(chain[i], chain[i + 1]); kinds.push(k); segEdge.push(e); }
    }
    this.segVerts = Int32Array.from(seg);
    // positions: xyz pairs per segment; kinds: 0 mountain, 1 valley, 2 score, 3 perforation, 4 cut;
    // edges: document edge of each segment; names: pliego:edges_name of that edge (or null)
    this.lines = {
      positions: new Float32Array(3 * seg.length), kinds: Uint8Array.from(kinds), count: kinds.length,
      edges: Int32Array.from(segEdge), names: segEdge.map((e) => (doc.edgeNames ? doc.edgeNames[e] : null)),
    };
  }

  /**
   * @param {{positions?: Float32Array, normals?: Float32Array}} [out] write here (3·vertexCount floats each) instead of the shared buffers
   */
  update(out) {
    const own = !out || (!out.positions && !out.normals);
    if (own && this._version === this.w.poseVersion) return this.out;
    const x = this.w.x, r = this.w.mesh.render, T = this.w.mesh.tris;
    const P = (out && out.positions) || this.positions, N = (out && out.normals) || this.normals;
    for (let i = 0; i < r.nR; i++) { const v = 3 * r.src[i]; P[3 * i] = x[v]; P[3 * i + 1] = x[v + 1]; P[3 * i + 2] = x[v + 2]; }
    N.fill(0);
    const C = r.triCorner;
    for (let t = 0; t < this.w.mesh.nT; t++) {
      const a = 3 * T[3 * t], b = 3 * T[3 * t + 1], c = 3 * T[3 * t + 2];
      const ux = x[b] - x[a], uy = x[b + 1] - x[a + 1], uz = x[b + 2] - x[a + 2];
      const vx = x[c] - x[a], vy = x[c + 1] - x[a + 1], vz = x[c + 2] - x[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (let i = 0; i < 3; i++) { const q = 3 * C[3 * t + i]; N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
    }
    for (let i = 0; i < r.nR; i++) {
      const L = hypot3(N[3 * i], N[3 * i + 1], N[3 * i + 2]) || 1;
      N[3 * i] /= L; N[3 * i + 1] /= L; N[3 * i + 2] /= L;
    }
    const pr = this.w.presentation;
    if (pr && pr.update()) for (let i = 0; i < r.nR; i++) { pr.point(P, 3 * i, r.sheet[i]); pr.direction(N, 3 * i, r.sheet[i]); }
    if (own) { this._version = this.w.poseVersion; return this.out; }
    // a caller's buffers: the shared ones were not refreshed, so they no longer match any version
    if (P === this.positions || N === this.normals) this._version = -1;
    return { ...this.out, positions: P, normals: N };
  }

  /** @param {{positions?: Float32Array}} [out] write the segment ends here (3·2·count floats) instead of the shared buffer */
  creaseLines(out) {
    const own = !out || !out.positions;
    if (own && this._linesVersion === this.w.poseVersion) return this.lines;
    const x = this.w.x, S = this.segVerts, P = (out && out.positions) || this.lines.positions;
    for (let i = 0; i < S.length; i++) { const v = 3 * S[i]; P[3 * i] = x[v]; P[3 * i + 1] = x[v + 1]; P[3 * i + 2] = x[v + 2]; }
    const pr = this.w.presentation;
    if (pr && pr.update()) for (let i = 0; i < S.length; i++) pr.point(P, 3 * i, this.w.mesh.vSheet[S[i]]);
    if (own) { this._linesVersion = this.w.poseVersion; return this.lines; }
    return { ...this.lines, positions: P };
  }

  /** Möller–Trumbore against the simulation triangles. @param {number[]} o @param {number[]} d */
  pick(o, d) {
    const m = this.w.mesh, T = m.tris, pr = this.w.presentation;
    let x = this.w.x;
    if (pr && pr.update()) { // pick what render() shows (spec §5.16), in a reused scratch copy
      const X = this._pickX ?? (this._pickX = new Float64Array(x.length));
      X.set(x);
      x = X;
      for (let v = 0; v < m.nV; v++) pr.point(x, 3 * v, m.vSheet[v]);
    }
    let best = null, bestT = Infinity;
    for (let t = 0; t < m.nT; t++) {
      const a = 3 * T[3 * t], b = 3 * T[3 * t + 1], c = 3 * T[3 * t + 2];
      const e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
      const e2x = x[c] - x[a], e2y = x[c + 1] - x[a + 1], e2z = x[c + 2] - x[a + 2];
      const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x;
      const det = e1x * px + e1y * py + e1z * pz;
      if (Math.abs(det) < 1e-12) continue;
      const inv = 1 / det;
      const tx = o[0] - x[a], ty = o[1] - x[a + 1], tz = o[2] - x[a + 2];
      const u = (tx * px + ty * py + tz * pz) * inv;
      if (u < 0 || u > 1) continue;
      const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
      const v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
      if (v < 0 || u + v > 1) continue;
      const dist = (e2x * qx + e2y * qy + e2z * qz) * inv;
      if (dist > 1e-9 && dist < bestT) {
        bestT = dist;
        const wa = 1 - u - v;
        const corner = wa >= u && wa >= v ? T[3 * t] : u >= v ? T[3 * t + 1] : T[3 * t + 2];
        best = { vertex: corner, triangle: t, point: [o[0] + d[0] * dist, o[1] + d[1] * dist, o[2] + d[2] * dist], sheet: m.triSheet[t] };
      }
    }
    return best;
  }
}
