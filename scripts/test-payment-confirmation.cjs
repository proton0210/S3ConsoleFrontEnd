/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync, existsSync } = require('node:fs');
const ts = require('typescript');
function compile(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'exports', code)(name => { if (!(name in dependencies)) throw new Error(`Unmocked dependency ${name}`); return dependencies[name]; }, exports);
  return exports;
}
const policy = compile('src/lib/payment-confirmation.ts', {});
const attempt = 'ef094dbf-f3cd-43b0-92ca-048cde19e8e2';
const license = { paid: true, effectiveActive: true, key: 'test-key', tier: 'monthly', checkoutAttemptId: attempt, clerkId: 'user-a' };
const purchase = { checkoutAttemptId: attempt, expectedTier: 'monthly' };
const owner = 'owner@example.com';
const team = { ownerEmail: owner, effectiveActive: true, seatsPurchased: 3, checkoutAttemptId: attempt, members: [{ email: owner, isOwner: true }] };
const teamLicense = { ...license, tier: 'team', teamOwner: owner };
for (const scenario of [
  { name: 'old paid lifetime cannot confirm team purchase', row: { ...license, tier: 'lifetime', checkoutAttemptId: 'old' }, ref: { ...purchase, expectedTier: 'team' }, expected: null },
  { name: 'old monthly cannot confirm lifetime upgrade', row: license, ref: { ...purchase, expectedTier: 'lifetime' }, expected: null },
  { name: 'old purchase of same tier cannot confirm retry', row: { ...license, checkoutAttemptId: 'old' }, expected: null },
  { name: 'matching active solo confirms', expected: 'monthly' },
  { name: 'revoked row never confirms', row: { ...license, effectiveActive: false }, expected: null },
  { name: 'missing key never confirms', row: { ...license, key: undefined }, expected: null },
  { name: 'missing purchase never confirms', ref: {}, expected: null },
  { name: 'legacy subscription match confirms', row: { ...license, subscriptionId: 'sub_a' }, ref: { subscriptionId: 'sub_a' }, expected: 'monthly' },
  { name: 'legacy payment must match despite matching subscription', row: { ...license, subscriptionId: 'sub_a', paymentId: 'pay_old' }, ref: { subscriptionId: 'sub_a', paymentId: 'pay_new' }, expected: null },
  { name: 'current attempt cannot fall back to old payment', row: { ...license, checkoutAttemptId: 'old', paymentId: 'pay_a' }, ref: { ...purchase, paymentId: 'pay_a' }, expected: null },
  { name: 'team row absent waits', row: teamLicense, ref: { ...purchase, expectedTier: 'team' }, expected: null },
  { name: 'matching team and owner confirms', row: teamLicense, team, ref: { ...purchase, expectedTier: 'team' }, expected: 'team' },
  { name: 'lifetime owner team preserves perpetual key', row: { ...license, tier: 'lifetime', checkoutAttemptId: 'old' }, team, ref: { ...purchase, expectedTier: 'team' }, expected: 'team' },
  { name: 'team row written before owner fanout waits', row: license, team, ref: { ...purchase, expectedTier: 'team' }, expected: null },
  { name: 'old owner team row waits', row: { ...teamLicense, checkoutAttemptId: 'old' }, team, ref: { ...purchase, expectedTier: 'team' }, expected: null },
  { name: 'inactive team waits', row: teamLicense, team: { ...team, effectiveActive: false }, ref: { ...purchase, expectedTier: 'team' }, expected: null },
  { name: 'other team member cannot confirm as owner', row: { ...teamLicense, teamOwner: 'other@example.com' }, team, ref: { ...purchase, expectedTier: 'team' }, expected: null },
  { name: 'missing owner membership waits', row: teamLicense, team: { ...team, members: [] }, ref: { ...purchase, expectedTier: 'team' }, expected: null },
  // The Tables + Buckets Suite returns with expected_tier=lifetime (plus bundle=suite, which this policy ignores):
  // the webhook writes a lifetime row keyed by the same checkout attempt, so it confirms exactly like Lifetime.
  { name: 'suite purchase confirms as lifetime on this product', row: { ...license, tier: 'lifetime', productId: 'pdt_suite' }, ref: { ...purchase, expectedTier: 'lifetime' }, expected: 'lifetime' },
  { name: 'suite attempt does not confirm an older lifetime row', row: { ...license, tier: 'lifetime', checkoutAttemptId: 'old' }, ref: { ...purchase, expectedTier: 'lifetime' }, expected: null },
]) test(scenario.name, () => assert.equal(policy.confirmedPurchaseTier(scenario.row || license, scenario.team || null, scenario.ref || purchase, owner), scenario.expected));

