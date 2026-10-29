// @ts-check
/**
 * Controls → mechanisms and the sequence player (spec §5.4–5.6, engine.md §3.3).
 *
 * Mechanisms move kinematic sheets and pinned points exactly (Dirichlet vertices), drive the leaf
 * page-turn point (a soft hand constraint, so the paper bends physically) and slider joins.
 * Control changes are rate-limited (`mechanismRate`, deg/s or mm/s) so a slider jump in the studio
 * does not teleport a board that has paper glued to it. The sequence player eases each step's hinge
 * targets from the measured angle at step entry to the target over `duration_ms` (smoothstep), keeps
 * targets held until a later step releases them, and accepts fractional step positions.
 */
import { axisAngleMatrix, mat3Vec, mat3Mul, quatRotate, DEG } from './geom.js';
import { TK_DRIVE, TK_SLIDER, TK_GRAB } from './xpbd/joins.js';
import { HAND_FACTOR } from './constants.js';
import { locatePoint } from './mesh.js';
import { triNormal } from './xpbd/joins.js';
import { KinematicProgram } from './kinematics/program.js';
import { keyedOutput } from './keyed.js';

const LEAF_STIFFNESS = 2.0e5; // g/s², the hand turning a page

export class Drivers {
  /**
   * @param {any} w World (mesh, doc, X0 set; terms still a TermList)
   * @param {import('./xpbd/joins.js').TermList} termList
   * @param {{verts:number[], world:number[]|null, mechanism:string|null, id:string}[]} pins
   * @param {{mechanismRate?: number}} opts
   */
  constructor(w, termList, pins, opts) {
    const doc = w.doc, mesh = w.mesh;
    this.rate = opts.mechanismRate ?? 180;
    /** @type {Map<string, any>} */ this.controls = new Map();
    /** @type {Map<string, number>} */ this.value = new Map();
    /** @type {Map<string, number>} */ this.goal = new Map();
    for (const c of doc.controls) {
      this.controls.set(c.id, c);
      const v = typeof c.default === 'boolean' ? (c.default ? 1 : 0) : c.default;
      this.value.set(c.id, v); this.goal.set(c.id, v);
    }
    /** @type {Map<string, any>} */ this.mech = new Map(doc.mechanisms.map((/** @type {any} */ m) => [m.id, m]));
    // placed (un-initial) positions for kinematic sheets: placement applied to (u, 0, −v)
    const nV = mesh.nV;
    this.Xplaced = new Float64Array(3 * nV);
    for (let v = 0; v < nV; v++) {
      const s = doc.sheets[mesh.vSheet[v]];
      const r = quatRotate(s.placement.rotation, [mesh.uv[2 * v], 0, -mesh.uv[2 * v + 1]]);
      this.Xplaced[3 * v] = r[0] + s.placement.origin[0]; this.Xplaced[3 * v + 1] = r[1] + s.placement.origin[1]; this.Xplaced[3 * v + 2] = r[2] + s.placement.origin[2];
    }
    /** fixed vertex groups: {verts, base: Float64Array, mech: string|null, kind} */
    /** @type {{verts:number[], base:Float64Array, mech:string|null, kind:string}[]} */
    this.groups = [];
    const fixed = new Uint8Array(nV);
    doc.sheets.forEach((/** @type {any} */ s, /** @type {number} */ si) => {
      if (!s.kinematic) return;
      const verts = [];
      for (let v = 0; v < nV; v++) if (mesh.vSheet[v] === si) verts.push(v);
      // follows its mechanism only if listed in sheets_moving; otherwise a fixed board (spec §5.1)
      const m = doc.mechanisms.find((/** @type {any} */ q) => q.id === s.kinematic.mechanism);
      const moving = m && Array.isArray(m.sheets_moving) && m.sheets_moving.includes(s.id);
      this.groups.push({ verts, base: gather(this.Xplaced, verts), mech: moving ? s.kinematic.mechanism : null, kind: moving ? 'sheet' : 'board' });
      for (const v of verts) fixed[v] = 1;
    });
    for (const p of pins) {
      const base = gather(w.X0, p.verts);
      if (p.world) {
        const d = [p.world[0] - base[0], p.world[1] - base[1], p.world[2] - base[2]];
        for (let i = 0; i < p.verts.length; i++) for (let c = 0; c < 3; c++) base[3 * i + c] += d[c];
      }
      this.groups.push({ verts: p.verts, base, mech: p.mechanism, kind: 'pin' });
      for (const v of p.verts) fixed[v] = 1;
    }
    // leaf mechanisms: pin the spine, add a drive-point term
    /** @type {any[]} */ this.leaves = [];
    for (const m of doc.mechanisms) {
      if (m.type !== 'leaf') continue;
      const s = /** @type {number} */(doc.sheetIndex.get(m.sheet));
      const [p, q] = m.spine;
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
      const tol = Math.max(doc.sheets[s].derived.collision_thickness, 1e-3 * mesh.h);
      const spine = [];
      let W = 0, side = 0;
      for (let v = 0; v < nV; v++) {
        if (mesh.vSheet[v] !== s) continue;
        const rx = mesh.uv[2 * v] - p[0], ry = mesh.uv[2 * v + 1] - p[1];
        const dist = (rx * dy - ry * dx) / L; // signed distance from the spine line
        const along = (rx * dx + ry * dy) / L;
        if (Math.abs(dist) <= tol && along >= -tol && along <= L + tol) spine.push(v);
        if (Math.abs(dist) > W) { W = Math.abs(dist); side = Math.sign(dist); }
      }
      this.groups.push({ verts: spine, base: gather(w.X0, spine), mech: null, kind: 'spine' });
      for (const v of spine) fixed[v] = 1;
      // drive band: the free-edge vertices over the middle half of the page (a hand holding the
      // fore-edge), each following its own arc about the spine; the radius shrinks mid-turn so the
      // page bows. Spreading the hand over the edge keeps the drive force from stretching the paper.
      const a0 = locatePoint(mesh, s, p[0], p[1]), a1 = locatePoint(mesh, s, q[0], q[1]);
      const P0 = bary(w.X0, a0), P1 = bary(w.X0, a1);
      const axis = norm3([P1[0] - P0[0], P1[1] - P0[1], P1[2] - P0[2]]);
      const up = triNormal(mesh, w.X0, /** @type {any} */(a0).tri);
      const band = [];
      for (let v = 0; v < nV; v++) {
        if (mesh.vSheet[v] !== s) continue;
        const rx = mesh.uv[2 * v] - p[0], ry = mesh.uv[2 * v + 1] - p[1];
        const dist = Math.abs((rx * dy - ry * dx) / L), along = (rx * dx + ry * dy) / L;
        if (Math.abs(dist - W) <= tol + 1e-6 && along >= 0.25 * L && along <= 0.75 * L) band.push(v);
      }
      const drivers = band.map((dv) => {
        const X = [w.X0[3 * dv], w.X0[3 * dv + 1], w.X0[3 * dv + 2]];
        const t = (X[0] - P0[0]) * axis[0] + (X[1] - P0[1]) * axis[1] + (X[2] - P0[2]) * axis[2];
        const M = [P0[0] + t * axis[0], P0[1] + t * axis[1], P0[2] + t * axis[2]];
        const D0 = [X[0] - M[0], X[1] - M[1], X[2] - M[2]];
        const term = termList.add(TK_DRIVE, 0, [dv], [1], { target: X.slice(), k: LEAF_STIFFNESS / Math.max(1, band.length) });
        return { dv, term, M, out: norm3(D0), r0: Math.hypot(...D0) };
      });
      this.leaves.push({ m, up, drivers });
    }
    this.grabTerm = termList.add(TK_GRAB, 0, [0], [1], { target: [0, 0, 0], k: 0 });
    this.fixed = fixed;
    /** @type {string[]} */ this.warnings = [];
    this.startFromInitialPose(w);
    // sequence
    const seq = doc.sequence;
    this.seq = seq;
    this.seqControl = doc.controls.find((/** @type {any} */ c) => c.kind === 'sequence')?.id ?? null;
    this.seqPos = 0;
    /** @type {Map<number, number>} start angle (rad) per document edge at step entry */
    this.entry = new Map();
    this.entryStep = -1;
    /** document edge → hinge indices */
    /** @type {Map<number, number[]>} */
    this.edgeHinges = new Map();
    for (let h = 0; h < mesh.nH; h++) {
      const d = mesh.hingeDoc[h];
      if (d < 0) continue;
      let l = this.edgeHinges.get(d);
      if (!l) { l = []; this.edgeHinges.set(d, l); }
      l.push(h);
    }
    this.wind = 0;
    // kinematic fold program: its sheets are posed rigidly (Tier R) and fixed for the physics
    /** @type {KinematicProgram|null} */
    this.program = null;
    if (seq && seq.mode === 'kinematic') {
      this.program = new KinematicProgram(w);
      for (const v of this.program.ownedVertices(mesh)) fixed[v] = 1;
    }
  }

