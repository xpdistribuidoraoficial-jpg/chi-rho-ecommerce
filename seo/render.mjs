import { escapeHtml, metadataMarkup, productPath, pages } from './metadata.mjs';

export function renderPage(html, meta) {
  // Replace only SEO tags. Never rewrite forms, purchase controls or scripts.
  html = html.replace(/[ \t]*<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/[ \t]*<meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>\s*/gi, '')
    .replace(/[ \t]*<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/[ \t]*<script type="application\/ld\+json" id="chi-rho-schema">[\s\S]*?<\/script>\s*/g, '')
    .replace('</head>', `  ${metadataMarkup(meta)}\n</head>`);
  if (meta.heading) html = html.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/, (_, attributes, original) => `<h1${attributes} data-base-heading="${escapeHtml(original)}">${escapeHtml(meta.heading)}</h1>`);
  if (meta.product) {
    const p = meta.product;
    // Text alternative to the existing JS dialog, not a second buying flow.
    const content = `<noscript><section class="container"><h2>${escapeHtml(p.nome)}</h2><img src="${escapeHtml(p.imagem)}" alt="${escapeHtml(p.nome)}" width="300" /><p>${escapeHtml(p.descricao)}</p>${typeof p.preco === 'number' ? `<p>${p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>` : '<p>Preço em breve</p>'}<p>Ative o JavaScript para visualizar a galeria e os controles do produto.</p></section></noscript>`;
    html = html.replace('</main>', `${content}\n</main>`);
  }
  return html;
}

export function sitemapUrls(products, categories) {
  return [...new Set([
    ...Object.values(pages).map((p) => p.path),
    ...Object.entries(categories).filter(([key]) => products.some((p) => p.categoriaSlug === key || p.categoriasComplementares?.includes(key))).map(([key, c]) => `/${c[1]}?categoria=${key}`),
    ...products.map(productPath)
  ])];
}
