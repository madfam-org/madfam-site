/// <reference lib="webworker" />
/**
 * The paper card's physics, off the main thread. Pliego's engine (XPBD with an
 * implicit bending solve) steps the card; the page sends pointer rays and
 * drag targets and gets the deformed mesh back once per frame.
 *
 * The engine is AGPL-3.0-only and vendored unmodified (vendor/pliego-engine);
 * this Worker is the only code that imports it.
 */
import { World, loadDocument } from '../../vendor/pliego-engine';
import { PHYSICS, cardDocument } from './card-document';
import type { FromWorker, ToWorker, Vec3 } from './protocol';

const scope = self as unknown as DedicatedWorkerGlobalScope;
let world: World | null = null;
const stepMs: number[] = [];

function post(msg: FromWorker) {
  scope.postMessage(msg);
}

function pose(w: World): FromWorker {
  const r = w.render();
  return {
    type: 'pose',
    positions: new Float32Array(r.positions),
    normals: new Float32Array(r.normals),
    asleep: w.stats().asleep,
    stepMs: median(stepMs),
  };
}

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[s.length >> 1] ?? 0;
}

scope.onmessage = (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  try {
    if (msg.type === 'init') {
      const doc = loadDocument(JSON.stringify(cardDocument()));
      world = new World(doc, PHYSICS);
      const r = world.render();
      post({
        type: 'ready',
        uvs: new Float32Array(r.uvs),
        indices: new Uint32Array(r.indices),
        positions: new Float32Array(r.positions),
        normals: new Float32Array(r.normals),
      });
      return;
    }
    if (!world) return;
    if (msg.type === 'step') {
      const t0 = performance.now();
      world.step(msg.simDt);
      stepMs.push(performance.now() - t0);
      if (stepMs.length > 120) stepMs.shift();
      post(pose(world));
    } else if (msg.type === 'grab') {
      const hit = world.pick(msg.origin, msg.dir);
      const ok = hit ? world.grab(hit.vertex, hit.point) : false;
      post({ type: 'grabbed', ok, point: ok && hit ? (hit.point as Vec3) : null });
    } else if (msg.type === 'drag') {
      world.moveGrab(msg.point);
    } else if (msg.type === 'release') {
      world.release();
    }
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
