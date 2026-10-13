import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { paymentReadiness } from '../lib/cpad-payment-readiness.mjs';
import { verifyPaymentDiagnostic } from '../lib/cpad-database.mjs';
import diagnosticEndpoint from '../api/mercadopago/cpad-readiness.js';
import orderEndpoint from '../api/create-cpad-order.js';
import paymentEndpoint from '../api/mercadopago/cpad-preference.js';
import kitsEndpoint from '../api/cpad-kits.js';

test('production rejects test credentials, sandbox mode and webhook environment mismatch',async()=>{
  const env={...process.env},oldFetch=globalThis.fetch;
  Object.assign(process.env,{VERCEL_ENV:'production',CPAD_CHECKOUT_SIGNING_SECRET:'test-fixture',
    MERCADO_PAGO_ACCESS_TOKEN:'APP_USR-fixture',MERCADO_PAGO_PUBLIC_KEY:'APP_USR-fixture',MERCADO_PAGO_TEST_MODE:'false'});
  let tags=['test_user'],webhookMode='production',reads=0;
  globalThis.fetch=async(url)=>{
    if(String(url).includes('/users/me'))return Response.json({id:123,site_id:'MLB',tags});
    if(String(url).includes('mercadopago-create-preference'))return Response.json({available:true,mode:webhookMode});
    if(String(url).includes('/cpad_kits?'))return Response.json([{slug:'kit-cpad-leitura-crescimento',active:true}]);
    if(String(url).includes('inventory-status'))return Response.json({inventory:[]});
    if(String(url).includes('cpad_signed_action')){reads++;return Response.json({available:true});}
    throw new Error('Unexpected request');
  };
  try {
    assert.equal((await paymentReadiness()).ready,false);
    tags=['normal']; assert.equal((await paymentReadiness()).ready,true);
    webhookMode='test'; assert.equal((await paymentReadiness()).ready,false);
    webhookMode='production';process.env.MERCADO_PAGO_TEST_MODE='true';
    assert.equal((await paymentReadiness()).ready,false);
    const origin='https://www.chirho.com.br';
    const order=await orderEndpoint.fetch(new Request(origin+'/api/create-cpad-order',{method:'POST',headers:{origin,apikey:'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE'},body:'{}'}));
    assert.equal(order.status,503);assert.equal(reads,0,'Unavailable checkout must not reserve inventory');
    const payment=await paymentEndpoint.fetch(new Request(origin+'/api/mercadopago/cpad-preference',{method:'POST',headers:{origin},body:'{}'}));
    assert.equal(payment.status,503);assert.equal(reads,0);
    const publicHealth=await (await paymentEndpoint.fetch(new Request(origin+'/api/mercadopago/cpad-preference'))).json();
    assert.equal(publicHealth.available,false);assert.equal(publicHealth.account,undefined);
    const catalogHealth=await (await kitsEndpoint.fetch(new Request(origin+'/api/cpad-kits'))).json();
    assert.equal(catalogHealth.checkoutReady,false);
    assert.equal(catalogHealth.kits[0].active,true,'Kit display remains available while payment is unavailable');
  } finally {
    globalThis.fetch=oldFetch;
    for(const key of ['VERCEL_ENV','CPAD_CHECKOUT_SIGNING_SECRET','MERCADO_PAGO_ACCESS_TOKEN','MERCADO_PAGO_PUBLIC_KEY','MERCADO_PAGO_TEST_MODE']) {
      if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];
    }
  }
});

test('administrative payment diagnostic requires an untampered, recent environment-bound HMAC',async()=>{
  const oldSecret=process.env.CPAD_CHECKOUT_SIGNING_SECRET,oldEnvironment=process.env.VERCEL_ENV;
  process.env.CPAD_CHECKOUT_SIGNING_SECRET='diagnostic-test-fixture';process.env.VERCEL_ENV='production';
  const sign=body=>createHmac('sha256',process.env.CPAD_CHECKOUT_SIGNING_SECRET).update(body).digest('hex');
  try {
    const valid=JSON.stringify({action:'payment_health',environment:'production',signed_at:Date.now()});
    assert.equal(verifyPaymentDiagnostic(valid,sign(valid)),true);
    assert.equal(verifyPaymentDiagnostic(valid,sign(valid).replace(/^./,sign(valid)[0]==='a'?'b':'a')),false);
    for(const body of [JSON.stringify({action:'payment_health',environment:'preview',signed_at:Date.now()}),
      JSON.stringify({action:'payment_health',environment:'production',signed_at:Date.now()-91000}),
      JSON.stringify({action:'order',environment:'production',signed_at:Date.now()})]) {
      assert.equal(verifyPaymentDiagnostic(body,sign(body)),false);
    }
    const unauthorized=await diagnosticEndpoint.fetch(new Request('https://www.chirho.com.br/api/mercadopago/cpad-readiness',{method:'POST',body:valid}));
    assert.equal(unauthorized.status,401);
  } finally {
    if(oldSecret===undefined)delete process.env.CPAD_CHECKOUT_SIGNING_SECRET;else process.env.CPAD_CHECKOUT_SIGNING_SECRET=oldSecret;
    if(oldEnvironment===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=oldEnvironment;
  }
});
