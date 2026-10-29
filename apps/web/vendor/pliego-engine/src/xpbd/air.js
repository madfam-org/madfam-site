// @ts-check
/**
 * Air drag and deterministic wind (engine.md §3.5).
 * Per triangle: f = −½ ρ_air C_d A (v_rel·n)|v_rel·n| n, v_rel = v_tri − v_wind, shared ⅓ per vertex.
 * Wind = speed × (direction + turbulence): a frozen-turbulence sum of travelling sines whose phases
 * come from a seeded PRNG (never Math.random), so the same seed replays bit-identically.
 */
import { RHO_AIR, DRAG_CD } from '../constants.js';
import { mulberry32 } from '../geom.js';
import { hypot3 } from '../fastmath.js';

export class Wind {
  /** @param {number} seed @param {number[]} dir */
  constructor(seed, dir) {
    const rnd = mulberry32(seed);
    const L = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    this.dir = [dir[0] / L, dir[1] / L, dir[2] / L];
    /** @type {{f:number, a:number, ph:number[]}[]} */
    this.modes = [0.6, 1.4, 2.7, 4.3, 6.1].map((f, k) => ({ f, a: 0.35 / (k + 1), ph: [rnd() * 2 * Math.PI, rnd() * 2 * Math.PI, rnd() * 2 * Math.PI] }));
  }

  /** Wind velocity at a point and time (mm/s). @param {number} speed @param {number} t @param {number} x @param {number} y @param {number} z @param {number[]} out */
  at(speed, t, x, y, z, out) {
    if (speed === 0) { out[0] = 0; out[1] = 0; out[2] = 0; return; }
    const d = this.dir;
    let gx = 0, gy = 0, gz = 0;
    for (const m of this.modes) {
      const w = 2 * Math.PI * m.f;
      const kx = w / speed; // frozen turbulence travelling with the mean flow
      const s = (x * d[0] + y * d[1] + z * d[2]) * kx;
      gx += m.a * Math.sin(w * t - s + m.ph[0]);
      gy += m.a * Math.sin(w * t - s + m.ph[1]);
      gz += m.a * Math.sin(w * t - s + m.ph[2]);
    }
    out[0] = speed * (d[0] * (1 + gx) + 0.5 * gy * (1 - Math.abs(d[0])));
    out[1] = speed * (d[1] * (1 + gx) + 0.5 * gz * (1 - Math.abs(d[1])));
    out[2] = speed * (d[2] * (1 + gx) + 0.5 * gy * (1 - Math.abs(d[2])));
  }
}

const WV = [0, 0, 0];

/**
 * Add drag + wind forces to f (3·nV).
 * @param {import('../mesh.js').Mesh} mesh @param {Float64Array} x @param {Float64Array} v @param {Float64Array} f
 * @param {Wind} wind @param {number} speed mm/s @param {number} t
 */
export function addAirForces(mesh, x, v, f, wind, speed, t) {
  const T = mesh.tris;
  const k = 0.5 * RHO_AIR * DRAG_CD;
  for (let tr = 0; tr < mesh.nT; tr++) {
    const a = 3 * T[3 * tr], b = 3 * T[3 * tr + 1], c = 3 * T[3 * tr + 2];
    const ux = x[b] - x[a], uy = x[b + 1] - x[a + 1], uz = x[b + 2] - x[a + 2];
    const qx = x[c] - x[a], qy = x[c + 1] - x[a + 1], qz = x[c + 2] - x[a + 2];
    let nx = uy * qz - uz * qy, ny = uz * qx - ux * qz, nz = ux * qy - uy * qx;
    const n2 = hypot3(nx, ny, nz);
    if (n2 === 0) continue;
    const A = 0.5 * n2;
    nx /= n2; ny /= n2; nz /= n2;
    const cx = (x[a] + x[b] + x[c]) / 3, cy = (x[a + 1] + x[b + 1] + x[c + 1]) / 3, cz = (x[a + 2] + x[b + 2] + x[c + 2]) / 3;
    // still air (the usual case): skip the call, which returns zero (and boxes its four double arguments)
    if (speed === 0) { WV[0] = 0; WV[1] = 0; WV[2] = 0; } else wind.at(speed, t, cx, cy, cz, WV);
    const rx = (v[a] + v[b] + v[c]) / 3 - WV[0], ry = (v[a + 1] + v[b + 1] + v[c + 1]) / 3 - WV[1], rz = (v[a + 2] + v[b + 2] + v[c + 2]) / 3 - WV[2];
    const vn = rx * nx + ry * ny + rz * nz;
    const mag = (-k * A * vn * Math.abs(vn)) / 3;
    const fx = mag * nx, fy = mag * ny, fz = mag * nz;
    f[a] += fx; f[a + 1] += fy; f[a + 2] += fz;
    f[b] += fx; f[b + 1] += fy; f[b + 2] += fz;
    f[c] += fx; f[c + 1] += fy; f[c + 2] += fz;
  }
}