function routeFixture(options = {}) {
  const calls = [];
  const compiled = compile('src/app/api/payment-success/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@clerk/nextjs/server': {
      auth: async () => ({ userId: options.anonymous ? null : 'user-a' }),
      currentUser: async () => ({ primaryEmailAddress: { emailAddress: 'Owner@Example.com', verification: { status: options.unverified ? 'unverified' : 'verified' } } }),
    },
    '@/lib/license-api': {
      getLicenseByEmail: async email => { calls.push(email); return { response: { ok: options.missing !== true, status: options.missing ? 404 : 200 }, data: options.row || license }; },
      getTeamByOwner: async (email, subject) => { assert.equal(subject, 'user-a'); calls.push(`team:${email}`); return { response: { ok: !!options.team, status: options.team ? 200 : 404 }, data: options.team || {} }; },
    },
    '@/lib/payment-confirmation': policy,
  });
  return { post: () => compiled.POST({ json: async () => options.body || { ...purchase, email: 'victim@example.com' } }), calls };
}
for (const scenario of [
  { name: 'route rejects anonymous', anonymous: true, status: 401 },
  { name: 'route rejects unverified email', unverified: true, status: 400 },
  { name: 'route rejects missing purchase', body: {}, status: 400 },
  { name: 'route rejects another Clerk subject', row: { ...license, clerkId: 'other' }, status: 403 },
  { name: 'route missing webhook stays pending', missing: true, state: 'pending' },
  { name: 'route previous payment stays pending', row: { ...license, checkoutAttemptId: 'old' }, state: 'pending' },
  { name: 'route confirms current webhook', state: 'paid' },
  { name: 'route confirms team for lifetime owner', row: { ...license, tier: 'lifetime', checkoutAttemptId: 'old' }, team, body: { ...purchase, expectedTier: 'team' }, state: 'paid' },
]) test(scenario.name, async () => {
  const f = routeFixture(scenario); const result = await f.post();
  assert.equal(result.status, scenario.status || 200); assert.equal(result.headers.get('Cache-Control'), 'no-store');
  if (scenario.state) assert.equal((await result.json()).status, scenario.state);
  assert.ok(!f.calls.includes('victim@example.com'));
});
test('repeated confirmation is read-only and stable', async () => {
  const f = routeFixture(); assert.deepEqual(await (await f.post()).json(), await (await f.post()).json());
});
test('sign-in preserves all payment query parameters', () => {
  const query = `checkout_attempt_id=${attempt}&expected_tier=team&payment_id=pay_a&status=succeeded`;
  assert.equal(new URL(policy.paymentSignInUrl(query), 'https://example.com').searchParams.get('redirect_url'), `/payment-status?${query}`);
});
test('abort releases retry delay without waiting for the next poll', async () => {
  const controller = new AbortController(); const result = policy.waitForNextPoll(60_000, controller.signal); controller.abort(); await result;
});

function clientFixture(options = {}) {
  const effects = [], states = [], redirects = [];
  const query = new URLSearchParams({ checkout_attempt_id: attempt, expected_tier: 'team', payment_id: 'pay_a', ...(options.query ?? {}) });
  const jsx = (type, props) => ({ type, props });
  const compiled = compile(existsSync('src/app/payment-status/payment-status-client.tsx') ? 'src/app/payment-status/payment-status-client.tsx' : 'src/app/payment-status/page.tsx', {
    'react': { useEffect: (effect, deps) => effects.push({ effect, deps }), useRef: value => ({ current: value }), useState: value => [value, next => states.push(next)], Suspense: 'suspense' },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'next/link': () => null,
    'next/navigation': { useRouter: () => ({ replace: url => redirects.push(url) }), useSearchParams: () => query },
    '@clerk/nextjs': { useAuth: () => ({ isLoaded: true, userId: options.signedOut ? null : 'user-a' }), useUser: () => ({ isLoaded: true, user: { primaryEmailAddress: { emailAddress: owner } } }) },
    'canvas-confetti': () => {}, 'react-icons/fa': {}, '@/components/ui/button': {}, '@/components/sections/header': () => null,
    'lucide-react': new Proxy({}, { get: (_, name) => `icon:${String(name)}` }), '@/components/account/kit': { CopyField: 'copy-field' },
    '@/lib/reddit': {}, '@/lib/suite-offer': compile('src/lib/suite-offer.ts', {}), '@/lib/payment-confirmation': policy, '@/lib/checkout-client': { clearCheckout: () => {} },
  });
  const tree = compiled.default();
  const content = tree.type === 'fragment' ? tree.props.children[1].props.children : tree;
  content.type();
  return { effects, states, redirects, query };
}
test('signed-out checkout returns to exact purchase after sign-in', () => {
  const f = clientFixture({ signedOut: true }); f.effects.at(-1).effect();
  assert.equal(f.redirects[0], policy.paymentSignInUrl(f.query.toString()));
});
test('aborted in-flight response cannot update success state', async () => {
  const original = global.fetch; let resolveResponse, request;
  global.fetch = (_url, init) => { request = init; return new Promise(resolve => { resolveResponse = resolve; }); };
  try {
    const f = clientFixture(); const cleanup = f.effects.at(-1).effect();
    assert.deepEqual(JSON.parse(request.body), { checkoutAttemptId: attempt, paymentId: 'pay_a', subscriptionId: null, expectedTier: 'team' });
    cleanup(); resolveResponse(Response.json({ status: 'paid', userData: license }));
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(!f.states.includes('succeeded')); assert.equal(request.signal.aborted, true);
  } finally { global.fetch = original; }
});
test('expired session preserves purchase on redirect and stops polling', async () => {
  const original = global.fetch; global.fetch = async () => new Response('', { status: 401 });
  let cleanup;
  try { const f = clientFixture(); cleanup = f.effects.at(-1).effect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(f.redirects[0], policy.paymentSignInUrl(f.query.toString())); }
  finally { cleanup?.(); global.fetch = original; }
});

