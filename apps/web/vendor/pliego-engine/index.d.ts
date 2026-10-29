// The part of @pliego/engine 0.1.0's public API the paper card uses (README "API").
// The package's own declarations are generated in Pliego; the vendored copy carries only src/.

export class DocumentError extends Error {}

/** Validates a sheet document (spec §8) and returns the loaded form; throws DocumentError. */
export function loadDocument(json: string): unknown;

export interface RenderBuffers {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  sheetIds: Float32Array;
  indices: Uint32Array;
}

export interface PickHit {
  vertex: number;
  triangle: number;
  point: number[];
  sheet: number;
}

export interface WorldOptions {
  meshEdge?: number;
  substeps?: number;
  contact?: boolean;
  ground?: boolean;
  gravity?: boolean | number;
  damping?: number;
  grabStiffness?: number;
}

export class World {
  constructor(doc: unknown, opts?: WorldOptions);
  readonly mesh: { nV: number; uv: Float64Array };
  readonly positions: Float64Array;
  readonly warnings: string[];
  step(frameDt?: number): number;
  render(): RenderBuffers;
  pick(origin: number[], dir: number[]): PickHit | null;
  grab(vertex: number, point: number[]): boolean;
  moveGrab(point: number[]): void;
  release(): void;
  stats(): { maxStrain: number; asleep: boolean; finite: boolean; [key: string]: unknown };
}
