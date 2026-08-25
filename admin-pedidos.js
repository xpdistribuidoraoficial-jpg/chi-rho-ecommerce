const SUPABASE_URL="https://sailabcmcqdzrqhqztqs.supabase.co";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ADMIN_ENDPOINT=`${SUPABASE_URL}/functions/v1/admin-orders`;
const LABEL_ENDPOINT=`${SUPABASE_URL}/functions/v1/admin-shipping-label`;
const SESSION_KEY="chi-rho-admin-session-v1";
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const date=value=>value?new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"—";
const label=value=>({aguardando_pagamento:"Aguardando pagamento",pago:"Pago",recusado:"Recusado",cancelado:"Cancelado",
  reembolsado:"Reembolsado",novo:"Novo",em_separacao:"Em separação",pronto_para_envio:"Pronto para envio",
  enviado:"Enviado",entregue:"Entregue",nao_solicitada:"Não solicitada",gerando:"Gerando",gerada:"Gerada",falhou:"Falhou"}[value]||value||"—");
const node=(tag,className,text)=>{const element=document.createElement(tag);if(className)element.className=className;
  if(text!==undefined)element.textContent=text;return element;};
const login=document.querySelector("[data-admin-login]"),dashboard=document.querySelector("[data-admin-dashboard]");
const loginStatus=document.querySelector("[data-admin-login-status]"),status=document.querySelector("[data-admin-status]");
const tbody=document.querySelector("[data-admin-orders]"),empty=document.querySelector("[data-admin-empty]");
const dialog=document.querySelector("[data-order-dialog]");let activeFilter={},refreshPromise=null;
const getSession=()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");}catch{return null;}};
const saveSession=session=>{const expiresAt=Number(session.expires_at)||Math.floor(Date.now()/1000)+Number(session.expires_in||3600);
  sessionStorage.setItem(SESSION_KEY,JSON.stringify({...session,expires_at:expiresAt}));};
const setView=authenticated=>{login.hidden=authenticated;dashboard.hidden=!authenticated;
  document.querySelector("[data-admin-signout]").hidden=!authenticated;};
const clearSession=()=>{sessionStorage.removeItem(SESSION_KEY);setView(false);};
const refreshSession=async()=>{const session=getSession();if(!session?.refresh_token)throw new Error("AUTH_REQUIRED");
  const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({refresh_token:session.refresh_token}),signal:AbortSignal.timeout(10000)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error("AUTH_REQUIRED");saveSession(data);return data;};
const ensureSession=async()=>{const session=getSession();if(!session?.access_token)throw new Error("AUTH_REQUIRED");
  if(Number(session.expires_at||0)>Math.floor(Date.now()/1000)+60)return session;
  if(!refreshPromise)refreshPromise=refreshSession().finally(()=>{refreshPromise=null;});return refreshPromise;};
