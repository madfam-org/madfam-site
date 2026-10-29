// @ts-check
/**
 * `World` — Tier C compliant paper simulation of a sheet document (engine.md §3, §5, §6).
 *
 * Per substep (fixed Δt = 1/(60·S); `step()` runs whole substeps only):
 *   1. drivers: controls → kinematic sheets, pins, hinge drives, page-turn and slider drives
 *   2. v ← v·exp(−c·Δt); x̃ = x + Δt·v + Δt²·M⁻¹·f_ext (gravity, air drag + wind, user forces)
 *   3. one Gauss–Newton step of the implicit block (membrane, panel bending, creases, drives,
 *      joins): H δ = −∇E(x̃), H refactorised only when the sheet has rotated (see implicit.js)
 *   4. Gauss–Seidel projections: 0.5 % strain limit, fold limit, layer contact, ground
 *   5. v = (x − x_start)/Δt; hinge angles (unwrapped); rate-independent crease plasticity
 * Deterministic: fixed orders, typed arrays, seeded wind, no clocks inside `step`.
 */
import { loadDocument } from '../document.js';
import { buildMesh, HINGE_PANEL, HINGE_CREASE, HINGE_SCORE, HINGE_PERF } from '../mesh.js';
import { fromDerived, bendingDeff, membraneE, creaseGrainFactor } from '../material.js';
import { dihedral } from './dihedral.js';
import { buildSystem, assembleAndFactor, gradient, unwrap, TERM_STRING, termResidual } from './implicit.js';
import { liftOntoTable, restBranch } from './setrest.js';
import { resolveJoins, updateTerms, TK_STRING, TK_PERF } from './joins.js';
import { Drivers } from '../drivers.js';
import { Contact } from './contact.js';
import { EdgeContact } from './edgecontact.js';
import { Wind, addAirForces } from './air.js';
import { RenderBuffers } from './render.js';
import { pcgStep } from './pcg.js';
import { snapshotWorld, restoreWorld } from './state.js';
import { JoinGates } from './gates.js';
import { Presentation } from './presentation.js';
import * as K from '../constants.js';
import { hypot3 } from '../fastmath.js';

const G12 = new Float64Array(12);

