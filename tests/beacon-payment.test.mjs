import './inventory-fixture.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHmac} from 'node:crypto';
import {paymentOffers,applyPaymentOffer} from '../data/payment-offers.mjs';
import {priceCart,paymentItems,cents} from '../lib/kit-pricing.mjs';
import {initialKits} from '../data/cpad-kits.mjs';
import orderEndpoint from '../api/create-cpad-order.js';
import paymentEndpoint from '../api/mercadopago/cpad-preference.js';
import {activeProducts} from '../seo/catalog.mjs';

const at='comentario-biblico-beacon-antigo-testamento',nt='comentario-biblico-beacon-novo-testamento';
const inventory=Object.fromEntries([at,nt].map(slug=>[slug,{name:slug,price:349.99,stock:5,sku:slug}]));
inventory['biblia-estudo-pentecostal']={name:'Pentecostal',price:280.49,stock:5,sku:'PENT'};
const origin='https://chi-rho-ecommerce-test.vercel.app';
const token='e5d28d7c-2463-4ffd-a63e-35eeedcc21e6',id='f963a4f2-1321-4f6e-8f4a-36101ba11212';
const secret='unit-test-signing-fixture';

test('preços Pix e cartão conferem com vitrine e quantidades em centavos',()=>{
  for (const slug of [at,nt]) {
    const product=activeProducts.find(p=>p.slug===slug),offer=paymentOffers[slug];
    assert.equal(product.preco,offer.card);assert.equal(product.precoPix,offer.pix);
    const base=priceCart([{slug,quantity:3}],inventory);
    assert.equal(cents(applyPaymentOffer(base,'pix').totalProducts),cents(offer.pix)*3);
    assert.equal(cents(applyPaymentOffer(base,'card').totalProducts),34999*3);
  }
});
test('kit e Beacon avulso compartilham estoque sem acumular desconto Pix no kit',()=>{
  const cart=[{slug:'kit-cpad-estudo-palavra',quantity:1},{slug:at,quantity:2},{slug:nt,quantity:1}];
  const pricing=applyPaymentOffer(priceCart(cart,inventory,initialKits),'pix');
  assert.equal(pricing.pixDiscount,113.61);
  assert.equal(cents(pricing.totalProducts),57399+30318*2+33000);
  assert.equal(pricing.kits[0].unit_total,573.99);
  const charged=paymentItems(pricing.items,pricing.discount);
  assert.equal(charged.reduce((sum,item)=>sum+cents(item.unit_price)*item.quantity,0),cents(pricing.totalProducts));
  assert.throws(()=>applyPaymentOffer(pricing,'forged'),/INVALID_PAYMENT_METHOD/);
});
test('preço vivo abaixo da oferta Pix nunca é aumentado nem descontado duas vezes',()=>{
  const base=priceCart([{slug:at,quantity:1}],{[at]:{...inventory[at],price:299}});
  assert.equal(applyPaymentOffer(base,'pix').totalProducts,299);
});

function fixture(t,{order,items,providerResponse}={}) {
  const env={...process.env},originalFetch=globalThis.fetch;
  Object.assign(process.env,{CPAD_CHECKOUT_SIGNING_SECRET:secret,MERCADO_PAGO_ACCESS_TOKEN:'fixture',
    MERCADO_PAGO_PUBLIC_KEY:'fixture',MERCADO_PAGO_TEST_MODE:'true',VERCEL_ENV:'preview'});
  const calls={signed:[],provider:[]};
  globalThis.fetch=async(url,options)=>{
    const path=String(url);
    if(path.includes('/users/me'))return Response.json({id:123,site_id:'MLB',tags:['test_user']});
    if(path.includes('/functions/v1/mercadopago-create-preference'))return Response.json({available:true,mode:'test'});
    if(path.includes('inventory-status'))return Response.json({inventory:Object.entries(inventory).map(([slug,p])=>({slug,name:p.name,unitPrice:p.price,available:p.stock,sku:p.sku,weight:5,length:25,width:18,height:22}))});
    if(path.includes('/cpad_kits?'))return Response.json(initialKits);
    if(path.includes('cpad_signed_action')){
      const {payload_text,signature}=JSON.parse(options.body);
      assert.equal(signature,createHmac('sha256',secret).update(payload_text).digest('hex'));
      const payload=JSON.parse(payload_text);calls.signed.push(payload);
      if(payload.action==='order')return Response.json({order_id:id,order_code:'CHR-TEST-BEACON',order_public_token:token,order_total:payload.subtotal-payload.discount});
      if(payload.action==='payment_read')return Response.json({order,items});
      return Response.json({saved:true});
    }
    if(path.includes('api.mercadopago.com/')){
      calls.provider.push({url:path,body:JSON.parse(options.body),key:options.headers['X-Idempotency-Key']});
      return Response.json(providerResponse||{id:'fixture',sandbox_init_point:'https://sandbox.mercadopago.com.br/checkout/fixture'});
    }
    throw new Error('Unexpected fetch');
  };
  t.after(()=>{globalThis.fetch=originalFetch;for(const key of ['CPAD_CHECKOUT_SIGNING_SECRET','MERCADO_PAGO_ACCESS_TOKEN','MERCADO_PAGO_PUBLIC_KEY','MERCADO_PAGO_TEST_MODE','VERCEL_ENV']) {
    if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];
  }});
  return calls;
}
const paymentRequest=()=>new Request(origin+'/api/mercadopago/cpad-preference',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({code:'CHR-TEST-BEACON',publicToken:token,paymentMethod:'card',price:0.01})});
const storedOrder=(method,discount,total)=>({id,code:'CHR-TEST-BEACON',payment_method:method,discount,grand_total:total,shipping_price:0,
  customer_name:'Teste Beacon',customer_email:'test@example.invalid',tax_id:'52998224725',reservation_expires_at:new Date(Date.now()+45*60000).toISOString()});
