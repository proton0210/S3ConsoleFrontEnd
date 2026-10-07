// Execute production TypeScript with mocked network/auth. No payment API calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, imports = {}, globals = {}) {
  const exports = {};
  const context = vm.createContext({ exports, require: name => {
    if (name in imports) return imports[name];
    if (name === '@/lib/billing-operation') return { purchaseGeneration: () => ({}), runBillingOperation: (_request, execute) => execute({ operationId: 'server-attempt', mutate: globals.fetch }).catch(() => ({ status: 500 })) };
    throw new Error(`Unexpected import ${name}`);
  }, URL, AbortSignal, console, process: { env: { DODO_API_KEY: 'mock-only' } }, ...globals });
  vm.runInContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return exports;
}
const options = load('src/lib/plan-options.ts');
const suiteOffer = load('src/lib/suite-offer.ts');
assert.equal(options.currentPlanFromLicense({paid:true,tier:'lifetime',productId:'legacy'}),'early');
assert.equal(options.currentPlanFromLicense({paid:true}),'early');
assert.equal(options.currentPlanFromLicense({paid:true,tier:'lifetime',productId:'paid-lifetime'}),'lifetime');
assert.equal(options.currentPlanFromLicense({paid:true,tier:'lifetime',productId:'legacy',revoked:true}),'none');
const fixture = (status, data = {}) => ({ response: { ok: status === 200, status }, data });
let license, team, verified, subject, providerCalls, payload, checkoutResult, suiteUnset, upgradeUnset, partnerLifetime, partnerFails, partnerConfigured, partnerCalls;
function reset() {
  license = fixture(404); team = fixture(404); verified = 'verified'; subject = 'owner'; providerCalls = 0; suiteUnset = false; upgradeUnset = false;
  checkoutResult = { ok: true, status: 200, json: async () => ({ checkout_url: 'https://checkout.example/session' }) };
  partnerLifetime = false; partnerFails = false; partnerConfigured = true; partnerCalls = [];
}
const checkoutImports = {
  'node:crypto': { randomUUID: () => 'server-attempt' },
  'next/server': { NextResponse: { json: (data, init = {}) => ({ status: init.status || 200, data }) } },
  '@clerk/nextjs/server': {
    auth: async () => ({ userId: subject }),
    currentUser: async () => ({ primaryEmailAddress: { emailAddress: 'Owner@example.com', verification: { status: verified } } }),
  },
  '@/lib/dodo': {
    getProductId: tier => `product-${tier}`, getPurchasableProductIds: () => ['product-team', 'product-lifetime'],
    getDodoApiBaseUrl: () => 'https://mock.invalid', getCheckoutReturnUrl: () => 'https://buckets.example/payment-status',
    getTierForProductId: product => product.replace('product-', ''), isCheckoutTier: tier => ['monthly','yearly','lifetime','team','suite','suite-upgrade'].includes(tier),
    getSuiteProductId: () => { if (suiteUnset) throw new Error('SUITE_DODO_PRODUCT_ID_LIFETIME is not set'); return 'product-suite'; },
    getSuiteUpgradeProductId: () => { if (upgradeUnset) throw new Error('SUITE_UPGRADE_DODO_PRODUCT_ID_LIFETIME is not set'); return 'product-upgrade'; },
    MIN_TEAM_SEATS: 3, MAX_TEAM_SEATS: 50,
  },
  '@/lib/suite-offer': suiteOffer,
  '@/lib/maintenance': { isMaintenanceMode: () => false },
  '@/lib/license-api': { getLicenseForAccount: async () => { if (license instanceof Error) throw license; return license; }, getTeamByOwner: async () => team },
  '@/lib/plan-options': options,
  '@/lib/partner-license': {
    partnerLookupConfigured: () => partnerConfigured,
    partnerOwnsLifetime: async email => { partnerCalls.push(email); if (partnerFails) throw new Error('partner down'); return partnerLifetime; },
  },
};
const providerFetch = async (_, init) => { providerCalls++; payload = JSON.parse(init.body); return checkoutResult; };
const checkout = load('src/app/api/dodo/create-checkout/route.ts', checkoutImports, { fetch: providerFetch });
const post = body => checkout.POST({ json: async () => body, nextUrl: { origin: 'https://buckets.example' } });
(async () => {
  for (const bad of [fixture(503), new Error('outage'), fixture(200, { clerkId: 'someone-else' })]) {
    reset(); license = bad;
    assert.ok([403,503].includes((await post({ tier: 'lifetime' })).status)); assert.equal(providerCalls, 0);
  }
  reset(); verified = 'unverified'; assert.equal((await post({ tier: 'lifetime' })).status, 400); assert.equal(providerCalls,0);
  reset(); subject = null; assert.equal((await post({ tier: 'lifetime' })).status,401);
  for (const owned of [{ paid: true, tier: 'lifetime' }, { paid: true }, { paid: true, tier: 'monthly', subscriptionStatus: 'past_due' }]) {
    reset(); license = fixture(200, owned); assert.equal((await post({ tier: 'monthly' })).status,409); assert.equal(providerCalls,0);
  }
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' });
  assert.equal((await post({ tier: 'team', seats: 3, metadata: { checkoutAttemptId: 'spoof', tier: 'monthly' } })).status,200);
  assert.equal(payload.product_cart[0].quantity,3); assert.equal(payload.metadata.checkoutAttemptId,'server-attempt');
  assert.equal(payload.metadata.tier,'team'); assert.equal(new URL(payload.return_url).searchParams.get('expected_tier'),'team');
  assert.equal(new URL(payload.return_url).searchParams.get('checkout_attempt_id'),'server-attempt');
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); team = fixture(200, { subscriptionId: 'team-sub', subscriptionStatus: 'active' });
  assert.equal((await post({ tier: 'team', seats: 3 })).status,409); assert.equal(providerCalls,0);
  reset(); team = fixture(503); assert.equal((await post({ tier: 'team', seats: 3 })).status,503);
  for (const quantity of [undefined, 1, 2, 2.5, 51, '3']) {
    reset(); assert.equal((await post({ productId:'product-team', quantity })).status,400); assert.equal(providerCalls,0);
  }
  // An unknown or retired Team product is not in the purchasable list, so it can never be sold.
  reset(); assert.equal((await post({ productId:'pdt_old_team_99', quantity:3 })).status,400); assert.equal(providerCalls,0);
  // Same route with the REAL product mapping: an env still naming a retired
  // product (declared via env) fails closed and never reaches the provider;
  // the configured Team product is what gets sold.
  for (const [teamProduct, expected] of [['pdt_old_team_99', 500], ['pdt_team_49', 200]]) {
    const env = { DODO_API_KEY: 'mock-only', BUCKETS_DODO_PRODUCT_ID_TEAM: teamProduct, BUCKETS_DODO_LEGACY_PRODUCT_IDS_TEAM: 'pdt_old_team_99' };
    const realDodo = load('src/lib/dodo.ts', { 'server-only': {}, '@/lib/reddit': load('src/lib/reddit.ts', { '@/lib/suite-offer': suiteOffer }), '@/lib/suite-offer': suiteOffer }, { process: { env } });
    const real = load('src/app/api/dodo/create-checkout/route.ts', { ...checkoutImports, '@/lib/dodo': realDodo }, { fetch: providerFetch, process: { env } });
    reset(); payload = undefined;
    assert.equal((await real.POST({ json: async () => ({ tier: 'team', seats: 3 }), nextUrl: { origin: 'https://buckets.example' } })).status, expected);
    if (expected === 500) assert.equal(providerCalls, 0);
    else assert.deepEqual(payload.product_cart, [{ product_id: 'pdt_team_49', quantity: 3 }]);
    reset();
    assert.equal((await real.POST({ json: async () => ({ productId: 'pdt_old_team_99', quantity: 3 }), nextUrl: { origin: 'https://buckets.example' } })).status, 400);
    assert.equal(providerCalls, 0);
  }
  reset(); assert.equal((await post({ productId:'product-team', quantity:3 })).status,200); assert.equal(payload.metadata.tier,'team');
  reset(); assert.equal((await post({ tier:'lifetime', quantity:2 })).status,400);
  reset(); assert.equal((await post(null)).status,400);
  reset(); checkoutResult = { ok:true, status:200, json:async () => ({}) }; assert.equal((await post({ tier:'lifetime' })).status,502);
  // ─── Tables + Buckets Suite ($149): one Dodo product, claimed by both webhooks ───
  assert.equal(options.checkoutAllowed('none', 'suite'), true);
  assert.equal(options.checkoutAllowed('monthly', 'suite'), true, 'subscribers upgrade to the Suite');
  assert.equal(options.checkoutAllowed('yearly', 'suite'), true);
  assert.equal(options.checkoutAllowed('lifetime', 'suite'), false, 'a Lifetime owner would pay for Buckets twice');
  assert.equal(options.checkoutAllowed('early', 'suite'), false);
  assert.equal(options.checkoutAllowed('team', 'suite'), false, 'same rule as Lifetime for team-covered accounts');
  assert.match(options.checkoutBlockedMessage('lifetime', 'suite'), /Add Tables Lifetime for \$49/);
  assert.match(options.checkoutBlockedMessage('early', 'suite'), /Add Tables Lifetime for \$49/);
  assert.match(options.checkoutBlockedMessage('team', 'suite'), /Team plan.*Tables Lifetime on its own/);
  assert.equal(options.checkoutBlockedHref('lifetime', 'suite'), '/buy?tier=suite-upgrade');
  assert.equal(options.checkoutBlockedHref('early', 'suite'), '/buy?tier=suite-upgrade');
  assert.equal(options.checkoutBlockedHref('team', 'suite'), 'https://tables.serverlesscreed.com/pricing');
  assert.equal(options.checkoutBlockedCta('lifetime', 'suite'), 'Add Tables Lifetime for $49');
  assert.equal(options.checkoutBlockedCta('team', 'suite'), 'Get Tables Lifetime');
  // ─── Suite upgrade ($49): Tables Lifetime for a Buckets Lifetime owner, claimed by the Tables webhook only ───
  assert.equal(options.SUITE_UPGRADE_PRICE_USD, suiteOffer.SUITE_UPGRADE_PRICE_USD);
  assert.equal(options.SUITE_UPGRADE_HREF, suiteOffer.SUITE_UPGRADE_PATH);
  assert.equal(suiteOffer.SUITE_UPGRADE_TARGET_APP, 'serverless-tables');
  assert.equal(options.checkoutAllowed('lifetime', 'suite-upgrade'), true);
  assert.equal(options.checkoutAllowed('early', 'suite-upgrade'), true);
  for (const current of ['none', 'monthly', 'yearly', 'team']) {
    assert.equal(options.checkoutAllowed(current, 'suite-upgrade'), false, `${current} is not priced for the upgrade`);
    assert.match(options.checkoutBlockedMessage(current, 'suite-upgrade'), /Buckets Lifetime owners/);
    assert.equal(options.checkoutBlockedHref(current, 'suite-upgrade'), '/buy?tier=suite');
    assert.equal(options.checkoutBlockedCta(current, 'suite-upgrade'), 'Get the Suite');
  }
  assert.equal(options.checkoutBlockedHref('team', 'lifetime'), options.TEAM_URL);
  assert.equal(options.checkoutBlockedHref('lifetime', 'lifetime'), options.BILLING_URL);
  const same = (actual, expected) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
  same(options.suiteActionFor('none'), { kind: 'checkout' });
  same(options.suiteActionFor('yearly'), { kind: 'switch', label: 'Upgrade to the Suite', href: '/buy?tier=suite' });
  same(options.suiteActionFor('lifetime'), { kind: 'switch', label: 'Add Tables Lifetime — $49', href: '/buy?tier=suite-upgrade' });
  same(options.suiteActionFor('early'), { kind: 'switch', label: 'Add Tables Lifetime — $49', href: '/buy?tier=suite-upgrade' });
  same(options.suiteActionFor('team'), { kind: 'switch', label: 'Get Tables Lifetime', href: 'https://tables.serverlesscreed.com/pricing' });
  reset();
  const suiteResponse = await post({ tier: 'suite', metadata: { app: 'forged', bundle: 'forged', originApp: 'forged', acceptedTermsVersion: 'v1' } });
  assert.equal(suiteResponse.status, 200); assert.equal(suiteResponse.data.tier, 'lifetime'); assert.equal(suiteResponse.data.bundle, 'tables-buckets');
  assert.deepEqual(payload.product_cart, [{ product_id: 'product-suite', quantity: 1 }]);
  assert.equal(payload.metadata.app, 'serverless-suite'); assert.equal(payload.metadata.bundle, 'tables-buckets');
  assert.equal(payload.metadata.originApp, 'serverless-buckets'); assert.equal(payload.metadata.tier, 'lifetime');
  assert.equal(payload.metadata.accountSubject, 'owner'); assert.equal(payload.metadata.accountEmail, 'Owner@example.com');
  assert.equal(payload.metadata.acceptedTermsVersion, 'v1'); assert.equal(payload.metadata.checkoutAttemptId, 'server-attempt');
  assert.equal(new URL(payload.return_url).searchParams.get('expected_tier'), 'lifetime');
  assert.equal(new URL(payload.return_url).searchParams.get('bundle'), 'suite');
  reset(); assert.equal((await post({ tier: 'lifetime', metadata: { bundle: 'tables-buckets', originApp: 'serverless-tables' } })).status, 200);
  assert.equal(payload.metadata.app, 'serverless-buckets'); assert.equal(payload.metadata.bundle, undefined); assert.equal(payload.metadata.originApp, undefined);
  assert.equal(new URL(payload.return_url).searchParams.get('bundle'), null);
  reset(); suiteUnset = true; assert.equal((await post({ tier: 'suite' })).status, 500); assert.equal(providerCalls, 0);
  for (const owned of [{ paid: true, tier: 'lifetime' }, { paid: true }]) {
    reset(); license = fixture(200, owned); const blocked = await post({ tier: 'suite' });
    assert.equal(blocked.status, 409); assert.equal(blocked.data.code, 'plan_already_owned'); assert.equal(blocked.data.manageUrl, '/buy?tier=suite-upgrade'); assert.equal(providerCalls, 0);
  }
  reset(); license = fixture(200, { paid: true, tier: 'team' }); const teamBlocked = await post({ tier: 'suite' });
  assert.equal(teamBlocked.status, 409); assert.equal(teamBlocked.data.manageUrl, 'https://tables.serverlesscreed.com/pricing'); assert.equal(providerCalls, 0);
  for (const upgrader of [{ paid: true, tier: 'monthly', subscriptionStatus: 'active' }, { paid: true, tier: 'yearly', subscriptionStatus: 'past_due' }]) {
    reset(); license = fixture(200, upgrader); assert.equal((await post({ tier: 'suite' })).status, 200); assert.equal(providerCalls, 1);
  }
  reset(); license = fixture(200, { clerkId: 'someone-else' }); assert.equal((await post({ tier: 'suite' })).status, 403); assert.equal(providerCalls, 0);
  reset(); license = fixture(503); assert.equal((await post({ tier: 'suite' })).status, 503); assert.equal(providerCalls, 0);
  reset(); assert.equal((await post({ tier: 'suite', quantity: 2 })).status, 400);
  reset(); assert.equal((await post({ productId: 'product-suite' })).status, 400); assert.equal(providerCalls, 0);
  // Suite upgrade: sold only to Buckets Lifetime owners, routed to the Tables webhook with this site as origin.
  for (const owner of [{ paid: true, tier: 'lifetime', clerkId: 'owner' }, { paid: true }, { tier: 'lifetime', paid: 'true', productId: 'legacy', effectiveActive: true }, { paid: 'yes' }, { tier: 'lifetime', paid: true, effectiveActive: true, validUntil: 1 }]) {
    reset(); license = fixture(200, owner);
    const upgrade = await post({ tier: 'suite-upgrade', metadata: { app: 'forged', bundle: 'forged', originApp: 'forged', acceptedTermsVersion: 'v1' } });
    assert.equal(upgrade.status, 200); assert.equal(upgrade.data.tier, 'lifetime'); assert.equal(upgrade.data.bundle, 'suite-upgrade'); assert.equal(providerCalls, 1);
    assert.deepEqual(payload.product_cart, [{ product_id: 'product-upgrade', quantity: 1 }]);
    assert.equal(payload.metadata.app, 'serverless-tables', 'claimed by the Tables webhook, foreign to the Buckets webhook');
    assert.equal(payload.metadata.bundle, 'suite-upgrade'); assert.equal(payload.metadata.originApp, 'serverless-buckets');
    assert.equal(payload.metadata.tier, 'lifetime'); assert.equal(payload.metadata.accountSubject, 'owner'); assert.equal(payload.metadata.accountEmail, 'Owner@example.com');
    assert.equal(payload.metadata.acceptedTermsVersion, 'v1');
    const upgradeReturn = new URL(payload.return_url);
    assert.equal(upgradeReturn.searchParams.get('expected_tier'), 'lifetime'); assert.equal(upgradeReturn.searchParams.get('bundle'), 'suite-upgrade');
    assert.equal(upgradeReturn.searchParams.get('checkout_attempt_id'), payload.metadata.checkoutAttemptId);
  }
  for (const notOwner of [{ tier: 'lifetime', paid: false }, { tier: 'lifetime', paid: 'false' }, { tier: 'lifetime', paid: true, effectiveActive: false }, { tier: 'lifetime', paid: true, disputed: true }, { tier: 'lifetime', paid: true, disputed: 'true', effectiveActive: true }, { tier: 'lifetime', paid: 'true', revoked: 'yes' }, { paid: 'true', effectiveActive: false }, { paid: true, disputed: true }, undefined, { paid: true, tier: 'monthly', subscriptionStatus: 'active' }, { paid: true, tier: 'yearly', subscriptionStatus: 'past_due' }, { paid: true, tier: 'team' }, { paid: true, tier: 'lifetime', revoked: true }, { paid: false, onTrial: true }, { paid: true, tier: 'monthly', subscriptionStatus: 'canceled' }]) {
    reset(); if (notOwner) license = fixture(200, notOwner);
    const refused = await post({ tier: 'suite-upgrade' });
    assert.equal(refused.status, 409, JSON.stringify(notOwner)); assert.equal(refused.data.code, 'lifetime_required'); assert.equal(refused.data.manageUrl, '/buy?tier=suite'); assert.equal(providerCalls, 0);
  }
  reset(); license = fixture(200, { clerkId: 'someone-else' }); assert.equal((await post({ tier: 'suite-upgrade' })).status, 403); assert.equal(providerCalls, 0);
  reset(); license = fixture(503); assert.equal((await post({ tier: 'suite-upgrade' })).status, 503); assert.equal(providerCalls, 0);
  reset(); license = new Error('outage'); assert.equal((await post({ tier: 'suite-upgrade' })).status, 503); assert.equal(providerCalls, 0);
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); upgradeUnset = true; assert.equal((await post({ tier: 'suite-upgrade' })).status, 500); assert.equal(providerCalls, 0);
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); assert.equal((await post({ tier: 'suite-upgrade', quantity: 2 })).status, 400);
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); assert.equal((await post({ productId: 'product-upgrade' })).status, 400); assert.equal(providerCalls, 0);
  // ─── Owning the OTHER app (Tables Lifetime) — learned from the Tables backend by verified email ───
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); partnerLifetime = true;
  const bothOwned = await post({ tier: 'suite-upgrade' });
  assert.equal(bothOwned.status, 409); assert.equal(bothOwned.data.code, 'already_owned'); assert.equal(bothOwned.data.manageUrl, '/suite'); assert.equal(providerCalls, 0);
  assert.deepEqual(partnerCalls, ['Owner@example.com'], 'asked with the verified Clerk email');
  for (const plan of [undefined, { paid: true, tier: 'monthly', subscriptionStatus: 'active' }, { paid: true, tier: 'team' }]) {
    for (const tier of ['suite', 'suite-upgrade']) {
      reset(); if (plan) license = fixture(200, plan); partnerLifetime = true;
      const sent = await post({ tier });
      assert.equal(sent.status, 409, `${tier} ${JSON.stringify(plan)}`); assert.equal(sent.data.code, 'partner_owned');
      assert.equal(sent.data.manageUrl, 'https://tables.serverlesscreed.com/buy?tier=suite-upgrade'); assert.match(sent.data.cta, /\$49/); assert.equal(providerCalls, 0);
    }
  }
  for (const tier of ['suite', 'suite-upgrade']) {
    reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); partnerFails = true;
    assert.equal((await post({ tier })).status, 503, `${tier} fails closed when Tables cannot answer`); assert.equal(providerCalls, 0);
  }
  reset(); partnerLifetime = true; assert.equal((await post({ tier: 'lifetime' })).status, 200); assert.deepEqual(partnerCalls, [], 'never asked for Buckets-only plans');
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); partnerConfigured = false; partnerFails = true;
  assert.equal((await post({ tier: 'suite-upgrade' })).status, 200, 'skipped where unconfigured (local dev)'); assert.deepEqual(partnerCalls, []);
  reset(); assert.equal((await post({ tier: 'suite' })).status, 200, 'no Tables Lifetime: the Suite sells as before');
  // A Buckets Lifetime owner who ALSO owns a Buckets Team keeps the $49 upgrade (it sells Tables)...
  const ownedTeam = fixture(200, { ownerEmail: 'Owner@example.com', ownerClerkId: 'owner', subscriptionId: 'team-sub', subscriptionStatus: 'active' });
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); team = ownedTeam;
  assert.equal((await post({ tier: 'suite-upgrade' })).status, 200, 'Lifetime + Team owner may add Tables for $49'); assert.equal(providerCalls, 1);
  // ...while every other purchase still stops at the owned team.
  reset(); license = fixture(200, { paid: true, tier: 'lifetime' }); team = ownedTeam;
  assert.equal((await post({ tier: 'team', seats: 3 })).status, 409); assert.equal(providerCalls, 0);
  reset(); team = ownedTeam; assert.equal((await post({ tier: 'suite' })).status, 409); assert.equal(providerCalls, 0);
  // ─── Suite page state across both apps ───
  assert.equal(options.SUITE_PARTNER_UPGRADE_URL, suiteOffer.SUITE_PARTNER.upgradeUrl);
  const yes = { partnerLifetime: true, viaSuite: false }, no = { partnerLifetime: false, viaSuite: false }, unknown = { partnerLifetime: null, viaSuite: false };
  assert.equal(options.suiteStateFor('none', null), 'public');
  assert.equal(options.suiteStateFor('none', no), 'public');
  assert.equal(options.suiteStateFor('monthly', no), 'subscriber');
  assert.equal(options.suiteStateFor('yearly', unknown), 'subscriber');
  assert.equal(options.suiteStateFor('team', no), 'team');
  assert.equal(options.suiteStateFor('lifetime', no), 'upgrade-here');
  assert.equal(options.suiteStateFor('early', unknown), 'upgrade-here', 'unknown partner never claims ownership');
  assert.equal(options.suiteStateFor('lifetime', yes), 'owned');
  assert.equal(options.suiteStateFor('early', yes), 'owned');
  for (const current of ['none', 'monthly', 'yearly', 'team']) assert.equal(options.suiteStateFor(current, yes), 'upgrade-there');
  assert.equal(options.suiteStateFor('lifetime', { partnerLifetime: null, viaSuite: true }), 'owned', 'Suite grant implies Tables when the lookup is down');
  assert.equal(options.suiteStateFor('lifetime', { partnerLifetime: false, viaSuite: true }), 'upgrade-here', 'a live no wins');
  for (const target of ['monthly', 'yearly', 'lifetime', 'team']) assert.equal(options.suitePartnerBlock('lifetime', target, true), null);
  assert.equal(options.suitePartnerBlock('lifetime', 'suite', false), null);
  // Team portal must select the team customer even when its owner keeps a
  // separate personal Lifetime customer; members cannot open owner billing.
  let portalUrl;
  const portal = load('src/app/api/dodo/portal-session/route.ts', {
    '@/lib/invoice-access': load('src/lib/invoice-access.ts'),
    'next/server': { NextResponse: { json: (data, init = {}) => ({ status: init.status || 200, data }) } },
    '@clerk/nextjs/server': {
      auth: async () => ({ userId:'owner' }),
      currentUser: async () => ({ primaryEmailAddress:{ emailAddress:'Owner@example.com', verification:{status:verified} } }),
    },
    '@/lib/dodo': { getDodoApiBaseUrl:() => 'https://mock.invalid', getProductAppOrigin:() => 'https://buckets.example' },
    '@/lib/license-api': { getLicenseForAccount: async () => license, getTeamByOwner: async () => team },
  }, { fetch: async url => { portalUrl = new URL(url); return { ok:true, json:async () => ({ link:'https://customer.dodopayments.com/session/test' }) }; } });
  reset(); license=fixture(200,{ tier:'lifetime',dodoCustomerId:'personal-customer' });
  team=fixture(200,{ dodoCustomerId:'team-customer', ownerEmail:'Owner@example.com', ownerClerkId:'owner' });
  assert.equal((await portal.POST({ json:async () => ({ scope:'team', email:'attacker@example.com' }),nextUrl:{origin:'https://buckets.example'} })).status,200);
  assert.match(portalUrl.pathname,/team-customer/);
  assert.match(portalUrl.searchParams.get('return_url'),/account\/team/);
  license=fixture(200,{ tier:'team',teamOwner:'other@example.com',dodoCustomerId:'owner-customer' });
  assert.equal((await portal.POST({ json:async () => ({}),nextUrl:{origin:'https://buckets.example'} })).status,403);
  verified='unverified'; assert.equal((await portal.POST({ json:async () => ({scope:'team'}),nextUrl:{origin:'https://buckets.example'} })).status,400);
  verified='verified'; team=fixture(200,{ dodoCustomerId:'team-customer',ownerClerkId:'another-owner' });
  assert.equal((await portal.POST({ json:async () => ({scope:'team'}),nextUrl:{origin:'https://buckets.example'} })).status,403);
  // Exact/lowercase compatibility must retain the authenticated subject on
  // both lookups; a bound team can never fall back to email-only ownership.
  const teamUrls=[];
  const api = load('src/lib/license-api.ts', { 'server-only':{} }, {
    process:{ env:{ LICENSE_API_URL:'https://license.mock', LICENSE_API_KEY:'mock' } },
    AbortSignal,
    fetch: async url => { teamUrls.push(url); return { status:teamUrls.length===1?404:200,json:async () => ({}) }; },
  });
  await api.getTeamByOwner('Owner@example.com','clerk-owner');
  assert.equal(teamUrls.length,2);
  assert.equal(new URL(teamUrls[0]).searchParams.get('ownerEmail'),'Owner@example.com');
  assert.equal(new URL(teamUrls[1]).searchParams.get('ownerEmail'),'owner@example.com');
  for (const url of teamUrls) assert.equal(new URL(url).searchParams.get('ownerSubject'),'clerk-owner');
  for (const action of ['invite','remove']) {
    let forwarded;
    const mutation=load(`src/app/api/team/${action}/route.ts`, {
      'next/server':{ NextResponse:{json:(data,init={}) => ({status:init.status||200,data})} },
      '@clerk/nextjs/server':{currentUser:async () => ({id:'owner',primaryEmailAddress:{emailAddress:'Owner@example.com',verification:{status:verified}}})},
    }, { process:{env:{LICENSE_API_URL:'https://license.mock',LICENSE_API_KEY:'mock'}},
      fetch:async (_,init) => { forwarded=JSON.parse(init.body); return {status:200,json:async () => ({})}; },
    });
    verified='unverified'; assert.equal((await mutation.POST({json:async () => ({memberEmail:'member@example.com'})})).status,401);
    assert.equal(forwarded,undefined);
    verified='verified'; await mutation.POST({json:async () => ({memberEmail:'member@example.com',ownerSubject:'spoof',ownerEmail:'spoof@example.com'})});
    assert.equal(forwarded.ownerSubject,'owner'); assert.equal(forwarded.ownerEmail,'Owner@example.com');
  }
  // A committed provider mutation with a lost HTTP response must not charge
  // again on a sequential retry while its webhook is still pending.
  let providerState={quantity:3,status:'active',product_id:'product-team',customer:{customer_id:'team-customer'},metadata:{checkoutAttemptId:'original',acceptedTermsVersion:'terms',app:'spoof'}};
  let seatPosts=0, seatPayload, loseSeatResponse=true;
  const seatRoute=load('src/app/api/team/seats/route.ts', {
    'next/server':{NextResponse:{json:(data,init={}) => ({status:init.status||200,data})}},
    '@clerk/nextjs/server':{auth:async () => ({userId:'owner'}),currentUser:async () => ({primaryEmailAddress:{emailAddress:'Owner@example.com',verification:{status:verified}}})},
    '@/lib/dodo':{getDodoApiBaseUrl:() => 'https://provider.mock',getProductId:() => 'product-team',MAX_TEAM_SEATS:50,MIN_TEAM_SEATS:3},
    '@/lib/license-api':{getTeamByOwner:async (_,subject) => {assert.equal(subject,'owner'); return fixture(200,{ownerEmail:'Owner@example.com',ownerClerkId:'owner',subscriptionId:'sub-team',seatsPurchased:3,seatsUsed:2,dodoCustomerId:'team-customer'});}},
  },{AbortSignal,fetch:async (_,init) => {
    if (init.method!=='POST') return {ok:true,json:async () => providerState};
    seatPosts++; seatPayload=JSON.parse(init.body); providerState={...providerState,quantity:seatPayload.quantity};
    if (loseSeatResponse) throw new Error('mock lost response');
    return {ok:true,json:async () => ({})};
  }});
  const changeSeats = seats => seatRoute.POST({json:async () => ({seats})});
  verified='verified'; assert.equal((await changeSeats(4)).status,500); assert.equal(seatPosts,1);
  const recovered=await changeSeats(4); assert.equal(recovered.status,200); assert.equal(recovered.data.pending,true); assert.equal(seatPosts,1);
  assert.equal(seatPayload.metadata.checkoutAttemptId,'original'); assert.equal(seatPayload.metadata.acceptedTermsVersion,'terms');
  assert.equal(seatPayload.metadata.app,'serverless-buckets'); assert.equal(seatPayload.metadata.accountSubject,'owner');
  assert.equal((await changeSeats(5)).status,409); assert.equal(seatPosts,1);
  providerState={...providerState,quantity:3,product_id:'other-product'};
  assert.equal((await changeSeats(4)).status,409); assert.equal(seatPosts,1);
  providerState={...providerState,product_id:'product-team',status:'past_due'};
  assert.equal((await changeSeats(4)).status,409); assert.equal(seatPosts,1);
  providerState={...providerState,status:'active'}; loseSeatResponse=false;
  assert.equal((await changeSeats(4)).status,200); assert.equal(seatPosts,2);
  // Browser duplicate-click/Strict Mode, reload recovery, account separation,
  // transient error recovery, expiry and post-success cleanup.
  const stored = new Map(); let requests = 0; let release;
  const storage = { getItem:k => stored.get(k), setItem:(k,v) => stored.set(k,v), removeItem:k => stored.delete(k), key:i => [...stored.keys()][i], get length() { return stored.size; } };
  const globals = { sessionStorage: storage, fetch: async () => { requests++; await new Promise(r => { release = r; }); return { ok:true, json:async () => ({ checkout_url:'https://checkout.example/reused' }) }; } };
  const client = load('src/lib/checkout-client.ts', {}, globals);
  const first = client.createCheckout('u1', { tier:'lifetime' });
  const duplicate = client.createCheckout('u1', { tier:'lifetime', name:'loaded later' });
  assert.equal(first,duplicate); assert.equal(requests,1); release(); await first;
  const reloaded = load('src/lib/checkout-client.ts', {}, globals);
  await reloaded.createCheckout('u1', { tier:'lifetime' }); assert.equal(requests,1);
  const other = client.createCheckout('u2', { tier:'lifetime' }); assert.equal(requests,2); release(); await other;
  client.clearCheckout('u1'); assert.equal(stored.size,1);
  const fresh = client.createCheckout('u1', { tier:'lifetime' }); assert.equal(requests,3); release(); await fresh;
  for (const [key,value] of stored) { const saved=JSON.parse(value); saved.expires=0; stored.set(key,JSON.stringify(saved)); }
  const expired = client.createCheckout('u1', { tier:'lifetime' }); assert.equal(requests,4); release(); await expired;
  let fails = true; let retryCount=0;
  const retry = load('src/lib/checkout-client.ts', {}, { sessionStorage: storage, fetch: async () => { retryCount++; if (fails) throw new Error('network'); return { ok:true,json:async () => ({ checkout_url:'https://checkout.example/retry' }) }; } });
  await assert.rejects(retry.createCheckout('u3',{tier:'team',seats:3})); fails=false;
  await retry.createCheckout('u3',{tier:'team',seats:3}); assert.equal(retryCount,2);
  console.log('Checkout regression checks passed (mocked auth, license service, provider and browser storage).');
})().catch(error => { console.error(error); process.exitCode=1; });
