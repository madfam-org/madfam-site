// @ts-check
/**
 * Spec §5.16 presentation in the engine's render output. A sheet's `presentation.end` is a rigid
 * transform blended in over the fold program — identity at sequence position 0, `end` at the last
 * step (rotation by slerp from identity, translation by lerp) — about the root face's t = 0
 * centroid. It changes no physics: positions(), stats() and contact stay in the simulation frame;
 * render(), creaseLines() and pick() are presented, and grab()/moveGrab() points are mapped back.
 * (`root_face` only matters to a rigid preview, which holds that face still; the physics engine
 * holds nothing still, so here it only fixes the centroid the rotation turns about.)
 */
import { hypot4 } from '../fastmath.js';

export class Presentation {
  /** @param {any} w World (mesh built) */
  constructor(w) {
    const doc = w.doc;
    this.w = w;
    /** per sheet: {rotation, origin, centroid} or null */
    this.ends = doc.sheets.map((/** @type {any} */ s, /** @type {number} */ si) => {
      const pr = s.presentation, end = pr && pr.end;
      if (!end) return null;
      let root = Number.isInteger(pr.root_face) && pr.root_face >= 0 && pr.root_face < doc.nF && doc.fSheet[pr.root_face] === si ? pr.root_face : -1;
      if (root < 0) for (let f = 0; f < doc.nF; f++) if (doc.fSheet[f] === si) { root = f; break; }
      const c = [0, 0, 0];
      const fv = doc.faces[root];
      for (const v of fv) { const m = w.mesh.docVertex[v]; for (let k = 0; k < 3; k++) c[k] += w.mesh.X0[3 * m + k] / fv.length; }
      return { rotation: end.rotation ?? [0, 0, 0, 1], origin: end.origin ?? [0, 0, 0], centroid: c };
    });
    this.active = this.ends.some((e) => e !== null);
    /** @type {({R:number[], t:number[]}|null)[]} */
    this.T = doc.sheets.map(() => null);
  }

  /** Recompute the per-sheet transforms at the current sequence position; false when all identity. */
  update() {
    if (!this.active) return false;
    const d = this.w.drivers, n = d.seq ? d.seq.steps.length : 0;
    const f = n ? Math.max(0, Math.min(1, d.seqPos / n)) : 0;
    let any = false;
    this.ends.forEach((e, s) => {
      if (!e || f === 0) { this.T[s] = null; return; }
      const R = quatToR(slerpFromIdentity(e.rotation, f)), c = e.centroid;
      const rc = [R[0] * c[0] + R[1] * c[1] + R[2] * c[2], R[3] * c[0] + R[4] * c[1] + R[5] * c[2], R[6] * c[0] + R[7] * c[1] + R[8] * c[2]];
      this.T[s] = { R, t: [c[0] + f * e.origin[0] - rc[0], c[1] + f * e.origin[1] - rc[1], c[2] + f * e.origin[2] - rc[2]] };
      any = true;
    });
    return any;
  }

  /** Present point p (xyz at o in P) of sheet s in place. @param {Float32Array|Float64Array|number[]} P @param {number} o @param {number} s */
  point(P, o, s) {
    const T = this.T[s];
    if (!T) return;
    const R = T.R, x = P[o], y = P[o + 1], z = P[o + 2];
    P[o] = R[0] * x + R[1] * y + R[2] * z + T.t[0];
    P[o + 1] = R[3] * x + R[4] * y + R[5] * z + T.t[1];
    P[o + 2] = R[6] * x + R[7] * y + R[8] * z + T.t[2];
  }

  /** Rotate direction (xyz at o in N) of sheet s in place. @param {Float32Array} N @param {number} o @param {number} s */
  direction(N, o, s) {
    const T = this.T[s];
    if (!T) return;
    const R = T.R, x = N[o], y = N[o + 1], z = N[o + 2];
    N[o] = R[0] * x + R[1] * y + R[2] * z; N[o + 1] = R[3] * x + R[4] * y + R[5] * z; N[o + 2] = R[6] * x + R[7] * y + R[8] * z;
  }

  /** A presented point of sheet s back in the simulation frame. @param {number[]} p @param {number} s */
  unpresent(p, s) {
    this.update();
    const T = this.T[s];
    if (!T) return p.slice(0, 3);
    const R = T.R, q = [p[0] - T.t[0], p[1] - T.t[1], p[2] - T.t[2]];
    return [R[0] * q[0] + R[3] * q[1] + R[6] * q[2], R[1] * q[0] + R[4] * q[1] + R[7] * q[2], R[2] * q[0] + R[5] * q[1] + R[8] * q[2]];
  }
}

/** Rotation `q` (unit quaternion [x, y, z, w]) scaled to fraction `f` of its angle. @param {number[]} q @param {number} f */
export function slerpFromIdentity(q, f) {
  const L = hypot4(q[0], q[1], q[2], q[3]) || 1;
  let x = q[0] / L, y = q[1] / L, z = q[2] / L, s = q[3] / L;
  if (s < 0) { x = -x; y = -y; z = -z; s = -s; }
  const half = Math.acos(Math.min(1, s)), sh = Math.sin(half);
  if (sh < 1e-12) return [0, 0, 0, 1];
  const k = Math.sin(f * half) / sh;
  return [x * k, y * k, z * k, Math.cos(f * half)];
}

/** Row-major rotation matrix of a unit quaternion [x, y, z, w]. @param {number[]} q */
function quatToR([x, y, z, w]) {
  return [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
}
