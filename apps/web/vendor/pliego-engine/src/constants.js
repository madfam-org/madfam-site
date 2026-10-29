// @ts-check
/**
 * Calibration and numerical constants of the engine. Each calibrated value names the test that
 * fixed it. Engine units: mm, g, s (force g·mm/s² = µN, energy g·mm²/s² = nJ), radians inside.
 */

/** Gravity, mm/s² (−Y in the world frame). */
export const GRAVITY = 9810;

/**
 * Panel bending discretisation constant: k_b = C_B · D_eff(φ) · |e|² / (A₁ + A₂).
 * Theory for an equilateral lattice with the dihedral lever (h₀+h₁)/3 gives ≈ 2 (Grinspun's "6"
 * uses A_e = (A₁+A₂)/3); the grain-deconvolved D_eff and the lattice raise the effective stiffness.
 * Calibrated by test `E1-peirce`: copy paper 80 g/m², 25 mm strip, MD, h = 6 mm, S = 20, overhang
 * where the tip chord droops 41.5° = 2.0003·(D/q)^⅓ = 172.12 mm (exact heavy elastica).
 * CD is then checked without recalibration (measured 132.6 vs 132.4 mm).
 */
export const C_B = 1.0244;

/** Default hand factor: a folding hand is this many times stiffer than the crease. Test `crease-drive`. */
export const HAND_FACTOR = 50;

/** Lowest share of HAND_FACTOR a hand eases to when its drives would stretch the paper (World._easeHand). Test `hand-ease`. */
export const HAND_EASE_MIN = 1 / 16;

/**
 * A hand eases only when the stretch guard, after all its passes, still leaves an edge more than this
 * strain beyond its target (lane E3). The guard's own "moved more than SETTLE_STRAIN" test is a
 * hair-trigger: on the deckle-tear card strip it fired on 39 % of substeps whose guard had in fact
 * converged (largest remaining correction < 1e-4), the hand sat at 1/16 for most of the fold and the
 * strip peaked at 1.26 % stretch (0.53 % with a firm hand). Tests `hand-ease`, `hand-ease-deckle`.
 */
export const HAND_EASE_STRAIN = 1e-4;

/** Settled substeps before an eased hand doubles its stiffness again. Test `hand-ease`. */
export const HAND_CALM_SUBSTEPS = 30;

/** Panel-hinge plastic yield, degrees (paper takes a permanent curl only past this). Test `crease-unfold` (panels stay elastic). */
export const PANEL_YIELD_DEG = 60;

/** Stretch guard target of the post-solve pass: 0.45 %, so measured stretch stays below the 0.5 % inextensibility limit even when the guard is active. Test `inextensible`, `mesh-sweep`. */
export const STRAIN_LIMIT = 0.0045;

/** Gauss–Seidel passes of the strain-limit guard per substep (it runs after contact and friction). */
export const STRAIN_PASSES = 4;

/**
 * Upper bound of the guard's passes: it stops at the first pass that moves nothing, so a guard that
 * settles within STRAIN_PASSES is unchanged, and one that does not (a hand forcing a non-developable
 * twist) keeps projecting up to this many passes. Test `strain-guard`.
 */
export const STRAIN_PASSES_MAX = 16;

/** A guard pass that moved no edge by more than this strain counts as settled (round-off, not stretch). */
export const SETTLE_STRAIN = 1e-6;

/** Compressive guard of the strain-limit pass (compression is soft, see MEMBRANE_COMPRESSION). */
export const COMPRESSION_LIMIT = 0.01;

/**
 * Bending damping (Rayleigh, stiffness-proportional), seconds: every hinge also resists its own
 * rate of turn with β·k·θ̇ (the "Rayleigh-like damping β" of the physics memo §a3, never built until
 * now). Paper is viscoelastic: its loss factor in bending is a few per cent (η ≈ 0.02–0.07 for
 * machine-made paper at room humidity, rising with moisture [E: literature range, not measured on our
 * stocks]); β = η/ω at a reference flap frequency gives that loss to a hanging flap, more to the
 * fast mesh-scale ripples (which real paper does not show) and none to rigid motion or to a resting
 * pose (the equilibrium does not change). η = 0.025 at 4 Hz, the low end of the range: the damping
 * also stiffens the sheet against position-level contact within a substep, and at η = 0.05 the
 * tab-and-slot push (test `edge-contact`) peaked at 4.8 % stretch instead of 3.9 %; contact inside
 * the implicit solve would remove that coupling. Test `flap-settle`.
 */
