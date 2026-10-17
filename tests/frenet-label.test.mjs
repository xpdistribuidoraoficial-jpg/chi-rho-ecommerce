import test from 'node:test';
import assert from 'node:assert/strict';
import {generateShippingLabel,labelCapability,labelConfiguration,shouldGenerateLabel,validPackage} from '../supabase/functions/_shared/frenet-label.mjs';

const config={token:'test-client',partnerToken:'test-partner',sellerCep:'21210250',printFormat:'A4'};
const order={id:'order-1',code:'CHR-TEST',financial_status:'pago',operational_status:'pronto_para_envio',
  shipping_carrier_code:'COR',shipping_service_code:'03298',shipping_service:'PAC',shipping_carrier:'Correios',
  shipping_price:15,subtotal:119.94,discount:35.98,grand_total:98.96,
  customer_name:'Test',customer_email:'test@invalid.local',customer_phone:'21999999999',tax_id:'52998224725',
  postal_code:'20040002',street:'Rua Teste',address_number:'1',district:'Centro',city:'Rio de Janeiro',state:'RJ',
  shipping_package:{weightKg:1.2,lengthCm:25,widthCm:20,heightCm:10}};
const items=[{id:'item-1',product_slug:'book-1',unit_price:49.99,line_total:49.99,quantity:1},
  {id:'item-2',product_slug:'book-2',unit_price:69.95,line_total:69.95,quantity:1}];
const makeHarness=(options={})=>{
  const state={locked:false,generated:false,paidCalls:0,quoteCalls:0,failures:[],payload:null,complete:null};
  const dataOrder={...order,...options.order};
  const fetcher=async(url,init={})=>{
    const body=init.body?JSON.parse(init.body):null;
    if(url.endsWith('/claim_shipping_label')){
      if(state.generated)return Response.json({message:'LABEL_ALREADY_GENERATED'},{status:409});
      if(state.locked)return Response.json({message:'LABEL_IN_PROGRESS'},{status:409});
      if(options.claimError)return Response.json({message:options.claimError},{status:409});
      state.locked=true;return Response.json('11111111-1111-4111-8111-111111111111');
    }
    if(url.includes('/orders?'))return Response.json([dataOrder]);
    if(url.includes('/order_items?'))return Response.json(options.items||items);
    if(url.endsWith('/shipping/quote')){
      state.quoteCalls++;
      return Response.json({ShippingSevicesArray:[{CarrierCode:'COR',ServiceCode:'03298',ShippingPrice:options.quotePrice??14.5,
        ServiceDescription:'PAC',Carrier:'Correios',DeliveryTime:5,...options.service}]});
    }
    if(url.endsWith('/orders/oneclick')){
      state.paidCalls++;state.payload=body;
      if(options.timeout)throw new Error('Timeout');
      return Response.json({Items:[{ShipmentId:123,OrderId:options.wrongOrder?'WRONG':order.code,
        LabelUrl:'https://frenet.example.invalid/label.pdf',TrackingUrl:'https://frenet.example.invalid/AA123456789BR',
        Errors:options.providerErrors??[],...options.providerItem}]});
    }
    if(url.endsWith('/complete_shipping_label')){
      state.complete=body;
      if(options.saveError)return Response.json({},{status:503});
      state.generated=true;state.locked=false;return Response.json({label_status:'gerada'});
    }
    if(url.endsWith('/fail_shipping_label')){
      state.failures.push(body.error_code);
      if(body.error_code!=='LABEL_RECONCILIATION_REQUIRED')state.locked=false;
      return Response.json(null);
    }
    throw new Error('Unexpected URL: '+url);
  };
  return {state,run:()=>generateShippingLabel({url:'https://supabase.invalid',serviceKey:'test-role',adminId:'admin-1',orderId:'order-1',config,fetcher})};
};