export class World {
  /**
   * @param {any} docOrJson a loaded document (from loadDocument) or raw JSON
   * @param {{meshEdge?:number, substeps?:number, contact?:boolean, ground?:boolean, gravity?:boolean|number, seed?:number,
   *   damping?:number, windDir?:number[], panelStiffness?:number, mechanismRate?:number, newtonIterations?:number,
   *   refactorAngle?:number, grabStiffness?:number, handFactor?:number, plasticity?:boolean, membraneCompression?:number, glueSamples?:boolean, edgeContact?:boolean,
   *   bendDamping?:number}} [opts]
   */
  constructor(docOrJson, opts = {}) {
    const doc = docOrJson && docOrJson.sheetIndex instanceof Map ? docOrJson : loadDocument(docOrJson);
    this.doc = doc;
    this.opts = {
      substeps: opts.substeps ?? K.DEFAULT_SUBSTEPS, contact: opts.contact ?? true, ground: opts.ground ?? true,
      gravity: opts.gravity ?? true, seed: opts.seed ?? K.DEFAULT_SEED, damping: opts.damping ?? K.DAMPING,
      windDir: opts.windDir ?? [0, 0, 1], panelStiffness: opts.panelStiffness ?? 1, newtonIterations: opts.newtonIterations ?? 1,
      refactorAngle: opts.refactorAngle ?? K.REFACTOR_ANGLE, grabStiffness: opts.grabStiffness ?? K.GRAB_STIFFNESS,
      handFactor: opts.handFactor ?? K.HAND_FACTOR, plasticity: opts.plasticity ?? true, meshEdge: opts.meshEdge,
    };
    if (!(this.opts.substeps >= 1 && Number.isInteger(this.opts.substeps))) throw new RangeError('World: substeps must be a positive integer');
    const mesh = buildMesh(doc, { meshEdge: opts.meshEdge });
    this.mesh = mesh;
    const nV = mesh.nV;
    this.materials = doc.sheets.map((/** @type {any} */ s) => fromDerived(s.derived));
    const lift = (opts.ground ?? true) ? liftOntoTable(doc, mesh) : 0; // setrest.js
    this.X0 = mesh.X0;
    this.x = Float64Array.from(mesh.X0);
    this.v = new Float64Array(3 * nV);
    this.xs = new Float64Array(3 * nV);
    this.xt = new Float64Array(3 * nV);
    this.g = new Float64Array(3 * nV);
    this.fext = new Float64Array(3 * nV);
    this.userForce = new Float64Array(3 * nV);
    this.mass = mesh.mass;
    this.kCompFactor = opts.membraneCompression ?? K.MEMBRANE_COMPRESSION;
    this.kCompModel = Math.max(this.kCompFactor, K.MODEL_COMPRESSION);
    this.dt = 1 / (60 * this.opts.substeps);
    /** Bending damping as a multiple of each hinge's stiffness per substep: β/Δt (constants.js BEND_DAMPING). */
    this.bendDamp = (opts.bendDamping ?? K.BEND_DAMPING) / this.dt;
    this._initElements();
    // joins and drivers
    let kmax = 0;
    for (let e = 0; e < mesh.nE; e++) kmax = Math.max(kmax, this.kMem[e]);
    this.kHard = K.HARD_FACTOR * kmax;
    const { terms, pins, weldSheet, warnings: joinWarnings } = resolveJoins(doc, mesh, this.kHard, { glueSamples: opts.glueSamples ?? true });
    this.weldSheet = weldSheet;
    // perforations: breakable welds between the duplicated vertices (tear at the stock's tear strain)
    for (let i = 0; i < mesh.perfPairs.length / 2; i++) {
      const a = mesh.perfPairs[2 * i], b = mesh.perfPairs[2 * i + 1];
      const m = this.materials[mesh.vSheet[a]];
      const Y = Math.min(m.Emd * m.t, K.MEMBRANE_CAP_LENGTH * m.rhoA * K.GRAVITY);
      terms.add(TK_PERF, 0, [a, b], [1, -1], { k: this.kHard, pair: i, fBreak: m.perfFactor * Y * m.tearStrain * mesh.perfPairLen[i] });
    }
    this.drivers = new Drivers(this, terms, pins, opts);
    this.warnings = this.drivers.warnings;
    if (lift > 0) this.warnings.push(`initial pose: ${lift.toFixed(2)} mm below the table; the document was lifted onto it`);
    this.warnings.push(...joinWarnings);
    this.terms = terms.finish();
    for (let t = 0; t < this.terms.count; t++) this.terms.k[t] = this.terms.info[t].k ?? 0;
    this.terms.active[this.drivers.grabTerm] = 0;
    this.fixed = this.drivers.fixed;
    this.invMass = new Float64Array(nV);
    for (let v = 0; v < nV; v++) this.invMass[v] = this.fixed[v] ? 0 : 1 / this.mass[v];
    this.gates = new JoinGates(this); // step-gated joins (spec §5.19): all off until their step
    this.fixedTarget = Float64Array.from(this.x);
    this._clampCorrection();
    this.sys = buildSystem(this);
    this.factorDir = new Float64Array(3 * mesh.nE);
    this.edgeDir = new Float64Array(3 * mesh.nE);
    this.edgeK = new Float64Array(mesh.nE);
    this.edgeComp = new Uint8Array(mesh.nE);
    this.hingeGrad = new Float64Array(12 * mesh.nH);
    this.pcgIterations = 0;
    this.torn = 0;
    this._pcgFail = 0;
    this._asleep = false;
    this._quiet = 0;
    // safety cap: refactor when any membrane edge has turned this far since the last factorisation
    // (PCG with the stale factorisation handles smaller rotations; see pcg.js)
    this.refactorAngle = opts.refactorAngle ?? K.REFACTOR_ANGLE;
    this.factorCount = 0;
    this.dirty = true;
    this.contact = this.opts.contact || this.opts.ground ? new Contact(this) : null;
    // edge–face contact for interlocking slits: only documents that name an edge `interlock…`
    this.edgeContact = this.contact && this.opts.contact && opts.edgeContact !== false && EdgeContact.wanted(doc) ? new EdgeContact(this) : null;
    if (this.edgeContact && !this.edgeContact.enabled) this.warnings.push(`edge contact: ${this.edgeContact.pairs} lip × triangle pairs exceed the limit; interlocking slits are not held`);
    if (this.edgeContact && this.edgeContact.enabled && this.contact) this.contact.lipVert = this.edgeContact.lipVert;
    this._edgeContacts = 0;
    /** passes skipped because the one before changed nothing (diagnostics); a counter render() follows: step() and restore() advance it */
    this.passesSkipped = 0; this.poseVersion = 0;
    this.wind = new Wind(this.opts.seed, this.opts.windDir);
    this.time = 0;
    this._acc = 0;
    this.substepsRun = 0;
    this.framesRun = 0;
    this._contacts = 0;
    this._grounded = 0;
    this._stringTaut = new Uint8Array(this.terms.count);
    this._factorState = null;
    // set later; declared here so a World keeps one hidden class and its hot methods stay optimised
    /** @type {any} */ this._pcg = null; /** @type {number[]|null} */ this._perfTerms = null; /** @type {Map<number, number>|null} */ this._perfOf = null; this._grabSheet = 0;
    this.presentation = new Presentation(this); // spec §5.16: render-side only
    this.renderBuffers = new RenderBuffers(this);
  }

