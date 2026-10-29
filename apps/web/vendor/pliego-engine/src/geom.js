// @ts-check
/** Small geometry helpers shared by the loader, mesher and solver. Plain numbers, no allocation in hot paths. */

/** Signed area of a 2-D polygon given as flat [x0,y0,x1,y1,…] or [[x,y],…]. CCW positive.
 * @param {ArrayLike<number>|number[][]} poly */
export function polygonArea(poly) {
  const P = toFlat(poly);
  let a = 0;
  const n = P.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) a += P[2 * j] * P[2 * i + 1] - P[2 * i] * P[2 * j + 1];
  return a / 2;
}

/** @param {ArrayLike<number>|number[][]} poly @returns {number[]} */
export function toFlat(poly) {
  if (poly.length && Array.isArray(/** @type {any} */(poly)[0])) {
    /** @type {number[]} */
    const out = [];
    for (const p of /** @type {number[][]} */(poly)) out.push(p[0], p[1]);
    return out;
  }
  return Array.from(/** @type {ArrayLike<number>} */(poly));
}

/** Point in polygon (even-odd), boundary counts as inside within eps.
 * @param {number} x @param {number} y @param {number[]} P flat polygon @param {number} [eps] */
export function pointInPolygon(x, y, P, eps = 1e-9) {
  const n = P.length / 2;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = P[2 * i], yi = P[2 * i + 1], xj = P[2 * j], yj = P[2 * j + 1];
    if (distPointSeg(x, y, xi, yi, xj, yj) <= eps) return true;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Distance from point to segment. @param {number} px @param {number} py @param {number} ax @param {number} ay @param {number} bx @param {number} by */
export function distPointSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const L2 = dx * dx + dy * dy;
  let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/** Orientation of (a, b, c): >0 CCW. */
export function orient(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

/** Proper or touching intersection of open segments ab and cd (excluding shared endpoints). */
export function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy, eps = 1e-9) {
  const d1 = orient(cx, cy, dx, dy, ax, ay), d2 = orient(cx, cy, dx, dy, bx, by);
  const d3 = orient(ax, ay, bx, by, cx, cy), d4 = orient(ax, ay, bx, by, dx, dy);
  const s = Math.max(Math.hypot(bx - ax, by - ay), Math.hypot(dx - cx, dy - cy), 1);
  const e = eps * s * s;
  return ((d1 > e && d2 < -e) || (d1 < -e && d2 > e)) && ((d3 > e && d4 < -e) || (d3 < -e && d4 > e));
}

/** Is the polygon simple (no two non-adjacent edges cross)? O(n²). @param {number[]} P flat */
export function polygonIsSimple(P) {
  const n = P.length / 2;
  for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n;
    for (let j = i + 1; j < n; j++) {
      const j2 = (j + 1) % n;
      if (j === i2 || j2 === i) continue;
      if (segmentsCross(P[2 * i], P[2 * i + 1], P[2 * i2], P[2 * i2 + 1], P[2 * j], P[2 * j + 1], P[2 * j2], P[2 * j2 + 1])) return false;
    }
  }
  return true;
}

/** Rotate vector v by unit quaternion q = [x,y,z,w]. @param {number[]} q @param {number[]} v @returns {number[]} */
export function quatRotate(q, v) {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  // t = 2 q × v
  const tx = 2 * (qy * vz - qz * vy), ty = 2 * (qz * vx - qx * vz), tz = 2 * (qx * vy - qy * vx);
  return [vx + qw * tx + (qy * tz - qz * ty), vy + qw * ty + (qz * tx - qx * tz), vz + qw * tz + (qx * ty - qy * tx)];
}

/** Rotation matrix (row-major 3×3) about unit axis by angle (Rodrigues). @param {number[]} a @param {number} ang */
export function axisAngleMatrix(a, ang) {
  const L = Math.hypot(a[0], a[1], a[2]);
  const x = a[0] / L, y = a[1] / L, z = a[2] / L;
  const c = Math.cos(ang), s = Math.sin(ang), C = 1 - c;
  return [
    c + x * x * C, x * y * C - z * s, x * z * C + y * s,
    y * x * C + z * s, c + y * y * C, y * z * C - x * s,
    z * x * C - y * s, z * y * C + x * s, c + z * z * C,
  ];
}

/** @param {number[]} R row-major 3×3 @param {number[]} v */
export function mat3Vec(R, v) {
  return [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
}

/** @param {number[]} A @param {number[]} B row-major 3×3 product A·B */
export function mat3Mul(A, B) {
  const o = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[3 * i + j] = A[3 * i] * B[j] + A[3 * i + 1] * B[3 + j] + A[3 * i + 2] * B[6 + j];
  return o;
}

/** Deterministic PRNG (mulberry32). @param {number} seed @returns {() => number} in [0, 1) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wrap angle to (−π, π]. @param {number} a */
export function wrapPi(a) {
  const TWO_PI = 2 * Math.PI;
  a = a % TWO_PI;
  if (a <= -Math.PI) a += TWO_PI;
  else if (a > Math.PI) a -= TWO_PI;
  return a;
}

export const DEG = Math.PI / 180;
