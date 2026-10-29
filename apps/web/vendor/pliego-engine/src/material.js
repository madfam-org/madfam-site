// @ts-check
/**
 * Stock → engine material. Reads ONLY the stock snapshot's `derived` block (engine units, written
 * by the kernel's `pliego.stock.derive`, the single source of the measurement → physics mapping).
 *
 * Bending anisotropy (engine.md §3.2): with Q11 = E_md/(1−ν²), Q22 = E_cd/(1−ν²),
 * Q12 = ν·√(Q11·Q22), Q66 = G12 = 0.387·√(E_md·E_cd) (Baum et al. 1981), D_ij = Q_ij t³/12, and
 * D11 = D_md, D22 = D_cd taken from the stock (measured values override the formula there):
 *   D(φ) = D11 cos⁴φ + 2(D12 + 2D66) sin²φ cos²φ + D22 sin⁴φ.
 * Hinge-based discrete bending sums D(φ_e)·κ_n² over edges; that sum smears anisotropy (an edge at
 * 60° to the grain also feels MD curvature). `bendingDeff(φ)` returns the deconvolved per-edge
 * stiffness whose edge-direction average reproduces D(φ) for every bending direction (Fourier
 * deconvolution of the cos⁴ kernel: harmonics m = 0, 2, 4 scaled by 1, 3/2, 6). Isotropic stock ⇒
 * D_eff ≡ D. Validated by test `E1-peirce` (CD without recalibration).
 */

export const DERIVED_KEYS = /** @type {const} */ ([
  'areal_density', 'thickness', 'E_md', 'E_cd', 'nu', 'D_md', 'D_cd', 'crease_k', 'crease_yield_deg',
  'crease_set_rate', 'score_factor', 'perf_factor', 'tear_strain', 'friction', 'collision_thickness',
]);

/**
 * @typedef {object} Material
 * @property {number} rhoA areal density g/mm²
 * @property {number} t thickness mm
 * @property {number} Emd @property {number} Ecd @property {number} nu
 * @property {number} D11 @property {number} D22 @property {number} D12 @property {number} D66
 * @property {number} creaseK per mm @property {number} yieldRad @property {number} setRate
 * @property {number} scoreFactor @property {number} perfFactor @property {number} tearStrain
 * @property {number} friction @property {number} contact collision thickness mm
 * @property {number} G12
 * @property {number} scoreYieldRad yield of scored hinges (derived.score_yield_deg, else crease_yield × score_factor)
 * @property {number} perfYieldRad yield of perforated hinges (crease_yield × perf_factor)
 * @property {[number, number, number]} dHarm Fourier coefficients of D(φ): D̂0, 2D̂2, 2D̂4 (cos 2φ, cos 4φ)
 */

/**
 * Build the engine material from a stock snapshot's derived block.
 * @param {Record<string, number>} derived
 * @returns {Material}
 */
export function fromDerived(derived) {
  for (const k of DERIVED_KEYS) {
    if (typeof derived[k] !== 'number' || !Number.isFinite(derived[k])) throw new Error(`material: derived.${k} missing or not a finite number`);
  }
  const t = derived.thickness, nu = derived.nu, Emd = derived.E_md, Ecd = derived.E_cd;
  const D11 = derived.D_md, D22 = derived.D_cd;
  const G12 = typeof derived.G12 === 'number' ? derived.G12 : 0.387 * Math.sqrt(Emd * Ecd);
  // A laminate stock (spec §5.40) writes its free stack's D12 / D66; a single sheet does not.
  const D12 = typeof derived.D12 === 'number' ? derived.D12 : nu * Math.sqrt(D11 * D22);
  const D66 = typeof derived.D66 === 'number' ? derived.D66 : (G12 * t * t * t) / 12;
  const H = D12 + 2 * D66;
  // D(φ) = D11 c⁴ + 2H s²c² + D22 s⁴ = a0 + a2 cos2φ + a4 cos4φ
  const a0 = (3 / 8) * (D11 + D22) + H / 4;
  const a2 = (D11 - D22) / 2;
  const a4 = (D11 + D22) / 8 - H / 4;
  return {
    rhoA: derived.areal_density, t, Emd, Ecd, nu, D11, D22, D12, D66, G12,
    creaseK: derived.crease_k, yieldRad: (derived.crease_yield_deg * Math.PI) / 180, setRate: derived.crease_set_rate,
    scoreFactor: derived.score_factor, perfFactor: derived.perf_factor, tearStrain: derived.tear_strain,
    friction: derived.friction, contact: derived.collision_thickness,
    scoreYieldRad: ((typeof derived.score_yield_deg === 'number' ? derived.score_yield_deg : derived.crease_yield_deg * derived.score_factor) * Math.PI) / 180,
    perfYieldRad: (derived.crease_yield_deg * derived.perf_factor * Math.PI) / 180,
    dHarm: [a0, a2, a4],
  };
}