const apiRequest=async(endpoint,path="",options={})=>{let session;try{session=await ensureSession();}catch{clearSession();throw new Error("AUTH_REQUIRED");}
  const response=await fetch(`${endpoint}${path}`,{...options,headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`,
    "Content-Type":"application/json",...(options.headers||{})}});const data=await response.json().catch(()=>({}));
  if(response.status===401){clearSession();throw new Error("AUTH_REQUIRED");}
  if(!response.ok)throw new Error(data.error||"Não foi possível concluir esta ação.");return data;};
const request=(path="",options={})=>apiRequest(ADMIN_ENDPOINT,path,options);

const renderOrders=orders=>{tbody.replaceChildren();empty.hidden=orders.length>0;
  orders.forEach(order=>{const row=node("tr");row.tabIndex=0;row.setAttribute("role","button");
    [order.code,date(order.created_at),order.customer_name,order.customer_whatsapp,String(order.item_count),money(order.grand_total),
      label(order.financial_status),label(order.operational_status)].forEach((value,index)=>{const cell=node("td",index>5?"admin-state":"",value);
      if(index===0)cell.classList.add("admin-order-code");row.append(cell);});
    const open=()=>loadDetail(order.id);row.addEventListener("click",open);row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open();}});tbody.append(row);});};
const loadOrders=async()=>{status.textContent="Carregando…";const params=new URLSearchParams(activeFilter);try{const data=await request(`?${params}`);
  renderOrders(data.orders||[]);document.querySelector("[data-admin-summary]").textContent=`${data.orders?.length||0} pedidos neste filtro`;
  document.querySelector("[data-admin-user]").textContent=data.admin?.displayName||data.admin?.email||"Administrador";status.textContent="";}catch(error){status.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;}};
const field=(title,value)=>{const wrapper=node("div","admin-detail-field");wrapper.append(node("span","",title),node("strong","",value||"—"));return wrapper;};
const section=title=>{const element=node("section","admin-detail-section");element.append(node("h3","",title));return element;};
const button=(text,className,action)=>{const item=node("button",className,text);item.type="button";item.onclick=action;return item;};
const safeUrl=value=>{try{const url=new URL(value);return url.protocol==="https:"?url.href:null;}catch{return null;}};
const openDocument=value=>{const url=safeUrl(value);if(!url){status.textContent="A Frenet não forneceu uma URL HTTPS válida para este documento.";return;}window.open(url,"_blank","noopener,noreferrer");};

const loadDetail=async id=>{if(!dialog.open)dialog.showModal();const content=document.querySelector("[data-detail-content]");content.replaceChildren(node("p","admin-status","Carregando pedido…"));
  try{const data=await request(`?action=detail&id=${encodeURIComponent(id)}`),order=data.order;
    document.querySelector("[data-detail-code]").textContent=order.code;content.replaceChildren();
    const client=section("Cliente"),clientGrid=node("div","admin-detail-grid");
    clientGrid.append(field("Nome",order.customer_name),field("WhatsApp",order.customer_whatsapp),field("Telefone",order.customer_phone),
      field("E-mail",order.customer_email),field("CPF/CNPJ",order.tax_id),field("Endereço",`${order.street}, ${order.address_number}${order.complement?` — ${order.complement}`:""} • ${order.district} • ${order.city}/${order.state} • ${order.postal_code}`));client.append(clientGrid);
    const products=section("Produtos");(data.items||[]).forEach(item=>{const card=node("article","admin-detail-item");
      const image=node("img");image.src=item.image_url||"";image.alt="";const copy=node("div");copy.append(node("strong","",item.product_name),node("span","",`${item.sku} • ${item.quantity} un.`),
        node("span","",`Estoque: ${item.inventory?.stock_total??"—"} total • ${item.inventory?.stock_reserved??"—"} reservado • ${item.inventory?.stock_available??"—"} disponível`));
      card.append(image,copy,node("b","",money(item.line_total)));products.append(card);});
    const shipping=section("Frete, etiqueta e entrega"),shippingGrid=node("div","admin-detail-grid");
    shippingGrid.append(field("Transportadora",order.shipping_carrier),field("Serviço",order.shipping_service),field("Prazo",order.shipping_delivery_time),
      field("Frete",money(order.shipping_price)),field("Etiqueta",label(order.label_status)),field("ID Frenet",order.shipping_label_id),
      field("Rastreamento",order.tracking_code||order.tracking_url),field("Validade da etiqueta",date(order.label_valid_through)),field("Situação",label(order.operational_status)));shipping.append(shippingGrid);
    const payment=section("Pagamento"),paymentGrid=node("div","admin-detail-grid");
    paymentGrid.append(field("Total",money(order.grand_total)),field("Situação",label(order.financial_status)),field("Forma",order.payment_method),field("Transação",order.payment_external_id));payment.append(paymentGrid);
    const progress=section("Operação"),track=node("div","admin-progress");["novo","pago","em_separacao","pronto_para_envio","enviado","entregue"].forEach(step=>track.append(node("span",step===order.financial_status||step===order.operational_status?"is-current":"",label(step))));progress.append(track);
    const actions=section("Ações administrativas"),buttons=node("div","admin-actions");
    if(order.operational_status==="novo"&&order.financial_status==="pago")buttons.append(button("Iniciar separação","btn btn-primary",()=>updateOrder(order.id,"em_separacao")));
    if(order.operational_status==="em_separacao")buttons.append(button("Marcar como pronto para envio","btn btn-primary",()=>updateOrder(order.id,"pronto_para_envio")));
    if(order.operational_status==="pronto_para_envio"&&order.label_status!=="gerada"){
      const generate=button(order.label_status==="gerando"?"Etiqueta em processamento":"Gerar etiqueta","btn btn-primary",()=>generateLabel(order.id));generate.disabled=order.label_status==="gerando";buttons.append(generate);
    }
    if(order.label_status==="gerada"){
      buttons.append(button("Imprimir etiqueta","btn btn-secondary",()=>openDocument(order.label_url)));
      if(order.declaration_url)buttons.append(button("Imprimir declaração","btn btn-secondary",()=>openDocument(order.declaration_url)));
      if(order.operational_status==="pronto_para_envio")buttons.append(button("Marcar como enviado","btn btn-primary",()=>updateOrder(order.id,"enviado")));
    }
    if(order.operational_status==="enviado"){
      if(order.tracking_url)buttons.append(button("Abrir rastreamento","btn btn-secondary",()=>openDocument(order.tracking_url)));
      buttons.append(button("Marcar como entregue","btn btn-primary",()=>updateOrder(order.id,"entregue")));
    }
    if(!buttons.children.length)buttons.append(node("p","admin-action-note",order.financial_status==="aguardando_pagamento"?"Aguarde a confirmação real do pagamento para iniciar a separação.":"Nenhuma ação disponível para o estado atual."));
    actions.append(buttons);content.append(client,products,shipping,payment,progress,actions);
  }catch(error){content.replaceChildren(node("p","admin-status",error.message));}};
const updateOrder=async(orderId,newStatus)=>{status.textContent="Atualizando pedido…";try{await request("",{method:"PATCH",body:JSON.stringify({orderId,status:newStatus})});
  await Promise.all([loadOrders(),loadDetail(orderId)]);status.textContent="Pedido atualizado.";}catch(error){status.textContent=error.message;}};
const generateLabel=async orderId=>{status.textContent="Solicitando a etiqueta à Frenet…";try{await apiRequest(LABEL_ENDPOINT,"",{method:"POST",body:JSON.stringify({orderId})});
  await Promise.all([loadOrders(),loadDetail(orderId)]);status.textContent="Etiqueta gerada. Confira os dados antes de imprimir.";}catch(error){status.textContent=error.message;await loadDetail(orderId);}};

document.querySelector("[data-admin-login-form]").addEventListener("submit",async event=>{event.preventDefault();loginStatus.textContent="Entrando…";
  const form=new FormData(event.currentTarget);try{const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email:form.get("email"),password:form.get("password")}),signal:AbortSignal.timeout(10000)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error("E-mail ou senha inválidos.");
    saveSession(data);setView(true);loginStatus.textContent="";await loadOrders();}catch(error){clearSession();loginStatus.textContent=error.message;}});
document.querySelector("[data-admin-signout]").onclick=async()=>{const session=getSession();try{if(session?.access_token)await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`}});}finally{clearSession();}};
document.querySelector("[data-admin-refresh]").onclick=loadOrders;document.querySelector("[data-detail-close]").onclick=()=>dialog.close();
document.querySelectorAll("[data-filter],[data-financial],[data-operational]").forEach(item=>item.addEventListener("click",()=>{
  document.querySelectorAll(".admin-filters button").forEach(filter=>filter.classList.remove("is-active"));item.classList.add("is-active");
  activeFilter=item.dataset.financial?{financial:item.dataset.financial}:item.dataset.operational?{operational:item.dataset.operational}:{};loadOrders();}));

const restore=async()=>{if(!getSession()?.access_token){setView(false);return;}setView(true);await loadOrders();};restore();