test('availability exposes flags only; pickup and unpaid orders never qualify',()=>{
  assert.equal(labelCapability({...config,partnerToken:''}).available,false);
  assert.doesNotMatch(JSON.stringify(labelCapability(config)),/test-client|test-partner/);
  assert.equal(labelConfiguration(()=>undefined).sellerCep,'21210250');
  assert.equal(shouldGenerateLabel(order),true);
  for(const override of [{financial_status:'aguardando_pagamento'},{financial_status:'reembolsado'},
    {operational_status:'em_separacao'},{shipping_carrier_code:'PICKUP_VENDOR'}])assert.equal(shouldGenerateLabel({...order,...override}),false);
  assert.equal(validPackage(order.shipping_package),true);
  assert.equal(validPackage({...order.shipping_package,weightKg:0}),false);
  assert.equal(validPackage({...order.shipping_package,weightKg:'1'}),false);
});
test('successful label uses documented array/ItemId/service fields and exact discounted kit cents',async()=>{
  const h=makeHarness();const result=await h.run();
  assert.equal(result.ok,true);assert.equal(h.state.paidCalls,1);
  assert.ok(Array.isArray(h.state.payload));const shipment=h.state.payload[0];
  assert.equal(shipment.Quotation.ShippingServiceCode,'03298');
  assert.equal(shipment.Quotation.ShippingPrice,14.5);
  assert.equal(shipment.Order.Value,98.96);
  assert.equal(shipment.Volumes[0].DeclaredValue,83.96);
  assert.equal(shipment.Order.Items.reduce((s,i)=>s+Math.round(i.Price*100)*i.Quantity,0),8396);
  assert.deepEqual(shipment.Volumes[0].OrderItemsId,shipment.Order.Items.map(i=>i.ItemId));
  assert.equal(h.state.complete.provider_tracking_code,'AA123456789BR');
  assert.equal((await h.run()).code,'LABEL_ALREADY_GENERATED');assert.equal(h.state.paidCalls,1);
});
test('concurrent requests cannot submit two paid calls',async()=>{
  const h=makeHarness();const results=await Promise.all([h.run(),h.run()]);
  assert.equal(results.filter(r=>r.ok).length,1);assert.equal(h.state.paidCalls,1);
});
test('timeouts and failed persistence remain locked; no financial retry',async()=>{
  for(const options of [{timeout:true},{saveError:true},{wrongOrder:true},{providerErrors:[{Code:4999}]},{providerItem:{LabelUrl:'http://invalid/label'}}]){
    const h=makeHarness(options);
    assert.equal((await h.run()).code,'LABEL_RECONCILIATION_REQUIRED');
    assert.equal((await h.run()).code,'LABEL_IN_PROGRESS');
    assert.equal(h.state.paidCalls,1);assert.equal(h.state.locked,true);
  }
});
test('missing configuration never claims or contacts a provider',async()=>{
  let calls=0;
  const result=await generateShippingLabel({config:{...config,partnerToken:''},fetcher:async()=>{calls++;}});
  assert.equal(result.code,'LABEL_NOT_CONFIGURED');assert.equal(calls,0);
});
test('invalid package, pickup, totals, or increased/unavailable freight never purchase a label',async()=>{
  for(const options of [{order:{shipping_package:null}},{order:{shipping_carrier_code:'PICKUP_VENDOR'}},
    {order:{grand_total:1}},{order:{customer_phone:'1'}},{order:{tax_id:'1'}},
    {quotePrice:15.01},{quotePrice:'invalid'},{service:{ServiceCode:'SEDEX'}},{service:{Error:true}},
    {claimError:'ORDER_NOT_PAID'},{claimError:'STOCK_NOT_COMMITTED'}]){
    const h=makeHarness(options);assert.equal((await h.run()).ok,false);assert.equal(h.state.paidCalls,0);
  }
});
test('multiple units reconcile rounding once without changing quantity or merchandise totals',async()=>{
  const h=makeHarness({order:{subtotal:30,discount:1,grand_total:44},
    items:[{id:'multi',product_slug:'p',unit_price:10,quantity:3,line_total:30}]});
  assert.equal((await h.run()).ok,true);
  assert.equal(h.state.payload[0].Order.Items.reduce((s,i)=>s+Math.round(i.Price*100),0),2900);
  assert.equal(h.state.payload[0].Order.Items.reduce((s,i)=>s+i.Quantity,0),3);
});
