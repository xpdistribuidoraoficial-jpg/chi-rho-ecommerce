import test from 'node:test';
import assert from 'node:assert/strict';
import {readOrderInvoice,validInvoiceKey} from '../supabase/functions/_shared/order-invoice.mjs';
import {invoiceDocuments} from '../supabase/functions/_shared/invoice-documents.mjs';
import {xml,parse,key,invoice} from './fixtures/invoice.mjs';
const order={id:'11111111-1111-4111-8111-111111111111',tax_id:'529.982.247-25',grand_total:98.96,shipping_price:15,
  financial_status:'pago',operational_status:'em_separacao',label_status:'nao_solicitada'};
test('processed accountant NF-e retains leading zeros, key and exact totals',()=>{
  assert.equal(key.length,44);assert.equal(validInvoiceKey(key),true);
  assert.deepEqual(readOrderInvoice(xml,order,parse),invoice);
  assert.deepEqual(readOrderInvoice(xml.replaceAll('nfeProc','n:nfeProc').replace('xmlns=', 'xmlns:n='),order,parse),invoice);
});
test('invalid syntax, entities, duplicate nodes, test environment, protocol, recipient and totals are blocked',()=>{
  const invalid=[xml.slice(0,-8),`<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]>${xml}`,
    xml.replace('<ide>','<ide></ide><ide>'),xml.replace('<NFe>','<NFe></NFe><NFe>'),
    xml.replace('<tpAmb>1</tpAmb>','<tpAmb>2</tpAmb>'),xml.replace('<cStat>100','<cStat>101'),
    xml.replace('<CPF>52998224725','<CPF>11111111111'),xml.replace('<vNF>98.96','<vNF>98.97'),
    xml.replace('<vNF>98.96','<vNF>98.9601'),xml.replace('<vFrete>15.00','<vFrete>14.00'),
    xml.replace('<mod>55','<mod>65'),xml.replace('<nProt>123456789012345','<nProt>1'),
    xml.replace('<CNPJ>42300391000100','<CNPJ>12345678000100'),xml.replace(`Id="NFe${key}"`,'Id="NFe000"')];
  for(const value of invalid)assert.throws(()=>readOrderInvoice(value,order,parse));
  assert.equal(validInvoiceKey(key.slice(0,-1)+((Number(key.at(-1))+1)%10)),false);
});
function harness(options={}){
  const calls=[],target={...order,...options.order};
  const fetcher=async(url,init={})=>{
    calls.push({url,init});
    if(url.includes('/orders?'))return Response.json([target]);
    if(url.includes('/object/sign/'))return Response.json({signedURL:'/object/sign/order-invoices/test?token=synthetic'});
    if(url.includes('/rpc/')){
      if(options.lostResponse)throw new Error('timeout');
      return options.rpcFail?Response.json({message:'INVOICE_ALREADY_REGISTERED'},{status:409}):Response.json(null);
    }
    return Response.json({});
  };
  const run=async(overrides={})=>{
    const form=new FormData();form.append('orderId',order.id);form.append('confirmed','true');
    form.append('xml',new File([overrides.xml??xml],'nota.xml',{type:'application/xml'}));
    if(overrides.pdf)form.append('danfe',new File([overrides.pdf],'danfe.pdf',{type:'application/pdf'}));
    return invoiceDocuments({request:new Request('https://api.invalid?action=invoice',{method:'POST',body:form}),url:'https://supabase.invalid',serviceKey:'synthetic-role',adminId:'synthetic-admin',parse,fetcher});
  };
  return {calls,run,fetcher};
}
test('valid documents upload privately before atomic record, no fiscal issuance or payment request',async()=>{
  const h=harness(),r=await h.run({pdf:'%PDF-1.4 synthetic'});assert.equal(r.status,201);
  const uploads=h.calls.filter(c=>c.url.includes('/object/order-invoices/')&&c.init.method==='POST');assert.equal(uploads.length,2);
  assert.equal(uploads[0].init.headers['x-upsert'],'false');
  const saved=JSON.parse(h.calls.at(-1).init.body).invoice_details;
  assert.ok(saved.xmlPath.startsWith(order.id+'/'));assert.ok(saved.danfePath.endsWith('.pdf'));
  assert.equal(saved.key,key);assert.equal(h.calls.some(c=>/frenet|sefaz|mercadopago/.test(c.url)),false);
});
test('unpaid, existing invoice, locked label, recipient mismatch and disguised PDF fail before upload',async()=>{
  for(const options of [{order:{financial_status:'aguardando_pagamento'}},{order:{fiscal_invoice:invoice}},
    {order:{label_status:'gerando'}},{order:{tax_id:'11111111111'}}]){
    const h=harness(options);assert.notEqual((await h.run()).status,201);assert.equal(h.calls.some(c=>c.url.includes('/storage/')),false);
  }
  const h=harness();assert.equal((await h.run({pdf:'<script>bad</script>'})).status,400);assert.equal(h.calls.length,0);
});
test('explicit RPC conflict removes only new uploads; lost response retains files for reconciliation',async()=>{
  const rejected=harness({rpcFail:true});assert.equal((await rejected.run()).status,409);
  assert.equal(rejected.calls.at(-1).init.method,'DELETE');
  const lost=harness({lostResponse:true});assert.equal((await lost.run()).status,409);
  assert.equal(lost.calls.some(c=>c.init.method==='DELETE'),false);
});
test('document signing accepts only this order path, uses five minutes and never returns stored credentials',async()=>{
  for(const path of [`${order.id}/22222222-2222-4222-8222-222222222222.xml`,'other-order/file.xml']){
    const h=harness({order:{fiscal_invoice:{...invoice,xmlPath:path}}});
    const r=await invoiceDocuments({request:new Request(`https://api.invalid?action=invoice-document&id=${order.id}&kind=xml`),url:'https://supabase.invalid',serviceKey:'synthetic-role',adminId:'synthetic-admin',parse,fetcher:h.fetcher});
    if(path.startsWith(order.id)){assert.equal(r.status,200);assert.equal(JSON.parse(h.calls.at(-1).init.body).expiresIn,300);assert.doesNotMatch(JSON.stringify(r),/synthetic-role/);}
    else{assert.equal(r.status,404);assert.equal(h.calls.length,1);}
  }
});