  /** Stiffness, rest angles, yields and limits of membrane edges and hinges. */
  _initElements() {
    const mesh = this.mesh, doc = this.doc, nE = mesh.nE, nH = mesh.nH;
    this.kMem = new Float64Array(nE);
    for (let e = 0; e < nE; e++) {
      const t0 = mesh.edgeTris[2 * e], t1 = mesh.edgeTris[2 * e + 1];
      const s = mesh.triSheet[t0];
      const m = this.materials[s];
      const a = mesh.edges[2 * e], b = mesh.edges[2 * e + 1];
      const l0 = mesh.edgeLen[e];
      const we = t1 >= 0 ? (mesh.triArea[t0] + mesh.triArea[t1]) / (1.5 * l0) : (2 * mesh.triArea[t0]) / l0;
      const grain = (doc.sheets[s].grainDeg * Math.PI) / 180;
      const cphi = Math.abs(((mesh.uv[2 * b] - mesh.uv[2 * a]) * Math.cos(grain) + (mesh.uv[2 * b + 1] - mesh.uv[2 * a + 1]) * Math.sin(grain)) / l0);
      const Y = Math.min(membraneE(m, Math.acos(Math.min(1, cphi))) * m.t, K.MEMBRANE_CAP_LENGTH * m.rhoA * K.GRAVITY);
      this.kMem[e] = (Y * we) / l0;
    }
    this.hingeK = new Float64Array(nH);
    this.restTheta = new Float64Array(nH);
    this.theta = new Float64Array(nH);
    this.thetaPred = new Float64Array(nH);
    this.yieldRad = new Float64Array(nH);
    this.foldLimit = new Float64Array(nH);
    this.memory = new Uint8Array(nH);
    this.driveOn = new Uint8Array(nH);
    this.driveTarget = new Float64Array(nH);
    const H = mesh.hinges;
    for (let h = 0; h < nH; h++) {
      const e = mesh.hingeEdge[h];
      const s = mesh.triSheet[mesh.edgeTris[2 * e]];
      const m = this.materials[s];
      const L = mesh.edgeLen[e];
      const kind = mesh.hingeKind[h];
      if (kind === HINGE_PANEL) {
        this.hingeK[h] = this.opts.panelStiffness * K.C_B * bendingDeff(m, mesh.hingePhi[h]) * L * L / mesh.hingeA[h];
        this.yieldRad[h] = K.PANEL_YIELD_DEG * Math.PI / 180;
      } else {
        const f = kind === HINGE_SCORE ? m.scoreFactor : kind === HINGE_PERF ? m.perfFactor : 1;
        // κ = D(φ)/L* (Lechenault et al. 2014): along the grain softer than across it (material.js)
        this.hingeK[h] = m.creaseK * L * f * creaseGrainFactor(m, mesh.hingePhi[h]);
        this.yieldRad[h] = kind === HINGE_CREASE ? m.yieldRad : kind === HINGE_SCORE ? m.scoreYieldRad : m.perfYieldRad;
      }
      const d = mesh.hingeDoc[h];
      // spec §5.14 set lines, plain F / U lines too; start on the rest angle's branch (setrest.js)
      if (d >= 0 && (kind !== HINGE_PANEL || doc.restAngle[d] !== 0)) this.restTheta[h] = (doc.restAngle[d] * Math.PI) / 180;
      this.theta[h] = restBranch(this.restTheta[h], dihedral(this.x, H[4 * h], H[4 * h + 1], H[4 * h + 2], H[4 * h + 3], null));
      // fold limit |θ| ≤ π − θ_t, θ_t = 2·atan(t_c / (2·min wing height))
      // wing heights from the hinge's own vertices (perforation hinges span a split edge)
      const uv = mesh.uv, q0 = H[4 * h], q1 = H[4 * h + 1];
      const height = (/** @type {number} */ wv) => Math.abs((uv[2 * q1] - uv[2 * q0]) * (uv[2 * wv + 1] - uv[2 * q0 + 1]) - (uv[2 * q1 + 1] - uv[2 * q0 + 1]) * (uv[2 * wv] - uv[2 * q0])) / L;
      const hmin = Math.min(height(H[4 * h + 2]), height(H[4 * h + 3]));
      this.foldLimit[h] = Math.PI - 2 * Math.atan(Math.max(m.contact, K.MIN_CONTACT) / (2 * hmin));
    }
    this.driveK = new Float64Array(nH);
    /** The hand's give (1 = the full HAND_FACTOR drive); see _easeHand. */
    this.handScale = 1;
    this._handCalm = 0;
    for (let h = 0; h < nH; h++) this.driveK[h] = this.hingeK[h] * this.opts.handFactor;
  }

