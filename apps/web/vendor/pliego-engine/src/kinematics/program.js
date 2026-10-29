// @ts-check
/**
 * Kinematic fold program (spec §5.6, `pliego:sequence.mode = "kinematic"`): faces stay rigid and
 * the folded state is computed exactly (Tier R) while the World keeps simulating everything else.
 *
 * State: the program starts from the signed dihedrals measured on the initial frame. A step lists
 * the creases it moves; unlisted creases hold their angle; `release` frees a crease at its current
 * angle. In-between states are rigid motions: the listed crease with the largest travel is eased
 * from its start to its target (smoothstep), and loop closure (damped least squares from the linear
 * blend of the other listed angles) solves every other free angle, so the faces never tear apart.
 * Sheets without interior vertices have no closure condition and follow the blend exactly.
 * The worst closure residual of the last update is exposed as `residual` (World.stats()).
 */
import { FaceTree, LoopClosure, flat3, faceRigidPose } from './facetree.js';
import { mv3 } from './linalg.js';

const DEG = Math.PI / 180;

export class KinematicProgram {
  /** @param {any} w World (doc, mesh, theta of the initial frame) */
  constructor(w) {
    const doc = w.doc;
    this.steps = doc.sequence.steps;
    /** sheets the program moves: physical sheets owning any target/release edge */
    const owned = new Set();
    for (const st of this.steps) {
      for (const [e] of st.targets) owned.add(doc.eSheet[e]);
      for (const e of st.release ?? []) owned.add(doc.eSheet[e]);
    }
    /** @type {{s:number, tree:FaceTree, loop:LoopClosure}[]} */
    this.sheets = [...owned].filter((s) => !doc.sheets[s].kinematic).sort((a, b) => a - b).map((s) => ({ s, tree: new FaceTree(doc, s), loop: new LoopClosure(doc, s) }));
    this.sheetSet = new Set(this.sheets.map((x) => x.s));
    // root faces keep their pose from the initial frame (or placement)
    const X = new Float64Array(3 * doc.nV);
    for (let v = 0; v < doc.nV; v++) { const mv = w.mesh.docVertex[v]; if (mv >= 0) for (let c = 0; c < 3; c++) X[3 * v + c] = w.X0[3 * mv + c]; }
    /** @type {Map<number, {R:number[], t:number[]}>} */
    this.rootPose = new Map(this.sheets.map((sh) => [sh.s, faceRigidPose(doc, sh.tree.root, X)]));
    // start angles: measured on the initial frame (mesh hinge mean per document edge)
    this.rho = new Float64Array(doc.nE);
    const sum = new Float64Array(doc.nE), cnt = new Int32Array(doc.nE);
    for (let h = 0; h < w.mesh.nH; h++) { const e = w.mesh.hingeDoc[h]; if (e >= 0) { sum[e] += w.theta[h]; cnt[e]++; } }
    for (let e = 0; e < doc.nE; e++) if (cnt[e]) this.rho[e] = sum[e] / cnt[e];
    this.rho0 = Float64Array.from(this.rho);
    this.free = new Uint8Array(doc.nE);
    this.entryStep = -1;
    /** @type {Float64Array} */
    this.entry = Float64Array.from(this.rho);
    this.residual = 0;
  }

  /** Vertices the program poses (all vertices of its sheets). @param {any} mesh */
  ownedVertices(mesh) {
    const out = [];
    for (let v = 0; v < mesh.nV; v++) if (this.sheetSet.has(mesh.vSheet[v])) out.push(v);
    return out;
  }

  /**
   * Pose for sequence position p (0…N, fractional mid-step). Writes fixed targets of owned vertices.
   * @param {any} w World @param {number} p
   */
  apply(w, p) {
    const N = this.steps.length;
    const k = Math.min(N, Math.floor(p + 1e-12));
    const f = k < N ? p - k : 0;
    // targets held from completed steps
    const held = new Map();
    const free = new Uint8Array(this.free.length);
    for (let i = 0; i < k; i++) {
      for (const e of this.steps[i].release ?? []) { held.delete(e); free[e] = 1; }
      for (const [e, a] of this.steps[i].targets) { held.set(e, a * DEG); free[e] = 0; }
    }
    if (this.entryStep !== k) { this.entry = Float64Array.from(this.rho); this.entryStep = k; }
    const listed = new Map();
    if (k < N && f > 0) {
      for (const e of this.steps[k].release ?? []) { held.delete(e); free[e] = 1; }
      for (const [e, a] of this.steps[k].targets) { listed.set(e, a * DEG); free[e] = 0; }
    }
    const s = f * f * (3 - 2 * f);
    const guess = Float64Array.from(this.rho);
    for (const [e, a] of held) guess[e] = a;
    let driver = -1, travel = -1;
    for (const [e, a] of listed) {
      const a0 = this.entry[e];
      guess[e] = a0 + s * (a - a0);
      if (Math.abs(a - a0) > travel) { travel = Math.abs(a - a0); driver = e; }
    }
    this.residual = 0;
    for (const sh of this.sheets) {
      let rho = guess;
      if (sh.loop.loops.length) {
        const fixed = new Map();
        for (const e of sh.loop.vars) {
          if (free[e] || (listed.has(e) && e !== driver)) continue; // solved
          fixed.set(e, guess[e]); // driver, held and unlisted creases
        }
        if (fixed.size < sh.loop.vars.length) {
          const r = sh.loop.solve(guess, fixed, { tol: 1e-11, maxIter: 30 });
          rho = r.rho;
          this.residual = Math.max(this.residual, r.residual);
        } else {
          const r = sh.loop.residual(guess);
          this.residual = Math.max(this.residual, Math.sqrt(r.reduce((q, x) => q + x * x, 0)));
        }
      }
      for (const e of sh.loop.vars) this.rho[e] = rho[e];
      for (let e = 0; e < this.rho.length; e++) if (w.doc.eSheet[e] === sh.s && !sh.loop.varOf.has(e)) this.rho[e] = guess[e];
      // pose mesh vertices by their faces' rigid transforms
      const T = sh.tree.transforms(this.rho, this.rootPose.get(sh.s));
      const m = w.mesh, X = w.fixedTarget;
      for (let v = 0; v < m.nV; v++) {
        if (m.vSheet[v] !== sh.s) continue;
        const tr = T.get(m.vFace[v]);
        if (!tr) continue;
        const sheet = w.doc.sheets[sh.s];
        void sheet;
        const p3 = mv3(tr.R, [m.uv[2 * v], 0, -m.uv[2 * v + 1]]);
        X[3 * v] = p3[0] + tr.t[0]; X[3 * v + 1] = p3[1] + tr.t[1]; X[3 * v + 2] = p3[2] + tr.t[2];
      }
    }
    this.free = free;
    void flat3;
  }
}