test('invalid attempt cannot fall back to an older subscription', () => {
  assert.deepEqual(policy.purchaseReference({ checkoutAttemptId: 'invalid', subscriptionId: 'sub_old' }), {});
});
test('legacy perpetual owner can confirm their new team', () => {
  assert.equal(policy.confirmedPurchaseTier({ ...license, tier: undefined, checkoutAttemptId: 'old' }, team, { ...purchase, expectedTier: 'team' }, owner), 'team');
});

test('hung request times out so polling can retry', async () => {
  const original = global.fetch;
  global.fetch = (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
  });
  try {
    await assert.rejects(policy.fetchPaymentConfirmation({ checkoutAttemptId: attempt, paymentId: null, subscriptionId: null, expectedTier: 'monthly' }, new AbortController().signal, 5), error => error.name === 'TimeoutError');
  } finally { global.fetch = original; }
});

test('team lookup preserves Clerk email case and license ownership remains case-insensitive', async () => {
  const f = routeFixture({ row: { ...license, tier: 'lifetime' }, team: { ...team, ownerEmail: 'Owner@Example.com', members: [{ email: 'Owner@Example.com', isOwner: true }] }, body: { ...purchase, expectedTier: 'team' } });
  assert.equal((await (await f.post()).json()).status, 'paid');
  assert.ok(f.calls.includes('team:Owner@Example.com'));
});

test('team below the minimum seat count stays pending', () => {
  assert.equal(policy.confirmedPurchaseTier(teamLicense, { ...team, seatsPurchased: 2 }, { ...purchase, expectedTier: 'team' }, owner), null);
});
test('team belonging to a different subject is forbidden', async () => {
  const f = routeFixture({ row: { ...license, tier: 'lifetime' }, team: { ...team, ownerClerkId: 'other-user' }, body: { ...purchase, expectedTier: 'team' } });
  assert.equal((await f.post()).status, 403);
});

// A Suite upgrade (bundle=suite-upgrade) grants Tables Lifetime, not a Buckets
// license: the page must not poll this product's confirmation endpoint (it
// would end on "couldn't confirm" after ten minutes) and must not send a
// signed-out visitor through sign-in just to show Dodo's status.
test('suite upgrade return never polls this product and reports the partner handoff', () => {
  for (const signedOut of [false, true]) {
    const original = global.fetch; let polled = false;
    global.fetch = () => { polled = true; return new Promise(() => {}); };
    try {
      const f = clientFixture({ signedOut, query: { expected_tier: 'lifetime', bundle: 'suite-upgrade', status: 'succeeded' } });
      f.effects.at(-1).effect();
      assert.ok(f.states.includes('partner'), 'partner phase');
      assert.ok(!f.states.includes('processing') && !f.states.includes('timeout'));
      assert.equal(polled, false); assert.deepEqual(f.redirects, []);
    } finally { global.fetch = original; }
  }
  // Dodo's own terminal hints still win.
  const f = clientFixture({ query: { expected_tier: 'lifetime', bundle: 'suite-upgrade', status: 'cancelled' } });
  f.effects.at(-1).effect();
  assert.ok(f.states.includes('cancelled') && !f.states.includes('partner'));
});
