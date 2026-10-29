// @ts-check
/**
 * Joins (spec §5.3) resolved against the simulation mesh. Points are sheet-local; each is located
 * on the mesh (triangle + barycentric weights), so joins do not depend on mesh resolution.
 *
 * - glue: every mesh vertex of sheet a inside `region` is welded to the mapped point on sheet b
 *   (zero offset; `side` only tells the renderer which face of b the tab lies on).
 * - pivot: the two points coincide (offset kept along b's normal as at t = 0: two layers).
 * - string: unilateral |p_a − p_b| ≤ length.
 * - slider: the point stays on the track line (0 ≤ s ≤ |track| enforced by projection); driven by a
 *   `slide` mechanism it is welded to the track point at s.
 * - pin: Dirichlet (the vertices are fixed; `world: null` = where they start); a `translate`
 *   mechanism moves them.
 * All of these become point terms of the implicit block (stiffness HARD_FACTOR × stiffest membrane
 * spring) plus, for pins, fixed vertices. A step-gated pin (spec §5.19) is a stiff anchor term per
 * vertex instead, so it can switch on and off without changing the free-vertex set; gated glue
 * does not mark its vertices welded until it holds (see gates.js).
 */
import { locatePoint } from '../mesh.js';
import { pointInPolygon, distPointSeg } from '../geom.js';
import { TERM_FULL, TERM_PERP, TERM_STRING } from './implicit.js';
import { joinGates } from '../gates.js';
import { hypot3 } from '../fastmath.js';

export const TK_GLUE = 1, TK_PIVOT = 2, TK_STRING = 3, TK_SLIDER = 4, TK_GRAB = 5, TK_DRIVE = 6, TK_PERF = 7, TK_ANCHOR = 8;

/** Growable list of point terms, frozen into typed arrays by `finish()`. */
export class TermList {
  constructor() {
    /** @type {number[]} */ this._start = [0];
    /** @type {number[]} */ this._verts = [];
    /** @type {number[]} */ this._coef = [];
    /** @type {any[]} */ this.info = [];
  }
  /**
   * @param {number} kind @param {number} mode @param {number[]} verts @param {number[]} coef @param {any} info
   * @returns {number} term index
   */
  add(kind, mode, verts, coef, info) {
    this._verts.push(...verts); this._coef.push(...coef); this._start.push(this._verts.length);
    this.info.push({ kind, mode, ...info });
    return this.info.length - 1;
  }
  finish() {
    const n = this.info.length;
    return {
      count: n,
      start: Int32Array.from(this._start), verts: Int32Array.from(this._verts), coef: Float64Array.from(this._coef),
      c: new Float64Array(3 * n), dir: new Float64Array(3 * n), k: new Float64Array(n), len: new Float64Array(n),
      mode: Uint8Array.from(this.info.map((i) => i.mode)), kind: Uint8Array.from(this.info.map((i) => i.kind)),
      active: new Uint8Array(n).fill(1), info: this.info,
    };
  }
}

/**
 * Resolve the document's joins. Returns terms, pinned vertex groups and per-vertex weld sheet.
 * @param {any} doc @param {import('../mesh.js').Mesh} mesh @param {number} kHard
 * @param {{glueSamples?: boolean}} [opts] glueSamples: weld sample points of glue zones that hold fewer than three mesh vertices
 */
