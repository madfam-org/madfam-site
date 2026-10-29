// @ts-check
/**
 * Bit-exact World snapshots (engine.md §5–6): positions, velocities, hinge state, drives, terms,
 * drivers, contact sidedness and the inputs of the current factorisation (restore rebuilds the
 * identical factorisation, so a restored world replays bit-identically).
 */
import { assembleAndFactor } from './implicit.js';

/** @param {any} w */
export function snapshotWorld(w) {
  const T = w.terms;
  return {
    x: Float64Array.from(w.x), v: Float64Array.from(w.v), theta: Float64Array.from(w.theta),
    restTheta: Float64Array.from(w.restTheta), memory: Uint8Array.from(w.memory), hingeK: Float64Array.from(w.hingeK), driveK: Float64Array.from(w.driveK), torn: w.torn, edgeComp: Uint8Array.from(w.edgeComp),
    driveOn: Uint8Array.from(w.driveOn), driveTarget: Float64Array.from(w.driveTarget),
    fixedTarget: Float64Array.from(w.fixedTarget), userForce: Float64Array.from(w.userForce),
    time: w.time, acc: w._acc, substepsRun: w.substepsRun, framesRun: w.framesRun, dirty: w.dirty, asleep: !!w._asleep, quiet: w._quiet, pcgFail: w._pcgFail,
    stringTaut: Uint8Array.from(w._stringTaut), handScale: w.handScale, handCalm: w._handCalm,
    terms: { active: Uint8Array.from(T.active), k: Float64Array.from(T.k), mode: Uint8Array.from(T.mode), verts: Int32Array.from(T.verts), info: T.info.map((/** @type {any} */ i) => ({ target: i.target ? i.target.slice() : undefined, s: i.s, driven: i.driven, offset: i.offset,
      unheld: i.unheld, slid: i.slid, held: i.held ? i.held.slice() : undefined, since: i.since })),
      gateOff: T.gateOff ? Uint8Array.from(T.gateOff) : null, coef: Float64Array.from(T.coef) },
    gates: w.gates ? w.gates.state() : [],
    drivers: { value: [...w.drivers.value], goal: [...w.drivers.goal], seqPos: w.drivers.seqPos, entry: [...w.drivers.entry], entryStep: w.drivers.entryStep, wind: w.drivers.wind,
      program: w.drivers.program ? { rho: Float64Array.from(w.drivers.program.rho), free: Uint8Array.from(w.drivers.program.free), entry: Float64Array.from(w.drivers.program.entry), entryStep: w.drivers.program.entryStep } : null,
      kin: w.drivers.kin ? { a: Float64Array.from(w.drivers.kin.a), b: Float64Array.from(w.drivers.kin.b), n: w.drivers.kin.n, i: w.drivers.kin.i } : null },
    contactSide: w.contact ? w.contact.sideEntries() : [],
    edgeSide: w.edgeContact ? [...w.edgeContact.side] : [],
    factor: w._factorState ? copyFactor(w._factorState) : null,
    factorDir: Float64Array.from(w.factorDir),
  };
}

/** Restore a state captured by snapshotWorld() (bit-exact, including the factorisation). @param {any} w @param {any} s */
export function restoreWorld(w, s) {
  w.x.set(s.x); w.v.set(s.v); w.theta.set(s.theta); w.restTheta.set(s.restTheta); w.memory.set(s.memory);
  w.hingeK.set(s.hingeK); w.driveK.set(s.driveK); w.torn = s.torn;
  w.fixedTarget.set(s.fixedTarget); w.userForce.set(s.userForce);
  w.time = s.time; w._acc = s.acc; w.substepsRun = s.substepsRun; w.framesRun = s.framesRun;
  w._stringTaut.set(s.stringTaut);
  w.handScale = s.handScale ?? 1; w._handCalm = s.handCalm ?? 0;
  const T = w.terms;
  s.terms.info.forEach((/** @type {any} */ i, /** @type {number} */ t) => {
    if (i.target) T.info[t].target = i.target.slice(); T.info[t].s = i.s; T.info[t].driven = i.driven; T.info[t].offset = i.offset;
    T.info[t].unheld = i.unheld; T.info[t].slid = i.slid; if (i.held) T.info[t].held = i.held.slice(); T.info[t].since = i.since;
  });
  if (s.terms.gateOff && T.gateOff) T.gateOff.set(s.terms.gateOff);
  T.coef.set(s.terms.coef);
  if (w.gates) w.gates.restore(w, s.gates);
  w.drivers.value = new Map(s.drivers.value); w.drivers.goal = new Map(s.drivers.goal);
  w.drivers.seqPos = s.drivers.seqPos; w.drivers.entry = new Map(s.drivers.entry); w.drivers.entryStep = s.drivers.entryStep; w.drivers.wind = s.drivers.wind;
  const pr = w.drivers.program, ps = s.drivers.program;
  if (pr && ps) { pr.rho.set(ps.rho); pr.free = Uint8Array.from(ps.free); pr.entry = Float64Array.from(ps.entry); pr.entryStep = ps.entryStep; }
  if (s.drivers.kin) w.drivers.kin = { ...s.drivers.kin, a: Float64Array.from(s.drivers.kin.a), b: Float64Array.from(s.drivers.kin.b), verts: w.drivers.kinVerts ?? w.drivers.program?.ownedVertices(w.mesh) ?? [] };
  if (w.contact) w.contact.restoreSides(s.contactSide);
  if (w.edgeContact) w.edgeContact.side = new Map(s.edgeSide ?? []);
  // rebuild the factorisation exactly as it was
  if (s.factor && w.sys.ch) {
    w.edgeComp.set(s.factor.edgeComp);
    const f = s.factor;
    w.driveOn.set(f.driveOn); T.active.set(f.active); T.k.set(f.k); T.mode.set(f.mode); T.verts.set(f.verts); T.c.set(f.c); T.dir.set(f.dir); T.len.set(f.len);
    assembleAndFactor(w, f.x);
    w._factorState = copyFactor(f); // the World refills its own buffers; the snapshot stays as it was
  }
  w.driveOn.set(s.driveOn); w.driveTarget.set(s.driveTarget);
  T.active.set(s.terms.active); T.k.set(s.terms.k); T.mode.set(s.terms.mode); T.verts.set(s.terms.verts);
  w.factorDir.set(s.factorDir);
  w.edgeComp.set(s.edgeComp);
  w.dirty = s.dirty;
  w._asleep = s.asleep;
  w._quiet = s.quiet;
  w._pcgFail = s.pcgFail;
}

/** A deep copy of a World's factorisation inputs (the World reuses its buffers). @param {any} f */
function copyFactor(f) {
  return {
    x: Float64Array.from(f.x), driveOn: Uint8Array.from(f.driveOn), edgeComp: Uint8Array.from(f.edgeComp), active: Uint8Array.from(f.active),
    k: Float64Array.from(f.k), mode: Uint8Array.from(f.mode), verts: Int32Array.from(f.verts), c: Float64Array.from(f.c), dir: Float64Array.from(f.dir), len: Float64Array.from(f.len),
  };
}
