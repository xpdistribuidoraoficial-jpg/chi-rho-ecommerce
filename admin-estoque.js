const SUPABASE_URL="https://sailabcmcqdzrqhqztqs.supabase.co";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const INVENTORY_ENDPOINT=`${SUPABASE_URL}/functions/v1/admin-inventory`;
const ADMIN_PORTAL=location.pathname.includes("xpdistribuidora")?"paulo":"owner";
const EXPECTED_ADMIN_EMAIL=ADMIN_PORTAL==="paulo"?"xpdistribuidora.oficial@gmail.com":"contato.michellopes@gmail.com";
const SESSION_KEY=ADMIN_PORTAL==="paulo"?"chi-rho-admin-session-paulo-v1":"chi-rho-admin-session-owner-v1";
const LOW_STOCK_LIMIT=2;
const adminRoleLabel=role=>({owner:"Proprietário",senior_admin:"Administrador Sênior",operator:"Operador"}[role]||"Administrador");
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const date=value=>value?new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"—";
const login=document.querySelector("[data-admin-login]");
const dashboard=document.querySelector("[data-admin-dashboard]");
const loginStatus=document.querySelector("[data-admin-login-status]");
const status=document.querySelector("[data-inventory-status]");
const tbody=document.querySelector("[data-inventory-items]");
const empty=document.querySelector("[data-inventory-empty]");
const searchInput=document.querySelector("[data-inventory-search]");
const categorySelect=document.querySelector("[data-inventory-category]");
const stockFilter=document.querySelector("[data-inventory-stock-filter]");
const stockDialog=document.querySelector("[data-stock-dialog]");
const stockForm=document.querySelector("[data-stock-form]");
const stockStatus=document.querySelector("[data-stock-status]");
const historyDialog=document.querySelector("[data-history-dialog]");
const historyList=document.querySelector("[data-history-list]");
const historyStatus=document.querySelector("[data-history-status]");
let items=[],refreshPromise=null,activeItem=null;

const getSession=()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");}catch{return null;}};
const saveSession=session=>{const expiresAt=Number(session.expires_at)||Math.floor(Date.now()/1000)+Number(session.expires_in||3600);sessionStorage.setItem(SESSION_KEY,JSON.stringify({...session,expires_at:expiresAt}));};
const setView=authenticated=>{login.hidden=authenticated;dashboard.hidden=!authenticated;document.querySelector("[data-admin-signout]").hidden=!authenticated;};
const clearSession=()=>{sessionStorage.removeItem(SESSION_KEY);setView(false);};
const refreshSession=async()=>{const session=getSession();if(!session?.refresh_token)throw new Error("AUTH_REQUIRED");
  const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:session.refresh_token}),signal:AbortSignal.timeout(10000)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error("AUTH_REQUIRED");saveSession(data);return data;};
const ensureSession=async()=>{const session=getSession();if(!session?.access_token)throw new Error("AUTH_REQUIRED");
  if(Number(session.expires_at||0)>Math.floor(Date.now()/1000)+60)return session;
  if(!refreshPromise)refreshPromise=refreshSession().finally(()=>{refreshPromise=null;});return refreshPromise;};
