import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {labelConfiguration,shouldGenerateLabel} from '../supabase/functions/_shared/frenet-label.mjs';

const source=readFileSync(new URL('../supabase/functions/admin-orders/index.ts',import.meta.url),'utf8');
const orderId='11111111-1111-4111-8111-111111111111',adminId='22222222-2222-4222-8222-222222222222',sessionId='33333333-3333-4333-8333-333333333333';
const token='test.'+Buffer.from(JSON.stringify({session_id:sessionId})).toString('base64url')+'.test';
async function run({pickup=false,paid=true,status='pronto_para_envio',authorized=true,failedTransition=false}={}){
  let handler;const calls=[],emissions=[];
  const order={id:orderId,financial_status:paid?'pago':'aguardando_pagamento',operational_status:status,
    shipping_carrier_code:pickup?'PICKUP_VENDOR':'COR'};
  const fetcher=async(url,init={})=>{
    calls.push({url,body:init.body?JSON.parse(init.body):null});
    if(url.endsWith('/auth/v1/user'))return Response.json({id:adminId,email:'xpdistribuidora.oficial@gmail.com'});
    if(url.endsWith('/authorize_admin_session'))return Response.json([{display_name:'Test',role:'owner'}]);
    if(url.includes('/orders?'))return Response.json([{shipping_carrier_code:order.shipping_carrier_code}]);
    if(url.includes('/rpc/'))return failedTransition?Response.json({message:'INVALID_OPERATIONAL_TRANSITION'},{status:400}):Response.json(order);
    throw new Error('Unexpected route');
  };
  const code=stripTypeScriptTypes(source.replace(/^import .*;\n/gm,''));
  vm.runInNewContext(code,{Response,Request,URL,AbortSignal,atob,console,Map,Set,JSON,Date,
    Deno:{env:{get:key=>({SUPABASE_URL:'https://supabase.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-role'}[key])},serve:fn=>{handler=fn;}},
    fetch:fetcher,buildOrderFilters:()=>{},PAGE_SIZE:50,labelConfiguration,shouldGenerateLabel,
    generateShippingLabel:async args=>{emissions.push(args);return {ok:false,code:'LABEL_NOT_CONFIGURED',message:'Configuração pendente.'};}});
  const response=await handler(new Request('https://supabase.invalid/functions/v1/admin-orders',{method:'PATCH',
    headers:{'Content-Type':'application/json','x-admin-portal':'paulo',...(authorized?{authorization:`Bearer ${token}`}:{})},
    body:JSON.stringify({orderId,status,shippingPackage:{weightKg:1,lengthCm:20,widthCm:15,heightCm:10}})}));
  return {response:await response.json(),status:response.status,calls,emissions};
}
test('ready shipping uses atomic package RPC, then emission; pending config preserves successful order update',async()=>{
  const r=await run();assert.equal(r.status,200);assert.equal(r.emissions.length,1);
  const prepare=r.calls.find(c=>c.url.endsWith('/prepare_order_shipping'));
  assert.equal(prepare.body.package_details.weightKg,1);
  assert.equal(r.response.order.operational_status,'pronto_para_envio');
  assert.equal(r.response.shippingLabel.code,'LABEL_NOT_CONFIGURED');
});
test('pickup and other transitions never trigger labels; authentication and failed transitions remain enforced',async()=>{
  for(const options of [{pickup:true},{status:'em_separacao'},{paid:false},{authorized:false},{failedTransition:true}]){
    const r=await run(options);assert.equal(r.emissions.length,0);
    if(options.authorized===false){assert.equal(r.status,401);assert.equal(r.calls.length,0);}
    if(options.failedTransition)assert.equal(r.status,400);
    if(options.pickup)assert.ok(r.calls.some(c=>c.url.endsWith('/update_order_operation')));
  }
});
