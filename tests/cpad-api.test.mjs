import './inventory-fixture.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHmac} from 'node:crypto';
import orderEndpoint from '../api/create-cpad-order.js';
import paymentEndpoint from '../api/mercadopago/cpad-preference.js';
import {inventory} from './inventory-fixture.mjs';
import {initialKits} from '../data/cpad-kits.mjs';
import {casaKits} from '../data/casa-kits.mjs';
const origin='https://chi-rho-ecommerce-test.vercel.app';
const secret='unit-test-signing-fixture';
const publicToken='e5d28d7c-2463-4ffd-a63e-35eeedcc21e6';
const order={id:'f963a4f2-1321-4f6e-8f4a-36101ba11212',code:'CHR-TEST-CPAD',public_token:publicToken,
  discount:17.99,shipping_price:11.73,grand_total:95.69,reservation_expires_at:new Date(Date.now()+3600000).toISOString()};
const items=[{product_slug:'panorama-da-biblia',product_name:'Panorama da Bíblia',unit_price:59.46,quantity:1},
  {product_slug:'herois-da-fe',product_name:'Heróis da Fé',unit_price:42.49,quantity:1}];
test('Casa order signs two physical components and exactly R$ 2 discount per kit',async()=>{
  const oldFetch=globalThis.fetch,env={...process.env};
  Object.assign(process.env,{CPAD_CHECKOUT_SIGNING_SECRET:secret,MERCADO_PAGO_ACCESS_TOKEN:'fixture',MERCADO_PAGO_PUBLIC_KEY:'fixture',MERCADO_PAGO_TEST_MODE:'true',VERCEL_ENV:'preview'});
  let verified;
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/users/me'))return Response.json({id:123,site_id:'MLB',tags:['test_user']});
    if(String(url).includes('/functions/v1/mercadopago-create-preference'))return Response.json({available:true,mode:'test'});
    if(String(url).includes('inventory-status'))return Response.json({inventory});
    if(String(url).includes('/cpad_kits?'))return Response.json(initialKits);
    if(String(url).includes('cpad_signed_action')){
      const {payload_text,signature}=JSON.parse(options.body);
      assert.equal(signature,createHmac('sha256',secret).update(payload_text).digest('hex'));
      verified=JSON.parse(payload_text);
      return Response.json({order_id:order.id,order_code:order.code,order_public_token:publicToken,order_total:verified.subtotal-verified.discount});
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try{
    const body={clientRequestId:order.id,customer:{name:'Teste Kit Casa',email:'test@example.invalid',whatsapp:'21999999999',taxId:'52998224725'},
      shipping:{service:{carrierCode:'PICKUP_VENDOR'}},items:[{slug:casaKits[0].slug,quantity:2,price:0.01,discount:99}]};
    const response=await orderEndpoint.fetch(new Request(origin+'/api/create-cpad-order',{method:'POST',headers:{origin,apikey:'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE','Content-Type':'application/json'},body:JSON.stringify(body)}));
    assert.equal(response.status,201);assert.equal((await response.json()).order.total,73.96);
    assert.equal(verified.subtotal,77.96);assert.equal(verified.discount,4);
    assert.equal(verified.items.length,2);assert.ok(verified.items.every(item=>item.quantity===2));
    assert.equal(verified.kits[0].discount_amount,2);assert.equal(verified.kits[0].discount_percent,0);
  }finally{globalThis.fetch=oldFetch;for(const key of ['CPAD_CHECKOUT_SIGNING_SECRET','MERCADO_PAGO_ACCESS_TOKEN','MERCADO_PAGO_PUBLIC_KEY','MERCADO_PAGO_TEST_MODE','VERCEL_ENV']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];}}
});
test('server recomputes a forged kit basket and signs the verified physical order',async()=>{
  const oldFetch=globalThis.fetch,env={...process.env};
  Object.assign(process.env,{CPAD_CHECKOUT_SIGNING_SECRET:secret,MERCADO_PAGO_ACCESS_TOKEN:'fixture',MERCADO_PAGO_PUBLIC_KEY:'fixture',MERCADO_PAGO_TEST_MODE:'true',VERCEL_ENV:'preview'});
  let verified;
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/users/me'))return Response.json({id:123,site_id:'MLB',tags:['test_user']});
    if(String(url).includes('/functions/v1/mercadopago-create-preference'))return Response.json({available:true,mode:'test'});
    if(String(url).includes('inventory-status'))return Response.json({inventory});
    if(String(url).includes('/cpad_kits?'))return Response.json(initialKits);
    if(String(url).includes('cpad_signed_action')){
      const {payload_text,signature}=JSON.parse(options.body);
      assert.equal(signature,createHmac('sha256',secret).update(payload_text).digest('hex'));
      verified=JSON.parse(payload_text);
      return Response.json({order_id:order.id,order_code:order.code,order_public_token:publicToken,order_total:83.96});
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try{
    const body={clientRequestId:order.id,customer:{name:'Teste CPAD',email:'test@example.invalid',whatsapp:'21999999999',taxId:'52998224725'},
      shipping:{service:{carrierCode:'PICKUP_VENDOR'}},items:[{slug:initialKits[0].slug,quantity:1,price:0.01,discount:99}]};
    const response=await orderEndpoint.fetch(new Request(origin+'/api/create-cpad-order',{method:'POST',headers:{origin,apikey:'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE','Content-Type':'application/json'},body:JSON.stringify(body)}));
    assert.equal(response.status,201);assert.equal((await response.json()).order.total,83.96);
    assert.equal(verified.environment,'preview');
    assert.equal(verified.subtotal,101.95);assert.equal(verified.discount,17.99);
    assert.equal(verified.items.length,2);assert.equal(verified.kits.length,1);
    const rejected=await orderEndpoint.fetch(new Request(origin+'/api/create-cpad-order',{method:'POST',headers:{origin:'https://untrusted.example'}}));
    assert.equal(rejected.status,403);
  }finally{globalThis.fetch=oldFetch;for(const key of ['CPAD_CHECKOUT_SIGNING_SECRET','MERCADO_PAGO_ACCESS_TOKEN','MERCADO_PAGO_PUBLIC_KEY','MERCADO_PAGO_TEST_MODE','VERCEL_ENV']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];}}
});
test('production Checkout Pro uses the official return pages and notification URL',async()=>{
  const oldFetch=globalThis.fetch,env={...process.env};
  Object.assign(process.env,{CPAD_CHECKOUT_SIGNING_SECRET:secret,MERCADO_PAGO_ACCESS_TOKEN:'APP_USR-fixture',
    MERCADO_PAGO_PUBLIC_KEY:'APP_USR-fixture',MERCADO_PAGO_TEST_MODE:'false',VERCEL_ENV:'production'});
  let provider,saved;
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/users/me'))return Response.json({id:123,site_id:'MLB',tags:['normal']});
    if(String(url).includes('/functions/v1/mercadopago-create-preference'))return Response.json({available:true,mode:'production'});
    if(String(url).includes('cpad_signed_action')){
      const payload=JSON.parse(JSON.parse(options.body).payload_text);
      assert.equal(payload.environment,'production');
      if(payload.action==='payment_read'){assert.equal(payload.test_mode,false);return Response.json({order,items});}
      saved=payload;return Response.json({saved:true});
    }
    if(String(url).includes('api.mercadopago.com/checkout/preferences')){
      provider=JSON.parse(options.body);
      return Response.json({id:'production-fixture',init_point:'https://www.mercadopago.com.br/checkout/fixture',sandbox_init_point:'https://sandbox.mercadopago.com.br/checkout/fixture'});
    }
    throw new Error('Unexpected fetch');
  };
  try {
    const response=await paymentEndpoint.fetch(new Request(origin+'/api/mercadopago/cpad-preference',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({code:order.code,publicToken})}));
    assert.equal(response.status,201);
    assert.equal((await response.json()).paymentUrl,'https://www.mercadopago.com.br/checkout/fixture');
    for(const [status,page] of [['success','pagamento-sucesso'],['pending','pagamento-pendente'],['failure','pagamento-falhou']])
      assert.equal(provider.back_urls[status],`https://www.chirho.com.br/${page}.html?order=${order.code}`);
    assert.equal(provider.notification_url,'https://www.chirho.com.br/api/mercadopago-webhook?source_news=webhooks');
    assert.equal(saved.payment_url,'https://www.mercadopago.com.br/checkout/fixture');
  } finally {
    globalThis.fetch=oldFetch;
    for(const key of ['CPAD_CHECKOUT_SIGNING_SECRET','MERCADO_PAGO_ACCESS_TOKEN','MERCADO_PAGO_PUBLIC_KEY','MERCADO_PAGO_TEST_MODE','VERCEL_ENV']) {
      if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];
    }
  }
});
test('payment provider receives discounted cent-exact items and verified freight only',async()=>{
  const oldFetch=globalThis.fetch,env={...process.env};
  Object.assign(process.env,{CPAD_CHECKOUT_SIGNING_SECRET:secret,MERCADO_PAGO_ACCESS_TOKEN:'fixture',MERCADO_PAGO_PUBLIC_KEY:'fixture',MERCADO_PAGO_TEST_MODE:'true',VERCEL_ENV:'preview'});
  let provider,saved;
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/users/me'))return Response.json({id:123,site_id:'MLB',tags:['test_user']});
    if(String(url).includes('/functions/v1/mercadopago-create-preference'))return Response.json({available:true,mode:'test'});
    if(String(url).includes('cpad_signed_action')){
      const {payload_text,signature}=JSON.parse(options.body);
      assert.equal(signature,createHmac('sha256',secret).update(payload_text).digest('hex'));
      const payload=JSON.parse(payload_text);
      if(payload.action==='payment_read')return Response.json({order,items});
      saved=payload;return Response.json({saved:true});
    }
    if(String(url).includes('api.mercadopago.com')){provider=JSON.parse(options.body);return Response.json({id:'fixture-preference',sandbox_init_point:'https://sandbox.mercadopago.com.br/checkout/fixture'});}
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try{
    const response=await paymentEndpoint.fetch(new Request(origin+'/api/mercadopago/cpad-preference',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({code:order.code,publicToken})}));
    assert.equal(response.status,201);
    assert.equal(Math.round(provider.items.reduce((sum,item)=>sum+item.unit_price*item.quantity,0)*100),8396);
    assert.equal(provider.shipments.cost,11.73);assert.equal(saved.preference_id,'fixture-preference');
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    assert.equal((await (await paymentEndpoint.fetch(new Request(origin+'/api/mercadopago/cpad-preference'))).json()).available,false);
  }finally{globalThis.fetch=oldFetch;for(const key of ['CPAD_CHECKOUT_SIGNING_SECRET','MERCADO_PAGO_ACCESS_TOKEN','MERCADO_PAGO_PUBLIC_KEY','MERCADO_PAGO_TEST_MODE','VERCEL_ENV']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];}}
});