  /**
   * A hinge whose edge and one wing are fixed sits on a clamp line: the triangle on the fixed side
   * is rigid, so only the free half of the hinge's lever region bends — its stiffness doubles
   * (k = D·w/ℓ_r with ℓ_r halved). Without it a clamped cantilever is effectively ~0.4 h longer.
   * Test `E2-cantilever`.
   */
  _clampCorrection() {
    const H = this.mesh.hinges, f = this.fixed;
    for (let h = 0; h < this.mesh.nH; h++) {
      if (!f[H[4 * h]] || !f[H[4 * h + 1]]) continue;
      const w0 = f[H[4 * h + 2]], w1 = f[H[4 * h + 3]];
      if (w0 !== w1) { this.hingeK[h] *= 2; this.driveK[h] *= 2; }
    }
  }

  /** Simulation positions (Float64Array xyz, live view; write through it only before stepping, or render() may serve a stale pose). */
  get positions() { return this.x; }

  /** Whether the world sleeps (steps skip the solver until something wakes it); O(1), unlike stats(). */
  get asleep() { return !!this._asleep; }

  /** @param {string} id @param {number|boolean} value */
  setControl(id, value) { this.drivers.setControl(id, value); this._asleep = false; }

  /** Current value of a control (after rate limiting / sequence playback). @param {string} id */
  getControl(id) { return this.drivers.value.get(id); }

  /** Constant external force on a vertex (µN = g·mm/s²), e.g. a tip load. @param {number} v @param {number[]} f */
  setForce(v, f) { this.userForce[3 * v] = f[0]; this.userForce[3 * v + 1] = f[1]; this.userForce[3 * v + 2] = f[2]; this._asleep = false; }
  clearForces() { this.userForce.fill(0); this._asleep = false; }

  /**
   * Advance by whole substeps covering `frameDt` seconds (default one 60 Hz frame).
   * @param {number} [frameDt]
   */
  step(frameDt = 1 / 60) {
    this._acc += frameDt / this.dt;
    const n = Math.floor(this._acc + 1e-9);
    this._acc -= n;
    if (n <= 0) return 0;
    this.framesRun++;
    if (this._asleep) { this.time += n * this.dt; return n; }
    this._frame(n);
    this.poseVersion++;
    for (let i = 0; i < n; i++) this._substep();
    this._sleepCheck();
    return n;
  }

  /**
   * Deterministic sleep: when nothing drives the sheet (controls settled, no grab, no wind, no
   * kinematic program moving) and every free vertex is slower than SLEEP_SPEED, later frames are
   * skipped until a control, grab, force or restore wakes the world. Decided from state only, so
   * replays stay bit-identical.
   */
  _sleepCheck() {
    if (!K.SLEEP_SPEED) return;
    const d = this.drivers;
    if (d.wind !== 0 || this.terms.active[d.grabTerm]) { this._quiet = 0; return; }
    for (const [id, g] of d.goal) if (d.value.get(id) !== g) { this._quiet = 0; return; }
    if (d.seq && this.seqControlGoal() !== d.seqPos) { this._quiet = 0; return; }
    const v = this.v, w = this.invMass, lim = K.SLEEP_SPEED * K.SLEEP_SPEED;
    for (let i = 0; i < this.mesh.nV; i++) {
      if (w[i] === 0) continue;
      if (v[3 * i] ** 2 + v[3 * i + 1] ** 2 + v[3 * i + 2] ** 2 > lim) { this._quiet = 0; return; }
    }
    // quiet for SLEEP_FRAMES consecutive frames (a single slow frame may be an oscillation's turning point)
    if (++this._quiet >= K.SLEEP_FRAMES) this._asleep = true;
  }

  /** @returns {number} */
  seqControlGoal() { const d = this.drivers; return d.seqControl ? /** @type {number} */(d.goal.get(d.seqControl)) : 0; }

  /** Wake a sleeping world (any interaction calls this). */
  wake() { this._asleep = false; this._quiet = 0; }

  /** Per-frame work: kinematic program pose for the frame. @param {number} n substeps this frame */
  _frame(n) {
    const x = this.x;
    this.drivers.beginFrame(this, n, this.dt);
    void x; void n;
  }

  /** Has any membrane edge rotated more than `refactorAngle` since the last factorisation? */
  _checkRotation() {
    const x = this.x, E = this.mesh.edges, D = this.factorDir;
    if (!this.dirty) {
      const c = Math.cos(this.refactorAngle);
      for (let e = 0; e < this.mesh.nE; e++) {
        const a = 3 * E[2 * e], b = 3 * E[2 * e + 1];
        const dx = x[b] - x[a], dy = x[b + 1] - x[a + 1], dz = x[b + 2] - x[a + 2];
        const L = hypot3(dx, dy, dz) || 1;
        if ((dx * D[3 * e] + dy * D[3 * e + 1] + dz * D[3 * e + 2]) / L < c) { this.dirty = true; break; }
      }
    }
  }

