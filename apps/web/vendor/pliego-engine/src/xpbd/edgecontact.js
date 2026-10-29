// @ts-check
/**
 * Edge–face contact for interlocking slits (engine.md §3.4; backlog items 21/23: `tab-and-slot`).
 *
 * Vertex–triangle contact (contact.js) cannot hold two cards slotted into each other: the lips of
 * one card's slit lie in the other card's plane, so a lip vertex has no side, and the paper between
 * lip vertices can slide through. This narrow phase takes the **lip edges** (mesh boundary edges of
 * document edges whose name starts with `interlock`, spec §3 `pliego:edges_name`) against the
 * triangles of every other sheet:
 *
 * - the segment is clipped to the triangle's prism (the part whose projection falls inside the
 *   triangle); the signed distance is linear along it, so the deepest point is an end of the clip;
 * - each (lip, triangle) pair remembers its side. A lip that starts in the face's plane (|d| ≤ the
 *   contact distance) takes the side its own paper lies on (its triangle's centroid), so the two
 *   lips of a slit hold the other card between them; a lip that arrives from outside keeps the side
 *   it came from;
 * - the correction is frictionless, position level, along the face normal, shared by the two edge
 *   ends and the three triangle vertices by their weights (the same Gauss–Seidel form as contact.js).
 *
 * Opt-in by document: a document without `interlock` edge names builds no EdgeContact, so its
 * simulation is unchanged. Bounded: lips × candidate triangles is checked against EDGE_PAIR_LIMIT
 * at construction (World.warnings says when it is exceeded, and the contact is then off).
 */
import { hypot3 } from '../fastmath.js';

/** Largest lips × other-sheet triangles this narrow phase takes on (each pass is one sweep over them). */
export const EDGE_PAIR_LIMIT = 250000;

/** Edge-name prefix that opts a cut or boundary into edge–face contact. */
export const INTERLOCK_PREFIX = 'interlock';

export class EdgeContact {
  /** @param {any} w World (mesh, doc, x) */
  constructor(w) {
    const mesh = w.mesh, doc = w.doc, names = doc.edgeNames;
    /** @type {number[]} */
    const lips = [];
    for (let e = 0; e < mesh.nE; e++) {
      if (mesh.edgeTris[2 * e + 1] >= 0) continue;
      const d = mesh.edgeDoc[e];
      if (d < 0 || !names || typeof names[d] !== 'string' || !names[d].startsWith(INTERLOCK_PREFIX)) continue;
      lips.push(e);
    }
    this.mesh = mesh;
    this.lips = Int32Array.from(lips);
    /** lip vertices (vertex–triangle contact against other sheets is left to this narrow phase) */
    this.lipVert = new Uint8Array(mesh.nV);
    for (const e of lips) { this.lipVert[mesh.edges[2 * e]] = 1; this.lipVert[mesh.edges[2 * e + 1]] = 1; }
    let others = 0;
    for (const e of lips) { const s = mesh.vSheet[mesh.edges[2 * e]]; for (let t = 0; t < mesh.nT; t++) if (mesh.triSheet[t] !== s) others++; }
    this.pairs = others;
    this.enabled = lips.length > 0 && others <= EDGE_PAIR_LIMIT;
    this.tc = new Float64Array(mesh.nE);
    for (const e of lips) this.tc[e] = Math.max(doc.sheets[mesh.vSheet[mesh.edges[2 * e]]].derived.collision_thickness, 0.05);
    /** @type {Map<number, number>} memorised side per lip·nT + triangle */
    this.side = new Map();
    this.active = 0;
    this._n = new Float64Array(3 * mesh.nT);
  }

  /** Whether a document opts in (any edge named `interlock…`). @param {any} doc */
  static wanted(doc) {
    return Array.isArray(doc.edgeNames) && doc.edgeNames.some((/** @type {any} */ n) => typeof n === 'string' && n.startsWith(INTERLOCK_PREFIX));
  }