export function resolveJoins(doc, mesh, kHard, opts = {}) {
  const terms = new TermList();
  /** @type {{verts:number[], world:number[]|null, mechanism:string|null, id:string}[]} */
  const pins = [];
  /** @type {string[]} */
  const warnings = [];
  const weldSheet = new Int32Array(mesh.nV).fill(-1);
  const si = (/** @type {string} */ id) => /** @type {number} */(doc.sheetIndex.get(id));
  const gated = joinGates(doc);
  const loc = (/** @type {number} */ s, /** @type {number[]} */ p, /** @type {string} */ what) => {
    const r = locatePoint(mesh, s, p[0], p[1]) ?? snapPoint(mesh, s, p[0], p[1], Math.max(doc.sheets[s].derived.collision_thickness, 1e-3 * mesh.h));
    if (!r) throw new Error(`join ${what}: point (${p[0]}, ${p[1]}) not on the mesh of sheet ${doc.sheets[s].id}`);
    return r;
  };
  for (const j of doc.joins) {
    if (j.type === 'glue') {
      const sa = si(j.a.sheet), sb = si(j.b.sheet);
      const reg = j.a.region.flatMap((/** @type {number[]} */ p) => p);
      const [ma, mb, mc, md, tx, ty] = j.map;
      // the weld point is on b's surface (zero offset): a thickness offset applied along b's normal
      // breaks the zero-thickness linkage at hinges between glued panels (measured: 8 % local strain
      // at a V-fold vertex). Contact between the tab and b is skipped; `side` is a render hint.
      const off = 0;
      // a region may cover an opening of sheet b (a lining behind a façade with windows): glue over
      // an opening holds nothing, so a weld point whose image is off b's paper (beyond the snap
      // tolerance) is skipped and World.warnings says how many. A glue that welds nothing fails.
      const tol = Math.max(doc.sheets[sb].derived.collision_thickness, 1e-3 * mesh.h);
      let welded = 0, open = 0;
      for (let v = 0; v < mesh.nV; v++) {
        if (mesh.vSheet[v] !== sa) continue;
        const u = mesh.uv[2 * v], w = mesh.uv[2 * v + 1];
        if (!pointInPolygon(u, w, reg, 1e-6)) continue;
        const r = locatePoint(mesh, sb, ma * u + mb * w + tx, mc * u + md * w + ty) ?? snapPoint(mesh, sb, ma * u + mb * w + tx, mc * u + md * w + ty, tol);
        if (!r) { open++; continue; }
        welded++;
        terms.add(TK_GLUE, TERM_FULL, [v, ...r.verts], [1, -r.w[0], -r.w[1], -r.w[2]], { join: j.id, tri: r.tri, offset: off, k: kHard });
        if (!gated.has(j.id)) weldSheet[v] = sb;
      }
      // a glue zone narrower than the mesh (a 5 mm tab on a 10 mm mesh) holds fewer than three mesh
      // vertices, often none: it would hold nothing, or turn like a pivot. Weld sample points of the
      // zone instead, each a point of a's triangle (barycentric) on the mapped point of b, so the glue
      // holds at every mesh size (backlog item 20, glue zones as welds).
      const few = welded < 3;
      if (few && !opts.glueSamples) warnings.push(`join ${j.id}: the glue zone holds ${welded} mesh point(s) of sheet ${doc.sheets[sa].id} at this mesh size (glueSamples welds sample points instead)`);
      if (few && opts.glueSamples) {
        for (const [u, w] of glueSamples(j.a.region, mesh.h)) {
          const ra = locatePoint(mesh, sa, u, w) ?? snapPoint(mesh, sa, u, w, Math.max(doc.sheets[sa].derived.collision_thickness, 1e-3 * mesh.h));
          if (!ra) continue;
          const r = locatePoint(mesh, sb, ma * u + mb * w + tx, mc * u + md * w + ty) ?? snapPoint(mesh, sb, ma * u + mb * w + tx, mc * u + md * w + ty, tol);
          if (!r) { open++; continue; }
          welded++;
          terms.add(TK_GLUE, TERM_FULL, [...ra.verts, ...r.verts], [...ra.w, -r.w[0], -r.w[1], -r.w[2]], { join: j.id, tri: r.tri, offset: off, k: kHard, sampled: true });
          if (!gated.has(j.id)) for (const q of ra.verts) weldSheet[q] = sb;
        }
      }
      if (!welded && open) throw new Error(`join ${j.id}: no point of the glue region lands on the paper of sheet ${doc.sheets[sb].id}`);
      if (!welded && opts.glueSamples) warnings.push(`join ${j.id}: the glue region is not on the paper of sheet ${doc.sheets[sa].id} and holds nothing`);
      if (open) warnings.push(`join ${j.id}: ${open} of ${open + welded} weld points land on an opening of sheet ${doc.sheets[sb].id} and hold nothing`);
    } else if (j.type === 'pivot') {
      const ra = loc(si(j.a.sheet), j.a.at, j.id), rb = loc(si(j.b.sheet), j.b.at, j.id);
      terms.add(TK_PIVOT, TERM_FULL, [...ra.verts, ...rb.verts], [...ra.w, ...rb.w.map((x) => -x)], { join: j.id, tri: rb.tri, offset: null, k: kHard });
    } else if (j.type === 'string') {
      const ra = loc(si(j.a.sheet), j.a.at, j.id);
      if (j.b.world !== undefined) terms.add(TK_STRING, TERM_STRING, ra.verts, ra.w, { join: j.id, world: j.b.world.slice(), len: j.length, k: kHard });
      else {
        const rb = loc(si(j.b.sheet), j.b.at, j.id);
        terms.add(TK_STRING, TERM_STRING, [...ra.verts, ...rb.verts], [...ra.w, ...rb.w.map((x) => -x)], { join: j.id, world: null, len: j.length, k: kHard });
      }
    } else if (j.type === 'slider') {
      const ra = loc(si(j.a.sheet), j.a.at, j.id);
      const st = si(j.track.sheet);
      const rf = loc(st, j.track.from, j.id), rt = loc(st, j.track.to, j.id);
      const trackLen = Math.hypot(j.track.to[0] - j.track.from[0], j.track.to[1] - j.track.from[1]);
      terms.add(TK_SLIDER, TERM_PERP, [...ra.verts, ...rf.verts], [...ra.w, ...rf.w.map((x) => -x)], {
        join: j.id, to: rt, from: rf, trackLen, mechanism: j.mechanism ?? null, k: kHard, s: 0,
      });
    } else if (j.type === 'pin') {
      const s = si(j.a.sheet);
      /** @type {number[]} */
      const verts = [];
      if (j.a.along) {
        const [p, q] = j.a.along;
        const tol = Math.max(doc.sheets[s].derived.collision_thickness, 1e-3 * mesh.h);
        const near = (/** @type {number} */ t) => { for (let v = 0; v < mesh.nV; v++) if (mesh.vSheet[v] === s && distPointSeg(mesh.uv[2 * v], mesh.uv[2 * v + 1], p[0], p[1], q[0], q[1]) <= t) verts.push(v); };
        near(tol);
        // a grip line across open paper (no document edge on it) may fall between mesh rows at
        // some mesh sizes: grip the band of half a mesh edge around it instead of failing
        if (!verts.length) near(0.5 * mesh.h);
      } else verts.push(nearestVertex(mesh, s, j.a.at));
      if (!verts.length) throw new Error(`join ${j.id}: pin selects no mesh vertex`);
      if (gated.has(j.id)) {
        for (const v of verts) terms.add(TK_ANCHOR, TERM_FULL, [v], [1], { join: j.id, target: [0, 0, 0], world: j.world ?? null, leadV: verts[0], mechanism: j.mechanism ?? null, k: kHard });
      } else pins.push({ verts, world: j.world, mechanism: j.mechanism ?? null, id: j.id });
    }
  }
  return { terms, pins, weldSheet, warnings };
}

