const SUPABASE_URL="https://sailabcmcqdzrqhqztqs.supabase.co";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ADMIN_ENDPOINT=`${SUPABASE_URL}/functions/v1/admin-orders`;
const SESSION_KEY="chi-rho-admin-session-v1";
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const date=value=>new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
const label=value=>({aguardando_pagamento:"Aguardando pagamento",pago:"Pago",recusado:"Recusado",cancelado:"Cancelado",
  reembolsado:"Reembolsado",novo:"Novo",em_separacao:"Em separação",pronto_para_envio:"Pronto para envio",
  enviado:"Enviado",entregue:"Entregue"}[value]||value||"—");
const node=(tag,className,text)=>{const element=document.createElement(tag);if(className)element.className=className;
  if(text!==undefined)element.textContent=text;return element;};
const login=document.querySelector("[data-admin-login]"),dashboard=document.querySelector("[data-admin-dashboard]");
const loginStatus=document.querySelector("[data-admin-login-status]"),status=document.querySelector("[data-admin-status]");
const tbody=document.querySelector("[data-admin-orders]"),empty=document.querySelector("[data-admin-empty]");
const dialog=document.querySelector("[data-order-dialog]");let activeFilter={};
const getSession=()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");}catch{return null;}};
const setView=authenticated=>{login.hidden=authenticated;dashboard.hidden=!authenticated;
  document.querySelector("[data-admin-signout]").hidden=!authenticated;};
