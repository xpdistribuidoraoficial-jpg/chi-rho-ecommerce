// Read-only SEO projection. Never changes catalog, prices or inventory.
import { shippingProducts } from '../data/shipping-products.mjs';

export const SITE = 'https://www.chirho.com.br';
export const pages = {
  'index.html': { path: '/', name: 'CHI RHO', title: 'CHI RHO | Bíblias, livros, brinquedos e casa', description: 'Conheça a CHI RHO: Bíblias, livros cristãos, brinquedos e utilidades para casa. Explore os catálogos de Casa, Família e Fé.' },
  'catalogo-biblias.html': { path: '/catalogo-biblias.html', name: 'Bíblias e livros cristãos', title: 'Bíblias e livros cristãos | CHI RHO', description: 'Explore Bíblias de estudo, femininas, masculinas, ministeriais e infantis, além de livros cristãos no catálogo de Fé da CHI RHO.', category: 'fe' },
  'catalogo-infantil.html': { path: '/catalogo-infantil.html', name: 'Infantil', title: 'Brinquedos e Bíblias infantis | CHI RHO', description: 'Conheça os brinquedos e as Bíblias infantis da CHI RHO. Veja imagens, descrições e preços cadastrados para escolher por categoria.', category: 'infantil' },
  'catalogo-casa.html': { path: '/catalogo-casa.html', name: 'Casa', title: 'Casa: cozinha e utilidades domésticas | CHI RHO', description: 'Explore as utilidades para cozinha e casa da CHI RHO. Confira detalhes, imagens e preços de produtos para facilitar sua rotina.', category: 'casa' },
  'quem-somos.html': { path: '/quem-somos.html', name: 'Quem somos', title: 'Quem somos | Conheça a CHI RHO', description: 'Conheça a CHI RHO e sua proposta de reunir produtos para casa, família e fé. Saiba mais sobre a empresa e seus valores.' }
};
export const categories = {
  'biblias-de-estudo': ['Bíblias de Estudo', 'catalogo-biblias.html', 'Explore Bíblias de estudo com comentários e recursos de leitura. Confira as edições, traduções e editoras cadastradas na CHI RHO.'],
  'biblias-femininas': ['Bíblias Femininas', 'catalogo-biblias.html', 'Conheça as Bíblias femininas da CHI RHO. Compare traduções, capas, formatos e detalhes das edições disponíveis no catálogo.'],
  'biblias-masculinas': ['Bíblias Masculinas', 'catalogo-biblias.html', 'Veja as Bíblias masculinas do catálogo CHI RHO, com diferentes traduções, tamanhos de letra, capas e recursos para leitura.'],
  'biblias-ministeriais': ['Bíblias Ministeriais', 'catalogo-biblias.html', 'Confira Bíblias ministeriais na CHI RHO: edições com recursos para estudo, preparação de mensagens e leitura bíblica.'],
  'biblias-infantis': ['Bíblias Infantis', 'catalogo-infantil.html', 'Explore Bíblias infantis na CHI RHO. Conheça histórias, ilustrações, formatos e detalhes de cada edição do catálogo.'],
  'livros-cristaos': ['Livros Cristãos', 'catalogo-biblias.html', 'Conheça os livros cristãos da CHI RHO. Confira autores, editoras, descrições e preços cadastrados de cada título.'],
  'brinquedos-infantis': ['Brinquedos', 'catalogo-infantil.html', 'Explore os brinquedos da CHI RHO: caminhões, tratores, ônibus e blocos de montar. Veja fotos reais, detalhes e preços cadastrados.'],
  'cozinha': ['Cozinha', 'catalogo-casa.html', 'Conheça os produtos para cozinha da CHI RHO. Confira imagens, medidas, características e preços das utilidades do catálogo.'],
  'utilidades-domesticas': ['Utilidades Domésticas', 'catalogo-casa.html', 'Explore utilidades domésticas na CHI RHO, com imagens e informações dos produtos para a rotina da casa.']
};
export const categoryPath = (slug) => categories[slug] ? `/${categories[slug][1]}?categoria=${slug}` : '/catalogo-biblias.html';
export const productPath = (p) => `/${p.casa ? 'catalogo-casa.html' : p.infantil || p.brinquedo ? 'catalogo-infantil.html' : 'catalogo-biblias.html'}?produto=${encodeURIComponent(p.slug)}`;
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

