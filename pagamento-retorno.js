import { PICKUP_INSTRUCTIONS } from './data/pickup.mjs';
import { trackConfirmedPurchase } from './seo/ecommerce.mjs';
const ENDPOINT="https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/public-order-status";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const LAST_ORDER_KEY="chi-rho-last-order-v1";
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const label=value=>({aguardando_pagamento:"Aguardando pagamento",pago:"Pagamento aprovado",recusado:"Pagamento recusado",
  cancelado:"Cancelado",reembolsado:"Reembolsado",novo:"Pedido recebido",em_separacao:"Em separação",
  pronto_para_envio:"Pronto para envio",enviado:"Enviado",entregue:"Entregue"}[value]||value||"—");
const status=document.querySelector("[data-return-status]"),container=document.querySelector("[data-return-order]");
const getLastOrder=()=>{try{return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY)||"null");}catch{return null;}};
const element=(tag,className,text)=>{const item=document.createElement(tag);if(className)item.className=className;if(text!==undefined)item.textContent=text;return item;};

const render=(order,snapshot)=>{container.replaceChildren();const summary=element("section","payment-order-summary");
  const heading=element("div","payment-order-heading");heading.append(element("span","","PEDIDO"),element("strong","",order.code));summary.append(heading);
  const states=element("div","payment-order-states");states.append(element("b","",label(order.financialStatus)),element("b","",label(order.operationalStatus)));summary.append(states);
  const items=element("div","payment-order-items");(snapshot?.items||[]).forEach(item=>{const row=element("article");const image=element("img");image.src=item.image_url||"";image.alt="";
    const copy=element("div");copy.append(element("strong","",item.product_name),element("span","",`${item.quantity} un. • ${item.sku}`));row.append(image,copy,element("b","",money(item.line_total)));items.append(row);});summary.append(items);
  const totals=element("dl","payment-order-totals");[["Produtos",snapshot?.subtotal],...(snapshot?.discount>0?[["Desconto dos kits",-snapshot.discount]]:[]),["Frete",snapshot?.shippingPrice],["Total",snapshot?.total]].forEach(([name,value])=>{
    const row=element("div");row.append(element("dt","",name),element("dd","",money(value)));totals.append(row);});summary.append(totals);
  const delivery=element("div","payment-order-delivery");const shipping=snapshot?.shipping||{},address=snapshot?.address||{},isPickup=snapshot?.pickup===true;
  delivery.append(
    element("strong","",isPickup?"Retirada":"Entrega"),
    element("span","",`${shipping.carrier||"—"} • ${shipping.service||"—"}`),
    element("small","",isPickup
      ?PICKUP_INSTRUCTIONS
      : `${address.street||""}, ${address.number||""}${address.complement?` — ${address.complement}`:""} • ${address.district||""} • ${address.city||""}/${address.state||""} • ${address.postcode||""}`)
  );summary.append(delivery);container.append(summary);
  status.textContent=`Situação atual: ${label(order.financialStatus)}.`;status.className=`payment-return-status ${order.financialStatus==="pago"?"is-success":order.financialStatus==="aguardando_pagamento"?"is-pending":"is-failure"}`;};
let pollTimer, attempts=0, loading=false, currentOrder;
const schedule=()=>{
  clearTimeout(pollTimer);
  if(attempts<20 && document.visibilityState!=='hidden' && (!currentOrder || currentOrder.financialStatus==='aguardando_pagamento'))
    pollTimer=setTimeout(()=>load(),15000);
};
const load=async({manual=false}={})=>{
  if(loading)return;
  clearTimeout(pollTimer);
  if(manual)attempts=0;
  const last=getLastOrder();
  if(!last?.code||!last?.publicToken){status.textContent="Não encontramos o identificador seguro deste pedido nesta sessão. Consulte Minhas Compras ou fale com a equipe informando o código do pedido.";status.className="payment-return-status is-pending";return;}
  loading=true;attempts++;
  status.textContent="Consultando a situação real do pedido…";
  try{
    const response=await fetch(ENDPOINT,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},body:JSON.stringify({code:last.code,publicToken:last.publicToken}),signal:AbortSignal.timeout(10000)});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"Pedido não localizado.");
    currentOrder=data.order;render(currentOrder,last.checkoutSnapshot);
    trackConfirmedPurchase(currentOrder,last.checkoutSnapshot);
  }catch(error){status.textContent=error.message;status.className="payment-return-status is-failure";}
  finally{loading=false;schedule();}
};
document.querySelector("[data-return-refresh]")?.addEventListener("click",()=>load({manual:true}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')clearTimeout(pollTimer);else if(!currentOrder||currentOrder.financialStatus==='aguardando_pagamento')load({manual:true});});
window.addEventListener('pagehide',()=>clearTimeout(pollTimer));
window.addEventListener('chi-rho-analytics-consent',()=>{if(currentOrder)trackConfirmedPurchase(currentOrder,getLastOrder()?.checkoutSnapshot);});
load();
