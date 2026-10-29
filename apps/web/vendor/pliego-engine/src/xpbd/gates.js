// @ts-check
/**
 * Runtime of step-gated joins (spec §5.19, src/gates.js). Each substep, after the drivers have
 * moved the sequence position, every gated join is switched on or off by the gate rule. A join
 * that switches on is created **from the current geometry**:
 *
 * - glue and pivot: snap onto the authored point, or weld where the paper lies on its zone, or
 *   do not take hold when the paper is off its zone (see `weld`);
 * - string: holds from now on (slack or taut, as the geometry is);
 * - pin: a stiff anchor at the point's position (or its `world` target when within the snap
 *   distance); with a `translate` mechanism the anchor follows the mechanism's motion since
 *   activation.
 * Snap distance: max(1 mm, 4 × the larger collision_thickness of the joined sheets).
 * Switching changes the stiffness set, so the World refactorises; contact exclusion around active
 * welds follows the gates.
 */
import { joinGates, gateHolds } from '../gates.js';
import { TK_GLUE, TK_PIVOT, TK_STRING, TK_ANCHOR, triNormal } from './joins.js';
import { mat3Vec } from '../geom.js';

const SNAP_MIN = 1, SNAP_FACTOR = 4;

export class JoinGates {
  /**
   * @param {any} w World (terms finished, drivers built)
   */
  constructor(w) {
    const doc = w.doc, T = w.terms;
    const gates = joinGates(doc);
    /** @type {{id:string, join:any, gate:{from:number, until:number}, terms:number[], snap:number, on:boolean}[]} */
    this.list = [];
    /** @type {Map<string, number[]>} */
    const termsOf = new Map();
    for (let t = 0; t < T.count; t++) {
      const id = T.info[t].join;
      if (id === undefined || !gates.has(id)) continue;
      let l = termsOf.get(id);
      if (!l) { l = []; termsOf.set(id, l); }
      l.push(t);
    }
    const ct = (/** @type {string|undefined} */ sid) => (sid === undefined ? 0 : doc.sheets[/** @type {number} */(doc.sheetIndex.get(sid))].derived.collision_thickness);
    for (const j of doc.joins) {
      const g = gates.get(j.id);
      if (!g) continue;
      const snap = Math.max(SNAP_MIN, SNAP_FACTOR * Math.max(ct(j.a && j.a.sheet), ct(j.b && j.b.sheet)));
      this.list.push({ id: j.id, join: j, gate: g, terms: termsOf.get(j.id) ?? [], snap, on: false });
    }
    if (!T.gateOff) T.gateOff = new Uint8Array(T.count);
    for (const gj of this.list) for (const t of gj.terms) { T.gateOff[t] = 1; T.active[t] = 0; }
    /** per-vertex weld sheet of the welds that always hold (contact exclusion base) */
    this.baseWeld = Int32Array.from(w.weldSheet);
  }

  get count() { return this.list.length; }

  /**
   * Apply the gate rule at the current sequence position. Returns true when the stiffness set changed.
   * @param {any} w World
   */
  update(w) {
    if (!this.list.length) return false;
    const p = w.drivers.seqPos;
    let changed = false, welds = false;
    for (const gj of this.list) {
      const want = gateHolds(gj.gate, p);
      if (want === gj.on) continue;
      gj.on = want;
      changed = true;
      if (gj.join.type === 'glue') welds = true;
      if (want) this.activate(w, gj); else this.deactivate(w, gj);
    }
    if (welds && w.contact) w.contact.setWeldExclusion(this.weldSheet(w));
    return changed;
  }

  /** Per-vertex weld sheet: the always-on welds plus the active gated glue. @param {any} w */
  weldSheet(w) {
    const out = Int32Array.from(this.baseWeld), T = w.terms;
    for (const gj of this.list) {
      if (!gj.on || gj.join.type !== 'glue') continue;
      const sb = /** @type {number} */(w.doc.sheetIndex.get(gj.join.b.sheet));
      // the a side of a weld: one mesh vertex, or a triangle for a sampled weld (all but b's last three)
      for (const t of gj.terms) for (let i = T.start[t]; i < T.start[t + 1] - 3; i++) out[T.verts[i]] = sb;
    }
    return out;
  }

