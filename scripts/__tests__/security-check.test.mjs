// Boundary checkpoint (2026-09-04, madfam-site): public repo (Lane C). This file names
// repo paths, commands and check names only; no hosts, credentials or identifiers.
// Policy: internal-devops/docs/repo-boundary-contract.md.
/**
 * Regression tests for scripts/security-check.js.
 *
 * The script used to report "Critical: 0 ... Status: ✅ PASS", exit 0, while
 * printing two ❌ lines: its own findings were pushed into `this.issues` but
 * the summary was keyed off `criticalCount`, which only `checkDependencies()`
 * ever assigned — and it runs last, so it overwrote everything.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SecurityAuditor = require('../security-check.js');

function auditor() {
  return new SecurityAuditor();
}

function critical(message = 'Input Validation: synthetic') {
  return { level: 'critical', message, details: {} };
}

test('a critical finding fails the run and exits 1', async () => {
  const a = auditor();
  a.issues.push(critical());

  const report = a.buildReport();
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.failing, 1);
  assert.equal(await exitCodeOf(a), 1);
});

test('dependency criticals still fail the run', async () => {
  const a = auditor();
  a.depCritical = 2;

  const report = a.buildReport();
  assert.equal(report.summary.findings.critical, 0);
  assert.equal(report.summary.dependencies.critical, 2);
  assert.equal(report.status, 'FAIL');
  assert.equal(await exitCodeOf(a), 1);
});

test('a clean run passes and exits 0', async () => {
  const a = auditor();

  const report = a.buildReport();
  assert.equal(report.status, 'PASS');
  assert.equal(report.summary.failing, 0);
  assert.equal(await exitCodeOf(a), 0);
});

test('finding counts are not clobbered by audit metadata', () => {
  // The exact regression: one critical finding, then dependency metadata that
  // reports zero of everything. The finding must survive.
  const a = auditor();
  a.issues.push(critical());
  a.depCritical = 0;
  a.depModerate = 0;
  a.depLow = 0;

  const report = a.buildReport();
  assert.equal(report.summary.findings.critical, 1);
  assert.equal(report.summary.failing, 1);
  assert.equal(report.status, 'FAIL');
});

test('placeholder .env values are not reported as secrets', () => {
  const content = [
    '# a comment SECRET=not-a-real-one',
    'NEXT_PUBLIC_AVALA_API_KEY="replace-with-public-avala-client-key-if-used"',
    'API_SECRET="__CHANGE_ME__at-least-32-characters-long__"',
    'RESEND_API_KEY=',
    'JANUA_JWKS_URL=http://localhost:8000/.well-known/jwks.json',
  ].join('\n');

  assert.deepEqual(SecurityAuditor.findSecretAssignments(content), []);
});

test('a real-looking secret assignment is still reported', () => {
  const content = 'API_SECRET=7f3b9c1d4e6a8b2c5d0e9f1a3b7c5d2e\n';

  assert.deepEqual(SecurityAuditor.findSecretAssignments(content), ['API_SECRET']);
});

// --- Dependency audit (finding S1-005): fail closed, read error.stdout ------

const FIXTURES = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');
const fixture = name => fs.readFileSync(path.join(FIXTURES, name), 'utf-8');

/** An execSync stand-in that behaves like `pnpm audit` finding something: exit 1, JSON on stdout. */
function auditExitsNonZeroWith(stdout) {
  return () => {
    const error = new Error('Command failed: pnpm audit --json');
    error.status = 1;
    error.stdout = stdout;
    throw error;
  };
}

test('non-zero pnpm audit exit: counts come from error.stdout, not zeros', async () => {
  const a = auditor();
  a.log = () => {};
  await a.checkDependencies(auditExitsNonZeroWith(fixture('pnpm-audit-high.json')));

  assert.equal(a.depHigh, 1);
  assert.equal(a.depModerate, 2);
  assert.equal(a.depLow, 1);
  assert.equal(a.depCritical, 0);
  assert.equal(a.issues.length, 0);
  const report = a.buildReport();
  assert.equal(report.summary.dependencies.high, 1);
});

test('a high-severity fixture fails the run when SECURITY_FAIL_ON=high', async () => {
  const a = auditor();
  a.log = () => {};
  a.failOn = SecurityAuditor.normalizeFailOn('high');
  await a.checkDependencies(auditExitsNonZeroWith(fixture('pnpm-audit-high.json')));

  assert.equal(a.buildReport().status, 'FAIL');
  assert.equal(await exitCodeOf(a), 1);
});

test('a high-severity fixture is reported but passes under the default (critical) threshold', async () => {
  const a = auditor();
  a.log = () => {};
  await a.checkDependencies(auditExitsNonZeroWith(fixture('pnpm-audit-high.json')));

  const report = a.buildReport();
  assert.equal(report.summary.failOn, 'critical');
  assert.equal(report.summary.dependencies.high, 1);
  assert.equal(report.status, 'PASS');
});

test('a critical-severity fixture fails the run', async () => {
  const a = auditor();
  a.log = () => {};
  await a.checkDependencies(auditExitsNonZeroWith(fixture('pnpm-audit-critical.json')));

  assert.equal(a.depCritical, 1);
  assert.equal(a.buildReport().status, 'FAIL');
  assert.equal(await exitCodeOf(a), 1);
});

test('an audit that cannot run fails closed', async () => {
  const a = auditor();
  a.log = () => {};
  await a.checkDependencies(() => {
    throw new Error('spawn pnpm ENOENT');
  });

  assert.equal(a.issues.length, 1);
  assert.match(a.issues[0].message, /could not run/);
  assert.equal(a.buildReport().status, 'FAIL');
});

test('unparseable audit output fails closed', async () => {
  const a = auditor();
  a.log = () => {};
  await a.checkDependencies(auditExitsNonZeroWith('ERR_PNPM_AUDIT_BAD_RESPONSE 503'));

  assert.equal(a.buildReport().status, 'FAIL');
});

test('a clean audit (exit 0) parses to zeros and passes', async () => {
  const clean = JSON.stringify({
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
  });
  const a = auditor();
  a.log = () => {};
  await a.checkDependencies(() => clean);

  assert.equal(a.issues.length, 0);
  assert.equal(a.buildReport().status, 'PASS');
});

/** Runs generateReport() in a temp cwd with process.exit stubbed, and returns the code. */
async function exitCodeOf(a) {
  const cwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'security-check-'));
  const realExit = process.exit;
  const realLog = console.log;
  let code;

  process.chdir(dir);
  console.log = () => {};
  process.exit = value => {
    code = value;
    throw new Error('__exit__');
  };

  try {
    await a.generateReport();
  } catch (error) {
    if (error.message !== '__exit__') throw error;
  } finally {
    process.exit = realExit;
    console.log = realLog;
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  return code;
}
