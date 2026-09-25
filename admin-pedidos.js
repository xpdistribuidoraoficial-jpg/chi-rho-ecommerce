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
const passwordButton=document.querySelector("[data-admin-password]"),passwordDialog=document.querySelector("[data-password-dialog]");
const passwordForm=document.querySelector("[data-password-form]"),passwordStatus=document.querySelector("[data-password-status]");
const forgotPasswordButton=document.querySelector("[data-admin-forgot-password]"),passwordHelp=document.querySelector("[data-password-help]"),currentPasswordLabel=document.querySelector("[data-current-password-label]");
let passwordRecoveryMode=false;
const loginStatus=document.querySelector("[data-admin-login-status]"),status=document.querySelector("[data-admin-status]");
const tbody=document.querySelector("[data-admin-orders]"),empty=document.querySelector("[data-admin-empty]");
const dialog=document.querySelector("[data-order-dialog]");let activeFilter={},refreshPromise=null,ordersRequestSequence=0;
let labelCapability={available:false,message:"A emissão aguarda a homologação do Partner Token da Frenet."};
const getSession=()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");}catch{return null;}};
const saveSession=session=>{const expiresAt=Number(session.expires_at)||Math.floor(Date.now()/1000)+Number(session.expires_in||3600);
  sessionStorage.setItem(SESSION_KEY,JSON.stringify({...session,expires_at:expiresAt}));};
const setView=authenticated=>{login.hidden=authenticated;dashboard.hidden=!authenticated;
  document.querySelector("[data-admin-signout]").hidden=!authenticated;passwordButton.hidden=!authenticated;};