  /** @param {any} w @param {any} gj */
  activate(w, gj) {
    const T = w.terms, x = w.x;
    const r = [0, 0, 0];
    for (const t of gj.terms) {
      const inf = T.info[t];
      T.gateOff[t] = 0;
      if (inf.kind !== TK_STRING) T.active[t] = 1; // strings switch on by tautness (World._checkStrings)
      if (inf.kind === TK_GLUE || inf.kind === TK_PIVOT) {
        this.weld(w, gj, t, r);
      } else if (inf.kind === TK_ANCHOR) {
        const v = T.verts[T.start[t]];
        const here = [x[3 * v], x[3 * v + 1], x[3 * v + 2]];
        let tgt = here;
        if (inf.world) {
          // the lead vertex (the pin point, or the first vertex along the line) goes to `world`
          // when it is within the snap distance; every vertex of the pin shifts with it
          const lv = 3 * inf.leadV;
          const dn = [inf.world[0] - x[lv], inf.world[1] - x[lv + 1], inf.world[2] - x[lv + 2]];
          if (Math.hypot(dn[0], dn[1], dn[2]) <= gj.snap) tgt = [here[0] + dn[0], here[1] + dn[1], here[2] + dn[2]];
        }
        inf.held = tgt.slice();
        inf.target = tgt.slice();
        inf.since = inf.mechanism ? w.drivers.transformOf(w, inf.mechanism, new Map()) : null;
      }
    }
    w.dirty = true;
  }

  /**
   * Create a weld term (glue or pivot) from the current geometry. r = a-point − b-point; n is b's
   * normal there, γ = r·n the gap across b and d = r − γn the slide along it.
   * - |r| (glue) or |d| (pivot) within the snap distance: snap onto the authored point;
   * - else, |γ| within the snap distance (the tab lies on b, slid along it): weld where it lies —
   *   the b-side barycentric weights are re-expressed at the projection on b's triangle plane
   *   (linear in the positions, so the implicit step stays consistent);
   * - else the paper does not touch its zone: the weld does not take hold (`unheld`, counted in
   *   World.stats().unheldWelds) until the join switches off and on again.
   * Glue closes the gap across b; a pivot keeps it (two layers riveted).
   * @param {any} w @param {any} gj @param {number} t @param {number[]} r scratch
   */
  weld(w, gj, t, r) {
    const T = w.terms, x = w.x, inf = T.info[t];
    const s0 = T.start[t], s1 = T.start[t + 1], nb = 3; // b's triangle: the term's last three vertices
    if (!inf.coef0) inf.coef0 = Array.from(T.coef.subarray(s0, s1));
    for (let i = s0; i < s1; i++) T.coef[i] = inf.coef0[i - s0];
    residual(T, t, x, r);
    const n = triNormal(w.mesh, x, inf.tri);
    const g = r[0] * n[0] + r[1] * n[1] + r[2] * n[2];
    const d = [r[0] - g * n[0], r[1] - g * n[1], r[2] - g * n[2]];
    const glue = inf.kind === TK_GLUE;
    inf.unheld = false;
    inf.offset = glue ? 0 : g;
    if ((glue ? Math.hypot(r[0], r[1], r[2]) : Math.hypot(d[0], d[1], d[2])) <= gj.snap) return;
    if (Math.abs(g) > gj.snap) { inf.unheld = true; T.active[t] = 0; return; }
    // the projection q = (b-point) + d, in barycentric weights of b's triangle (may lie outside it)
    const vb = [T.verts[s1 - 3], T.verts[s1 - 2], T.verts[s1 - 1]];
    const wb = [-T.coef[s1 - 3], -T.coef[s1 - 2], -T.coef[s1 - 1]];
    const P = (/** @type {number} */ k, /** @type {number} */ c) => x[3 * vb[k] + c];
    const q = [0, 1, 2].map((c) => wb[0] * P(0, c) + wb[1] * P(1, c) + wb[2] * P(2, c) + d[c]);
    const e1 = [0, 1, 2].map((c) => P(1, c) - P(0, c)), e2 = [0, 1, 2].map((c) => P(2, c) - P(0, c)), pq = [0, 1, 2].map((c) => q[c] - P(0, c));
    const d11 = dot3(e1, e1), d12 = dot3(e1, e2), d22 = dot3(e2, e2), p1 = dot3(pq, e1), p2 = dot3(pq, e2);
    const den = d11 * d22 - d12 * d12;
    if (!(den > 0)) { inf.unheld = true; T.active[t] = 0; return; }
    const b1 = (d22 * p1 - d12 * p2) / den, b2 = (d11 * p2 - d12 * p1) / den;
    T.coef[s1 - 3] = -(1 - b1 - b2); T.coef[s1 - 2] = -b1; T.coef[s1 - 1] = -b2;
    inf.slid = true;
    void nb;
  }

