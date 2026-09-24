// Boundary checkpoint (2026-09-23, madfam-site): unit tests over synthetic
// projection stubs only. Public sink. Policy:
// internal-devops/docs/repo-boundary-contract.md.
import test from 'node:test';
import assert from 'node:assert/strict';

import { compareProjections, describe } from '../check-projection-freshness.mjs';

const stub = (lastUpdated, extra = '') =>
  describe(JSON.stringify({ last_updated: lastUpdated, products: [], extra }));

test('identical projections are ok', () => {
  const a = stub('2026-09-23');
  assert.equal(compareProjections(a, { ...a }).verdict, 'ok');
});

test('a site copy older than the foundry copy is behind (fails the job)', () => {
  const result = compareProjections(stub('2026-09-05'), stub('2026-09-23'));
  assert.equal(result.verdict, 'behind');
  assert.match(result.message, /re-vendor/);
});

test('a site copy newer than the foundry copy only warns', () => {
  assert.equal(
    compareProjections(stub('2026-09-23'), stub('2026-09-05')).verdict,
    'ahead-or-ambiguous'
  );
});

test('same date, different content is ambiguous, not ok', () => {
  assert.equal(
    compareProjections(stub('2026-09-23', 'a'), stub('2026-09-23', 'b')).verdict,
    'ahead-or-ambiguous'
  );
});

test('describe hashes the raw bytes', () => {
  const a = describe('{"last_updated":"2026-09-23"}');
  const b = describe('{"last_updated": "2026-09-23"}');
  assert.notEqual(a.sha256, b.sha256);
  assert.equal(a.lastUpdated, b.lastUpdated);
});