const request=async(path="",options={})=>{const session=getSession();if(!session?.access_token)throw new Error("AUTH_REQUIRED");
  const response=await fetch(`${ADMIN_ENDPOINT}${path}`,{...options,headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`,
    "Content-Type":"application/json",...(options.headers||{})}});const data=await response.json().catch(()=>({}));
  if(response.status===401){sessionStorage.removeItem(SESSION_KEY);setView(false);throw new Error("AUTH_REQUIRED");}
  if(!response.ok)throw new Error(data.error||"Não foi possível concluir esta ação.");return data;};

const renderOrders=orders=>{tbody.replaceChildren();empty.hidden=orders.length>0;
  orders.forEach(order=>{const row=node("tr");row.tabIndex=0;row.setAttribute("role","button");
    [order.code,date(order.created_at),order.customer_name,order.customer_whatsapp,String(order.item_count),money(order.grand_total),
      label(order.financial_status),label(order.operational_status)].forEach((value,index)=>{const cell=node("td",index>5?"admin-state":"",value);
      if(index===0)cell.classList.add("admin-order-code");row.append(cell);});
    const open=()=>loadDetail(order.id);row.addEventListener("click",open);row.addEventListener("keydown",event=>{if(event.key==="Enter")open();});tbody.append(row);});};
const loadOrders=async()=>{status.textContent="Carregando…";const params=new URLSearchParams(activeFilter);try{const data=await request(`?${params}`);
  renderOrders(data.orders||[]);document.querySelector("[data-admin-summary]").textContent=`${data.orders?.length||0} pedidos neste filtro`;
  status.textContent="";}catch(error){status.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou.":error.message;}};
const field=(title,value)=>{const wrapper=node("div","admin-detail-field");wrapper.append(node("span","",title),node("strong","",value||"—"));return wrapper;};
const section=title=>{const element=node("section","admin-detail-section");element.append(node("h3","",title));return element;};
const loadDetail=async id=>{dialog.showModal();const content=document.querySelector("[data-detail-content]");content.replaceChildren(node("p","admin-status","Carregando pedido…"));
  try{const data=await request(`?action=detail&id=${encodeURIComponent(id)}`),order=data.order;
    document.querySelector("[data-detail-code]").textContent=order.code;content.replaceChildren();
    const client=section("Cliente");const clientGrid=node("div","admin-detail-grid");
    clientGrid.append(field("Nome",order.customer_name),field("WhatsApp",order.customer_whatsapp),field("Telefone",order.customer_phone),
      field("E-mail",order.customer_email),field("CPF/CNPJ",order.tax_id),field("Endereço",`${order.street}, ${order.address_number}${order.complement?` — ${order.complement}`:""} • ${order.district} • ${order.city}/${order.state} • ${order.postal_code}`));client.append(clientGrid);
    const products=section("Produtos");(data.items||[]).forEach(item=>{const card=node("article","admin-detail-item");
      const image=node("img");image.src=item.image_url||"";image.alt="";const copy=node("div");copy.append(node("strong","",item.product_name),node("span","",`${item.sku} • ${item.quantity} un.`));
      card.append(image,copy,node("b","",money(item.line_total)));products.append(card);});
    const shipping=section("Frete e entrega"),shippingGrid=node("div","admin-detail-grid");
    shippingGrid.append(field("Transportadora",order.shipping_carrier),field("Serviço",order.shipping_service),field("Prazo",order.shipping_delivery_time),
      field("Frete",money(order.shipping_price)),field("Rastreamento",order.tracking_code),field("Situação",label(order.operational_status)));shipping.append(shippingGrid);
    const payment=section("Pagamento"),paymentGrid=node("div","admin-detail-grid");
    paymentGrid.append(field("Total",money(order.grand_total)),field("Situação",label(order.financial_status)),field("Forma",order.payment_method),field("Transação",order.payment_external_id));payment.append(paymentGrid);
    const progress=section("Operação"),track=node("div","admin-progress");["novo","pago","em_separacao","pronto_para_envio","enviado","entregue"].forEach(step=>track.append(node("span",step===order.financial_status||step===order.operational_status?"is-current":"",label(step))));progress.append(track);
    const actions=section("Ações administrativas"),buttons=node("div","admin-actions");
    const next={novo:order.financial_status==="pago"?"em_separacao":null,em_separacao:"pronto_para_envio",pronto_para_envio:"enviado",enviado:"entregue"}[order.operational_status];
    if(next){const button=node("button","btn btn-primary",label(next));button.onclick=()=>updateOrder(order.id,next);buttons.append(button);}
    const labelButton=node("button","btn btn-secondary","Gerar etiqueta");labelButton.disabled=true;labelButton.title="Integração de etiqueta ainda não configurada";buttons.append(labelButton);actions.append(buttons);
    content.append(client,products,shipping,payment,progress,actions);
  }catch(error){content.replaceChildren(node("p","admin-status",error.message));}};
const updateOrder=async(orderId,newStatus)=>{status.textContent="Atualizando pedido…";try{await request("",{method:"PATCH",body:JSON.stringify({orderId,status:newStatus})});
  dialog.close();await loadOrders();}catch(error){status.textContent=error.message;}};

document.querySelector("[data-admin-login-form]").addEventListener("submit",async event=>{event.preventDefault();loginStatus.textContent="Entrando…";
  const form=new FormData(event.currentTarget);try{const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email:form.get("email"),password:form.get("password")})});const data=await response.json();if(!response.ok)throw new Error("E-mail ou senha inválidos.");
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(data));setView(true);await loadOrders();}catch(error){loginStatus.textContent=error.message;}});
document.querySelector("[data-admin-signout]").onclick=()=>{sessionStorage.removeItem(SESSION_KEY);setView(false);};
document.querySelector("[data-admin-refresh]").onclick=loadOrders;document.querySelector("[data-detail-close]").onclick=()=>dialog.close();
document.querySelectorAll("[data-filter],[data-financial],[data-operational]").forEach(button=>button.addEventListener("click",()=>{
  document.querySelectorAll(".admin-filters button").forEach(item=>item.classList.remove("is-active"));button.classList.add("is-active");
  activeFilter=button.dataset.financial?{financial:button.dataset.financial}:button.dataset.operational?{operational:button.dataset.operational}:{};loadOrders();}));
setView(Boolean(getSession()?.access_token));if(getSession()?.access_token)loadOrders();
