/* eslint-disable @typescript-eslint/no-require-imports */
// Run: node --test scripts/test-partner-license.cjs
// The cross-product "owns the other app's Lifetime?" client and the route that
// exposes it to the Suite pages. Mocked fetch/auth; no network.
const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { readFileSync } = require('node:fs');
const ts = require('typescript');

function compile(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'exports', 'process', 'fetch', 'console', code)(
    name => { if (!(name in dependencies)) throw new Error(`Unmocked dependency ${name}`); return dependencies[name]; },
    exports, process, (...args) => global.fetch(...args), { ...console, warn: () => {} },
  );
  return exports;
}

const SECRET = 's'.repeat(64);
const partner = () => compile('src/lib/partner-license.ts', { 'server-only': {} });
let calls; const originalFetch = global.fetch;
beforeEach(() => {
  calls = [];
  process.env.SUITE_PARTNER_API_URL = 'https://partner.example/prod/';
  process.env.SUITE_PARTNER_SECRET = SECRET;
});
afterEach(() => { global.fetch = originalFetch; delete process.env.SUITE_PARTNER_API_URL; delete process.env.SUITE_PARTNER_SECRET; });
const respond = (status, body) => { global.fetch = async (url, init) => { calls.push({ url, init }); return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }); }; };

test('asks the partner endpoint with the secret header and the email, nothing else', async () => {
  respond(200, { lifetime: true });
  assert.equal(await partner().partnerOwnsLifetime('Owner@Example.com'), true);
  assert.equal(calls[0].url, 'https://partner.example/prod/suite/partner-lifetime', 'trailing slash trimmed');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['x-suite-partner-secret'], SECRET);
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: 'Owner@Example.com' });
  assert.ok(calls[0].init.signal, 'has a timeout');
  respond(200, { lifetime: false });
  assert.equal(await partner().partnerOwnsLifetime('a@b.co'), false);
});

test('throws (never guesses "no") on any failure, so checkout can fail closed', async () => {
  for (const [status, body] of [[503, { error: 'not configured' }], [403, { error: 'Forbidden' }], [500, { error: 'x' }], [200, { lifetime: 'yes' }], [200, 'not json'], [200, {}]]) {
    respond(status, body);
    await assert.rejects(partner().partnerOwnsLifetime('a@b.co'), `${status} ${JSON.stringify(body)}`);
  }
  global.fetch = async () => { throw new Error('network'); };
  await assert.rejects(partner().partnerOwnsLifetime('a@b.co'));
});

test('display variant: null when unconfigured or unavailable', async () => {
  respond(500, {});
  assert.equal(await partner().partnerLifetimeOrNull('a@b.co'), null);
  respond(200, { lifetime: true });
  assert.equal(await partner().partnerLifetimeOrNull('a@b.co'), true);
  delete process.env.SUITE_PARTNER_SECRET;
  const unconfigured = partner();
  assert.equal(unconfigured.partnerLookupConfigured(), false);
  assert.equal(await unconfigured.partnerLifetimeOrNull('a@b.co'), null);
  await assert.rejects(unconfigured.partnerOwnsLifetime('a@b.co'), /not configured/);
  assert.equal(calls.length, 2, 'no request without configuration (only the two configured calls above)');
});

// ─── /api/suite/ownership: what the person owns of Tables (+ the personal Buckets plan) ───
const plans = compile('src/lib/plan-options.ts', {});
function ownershipRoute({ userId = 'user-a', verified = 'verified', row = null, rowStatus, partner = false } = {}) {
  const asked = [];
  const route = compile('src/app/api/suite/ownership/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@clerk/nextjs/server': {
      auth: async () => ({ userId }),
      currentUser: async () => ({ primaryEmailAddress: { emailAddress: 'Owner@example.com', verification: { status: verified } } }),
    },
    '@/lib/license-api': { getLicenseForAccount: async () => ({ response: { ok: rowStatus ? rowStatus === 200 : !!row, status: rowStatus ?? (row ? 200 : 404) }, data: row ?? {} }) },
    '@/lib/dodo': { isSuiteProductId: id => id === 'pdt_suite', isSuiteUpgradeProductId: id => id === 'pdt_upgrade' },
    '@/lib/partner-license': { partnerLifetimeOrNull: async email => { asked.push(email); return partner; } },
    '@/lib/plan-options': plans,
  });
  return { asked, get: async () => (await route.GET()).json() };
}
test('ownership route: signed out or unverified email never asks Tables', async () => {
  for (const options of [{ userId: null }, { verified: 'unverified' }]) {
    const r = ownershipRoute(options);
    assert.deepEqual(await r.get(), { suite: null });
    assert.deepEqual(r.asked, []);
  }
});
test('ownership route: Tables answer + personal Buckets plan for the verified email', async () => {
  const r = ownershipRoute({ row: { paid: true, tier: 'lifetime', productId: 'pdt_lifetime' }, partner: true });
  assert.deepEqual(await r.get(), { suite: { partnerLifetime: true, viaSuite: false, herePlan: 'lifetime' } });
  assert.deepEqual(r.asked, ['Owner@example.com']);
});
test('ownership route: Suite/upgrade grant hint, refunded rows, foreign rows and outages', async () => {
  for (const productId of ['pdt_suite', 'pdt_upgrade']) {
    assert.equal((await ownershipRoute({ row: { paid: true, tier: 'lifetime', productId }, partner: null }).get()).suite.viaSuite, true);
  }
  assert.deepEqual((await ownershipRoute({ row: { paid: true, tier: 'lifetime', revoked: true, productId: 'pdt_suite' } }).get()).suite,
    { partnerLifetime: false, viaSuite: false, herePlan: 'none' });
  assert.equal((await ownershipRoute({ row: { paid: true, tier: 'lifetime', clerkId: 'someone-else' } }).get()).suite.herePlan, 'none', 'never reads another account\'s row');
  assert.deepEqual((await ownershipRoute({ rowStatus: 503, partner: null }).get()).suite, { partnerLifetime: null, viaSuite: false, herePlan: 'none' });
});
test('a Buckets Lifetime owner who also owns a Team still gets the $49 upgrade state', () => {
  // useCurrentPlan reports "team" for them; the hook prefers herePlan when it is a Lifetime.
  assert.equal(plans.suiteStateFor('team', { partnerLifetime: false, viaSuite: false }), 'team');
  assert.equal(plans.suiteStateFor('lifetime', { partnerLifetime: false, viaSuite: false }), 'upgrade-here');
});
