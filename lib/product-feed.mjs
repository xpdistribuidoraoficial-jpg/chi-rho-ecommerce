const SITE = 'https://www.chirho.com.br';
const xml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[character]);
const tag = (name, value) => `<g:${name}>${xml(value)}</g:${name}>`;
const validGtin = value => {
  if (typeof value !== 'string' || !/^(?:\d{8}|\d{12,14})$/.test(value)) return false;
  const digits = [...value].map(Number), check = digits.pop();
  return (10 - digits.reverse().reduce((sum, digit, index) => sum + digit * (index % 2 ? 1 : 3), 0) % 10) % 10 === check;
};

export function renderProductFeed(products, inventory) {
  const live = new Map(inventory.map(item => [item.slug, item]));
  const items = products.flatMap(product => {
    const stock = live.get(product.slug);
    // Drafts and bundles with incomplete identifiers/media are not advertised.
    if (product.kitComponents || /em confirma[çc][aã]o|imagem definitiva/i.test(product.descricao || '')
      || !stock || !Number.isInteger(stock.available) || stock.available < 0
      || !Number.isFinite(Number(stock.unitPrice)) || Number(stock.unitPrice) <= 0
      || !product.imagem?.startsWith('assets/products/')) return [];
    const page = product.casa ? 'catalogo-casa.html' : product.infantil || product.brinquedo ? 'catalogo-infantil.html' : 'catalogo-biblias.html';
    const image = new URL(product.imagem, SITE).href;
    const brand = product.marca || product.editora;
    const gtin = [product.gtin, product.ean, product.isbn].find(validGtin);
    const fields = [tag('id', product.slug), tag('title', product.nome), tag('description', product.descricao),
      tag('link', `${SITE}/${page}?produto=${encodeURIComponent(product.slug)}`), tag('image_link', image),
      tag('price', `${Number(stock.unitPrice).toFixed(2)} BRL`), tag('availability', stock.available > 0 ? 'in_stock' : 'out_of_stock'), tag('condition', 'new')];
    if (brand && !/informad|confirmar|definir/i.test(brand)) fields.push(tag('brand', brand));
    if (gtin) fields.push(tag('gtin', gtin));
    [...new Set(product.imagens || [])].filter(path => path !== product.imagem && path.startsWith('assets/products/')).slice(0, 10)
      .forEach(path => fields.push(tag('additional_image_link', new URL(path, SITE).href)));
    return [`<item>${fields.join('')}</item>`];
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>CHI RHO — produtos</title><link>${SITE}/</link><description>Preços e disponibilidade do catálogo CHI RHO.</description>${items.join('')}</channel></rss>\n`;
}
