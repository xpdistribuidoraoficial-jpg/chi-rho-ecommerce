const SITE = 'https://www.chirho.com.br';
const xml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[character]);
const tag = (name, value) => `<g:${name}>${xml(value)}</g:${name}>`;
const validGtin = value => {
  if (typeof value !== 'string' || !/^(?:\d{8}|\d{12,14})$/.test(value)) return false;
  const digits = [...value].map(Number), check = digits.pop();
  return (10 - digits.reverse().reduce((sum, digit, index) => sum + digit * (index % 2 ? 1 : 3), 0) % 10) % 10 === check;
};

// Targeted editorial titles: verified editions, without claims of discounts or ranking.
const merchantTitles = {
  'biblia-estudo-cronologica': 'Bíblia de Estudo Cronológica Aplicação Pessoal CPAD ARC — Tarja Marrom',
  'biblia-estudo-cronologica-tricolor': 'Bíblia de Estudo Cronológica Aplicação Pessoal CPAD ARC — Tricolor (Tarja Verde)',
  'biblia-defesa-fe-luxo-preta': 'Bíblia de Estudo em Defesa da Fé CPAD ARC Grande Luxo Preta',
  'biblia-defesa-fe-luxo-vinho': 'Bíblia de Estudo em Defesa da Fé CPAD ARC Grande Luxo Vinho'
};
const merchantTitle = product => merchantTitles[product.slug] || product.nome;

// Accept merchant-hosted cover photos only from the CPAD manufacturer's trusted
// HTTPS image CDN and with a high-resolution rendition. Never allow arbitrary hosts.
const verifiedImage = value => {
  if (typeof value !== 'string') return false;
  if (value.startsWith('assets/products/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'cpad.vtexassets.com'
      && /^\/arquivos\/ids\/\d+-800-auto(?:$|-)/.test(url.pathname);
  } catch { return false; }
};

export function renderProductFeed(products, inventory) {
  const live = new Map(inventory.map(item => [item.slug, item]));
  const items = products.flatMap(product => {
    const stock = live.get(product.slug);
    // Never submit unavailable products to Merchant Center; only live positive stock is eligible.
    // Drafts and bundles with incomplete identifiers/media are not advertised.
    if (product.kitComponents || /em confirma[çc][aã]o|imagem definitiva/i.test(product.descricao || '')
      || !stock || !Number.isInteger(stock.available) || stock.available <= 0
      || !Number.isFinite(Number(stock.unitPrice)) || Number(stock.unitPrice) <= 0
      || !verifiedImage(product.imagem)) return [];
    const page = product.casa ? 'catalogo-casa.html' : product.infantil || product.brinquedo ? 'catalogo-infantil.html' : 'catalogo-biblias.html';
    const image = new URL(product.imagem, SITE).href;
    const brand = product.marca || product.editora;
    const gtin = [product.gtin, product.ean, product.isbn].find(validGtin);
    const fields = [tag('id', product.slug), tag('title', merchantTitle(product)), tag('description', product.descricao),
      tag('link', `${SITE}/${page}?produto=${encodeURIComponent(product.slug)}`), tag('image_link', image),
      tag('price', `${Number(stock.unitPrice).toFixed(2)} BRL`), tag('availability', 'in_stock'), tag('condition', 'new'),
      // Merchant Center counts business days Monday-Friday by default.
      // Carrier transit and current Frenet rates are configured separately.
      tag('max_handling_time', 5)];
    const weight = Number(stock.weight);
    if (Number.isFinite(weight) && weight > 0 && weight <= 2000) fields.push(tag('shipping_weight', `${weight} kg`));
    const dimensions = ['length', 'width', 'height'];
    if (dimensions.every(key => Number.isFinite(Number(stock[key])) && Number(stock[key]) >= 1 && Number(stock[key]) <= 400)) {
      dimensions.forEach(key => fields.push(tag(`shipping_${key}`, `${Number(stock[key])} cm`)));
    }
    if (brand && !/informad|confirmar|definir/i.test(brand)) fields.push(tag('brand', brand));
    if (gtin) fields.push(tag('gtin', gtin));
    [...new Set(product.imagens || [])].filter(path => path !== product.imagem && path.startsWith('assets/products/')).slice(0, 10)
      .forEach(path => fields.push(tag('additional_image_link', new URL(path, SITE).href)));
    return [`<item>${fields.join('')}</item>`];
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>CHI RHO — produtos</title><link>${SITE}/</link><description>Preços e disponibilidade do catálogo CHI RHO.</description>${items.join('')}</channel></rss>\n`;
}