  /**
   * A mechanism control starts where the document's pose is (backlog item 21). Each control starts
   * at its `default`, but a document may place its kinematic sheets (and lay its leaves) at the
   * mechanism's neutral value instead (0; a hinge's `rest`). Starting at the default would then
   * teleport them on the first substep and smash the paper around them. So when the neutral
   * value reproduces the initial pose better than the default, the control starts there and moves
   * to its default at `mechanismRate`, like any other control change; World.warnings says so.
   * Documents whose initial pose matches the default are unchanged.
   * @param {any} w
   */
  startFromInitialPose(w) {
    const X0 = w.X0;
    for (const [id, c] of this.controls) {
      if (c.kind === 'sequence' || c.kind === 'wind' || c.kind === 'toggle') continue;
      const mechs = [...this.mech.values()].filter((m) => (m.control ?? m.angle_control) === id);
      if (!mechs.length) continue;
      const neutral = mechs[0].type === 'hinge' ? mechs[0].rest : 0;
      if (mechs.some((m) => (m.type === 'hinge' ? m.rest : 0) !== neutral)) continue;
      const def = /** @type {number} */(this.value.get(id));
      if (def === neutral) continue;
      const err = (/** @type {number} */ val) => {
        this.value.set(id, val);
        const memo = new Map();
        let e = 0;
        for (const grp of this.groups) {
          if (!grp.mech) continue;
          const tf = this.transformOf(w, grp.mech, memo);
          for (let i = 0; i < grp.verts.length; i++) {
            const v = grp.verts[i];
            let p = [grp.base[3 * i], grp.base[3 * i + 1], grp.base[3 * i + 2]];
            if (tf.R) p = mat3Vec(tf.R, p);
            e += Math.hypot(p[0] + tf.T[0] - X0[3 * v], p[1] + tf.T[1] - X0[3 * v + 1], p[2] + tf.T[2] - X0[3 * v + 2]);
          }
        }
        for (const lf of this.leaves) {
          if (lf.m.control !== id) continue;
          const a = keyedOutput(lf.m, val) * DEG;
          for (const d of lf.drivers) {
            const r = d.r0 * (1 - 0.18 * Math.sin(a));
            let q = 0;
            for (let k = 0; k < 3; k++) q += (d.M[k] + r * (Math.cos(a) * d.out[k] + Math.sin(a) * lf.up[k]) - X0[3 * d.dv + k]) ** 2;
            e += Math.sqrt(q);
          }
        }
        return e;
      };
      const eDef = err(def), eNeu = err(neutral);
      if (eNeu + 1e-6 < eDef) {
        this.value.set(id, neutral);
        this.warnings.push(`control ${id} starts at ${neutral} (where the document's initial pose puts its mechanisms), not at its default ${def}; it moves to the default at mechanismRate`);
      } else this.value.set(id, def);
    }
  }