/**
 * Sample points of a glue zone for barycentric welds: the centroid, the zone's corners pulled a
 * fifth of the way in, and points along that inset outline at most `h` apart. Deterministic.
 * @param {number[][]} region polygon (sheet-local mm) @param {number} h mesh edge (mm)
 * @returns {number[][]}
 */
export function glueSamples(region, h) {
  const n = region.length;
  let cx = 0, cy = 0;
  for (const p of region) { cx += p[0]; cy += p[1]; }
  cx /= n; cy /= n;
  const inset = region.map((p) => [cx + 0.8 * (p[0] - cx), cy + 0.8 * (p[1] - cy)]);
  /** @type {number[][]} */
  const out = [[cx, cy]];
  for (let i = 0; i < n; i++) {
    const p = inset[i], q = inset[(i + 1) % n];
    const k = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / h));
    for (let s = 0; s < k; s++) out.push([p[0] + (s / k) * (q[0] - p[0]), p[1] + (s / k) * (q[1] - p[1])]);
  }
  return out;
}

/**
 * The nearest point of sheet s's mesh to (u, v) when it is within `tol` (mm), as barycentric weights
 * of its triangle (clamped to the triangle), else null. For points that rounding put just off a
 * cut or boundary edge.
 * @param {import('../mesh.js').Mesh} mesh @param {number} s @param {number} u @param {number} v @param {number} tol
 * @returns {{tri:number, w:[number,number,number], verts:[number,number,number]}|null}
 */
export function snapPoint(mesh, s, u, v, tol) {
  const { tris, triSheet, uv } = mesh;
  let best = null, bd = tol;
  for (let t = 0; t < mesh.nT; t++) {
    if (triSheet[t] !== s) continue;
    const q = [tris[3 * t], tris[3 * t + 1], tris[3 * t + 2]];
    for (let i = 0; i < 3; i++) {
      const a = q[i], b = q[(i + 1) % 3];
      const ax = uv[2 * a], ay = uv[2 * a + 1], dx = uv[2 * b] - ax, dy = uv[2 * b + 1] - ay;
      const L2 = dx * dx + dy * dy;
      const f = L2 > 0 ? Math.max(0, Math.min(1, ((u - ax) * dx + (v - ay) * dy) / L2)) : 0;
      const d = Math.hypot(ax + f * dx - u, ay + f * dy - v);
      if (d <= bd) {
        bd = d;
        /** @type {[number,number,number]} */ const w = [0, 0, 0];
        w[i] = 1 - f; w[(i + 1) % 3] = f;
        best = { tri: t, w, verts: /** @type {[number,number,number]} */ (q) };
      }
    }
  }
  return best;
}

