/**
 * The paper card as a Pliego sheet document (FOLD 1.2 + `pliego:`, spec v1):
 * one 90 × 50 mm rectangle of solid bleached board, grain along the long side,
 * held at its centre by two short crossed pins (a thumb and a finger), so a
 * pulled corner bends the board and the board springs back by its own
 * stiffness. The engine reads only the stock's `derived` block.
 */

/** Card size in mm (the usual Mexican business card, 9 × 5 cm). */
export const CARD_W = 90;
export const CARD_H = 50;
/**
 * World options for the card (the Worker and the tests share them). Gravity,
 * the table and self-contact are off: the card is held in the air at its centre.
 */
export const PHYSICS = {
  /** Target simulation edge, mm: 125 vertices on the 90 × 50 card. */
  meshEdge: 8,
  /** Fixed substeps per 60 Hz simulation frame (Δt ≈ 1 ms). */
  substeps: 16,
  /** Global velocity damping, 1/s of simulated time. */
  damping: 2,
  /** Grab spring, µN/mm: pulls a wing tip of 350 g/m² board ~70 % of the way to the pointer. */
  grabStiffness: 2e5,
  gravity: false,
  ground: false,
  contact: false,
} as const;

/** Half-length of each crossed holding pin, mm. */
const HOLD = 8;

/**
 * `sbs-board-350` from madfam-org/pliego `materials/` (CERN-OHL-W-2.0,
 * Innovaciones MADFAM): the `derived` block of its stock card, derived by
 * `pliego.stock.derive v1` from estimated measurements (gsm 350, caliper
 * 430 µm, E_md 5.5 GPa, E_cd 2.4 GPa). Units: mm, g, s.
 */
const SBS_BOARD_350 = {
  name: {
    en: 'Solid bleached board (SBS) 350 g/m²',
    es: 'Cartulina sólida blanqueada (SBS) 350 g/m²',
    fr: 'Carton blanchi massif (SBS) 350 g/m²',
    pt: 'Cartão sólido branqueado (SBS) 350 g/m²',
  },
  gsm: 350,
  caliper_mm: 0.43,
  derived: {
    areal_density: 0.00035,
    thickness: 0.43,
    E_md: 5500000000.0,
    E_cd: 2400000000.0,
    nu: 0.293,
    D_md: 39862900.0,
    D_cd: 17394700.0,
    crease_k: 816514.0,
    crease_yield_deg: 35.0,
    crease_set_rate: 0.5,
    score_factor: 0.35,
    perf_factor: 0.25,
    tear_strain: 0.015,
    friction: 0.4,
    collision_thickness: 0.43,
    G12: 1406040000.0,
    score_yield_deg: 12.25,
    perf_cut_mm: 3.0,
    perf_bridge_mm: 1.0,
  },
  derived_basis: 'pliego.stock.derive v1',
};

const label = (text: string) => ({ en: text, es: text, fr: text, pt: text });

/**
 * The card document. The sheet is placed centred on the origin, lying in the
 * engine's XZ plane facing +Y: sheet (u, v) → world (u − 45, 0, 25 − v).
 */
export function cardDocument({ grainDeg = 0 }: { grainDeg?: number } = {}) {
  const corners: Array<[number, number]> = [
    [0, 0],
    [CARD_W, 0],
    [CARD_W, CARD_H],
    [0, CARD_H],
  ];
  const cx = CARD_W / 2;
  const cy = CARD_H / 2;
  return {
    file_spec: 1.2,
    file_creator: 'madfam-site paper card',
    file_title: 'MADFAM business card',
    file_classes: ['singleModel'],
    frame_classes: ['creasePattern'],
    frame_attributes: ['2D', 'noCuts', 'joins'],
    frame_unit: 'mm',
    vertices_coords: corners,
    edges_vertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    edges_assignment: ['B', 'B', 'B', 'B'],
    edges_foldAngle: [0, 0, 0, 0],
    faces_vertices: [[0, 1, 2, 3]],
    'pliego:version': 1,
    'pliego:vertices_sheet': [0, 0, 0, 0],
    'pliego:edges_sheet': [0, 0, 0, 0],
    'pliego:faces_sheet': [0],
    'pliego:edges_treatment': ['none', 'none', 'none', 'none'],
    'pliego:edges_restAngle': [0, 0, 0, 0],
    'pliego:sheets': [
      {
        id: 'card',
        label: label('card'),
        stock: 'sbs-board-350',
        // Grain along the long side: bending the long wings is the stiff way.
        grain_deg: grainDeg,
        offset: [0, 0],
        placement: { origin: [-cx, 0, cy], rotation: [0, 0, 0, 1] },
        front: { color: '#0a0e27', art: null },
        back: { color: '#f3f2ee', art: null },
        kinematic: null,
      },
    ],
    'pliego:stocks': { 'sbs-board-350': SBS_BOARD_350 },
    'pliego:meta': {
      cartridge: 'madfam-business-card',
      mode: 'default',
      params: {},
      kernel: 'madfam-site paper card',
      digest: null,
    },
    'pliego:joins': [
      {
        id: 'hold-u',
        type: 'pin',
        a: {
          sheet: 'card',
          along: [
            [cx - HOLD, cy],
            [cx + HOLD, cy],
          ],
        },
        world: null,
      },
      {
        id: 'hold-v',
        type: 'pin',
        a: {
          sheet: 'card',
          along: [
            [cx, cy - HOLD],
            [cx, cy + HOLD],
          ],
        },
        world: null,
      },
    ],
    file_frames: [
      {
        frame_title: 'initial',
        frame_classes: ['foldedForm'],
        frame_attributes: ['3D'],
        frame_inherit: true,
        frame_parent: 0,
        vertices_coords: corners.map(([u, v]) => [u - cx, 0, cy - v]),
      },
    ],
  };
}
