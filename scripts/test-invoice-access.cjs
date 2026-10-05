/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS route fixtures do not call live services. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const product = 'buckets';
function load(file, imports, globals = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, {
  exports, require: name => { assert.ok(name in imports, `Unexpected import ${name}`); return imports[name]; }, Response, URL, AbortSignal, console, ...globals,
 });
 return exports;
}
const invoicePolicy = load('src/lib/invoice-access.ts', {});
const billingPolicy = product === 'tables' ? load('src/lib/billing-policy.ts', {}) : {};
function fixture(options = {}) {
 const calls = [], provider = [];
 const email = 'Owner@example.test', subject = 'user-owner';
 const personal = { email, clerkId: subject, tier: 'monthly', paid: true, dodoCustomerId: 'personal-customer', ...options.personal };
 const team = { ownerEmail: email, ownerClerkId: subject, dodoCustomerId: 'team-customer', ...options.team };
 const result = (status, data) => ({ response: { ok: status >= 200 && status < 300, status }, data });
 const env = { DODO_API_KEY: 'mock-only', ...options.env };
 const imports = {
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  '@clerk/nextjs/server': {
   auth: async () => ({ userId: options.anonymous ? null : subject, getToken: async () => 'subject-token' }),
   currentUser: async () => ({ primaryEmailAddress: { emailAddress: email, verification: { status: options.unverified ? 'unverified' : 'verified' } } }),
  },
  '@/lib/dodo': { getDodoApiBaseUrl: () => 'https://test.dodopayments.com', getProductAppOrigin: () => `https://${product}.serverlesscreed.com` },
  '@/lib/license-api': {
   getLicenseByEmail: async address => { calls.push({ kind: 'personal', address }); return result(options.personalStatus ?? 200, personal); },
   getLicenseForAccount: async address => { calls.push({ kind: 'personal', address }); return result(options.personalStatus ?? 200, personal); },
   getTeamByOwner: async (address, ownerSubject) => { assert.equal(ownerSubject, subject); calls.push({ kind: 'team', address, ownerSubject }); return result(options.teamStatus ?? 404, team); },
  },
  '@/lib/invoice-access': invoicePolicy,
  '@/lib/billing-policy': billingPolicy,
 };
 const globals = { process: { env }, fetch: async (url, init) => {
  provider.push({ url: String(url), init });
  if (options.providerThrows) throw new Error('Provider timeout');
  if (String(url).startsWith('https://v2.example')) return Response.json(options.v2Body ?? { action: 'portal' }, { status: options.v2Status ?? 200 });
  return Response.json({ link: options.link ?? 'https://customer.dodopayments.com/session/fixture' }, { status: options.providerStatus ?? 200 });
 } };
 const access = load('src/app/api/billing/invoices/route.ts', imports, globals);
 const portal = load('src/app/api/dodo/portal-session/route.ts', imports, globals);
 return { calls, provider, get: () => access.GET(), post: body => portal.POST({ nextUrl: { origin: 'https://untrusted-origin.example' }, json: async () => ({ email: 'victim@example.test', customer_id: 'victim-customer', userId: 'victim', role: 'admin', ...body }) }) };
}
for (const options of [
 { name: 'signed out', anonymous: true, getStatus: 401, postStatus: 401 },
 { name: 'unverified email', unverified: true, getStatus: 403, postStatus: 400 },
 { name: 'foreign subject', personal: { clerkId: 'other-user' }, getStatus: 403, postStatus: 403 },
 { name: 'foreign email', personal: { email: 'other@example.test' }, getStatus: 403, postStatus: 403 },
]) test(`${options.name} cannot obtain financial access`, async () => {
 const f = fixture(options); assert.equal((await f.get()).status, options.getStatus); assert.equal((await f.post({})).status, options.postStatus); assert.equal(f.provider.length, 0);
 if(options.anonymous || options.unverified)assert.equal(f.calls.length,0);
});
for (const tier of ['monthly','yearly','lifetime']) for (const status of ['active','canceled','expired']) {
 test(`${tier} ${status} retains its own invoice history`, async () => {
  const f = fixture({ personal: { tier, subscriptionStatus: status, paid: status === 'active', validUntil: 1 } });
  const response = await f.get(); assert.equal(response.status,200); assert.equal(response.headers.get('Cache-Control'),'no-store');
  const body = await response.json(); assert.equal(body.accounts[0].status,'available');assert.equal(body.accounts[0].scope,'personal');
  assert.ok(!JSON.stringify(body).includes('personal-customer')); assert.ok(!JSON.stringify(body).includes('user-owner'));
  const portal = await f.post({ scope:'personal', returnTo:'invoices' }); assert.equal(portal.status,200);assert.equal(portal.headers.get('Cache-Control'),'no-store');
  const url = new URL(f.provider[0].url); assert.ok(url.pathname.includes('/personal-customer/'));assert.equal(url.searchParams.get('return_url'),`https://${product}.serverlesscreed.com/account/invoices?from=portal`);assert.equal(url.searchParams.get('send_email'),'false');
  assert.ok(f.provider[0].init.signal); assert.ok(!f.calls.some(call=>call.address==='victim@example.test'));
 });
}
test('empty trial and unmapped legacy license provide honest empty states', async () => {
 const trial=fixture({ personalStatus:404 }); assert.deepEqual(await (await trial.get()).json(),{accounts:[]});
 const legacy=fixture({personal:{tier:'lifetime',dodoCustomerId:undefined}});assert.equal((await (await legacy.get()).json()).accounts[0].status,'unavailable');assert.equal((await legacy.post({})).status,409);assert.equal(legacy.provider.length,0);
});
for (const personal of [{tier:'team',teamOwner:'other@example.test'},{tier:'team',teamOwner:undefined},{tier:'lifetime',teamOwner:'other@example.test'}]) {
 test(`inherited team customer cannot be used as personal authority (${JSON.stringify(personal)})`, async () => {
  const f=fixture({personal:{...personal,dodoCustomerId:'inherited-team-customer'}});
  assert.equal((await (await f.get()).json()).accounts[0].status,'managed_by_owner');
  assert.ok([403,409].includes((await f.post({scope:'personal',role:'admin'})).status));assert.equal(f.provider.length,0);
 });
}
for (const team of [{ownerEmail:'other@example.test'},{ownerClerkId:'other-user'}]) test(`team authority rejects ${JSON.stringify(team)}`,async()=>{
 const f=fixture({teamStatus:200,team});assert.equal((await f.get()).status,403);assert.equal((await f.post({scope:'team'})).status,403);assert.equal(f.provider.length,0);
});
test('Lifetime plus independently owned team keeps both rightful history paths',async()=>{
 const f=fixture({personal:{tier:'lifetime'},teamStatus:200});const body=await(await f.get()).json();assert.deepEqual(body.accounts.map(a=>a.scope),['personal','team']);
 assert.equal((await f.post({scope:'personal',returnTo:'invoices'})).status,200);assert.equal((await f.post({scope:'team',returnTo:'invoices'})).status,200);
 assert.ok(f.provider[0].url.includes('/personal-customer/'));assert.ok(f.provider[1].url.includes('/team-customer/'));
});
test('primary team owner resolves canonical team history only',async()=>{
 const f=fixture({personal:{tier:'team',teamOwner:'owner@example.test',dodoCustomerId:'old-inherited'},teamStatus:200});
 assert.deepEqual((await(await f.get()).json()).accounts.map(a=>a.scope),['team']);assert.equal((await f.post({})).status,200);assert.ok(f.provider[0].url.includes('/team-customer/'));
});
test('missing canonical TEAM customer never falls back to inherited seat customer',async()=>{
 const f=fixture({personal:{tier:'team',teamOwner:'owner@example.test',dodoCustomerId:'old-inherited'},teamStatus:200,team:{dodoCustomerId:undefined}});
 assert.equal((await(await f.get()).json()).accounts[0].status,'unavailable');assert.equal((await f.post({})).status,409);assert.equal(f.provider.length,0);
});
test('ownership lookup failures fail closed',async()=>{
 const f=fixture({personalStatus:503});assert.equal((await f.get()).status,503);assert.equal((await f.post({})).status,503);assert.equal(f.provider.length,0);
});
for(const link of ['https://evil.example/session','http://customer.dodopayments.com/session','https://customer.dodopayments.com.evil.example/session','https://name:secret@customer.dodopayments.com/session'])test(`rejects unsafe hosted link ${link}`,async()=>{
 assert.equal((await fixture({link}).post({})).status,502);
});
test('provider outage is retryable without exposing a portal session',async()=>{
 const f=fixture({providerThrows:true});const response=await f.post({});assert.ok(response.status>=500);assert.ok(!(await response.json()).link);
});
test('untrusted return destination is ignored',async()=>{
 const f=fixture();assert.equal((await f.post({returnTo:'https://evil.example'})).status,200);assert.equal(new URL(f.provider[0].url).searchParams.get('return_url'),`https://${product}.serverlesscreed.com/account/billing?from=portal`);
});
if(product==='tables') {
 test('v2 URL alone does not opt into undeployed billing routes',async()=>{
  const f=fixture({env:{CONTROL_PLANE_V2_API_URL:'https://v2.example'}});assert.equal((await f.get()).status,200);assert.equal((await f.post({})).status,200);assert.ok(f.provider.every(call=>!call.url.startsWith('https://v2.example')));
 });
 test('explicitly enabled v2 authorization denial never falls back',async()=>{
  const f=fixture({env:{CONTROL_PLANE_V2_API_URL:'https://v2.example',CONTROL_PLANE_V2_BILLING_ENABLED:'true'},v2Status:403});assert.equal((await f.get()).status,403);const callsBefore=f.calls.length;assert.equal((await f.post({})).status,403);assert.equal(f.calls.length,callsBefore);assert.ok(f.provider.every(call=>call.url.startsWith('https://v2.example')));
 });
 test('team scope does not depend on optional v2 team routes',async()=>{
  const f=fixture({teamStatus:200,env:{CONTROL_PLANE_V2_API_URL:'https://v2.example',CONTROL_PLANE_V2_BILLING_ENABLED:'true'},v2Status:403});assert.equal((await f.post({scope:'team'})).status,200);assert.ok(f.provider[0].url.includes('/team-customer/'));
 });
}

test('explicit foreign product rows cannot grant financial access',async()=>{
 const personal=fixture({personal:{product:'another-product'}});assert.equal((await personal.get()).status,403);assert.equal((await personal.post({})).status,403);assert.equal(personal.provider.length,0);
 const team=fixture({teamStatus:200,team:{product:'another-product'}});assert.equal((await team.get()).status,403);assert.equal((await team.post({scope:'team'})).status,403);assert.equal(team.provider.length,0);
});
test('invalid scope is rejected and financial failures are never cached',async()=>{
 const f=fixture();const response=await f.post({scope:'someone-else'});assert.equal(response.status,400);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(f.provider.length,0);
 const denied=await fixture({anonymous:true}).post({});assert.equal(denied.headers.get('Cache-Control'),'no-store');
});
