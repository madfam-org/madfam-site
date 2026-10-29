// @ts-check
/**
 * Keyed mechanisms (spec §5.18). A mechanism may carry `keys`, a table of [control value, output]
 * pairs: the output is linear between keys and held at the end values outside them. With
 * `period`, the control value is first wrapped into [c₀, c₀ + period) and the segment after the
 * last key runs back to the first key's output, so a cam or a crank-rocker repeats every turn.
 * The output replaces the control value in the mechanism's own formula: the effective hinge
 * angle (rotation = output − rest), the rotate or leaf angle, the translate displacement (mm) or
 * the slide position along the track (mm).
 *
 * `ride` (hinge, rotate, translate) names another hinge, rotate or translate mechanism whose
 * motion carries this one: the transform is T_ride ∘ T_own, both evaluated at the same moment.
 * A coupler is a `rotate` about its crank pin riding the crank, keyed by the coupler angle minus
 * the crank angle, so one control moves a whole four-bar exactly.
 *
 * Pure functions shared by the engine (drivers.js) and mirrored by the studio's preview stub.
 */

/** Mechanism types that may carry `keys`. */
export const KEYED_TYPES = new Set(['hinge', 'rotate', 'translate', 'slide', 'leaf']);
/** Mechanism types that may ride another mechanism, and be ridden. */
export const RIDE_TYPES = new Set(['hinge', 'rotate', 'translate']);

/**
 * Output of a mechanism at control value `v` (the value itself when the mechanism has no keys).
 * @param {{keys?: number[][], period?: number}} m @param {number} v
 */
export function keyedOutput(m, v) {
  const K = m.keys;
  if (!K || !K.length) return v;
  const n = K.length, c0 = K[0][0];
  if (m.period) {
    const P = m.period;
    let u = (v - c0) % P;
    if (u < 0) u += P;
    u += c0;
    const cl = K[n - 1][0];
    if (u >= cl) {
      const span = c0 + P - cl;
      return span > 0 ? K[n - 1][1] + ((u - cl) / span) * (K[0][1] - K[n - 1][1]) : K[n - 1][1];
    }
    return interp(K, u);
  }
  if (v <= c0) return K[0][1];
  if (v >= K[n - 1][0]) return K[n - 1][1];
  return interp(K, v);
}

/** Linear interpolation inside the table (c₀ ≤ u < c_last). @param {number[][]} K @param {number} u */
function interp(K, u) {
  let lo = 0, hi = K.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (K[mid][0] <= u) lo = mid; else hi = mid; }
  const [ca, ya] = K[lo], [cb, yb] = K[hi];
  return ya + ((u - ca) / (cb - ca)) * (yb - ya);
}

/** @param {any} v */ const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Rule 19: `keys`, `period` and `ride` are well formed. Appends problems to P.
 * @param {any[]} mechanisms @param {string[]} P
 */
export function checkKeyedMechanisms(mechanisms, P) {
  /** @type {Map<string, any>} */
  const byId = new Map();
  for (const m of mechanisms) if (m && typeof m.id === 'string') byId.set(m.id, m);
  mechanisms.forEach((m, i) => {
    if (!m || typeof m !== 'object') return;
    const w = `pliego:mechanisms[${i}] (${m.id})`;
    if (m.keys !== undefined) {
      if (!KEYED_TYPES.has(m.type)) P.push(`rule 19: ${w} type ${m.type} cannot carry keys`);
      else if (!Array.isArray(m.keys) || m.keys.length < 2 || !m.keys.every((/** @type {any} */ k) => Array.isArray(k) && k.length === 2 && isNum(k[0]) && isNum(k[1]))) {
        P.push(`rule 19: ${w}.keys must list ≥ 2 [control value, output] number pairs`);
      } else {
        for (let k = 1; k < m.keys.length; k++) if (!(m.keys[k][0] > m.keys[k - 1][0])) { P.push(`rule 19: ${w}.keys control values must increase strictly (key ${k})`); break; }
        if ((m.type === 'translate' || m.type === 'slide') && isNum(m.travel)) {
          const lo = m.type === 'slide' ? 0 : -m.travel;
          for (const [, y] of m.keys) if (y < lo - 1e-9 || y > m.travel + 1e-9) { P.push(`rule 19: ${w}.keys output ${y} mm is outside [${lo}, ${m.travel}]`); break; }
        }
      }
    }
    if (m.period !== undefined) {
      if (!Array.isArray(m.keys)) P.push(`rule 19: ${w}.period needs keys`);
      else if (!isNum(m.period) || m.period <= 0) P.push(`rule 19: ${w}.period must be > 0`);
      else if (m.keys.length >= 2 && isNum(m.keys[0][0]) && isNum(m.keys[m.keys.length - 1][0]) && m.keys[m.keys.length - 1][0] - m.keys[0][0] > m.period + 1e-9) P.push(`rule 19: ${w}.keys span more than one period`);
    }
    if (m.ride !== undefined) {
      const r = byId.get(m.ride);
      if (!RIDE_TYPES.has(m.type)) P.push(`rule 19: ${w} type ${m.type} cannot ride another mechanism`);
      else if (!r || !RIDE_TYPES.has(r.type)) P.push(`rule 19: ${w}.ride ${JSON.stringify(m.ride)} is not a hinge, rotate or translate mechanism`);
      else {
        // acyclic: follow the chain
        const seen = new Set([m.id]);
        for (let q = r; q; q = q.ride !== undefined ? byId.get(q.ride) : null) {
          if (seen.has(q.id)) { P.push(`rule 19: ${w}.ride forms a cycle`); break; }
          seen.add(q.id);
        }
      }
    }
  });
}
