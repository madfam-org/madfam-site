// @ts-check
/**
 * @pliego/engine — public API (engine.md §5).
 *
 *   import { loadDocument, buildMesh, World, kinematics, materials } from '@pliego/engine';
 */
export { loadDocument, DocumentError } from './document.js';
export { buildMesh, defaultMeshEdge, locatePoint, HINGE_PANEL, HINGE_CREASE, HINGE_SCORE, HINGE_PERF } from './mesh.js';
export { World } from './xpbd/world.js';
export { dihedral } from './xpbd/dihedral.js';
export * as kinematics from './kinematics/index.js';
export * as materials from './material.js';
export * as constants from './constants.js';

/** Identifies the real engine to the studio (the studio's stub reports 'stub'). */
export const ENGINE_KIND = 'pliego-engine';
export const ENGINE_VERSION = '0.1.0';