export function validGtin(value) {
  if (typeof value !== 'string' || !/^\d{8}$|^\d{12,14}$/.test(value)) return false;
  const digits = [...value].map(Number), check = digits.pop();
  return (10 - digits.reverse().reduce((sum, digit, i) => sum + digit * (i % 2 ? 1 : 3), 0) % 10) % 10 === check;
}

export function productSchema(product) {
  const url = SITE + productPath(product);
  const schema = { '@type': 'Product', '@id': `${url}#product`, name: product.nome, description: product.descricao, url, image: [...new Set([product.imagem, ...(product.imagens || [])])].filter(Boolean).map((image) => new URL(image, SITE).href) };
  const brand = product.marca || product.editora;
  if (brand && !/informad|confirmar|definir/i.test(brand)) schema.brand = { '@type': 'Brand', name: brand };
  const sku = product.sku || shippingProducts[product.slug]?.sku;
  if (sku) schema.sku = sku;
  // Ambiguous lists, placeholders and invalid check digits are deliberately omitted.
  const gtin = [product.gtin, product.ean, product.isbn].find(validGtin);
  if (gtin) schema[`gtin${gtin.length}`] = gtin;
  if (typeof product.preco === 'number' && Number.isFinite(product.preco) && product.preco > 0) {
    schema.offers = { '@type': 'Offer', url, price: product.preco.toFixed(2), priceCurrency: 'BRL' };
    // Static stock can lag live reservations. Do not infer availability from it.
  }
  return schema;
}

export function getMetadata(file, params = new URLSearchParams(), products = []) {
  const base = pages[file];
  if (!base) return null;
  let title = base.title, description = base.description, canonical = SITE + base.path, name = base.name, heading = null;
  let status = 200, noindex = params.has('q'), product;
  let trail = [{ name: 'Início', url: SITE + '/' }];
  if (file !== 'index.html') trail.push({ name: base.name, url: canonical });
  const category = params.get('categoria');
  if (category && categories[category] && (categories[category][1] === file || (category === 'biblias-infantis' && file === 'catalogo-biblias.html'))) {
    [name, , description] = categories[category];
    title = `${name} | CHI RHO`; heading = name; canonical = SITE + categoryPath(category);
    trail = [trail[0], { name: pages[categories[category][1]].name, url: SITE + pages[categories[category][1]].path }, { name, url: canonical }];
  } else if (category && category !== base.category && category !== 'todas') noindex = true;
  if (params.has('produto')) {
    product = file === 'quem-somos.html' ? undefined : products.find((p) => p.slug === params.get('produto'));
    if (product) {
      title = `${product.nome} | CHI RHO`; description = product.descricao; heading = product.nome; name = product.nome; canonical = SITE + productPath(product); noindex = false;
      const parent = product.categoriaSlug;
      trail = [trail[0], { name: categories[parent]?.[0] || product.categoria, url: SITE + categoryPath(parent) }, { name, url: canonical }];
    } else {
      title = 'Produto não encontrado | CHI RHO'; description = 'Este produto não está publicado. Explore os catálogos da CHI RHO.'; heading = 'Produto não encontrado'; noindex = true; status = 404;
    }
  }
  const image = product ? new URL(product.imagem, SITE).href : `${SITE}/assets/logo-chi-rho.png`;
  const graph = [
    { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'CHI RHO', url: `${SITE}/`, logo: `${SITE}/assets/logo-chi-rho.png` },
    { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'CHI RHO', url: `${SITE}/`, inLanguage: 'pt-BR', publisher: { '@id': `${SITE}/#organization` } }
  ];
  if (trail.length > 1 && status === 200) graph.push({ '@type': 'BreadcrumbList', itemListElement: trail.filter((item, i, list) => list.findIndex((other) => other.url === item.url) === i).map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })) });
  if (product) graph.push(productSchema(product));
  return { title, description, canonical, image, name, heading, status, noindex, product, schema: { '@context': 'https://schema.org', '@graph': graph } };
}

export function metadataMarkup(meta) {
  return `<title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}" />
  <meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
  <link rel="canonical" href="${escapeHtml(meta.canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="CHI RHO" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:title" content="${escapeHtml(meta.title)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  <meta property="og:url" content="${escapeHtml(meta.canonical)}" />
  <meta property="og:image" content="${escapeHtml(meta.image)}" />
  <meta property="og:image:alt" content="${escapeHtml(meta.name)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json" id="chi-rho-schema">${jsonLd(meta.schema)}</script>`;
}
