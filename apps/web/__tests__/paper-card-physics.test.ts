/**
 * The 3D paper card's physics (components/paper-card): the card document is a
 * valid Pliego sheet document, a pulled wing bends and springs back to flat
 * without stretching the board, and the board is stiffer along its grain.
 */
import { describe, expect, it } from 'vitest';
import { PHYSICS, cardDocument, CARD_H, CARD_W } from '@/components/paper-card/card-document';
import { World, loadDocument } from '@/vendor/pliego-engine';

const TIME_SCALE = 1 / 8; // renderer.ts: the slow-motion clock
const FRAME = TIME_SCALE / 60;

function world(grainDeg = 0) {
  return new World(loadDocument(JSON.stringify(cardDocument({ grainDeg }))), PHYSICS);
}

/** Simulation vertex nearest to sheet point (u, v), mm. */
function nearest(w: World, u: number, v: number) {
  let best = -1;
  let dist = Infinity;
  for (let i = 0; i < w.mesh.nV; i++) {
    const d = Math.hypot((w.mesh.uv[2 * i] ?? 0) - u, (w.mesh.uv[2 * i + 1] ?? 0) - v);
    if (d < dist) [best, dist] = [i, d];
  }
  return best;
}

/** Pull vertex `v` 10 mm out of plane over 30 frames; returns its height when held. */
function pull(w: World, v: number) {
  const p = [w.positions[3 * v] ?? 0, w.positions[3 * v + 1] ?? 0, w.positions[3 * v + 2] ?? 0];
  expect(w.grab(v, p)).toBe(true);
  for (let f = 0; f < 30; f++) {
    w.moveGrab([p[0] ?? 0, (p[1] ?? 0) + 10 * Math.min(1, f / 15), p[2] ?? 0]);
    w.step(FRAME);
  }
  return w.positions[3 * v + 1] ?? 0;
}

describe('paper card physics', () => {
  it('builds a valid sheet document of SBS board, 9 × 5 cm, held at its centre', () => {
    const w = world();
    expect(w.warnings).toEqual([]);
    expect(w.mesh.nV).toBeGreaterThan(60);
    expect(w.mesh.nV).toBeLessThan(200);
    expect(CARD_W / CARD_H).toBeCloseTo(1.8);
  });

  it('bends when a wing is pulled and springs back flat on release', () => {
    const w = world();
    const tip = nearest(w, CARD_W, CARD_H / 2);
    const held = pull(w, tip);
    expect(held).toBeGreaterThan(4);
    expect(held).toBeLessThan(10);
    w.release();
    let overshoot = 0;
    for (let f = 0; f < 240; f++) {
      w.step(FRAME);
      overshoot = Math.min(overshoot, w.positions[3 * tip + 1] ?? 0);
    }
    const s = w.stats();
    expect(s.finite).toBe(true);
    // Springs past flat once (the board rings), then settles and the world sleeps.
    expect(overshoot).toBeLessThan(-0.2);
    expect(Math.abs(w.positions[3 * tip + 1] ?? 1)).toBeLessThan(0.05);
    expect(s.maxStrain).toBeLessThan(0.005);
    expect(s.asleep).toBe(true);
  });

  it('is stiffer along the grain than across it', () => {
    // The long wing bends along the card's long side: grain there (0°) holds
    // it flatter against the same pull than grain across (90°).
    const along = world(0);
    const across = world(90);
    const heldAlong = pull(along, nearest(along, CARD_W, CARD_H / 2));
    const heldAcross = pull(across, nearest(across, CARD_W, CARD_H / 2));
    expect(heldAcross).toBeGreaterThan(heldAlong * 1.05);
  });
});
