// @ts-check
/**
 * The implicit block of Tier C: stiff sheet energies solved jointly each substep.
 *
 * Energies (engine units): membrane springs ½k(l − l₀)², hinges ½k(θ − θ̄)² (+ ½k_d(θ − θ*)² while a
 * hand drives them, + the bending damping ½(β/Δt)k(θ − θ_start)², a backward-Euler Rayleigh term), and point terms ½k|Π r|² (glue welds, pivots, sliders, drive points, grabs) or
 * ½k(|r| − L)² for taut strings. Each substep takes one Gauss–Newton step from the inertial
 * prediction x̃: H δ = −∇E(x̃), with H = M/Δt² + Σ k ∇C ∇Cᵀ factorised by `BlockCholesky`.
 *
 * Why not Gauss–Seidel XPBD for these: paper's mesh-scale bending stiffness is huge relative to its
 * mass (k_b Δt² |∇θ|²/m ≈ 60 for copy paper at h = 6 mm, S = 20), so one GS sweep per substep does
 * not converge and the equilibrium saturates at a solver-dependent stiffness (measured: a cantilever
 * 15× too soft), and GS hard membranes stretch by ~N g Δt²/h along tension paths. With the joint
 * solve the steady state is exact (∇E = f_ext) whatever the factorisation age, because H only
 * scales the step. This is XPBD's compliant-constraint formulation (α = 1/k, λ reset per substep)
 * with the per-substep linear system solved directly instead of by one GS sweep.
 */
import { BlockCholesky } from '../linalg/blockchol.js';
import { dihedral } from './dihedral.js';
import { hypot3 } from '../fastmath.js';

/** Strain below which an edge switches to the compression model (hysteresis, see gradient()). */
const MODEL_COMP_ENTER = 1e-4;

export const SLOT_NONE = -2147483648;

/** Term projector modes. */
export const TERM_FULL = 0, TERM_PERP = 1, TERM_STRING = 2;

/**
 * Build the block pattern over free vertices and precompute slots.
 * @param {any} w World
 */
export function buildSystem(w) {
  const { nV } = w.mesh;
  const freeIdx = new Int32Array(nV).fill(-1);
  let nFree = 0;
  for (let v = 0; v < nV; v++) if (w.invMass[v] > 0) freeIdx[v] = nFree++;
  /** @type {number[]} */
  const pairs = [];
  const E = w.mesh.edges;
  for (let e = 0; e < w.mesh.nE; e++) {
    const a = freeIdx[E[2 * e]], b = freeIdx[E[2 * e + 1]];
    if (a >= 0 && b >= 0) pairs.push(a, b);
  }
  const Hg = w.mesh.hinges;
  for (let h = 0; h < w.mesh.nH; h++) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const a = freeIdx[Hg[4 * h + i]], b = freeIdx[Hg[4 * h + j]];
    if (a >= 0 && b >= 0 && a !== b) pairs.push(a, b);
  }
  const T = w.terms;
  for (let t = 0; t < T.count; t++) for (let i = T.start[t]; i < T.start[t + 1]; i++) for (let j = i + 1; j < T.start[t + 1]; j++) {
    const a = freeIdx[T.verts[i]], b = freeIdx[T.verts[j]];
    if (a >= 0 && b >= 0 && a !== b) pairs.push(a, b);
  }
  const ch = nFree > 0 ? new BlockCholesky(nFree, Int32Array.from(pairs)) : null;
  const slot = (/** @type {number} */ a, /** @type {number} */ b) => {
    const fa = freeIdx[a], fb = freeIdx[b];
    return fa >= 0 && fb >= 0 && ch ? ch.slot(fa, fb) : SLOT_NONE;
  };
  const diagSlot = new Int32Array(nV).fill(SLOT_NONE);
  for (let v = 0; v < nV; v++) diagSlot[v] = slot(v, v);
  const edgeSlot = new Int32Array(w.mesh.nE);
  for (let e = 0; e < w.mesh.nE; e++) edgeSlot[e] = slot(E[2 * e], E[2 * e + 1]);
  const hingeSlot = new Int32Array(6 * w.mesh.nH);
  for (let h = 0; h < w.mesh.nH; h++) {
    let q = 0;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) hingeSlot[6 * h + q++] = Hg[4 * h + i] === Hg[4 * h + j] ? SLOT_NONE : slot(Hg[4 * h + i], Hg[4 * h + j]);
  }
  /** @type {number[]} */
  const ts = [];
  const termSlotStart = new Int32Array(T.count + 1);
  for (let t = 0; t < T.count; t++) {
    termSlotStart[t] = ts.length;
    for (let i = T.start[t]; i < T.start[t + 1]; i++) for (let j = i + 1; j < T.start[t + 1]; j++) ts.push(T.verts[i] === T.verts[j] ? SLOT_NONE : slot(T.verts[i], T.verts[j]));
  }
  termSlotStart[T.count] = ts.length;
  return { freeIdx, nFree, ch, diagSlot, edgeSlot, hingeSlot, termSlot: Int32Array.from(ts), termSlotStart, rhs: new Float64Array(3 * nFree) };
}

