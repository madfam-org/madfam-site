// @ts-check
/**
 * Step-gated joins (spec §5.19–§5.20): when a join holds, read from the fold program.
 *
 * - `active_from` (glue, pivot, string, pin): a step id or 0-based index. The join is inactive
 *   until that step has begun (sequence position p > k) and active from then on.
 * - step `release_joins` (§5.20): join ids the step unties. From the moment that step has begun
 *   (p > r) the join no longer holds; it stays released in later steps.
 * Scrubbing the program back re-applies the same rule (a join is a function of p).
 *
 * Shared by the engine (xpbd/gates.js) and mirrored by the studio's preview stub.
 */

/** Join types that may be step-gated. */
export const GATED_TYPES = new Set(['glue', 'pivot', 'string', 'pin']);

/**
 * Gate window of every gated join: `from` (step index; −1 = from the start) and `until` (step
 * index that releases it; Infinity = never). Joins without a gate are absent from the map.
 * @param {any} doc a loaded document, or raw JSON (`pliego:joins`, `pliego:sequence`)
 * @returns {Map<string, {from:number, until:number}>}
 */
export function joinGates(doc) {
  const joins = doc.joins ?? doc['pliego:joins'] ?? [];
  const seq = doc.sequence !== undefined ? doc.sequence : doc['pliego:sequence'];
  const steps = seq && Array.isArray(seq.steps) ? seq.steps : [];
  /** @type {Map<string, {from:number, until:number}>} */
  const out = new Map();
  for (const j of joins) {
    if (!j || j.active_from === undefined) continue;
    out.set(j.id, { from: stepIndex(steps, j.active_from), until: Infinity });
  }
  steps.forEach((/** @type {any} */ st, /** @type {number} */ r) => {
    for (const id of st.release_joins ?? []) {
      const g = out.get(id) ?? { from: -1, until: Infinity };
      if (r < g.until) g.until = r;
      out.set(id, g);
    }
  });
  return out;
}

/** Step index of an `active_from` reference (an index or a step id); −2 when it does not resolve. @param {any[]} steps @param {any} ref */
export function stepIndex(steps, ref) {
  if (Number.isInteger(ref)) return ref >= 0 && ref < steps.length ? ref : -2;
  if (typeof ref === 'string') { const k = steps.findIndex((st) => st && st.id === ref); return k >= 0 ? k : -2; }
  return -2;
}

/**
 * Does a gated join hold at sequence position p?
 * @param {{from:number, until:number}} g @param {number} p
 */
export function gateHolds(g, p) {
  return (g.from < 0 || p > g.from) && !(p > g.until);
}

/**
 * Rules 20 (and 21): `active_from` and `release_joins` are well formed. Appends problems to P.
 * @param {any[]} joins @param {any} seq @param {string[]} P
 */
export function checkJoinGates(joins, seq, P) {
  const steps = seq && Array.isArray(seq.steps) ? seq.steps : [];
  /** @type {Map<string, any>} */
  const byId = new Map();
  for (const j of joins) if (j && typeof j.id === 'string') byId.set(j.id, j);
  joins.forEach((j, i) => {
    if (!j || j.active_from === undefined) return;
    const w = `pliego:joins[${i}] (${j.id})`;
    if (!GATED_TYPES.has(j.type)) P.push(`rule 20: ${w} type ${j.type} cannot carry active_from`);
    else if (!steps.length) P.push(`rule 20: ${w}.active_from needs a pliego:sequence`);
    else if (stepIndex(steps, j.active_from) < 0) P.push(`rule 20: ${w}.active_from ${JSON.stringify(j.active_from)} is not a step id or index of the program`);
  });
  /** @type {Map<string, number>} */
  const released = new Map();
  steps.forEach((/** @type {any} */ st, /** @type {number} */ r) => {
    if (!st || st.release_joins === undefined) return;
    const w = `pliego:sequence.steps[${r}]`;
    if (!Array.isArray(st.release_joins)) { P.push(`rule 21: ${w}.release_joins must be an array of join ids`); return; }
    for (const id of st.release_joins) {
      const j = byId.get(id);
      if (!j) { P.push(`rule 21: ${w}.release_joins names ${JSON.stringify(id)}, which is not a join`); continue; }
      if (!GATED_TYPES.has(j.type)) { P.push(`rule 21: ${w}.release_joins: join ${id} is a ${j.type}, which cannot be released`); continue; }
      if (released.has(id)) { P.push(`rule 21: ${w}.release_joins: join ${id} is already released at step ${released.get(id)}`); continue; }
      released.set(id, r);
      if (j.active_from !== undefined) {
        const k = stepIndex(steps, j.active_from);
        if (k >= 0 && r <= k) P.push(`rule 21: ${w}.release_joins: join ${id} is released at or before the step that activates it (${k})`);
      }
    }
  });
}
