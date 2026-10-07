import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';
class JsonResponse {
  constructor(data, init = {}) { this.data = data; this.status = init.status ?? 200; }
  clone() { return this; }
  async json() { return this.data; }
}
const next = { NextResponse: { json: (data, init) => new JsonResponse(data, init) } };
const load = (file, imports, globals = {}) => {
  const exports = {};
  const context = vm.createContext({ exports, require: name => {
    if (name in imports) return imports[name]; throw Error(`Unexpected import ${name}`);
  }, URL, AbortSignal, console, process: { env: { DODO_API_KEY: 'mock-only' } }, ...globals });
  vm.runInContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return exports;
};
let row, sequence, writes, providerMode, unblock, entered, dispatchLost, settled, lastDispatch;
const fixture = (status, data) => ({ response: { ok: status < 400, status }, data });
function reset() { row = null; sequence = 0; writes = 0; providerMode = 'ok'; dispatchLost = false; settled = false; lastDispatch = null; }
async function ledger(_path, init) {
  const q = JSON.parse(init.body);
  if (q.action === 'claim') {
    if (row?.state === 'completed') {
      if (row.fingerprint === q.fingerprint) return fixture(200, { state:'replay',operationId:row.operationId,result:row.result });
      if (row.resource === 'checkout') return fixture(409,{state:'conflict',operationId:row.operationId});
      if (!settled) return fixture(409,{state:'pending',operationId:row.operationId});
    } else if (row) return fixture(409,{state:'pending',operationId:row.operationId});
    row = { ...q,state:'prepared',operationId:`op-${++sequence}`,ownerToken:`token-${sequence}` };
    return fixture(200,{state:'acquired',operationId:row.operationId,ownerToken:row.ownerToken});
  }
  if (row?.operationId !== q.operationId || row.ownerToken !== q.ownerToken) return fixture(409,{});
  if (q.action === 'release') { if (row.state !== 'prepared') return fixture(409,{}); row=null; return fixture(200,{}); }
  if (q.action === 'dispatch') {
    if (row.state !== 'prepared') return fixture(409,{});
    row.state='dispatched'; lastDispatch=q; if (dispatchLost) throw Error('lost dispatch acknowledgement'); return fixture(200,{});
  }
  row.state='completed'; row.result=q.result; return fixture(200,{});
}
async function provider() {
  writes++;
  if (providerMode === 'hold') { entered(); await new Promise(resolve => { unblock=resolve; }); }
  if (providerMode === 'lost') throw Error('response lost');
  const status = typeof providerMode === 'number' ? providerMode : 200;
  return { ok:status<400,status,json:async()=>({checkout_url:'https://checkout.example/only',session_id:'session-1'}) };
}
function instance() {
  return load('src/lib/billing-operation.ts', {'server-only':{},'node:crypto':crypto,'next/server':next,'@/lib/license-api':{licenseApiRequest:ledger}}, {fetch:provider});
}
const args = {subject:'user_owner',email:'owner@example.com',resource:'checkout',intent:{tier:'lifetime'},generation:{paid:false}};
const execute = async ({operationId,mutate}) => {
  const r=await mutate('https://mock.invalid/checkouts',{method:'POST'});
  return next.NextResponse.json({...(await r.json()),operationId},{status:r.status});
};
reset(); providerMode='hold';
const a=instance(),b=instance();
let signal; const started=new Promise(resolve=>{signal=resolve;}); entered=signal;
const first=a.runBillingOperation(args,execute); await started;
const blocked=await b.runBillingOperation(args,execute);
assert.equal(blocked.status,409); assert.equal(blocked.data.operationId,'op-1'); assert.equal(writes,1);
unblock(); assert.equal((await first).status,200);
assert.equal((await b.runBillingOperation(args,execute)).data.operationId,'op-1'); assert.equal(writes,1);
assert.equal((await b.runBillingOperation({...args,intent:{tier:'team'}},execute)).status,409); assert.equal(writes,1);
for (const mode of ['lost',408,409,429,500,400]) {
  reset(); providerMode=mode;
  assert.equal((await instance().runBillingOperation(args,execute)).status,409);
  assert.equal((await instance().runBillingOperation(args,execute)).status,409);
  assert.equal(writes,1); assert.equal(row.state,'dispatched');
}
reset(); dispatchLost=true;
assert.equal((await instance().runBillingOperation(args,execute)).status,409);
assert.equal(writes,0); assert.equal(row.state,'dispatched');
reset();
const failedRead=await instance().runBillingOperation(args,async()=>next.NextResponse.json({error:'read outage'},{status:502}));
assert.equal(failedRead.status,502); assert.equal(row,null); assert.equal(writes,0);
assert.equal((await instance().runBillingOperation(args,execute)).status,200);
// Actual independent checkout route instances share only the durable ledger.
reset();
let license=fixture(404,{}),team=fixture(404,{});
const policy=load('src/lib/plan-options.ts',{});
const route = () => load('src/app/api/dodo/create-checkout/route.ts',{
  'next/server':next,'@/lib/billing-operation':instance(),
  '@clerk/nextjs/server':{auth:async()=>({userId:'user_owner'}),currentUser:async()=>({primaryEmailAddress:{emailAddress:'owner@example.com',verification:{status:'verified'}}})},
  '@/lib/dodo':{getProductId:t=>`prod-${t}`,getPurchasableProductIds:()=>[],getDodoApiBaseUrl:()=> 'https://mock.invalid',getCheckoutReturnUrl:()=> 'https://buckets.example/payment-status',getTierForProductId:p=>p.replace('prod-',''),isCheckoutTier:t=>['monthly','yearly','lifetime','team','suite'].includes(t),getSuiteProductId:()=>'prod-suite',MIN_TEAM_SEATS:3,MAX_TEAM_SEATS:50},
  '@/lib/maintenance':{isMaintenanceMode:()=>false},'@/lib/plan-options':policy,
  '@/lib/suite-offer':load('src/lib/suite-offer.ts',{}),
  '@/lib/license-api':{getLicenseForAccount:async()=>license,getTeamByOwner:async()=>team},
  '@/lib/partner-license':{partnerLookupConfigured:()=>false,partnerOwnsLifetime:async()=>false},
});
const req={json:async()=>({tier:'lifetime'}),nextUrl:{origin:'https://buckets.example'}};
const pair=await Promise.all([route().POST(req),route().POST(req)]);
assert.equal(writes,1); assert.ok(pair.some(r=>r.status===200));
assert.equal((await route().POST(req)).data.checkout_url,'https://checkout.example/only'); assert.equal(writes,1);
// Fresh authority under claim rejects a team whose owner row is still trial.
reset();
license=fixture(404,{}); team=fixture(200,{subscriptionId:'team',subscriptionStatus:'active'});
assert.equal((await route().POST(req)).status,409); assert.equal(writes,0);
// The seat endpoint must coordinate even when the desired count equals stale
// cached seats: an earlier accepted increase may still be awaiting its webhook.
reset();
let teamSeats=3, providerQuantity=3, providerReads=0;
const seatRoute=()=>load('src/app/api/team/seats/route.ts',{
  'next/server':next,'@/lib/billing-operation':instance(),
  '@clerk/nextjs/server':{auth:async()=>({userId:'user_owner'}),currentUser:async()=>({primaryEmailAddress:{emailAddress:'owner@example.com',verification:{status:'verified'}}})},
  '@/lib/dodo':{getDodoApiBaseUrl:()=> 'https://mock.invalid',getProductId:()=> 'prod-team',MIN_TEAM_SEATS:3,MAX_TEAM_SEATS:50},
  '@/lib/license-api':{getTeamByOwner:async()=>fixture(200,{ownerEmail:'owner@example.com',ownerClerkId:'user_owner',subscriptionId:'sub-team',productId:'prod-team',seatsPurchased:teamSeats,seatsUsed:2,dodoCustomerId:'customer'})},
},{fetch:async()=>{providerReads++;return {ok:true,status:200,json:async()=>({product_id:'prod-team',quantity:providerQuantity,status:'active',customer:{customer_id:'customer'}})};}});
const seatReq=n=>({json:async()=>({seats:n})});
assert.equal((await seatRoute().POST(seatReq(4))).status,200);
assert.equal(lastDispatch.seatLimit,4); assert.equal(writes,1);
const readsBefore=providerReads;
assert.equal((await seatRoute().POST(seatReq(3))).status,409);
assert.equal(writes,1); assert.equal(providerReads,readsBefore);
settled=true; teamSeats=providerQuantity=4;
assert.equal((await seatRoute().POST(seatReq(3))).status,200); assert.equal(writes,2);
console.log('PASS billing operations: independent instances, concurrent checkout, replay/cart lock, uncertain responses, lost dispatch acknowledgement, safe read retry, current-team authority, stale seat no-op serialization, target cap, legitimate later seat change');