const BLK = new Float64Array(9);
const G12 = new Float64Array(12);

/** Add k·a·bᵀ (3-vectors) at a slot; diagonal slots must be symmetric (a = b). */
function addOuter(/** @type {BlockCholesky} */ ch, /** @type {number} */ s, /** @type {number} */ k, /** @type {ArrayLike<number>} */ a, /** @type {number} */ ao, /** @type {ArrayLike<number>} */ b, /** @type {number} */ bo) {
  if (s === SLOT_NONE) return;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) BLK[3 * r + c] = k * a[ao + r] * b[bo + c];
  ch.add(s, BLK);
}

/**
 * Assemble H = M/Δt² + Σ k ∇C∇Cᵀ at positions x and factorise.
 * @param {any} w World @param {Float64Array} x
 */
export function assembleAndFactor(w, x) {
  const S = w.sys;
  const ch = /** @type {BlockCholesky} */(S.ch);
  if (!ch) return;
  ch.clear();
  const { nV } = w.mesh;
  const idt2 = 1 / (w.dt * w.dt);
  for (let v = 0; v < nV; v++) {
    const s = S.diagSlot[v];
    if (s === SLOT_NONE) continue;
    const m = w.mass[v] * idt2;
    BLK.fill(0); BLK[0] = m; BLK[4] = m; BLK[8] = m;
    ch.add(s, BLK);
  }
  const E = w.mesh.edges, kM = w.kMem;
  const u = [0, 0, 0];
  for (let e = 0; e < w.mesh.nE; e++) {
    const a = E[2 * e], b = E[2 * e + 1];
    let dx = x[3 * b] - x[3 * a], dy = x[3 * b + 1] - x[3 * a + 1], dz = x[3 * b + 2] - x[3 * a + 2];
    const L = hypot3(dx, dy, dz) || 1;
    u[0] = dx / L; u[1] = dy / L; u[2] = dz / L;
    // model stiffness of the branch the edge is on. Compression is modelled at
    // max(MEMBRANE_COMPRESSION, MODEL_COMPRESSION)·k: never below the true stiffness (an
    // underestimate overshoots when an edge re-enters tension), and only 4× below tension so the
    // branch switch of edges near zero strain does not wreck the stale preconditioner
    const k = w.edgeComp[e] ? w.kCompModel * kM[e] : kM[e];
    addOuter(ch, S.diagSlot[a], k, u, 0, u, 0);
    addOuter(ch, S.diagSlot[b], k, u, 0, u, 0);
    addOuter(ch, S.edgeSlot[e], -k, u, 0, u, 0);
    w.factorDir[3 * e] = u[0]; w.factorDir[3 * e + 1] = u[1]; w.factorDir[3 * e + 2] = u[2];
    void dx; void dy; void dz;
  }
  const Hg = w.mesh.hinges;
  for (let h = 0; h < w.mesh.nH; h++) {
    const k = w.hingeK[h] * (1 + w.bendDamp) + (w.driveOn[h] ? w.driveK[h] * w.handScale : 0);
    if (k === 0) continue;
    dihedral(x, Hg[4 * h], Hg[4 * h + 1], Hg[4 * h + 2], Hg[4 * h + 3], G12);
    for (let i = 0; i < 4; i++) addOuter(ch, S.diagSlot[Hg[4 * h + i]], k, G12, 3 * i, G12, 3 * i);
    let q = 0;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) addOuter(ch, S.hingeSlot[6 * h + q++], k, G12, 3 * i, G12, 3 * j);
  }
  const T = w.terms;
  const P = new Float64Array(9);
  for (let t = 0; t < T.count; t++) {
    if (!T.active[t] || T.k[t] === 0) continue;
    termProjector(T, t, x, P);
    const k = T.k[t];
    const s0 = T.start[t], s1 = T.start[t + 1];
    for (let i = s0; i < s1; i++) {
      const s = S.diagSlot[T.verts[i]];
      if (s !== SLOT_NONE) { for (let q = 0; q < 9; q++) BLK[q] = k * T.coef[i] * T.coef[i] * P[q]; ch.add(s, BLK); }
    }
    let q = S.termSlotStart[t];
    for (let i = s0; i < s1; i++) for (let j = i + 1; j < s1; j++) {
      const s = S.termSlot[q++];
      if (s === SLOT_NONE) continue;
      for (let r = 0; r < 9; r++) BLK[r] = k * T.coef[i] * T.coef[j] * P[r];
      ch.add(s, BLK);
    }
  }
  ch.factor();
  w.factorCount++;
}

/**
 * Projector of a term at x (row-major 3×3): identity, I − d̂d̂ᵀ (slider), or êêᵀ (taut string).
 * @param {any} T @param {number} t @param {Float64Array} x @param {Float64Array} P
 */
export function termProjector(T, t, x, P) {
  const mode = T.mode[t];
  P.fill(0);
  if (mode === TERM_FULL) { P[0] = 1; P[4] = 1; P[8] = 1; return; }
  if (mode === TERM_PERP) {
    const d = T.dir;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) P[3 * r + c] = (r === c ? 1 : 0) - d[3 * t + r] * d[3 * t + c];
    return;
  }
  // string: ê = r/|r|
  const r = [0, 0, 0];
  termResidual(T, t, x, r);
  const L = hypot3(r[0], r[1], r[2]) || 1;
  for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) P[3 * a + c] = (r[a] / L) * (r[c] / L);
}

