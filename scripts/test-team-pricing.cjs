/* eslint-disable @typescript-eslint/no-require-imports */
// Team repricing ($99 → $49 per seat, in place on the existing Dodo product).
// Retired products (declared via env) stay recognized but can never be sold.
const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
function compile(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'exports', code)(name => { if (!(name in dependencies)) throw new Error(`Unmocked dependency ${name}`); return dependencies[name]; }, exports);
  return exports;
}
const suiteOffer = compile('src/lib/suite-offer.ts', {});
const reddit = compile('src/lib/reddit.ts', { '@/lib/suite-offer': suiteOffer });
const dodo = compile('src/lib/dodo.ts', { 'server-only': {}, '@/lib/reddit': reddit, '@/lib/suite-offer': suiteOffer });
// A retired product is now only ever declared through env (none is built in).
const RETIRED = 'pdt_old_team_99';
const LIVE_TEAM = 'pdt_0Ngjrw1D8wTdKaMz9Xd6X';
const KEYS = ['BUCKETS_DODO_PRODUCT_ID_TEAM', 'S3CONSOLE_DODO_PRODUCT_ID_TEAM', 'BUCKETS_DODO_LEGACY_PRODUCT_IDS_TEAM', 'S3CONSOLE_DODO_LEGACY_PRODUCT_IDS_TEAM', 'BUCKETS_DODO_PRODUCT_ID_YEARLY', 'BUCKETS_DODO_PRODUCT_ID_LIFETIME', 'S3CONSOLE_DODO_PRODUCT_ID_LIFETIME', 'SUITE_DODO_PRODUCT_ID_LIFETIME', 'SUITE_DODO_LEGACY_PRODUCT_IDS_LIFETIME'];
const saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
for (const k of KEYS) delete process.env[k];
beforeEach(() => { process.env.BUCKETS_DODO_LEGACY_PRODUCT_IDS_TEAM = RETIRED; });
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

test('displayed seat price matches Yearly and is per seat in cart value', () => {
  assert.equal(reddit.TEAM_SEAT_PRICE_USD, 49);
  assert.equal(reddit.tierValue('team'), 49);
  assert.equal(reddit.tierValue('team'), reddit.tierValue('yearly'));
  assert.equal(reddit.RETIRED_TEAM_SEAT_PRICE_USD, 99);
});

test('checkout sells only the configured $49 product and recognizes the retired one', () => {
  process.env.BUCKETS_DODO_PRODUCT_ID_TEAM = 'pdt_team_49';
  assert.equal(dodo.getProductId('team'), 'pdt_team_49');
  assert.deepEqual(dodo.getPurchasableProductIds('team'), ['pdt_team_49']);
  assert.deepEqual(dodo.getConfiguredProductIds('team'), ['pdt_team_49', RETIRED]);
  assert.ok(!dodo.getPurchasableProductIds().includes(RETIRED));
  assert.ok(dodo.getConfiguredProductIds().includes(RETIRED));
  assert.equal(dodo.teamSeatPriceForProduct(RETIRED), 99);
  assert.equal(dodo.teamSeatPriceForProduct('pdt_team_49'), 49);
  // Unknown products show no price instead of a guess.
  assert.equal(dodo.teamSeatPriceForProduct(undefined), null);
  assert.equal(dodo.teamSeatPriceForProduct('pdt_unknown'), null);
});

test('an env still pointing at the retired product fails closed instead of charging $99', () => {
  process.env.BUCKETS_DODO_PRODUCT_ID_TEAM = RETIRED;
  assert.throws(() => dodo.getProductId('team'), /not set to a current product/);
  assert.deepEqual(dodo.getPurchasableProductIds('team'), []);
  assert.deepEqual(dodo.getConfiguredProductIds('team'), [RETIRED]);
  // The legacy alias can carry the new product while the primary var is stale.
  process.env.S3CONSOLE_DODO_PRODUCT_ID_TEAM = 'pdt_team_49';
  assert.equal(dodo.getProductId('team'), 'pdt_team_49');
});

test('unset team product still fails closed and other tiers are unaffected', () => {
  assert.throws(() => dodo.getProductId('team'));
  process.env.BUCKETS_DODO_PRODUCT_ID_YEARLY = 'pdt_yearly';
  assert.equal(dodo.getProductId('yearly'), 'pdt_yearly');
  assert.equal(dodo.isRetiredProductId('pdt_yearly'), false);
});

test('extra retired ids can be added through env', () => {
  process.env.BUCKETS_DODO_LEGACY_PRODUCT_IDS_TEAM = ' pdt_a , pdt_b,,';
  process.env.S3CONSOLE_DODO_LEGACY_PRODUCT_IDS_TEAM = 'pdt_b,pdt_c';
  for (const id of ['pdt_a', 'pdt_b', 'pdt_c']) assert.equal(dodo.isRetiredProductId(id), true);
  assert.equal(dodo.isRetiredProductId(RETIRED), false);
  assert.deepEqual(dodo.getConfiguredProductIds('team'), ['pdt_a', 'pdt_b', 'pdt_c']);
  assert.equal(dodo.isRetiredProductId(''), false);
  assert.equal(dodo.isRetiredProductId(42), false);
});

test('the existing Team product was repriced in place: it is current and sold at $49', () => {
  delete process.env.BUCKETS_DODO_LEGACY_PRODUCT_IDS_TEAM;
  assert.equal(dodo.isRetiredProductId(LIVE_TEAM), false);
  process.env.BUCKETS_DODO_PRODUCT_ID_TEAM = LIVE_TEAM;
  assert.equal(dodo.getProductId('team'), LIVE_TEAM);
  assert.deepEqual(dodo.getPurchasableProductIds('team'), [LIVE_TEAM]);
  assert.equal(dodo.teamSeatPriceForProduct(LIVE_TEAM), 49);
});