  /** @param {string} id @param {number|boolean} v */
  setControl(id, v) {
    const c = this.controls.get(id);
    if (!c) throw new Error(`setControl: unknown control ${JSON.stringify(id)}`);
    let x = typeof v === 'boolean' ? (v ? 1 : 0) : Number(v);
    if (!Number.isFinite(x)) throw new Error(`setControl: ${id} value must be a number`);
    if (typeof c.min === 'number') x = Math.max(c.min, x);
    if (typeof c.max === 'number') x = Math.min(c.max, x);
    if (c.kind === 'sequence' && this.seq) x = Math.max(0, Math.min(this.seq.steps.length, x));
    this.goal.set(id, x);
    if (c.kind === 'wind' || c.kind === 'toggle') this.value.set(id, x);
  }

  /** Mean measured angle (rad) of a document edge's hinges. @param {any} w @param {number} e */
  edgeAngle(w, e) {
    const hs = this.edgeHinges.get(e);
    if (!hs || !hs.length) return 0;
    let s = 0;
    for (const h of hs) s += w.theta[h];
    return s / hs.length;
  }

  /**
   * Advance controls and mechanisms to the end of a substep and write fixed targets, hinge drives,
   * leaf/slider drives into the world. Returns true when the implicit matrix must be refactored.
   * @param {any} w @param {number} dt
   */
  apply(w, dt) {
    let dirty = false;
    for (const [id, c] of this.controls) {
      if (c.kind === 'sequence' || c.kind === 'wind' || c.kind === 'toggle') continue;
      const g = /** @type {number} */(this.goal.get(id)), v = /** @type {number} */(this.value.get(id));
      if (g !== v) {
        const step = this.rate * dt;
        this.value.set(id, Math.abs(g - v) <= step ? g : v + Math.sign(g - v) * step);
      }
    }
    // fixed vertices
    const X = w.fixedTarget;
    /** @type {Map<string, {R: number[]|null, T: number[]}>} */
    const memo = new Map();
    for (const grp of this.groups) {
      const tf = grp.mech ? this.transformOf(w, grp.mech, memo) : null;
      const R = tf ? tf.R : null, t = tf ? tf.T : [0, 0, 0];
      for (let i = 0; i < grp.verts.length; i++) {
        const v = grp.verts[i];
        let p = [grp.base[3 * i], grp.base[3 * i + 1], grp.base[3 * i + 2]];
        if (R) p = mat3Vec(R, p);
        X[3 * v] = p[0] + t[0]; X[3 * v + 1] = p[1] + t[1]; X[3 * v + 2] = p[2] + t[2];
      }
    }
    // leaf page turn: each band vertex on an arc about the spine (radius shrinks mid-turn)
    const T = w.terms;
    for (const lf of this.leaves) {
      const a = keyedOutput(lf.m, /** @type {number} */(this.value.get(lf.m.control))) * DEG;
      for (const d of lf.drivers) {
        const r = d.r0 * (1 - 0.18 * Math.sin(a));
        const tgt = T.info[d.term].target;
        for (let c = 0; c < 3; c++) tgt[c] = d.M[c] + r * (Math.cos(a) * d.out[c] + Math.sin(a) * lf.up[c]);
      }
    }
    // sliders driven by slide mechanisms
    for (let t = 0; t < T.count; t++) {
      const inf = T.info[t];
      if (inf.kind !== TK_SLIDER || !inf.mechanism) continue;
      const m = this.mech.get(inf.mechanism);
      const c = this.controls.get(m.control);
      const val = /** @type {number} */(this.value.get(m.control));
      const frac = typeof c.max === 'number' && c.max !== 0 ? val / c.max : val / m.travel;
      const was = !!inf.driven;
      inf.driven = true;
      inf.s = Math.max(0, Math.min(inf.trackLen, m.keys ? keyedOutput(m, val) : m.travel * frac));
      if (!was) dirty = true;
    }
    // wind
    for (const [id, c] of this.controls) if (c.kind === 'wind') this.wind = /** @type {number} */(this.value.get(id)) * 1000;
    if (this.seq && this.seq.mode === 'physical') dirty = this.applySequence(w, dt) || dirty;
    if (this.program && this.kin) {
      // kinematic program: closure is solved once per frame (beginFrame); substeps interpolate
      const k = this.kin, f = Math.min(1, ++k.i / k.n);
      for (const v of k.verts) for (let c = 0; c < 3; c++) w.fixedTarget[3 * v + c] = k.a[3 * v + c] + f * (k.b[3 * v + c] - k.a[3 * v + c]);
    }
    return dirty;
  }

