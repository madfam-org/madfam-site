// @ts-check
/**
 * Allocation-free `Math.hypot` for the solver's hot loops (lane E4, 2026-10-18).
 *
 * V8's `Math.hypot` is a builtin call that allocates a scratch array (and boxes its result) on every
 * call; the engine called it once per membrane edge in every stretch-guard pass, every gradient, the
 * broad phase and the diagnostics, so it was more than half of all the garbage a step made and the
 * slowest arithmetic in those loops. These functions do V8's exact computation (src/builtins/math.tq:
 * Infinity wins, then NaN, then 0; otherwise a Kahan sum of the squares normalised by the largest
 * magnitude, square-rooted and scaled back), so they return the same double, bit for bit, as V8's
 * `Math.hypot` with the same arguments (test `fastmath`), as plain arithmetic the JIT inlines. They
 * also make other JavaScript engines, whose `Math.hypot` rounds differently, replay V8's results.
 */

/** Same double as V8's Math.hypot(x, y). @param {number} x @param {number} y */
export function hypot2(x, y) {
  const ax = Math.abs(x), ay = Math.abs(y);
  let max = 0;
  if (ax > max) max = ax;
  if (ay > max) max = ay;
  if (max === Infinity) return Infinity;
  if (ax !== ax || ay !== ay) return NaN;
  if (max === 0) return 0;
  let sum = 0, comp = 0, n = ax / max, s = n * n - comp, p = sum + s;
  comp = (p - sum) - s; sum = p;
  n = ay / max; s = n * n - comp; p = sum + s; sum = p;
  return Math.sqrt(sum) * max;
}

/** Same double as V8's Math.hypot(x, y, z). @param {number} x @param {number} y @param {number} z */
export function hypot3(x, y, z) {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  let max = 0;
  if (ax > max) max = ax;
  if (ay > max) max = ay;
  if (az > max) max = az;
  if (max === Infinity) return Infinity;
  if (ax !== ax || ay !== ay || az !== az) return NaN;
  if (max === 0) return 0;
  let sum = 0, comp = 0, n = ax / max, s = n * n - comp, p = sum + s;
  comp = (p - sum) - s; sum = p;
  n = ay / max; s = n * n - comp; p = sum + s; comp = (p - sum) - s; sum = p;
  n = az / max; s = n * n - comp; p = sum + s; sum = p;
  return Math.sqrt(sum) * max;
}

/** Same double as V8's Math.hypot(x, y, z, w). @param {number} x @param {number} y @param {number} z @param {number} w */
export function hypot4(x, y, z, w) {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z), aw = Math.abs(w);
  let max = 0;
  if (ax > max) max = ax;
  if (ay > max) max = ay;
  if (az > max) max = az;
  if (aw > max) max = aw;
  if (max === Infinity) return Infinity;
  if (ax !== ax || ay !== ay || az !== az || aw !== aw) return NaN;
  if (max === 0) return 0;
  let sum = 0, comp = 0, n = ax / max, s = n * n - comp, p = sum + s;
  comp = (p - sum) - s; sum = p;
  n = ay / max; s = n * n - comp; p = sum + s; comp = (p - sum) - s; sum = p;
  n = az / max; s = n * n - comp; p = sum + s; comp = (p - sum) - s; sum = p;
  n = aw / max; s = n * n - comp; p = sum + s; sum = p;
  return Math.sqrt(sum) * max;
}
