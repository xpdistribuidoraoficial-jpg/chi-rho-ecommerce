import { kitSummary } from './lib/kit-pricing.mjs';
import { initialKits } from './data/cpad-kits.mjs';
import { casaKits } from './data/casa-kits.mjs';
import { COMPANY } from './seo/company.mjs';

let registry = [], registryLoaded = false, checkoutReady = false;
const isCpadPage = document.body.dataset.cpadPage === 'true';
const featuredStudyBibleSlugs = [
  'biblia-estudo-pentecostal',
  'biblia-aplicacao-pessoal-nvt',
  'biblia-estudo-cronologica',
  'biblia-estudo-defesa-da-fe'
];
const inventoryMap = () => Object.fromEntries(catalogProducts.filter(product => !product.kitComponents)
  .map(product => [product.slug, { price:product.preco, stock:Number.isInteger(product.estoque) ? product.estoque : 0,
    name:product.nome, sku:product.sku, category:product.categoria }]));

function availability(product) {
  const configured = product?.testeCarrinho === true && typeof product.preco === 'number' && Number.isInteger(product.estoque);
  if (!configured) return { configured:false, stock:0, available:false };
  const used = new Map();
  for (const line of testCart) {
    if (line.slug === product.slug) continue;
    const other = catalogProducts.find(item => item.slug === line.slug);
    const components = other?.kitComponents || [{ slug:line.slug, quantity:1 }];
    components.forEach(component => used.set(component.slug, (used.get(component.slug) || 0) + component.quantity * line.quantity));
  }
  const components = product.kitComponents || [{ slug:product.slug, quantity:1 }];
  const stock = Math.max(0, Math.min(...components.map(component => {
    const item = catalogProducts.find(candidate => candidate.slug === component.slug);
    return Math.floor(((item?.estoque || 0) - (used.get(component.slug) || 0)) / component.quantity);
  })));
  return { configured:true, stock, available:stock > 0 };
}

function matchesFilters(product) {
  if (!isCpadPage) return true;
  const form = document.querySelector('[data-cpad-filters]');
  if (!form) return true;
  const values = new FormData(form);
  const minimum = Number(values.get('min') || 0), maximum = values.get('max') ? Number(values.get('max')) : Infinity;
  return (values.get('stock') !== 'available' || availability(product).available)
    && (typeof product.preco === 'number' ? product.preco >= minimum && product.preco <= maximum : minimum === 0 && maximum === Infinity)
    && (!values.get('translation') || product.traducao === values.get('translation'))
    && (!values.get('letter') || product.tamanhoLetra === values.get('letter'))
    && (!values.get('harpa') || product.harpa === values.get('harpa'))
    && (!values.get('subject') || product.perfil === values.get('subject'));
}

function updateKits() {
  const inventory = inventoryMap();
  const cpadKits = registryLoaded ? registry : initialKits.map(item => ({ ...item, active:false }));
  for (const kit of [...cpadKits, ...casaKits]) {
    const isCasa = kit.pricing_mode === 'sum_current_prices';
    let product = catalogProducts.find(item => item.slug === kit.slug);
    if (!product) {
      product = { id:kit.slug, slug:kit.slug,
        categoria:isCasa ? 'Kits Casa' : 'Kits CPAD', categoriaSlug:isCasa ? 'utilidades-domesticas' : 'cpad-kits',
        ...(isCasa ? { casa:true } : { editora:'CPAD' }),
        perfil:isCasa ? 'Fone + carregador em uma compra' : 'Seleção com 30% de desconto',
        kitPricingMode:kit.pricing_mode, kitComponents:kit.components, destaque:false, maisVendido:false };
      catalogProducts.push(product);
    }
    Object.assign(product, { nome:kit.name, descricao:kit.description, kitComponents:kit.components,
      cpadKitDisabled: !kit.active, kitActive: !!kit.active,
      imagem:catalogProducts.find(item => item.slug === kit.components[0].slug)?.imagem || 'assets/logo-chi-rho.png',
      imagens:kit.components.map(component => catalogProducts.find(item => item.slug === component.slug)?.imagem).filter(Boolean),
      sku:kit.slug, testeCarrinho:false, estoque:0, preco:null, precoOriginal:null,
      statusPreco:!kit.active ? 'Seleção em preparação' : !checkoutReady ? 'Pagamento em configuração' : 'Verificando disponibilidade…' });
    try {
      const summary = kitSummary(kit, inventory);
      if (kit.active && registryLoaded && kit.components.every(component => catalogProducts.find(item => item.slug === component.slug)?.testeCarrinho))
        Object.assign(product,{preco:summary.price,precoOriginal:summary.original,estoque:summary.stock,testeCarrinho:checkoutReady});
    } catch { /* A draft is shown without a fabricated price or inventory. */ }
  }
}