const clearSession=()=>{sessionStorage.removeItem(SESSION_KEY);labelCapability={available:false,message:"A emissão aguarda a homologação do Partner Token da Frenet."};
  if(passwordDialog.open)passwordDialog.close();setView(false);};
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
const uploadPickupConfirmation=async(formData)=>{
  let session;try{session=await ensureSession();}catch{clearSession();throw new Error("AUTH_REQUIRED");}
  const response=await fetch(`${ADMIN_ENDPOINT}?action=confirm-pickup`,{
    method:"POST",
    headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`},
    body:formData
  });
  const data=await response.json().catch(()=>({}));
  if(response.status===401){clearSession();throw new Error("AUTH_REQUIRED");}
  if(!response.ok)throw new Error(data.error||"Não foi possível confirmar a retirada.");
  return data;
};
const loadLabelCapability=async()=>{try{const data=await apiRequest(LABEL_ENDPOINT);labelCapability={
    available:data.available===true,
    message:data.available===true?"Emissão Frenet disponível.":"A emissão aguarda a homologação do Partner Token da Frenet."
  };}catch(error){if(error.message==="AUTH_REQUIRED")throw error;labelCapability={available:false,
    message:"Não foi possível confirmar a disponibilidade da emissão Frenet."};}};

const renderOrders=orders=>{tbody.replaceChildren();empty.hidden=orders.length>0;
  orders.forEach(order=>{const row=node("tr");row.tabIndex=0;row.setAttribute("role","button");
    [order.code,date(order.created_at),order.customer_name,order.customer_whatsapp,order.attribution_channel||"—",order.attribution_device||"—",String(order.item_count),money(order.grand_total),
      label(order.financial_status),(order.shipping_carrier_code==="PICKUP_VENDOR"&&order.operational_status==="pronto_para_envio"?"Aguardando retirada":order.shipping_carrier_code==="PICKUP_VENDOR"&&order.operational_status==="entregue"?"Retirado pelo cliente":label(order.operational_status))].forEach((value,index)=>{const cell=node("td",index>7?"admin-state":"",value);
      if(index===0)cell.classList.add("admin-order-code");row.append(cell);});
    const open=()=>loadDetail(order.id);row.addEventListener("click",open);row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open();}});tbody.append(row);});};
const loadOrders=async()=>{const requestSequence=++ordersRequestSequence;status.textContent="Carregando…";const params=new URLSearchParams(activeFilter);try{const [data]=await Promise.all([request(`?${params}`),loadLabelCapability()]);
  if(requestSequence!==ordersRequestSequence)return;
  renderOrders(data.orders||[]);document.querySelector("[data-admin-summary]").textContent=`${data.orders?.length||0} pedidos neste filtro`;
  document.querySelector("[data-admin-user]").textContent=data.admin?.displayName||data.admin?.email||"Administrador";status.textContent="";}catch(error){if(requestSequence!==ordersRequestSequence)return;status.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;}};
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
    const origin=section("Origem da compra"),originGrid=node("div","admin-detail-grid");
    const originChannel=order.attribution_channel||"Não registrado";
    const campaign=[order.attribution_source,order.attribution_medium,order.attribution_campaign].filter(Boolean).join(" • ")||"—";
    originGrid.append(
      field("Canal",originChannel),
      field("Dispositivo",order.attribution_device||"—"),
      field("Campanha / origem",campaign),
      field("Página de entrada",order.attribution_landing_path||"—"),
      field("Referência externa",order.attribution_referrer||"—"),
      field("Detalhe",order.attribution_content||order.attribution_term||"—")
    );origin.append(originGrid);
    const products=section("Produtos");(data.items||[]).forEach(item=>{const card=node("article","admin-detail-item");
      const image=node("img");image.src=item.image_url||"";image.alt="";const copy=node("div");copy.append(node("strong","",item.product_name),node("span","",`${item.sku} • ${item.quantity} un.`),
        node("span","",`${money(item.unit_price)} por unidade`),
        node("span","",`Estoque: ${item.inventory?.stock_total??"—"} total • ${item.inventory?.stock_reserved??"—"} reservado • ${item.inventory?.stock_available??"—"} disponível`));
      card.append(image,copy,node("b","",money(item.line_total)));products.append(card);});
    const isPickup=order.shipping_carrier_code==="PICKUP_VENDOR";
    const operationalLabel=value=>isPickup&&value==="pronto_para_envio"?"Aguardando retirada":isPickup&&value==="entregue"?"Retirado pelo cliente":label(value);
    const shipping=section(isPickup?"Retirada com o vendedor":"Frete, etiqueta e entrega"),shippingGrid=node("div","admin-detail-grid");
    if(isPickup){
      shippingGrid.append(
        field("Modalidade","Retirada com o vendedor"),
        field("Frete",money(order.shipping_price)),
        field("Situação",operationalLabel(order.operational_status)),
        field("Retirante",order.pickup_receiver_name||"—"),
        field("Retirada confirmada em",date(order.pickup_confirmed_at)),
        field("Comprovante",order.pickup_signature_url?"Assinatura registrada":"—")
      );
    }else{
      shippingGrid.append(field("Transportadora",order.shipping_carrier),field("Serviço",order.shipping_service),field("Prazo",order.shipping_delivery_time),
        field("Frete",money(order.shipping_price)),field("Etiqueta",label(order.label_status)),field("ID Frenet",order.shipping_label_id),
        field("Rastreamento",order.tracking_code||order.tracking_url),field("Validade da etiqueta",date(order.label_valid_through)),field("Situação",label(order.operational_status)));
    }
    shipping.append(shippingGrid);
    if(isPickup&&order.pickup_signature_url){
      const proofActions=node("div","admin-actions");
      proofActions.append(button("Ver assinatura do retirante","btn btn-secondary",()=>openDocument(order.pickup_signature_url)));
      shipping.append(proofActions);
    }
    const payment=section("Pagamento"),paymentGrid=node("div","admin-detail-grid");
    paymentGrid.append(field("Subtotal",money(order.subtotal)),field("Desconto",money(order.discount)),field("Frete",money(order.shipping_price)),
      field("Total",money(order.grand_total)),field("Situação",label(order.financial_status)),field("Forma",order.payment_method),field("Transação",order.payment_external_id));payment.append(paymentGrid);
    const progress=section("Operação"),track=node("div","admin-progress");
    const operationSteps=isPickup?["novo","pago","em_separacao","pronto_para_envio","entregue"]:["novo","pago","em_separacao","pronto_para_envio","enviado","entregue"];
    operationSteps.forEach(step=>track.append(node("span",step===order.financial_status||step===order.operational_status?"is-current":"",operationalLabel(step))));
    progress.append(track);
    const history=section("Histórico"),timeline=node("ol","admin-history");
    (data.history||[]).forEach(entry=>{const item=node("li"),head=node("div"),type=entry.status_type==="financial"?"Pagamento":"Operação";
      head.append(node("strong","",`${type}: ${label(entry.status)}`),node("time","",date(entry.created_at)));item.append(head);
      if(entry.previous_status)item.append(node("span","",`Anterior: ${label(entry.previous_status)}`));
      if(entry.actor_name)item.append(node("small","",`Responsável: ${entry.actor_name}`));
      if(entry.note)item.append(node("small","",entry.note));timeline.append(item);});
    if(!timeline.children.length)timeline.append(node("li","admin-history-empty","Nenhuma alteração registrada."));history.append(timeline);
    const actions=section("Ações administrativas"),buttons=node("div","admin-actions");
    if(order.operational_status==="novo"&&order.financial_status==="pago")buttons.append(button("Iniciar separação","btn btn-primary",()=>updateOrder(order.id,"em_separacao",order)));
    if(order.operational_status==="em_separacao"){
      buttons.append(button(isPickup?"Pronto para retirada":"Marcar como pronto para envio","btn btn-primary",()=>updateOrder(order.id,"pronto_para_envio",order)));
    }
    if(isPickup&&order.operational_status==="pronto_para_envio"){
      const pickupBox=node("div","admin-pickup-confirmation");
      const intro=node("p","admin-action-note","Para confirmar a entrega presencial, registre o nome do retirante e fotografe a assinatura.");
      const nameLabel=node("label","admin-pickup-field"),nameTitle=node("span","","Nome do retirante"),nameInput=node("input");
      nameInput.type="text";nameInput.maxLength=160;nameInput.placeholder="Nome de quem retirou o pedido";nameInput.autocomplete="name";
      nameLabel.append(nameTitle,nameInput);
      const photoLabel=node("label","admin-pickup-field"),photoTitle=node("span","","Foto da assinatura"),photoInput=node("input");
      photoInput.type="file";photoInput.accept="image/jpeg,image/png,image/webp";photoInput.setAttribute("capture","environment");
      photoLabel.append(photoTitle,photoInput);
      const confirm=button("Confirmar entrega com assinatura","btn btn-primary",async()=>{
        const file=photoInput.files?.[0];
        if(!nameInput.value.trim()){status.textContent="Informe o nome do retirante.";nameInput.focus();return;}
        if(!file){status.textContent="Fotografe ou selecione a assinatura do retirante.";photoInput.focus();return;}
        if(file.size>5*1024*1024){status.textContent="A imagem deve ter no máximo 5 MB.";return;}
        if(!window.confirm(`Confirmar que o pedido ${order.code} foi retirado por ${nameInput.value.trim()}?`))return;
        const messageWindow=window.open("","_blank");
        if(messageWindow){messageWindow.document.title="CHI RHO";messageWindow.document.body.textContent="Preparando mensagem ao cliente…";}
        confirm.disabled=true;confirm.textContent="Confirmando entrega…";status.textContent="Salvando comprovante e confirmando retirada…";
        try{
          const formData=new FormData();formData.append("orderId",order.id);formData.append("receiverName",nameInput.value.trim());formData.append("signature",file,file.name||"assinatura.jpg");
          await uploadPickupConfirmation(formData);
          const messagePrepared=openCustomerUpdate(order,"entregue",messageWindow);
          await Promise.all([loadOrders(),loadDetail(order.id)]);
          status.textContent=messagePrepared?"Retirada confirmada. A mensagem ao cliente foi preparada no WhatsApp.":"Retirada confirmada com assinatura.";
        }catch(error){messageWindow?.close();status.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;confirm.disabled=false;confirm.textContent="Confirmar entrega com assinatura";}
      });
      pickupBox.append(intro,nameLabel,photoLabel,confirm);buttons.append(pickupBox);
    }
    if(!isPickup&&order.operational_status==="pronto_para_envio"&&order.label_status!=="gerada"){
      const generate=button(order.label_status==="gerando"?"Etiqueta em processamento":labelCapability.available?"Gerar etiqueta":"Etiqueta aguardando homologação","btn btn-primary",()=>generateLabel(order.id));
      generate.disabled=order.label_status==="gerando"||!labelCapability.available;generate.title=labelCapability.available?"Gerar etiqueta na Frenet":labelCapability.message;buttons.append(generate);
    }
    if(!isPickup&&order.label_status==="gerada"){
      buttons.append(button("Imprimir etiqueta","btn btn-secondary",()=>openDocument(order.label_url)));
      if(order.declaration_url)buttons.append(button("Imprimir declaração","btn btn-secondary",()=>openDocument(order.declaration_url)));
      if(order.operational_status==="pronto_para_envio")buttons.append(button("Marcar como enviado","btn btn-primary",()=>updateOrder(order.id,"enviado",order)));
    }
    if(!isPickup&&order.operational_status==="enviado"){
      if(order.tracking_url)buttons.append(button("Abrir rastreamento","btn btn-secondary",()=>openDocument(order.tracking_url)));
      buttons.append(button("Marcar como entregue","btn btn-primary",()=>updateOrder(order.id,"entregue",order)));
    }
    if(!buttons.children.length)buttons.append(node("p","admin-action-note",order.financial_status==="aguardando_pagamento"?"Aguarde a confirmação real do pagamento para iniciar a separação.":"Nenhuma ação disponível para o estado atual."));
    actions.append(buttons);content.append(client,origin,products,shipping,payment,progress,history,actions);
  }catch(error){content.replaceChildren(node("p","admin-status",error.message));}};
const customerUpdateMessage=(order,newStatus)=>{
  const firstName=String(order?.customer_name||"cliente").trim().split(/\s+/)[0]||"cliente";
  const code=order?.code||"";
  const isPickup=order?.shipping_carrier_code==="PICKUP_VENDOR";
  const messages={
    em_separacao:`Olá, ${firstName}! Seu pedido ${code} da CHI RHO está em separação. Avisaremos você assim que avançarmos para a próxima etapa.`,
    pronto_para_envio:isPickup
      ? `Olá, ${firstName}! Seu pedido ${code} da CHI RHO está pronto para retirada. Aguarde nossa confirmação do atendimento para realizar a retirada.`
      : `Olá, ${firstName}! Seu pedido ${code} da CHI RHO está pronto para envio. Assim que for postado, enviaremos a atualização e o rastreamento, quando disponível.`,
    enviado:`Olá, ${firstName}! Seu pedido ${code} da CHI RHO foi enviado.${order?.tracking_code?` Código de rastreio: ${order.tracking_code}.`:""} Acompanhe as próximas atualizações em Minhas Compras.`,
    entregue:isPickup
      ? `Olá, ${firstName}! Confirmamos a retirada do pedido ${code}. Obrigado por comprar com a CHI RHO!`
      : `Olá, ${firstName}! O pedido ${code} foi marcado como entregue. Obrigado por comprar com a CHI RHO!`
  };
  return messages[newStatus]||`Olá, ${firstName}! O pedido ${code} da CHI RHO foi atualizado para: ${label(newStatus)}.`;
};
const whatsappCustomerUrl=(order,message)=>{
  const digits=String(order?.customer_whatsapp||order?.customer_phone||"").replace(/\D/g,"");
  if(digits.length<10) return null;
  const phone=digits.startsWith("55")?digits:`55${digits}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
const openCustomerUpdate=(order,newStatus,preopenedWindow=null)=>{
  const url=whatsappCustomerUrl(order,customerUpdateMessage(order,newStatus));
  if(!url){preopenedWindow?.close();return false;}
  if(preopenedWindow){preopenedWindow.location.href=url;return true;}
  window.open(url,"_blank","noopener,noreferrer");
  return true;
};

const updateOrder=async(orderId,newStatus,order=null)=>{
  const messageWindow=order?window.open("","_blank"):null;
  if(messageWindow){messageWindow.document.title="CHI RHO";messageWindow.document.body.textContent="Preparando mensagem ao cliente…";}
  status.textContent="Atualizando pedido…";
  try{
    await request("",{method:"PATCH",body:JSON.stringify({orderId,status:newStatus})});
    const messagePrepared=order?openCustomerUpdate(order,newStatus,messageWindow):false;
    await Promise.all([loadOrders(),loadDetail(orderId)]);
    status.textContent=messagePrepared?"Pedido atualizado. A mensagem ao cliente foi preparada no WhatsApp.":"Pedido atualizado.";
  }catch(error){
    messageWindow?.close();
    status.textContent=error.message;
  }
};
const generateLabel=async orderId=>{status.textContent="Solicitando a etiqueta à Frenet…";try{await apiRequest(LABEL_ENDPOINT,"",{method:"POST",body:JSON.stringify({orderId})});
  await Promise.all([loadOrders(),loadDetail(orderId)]);status.textContent="Etiqueta gerada. Confira os dados antes de imprimir.";}catch(error){status.textContent=error.message;await loadDetail(orderId);}};

const passwordError=data=>{const code=String(data?.code||data?.error_code||"");
  if(code.includes("same_password"))return "A nova senha precisa ser diferente da senha atual.";
  if(code.includes("weak_password"))return "Escolha uma senha mais forte, com pelo menos 8 caracteres.";
  return data?.msg||data?.message||data?.error_description||"Não foi possível alterar a senha.";};
const changePassword=async event=>{event.preventDefault();passwordStatus.classList.remove("is-success");passwordStatus.textContent=passwordRecoveryMode?"Salvando nova senha…":"Validando…";
  const form=new FormData(event.currentTarget),currentPassword=String(form.get("current_password")||"");
  const newPassword=String(form.get("new_password")||""),confirmation=String(form.get("confirm_password")||"");
  if(newPassword.length<8){passwordStatus.textContent="A nova senha deve ter pelo menos 8 caracteres.";return;}
  if(newPassword!==confirmation){passwordStatus.textContent="A confirmação da nova senha não confere.";return;}
  if(newPassword===currentPassword){passwordStatus.textContent="A nova senha precisa ser diferente da senha atual.";return;}
  try{
    if(passwordRecoveryMode){
      const session=getSession();if(!session?.access_token)throw new Error("O link de redefinição expirou. Solicite um novo link.");
      const updateResponse=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:"PUT",headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},
        body:JSON.stringify({password:newPassword}),signal:AbortSignal.timeout(10000)});
      const updated=await updateResponse.json().catch(()=>({}));if(!updateResponse.ok)throw new Error(passwordError(updated));
      event.currentTarget.reset();passwordStatus.classList.add("is-success");passwordStatus.textContent="Senha redefinida com sucesso. Você já pode entrar na Gestão Reservada.";
      passwordRecoveryMode=false;sessionStorage.removeItem(SESSION_KEY);history.replaceState(null,"",location.pathname);setTimeout(()=>{if(passwordDialog.open)passwordDialog.close();setView(false);},1500);return;
    }
    const session=await ensureSession(),email=session.user?.email;if(!email)throw new Error("Não foi possível identificar o usuário conectado.");
    const verifyResponse=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({email,password:currentPassword}),signal:AbortSignal.timeout(10000)});
    const verified=await verifyResponse.json().catch(()=>({}));if(!verifyResponse.ok)throw new Error("A senha atual não confere.");
    passwordStatus.textContent="Salvando nova senha…";
    const updateResponse=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:"PUT",headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${verified.access_token}`,"Content-Type":"application/json"},
      body:JSON.stringify({email,current_password:currentPassword,password:newPassword}),signal:AbortSignal.timeout(10000)});
    const updated=await updateResponse.json().catch(()=>({}));if(!updateResponse.ok)throw new Error(passwordError(updated));
    saveSession({...verified,user:updated.user||updated});event.currentTarget.reset();passwordStatus.classList.add("is-success");
    passwordStatus.textContent="Senha alterada com sucesso.";setTimeout(()=>{if(passwordDialog.open)passwordDialog.close();},1200);
  }catch(error){passwordStatus.textContent=error.message;}};

passwordButton.onclick=()=>{passwordRecoveryMode=false;passwordForm.reset();passwordStatus.textContent="";passwordStatus.classList.remove("is-success");currentPasswordLabel.hidden=false;passwordForm.elements.current_password.required=true;passwordHelp.textContent="Confirme sua senha atual e defina uma nova senha com pelo menos 8 caracteres.";passwordDialog.showModal();passwordForm.elements.current_password.focus();};
forgotPasswordButton?.addEventListener("click",async()=>{const email=String(document.querySelector('[data-admin-login-form] [name="email"]')?.value||"").trim().toLowerCase();if(!email){loginStatus.textContent="Informe seu e-mail acima para receber o link de redefinição.";return;}loginStatus.textContent="Enviando link de redefinição…";try{const response=await fetch(`${SUPABASE_URL}/auth/v1/recover`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,redirect_to:`${location.origin}${location.pathname}`}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error("Não foi possível enviar o link agora.");loginStatus.textContent="Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.";}catch(error){loginStatus.textContent=error.message;}};
document.querySelector("[data-password-close]").onclick=()=>passwordDialog.close();
document.querySelector("[data-password-cancel]").onclick=()=>passwordDialog.close();
passwordDialog.addEventListener("click",event=>{if(event.target===passwordDialog)passwordDialog.close();});
passwordForm.addEventListener("submit",changePassword);

document.querySelector("[data-admin-login-form]").addEventListener("submit",async event=>{event.preventDefault();loginStatus.textContent="Entrando…";
  const form=new FormData(event.currentTarget);try{const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email:form.get("email"),password:form.get("password")}),signal:AbortSignal.timeout(10000)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error("E-mail ou senha inválidos.");
    saveSession(data);setView(true);loginStatus.textContent="";await loadOrders();}catch(error){clearSession();loginStatus.textContent=error.message;}});
document.querySelector("[data-admin-signout]").onclick=async()=>{const session=getSession();try{if(session?.access_token)await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`}});}finally{clearSession();}};
document.querySelector("[data-admin-refresh]").onclick=loadOrders;document.querySelector("[data-detail-close]").onclick=()=>dialog.close();
document.querySelectorAll("[data-filter],[data-financial],[data-operational]").forEach(item=>item.addEventListener("click",()=>{
  document.querySelectorAll(".admin-filters button").forEach(filter=>filter.classList.remove("is-active"));item.classList.add("is-active");
  activeFilter=item.dataset.financial?{financial:item.dataset.financial}:item.dataset.operational?{operational:item.dataset.operational}:{};loadOrders();}));

const restore=async()=>{const hash=new URLSearchParams(location.hash.replace(/^#/,""));if(hash.get("type")==="recovery"&&hash.get("access_token")){passwordRecoveryMode=true;saveSession({access_token:hash.get("access_token"),refresh_token:hash.get("refresh_token")||"",expires_in:Number(hash.get("expires_in")||3600),token_type:"bearer",user:{email:""}});setView(false);passwordForm.reset();currentPasswordLabel.hidden=true;passwordForm.elements.current_password.required=false;passwordHelp.textContent="Defina uma nova senha com pelo menos 8 caracteres.";passwordStatus.textContent="";passwordDialog.showModal();passwordForm.elements.new_password.focus();return;}if(!getSession()?.access_token){setView(false);return;}setView(true);await loadOrders();};restore();