  /**
   * Rigid transform p ↦ R·p + T of a hinge, rotate or translate mechanism at its current control
   * value (keys applied, spec §5.18), composed with the mechanism it rides. Memoised per call of
   * `apply`. R is null for a pure translation.
   * @param {any} w @param {string} id @param {Map<string, {R: number[]|null, T: number[]}>} memo
   * @returns {{R: number[]|null, T: number[]}}
   */
  transformOf(w, id, memo) {
    const hit = memo.get(id);
    if (hit) return hit;
    const m = this.mech.get(id);
    /** @type {number[]|null} */
    let R = null;
    let T = [0, 0, 0];
    if (m && m.type === 'hinge') {
      const o = m.axis.origin;
      R = axisAngleMatrix(m.axis.direction, (keyedOutput(m, /** @type {number} */(this.value.get(m.angle_control))) - m.rest) * DEG);
      const q = mat3Vec(R, o);
      T = [o[0] - q[0], o[1] - q[1], o[2] - q[2]];
    } else if (m && m.type === 'rotate') {
      if (!m._c) {
        const s = /** @type {number} */(w.doc.sheetIndex.get(m.center.sheet));
        const r = locatePoint(w.mesh, s, m.center.at[0], m.center.at[1]);
        m._c = bary(this.Xplaced, r); m._n = triNormal(w.mesh, this.Xplaced, /** @type {any} */(r).tri);
      }
      R = axisAngleMatrix(m._n, keyedOutput(m, /** @type {number} */(this.value.get(m.control))) * DEG);
      const q = mat3Vec(R, m._c);
      T = [m._c[0] - q[0], m._c[1] - q[1], m._c[2] - q[2]];
    } else if (m && m.type === 'translate') {
      const c = this.controls.get(m.control);
      const val = /** @type {number} */(this.value.get(m.control));
      const disp = m.keys ? keyedOutput(m, val) : m.travel * (typeof c.max === 'number' && c.max !== 0 ? val / c.max : val / m.travel);
      const d = norm3(m.direction);
      T = [d[0] * disp, d[1] * disp, d[2] * disp];
    }
    if (m && m.ride !== undefined) {
      const r = this.transformOf(w, m.ride, memo);
      if (r.R) { const q = mat3Vec(r.R, T); T = [q[0], q[1], q[2]]; R = R ? mat3Mul(r.R, R) : r.R.slice(); }
      T = [T[0] + r.T[0], T[1] + r.T[1], T[2] + r.T[2]];
    }
    const out = { R, T };
    memo.set(id, out);
    return out;
  }