  _substep() {
    const dt = this.dt, nV = this.mesh.nV;
    const x = this.x, v = this.v, xs = this.xs, w = this.invMass, f = this.fext;
    if (this.drivers.apply(this, dt)) this.dirty = true;
    if (this.gates.count) { if (this.gates.update(this)) this.dirty = true; this.gates.follow(this); }
    xs.set(x);
    if (this.sys.nFree === 0) {
      // every vertex is driven (kinematic program / boards): follow the drivers, nothing to solve
      x.set(this.fixedTarget);
      for (let i = 0; i < 3 * nV; i++) v[i] = (x[i] - xs[i]) / dt;
      this._hingeUpdate();
      this.time += dt;
      this.substepsRun++;
      return;
    }
    const damp = Math.exp(-this.opts.damping * dt);
    f.set(this.userForce);
    const gs = this.opts.gravity === true ? 1 : this.opts.gravity === false ? 0 : Number(this.opts.gravity);
    if (gs) for (let i = 0; i < nV; i++) f[3 * i + 1] -= gs * K.GRAVITY * this.mass[i];
    addAirForces(this.mesh, x, v, f, this.wind, this.drivers.wind, this.time);
    const ft = this.fixedTarget;
    for (let i = 0; i < nV; i++) {
      const i3 = 3 * i;
      if (w[i] === 0) {
        x[i3] = ft[i3]; x[i3 + 1] = ft[i3 + 1]; x[i3 + 2] = ft[i3 + 2];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        v[i3 + c] *= damp;
        x[i3 + c] += dt * v[i3 + c] + dt * dt * w[i] * f[i3 + c];
      }
    }
    this.xt.set(x);
    updateTerms(this, x);
    this._checkStrings(x);
    this._checkRotation();
    this._newton();
    this._tear(x);
    if (this.contact && this.opts.contact) {
      // broad phase every substep with a tight reach: relative motion over the substep (both sides,
      // inertia + free fall + the Newton step already taken) plus a margin
      let vmax = 0;
      for (let i = 0; i < 3 * nV; i++) { const d = Math.abs(x[i] - xs[i]); if (d > vmax) vmax = d; }
      this.contact.broadPhase(x, this.fixed, Math.min(50, 2 * vmax + 0.5));
    }
    this._projections();
    for (let i = 0; i < 3 * nV; i++) v[i] = (x[i] - xs[i]) / dt;
    this._hingeUpdate();
    this.time += dt;
    this.substepsRun++;
  }

  _newton() {
    const S = this.sys;
    if (!S.ch) return;
    const x = this.x, g = this.g, rhs = S.rhs, fi = S.freeIdx, nV = this.mesh.nV;
    const idt2 = 1 / (this.dt * this.dt);
    for (let it = 0; it < this.opts.newtonIterations; it++) {
      g.fill(0);
      gradient(this, x, g);
      if (it > 0) for (let i = 0; i < nV; i++) { const m = this.mass[i] * idt2; for (let c = 0; c < 3; c++) g[3 * i + c] += m * (x[3 * i + c] - this.xt[3 * i + c]); }
      if (!this.dirty && !(this._pcgFail > 0)) {
        const r = pcgStep(this, x, g, K.PCG_MAX_ITER, K.PCG_RTOL);
        this.pcgIterations = r.iterations;
        if (r.converged) { if (r.iterations > K.PCG_REFACTOR_ITER) this.dirty = true; continue; }
        this._pcgFail = K.PCG_FAIL_HOLD; // the sheet is moving fast: factor directly for a few substeps
      } else if (this._pcgFail > 0) this._pcgFail--;
      assembleAndFactor(this, x);
      this._saveFactorState(x);
      this.dirty = false;
      for (let i = 0; i < nV; i++) {
        const k = fi[i];
        if (k < 0) continue;
        rhs[3 * k] = -g[3 * i]; rhs[3 * k + 1] = -g[3 * i + 1]; rhs[3 * k + 2] = -g[3 * i + 2];
      }
      S.ch.solve(rhs);
      for (let i = 0; i < nV; i++) {
        const k = fi[i];
        if (k < 0) continue;
        x[3 * i] += rhs[3 * k]; x[3 * i + 1] += rhs[3 * k + 1]; x[3 * i + 2] += rhs[3 * k + 2];
      }
    }
  }