function refreshViews() {
  updateKits();
  const active = document.querySelector('.catalog-filter.is-active')?.dataset.filter;
  if (catalogGrid) setCatalogFilter(active || (isCpadPage ? 'cpad' : requestedCategory), requestedQuery);
  renderProducts('#cpad-featured-products', featuredStudyBibleSlugs
    .map(slug => catalogProducts.find(product => product.slug === slug && product.editora === 'CPAD'))
    .filter(product => product && isProductActive(product)
      && (!inventoryHydrated || availability(product).available)));
  const chargerOfferSlug = 'casa-carregador-kapbom-ka-5005';
  const offerPriority = product => product.slug === chargerOfferSlug ? 0
    : product.kitPricingMode === 'sum_current_prices' ? 1 : product.ofertaHome ? 2 : 3;
  renderProducts('#cpad-offer-products', catalogProducts.filter(product =>
    product.slug === chargerOfferSlug ||
    product.ofertaHome ||
    (product.kitComponents && product.kitActive) ||
    product.destaqueOfertaCpad
  ).sort((first, second) => offerPriority(first) - offerPriority(second)));
  if (productDialogElement?.open) {
    const slug = productDialogElement.dataset.productSlug;
    const selected = Number(productDialogQuantity?.textContent) || 1;
    const postcode = productDialogPostcode?.value || '';
    openProductDialog(slug,{syncUrl:false});
    if (productDialogQuantity) productDialogQuantity.textContent = String(clampProductCartQuantity(catalogProducts.find(p => p.slug === slug),selected));
    if (productDialogPostcode) productDialogPostcode.value = postcode;
  }
  renderTestCart();
}

function syncCpadFilterVisibility() {
  if (!isCpadPage) return;
  const current = document.querySelector('.cpad-tabs .catalog-filter.is-active')?.dataset.filter || 'cpad';
  const bible = current === 'cpad-biblias';
  const books = bible || current === 'cpad-livros';
  document.querySelectorAll('.cpad-only-bibles').forEach(el => {el.hidden = !bible; if(!bible) el.querySelectorAll('select,input').forEach(input=>{input.value='';});});
  document.querySelectorAll('.cpad-only-books').forEach(el => {el.hidden = !books; if(!books) el.querySelectorAll('select,input').forEach(input=>{input.value='';});});
}
document.querySelector('[data-cpad-toggle]')?.addEventListener('click', event => {
  const button=event.currentTarget;
  const form=document.querySelector('[data-cpad-filters]');
  form.hidden = !form.hidden;
  button.setAttribute('aria-expanded',String(!form.hidden));
  button.textContent = form.hidden ? '☷ Mais filtros' : 'Ocultar filtros';
});
document.querySelector('.cpad-tabs')?.addEventListener('click', event => {
  if(!event.target.closest('[data-filter]')) return;
  queueMicrotask(()=>{syncCpadFilterVisibility();refreshViews();});
});
syncCpadFilterVisibility();

function populateFilters() {
  const products = catalogProducts.filter(product => product.editora === 'CPAD');
  for (const [name, key, label] of [['translation','traducao','Todas as traduções'],['letter','tamanhoLetra','Todos os tamanhos'],['subject','perfil','Todos os assuntos']]) {
    const select = document.querySelector(`[data-cpad-filters] [name="${name}"]`);
    if (select) select.replaceChildren(new Option(label,''), ...[...new Set(products.map(product => product[key]).filter(Boolean))].sort().map(value => new Option(value,value)));
  }
}

window.ChiRhoCpad = { availability, matchesFilters };
window.ChiRhoCpadReady = false;
document.querySelector('[data-cpad-filters]')?.addEventListener('input',refreshViews);
document.querySelector('[data-cpad-filters]')?.addEventListener('submit',event=>{event.preventDefault();refreshViews();});
document.querySelector('[data-cpad-filter-reset]')?.addEventListener('click', () => { document.querySelector('[data-cpad-filters]').reset(); refreshViews(); });
window.addEventListener('chi-rho-inventory-updated',refreshViews);
window.addEventListener('chi-rho-cart-changed', () => queueMicrotask(refreshViews));
document.querySelectorAll('#contato a.btn').forEach(link => {
  link.href = `https://wa.me/${COMPANY.phone.replace(/\D/g,'')}`;
  link.setAttribute('aria-label','Fale com a CHI RHO pelo WhatsApp');
});
document.querySelectorAll('.nav-row').forEach(nav => {
  if (!nav.querySelector('[data-cpad-link]')) {
    const link = document.createElement('a'); link.href='catalogo-cpad.html'; link.textContent='CPAD'; link.dataset.cpadLink='true';
    const faith = [...nav.querySelectorAll('a')].find(item => item.textContent.trim() === 'Fé');
    if (faith) faith.after(link);
  }
});
populateFilters();
refreshViews();
try {
  const response = await fetch('/api/cpad-kits',{signal:AbortSignal.timeout(10000)});
  const data = await response.json();
  if (!response.ok || !Array.isArray(data.kits)) throw new Error('KIT_UNAVAILABLE');
  registry = data.kits; registryLoaded = true; checkoutReady = data.checkoutReady === true;
  if(!checkoutReady) document.querySelector('[data-cpad-status]')?.replaceChildren(document.createTextNode('Kits em exposição. Finalização da compra temporariamente indisponível; os demais produtos continuam disponíveis.'));
} catch {
  document.querySelector('[data-cpad-status]')?.replaceChildren(document.createTextNode('Não foi possível confirmar as ofertas. Atualize a página para tentar novamente.'));
}
window.ChiRhoCpadReady = registryLoaded;
refreshViews();
const direct = new URLSearchParams(location.search).get('produto');
if (direct && [...registry, ...casaKits].some(kit => kit.slug === direct)) openProductDialog(direct,{syncUrl:false});