  /**
   * Once per frame: advance a kinematic program over the frame's n substeps, solve its rigid pose
   * at the frame end and set up the per-substep interpolation.
   * @param {any} w @param {number} n @param {number} dt
   */
  beginFrame(w, n, dt) {
    if (!this.program) return;
    const verts = this.kinVerts ?? (this.kinVerts = this.program.ownedVertices(w.mesh));
    const a = Float64Array.from(w.fixedTarget);
    for (let i = 0; i < n; i++) this.advanceSequence(dt);
    this.program.apply(w, this.seqPos);
    const b = Float64Array.from(w.fixedTarget);
    w.fixedTarget.set(a);
    this.kin = { a, b, n, i: 0, verts };
  }

  /** Move the sequence position toward the control's goal at one step per duration. @param {number} dt */
  advanceSequence(dt) {
    const steps = this.seq.steps, N = steps.length;
    const goal = this.seqControl ? /** @type {number} */(this.goal.get(this.seqControl)) : 0;
    const pos = this.seqPos;
    if (pos === goal) return;
    const k = Math.max(0, Math.min(N - 1, Math.floor(goal > pos ? pos : pos - 1e-12)));
    const rate = dt / (steps[k].duration_ms / 1000);
    this.seqPos = goal > pos ? Math.min(goal, pos + rate) : Math.max(goal, pos - rate);
    if (this.seqControl) this.value.set(this.seqControl, this.seqPos);
  }