const request=async(path="",options={})=>{let session;try{session=await ensureSession();}catch{clearSession();throw new Error("AUTH_REQUIRED");}
  const response=await fetch(`${INVENTORY_ENDPOINT}${path}`,{...options,headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`,"X-Admin-Portal":ADMIN_PORTAL,"Content-Type":"application/json",...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));if(response.status===401){clearSession();throw new Error("AUTH_REQUIRED");}if(!response.ok)throw new Error(data.error||"Não foi possível concluir esta ação.");return data;};

const buildCategories=()=>{const selected=categorySelect.value;const categories=[...new Set(items.map(item=>item.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  categorySelect.replaceChildren(new Option("Todas as categorias",""),...categories.map(category=>new Option(category,category)));categorySelect.value=categories.includes(selected)?selected:"";};
const filteredItems=()=>{const term=searchInput.value.trim().toLocaleLowerCase("pt-BR"),category=categorySelect.value,stock=stockFilter.value;
  return items.filter(item=>{const haystack=`${item.product_name} ${item.sku} ${item.category||""}`.toLocaleLowerCase("pt-BR"),available=Number(item.stock_available||0);
    if(term&&!haystack.includes(term))return false;if(category&&item.category!==category)return false;
    if(stock==="available"&&available<=0)return false;if(stock==="low"&&!(available>0&&available<=LOW_STOCK_LIMIT))return false;if(stock==="zero"&&available!==0)return false;return true;});};
const updateCounters=list=>{document.querySelector("[data-count-products]").textContent=String(list.length);
  document.querySelector("[data-count-total]").textContent=String(list.reduce((sum,item)=>sum+Number(item.stock_total||0),0));
  document.querySelector("[data-count-reserved]").textContent=String(list.reduce((sum,item)=>sum+Number(item.stock_reserved||0),0));
  document.querySelector("[data-count-available]").textContent=String(list.reduce((sum,item)=>sum+Number(item.stock_available||0),0));
  document.querySelector("[data-count-low]").textContent=String(list.filter(item=>Number(item.stock_available)>0&&Number(item.stock_available)<=LOW_STOCK_LIMIT).length);
  document.querySelector("[data-count-zero]").textContent=String(list.filter(item=>Number(item.stock_available)===0).length);};

const button=(text,className,action)=>{const element=document.createElement("button");element.type="button";element.className=className;element.textContent=text;element.addEventListener("click",action);return element;};

const render=()=>{const list=filteredItems();tbody.replaceChildren();empty.hidden=list.length>0;updateCounters(list);
  list.forEach(item=>{const row=document.createElement("tr");row.dataset.slug=item.product_slug;
    const product=document.createElement("td"),productWrap=document.createElement("div");productWrap.className="inventory-product";
    if(item.image_url){const img=document.createElement("img");img.src=item.image_url;img.alt="";img.loading="lazy";productWrap.append(img);}
    const copy=document.createElement("div"),name=document.createElement("strong"),slug=document.createElement("small");name.textContent=item.product_name;slug.textContent=item.product_slug;copy.append(name,slug);productWrap.append(copy);product.append(productWrap);
    const category=document.createElement("td");category.textContent=item.category||"—";
    const sku=document.createElement("td");sku.textContent=item.sku||"—";
    const price=document.createElement("td");price.textContent=money(item.unit_price);
    const total=document.createElement("td");total.textContent=String(item.stock_total??0);total.className="inventory-total";
    const reserved=document.createElement("td");reserved.textContent=String(item.stock_reserved??0);
    const available=document.createElement("td"),availableValue=Number(item.stock_available||0);available.textContent=String(availableValue);
    available.className=availableValue===0?"inventory-zero":availableValue<=LOW_STOCK_LIMIT?"inventory-low":"inventory-positive";
    const action=document.createElement("td"),actions=document.createElement("div");actions.className="inventory-row-actions";
    actions.append(button("Movimentar","btn btn-primary inventory-save",()=>openMovement(item)),button("Histórico","btn btn-secondary inventory-history-button",()=>openHistory(item)));action.append(actions);
    row.append(product,category,sku,price,total,reserved,available,action);tbody.append(row);});};

const updatePreview=()=>{if(!activeItem)return;const form=new FormData(stockForm),quantity=Number(form.get("quantity")||0),type=String(form.get("movement_type")||"entrada");
  const current=Number(activeItem.stock_total||0),delta=type==="entrada"?quantity:-quantity,next=current+delta,availableAfter=next-Number(activeItem.stock_reserved||0),preview=document.querySelector("[data-stock-preview]");
  if(!Number.isInteger(quantity)||quantity<=0){preview.textContent="Informe a quantidade para visualizar o saldo após a movimentação.";preview.className="inventory-result-preview";return;}
  preview.textContent=`Estoque total: ${current} → ${next}. Disponível após a movimentação: ${availableAfter}.`;
  preview.className=`inventory-result-preview ${next<0||availableAfter<0?"is-danger":availableAfter<=LOW_STOCK_LIMIT?"is-warning":"is-ok"}`;};

const openMovement=item=>{activeItem=item;stockForm.reset();stockStatus.textContent="";stockStatus.classList.remove("is-success");
  document.querySelector("[data-stock-title]").textContent=item.product_name;document.querySelector("[data-stock-total]").textContent=String(item.stock_total??0);
  document.querySelector("[data-stock-reserved]").textContent=String(item.stock_reserved??0);document.querySelector("[data-stock-available]").textContent=String(item.stock_available??0);
  stockForm.elements.movement_type.value="entrada";updatePreview();stockDialog.showModal();stockForm.elements.quantity.focus();};

const saveMovement=async event=>{event.preventDefault();if(!activeItem)return;const form=new FormData(stockForm),type=String(form.get("movement_type")||""),quantity=Number(form.get("quantity")),reasonBase=String(form.get("reason")||"").trim(),note=String(form.get("note")||"").trim();
  if(!Number.isInteger(quantity)||quantity<=0){stockStatus.textContent="Informe uma quantidade válida.";return;}
  const delta=type==="entrada"?quantity:-quantity,next=Number(activeItem.stock_total||0)+delta,availableAfter=next-Number(activeItem.stock_reserved||0);
  if(next<0||availableAfter<0){stockStatus.textContent="Essa saída deixaria o estoque abaixo da quantidade disponível para operação.";return;}
  const reason=note?`${reasonBase} — ${note}`:reasonBase;if(!reasonBase){stockStatus.textContent="Informe o motivo da movimentação.";return;}
  if((Math.abs(delta)>=20||next===0)&&!window.confirm(`Confirmar ${type} de ${quantity} unidade(s) para “${activeItem.product_name}”? O estoque total ficará em ${next}.`))return;
  const submit=stockForm.querySelector('button[type="submit"]'),original=submit.textContent;submit.disabled=true;submit.textContent="Registrando…";stockStatus.textContent="Salvando movimentação…";
  try{const data=await request("",{method:"PATCH",body:JSON.stringify({productSlug:activeItem.product_slug,quantityDelta:delta,reason})});
    if(data.item)Object.assign(activeItem,data.item);render();stockStatus.classList.add("is-success");stockStatus.textContent=`Movimentação registrada. Estoque total atual: ${activeItem.stock_total}.`;
    document.querySelector("[data-stock-total]").textContent=String(activeItem.stock_total);document.querySelector("[data-stock-reserved]").textContent=String(activeItem.stock_reserved);document.querySelector("[data-stock-available]").textContent=String(activeItem.stock_available);
    stockForm.elements.quantity.value="";stockForm.elements.note.value="";updatePreview();}
  catch(error){stockStatus.classList.remove("is-success");stockStatus.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;}
  finally{submit.disabled=false;submit.textContent=original;}};

const openHistory=async item=>{document.querySelector("[data-history-title]").textContent=item.product_name;historyList.replaceChildren();historyStatus.textContent="Carregando histórico…";historyDialog.showModal();
  try{const data=await request(`?action=history&product=${encodeURIComponent(item.product_slug)}`),movements=Array.isArray(data.movements)?data.movements:[];
    historyList.replaceChildren();if(!movements.length){historyList.append(Object.assign(document.createElement("p"),{className:"admin-action-note",textContent:"Nenhuma movimentação registrada."}));}
    movements.forEach(movement=>{const card=document.createElement("article");card.className="inventory-history-item";
      const top=document.createElement("div"),kind=document.createElement("strong"),time=document.createElement("time"),delta=Number(movement.quantity_change||0);
      kind.textContent=movement.movement_type==="ajuste"?"Estoque inicial / ajuste":delta>0?`Entrada +${delta}`:`Saída ${delta}`;time.textContent=date(movement.created_at);top.append(kind,time);
      const balance=document.createElement("span");balance.textContent=`Saldo: ${movement.previous_stock_total} → ${movement.new_stock_total}`;
      const reason=document.createElement("small");reason.textContent=movement.reason||"Sem observação";
      const actor=document.createElement("small");actor.textContent=`Registrado por: ${movement.actor_name||"Administrador"}`;
      card.append(top,balance,reason,actor);historyList.append(card);});historyStatus.textContent="";}
  catch(error){historyStatus.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;}};

const load=async()=>{status.classList.remove("is-success");status.textContent="Carregando estoque…";
  try{const data=await request();items=Array.isArray(data.items)?data.items:[];document.querySelector("[data-admin-user]").textContent=`${data.admin?.displayName||data.admin?.email||"Administrador"} • ${adminRoleLabel(data.admin?.role)}`;
    buildCategories();render();document.querySelector("[data-admin-summary]").textContent=`${items.length} produtos no estoque operacional • alerta de estoque baixo em até ${LOW_STOCK_LIMIT} unidades disponíveis`;status.textContent="";}
  catch(error){status.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;}};

stockForm.addEventListener("submit",saveMovement);stockForm.elements.quantity.addEventListener("input",updatePreview);stockForm.elements.movement_type.addEventListener("change",updatePreview);
document.querySelector("[data-stock-close]").onclick=()=>stockDialog.close();document.querySelector("[data-stock-cancel]").onclick=()=>stockDialog.close();stockDialog.addEventListener("click",event=>{if(event.target===stockDialog)stockDialog.close();});
document.querySelector("[data-history-close]").onclick=()=>historyDialog.close();historyDialog.addEventListener("click",event=>{if(event.target===historyDialog)historyDialog.close();});

const adminLoginEmail=document.querySelector('[data-admin-login-form] [name="email"]');
if(adminLoginEmail){adminLoginEmail.value=EXPECTED_ADMIN_EMAIL;adminLoginEmail.readOnly=true;}
document.querySelector("[data-admin-login-form]").addEventListener("submit",async event=>{event.preventDefault();loginStatus.textContent="Entrando…";const form=new FormData(event.currentTarget);
  try{const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},body:JSON.stringify({email:EXPECTED_ADMIN_EMAIL,password:form.get("password")}),signal:AbortSignal.timeout(10000)});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error("E-mail ou senha inválidos.");saveSession(data);setView(true);loginStatus.textContent="";await load();}
  catch(error){clearSession();loginStatus.textContent=error.message;}});
document.querySelector("[data-admin-signout]").onclick=async()=>{const session=getSession();try{if(session?.access_token)await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`}});}finally{clearSession();}};
document.querySelector("[data-inventory-refresh]").onclick=load;
[searchInput,categorySelect,stockFilter].forEach(element=>element.addEventListener(element===searchInput?"input":"change",render));
const restore=async()=>{if(!getSession()?.access_token){setView(false);return;}setView(true);await load();};restore();