const storedItems=[{product_slug:at,product_name:'Beacon AT',sku:at,unit_price:349.99,quantity:1}];

test('servidor ignora preço enviado pelo cliente e assina desconto Pix autorizado',async t=>{
  const calls=fixture(t);
  const body={clientRequestId:id,paymentMethod:'pix',customer:{name:'Teste Beacon',email:'test@example.invalid',whatsapp:'21999999999',taxId:'52998224725'},
    shipping:{service:{carrierCode:'PICKUP_VENDOR'}},items:[{slug:at,quantity:1,price:0.01}]};
  const response=await orderEndpoint.fetch(new Request(origin+'/api/create-cpad-order',{method:'POST',headers:{origin,apikey:'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE','Content-Type':'application/json'},body:JSON.stringify(body)}));
  assert.equal(response.status,201);assert.equal((await response.json()).order.total,303.18);
  const signed=calls.signed.find(p=>p.action==='order');assert.equal(signed.subtotal,349.99);assert.equal(signed.discount,46.81);assert.equal(signed.payment_method,'pix');
});
test('Pix usa a API Pix com valor exato, idempotência e prazo da reserva',async t=>{
  const order=storedOrder('pix',46.81,303.18);
  const calls=fixture(t,{order,items:storedItems,providerResponse:{id:123456789,payment_method_id:'pix',transaction_amount:303.18,
    point_of_interaction:{transaction_data:{ticket_url:'https://www.mercadopago.com.br/payments/123456789/ticket?hash=fixture'}}}});
  const response=await paymentEndpoint.fetch(paymentRequest());
  assert.equal(response.status,201);assert.equal(calls.provider.length,1);
  const call=calls.provider[0];assert.ok(call.url.endsWith('/v1/payments'));assert.equal(call.body.payment_method_id,'pix');
  assert.equal(call.body.transaction_amount,303.18);assert.equal(call.key,id+'-pix');assert.equal(call.body.date_of_expiration,order.reservation_expires_at);
  assert.equal(calls.signed.at(-1).payment_id,'123456789');
});
test('cartão mantém R$349,99 e permite até 12 parcelas sem conceder desconto Pix',async t=>{
  const calls=fixture(t,{order:storedOrder('card',0,349.99),items:storedItems});
  const response=await paymentEndpoint.fetch(paymentRequest());assert.equal(response.status,201);
  assert.equal(calls.provider[0].body.items[0].unit_price,349.99);
  assert.equal(calls.provider[0].body.payment_methods.installments,12);
  assert.ok(calls.provider[0].body.payment_methods.excluded_payment_types.some(x=>x.id==='bank_transfer'));
});
test('Pix existente é reutilizado sem gerar segunda cobrança',async t=>{
  const order={...storedOrder('pix',46.81,303.18),payment_external_id:'123456789',payment_preference_url:'https://www.mercadopago.com.br/payments/123456789/ticket?hash=fixture'};
  const calls=fixture(t,{order,items:storedItems});
  const response=await paymentEndpoint.fetch(paymentRequest());assert.equal(response.status,200);assert.equal((await response.json()).reused,true);
  assert.equal(calls.provider.length,0);
});
test('totais divergentes e Pix com reserva curta falham antes de solicitar cobrança',async t=>{
  const calls=fixture(t,{order:{...storedOrder('pix',46.81,303.18),reservation_expires_at:new Date(Date.now()+20*60000).toISOString()},items:storedItems});
  const response=await paymentEndpoint.fetch(paymentRequest());assert.equal(response.status,409);assert.equal(calls.provider.length,0);
});