  /** @param {any} w @param {number} dt @returns {boolean} drive set changed */
  applySequence(w, dt) {
    const steps = this.seq.steps, N = steps.length;
    this.advanceSequence(dt);
    const pos = this.seqPos;
    const k = Math.min(N, Math.floor(pos + 1e-12));
    const f = k < N ? pos - k : 0;
    /** @type {Map<number, number>} */
    const held = new Map();
    for (let i = 0; i < k; i++) {
      for (const e of steps[i].release ?? []) held.delete(e);
      for (const [e, ang] of steps[i].targets) held.set(e, ang * DEG);
    }
    /** @type {Map<number, number>} */
    const drive = new Map(held);
    if (k < N && f > 0) {
      const st = steps[k];
      if (this.entryStep !== k) {
        this.entry.clear();
        for (const [e] of st.targets) this.entry.set(e, this.edgeAngle(w, e));
        this.entryStep = k;
      }
      for (const e of st.release ?? []) drive.delete(e);
      const s = f * f * (3 - 2 * f);
      for (const [e, ang] of st.targets) {
        const a0 = /** @type {number} */(this.entry.get(e));
        drive.set(e, a0 + s * (ang * DEG - a0));
      }
    } else if (f === 0) this.entryStep = -1;
    let changed = false;
    const on = w.driveOn, tg = w.driveTarget;
    const want = new Uint8Array(on.length);
    for (const [e, a] of drive) {
      const hs = this.edgeHinges.get(e);
      if (!hs) continue;
      for (const h of hs) { want[h] = 1; tg[h] = a; }
    }
    for (let h = 0; h < on.length; h++) if (want[h] !== on[h]) { on[h] = want[h]; changed = true; }
    return changed;
  }

  /** Drive stiffness per hinge (hand factor × the hinge's own stiffness). @param {Float64Array} hingeK */
  static driveStiffness(hingeK) {
    const k = new Float64Array(hingeK.length);
    for (let h = 0; h < k.length; h++) k[h] = hingeK[h] * HAND_FACTOR;
    return k;
  }
}

/** @param {Float64Array} X @param {number[]} verts */
function gather(X, verts) {
  const out = new Float64Array(3 * verts.length);
  verts.forEach((v, i) => { out[3 * i] = X[3 * v]; out[3 * i + 1] = X[3 * v + 1]; out[3 * i + 2] = X[3 * v + 2]; });
  return out;
}
/** @param {Float64Array} X @param {any} r */
function bary(X, r) {
  const p = [0, 0, 0];
  for (let i = 0; i < 3; i++) { const v = 3 * r.verts[i]; p[0] += r.w[i] * X[v]; p[1] += r.w[i] * X[v + 1]; p[2] += r.w[i] * X[v + 2]; }
  return p;
}
/** @param {number[]} a */
function norm3(a) { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; }
