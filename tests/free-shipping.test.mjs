import './inventory-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {inventory} from './inventory-fixture.mjs';
import {initialKits} from '../data/cpad-kits.mjs';
import quoteEndpoint from '../api/frete.js';
import orderEndpoint from '../api/create-cpad-order.js';
import {qualifiesForFreeShipping,applyShippingOffer,shippingWithOffer,merchantPaysShipping,remainingForFreeShipping} from '../supabase/functions/_shared/shipping-offer.mjs';

const origin='https://www.chirho.com.br',key='sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE';
const slug='casa-carregador-kapbom-ka-5005';
function fixture(t,price=100.01){
 const env={...process.env},oldFetch=globalThis.fetch,calls={quotes:[],signed:[]};
 Object.assign(process.env,{FRENET_TOKEN:'fixture',FRENET_SELLER_CEP:'21210250',CPAD_CHECKOUT_SIGNING_SECRET:'fixture-secret',MERCADO_PAGO_ACCESS_TOKEN:'fixture',MERCADO_PAGO_PUBLIC_KEY:'fixture',MERCADO_PAGO_TEST_MODE:'true',VERCEL_ENV:'preview'});
 globalThis.fetch=async(url,opts={})=>{
  const u=String(url);
  if(u.includes('/users/me'))return Response.json({id:123,site_id:'MLB',tags:['test_user']});
  if(u.includes('/functions/v1/mercadopago-create-preference'))return Response.json({available:true,mode:'test'});
  if(u.includes('inventory-status'))return Response.json({inventory:inventory.map(i=>i.slug===slug?{...i,unitPrice:price}:i)});
  if(u.includes('/cpad_kits?'))return Response.json(initialKits);
  if(u==='https://api.frenet.com.br/shipping/quote'){
   calls.quotes.push(JSON.parse(opts.body));
   return Response.json({ShippingSevicesArray:[{Carrier:'Correios',CarrierCode:'COR',ServiceCode:'EXP',ServiceDescription:'Expresso',ShippingPrice:'30,00',DeliveryTime:'2'},{Carrier:'Correios',CarrierCode:'COR',ServiceCode:'ECO',ServiceDescription:'Econômico',ShippingPrice:'19,90',DeliveryTime:'7'},{Carrier:'Invalid',ServiceCode:'NEG',ShippingPrice:-1}]});
  }
  if(u.endsWith('/api/frete'))return quoteEndpoint.fetch(new Request(u,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:opts.body}));
  if(u.includes('cpad_signed_action')){
   const {payload_text,signature}=JSON.parse(opts.body);
   assert.equal(signature,createHmac('sha256','fixture-secret').update(payload_text).digest('hex'));
   const payload=JSON.parse(payload_text);calls.signed.push(payload);
   return Response.json({order_id:'11111111-1111-4111-8111-111111111111',order_code:'CHR-FREE-TEST',order_public_token:'22222222-2222-4222-8222-222222222222',order_total:payload.subtotal-payload.discount+payload.shipping.price});
  }
  throw new Error('Unexpected route '+u);
 };
 t.after(()=>{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);});
 return calls;
}
const quote=(itens,cep='20040002')=>quoteEndpoint.fetch(new Request(origin+'/api/frete',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({cep,itens,subtotal:99999})}));
const orderBody=(items,shippingPrice=0)=>({clientRequestId:'11111111-1111-4111-8111-111111111111',customer:{name:'Teste frete grátis',email:'shipping@example.invalid',whatsapp:'21999999999',taxId:'52998224725'},address:{postcode:'20040002',street:'Rua Teste',number:'1',district:'Centro',city:'Rio de Janeiro',state:'RJ'},shipping:{cep:'20040002',service:{carrierCode:'COR',serviceCode:'ECO',price:shippingPrice}},items});
const order=body=>orderEndpoint.fetch(new Request(origin+'/api/create-cpad-order',{method:'POST',headers:{origin,apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body)}));

