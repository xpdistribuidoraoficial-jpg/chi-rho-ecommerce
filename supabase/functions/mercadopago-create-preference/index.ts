import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN="https://chi-rho-ecommerce.vercel.app";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);
const json=(body:unknown,status=200,origin=SITE_ORIGIN)=>new Response(JSON.stringify(body),{status,headers:{
  "Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"apikey, content-type",
  "Access-Control-Allow-Methods":"GET, POST, OPTIONS","Cache-Control":"no-store",
  "Content-Type":"application/json; charset=utf-8","Vary":"Origin"}});
const safe=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const money=(value:unknown)=>Number(Number(value).toFixed(2));

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!ALLOWED_ORIGINS.has(origin)) return json({error:"Origem não autorizada."},403,SITE_ORIGIN);
  if(request.method==="OPTIONS") return json({},204,origin);
  if(request.headers.get("apikey")!==PUBLIC_KEY) return json({error:"Requisição não autorizada."},401,origin);

  const accessToken=Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")?.trim();
  const publicKey=Deno.env.get("MERCADO_PAGO_PUBLIC_KEY")?.trim();
  const webhookSecret=Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET")?.trim();
  const configured=Boolean(accessToken&&publicKey&&webhookSecret);
  if(request.method==="GET") return json({available:configured,provider:"mercado_pago"},200,origin);
  if(request.method!=="POST") return json({error:"Método não permitido."},405,origin);
  if(!configured) return json({
    error:"O pagamento pelo Mercado Pago ainda está sendo configurado. Seu pedido permanece reservado por tempo limitado.",
    code:"PAYMENT_NOT_CONFIGURED"
  },503,origin);

  const supabaseUrl=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl||!serviceKey) return json({error:"Pagamento temporariamente indisponível."},503,origin);
  let body:any;try{body=await request.json();}catch{return json({error:"Pedido inválido."},400,origin);}
  const code=safe(body?.code,40),publicToken=safe(body?.publicToken,36);
  if(!/^CHR-[A-Z0-9-]{6,32}$/i.test(code)||!uuid.test(publicToken)) return json({error:"Pedido inválido."},400,origin);
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};

  try{
    const prepare=await fetch(`${supabaseUrl}/rest/v1/rpc/prepare_payment_preference`,{method:"POST",headers,
      body:JSON.stringify({target_order_code:code,target_public_token:publicToken}),signal:AbortSignal.timeout(8000)});
    const prepared=await prepare.json().catch(()=>null);
    if(!prepare.ok){
      const message=String(prepared?.message||"");
      if(message.includes("RESERVATION_EXPIRED")||message.includes("RESERVATION_NOT_ACTIVE"))
        return json({error:"A reserva deste pedido expirou. Volte ao carrinho para refazer a compra.",code:"RESERVATION_EXPIRED"},409,origin);
      if(message.includes("ORDER_NOT_PAYABLE")) return json({error:"Este pedido não está aguardando pagamento.",code:"ORDER_NOT_PAYABLE"},409,origin);
      return json({error:"Não foi possível validar o pedido para pagamento."},400,origin);
    }
    const orderId=String(Array.isArray(prepared)?prepared[0]:prepared);
    if(!uuid.test(orderId)) throw new Error("INVALID_PREPARE_RESULT");
    const [orderResponse,itemsResponse]=await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=id,code,customer_name,customer_email,postal_code,shipping_price,shipping_service,subtotal,discount,grand_total,currency,payment_preference_id,payment_preference_url&limit=1`,{headers,signal:AbortSignal.timeout(8000)}),
      fetch(`${supabaseUrl}/rest/v1/order_items?order_id=eq.${orderId}&select=product_slug,sku,product_name,unit_price,quantity,line_total&order=id`,{headers,signal:AbortSignal.timeout(8000)})
    ]);
    const orders=orderResponse.ok?await orderResponse.json():[],items=itemsResponse.ok?await itemsResponse.json():[];
    const order=orders[0];if(!order||!items.length) throw new Error("ORDER_DATA_MISSING");
    if(order.payment_preference_id&&/^https:\/\//i.test(String(order.payment_preference_url||""))){
      return json({paymentUrl:order.payment_preference_url,preferenceId:order.payment_preference_id,reused:true},200,origin);
    }
    const calculatedSubtotal=money(items.reduce((sum:number,item:any)=>sum+Number(item.unit_price)*Number(item.quantity),0));
    const calculatedTotal=money(calculatedSubtotal+Number(order.shipping_price)-Number(order.discount));
    if(calculatedSubtotal!==money(order.subtotal)||calculatedTotal!==money(order.grand_total)) throw new Error("ORDER_TOTAL_MISMATCH");

    const back=(page:string)=>`${SITE_ORIGIN}/${page}?order=${encodeURIComponent(order.code)}`;
    const preferencePayload={
      items:items.map((item:any)=>({
        id:safe(item.sku,80),title:safe(item.product_name,120),description:safe(item.product_slug,120),
        quantity:Number(item.quantity),currency_id:"BRL",unit_price:money(item.unit_price)
      })),
      shipments:{cost:money(order.shipping_price)},
      payer:{name:safe(order.customer_name,160),email:safe(order.customer_email,320),address:{zip_code:safe(order.postal_code,8)}},
      external_reference:order.code,
      back_urls:{success:back("pagamento-sucesso.html"),pending:back("pagamento-pendente.html"),failure:back("pagamento-falhou.html")},
      notification_url:`${SITE_ORIGIN}/api/mercadopago-webhook`,
      auto_return:"approved",
      statement_descriptor:"CHI RHO",
      binary_mode:false,
      metadata:{order_id:order.id,order_code:order.code}
    };
    const mercadoPagoResponse=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{
      Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json","X-Idempotency-Key":order.id
    },body:JSON.stringify(preferencePayload),signal:AbortSignal.timeout(15000)});
    const preference=await mercadoPagoResponse.json().catch(()=>({}));
    if(!mercadoPagoResponse.ok||!preference?.id){
      console.error("Mercado Pago preference creation failed",mercadoPagoResponse.status,safe(preference?.error,80));
      return json({error:"O Mercado Pago não aceitou a solicitação de pagamento neste momento."},502,origin);
    }
    const paymentUrl=accessToken!.startsWith("TEST-")
      ? String(preference.sandbox_init_point||preference.init_point||"")
      : String(preference.init_point||"");
    if(!/^https:\/\//i.test(paymentUrl)) throw new Error("PAYMENT_URL_MISSING");
    const save=await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`,{method:"PATCH",headers:{...headers,Prefer:"return=minimal"},body:JSON.stringify({
      payment_preference_id:String(preference.id).slice(0,160),payment_preference_url:paymentUrl,
      payment_preference_created_at:new Date().toISOString()
    }),signal:AbortSignal.timeout(8000)});
    if(!save.ok) throw new Error("PREFERENCE_NOT_SAVED");
    return json({paymentUrl,preferenceId:String(preference.id),reused:false},201,origin);
  }catch(error){
    console.error("Payment preference flow failed",error instanceof Error?error.message:"UNKNOWN");
    return json({error:"Não foi possível iniciar o pagamento. O pedido não foi marcado como pago."},503,origin);
  }
});
