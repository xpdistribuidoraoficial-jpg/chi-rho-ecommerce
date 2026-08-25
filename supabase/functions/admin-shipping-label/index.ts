import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN="https://chi-rho-ecommerce.vercel.app";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const response=(body:unknown,status=200,origin=SITE_ORIGIN)=>new Response(JSON.stringify(body),{status,headers:{
  "Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization, apikey, content-type",
  "Access-Control-Allow-Methods":"GET, POST, OPTIONS","Cache-Control":"no-store",
  "Content-Type":"application/json; charset=utf-8","Vary":"Origin"}});
const safe=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);
const digits=(value:unknown)=>String(value||"").replace(/\D/g,"");
const jwtPayload=(authorization:string)=>{try{return JSON.parse(atob(authorization.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));}catch{return null;}};
const rpc=async(url:string,serviceKey:string,name:string,body:unknown)=>{
  const result=await fetch(`${url}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},
    body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  return {ok:result.ok,status:result.status,data:await result.json().catch(()=>null)};
};

const getAdmin=async(request:Request,url:string,serviceKey:string)=>{
  const authorization=request.headers.get("authorization")||"";
  if(!authorization.startsWith("Bearer ")) return null;
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers:{apikey:PUBLIC_KEY,Authorization:authorization},signal:AbortSignal.timeout(8000)});
  if(!userResponse.ok) return null;
  const user=await userResponse.json(),payload=jwtPayload(authorization.slice(7));
  const sessionId=safe(payload?.session_id,36);
  if(!uuid.test(String(user?.id||""))||!uuid.test(sessionId)) return null;
  const authorized=await rpc(url,serviceKey,"authorize_admin_session",{target_user_id:user.id,target_session_id:sessionId});
  const record=Array.isArray(authorized.data)?authorized.data[0]:null;
  return authorized.ok&&record?{id:user.id,email:user.email,displayName:record.display_name}:null;
};

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!ALLOWED_ORIGINS.has(origin)) return response({error:"Origem não autorizada."},403,SITE_ORIGIN);
  if(request.method==="OPTIONS") return response({},204,origin);
  if(request.method!=="GET"&&request.method!=="POST") return response({error:"Método não permitido."},405,origin);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey) return response({error:"Operação temporariamente indisponível."},503,origin);
  const admin=await getAdmin(request,url,serviceKey);
  if(!admin) return response({error:"Acesso administrativo não autorizado."},401,origin);

  const frenetToken=Deno.env.get("FRENET_TOKEN")?.trim();
  const partnerToken=Deno.env.get("FRENET_PARTNER_TOKEN")?.trim();
  const configured=Boolean(frenetToken&&partnerToken);
  if(request.method==="GET") return response({
    available:configured,
    provider:"frenet",
    reason:configured?null:"partner_token_pending"
  },200,origin);
  const printFormat=/^(A4|A6)$/i.test(Deno.env.get("FRENET_PRINTING_FORMAT")||"")
    ? String(Deno.env.get("FRENET_PRINTING_FORMAT")).toUpperCase():"A4";
  if(!configured) return response({
    error:"A emissão de etiquetas Frenet está preparada, mas ainda depende do Partner Token autorizado.",
    code:"LABEL_NOT_CONFIGURED"
  },503,origin);
  let body:any;try{body=await request.json();}catch{return response({error:"Ação inválida."},400,origin);}
  const orderId=safe(body?.orderId,36);
  if(!uuid.test(orderId)) return response({error:"Pedido inválido."},400,origin);

  const claim=await rpc(url,serviceKey,"claim_shipping_label",{target_order_id:orderId,actor_user_id:admin.id});
  if(!claim.ok){
    const message=String(claim.data?.message||"");
    const mapped=message.includes("LABEL_ALREADY_GENERATED")?"Já existe uma etiqueta para este pedido.":
      message.includes("LABEL_IN_PROGRESS")?"A etiqueta deste pedido já está sendo gerada.":
      message.includes("ORDER_NOT_PAID")?"A etiqueta só pode ser gerada após o pagamento.":
      message.includes("ORDER_NOT_READY")?"Marque o pedido como pronto para envio antes de gerar a etiqueta.":
      message.includes("ADDRESS_INCOMPLETE")?"Complete o endereço do pedido antes de gerar a etiqueta.":
      message.includes("SHIPPING_INCOMPLETE")?"Os dados do frete estão incompletos.":
      message.includes("PRODUCT_SHIPPING_DATA_INCOMPLETE")?"Peso ou dimensões de um produto precisam ser validados.":
      message.includes("STOCK_NOT_COMMITTED")?"A baixa de estoque do pedido ainda não foi confirmada.":
      "Não foi possível reservar a emissão da etiqueta.";
    return response({error:mapped},409,origin);
  }
  const requestKey=String(claim.data||"").replace(/^"|"$/g,"");
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};
  const fail=async(code:string)=>rpc(url,serviceKey,"fail_shipping_label",{
    target_order_id:orderId,request_key:requestKey,actor_user_id:admin.id,error_code:code
  });

  try{
    const [orderResponse,itemsResponse]=await Promise.all([
      fetch(`${url}/rest/v1/orders?id=eq.${orderId}&select=id,code,customer_name,customer_email,customer_whatsapp,customer_phone,tax_id,postal_code,street,address_number,complement,district,city,state,shipping_carrier,shipping_carrier_code,shipping_service,shipping_service_code,shipping_delivery_time,shipping_price,subtotal,grand_total&limit=1`,{headers,signal:AbortSignal.timeout(8000)}),
      fetch(`${url}/rest/v1/order_items?order_id=eq.${orderId}&select=id,product_slug,sku,product_name,category,unit_price,quantity,line_total&order=id`,{headers,signal:AbortSignal.timeout(8000)})
    ]);
    const orders=orderResponse.ok?await orderResponse.json():[],items=itemsResponse.ok?await itemsResponse.json():[];
    const order=orders[0];if(!order||!items.length) throw new Error("ORDER_DATA_MISSING");
    const inventoryResponse=await fetch(`${url}/rest/v1/inventory?select=product_slug,weight_kg,length_cm,height_cm,width_cm,category,is_fragile`,{headers,signal:AbortSignal.timeout(8000)});
    const inventory=inventoryResponse.ok?await inventoryResponse.json():[];
    const shippingBySlug=new Map(inventory.map((item:any)=>[item.product_slug,item]));
    const document=digits(order.tax_id),phone=digits(order.customer_phone||order.customer_whatsapp);
    if(!/^\d{11}$|^\d{14}$/.test(document)) throw new Error("RECIPIENT_DOCUMENT_MISSING");
    if(!/^\d{10,11}$/.test(phone)) throw new Error("RECIPIENT_PHONE_MISSING");
    const frenetItems=items.map((item:any)=>{
      const product:any=shippingBySlug.get(item.product_slug);if(!product) throw new Error("PRODUCT_SHIPPING_DATA_MISSING");
      return {Id:String(item.id),ProductId:item.product_slug,Weight:Number(product.weight_kg),Length:Number(product.length_cm),
        Height:Number(product.height_cm),Width:Number(product.width_cm),Quantity:Number(item.quantity),Price:Number(item.unit_price),
        IsFragile:Boolean(product.is_fragile),ProductName:item.product_name,SKU:item.sku,Category:product.category||item.category};
    });
    const volumes=frenetItems.flatMap((item:any)=>Array.from({length:item.Quantity},()=>({Weight:item.Weight,Length:item.Length,
      Height:item.Height,Width:item.Width,Price:item.Price,DeclaredValue:item.Price,OrderItemsId:[item.Id]})));
    const deliveryTime=Number.parseInt(String(order.shipping_delivery_time||"0"),10)||0;
    const payload={Shipment:[{Order:{Id:order.code,Value:Number(order.grand_total),UseFrenetRegistration:true,Items:frenetItems,
      To:{Name:order.customer_name,Email:order.customer_email,Phone:phone,Document:document,Address:{ZipCode:digits(order.postal_code),
        City:order.city,Street:order.street,AddressNumber:order.address_number,AddressComplement:order.complement||"",
        AddressQuarter:order.district,AddressState:order.state,Country:"BR"}}},Volumes:volumes,Quotation:{
          ServiceCode:order.shipping_service_code,ServiceName:order.shipping_service,PlatformShippingPrice:Number(order.shipping_price),
          DeliveryTime:deliveryTime,Carrier:order.shipping_carrier,CarrierCode:order.shipping_carrier_code||"",
          ShippingPrice:Number(order.shipping_price),Services:[]}}]};
    const frenetResponse=await fetch("https://whitelabel.frenet.com.br/v1/orders/oneclick",{method:"POST",headers:{
      token:frenetToken,"x-partner-token":partnerToken,"x-printing-format":printFormat,"Content-Type":"application/json"
    },body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
    const frenet=await frenetResponse.json().catch(()=>({}));
    const result=(frenet?.Items||frenet?.items||[])[0];
    const labelId=String(result?.ShipmentId||result?.shipmentId||"");
    const labelUrl=String(result?.LabelUrl||result?.labelUrl||"");
    const trackingUrl=String(result?.TrackingUrl||result?.trackingUrl||"");
    const declarationUrl=String(result?.DeclarationUrl||result?.declarationUrl||"");
    const validThrough=result?.ValidThrough||result?.validThrough||null;
    const errors=result?.Errors||result?.errors||frenet?.Error||frenet?.error;
    if(!frenetResponse.ok||!labelId||!/^https?:\/\//i.test(labelUrl)||errors){
      console.error("Frenet label generation failed",frenetResponse.status,Array.isArray(errors)?errors.length:"provider_error");
      throw new Error("FRENET_REJECTED");
    }
    const trackingCode=(trackingUrl.match(/([A-Z]{2}\d{9}[A-Z]{2})(?:\b|\/|$)/i)||[])[1]||"";
    const completed=await rpc(url,serviceKey,"complete_shipping_label",{target_order_id:orderId,request_key:requestKey,
      actor_user_id:admin.id,provider_name:"frenet",provider_label_id:labelId,label_document_url:labelUrl,
      declaration_document_url:declarationUrl,provider_tracking_url:trackingUrl,provider_tracking_code:trackingCode,
      label_expiration:validThrough});
    if(!completed.ok) throw new Error("LABEL_NOT_SAVED");
    return response({label:{provider:"Frenet",id:labelId,labelUrl,declarationUrl,trackingUrl,trackingCode,
      validThrough,status:"gerada"}},201,origin);
  }catch(error){
    const code=error instanceof Error?error.message:"UNKNOWN";await fail(code);
    const message=code==="RECIPIENT_DOCUMENT_MISSING"?"Informe um CPF ou CNPJ válido no pedido antes de gerar a etiqueta.":
      code==="RECIPIENT_PHONE_MISSING"?"Informe um telefone válido no pedido antes de gerar a etiqueta.":
      code==="FRENET_REJECTED"?"A Frenet não conseguiu gerar a etiqueta para este pedido.":
      "Não foi possível gerar a etiqueta. Nenhuma segunda etiqueta será comprada automaticamente.";
    return response({error:message,code},502,origin);
  }
});