export const BEND_DAMPING = 0.025 / (2 * Math.PI * 4);

/** Air density, g/mm³ (1.2 kg/m³). */
export const RHO_AIR = 1.2e-6;

/** Normal drag coefficient of a flat plate. */
export const DRAG_CD = 1.2;

/** Baseline velocity damping, 1/s (exp(−c·Δt) per substep, substep-count independent). */
export const DAMPING = 1.0;

/** Numerical floor of the contact distance, mm. */
export const MIN_CONTACT = 0.05;

/** Stiffness of welds/pivots/sliders in the implicit block, as a multiple of the stiffest membrane spring. */
export const HARD_FACTOR = 100;

/** Default user-grab stiffness, g/s² (soft: about one finger). */
export const GRAB_STIFFNESS = 2.0e4;

/**
 * Implicit step between refactorisations: PCG on the current Gauss–Newton matrix, preconditioned by
 * the last factorisation. Refactor when PCG does not converge in PCG_MAX_ITER iterations, when it
 * needed more than PCG_REFACTOR_ITER (cheaper to refactor next substep), when the stiffness set
 * changes (drives, grabs, strings) or when an edge turned more than REFACTOR_ANGLE (safety cap).
 * The gradient is always exact, so none of these change the equilibrium. Test `E12-substeps`.
 */
export const PCG_MAX_ITER = 12;
export const PCG_REFACTOR_ITER = 6;
export const PCG_RTOL = 1e-3;
/** After a PCG failure, factor directly for this many substeps before trying PCG again. */
export const PCG_FAIL_HOLD = 4;
/** Sleep: a world with no drivers whose free vertices stay slower than SLEEP_SPEED (mm/s) for SLEEP_FRAMES frames skips frames. Test `E2-cantilever` (µm deflections settle first). */
export const SLEEP_SPEED = 1e-5;
export const SLEEP_FRAMES = 30;
export const REFACTOR_ANGLE = 0.3;

/** Defaults for World options. */
export const DEFAULT_SUBSTEPS = 20;
export const DEFAULT_SEED = 1;

/** Fraction of the target edge length below which a lattice point is dropped near a boundary. */
export const LATTICE_MARGIN = 0.55;

/**
 * Membrane modulus cap (engine units g/s² = E·t): Y_eff = min(E(φ)·t, MEMBRANE_CAP_LENGTH · ρ_A · g).
 * Paper's physical in-plane stiffness (E·t ≈ 5e8 for copy paper) is 10⁵× its mass-time scale per
 * substep; the quadratic stretch of a rotating stiff edge then produces forces far above gravity that
 * one Newton step cannot resolve (measured: divergence of a resting cantilever). The cap gives a strain
 * of 1e-4 per metre of hanging paper of the same stock — 50× below the 0.5 % inextensibility limit
 * even at pin corners — and keeps k·Δt²/m ≈ 1. Bending is unaffected; membrane energy still exceeds
 * bending energy by > 10² for any developable-breaking deformation. Test `inextensible`.
 */
export const MEMBRANE_CAP_LENGTH = 1.0e7;

/**
 * Membrane compression stiffness as a fraction of tension stiffness. A triangle mesh cannot bend
 * isometrically: chords shorten by (κh)²/24, and a stiff compressive membrane then stiffens large
 * deflections ("membrane locking"; measured +6 % in E1 with a symmetric membrane). Paper buckles
 * at the fibre scale under in-plane compression, so a soft compressive branch is also physical.
 * The implicit matrix keeps the tension stiffness (conservative, stable). Test `E1-peirce`.
 */
export const MEMBRANE_COMPRESSION = 0.05;

/** Compression stiffness used in the Newton model (≥ MEMBRANE_COMPRESSION, see implicit.js). Tests `E12-substeps`, `contact-stack`. */
export const MODEL_COMPRESSION = 0.25;

/** Gauss–Seidel passes of the contact + ground projection per substep. Test `contact-stack`. */
export const CONTACT_PASSES = 3;
