// @ts-check
/** Small dense linear algebra for Tier R (rotation matrices, Jacobi eigenvalues, SPD solves). */

/** Rotation about unit axis a by angle t (row-major 3×3). @param {number[]} a @param {number} t */
export function rot(a, t) {
  const c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  const [x, y, z] = a;
  return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C];
}

/** @param {number[]} A @param {number[]} B */
export function mul3(A, B) {
  const o = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[3 * i + j] = A[3 * i] * B[j] + A[3 * i + 1] * B[3 + j] + A[3 * i + 2] * B[6 + j];
  return o;
}

/** @param {number[]} A @param {number[]} v */
export function mv3(A, v) {
  return [A[0] * v[0] + A[1] * v[1] + A[2] * v[2], A[3] * v[0] + A[4] * v[1] + A[5] * v[2], A[6] * v[0] + A[7] * v[1] + A[8] * v[2]];
}

/** vee(log R): rotation vector of a rotation matrix. @param {number[]} R */
export function logVee(R) {
  const tr = R[0] + R[4] + R[8];
  const c = Math.max(-1, Math.min(1, (tr - 1) / 2));
  const th = Math.acos(c);
  const w = [R[7] - R[5], R[2] - R[6], R[3] - R[1]];
  if (th < 1e-8) return [w[0] / 2, w[1] / 2, w[2] / 2];
  if (Math.PI - th < 1e-6) {
    // near π: axis from the diagonal
    const ax = [Math.sqrt(Math.max(0, (R[0] + 1) / 2)), Math.sqrt(Math.max(0, (R[4] + 1) / 2)), Math.sqrt(Math.max(0, (R[8] + 1) / 2))];
    if (R[1] < 0) ax[1] = -ax[1];
    if (R[2] < 0) ax[2] = -ax[2];
    return [ax[0] * th, ax[1] * th, ax[2] * th];
  }
  const k = th / (2 * Math.sin(th));
  return [w[0] * k, w[1] * k, w[2] * k];
}

/**
 * Symmetric eigenvalues (cyclic Jacobi). A is n×n row-major (copied).
 * @param {number[]|Float64Array} A0 @param {number} n @returns {number[]}
 */
export function symEigenvalues(A0, n) {
  const A = Float64Array.from(A0);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p * n + q] ** 2;
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = A[p * n + q];
      if (Math.abs(apq) < 1e-300) continue;
      const app = A[p * n + p], aqq = A[q * n + q];
      const tau = (aqq - app) / (2 * apq);
      const t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
      const c = 1 / Math.sqrt(1 + t * t), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k * n + p], akq = A[k * n + q];
        A[k * n + p] = c * akp - s * akq; A[k * n + q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p * n + k], aqk = A[q * n + k];
        A[p * n + k] = c * apk - s * aqk; A[q * n + k] = s * apk + c * aqk;
      }
    }
  }
  const ev = [];
  for (let i = 0; i < n; i++) ev.push(A[i * n + i]);
  return ev.sort((a, b) => b - a);
}

/** Solve SPD system M x = b (Cholesky, dense n×n row-major). @param {number[]|Float64Array} M @param {number[]} b @param {number} n */
export function solveSPD(M, b, n) {
  const L = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    let s = M[j * n + j];
    for (let k = 0; k < j; k++) s -= L[j * n + k] ** 2;
    if (!(s > 0)) throw new Error('solveSPD: not positive definite');
    L[j * n + j] = Math.sqrt(s);
    for (let i = j + 1; i < n; i++) {
      let t = M[i * n + j];
      for (let k = 0; k < j; k++) t -= L[i * n + k] * L[j * n + k];
      L[i * n + j] = t / L[j * n + j];
    }
  }
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i * n + k] * y[k]; y[i] = s / L[i * n + i]; }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k]; x[i] = s / L[i * n + i]; }
  return x;
}
