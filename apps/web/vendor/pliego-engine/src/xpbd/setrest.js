// @ts-check
/**
 * The initial state of a World (spec §5.14, lane E3 2026-10-18).
 *
 * - `liftOntoTable`: paper cannot start inside the table. A free document (no joins, mechanisms or
 *   kinematic sheets: nothing else fixes where it is) whose initial pose dips below y = 0 is lifted
 *   so its lowest vertex rests on the table. Before, the first ground pass snapped the buried part up
 *   in one substep (fox-puppet `talk` starts 95 mm deep and blew apart). Test `set-rest`.
 * - `restBranch`: a hinge's starting angle on the branch of its rest angle. A crease folded flat
 *   measures ±180° to atan2 either way; spec §5.14 says it takes its design sign, so a flat valley
 *   with rest +180° must not start at −180° (360° from rest). Test `set-rest`.
 */
import { unwrap } from './implicit.js';

/**
 * Lift a free document's initial pose onto the table (mutates mesh.X0); returns the lift in mm.
 * @param {any} doc @param {import('../mesh.js').Mesh} mesh
 */
export function liftOntoTable(doc, mesh) {
  if (doc.joins.length || doc.mechanisms.length || doc.sheets.some((/** @type {any} */ s) => s.kinematic)) return 0;
  let lift = 0;
  for (let v = 0; v < mesh.nV; v++) lift = Math.max(lift, -mesh.X0[3 * v + 1]);
  if (lift > 0) for (let v = 0; v < mesh.nV; v++) mesh.X0[3 * v + 1] += lift;
  return lift;
}

/** A measured dihedral moved onto the branch of the rest angle. @param {number} rest @param {number} measured */
export function restBranch(rest, measured) {
  return unwrap(rest, measured);
}
