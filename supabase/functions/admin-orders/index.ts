import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN="https://chi-rho-ecommerce.vercel.app";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);
const response=(body:unknown,status=200,origin=SITE_ORIGIN)=>new Response(status===204?null:JSON.stringify(body),{
  status,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"GET, PATCH, OPTIONS","Cache-Control":"no-store",
    "Content-Type":"application/json; charset=utf-8","Vary":"Origin"}
});
const safe=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jwtPayload=(token:string)=>{try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));}catch{return null;}};

const getAdmin=async(request:Request,url:string,serviceKey:string)=>{
  const authorization=request.headers.get("authorization")||"";
  if(!authorization.startsWith("Bearer ")) return null;
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers:{apikey:PUBLIC_KEY,Authorization:authorization},signal:AbortSignal.timeout(8000)});
  if(!userResponse.ok) return null;
  const user=await userResponse.json(),payload=jwtPayload(authorization.slice(7));
  const sessionId=safe(payload?.session_id,36);
  if(!uuid.test(String(user?.id||""))||!uuid.test(sessionId)) return null;
  const check=await fetch(`${url}/rest/v1/rpc/authorize_admin_session`,{method:"POST",headers:{
    apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({target_user_id:user.id,target_session_id:sessionId}),signal:AbortSignal.timeout(8000)});
  const admins=check.ok?await check.json():[];
  return admins[0]?{id:user.id,email:user.email,displayName:admins[0].display_name}:null;
};

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!ALLOWED_ORIGINS.has(origin)) return response({error:"Origem não autorizada."},403);
  if(request.method==="OPTIONS") return response({},204,origin);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey) return response({error:"Painel temporariamente indisponível."},503,origin);
  const admin=await getAdmin(request,url,serviceKey);
  if(!admin) return response({error:"Acesso administrativo não autorizado."},401,origin);
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};
  const requestUrl=new URL(request.url);

  if(request.method==="GET"&&requestUrl.searchParams.get("action")==="detail"){
    const id=safe(requestUrl.searchParams.get("id"),36);
    if(!/^[0-9a-f-]{36}$/i.test(id)) return response({error:"Pedido inválido."},400,origin);
    const orderSelect="id,code,customer_name,customer_email,customer_whatsapp,customer_phone,tax_id,postal_code,street,address_number,complement,district,city,state,shipping_carrier,shipping_carrier_code,shipping_service,shipping_service_code,shipping_delivery_time,shipping_price,shipping_quote_id,subtotal,discount,grand_total,financial_status,operational_status,payment_method,payment_external_id,tracking_code,tracking_url,label_url,shipping_label_provider,shipping_label_id,label_status,label_created_at,label_valid_through,declaration_url,shipped_at,reservation_expires_at,cancellation_reason,created_at,updated_at";
    const [orderResult,itemsResult,historyResult,paymentHistoryResult,inventoryResult]=await Promise.all([
      fetch(`${url}/rest/v1/orders?id=eq.${id}&select=${orderSelect}&limit=1`,{headers}),
      fetch(`${url}/rest/v1/order_items?order_id=eq.${id}&select=id,product_slug,sku,product_name,image_url,unit_price,quantity,line_total&order=id`,{headers}),
      fetch(`${url}/rest/v1/order_status_history?order_id=eq.${id}&select=previous_status,status,status_type,note,created_at&order=created_at`,{headers}),
      fetch(`${url}/rest/v1/payment_events?order_id=eq.${id}&select=event_type,mapped_status,processed,error_code,created_at&order=created_at`,{headers}),
      fetch(`${url}/rest/v1/inventory?select=product_slug,stock_total,stock_reserved,stock_available&order=product_slug`,{headers})
    ]);
    const orders=orderResult.ok?await orderResult.json():[];
    if(!orders[0]) return response({error:"Pedido não encontrado."},404,origin);
    const items=itemsResult.ok?await itemsResult.json():[],inventory=inventoryResult.ok?await inventoryResult.json():[];
    const stock=new Map(inventory.map((item:any)=>[item.product_slug,item]));
    const operationalHistory=historyResult.ok?await historyResult.json():[];
    const paymentHistory=paymentHistoryResult.ok?await paymentHistoryResult.json():[];
    const history=[...operationalHistory,...paymentHistory.filter((event:any)=>event.mapped_status).map((event:any)=>({
      previous_status:null,status:event.mapped_status,status_type:"financial",
      note:event.processed?`Evento ${event.event_type} processado.`:`Evento ${event.event_type} não processado${event.error_code?` (${event.error_code})`:""}.`,
      created_at:event.created_at
    }))].sort((left:any,right:any)=>String(left.created_at).localeCompare(String(right.created_at)));
    return response({order:orders[0],items:items.map((item:any)=>({...item,inventory:stock.get(item.product_slug)||null})),history},200,origin);
  }

  if(request.method==="GET"){
    const financial=safe(requestUrl.searchParams.get("financial"),30);
    const operational=safe(requestUrl.searchParams.get("operational"),30);
    let filters="";
    if(financial) filters+=`&financial_status=eq.${encodeURIComponent(financial)}`;
    if(operational) filters+=`&operational_status=eq.${encodeURIComponent(operational)}`;
    const select="id,code,customer_name,customer_whatsapp,grand_total,financial_status,operational_status,created_at";
    const ordersResponse=await fetch(`${url}/rest/v1/orders?select=${select}${filters}&order=created_at.desc&limit=100`,{headers});
    const orders=ordersResponse.ok?await ordersResponse.json():[];
    if(!ordersResponse.ok){console.error("Admin orders list failed",ordersResponse.status);return response({error:"Não foi possível carregar os pedidos."},503,origin);}
    let counts:Record<string,number>={};
    if(orders.length){
      const ids=orders.map((order:any)=>order.id).join(",");
      const itemsResponse=await fetch(`${url}/rest/v1/order_items?order_id=in.(${ids})&select=order_id,quantity`,{headers});
      const items=itemsResponse.ok?await itemsResponse.json():[];
      counts=items.reduce((result:Record<string,number>,item:any)=>{
        result[item.order_id]=(result[item.order_id]||0)+Number(item.quantity);return result;
      },{});
    }
    return response({admin,orders:orders.map((order:any)=>({...order,item_count:counts[order.id]||0}))},200,origin);
  }

  if(request.method==="PATCH"){
    let body:any;try{body=await request.json();}catch{return response({error:"Ação inválida."},400,origin);}
    const orderId=safe(body?.orderId,36),status=safe(body?.status,30);
    const rpc=await fetch(`${url}/rest/v1/rpc/update_order_operation`,{method:"POST",headers,body:JSON.stringify({
      target_order_id:orderId,new_operational_status:status,actor_user_id:admin.id,
      tracking_code_value:safe(body?.trackingCode,120)||null,
      tracking_url_value:safe(body?.trackingUrl,500)||null,
      action_note:safe(body?.note,500)||null
    })});
    const data=await rpc.json().catch(()=>({}));
    if(!rpc.ok){console.error("Admin order update failed",rpc.status,data?.code||"unknown");
      return response({error:String(data?.message||"").includes("INVALID_OPERATIONAL_TRANSITION")
        ?"Esta mudança não é permitida para o estado atual do pedido.":"Não foi possível atualizar o pedido."},400,origin);}
    return response({order:data},200,origin);
  }
  return response({error:"Método não permitido."},405,origin);
});