test('limite usa centavos após descontos e somente uma entrega econômica é grátis',()=>{
 assert.equal(qualifiesForFreeShipping(99.99),false);assert.equal(qualifiesForFreeShipping(100),false);assert.equal(qualifiesForFreeShipping(100.01),true);assert.equal(qualifiesForFreeShipping(NaN),false);
 const services=applyShippingOffer([{carrierCode:'A',price:30,description:'Expresso'},{carrierCode:'B',price:10,description:'Normal'}],100.01);
 assert.equal(services[0].price,0);assert.equal(services[0].originalPrice,10);assert.equal(services[1].price,30);
 assert.equal(shippingWithOffer(services[0],99.99).price,10);assert.equal(shippingWithOffer(services[0],100).price,10);assert.equal(shippingWithOffer(services[0],100.01).price,0);
 assert.equal(merchantPaysShipping({subtotal:100,discount:0,shipping_price:0,shipping_service:'Frete grátis • Normal',shipping_carrier_code:'B'}),true);
 assert.equal(merchantPaysShipping({subtotal:100,discount:0.01,shipping_price:0,shipping_service:'Frete grátis • Normal',shipping_carrier_code:'B'}),false);
});
test('cotação em diferentes regiões concede frete acima de R$100 sem confiar no cliente',async t=>{
 const calls=fixture(t,100.01);
 for(const cep of ['20040002','01001000','69005010','69900058','90010001']){
  const r=await quote([{slug,quantity:1,price:0.01}],cep);assert.equal(r.status,200);const d=await r.json();
  assert.equal(d.services.length,2);assert.equal(d.services[0].price,0);assert.match(d.services[0].description,/^Frete grátis/);assert.equal(d.services[1].price,30);
 }
 assert.ok(calls.quotes.every(q=>q.ShipmentInvoiceValue===100.01));
});
test('R$99,99 e carrinho com descontos de kits inferior a R$100 mantêm frete pago',async t=>{
 const calls=fixture(t,99.99);
 const d=await (await quote([{slug,quantity:1,price:1000}])).json();assert.equal(d.services[0].price,19.9);
 const mixed=[{slug:'kit-casa-fone-carregador',quantity:2},{slug:'casa-fone-bluetooth-visor-bateria',quantity:1}];
 // Use a fresh quote with the real charger price to test the R$2 kit reduction.
 const baseInventory=inventory.map(i=>i.slug===slug?{...i,unitPrice:14.99}:i);
 const original=globalThis.fetch;globalThis.fetch=(u,o)=>String(u).includes('inventory-status')?Promise.resolve(Response.json({inventory:baseInventory})):original(u,o);
 const r=await quote(mixed);const body=await r.json();assert.equal(body.productsTotal,97.95);assert.equal(body.services[0].price,19.9);assert.equal(calls.quotes.at(-1).ShipmentInvoiceValue,97.95);
});
test('pedido recalcula a cotação assinada e grava frete zero para um produto avulso',async t=>{
 const calls=fixture(t,100.01);const r=await order(orderBody([{slug,quantity:1,price:0.01}]));
 assert.equal(r.status,201);assert.equal((await r.json()).order.total,100.01);
 const p=calls.signed.find(p=>p.action==='order');assert.equal(p.shipping.price,0);assert.equal(p.shipping.service,'Frete grátis • Econômico');assert.equal(p.subtotal,100.01);
});
test('frete zero forjado abaixo do limite é rejeitado antes da reserva',async t=>{
 const calls=fixture(t,99.99);const r=await order(orderBody([{slug,quantity:1,price:99999}]));
 assert.equal(r.status,503);assert.equal(calls.signed.length,0);assert.match((await r.json()).error,/frete mudou/);
});


test('R$100 exatos mantêm frete pago e não aceitam frete zero forjado',async t=>{
 const calls=fixture(t,100);
 const d=await (await quote([{slug,quantity:1}])).json();
 assert.equal(d.productsTotal,100);assert.equal(d.services[0].price,19.9);
 assert.equal(remainingForFreeShipping(100),0.01);
 assert.equal(remainingForFreeShipping(100.01),0);
 assert.equal(remainingForFreeShipping(99.99),0.02);
 const r=await order(orderBody([{slug,quantity:1}]));
 assert.equal(r.status,503);assert.equal(calls.signed.length,0);
});

test('pedido a R$100 aceita o frete pago recalculado e mantém a conciliação',async t=>{
 const calls=fixture(t,100);
 const r=await order(orderBody([{slug,quantity:1}],19.9));
 assert.equal(r.status,201);assert.equal((await r.json()).order.total,119.9);
 const p=calls.signed.find(p=>p.action==='order');
 assert.equal(p.shipping.price,19.9);assert.equal(p.subtotal,100);
});

test('retirada é grátis abaixo do limite e pedido antigo de R$100 preserva o benefício confirmado',()=>{
 assert.equal(shippingWithOffer({carrierCode:'PICKUP_VENDOR',price:0},50).price,0);
 assert.equal(merchantPaysShipping({subtotal:100,discount:0,shipping_price:0,shipping_service:'Frete grátis • Normal',shipping_carrier_code:'B'}),true);
 assert.equal(qualifiesForFreeShipping(101-1),false);
 assert.equal(qualifiesForFreeShipping(101-0.99),true);
});