  /**
   * One Gauss–Seidel pass over every lip × other-sheet triangle. `xs` = positions at substep start.
   * @param {Float64Array} x @param {Float64Array} xs @param {Float64Array} w inverse masses
   * @returns {number} active contacts
   */
  project(x, xs, w) {
    if (!this.enabled) return 0;
    const m = this.mesh, T = m.tris, N = this._n;
    for (let t = 0; t < m.nT; t++) {
      const a = 3 * T[3 * t], b = 3 * T[3 * t + 1], c = 3 * T[3 * t + 2];
      const e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
      const e2x = x[c] - x[a], e2y = x[c + 1] - x[a + 1], e2z = x[c + 2] - x[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const L = hypot3(nx, ny, nz), il = L > 0 ? 1 / L : 0;
      N[3 * t] = nx * il; N[3 * t + 1] = ny * il; N[3 * t + 2] = nz * il;
    }
    let active = 0;
    const B = [0, 0, 0, 0, 0, 0]; // barycentrics of the projection at s = 0 and s = 1
    for (let li = 0; li < this.lips.length; li++) {
      const e = this.lips[li], p = m.edges[2 * e], q = m.edges[2 * e + 1], sp = m.vSheet[p], tc = this.tc[e];
      const own = m.edgeTris[2 * e];
      for (let t = 0; t < m.nT; t++) {
        if (m.triSheet[t] === sp) continue;
        const nx = N[3 * t], ny = N[3 * t + 1], nz = N[3 * t + 2];
        if (nx === 0 && ny === 0 && nz === 0) continue;
        const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
        const ax = x[3 * a], ay = x[3 * a + 1], az = x[3 * a + 2];
        const dp = (x[3 * p] - ax) * nx + (x[3 * p + 1] - ay) * ny + (x[3 * p + 2] - az) * nz;
        const dq = (x[3 * q] - ax) * nx + (x[3 * q + 1] - ay) * ny + (x[3 * q + 2] - az) * nz;
        if ((dp > 2 * tc && dq > 2 * tc) || (dp < -2 * tc && dq < -2 * tc)) continue;
        if (!bary(x, p, a, b, c, B, 0) || !bary(x, q, a, b, c, B, 3)) continue;
        // clip s ∈ [0, 1] to the prism: every barycentric (linear in s) ≥ −ε
        let s0 = 0, s1 = 1;
        for (let k = 0; k < 3 && s0 <= s1; k++) {
          const u0 = B[k] + 1e-3, u1 = B[3 + k] + 1e-3;
          if (u0 < 0 && u1 < 0) { s0 = 1; s1 = 0; break; }
          if (u0 < 0) s0 = Math.max(s0, u0 / (u0 - u1));
          else if (u1 < 0) s1 = Math.min(s1, u0 / (u0 - u1));
        }
        if (s0 > s1) continue;
        const key = li * m.nT + t;
        let side = this.side.get(key);
        if (side === undefined) {
          const sm = 0.5 * (s0 + s1);
          const xa = xs[3 * a], ya = xs[3 * a + 1], za = xs[3 * a + 2];
          const ds = ((1 - sm) * xs[3 * p] + sm * xs[3 * q] - xa) * nx + ((1 - sm) * xs[3 * p + 1] + sm * xs[3 * q + 1] - ya) * ny + ((1 - sm) * xs[3 * p + 2] + sm * xs[3 * q + 2] - za) * nz;
          if (Math.abs(ds) > tc) side = ds > 0 ? 1 : -1;
          else {
            // in the face's plane: the side the lip's own paper is on (its triangle's centroid)
            const o0 = 3 * T[3 * own], o1 = 3 * T[3 * own + 1], o2 = 3 * T[3 * own + 2];
            const dc = ((x[o0] + x[o1] + x[o2]) / 3 - ax) * nx + ((x[o0 + 1] + x[o1 + 1] + x[o2 + 1]) / 3 - ay) * ny + ((x[o0 + 2] + x[o1 + 2] + x[o2 + 2]) / 3 - az) * nz;
            side = dc >= 0 ? 1 : -1;
          }
          this.side.set(key, side);
        }
        // the deepest end of the clipped segment
        const d0 = (1 - s0) * dp + s0 * dq, d1 = (1 - s1) * dp + s1 * dq;
        const s = side * d0 <= side * d1 ? s0 : s1, d = side * d0 <= side * d1 ? d0 : d1;
        const C = side * d - tc;
        if (C >= 0) continue;
        active++;
        const ba = (1 - s) * B[0] + s * B[3], bb = (1 - s) * B[1] + s * B[4], bc = (1 - s) * B[2] + s * B[5];
        const wp = w[p] * (1 - s), wq = w[q] * s;
        const sumw = w[p] * (1 - s) * (1 - s) + w[q] * s * s + w[a] * ba * ba + w[b] * bb * bb + w[c] * bc * bc;
        if (!(sumw > 0)) continue;
        const lam = -C / sumw, gx = side * nx * lam, gy = side * ny * lam, gz = side * nz * lam;
        x[3 * p] += wp * gx; x[3 * p + 1] += wp * gy; x[3 * p + 2] += wp * gz;
        x[3 * q] += wq * gx; x[3 * q + 1] += wq * gy; x[3 * q + 2] += wq * gz;
        x[3 * a] -= w[a] * ba * gx; x[3 * a + 1] -= w[a] * ba * gy; x[3 * a + 2] -= w[a] * ba * gz;
        x[3 * b] -= w[b] * bb * gx; x[3 * b + 1] -= w[b] * bb * gy; x[3 * b + 2] -= w[b] * bb * gz;
        x[3 * c] -= w[c] * bc * gx; x[3 * c + 1] -= w[c] * bc * gy; x[3 * c + 2] -= w[c] * bc * gz;
      }
    }
    this.active = active;
    return active;
  }
}

/**
 * Barycentric weights of the projection of vertex v onto triangle (a, b, c), into out[o..o+2].
 * @param {Float64Array} x @param {number} v @param {number} a @param {number} b @param {number} c @param {number[]} out @param {number} o
 */
function bary(x, v, a, b, c, out, o) {
  const ax = x[3 * a], ay = x[3 * a + 1], az = x[3 * a + 2];
  const e1x = x[3 * b] - ax, e1y = x[3 * b + 1] - ay, e1z = x[3 * b + 2] - az;
  const e2x = x[3 * c] - ax, e2y = x[3 * c + 1] - ay, e2z = x[3 * c + 2] - az;
  const px = x[3 * v] - ax, py = x[3 * v + 1] - ay, pz = x[3 * v + 2] - az;
  const d11 = e1x * e1x + e1y * e1y + e1z * e1z, d12 = e1x * e2x + e1y * e2y + e1z * e2z, d22 = e2x * e2x + e2y * e2y + e2z * e2z;
  const p1 = px * e1x + py * e1y + pz * e1z, p2 = px * e2x + py * e2y + pz * e2z;
  const den = d11 * d22 - d12 * d12;
  if (!(den > 1e-12 * d11 * d22)) return false;
  const bb = (d22 * p1 - d12 * p2) / den, bc = (d11 * p2 - d12 * p1) / den;
  out[o] = 1 - bb - bc; out[o + 1] = bb; out[o + 2] = bc;
  return true;
}