  _projections() {
    const x = this.x, w = this.invMass, E = this.mesh.edges, L0 = this.mesh.edgeLen;
    // fold limit on fold hinges
    const H = this.mesh.hinges;
    for (let h = 0; h < this.mesh.nH; h++) {
      if (this.mesh.hingeKind[h] === HINGE_PANEL) continue;
      // the angle alone first; its gradient only for a hinge past its limit (the angle is the same either way)
      const raw = dihedral(x, H[4 * h], H[4 * h + 1], H[4 * h + 2], H[4 * h + 3], null);
      const th = unwrap(this.theta[h], raw);
      const C = Math.abs(th) - this.foldLimit[h];
      if (C <= 0) continue;
      dihedral(x, H[4 * h], H[4 * h + 1], H[4 * h + 2], H[4 * h + 3], G12);
      let den = 0;
      for (let i = 0; i < 4; i++) { const q = w[H[4 * h + i]]; den += q * (G12[3 * i] ** 2 + G12[3 * i + 1] ** 2 + G12[3 * i + 2] ** 2); }
      if (den === 0) continue;
      const lam = (-C * Math.sign(th)) / den;
      for (let i = 0; i < 4; i++) {
        const vv = H[4 * h + i], q = w[vv] * lam;
        x[3 * vv] += q * G12[3 * i]; x[3 * vv + 1] += q * G12[3 * i + 1]; x[3 * vv + 2] += q * G12[3 * i + 2];
      }
    }
    if (this.contact) {
      for (let pass = 0; pass < K.CONTACT_PASSES; pass++) {
        if (this.opts.contact) this._contacts = this.contact.project(x, this.xs, w);
        if (this.edgeContact) this._edgeContacts = this.edgeContact.project(x, this.xs, w);
        if (this.opts.ground) this._grounded = this.contact.ground(x, this.xs, w);
        // a pass that pushed nothing moved nothing: the passes left would repeat it exactly
        if (!(this.opts.contact && this._contacts) && !(this.edgeContact && this._edgeContacts) && !(this.opts.ground && this._grounded)) { this.passesSkipped += K.CONTACT_PASSES - 1 - pass; break; }
      }
    }
    // stretch guard after contact and friction, so they never leave the paper stretched
    const lim = K.STRAIN_LIMIT;
    // STRAIN_PASSES Gauss–Seidel passes as always; then more, up to STRAIN_PASSES_MAX, only while a pass
    // still had to move an edge by more than SETTLE_STRAIN of its length. A guard that settles within
    // STRAIN_PASSES gives exactly the positions it gave before; one that does not keeps going instead of
    // leaving the paper stretched (twist folds, Kresling collapses: the hand drives fight the membrane).
    // A pass that corrected no edge left the positions as they were, so every later pass would do the
    // same: stop there (bit-identical; most substeps of a settled sheet end after one pass).
    let moved = 1, touched = 1, worst = 0;
    for (let pass = 0; pass < K.STRAIN_PASSES_MAX && (moved || pass < K.STRAIN_PASSES); pass++) {
      if (!touched) { this.passesSkipped += Math.max(0, K.STRAIN_PASSES - pass); break; }
      moved = 0; touched = 0; worst = 0;
      for (let e = 0; e < this.mesh.nE; e++) {
      const a = E[2 * e], b = E[2 * e + 1];
      const wa = w[a], wb = w[b];
      if (wa + wb === 0) continue;
      const dx = x[3 * b] - x[3 * a], dy = x[3 * b + 1] - x[3 * a + 1], dz = x[3 * b + 2] - x[3 * a + 2];
      const L = hypot3(dx, dy, dz);
      const lo = L0[e] * (1 - K.COMPRESSION_LIMIT), hi = L0[e] * (1 + lim);
      if (L >= lo && L <= hi) continue;
      const target = L > hi ? hi : lo;
      const s = (L - target) / (L * (wa + wb));
      x[3 * a] += wa * s * dx; x[3 * a + 1] += wa * s * dy; x[3 * a + 2] += wa * s * dz;
      x[3 * b] -= wb * s * dx; x[3 * b + 1] -= wb * s * dy; x[3 * b + 2] -= wb * s * dz;
      touched = 1;
      const c = Math.abs(L - target) / L0[e];
      if (c > K.SETTLE_STRAIN) moved = 1;
      if (c > worst) worst = c;
      }
    }
    // the hand eases only on a real residual (HAND_EASE_STRAIN), not on round-off nudges
    this._easeHand(worst > K.HAND_EASE_STRAIN);
    // a final contact + ground pass: the stretch guard must not push layers through each other
    if (this.contact) {
      if (this.opts.contact) this._contacts = this.contact.project(x, this.xs, w);
      if (this.edgeContact) this._edgeContacts = this.edgeContact.project(x, this.xs, w);
      if (this.opts.ground) this._grounded = this.contact.ground(x, this.xs, w);
    }
  }