/** Raw orthotropic D(φ), φ between MD and the curvature direction. @param {Material} m @param {number} phi */
export function bendingD(m, phi) {
  const c = Math.cos(phi), s = Math.sin(phi);
  const c2 = c * c, s2 = s * s;
  return m.D11 * c2 * c2 + 2 * (m.D12 + 2 * m.D66) * s2 * c2 + m.D22 * s2 * s2;
}

/** Deconvolved per-edge bending stiffness (see module doc), floored at 5 % of min(D11, D22). @param {Material} m @param {number} phi */
export function bendingDeff(m, phi) {
  const [a0, a2, a4] = m.dHarm;
  const v = a0 + 1.5 * a2 * Math.cos(2 * phi) + 6 * a4 * Math.cos(4 * phi);
  return Math.max(v, 0.05 * Math.min(m.D11, m.D22));
}

/**
 * Grain factor of a crease's stiffness: D(φ)/√(D11·D22), φ between MD and the curvature direction
 * (perpendicular to the crease). The stock's `crease_k` is √(D_md·D_cd)/L*, the geometric mean; a
 * crease parallel to the grain bends the paper in CD and is √(D_cd/D_md) of it, one across the grain
 * √(D_md/D_cd). Isotropic stock ⇒ 1. @param {Material} m @param {number} phi
 */
export function creaseGrainFactor(m, phi) {
  return bendingD(m, phi) / Math.sqrt(m.D11 * m.D22);
}

/** Membrane modulus along an edge at angle φ to MD (engine.md §3.2). @param {Material} m @param {number} phi */
export function membraneE(m, phi) {
  const c = Math.cos(phi), s = Math.sin(phi);
  const c2 = c * c, s2 = s * s;
  return 1 / ((c2 * c2) / m.Emd + (s2 * s2) / m.Ecd + (1 / m.G12 - (2 * m.nu) / m.Emd) * s2 * c2);
}

/**
 * Built-in stock snapshot shipped with the engine (spec §7: plain FOLD files load with stock `kami`).
 * Values from the rsE material table (kami 63 g/m², 72 µm, E 5.0/2.3 GPa [estimated]) using the
 * rsE §b formulas: D = E t³/(12(1−ν²)), ν = 0.293, crease_k = √(D_md·D_cd)/L*, L* = 200 t.
 */
export const BUILTIN_STOCKS = Object.freeze({
  kami: Object.freeze({
    name: { en: 'Kami 63 g/m²', es: 'Kami 63 g/m²', fr: 'Kami 63 g/m²', pt: 'Kami 63 g/m²' },
    gsm: 63,
    caliper_mm: 0.072,
    derived: Object.freeze(deriveEstimate({ gsm: 63, t: 0.072, Emd: 5.0e9, Ecd: 2.3e9, nu: 0.293, yieldDeg: 35, friction: 0.4, tear: 0.02 })),
    derived_basis: 'pliego-engine builtin (rsE §b formulas; kernel derive() is authoritative)',
  }),
});

/**
 * rsE §b estimate used for the built-in stock and test fixtures only (the kernel owns the real mapping).
 * @param {{gsm:number,t:number,Emd:number,Ecd:number,nu:number,yieldDeg:number,friction:number,tear:number,lstar?:number,score?:number,perf?:number}} p
 */
export function deriveEstimate(p) {
  const f = 12 * (1 - p.nu * p.nu);
  const Dmd = (p.Emd * p.t ** 3) / f, Dcd = (p.Ecd * p.t ** 3) / f;
  const Lstar = p.lstar ?? 200 * p.t;
  return {
    areal_density: p.gsm * 1e-6,
    thickness: p.t,
    E_md: p.Emd, E_cd: p.Ecd, nu: p.nu,
    D_md: Dmd, D_cd: Dcd,
    crease_k: Math.sqrt(Dmd * Dcd) / Lstar,
    crease_yield_deg: p.yieldDeg,
    crease_set_rate: 0.6,
    score_factor: p.score ?? 0.35,
    perf_factor: p.perf ?? 0.2,
    tear_strain: p.tear,
    friction: p.friction,
    collision_thickness: p.t,
  };
}
