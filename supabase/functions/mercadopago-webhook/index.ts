import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  "Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"}});
const hex=async(secret:string,message:string)=>{
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
};
const equal=(left:string,right:string)=>{
  if(left.length!==right.length) return false; let difference=0;
  for(let index=0;index<left.length;index++) difference|=left.charCodeAt(index)^right.charCodeAt(index);
  return difference===0;
};
const mapStatus=(status:string)=>({pending:"aguardando_pagamento",in_process:"aguardando_pagamento",
  authorized:"aguardando_pagamento",approved:"pago",rejected:"recusado",cancelled:"cancelado",
  refunded:"reembolsado",charged_back:"reembolsado"}[status]||null);

Deno.serve(async(request)=>{
  if(request.method!=="POST") return json({error:"Método não permitido."},405);
  if(request.headers.get("apikey")!==PUBLIC_KEY) return json({error:"Não autorizado."},401);
  const secret=Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  const accessToken=Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  const supabaseUrl=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!secret||!accessToken||!supabaseUrl||!serviceKey){
    console.warn("Mercado Pago webhook received while integration is not configured");
    return json({error:"Webhook preparado, mas ainda não configurado para produção."},503);
  }
  const requestUrl=new URL(request.url);
  let body:any;try{body=await request.json();}catch{return json({error:"Evento inválido."},400);}
  const dataId=String(requestUrl.searchParams.get("data.id")||body?.data?.id||"").toLowerCase();
  const requestId=request.headers.get("x-request-id")||"";
  const signature=request.headers.get("x-signature")||"";
  const parts=Object.fromEntries(signature.split(",").map(part=>part.trim().split("=",2)));
  if(!dataId||!requestId||!parts.ts||!parts.v1) return json({error:"Assinatura ausente."},401);
  const manifest=`id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  if(!equal(await hex(secret,manifest),parts.v1)) return json({error:"Assinatura inválida."},401);
  if(String(body?.type||requestUrl.searchParams.get("type")||"")!=="payment") return json({received:true,ignored:true},200);

  const paymentResponse=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,{
    headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(12000)});
  if(!paymentResponse.ok){console.error("Mercado Pago payment lookup failed",paymentResponse.status);return json({error:"Pagamento não consultado."},502);}
  const payment=await paymentResponse.json();
  const mapped=mapStatus(String(payment?.status||""));
  const orderCode=String(payment?.external_reference||"").slice(0,40);
  if(!mapped||!orderCode){console.error("Mercado Pago event missing supported status or reference");return json({received:true,ignored:true},200);}
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};
  const orderResponse=await fetch(`${supabaseUrl}/rest/v1/orders?code=eq.${encodeURIComponent(orderCode)}&select=id&limit=1`,{headers});
  const orders=orderResponse.ok?await orderResponse.json():[];
  if(!orders[0]){console.error("Mercado Pago order reference not found");return json({received:true,orderFound:false},200);}
  const eventKey=`mercadopago:${String(body?.id||requestId).slice(0,120)}:${dataId}:${String(payment.status).slice(0,30)}`;
  const apply=await fetch(`${supabaseUrl}/rest/v1/rpc/apply_order_payment_status`,{method:"POST",headers,body:JSON.stringify({
    target_order_id:orders[0].id,new_financial_status:mapped,provider_event_key:eventKey,
    external_payment_id:String(payment.id),payment_method_name:String(payment.payment_type_id||payment.payment_method_id||"").slice(0,80),
    event_type_name:String(body?.action||"payment.updated").slice(0,80),raw_provider_status:String(payment.status).slice(0,40),
    event_signature_valid:true,event_reason:String(payment.status_detail||"").slice(0,160)||null
  })});
  if(!apply.ok){const error=await apply.json().catch(()=>({}));console.error("Payment state update failed",apply.status,error?.code||"unknown");
    return json({error:"Evento recebido, mas não processado."},503);}
  return json({received:true,processed:true},200);
});
