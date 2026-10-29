// @ts-check
/**
 * Signed dihedral angle of a hinge and its gradient.
 *
 * Hinge (p0, p1 | w0, w1): triangle (p0, p1, w0) and triangle (p1, p0, w1) are both
 * counter-clockwise in sheet-local coordinates, so for a flat sheet their normals point to the
 * front (+Y for an un-placed sheet). The angle
 *     θ = atan2(ê · (n1 × n0), n0 · n1),   ê = (p1 − p0)/|p1 − p0|
 * is valid on (−π, π] and follows the FOLD convention: **valley positive** (the wings rotate toward
 * the front side), mountain negative. Pinned by test `sign-convention`.
 *
 * Gradient: the closed form of Bridson, Marino & Fedkiw 2003 ("Simulation of clothing with folds
 * and wrinkles", §4) as restated in Ghassaei, Demaine & Gershenfeld 2018 ("Fast, interactive
 * origami simulation using GPU computation", OSME 7, eqs. 3–6; Origami Simulator, MIT licence,
 * © 2018 Amanda Ghassaei). Written from the equations, not copied code:
 *     ∂θ/∂w0 = |e| N0/|N0|²,   ∂θ/∂w1 = |e| N1/|N1|²   (valley-positive convention)
 *     ∂θ/∂p0, ∂θ/∂p1: projection-weighted combinations, so Σ ∂θ/∂x = 0.
 * with N0 = (p1 − p0) × (w0 − p0), N1 = (p0 − p1) × (w1 − p1) the unnormalised normals.
 * Checked against central finite differences by test `dihedral-gradient` (incl. θ ≈ ±179°).
 */

/**
 * Compute θ and (optionally) its 12-component gradient [p0, p1, w0, w1].
 * @param {Float64Array} x positions (xyz)
 * @param {number} p0 @param {number} p1 @param {number} w0 @param {number} w1
 * @param {Float64Array|null} g output gradient (12) or null
 * @returns {number} θ in (−π, π]
 */
export function dihedral(x, p0, p1, w0, w1, g) {
  const a = 3 * p0, b = 3 * p1, c = 3 * w0, d = 3 * w1;
  const ex = x[b] - x[a], ey = x[b + 1] - x[a + 1], ez = x[b + 2] - x[a + 2];
  // N0 = e × (w0 − p0)
  const ux = x[c] - x[a], uy = x[c + 1] - x[a + 1], uz = x[c + 2] - x[a + 2];
  const n0x = ey * uz - ez * uy, n0y = ez * ux - ex * uz, n0z = ex * uy - ey * ux;
  // N1 = (p0 − p1) × (w1 − p1) = −e × (w1 − p1)
  const vx = x[d] - x[b], vy = x[d + 1] - x[b + 1], vz = x[d + 2] - x[b + 2];
  const n1x = -(ey * vz - ez * vy), n1y = -(ez * vx - ex * vz), n1z = -(ex * vy - ey * vx);
  const L = Math.sqrt(ex * ex + ey * ey + ez * ez);
  const q0 = n0x * n0x + n0y * n0y + n0z * n0z, q1 = n1x * n1x + n1y * n1y + n1z * n1z;
  const s0 = 1 / Math.sqrt(q0), s1 = 1 / Math.sqrt(q1);
  // ê·(n1 × n0)
  const cx = n1y * n0z - n1z * n0y, cy = n1z * n0x - n1x * n0z, cz = n1x * n0y - n1y * n0x;
  const sinT = ((cx * ex + cy * ey + cz * ez) / L) * s0 * s1;
  const cosT = (n0x * n1x + n0y * n1y + n0z * n1z) * s0 * s1;
  const theta = Math.atan2(sinT, cosT);
  if (g) {
    const k0 = L / q0, k1 = L / q1;
    const gw0x = k0 * n0x, gw0y = k0 * n0y, gw0z = k0 * n0z;
    const gw1x = k1 * n1x, gw1y = k1 * n1y, gw1z = k1 * n1z;
    // projections of the wings on the edge, as fractions of |e|
    const L2 = L * L;
    const t0 = (ux * ex + uy * ey + uz * ez) / L2; // w0 relative to p0
    const t1 = ((x[d] - x[a]) * ex + (x[d + 1] - x[a + 1]) * ey + (x[d + 2] - x[a + 2]) * ez) / L2; // w1 relative to p0
    // ∂θ/∂p0 = (t0 − 1)·∂θ/∂w0 + (t1 − 1)·∂θ/∂w1 ; ∂θ/∂p1 = −t0·∂θ/∂w0 − t1·∂θ/∂w1
    g[0] = (t0 - 1) * gw0x + (t1 - 1) * gw1x;
    g[1] = (t0 - 1) * gw0y + (t1 - 1) * gw1y;
    g[2] = (t0 - 1) * gw0z + (t1 - 1) * gw1z;
    g[3] = -t0 * gw0x - t1 * gw1x;
    g[4] = -t0 * gw0y - t1 * gw1y;
    g[5] = -t0 * gw0z - t1 * gw1z;
    g[6] = gw0x; g[7] = gw0y; g[8] = gw0z;
    g[9] = gw1x; g[10] = gw1y; g[11] = gw1z;
  }
  return theta;
}