  /** @param {any} w @param {any} gj */
  deactivate(w, gj) {
    const T = w.terms;
    for (const t of gj.terms) {
      T.gateOff[t] = 1; T.active[t] = 0;
      const inf = T.info[t];
      if (inf.coef0) for (let i = T.start[t]; i < T.start[t + 1]; i++) T.coef[i] = inf.coef0[i - T.start[t]];
      inf.unheld = false; inf.slid = false;
    }
    w.dirty = true;
  }

  /** Weld points of holding gated joins that could not take hold (paper off its zone). @param {any} w */
  unheld(w) {
    let n = 0;
    for (const gj of this.list) if (gj.on) for (const t of gj.terms) if (w.terms.info[t].unheld) n++;
    return n;
  }

  /**
   * Per substep: active anchors with a mechanism follow it (target = T_now · T_since⁻¹ · held).
   * @param {any} w
   */
  follow(w) {
    const T = w.terms;
    /** @type {Map<string, any>} */
    const memo = new Map();
    for (const gj of this.list) {
      if (!gj.on || gj.join.type !== 'pin' || !gj.join.mechanism) continue;
      for (const t of gj.terms) {
        const inf = T.info[t];
        if (!inf.since) continue;
        const now = w.drivers.transformOf(w, inf.mechanism, memo);
        const h = inf.held, s = inf.since;
        let q = [h[0] - s.T[0], h[1] - s.T[1], h[2] - s.T[2]];
        if (s.R) q = mat3Vec(transpose(s.R), q);
        if (now.R) q = mat3Vec(now.R, q);
        inf.target[0] = q[0] + now.T[0]; inf.target[1] = q[1] + now.T[1]; inf.target[2] = q[2] + now.T[2];
      }
    }
  }

  /** Gate state for snapshots. */
  state() { return this.list.map((gj) => gj.on); }

  /** @param {any} w @param {boolean[]} s */
  restore(w, s) {
    this.list.forEach((gj, i) => { gj.on = !!s[i]; });
    if (w.contact) w.contact.setWeldExclusion(this.weldSheet(w));
  }
}

/** r = Σ coef·x (term residual without its constant). @param {any} T @param {number} t @param {Float64Array} x @param {number[]} r */
function residual(T, t, x, r) {
  r[0] = 0; r[1] = 0; r[2] = 0;
  for (let i = T.start[t]; i < T.start[t + 1]; i++) { const v = 3 * T.verts[i], c = T.coef[i]; r[0] += c * x[v]; r[1] += c * x[v + 1]; r[2] += c * x[v + 2]; }
}

/** @param {number[]} a @param {number[]} b */
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
/** @param {number[]} R */
function transpose(R) { return [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]; }
