#!/usr/bin/env node
/**
 * Smoke test for the probe surface k8s depends on.
 *
 * Usage: node scripts/smoke-health.mjs [baseUrl]   (default http://127.0.0.1:3000)
 *
 * Asserts that GET /api/health answers 200 {"status":"ok"} — the path all three
 * probes in k8s/production/madfam-cms-deployment.yaml use — and that the Payload
 * REST catch-all is mounted and does not shadow it.
 */
const baseUrl = (process.argv[2] || process.env.CMS_SMOKE_URL || 'http://127.0.0.1:3000').replace(
  /\/$/,
  ''
);
const ATTEMPTS = Number(process.env.CMS_SMOKE_ATTEMPTS || 30);
const DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fail = (message) => {
  console.error(`FAIL ${message}`);
  process.exit(1);
};

const waitForHealth = async () => {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response;
      console.error(`  attempt ${attempt}: HTTP ${response.status}`);
    } catch (error) {
      console.error(`  attempt ${attempt}: ${error.message}`);
    }
    await sleep(DELAY_MS);
  }
  return null;
};

const response = await waitForHealth();
if (!response) fail(`${baseUrl}/api/health never answered`);

const body = await response.json();
if (body?.status !== 'ok') fail(`/api/health returned ${JSON.stringify(body)}`);
console.log('ok   GET /api/health -> 200 {"status":"ok"}');

// The health route is a static segment sitting next to the Payload REST
// catch-all; this asserts the catch-all is mounted and has not swallowed it.
const rest = await fetch(`${baseUrl}/api/blog-posts?limit=1`);
if (!rest.ok) fail(`GET /api/blog-posts returned HTTP ${rest.status}`);
const restBody = await rest.json();
if (!Array.isArray(restBody?.docs)) fail('GET /api/blog-posts did not return a Payload list');
console.log('ok   GET /api/blog-posts -> 200 Payload list response');

const admin = await fetch(`${baseUrl}/admin`, { redirect: 'manual' });
if (admin.status >= 500) fail(`GET /admin returned HTTP ${admin.status}`);
console.log(`ok   GET /admin -> HTTP ${admin.status}`);

console.log('CMS smoke passed');
