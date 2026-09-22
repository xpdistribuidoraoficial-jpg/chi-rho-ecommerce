const SUPABASE_URL="https://sailabcmcqdzrqhqztqs.supabase.co";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const INVENTORY_ENDPOINT=`${SUPABASE_URL}/functions/v1/admin-inventory`;
const SESSION_KEY="chi-rho-admin-session-v1";
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const login=document.querySelector("[data-admin-login]");
const dashboard=document.querySelector("[data-admin-dashboard]");
const loginStatus=document.querySelector("[data-admin-login-status]");
const status=document.querySelector("[data-inventory-status]");
const tbody=document.querySelector("[data-inventory-items]");
const empty=document.querySelector("[data-inventory-empty]");
const searchInput=document.querySelector("[data-inventory-search]");
const categorySelect=document.querySelector("[data-inventory-category]");
const stockFilter=document.querySelector("[data-inventory-stock-filter]");
let items=[],refreshPromise=null;

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
const request=async(options={})=>{let session;try{session=await ensureSession();}catch{clearSession();throw new Error("AUTH_REQUIRED");}
  const response=await fetch(INVENTORY_ENDPOINT,{...options,headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json",...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));if(response.status===401){clearSession();throw new Error("AUTH_REQUIRED");}if(!response.ok)throw new Error(data.error||"Não foi possível concluir esta ação.");return data;};

const escapeText=value=>String(value??"");
const buildCategories=()=>{const selected=categorySelect.value;const categories=[...new Set(items.map(item=>item.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  categorySelect.replaceChildren(new Option("Todas as categorias",""),...categories.map(category=>new Option(category,category)));categorySelect.value=categories.includes(selected)?selected:"";};
const filteredItems=()=>{const term=searchInput.value.trim().toLocaleLowerCase("pt-BR"),category=categorySelect.value,stock=stockFilter.value;
  return items.filter(item=>{const haystack=`${item.product_name} ${item.sku} ${item.category||""}`.toLocaleLowerCase("pt-BR");
    if(term&&!haystack.includes(term))return false;if(category&&item.category!==category)return false;
    if(stock==="available"&&Number(item.stock_available)<=0)return false;if(stock==="zero"&&Number(item.stock_available)>0)return false;return true;});};
const updateCounters=list=>{document.querySelector("[data-count-products]").textContent=String(list.length);
  document.querySelector("[data-count-total]").textContent=String(list.reduce((sum,item)=>sum+Number(item.stock_total||0),0));
  document.querySelector("[data-count-reserved]").textContent=String(list.reduce((sum,item)=>sum+Number(item.stock_reserved||0),0));
  document.querySelector("[data-count-available]").textContent=String(list.reduce((sum,item)=>sum+Number(item.stock_available||0),0));};

const render=()=>{const list=filteredItems();tbody.replaceChildren();empty.hidden=list.length>0;updateCounters(list);
  list.forEach(item=>{const row=document.createElement("tr");row.dataset.slug=item.product_slug;
    const product=document.createElement("td"),productWrap=document.createElement("div");productWrap.className="inventory-product";
    if(item.image_url){const img=document.createElement("img");img.src=item.image_url;img.alt="";img.loading="lazy";productWrap.append(img);}
    const copy=document.createElement("div"),name=document.createElement("strong"),slug=document.createElement("small");name.textContent=item.product_name;slug.textContent=item.product_slug;copy.append(name,slug);productWrap.append(copy);product.append(productWrap);
    const category=document.createElement("td");category.textContent=item.category||"—";
    const sku=document.createElement("td");sku.textContent=item.sku||"—";
    const price=document.createElement("td");price.textContent=money(item.unit_price);
    const reserved=document.createElement("td");reserved.textContent=String(item.stock_reserved??0);
    const available=document.createElement("td");available.className=Number(item.stock_available)>0?"inventory-positive":"inventory-zero";available.textContent=String(item.stock_available??0);
    const total=document.createElement("td"),control=document.createElement("div");control.className="inventory-quantity";
    const minus=document.createElement("button");minus.type="button";minus.textContent="−";minus.setAttribute("aria-label",`Diminuir estoque de ${escapeText(item.product_name)}`);
    const input=document.createElement("input");input.type="number";input.min=String(item.stock_reserved||0);input.max="999999";input.step="1";input.value=String(item.stock_total||0);input.inputMode="numeric";input.setAttribute("aria-label",`Estoque total de ${escapeText(item.product_name)}`);
    const plus=document.createElement("button");plus.type="button";plus.textContent="+";plus.setAttribute("aria-label",`Aumentar estoque de ${escapeText(item.product_name)}`);
    minus.onclick=()=>{input.value=String(Math.max(Number(input.min)||0,(Number(input.value)||0)-1));};plus.onclick=()=>{input.value=String(Math.min(999999,(Number(input.value)||0)+1));};control.append(minus,input,plus);total.append(control);
    const action=document.createElement("td"),save=document.createElement("button");save.type="button";save.className="btn btn-primary inventory-save";save.textContent="Salvar";
    save.onclick=()=>saveStock(item,input,save);action.append(save);row.append(product,category,sku,price,reserved,available,total,action);tbody.append(row);});};

const saveStock=async(item,input,button)=>{const value=Number(input.value);const minimum=Number(item.stock_reserved||0);
  if(!Number.isInteger(value)||value<minimum||value>999999){status.textContent=`Informe um estoque total válido. Este item possui ${minimum} unidade(s) reservada(s).`;input.focus();return;}
  const original=button.textContent;button.disabled=true;button.textContent="Salvando…";status.textContent=`Atualizando ${item.product_name}…`;
  try{const data=await request({method:"PATCH",body:JSON.stringify({productSlug:item.product_slug,stockTotal:value})});
    const updated=data.item;if(updated){Object.assign(item,updated);input.value=String(item.stock_total);render();}
    status.classList.add("is-success");status.textContent=`Estoque de ${item.product_name} atualizado para ${value} unidade(s).`;
  }catch(error){status.classList.remove("is-success");status.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;}
  finally{button.disabled=false;button.textContent=original;}};

const load=async()=>{status.classList.remove("is-success");status.textContent="Carregando estoque…";
  try{const data=await request();items=Array.isArray(data.items)?data.items:[];document.querySelector("[data-admin-user]").textContent=data.admin?.displayName||data.admin?.email||"Administrador";
    buildCategories();render();document.querySelector("[data-admin-summary]").textContent=`${items.length} produtos no estoque operacional`;status.textContent="";}
  catch(error){status.textContent=error.message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":error.message;}};

document.querySelector("[data-admin-login-form]").addEventListener("submit",async event=>{event.preventDefault();loginStatus.textContent="Entrando…";const form=new FormData(event.currentTarget);
  try{const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json"},body:JSON.stringify({email:form.get("email"),password:form.get("password")}),signal:AbortSignal.timeout(10000)});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error("E-mail ou senha inválidos.");saveSession(data);setView(true);loginStatus.textContent="";await load();}
  catch(error){clearSession();loginStatus.textContent=error.message;}});
document.querySelector("[data-admin-signout]").onclick=async()=>{const session=getSession();try{if(session?.access_token)await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`}});}finally{clearSession();}};
document.querySelector("[data-inventory-refresh]").onclick=load;
[searchInput,categorySelect,stockFilter].forEach(element=>element.addEventListener(element===searchInput?"input":"change",render));
const restore=async()=>{if(!getSession()?.access_token){setView(false);return;}setView(true);await load();};restore();