test('pricing card advertises the new seat price', () => {
  const config = readFileSync('src/lib/config.tsx', 'utf8');
  assert.match(config, /price: `\$\$\{TEAM_SEAT_PRICE_USD\}`/);
  assert.doesNotMatch(config, /Team \$99/);
});

test('pricing page Team card uses the shared seat price', () => {
  const page = readFileSync('src/app/pricing/page.tsx', 'utf8');
  const team = page.slice(page.indexOf('id: "team"'));
  assert.match(team, /price: `\$\$\{TEAM_SEAT_PRICE_USD\}`/);
});

function userDataRoute(license, team) {
  const calls = [];
  const route = compile('src/app/api/user-data/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => ({ status: init?.status ?? 200, body }) } },
    '@clerk/nextjs/server': { auth: async () => ({ userId: 'user_owner' }), currentUser: async () => ({ primaryEmailAddress: { emailAddress: 'Owner@Example.com' } }) },
    '@/lib/license-api': {
      getLicenseForAccount: async () => ({ response: { ok: true, status: 200 }, data: license }),
      getTeamByOwner: async (email, subject) => { calls.push([email, subject]); if (team instanceof Error) throw team; return team; },
    },
    '@/lib/dodo': { teamSeatPriceForProduct: dodo.teamSeatPriceForProduct },
  });
  return { calls, get: () => route.GET() };
}

test('user-data shows team owners the rate their product charges, without blocking on lookup failures', async () => {
  const owner = { email: 'Owner@Example.com', tier: 'team', teamOwner: 'owner@example.com', paid: true, machines: ['m'] };
  let r = userDataRoute(owner, { response: { ok: true }, data: { productId: RETIRED } });
  let res = await r.get();
  assert.equal(res.status, 200); assert.equal(res.body.userData.teamSeatPriceUsd, 99);
  assert.deepEqual(r.calls, [['owner@example.com', 'user_owner']]);
  process.env.BUCKETS_DODO_PRODUCT_ID_TEAM = 'pdt_team_49';
  r = userDataRoute(owner, { response: { ok: true }, data: { productId: 'pdt_team_49' } });
  assert.equal((await r.get()).body.userData.teamSeatPriceUsd, 49);
  // A team row without a product id (or an unknown one) gets no price.
  r = userDataRoute(owner, { response: { ok: true }, data: {} });
  assert.equal((await r.get()).body.userData.teamSeatPriceUsd, null);
  r = userDataRoute(owner, new Error('offline'));
  res = await r.get(); assert.equal(res.status, 200); assert.equal(res.body.userData.teamSeatPriceUsd, null);
  // Members and solo customers never trigger a team lookup.
  r = userDataRoute({ ...owner, teamOwner: 'boss@example.com' }, null);
  res = await r.get(); assert.equal(res.body.userData.teamSeatPriceUsd, undefined); assert.equal(r.calls.length, 0);
  r = userDataRoute({ email: 'Owner@Example.com', tier: 'yearly', paid: true }, null);
  await r.get(); assert.equal(r.calls.length, 0);
});

// ─── Tables + Buckets Suite ($149): one product, shown and sold consistently ───
test('the Suite price is shown as $149 and saves $49 against two Lifetime licenses', () => {
  assert.equal(suiteOffer.SUITE_PRICE_USD, 149);
  assert.equal(suiteOffer.LIFETIME_PRICE_USD, reddit.tierValue('lifetime'));
  assert.equal(suiteOffer.SUITE_SEPARATE_PRICE_USD, 198);
  assert.equal(suiteOffer.SUITE_SAVINGS_USD, 49);
  assert.equal(reddit.tierValue('suite'), 149);
  assert.equal(suiteOffer.SUITE_ORIGIN_APP, 'serverless-buckets');
  assert.equal(suiteOffer.SUITE_APP_ID, 'serverless-suite');
});

test('the Suite product is recognized as lifetime but never sold as Buckets Lifetime', () => {
  process.env.BUCKETS_DODO_PRODUCT_ID_LIFETIME = 'pdt_lifetime';
  assert.throws(() => dodo.getSuiteProductId(), /SUITE_DODO_PRODUCT_ID_LIFETIME/);
  process.env.SUITE_DODO_PRODUCT_ID_LIFETIME = ' pdt_suite ';
  process.env.SUITE_DODO_LEGACY_PRODUCT_IDS_LIFETIME = 'pdt_suite_old';
  assert.equal(dodo.getSuiteProductId(), 'pdt_suite');
  assert.deepEqual(dodo.getSuiteProductIds(), ['pdt_suite', 'pdt_suite_old']);
  assert.equal(dodo.getProductId('lifetime'), 'pdt_lifetime');
  assert.deepEqual(dodo.getPurchasableProductIds('lifetime'), ['pdt_lifetime']);
  assert.deepEqual(dodo.getConfiguredProductIds('lifetime'), ['pdt_lifetime', 'pdt_suite', 'pdt_suite_old']);
  assert.equal(dodo.getTierForProductId('pdt_suite'), 'lifetime');
  assert.ok(!dodo.getConfiguredProductIds('monthly').includes('pdt_suite'));
  assert.ok(dodo.isSuiteProductId('pdt_suite') && dodo.isSuiteProductId('pdt_suite_old') && !dodo.isSuiteProductId('pdt_lifetime'));
  assert.ok(!dodo.isRetiredProductId('pdt_suite'));
  assert.ok(dodo.isCheckoutTier('suite') && dodo.isCheckoutTier('lifetime') && !dodo.isCheckoutTier('bundle') && !dodo.isLicenseTier('suite'));
});