/** @param {import('../mesh.js').Mesh} mesh @param {number} s @param {number[]} p */
export function nearestVertex(mesh, s, p) {
  let best = -1, bd = Infinity;
  for (let v = 0; v < mesh.nV; v++) {
    if (mesh.vSheet[v] !== s) continue;
    const d = Math.hypot(mesh.uv[2 * v] - p[0], mesh.uv[2 * v + 1] - p[1]);
    if (d < bd) { bd = d; best = v; }
  }
  return best;
}

/** Unit front normal of triangle t at x. @param {import('../mesh.js').Mesh} mesh @param {Float64Array} x @param {number} t */
export function triNormal(mesh, x, t) {
  const a = 3 * mesh.tris[3 * t], b = 3 * mesh.tris[3 * t + 1], c = 3 * mesh.tris[3 * t + 2];
  const ux = x[b] - x[a], uy = x[b + 1] - x[a + 1], uz = x[b + 2] - x[a + 2];
  const vx = x[c] - x[a], vy = x[c + 1] - x[a + 1], vz = x[c + 2] - x[a + 2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const L = hypot3(nx, ny, nz) || 1;
  return [nx / L, ny / L, nz / L];
}

/**
 * Per-substep update of term constants (offsets, targets, slider directions).
 * @param {any} w World @param {Float64Array} x
 */
export function updateTerms(w, x) {
  const T = w.terms;
  for (let t = 0; t < T.count; t++) {
    const inf = T.info[t];
    if (inf.kind === TK_GLUE) {
      const n = triNormal(w.mesh, x, inf.tri);
      T.c[3 * t] = -inf.offset * n[0]; T.c[3 * t + 1] = -inf.offset * n[1]; T.c[3 * t + 2] = -inf.offset * n[2];
    } else if (inf.kind === TK_PIVOT) {
      const n = triNormal(w.mesh, x, inf.tri);
      if (inf.offset === null) {
        // initial normal separation (two layers riveted together)
        const r = [0, 0, 0];
        r[0] = 0; r[1] = 0; r[2] = 0;
        for (let i = T.start[t]; i < T.start[t + 1]; i++) { const v = 3 * T.verts[i]; r[0] += T.coef[i] * w.X0[v]; r[1] += T.coef[i] * w.X0[v + 1]; r[2] += T.coef[i] * w.X0[v + 2]; }
        const n0 = triNormal(w.mesh, w.X0, inf.tri);
        inf.offset = r[0] * n0[0] + r[1] * n0[1] + r[2] * n0[2];
      }
      T.c[3 * t] = -inf.offset * n[0]; T.c[3 * t + 1] = -inf.offset * n[1]; T.c[3 * t + 2] = -inf.offset * n[2];
    } else if (inf.kind === TK_STRING) {
      if (inf.world) { T.c[3 * t] = -inf.world[0]; T.c[3 * t + 1] = -inf.world[1]; T.c[3 * t + 2] = -inf.world[2]; }
      T.len[t] = inf.len;
    } else if (inf.kind === TK_SLIDER) {
      const pf = baryPos(x, inf.from), pt = baryPos(x, inf.to);
      const dx = pt[0] - pf[0], dy = pt[1] - pf[1], dz = pt[2] - pf[2];
      const L = hypot3(dx, dy, dz) || 1;
      T.dir[3 * t] = dx / L; T.dir[3 * t + 1] = dy / L; T.dir[3 * t + 2] = dz / L;
      if (inf.driven) {
        T.mode[t] = TERM_FULL;
        const s = inf.s * (L / inf.trackLen);
        T.c[3 * t] = -s * dx / L; T.c[3 * t + 1] = -s * dy / L; T.c[3 * t + 2] = -s * dz / L;
      } else { T.mode[t] = TERM_PERP; T.c[3 * t] = 0; T.c[3 * t + 1] = 0; T.c[3 * t + 2] = 0; }
    } else if (inf.kind === TK_GRAB || inf.kind === TK_DRIVE || inf.kind === TK_ANCHOR) {
      T.c[3 * t] = -inf.target[0]; T.c[3 * t + 1] = -inf.target[1]; T.c[3 * t + 2] = -inf.target[2];
    }
  }
}

/** @param {Float64Array} x @param {{verts:number[], w:number[]}} r */
export function baryPos(x, r) {
  const p = [0, 0, 0];
  for (let i = 0; i < 3; i++) { const v = 3 * r.verts[i]; p[0] += r.w[i] * x[v]; p[1] += r.w[i] * x[v + 1]; p[2] += r.w[i] * x[v + 2]; }
  return p;
}