/** r = Σ coef·x + c. @param {any} T @param {number} t @param {Float64Array} x @param {number[]} r */
export function termResidual(T, t, x, r) {
  r[0] = T.c[3 * t]; r[1] = T.c[3 * t + 1]; r[2] = T.c[3 * t + 2];
  for (let i = T.start[t]; i < T.start[t + 1]; i++) {
    const v = 3 * T.verts[i], c = T.coef[i];
    r[0] += c * x[v]; r[1] += c * x[v + 1]; r[2] += c * x[v + 2];
  }
}

/**
 * Accumulate ∇E(x) into g (3·nV, zeroed by the caller). Also caches the unwrapped hinge angles
 * (`w.thetaPred`), membrane directions (`w.edgeDir`) and hinge gradients (`w.hingeGrad`) for PCG.
 * @param {any} w World @param {Float64Array} x @param {Float64Array} g
 */
export function gradient(w, x, g) {
  const E = w.mesh.edges, kM = w.kMem, L0 = w.mesh.edgeLen, U = w.edgeDir, HG = w.hingeGrad;
  for (let e = 0; e < w.mesh.nE; e++) {
    const a = 3 * E[2 * e], b = 3 * E[2 * e + 1];
    const dx = x[b] - x[a], dy = x[b + 1] - x[a + 1], dz = x[b + 2] - x[a + 2];
    const L = hypot3(dx, dy, dz);
    if (L === 0) continue;
    U[3 * e] = dx / L; U[3 * e + 1] = dy / L; U[3 * e + 2] = dz / L;
    // model branch with hysteresis: enter the compression model below −MODEL_COMP_ENTER strain,
    // leave it as soon as the edge is in tension (the model never underestimates a stretched edge)
    const strain = (L - L0[e]) / L0[e];
    if (w.edgeComp[e]) { if (strain >= 0) w.edgeComp[e] = 0; } else if (strain < -MODEL_COMP_ENTER) w.edgeComp[e] = 1;
    w.edgeK[e] = w.edgeComp[e] ? w.kCompModel * kM[e] : kM[e];
    const d = L - L0[e];
    const f = ((d < 0 ? w.kCompFactor * kM[e] : kM[e]) * d) / L;
    g[a] -= f * dx; g[a + 1] -= f * dy; g[a + 2] -= f * dz;
    g[b] += f * dx; g[b + 1] += f * dy; g[b + 2] += f * dz;
  }
  const Hg = w.mesh.hinges;
  for (let h = 0; h < w.mesh.nH; h++) {
    const raw = dihedral(x, Hg[4 * h], Hg[4 * h + 1], Hg[4 * h + 2], Hg[4 * h + 3], G12);
    const th = unwrap(w.theta[h], raw);
    w.thetaPred[h] = th;
    HG.set(G12, 12 * h);
    // bending damping: β·k·θ̇ with θ̇ = (θ − θ at the substep start)/Δt (w.theta holds it until _hingeUpdate)
    let f = w.hingeK[h] * (th - w.restTheta[h] + w.bendDamp * (th - w.theta[h]));
    if (w.driveOn[h]) f += w.driveK[h] * w.handScale * (th - w.driveTarget[h]);
    if (f === 0) continue;
    for (let i = 0; i < 4; i++) {
      const v = 3 * Hg[4 * h + i];
      g[v] += f * G12[3 * i]; g[v + 1] += f * G12[3 * i + 1]; g[v + 2] += f * G12[3 * i + 2];
    }
  }
  const T = w.terms;
  const r = [0, 0, 0];
  const P = new Float64Array(9);
  for (let t = 0; t < T.count; t++) {
    if (!T.active[t] || T.k[t] === 0) continue;
    termResidual(T, t, x, r);
    let fx, fy, fz;
    if (T.mode[t] === TERM_STRING) {
      const L = hypot3(r[0], r[1], r[2]);
      const ex = L - T.len[t];
      if (ex <= 0) continue;
      const s = (T.k[t] * ex) / L;
      fx = s * r[0]; fy = s * r[1]; fz = s * r[2];
    } else {
      termProjector(T, t, x, P);
      const k = T.k[t];
      fx = k * (P[0] * r[0] + P[1] * r[1] + P[2] * r[2]);
      fy = k * (P[3] * r[0] + P[4] * r[1] + P[5] * r[2]);
      fz = k * (P[6] * r[0] + P[7] * r[1] + P[8] * r[2]);
    }
    for (let i = T.start[t]; i < T.start[t + 1]; i++) {
      const v = 3 * T.verts[i], c = T.coef[i];
      g[v] += c * fx; g[v + 1] += c * fy; g[v + 2] += c * fz;
    }
  }
}

/** Continue an angle from the previous unwrapped value. @param {number} prev @param {number} raw */
export function unwrap(prev, raw) {
  let d = raw - prev;
  d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
  return prev + d;
}