  /**
   * A hand gives way rather than stretch paper. When the stretch guard cannot settle (its last pass
   * still corrected an edge by more than HAND_EASE_STRAIN) while a hand drives creases, the drives are asking for a motion the sheet
   * cannot make without stretching (a twist fold, a Kresling collapse driven all at once): the hand
   * eases to half its stiffness, down to HAND_EASE_MIN. After HAND_CALM_SUBSTEPS settled substeps it
   * firms up again, doubling back to full. A world whose guard always settles never eases, so its
   * motion is unchanged. Test `hand-ease`.
   * @param {boolean} unsettled
   */
  _easeHand(unsettled) {
    let driving = false;
    for (let h = 0; h < this.mesh.nH; h++) if (this.driveOn[h]) { driving = true; break; }
    if (unsettled && driving) {
      this._handCalm = 0;
      if (this.handScale > K.HAND_EASE_MIN) { this.handScale = Math.max(K.HAND_EASE_MIN, 0.5 * this.handScale); this.dirty = true; }
    } else if (this.handScale < 1 && ++this._handCalm >= K.HAND_CALM_SUBSTEPS) {
      this._handCalm = 0;
      this.handScale = Math.min(1, 2 * this.handScale);
      this.dirty = true;
    }
  }

  /**
   * Perforation tearing: a weld whose force exceeds perf_factor·Y·tear_strain·(its length) breaks —
   * the most loaded one per substep, so a tear runs along the perforation. A perforation hinge
   * goes slack when the welds at both of its ends are broken.
   * @param {Float64Array} x
   */
  _tear(x) {
    const T = this.terms;
    if (!this._perfTerms) {
      this._perfTerms = [];
      for (let t = 0; t < T.count; t++) if (T.kind[t] === TK_PERF) this._perfTerms.push(t);
      /** @type {Map<number, number>} */
      this._perfOf = new Map();
      for (const t of this._perfTerms) this._perfOf.set(T.verts[T.start[t]], t);
    }
    if (!this._perfTerms.length) return;
    let worst = -1, ratio = 1;
    for (const t of this._perfTerms) {
      if (!T.active[t]) continue;
      const a = 3 * T.verts[T.start[t]], b = 3 * T.verts[T.start[t] + 1];
      const f = T.k[t] * hypot3(x[a] - x[b], x[a + 1] - x[b + 1], x[a + 2] - x[b + 2]);
      const r = f / T.info[t].fBreak;
      if (r > ratio) { ratio = r; worst = t; }
    }
    if (worst < 0) return;
    T.active[worst] = 0; T.k[worst] = 0;
    this.torn++;
    this.dirty = true;
    const H = this.mesh.hinges;
    const welded = (/** @type {number} */ v) => { const t = this._perfOf.get(v); return t === undefined || T.active[t] === 1; };
    for (let h = 0; h < this.mesh.nH; h++) {
      if (this.mesh.hingeKind[h] !== HINGE_PERF || this.hingeK[h] === 0) continue;
      if (!welded(H[4 * h]) && !welded(H[4 * h + 1])) { this.hingeK[h] = 0; this.driveK[h] = 0; }
    }
  }

  _hingeUpdate() {
    const x = this.x, H = this.mesh.hinges, plastic = this.opts.plasticity;
    for (let h = 0; h < this.mesh.nH; h++) {
      const th = unwrap(this.theta[h], dihedral(x, H[4 * h], H[4 * h + 1], H[4 * h + 2], H[4 * h + 3], null));
      this.theta[h] = th;
      if (!plastic) continue;
      const d = th - this.restTheta[h];
      const y = this.yieldRad[h];
      if (Math.abs(d) > y) { this.restTheta[h] = th - Math.sign(d) * y; this.memory[h] = 1; }
    }
  }

  /** Strings switch between slack and taut: the implicit matrix must follow. @param {Float64Array} x */
  _checkStrings(x) {
    const T = this.terms;
    const r = [0, 0, 0];
    for (let t = 0; t < T.count; t++) {
      if (T.kind[t] !== TK_STRING) continue;
      termResidual(T, t, x, r);
      const taut = hypot3(r[0], r[1], r[2]) > T.len[t] && !(T.gateOff && T.gateOff[t]) ? 1 : 0;
      T.active[t] = taut;
      if (taut !== this._stringTaut[t]) { this._stringTaut[t] = taut; this.dirty = true; }
    }
    void TERM_STRING;
  }

