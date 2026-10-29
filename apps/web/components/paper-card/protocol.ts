/** Messages between the paper card renderer and its physics Worker. Points are engine mm. */
export type Vec3 = [number, number, number];

export type ToWorker =
  | { type: 'init' }
  | { type: 'step'; simDt: number }
  | { type: 'grab'; origin: Vec3; dir: Vec3 }
  | { type: 'drag'; point: Vec3 }
  | { type: 'release' };

export type FromWorker =
  | {
      type: 'ready';
      uvs: Float32Array;
      indices: Uint32Array;
      positions: Float32Array;
      normals: Float32Array;
    }
  | {
      type: 'pose';
      positions: Float32Array;
      normals: Float32Array;
      asleep: boolean;
      stepMs: number;
    }
  | { type: 'grabbed'; ok: boolean; point: Vec3 | null }
  | { type: 'error'; message: string };
