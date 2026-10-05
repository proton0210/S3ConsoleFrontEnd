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
assert.equal(options.currentPlanFromLicense({paid:true,tier:'lifetime',productId:'legacy'}),'early');
assert.equal(options.currentPlanFromLicense({paid:true}),'early');
assert.equal(options.currentPlanFromLicense({paid:true,tier:'lifetime',productId:'paid-lifetime'}),'lifetime');
assert.equal(options.currentPlanFromLicense({paid:true,tier:'lifetime',productId:'legacy',revoked:true}),'none');
const fixture = (status, data = {}) => ({ response: { ok: status === 200, status }, data });
let license, team, verified, subject, providerCalls, payload, checkoutResult;
function reset() {
  license = fixture(404); team = fixture(404); verified = 'verified'; subject = 'owner'; providerCalls = 0;
  checkoutResult = { ok: true, status: 200, json: async () => ({ checkout_url: 'https://checkout.example/session' }) };
}
const checkout = load('src/app/api/dodo/create-checkout/route.ts', {
  'node:crypto': { randomUUID: () => 'server-attempt' },
  'next/server': { NextResponse: { json: (data, init = {}) => ({ status: init.status || 200, data }) } },
  '@clerk/nextjs/server': {
    auth: async () => ({ userId: subject }),
    currentUser: async () => ({ primaryEmailAddress: { emailAddress: 'Owner@example.com', verification: { status: verified } } }),
  },
  '@/lib/dodo': {
    getProductId: tier => `product-${tier}`, getConfiguredProductIds: () => ['product-team', 'product-lifetime'],
    getDodoApiBaseUrl: () => 'https://mock.invalid', getCheckoutReturnUrl: () => 'https://buckets.example/payment-status',
    getTierForProductId: product => product.replace('product-', ''), isLicenseTier: tier => ['monthly','yearly','lifetime','team'].includes(tier),
    MIN_TEAM_SEATS: 3, MAX_TEAM_SEATS: 50,
  },
  '@/lib/maintenance': { isMaintenanceMode: () => false },
  '@/lib/license-api': { getLicenseForAccount: async () => { if (license instanceof Error) throw license; return license; }, getTeamByOwner: async () => team },
  '@/lib/plan-options': options,
}, { fetch: async (_, init) => { providerCalls++; payload = JSON.parse(init.body); return checkoutResult; } });
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
  reset(); assert.equal((await post({ productId:'product-team', quantity:3 })).status,200); assert.equal(payload.metadata.tier,'team');
  reset(); assert.equal((await post({ tier:'lifetime', quantity:2 })).status,400);
  reset(); assert.equal((await post(null)).status,400);
  reset(); checkoutResult = { ok:true, status:200, json:async () => ({}) }; assert.equal((await post({ tier:'lifetime' })).status,502);
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