  /**
   * Remember what the current factorisation was built from (bit-exact snapshot/restore), in buffers
   * reused from one factorisation to the next (snapshots copy them). @param {Float64Array} x
   */
  _saveFactorState(x) {
    const T = this.terms, f = this._factorState;
    if (!f) {
      this._factorState = {
        x: Float64Array.from(x), driveOn: Uint8Array.from(this.driveOn), edgeComp: Uint8Array.from(this.edgeComp),
        active: Uint8Array.from(T.active), k: Float64Array.from(T.k), mode: Uint8Array.from(T.mode),
        verts: Int32Array.from(T.verts), c: Float64Array.from(T.c), dir: Float64Array.from(T.dir), len: Float64Array.from(T.len),
      };
      return;
    }
    f.x.set(x); f.driveOn.set(this.driveOn); f.edgeComp.set(this.edgeComp); f.active.set(T.active); f.k.set(T.k); f.mode.set(T.mode);
    f.verts.set(T.verts); f.c.set(T.c); f.dir.set(T.dir); f.len.set(T.len);
  }

  // ------------------------------------------------------------------ interaction

  /** Grab a vertex with a soft hand constraint toward `point`. Returns false for fixed vertices. @param {number} vertex @param {number[]} point */
  grab(vertex, point) {
    if (!(vertex >= 0 && vertex < this.mesh.nV) || this.invMass[vertex] === 0) return false;
    const T = this.terms, t = this.drivers.grabTerm;
    T.verts[T.start[t]] = vertex;
    this._grabSheet = this.mesh.vSheet[vertex];
    T.info[t].target = this.presentation.unpresent(point, this._grabSheet); // points arrive in render space
    T.k[t] = this.opts.grabStiffness;
    T.active[t] = 1;
    this.dirty = true;
    this._asleep = false;
    return true;
  }
  /** @param {number[]} point */
  moveGrab(point) { const inf = this.terms.info[this.drivers.grabTerm]; inf.target = this.presentation.unpresent(point, this._grabSheet ?? 0); this._asleep = false; }
  release() {
    const T = this.terms, t = this.drivers.grabTerm;
    if (T.active[t]) { T.active[t] = 0; T.k[t] = 0; this.dirty = true; }
    this._asleep = false;
  }

  /**
   * Ray pick against the simulated triangles. @param {number[]} o @param {number[]} d
   * @returns {{vertex:number, triangle:number, point:number[], sheet:number}|null}
   */
  pick(o, d) { return this.renderBuffers.pick(o, d); }

  /** Render mesh (reused buffers, recomputed only when `poseVersion` moved; or into `out`'s Float32Arrays). @param {{positions?: Float32Array, normals?: Float32Array}} [out] */
  render(out) { return this.renderBuffers.update(out); }

  /** Crease/score/perforation/cut polylines in the current pose (reused buffers, or `out.positions`). @param {{positions?: Float32Array}} [out] */
  creaseLines(out) { return this.renderBuffers.creaseLines(out); }

  /** Document vertex → (first) simulation vertex. */
  docVertexMap() { return this.mesh.docVertex; }

  /** Diagnostics. */
  stats() {
    const x = this.x, E = this.mesh.edges, L0 = this.mesh.edgeLen;
    let maxStrain = 0, maxCompression = 0, stretch = 0, bend = 0, crease = 0;
    for (let e = 0; e < this.mesh.nE; e++) {
      const a = 3 * E[2 * e], b = 3 * E[2 * e + 1];
      const L = hypot3(x[b] - x[a], x[b + 1] - x[a + 1], x[b + 2] - x[a + 2]);
      const s = (L - L0[e]) / L0[e];
      if (s > maxStrain) maxStrain = s;
      if (-s > maxCompression) maxCompression = -s;
      stretch += 0.5 * (L < L0[e] ? this.kCompFactor : 1) * this.kMem[e] * (L - L0[e]) ** 2;
    }
    for (let h = 0; h < this.mesh.nH; h++) {
      const en = 0.5 * this.hingeK[h] * (this.theta[h] - this.restTheta[h]) ** 2;
      if (this.mesh.hingeKind[h] === HINGE_PANEL) bend += en; else crease += en;
    }
    let nan = false;
    for (let i = 0; i < x.length; i++) if (!Number.isFinite(x[i])) { nan = true; break; }
    return {
      maxStrain, maxCompression, energy: { stretch, bend, crease }, contacts: this._contacts, edgeContacts: this._edgeContacts, grounded: this._grounded,
      substepsRun: this.substepsRun, factorizations: this.factorCount, pcgIterations: this.pcgIterations, asleep: !!this._asleep, time: this.time, finite: !nan,
      kinematicResidual: this.drivers.program ? this.drivers.program.residual : 0, tornWelds: this.torn,
      unheldWelds: this.gates.unheld(this),
    };
  }

  /** Bit-exact state capture (see state.js). */
  snapshot() { return snapshotWorld(this); }

  /** Restore a snapshot (bit-exact, including the factorisation). @param {any} s */
  restore(s) { restoreWorld(this, s); this.poseVersion++; }
}
