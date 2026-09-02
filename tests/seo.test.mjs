import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { activeProducts } from '../seo/catalog.mjs';
import { SITE, pages, categories, getMetadata, productSchema, productPath, validGtin } from '../seo/metadata.mjs';
import { renderPage, sitemapUrls } from '../seo/render.mjs';
import endpoint from '../api/seo-page.js';
import middleware, { config } from '../middleware.js';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const paths = sitemapUrls(activeProducts, categories);

test('sitemap cobre exatamente as páginas públicas, categorias e 63 produtos ativos', () => {
  const xml = read('sitemap.xml');
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
  assert.deepEqual(locations, paths.map((path) => SITE + path));
  assert.equal(locations.length, 77);
  assert.equal(new Set(locations).size, 77);
  assert.equal(locations.filter((url) => url.includes('?produto=')).length, 63);
  assert.doesNotMatch(xml, /vercel\.app|checkout|pagamento-|admin-|basculantes|#|<lastmod>/);
});

test('robots libera recursos de renderização e declara o sitemap oficial', () => {
  const robots = read('robots.txt');
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Sitemap: https:\/\/www.chirho.com.br\/sitemap.xml/);
  assert.doesNotMatch(robots, /Disallow:.*(?:assets|\.js|\.css|catalogo|produto|checkout)/);
});

test('cinco páginas estáticas possuem metadados e schemas únicos sem duplicação', () => {
  const titles = [];
  for (const file of Object.keys(pages)) {
    const html = read(file), meta = getMetadata(file);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.equal((html.match(/id="chi-rho-schema"/g) || []).length, 1);
    assert.ok(html.includes(`href="${meta.canonical}"`));
    assert.match(html, /lang="pt-BR"/);
    assert.match(html, /name="viewport"/);
    assert.match(html, /property="og:locale" content="pt_BR"/);
    assert.equal(renderPage(html, meta), html, `${file} precisa de seo:build`);
    titles.push(meta.title);
  }
  assert.equal(new Set(titles).size, 5);
});

test('todas as 77 URLs recebem canonical próprio e HTML 200 antes do JavaScript', async () => {
  const titles = new Set();
  for (const path of paths) {
    const url = new URL(path, SITE), file = url.pathname.slice(1) || 'index.html';
    url.pathname = '/api/seo-page'; url.searchParams.set('__seo_page', file);
    const response = await endpoint.fetch(new Request(url));
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const meta = getMetadata(file, url.searchParams, activeProducts);
    assert.ok(html.includes(`href="${SITE + path}"`), path);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, path);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, path);
    assert.equal((html.match(/<title>/g) || []).length, 1, path);
    assert.match(html, /name="robots" content="index, follow/);
    assert.ok(!titles.has(meta.title), meta.title); titles.add(meta.title);
    const schema = JSON.parse(html.match(/id="chi-rho-schema">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema['@graph'].filter((s) => s['@type'] === 'Product').length, meta.product ? 1 : 0);
  }
});

test('schemas usam somente preço, marca, imagens e identificadores reais', () => {
  for (const p of activeProducts) {
    const schema = productSchema(p);
    assert.equal(schema.name, p.nome); assert.equal(schema.description, p.descricao);
    assert.equal(schema.url, SITE + productPath(p));
    assert.equal(Boolean(schema.offers), typeof p.preco === 'number' && p.preco > 0);
    if (schema.offers) { assert.equal(schema.offers.price, p.preco.toFixed(2)); assert.equal(schema.offers.priceCurrency, 'BRL'); }
    assert.ok(!schema.aggregateRating && !schema.review);
    assert.ok(!schema.offers?.availability && !schema.offers?.shippingDetails);
    schema.image.forEach((image) => assert.ok(fs.existsSync(new URL(`../${new URL(image).pathname}`, import.meta.url))));
  }
  assert.equal(validGtin('9786586996371'), true);
  assert.equal(validGtin('9786586996372'), false);
  assert.equal(validGtin('9788531112577 / 7908234018682'), false);
  assert.equal(productSchema(activeProducts.find((p) => p.slug === 'casa-balanca-digital-cozinha-10kg')).sku, 'CASA-BALANCA-10KG');
});

test('produto removido ou inexistente retorna HTTP 404 e noindex', async () => {
  for (const slug of ['brinquedo-kit-caminhoes-basculantes', 'inexistente', '<script>alert(1)</script>']) {
    const url = new URL('/api/seo-page?__seo_page=catalogo-infantil.html', SITE); url.searchParams.set('produto', slug);
    const response = await endpoint.fetch(new Request(url));
    assert.equal(response.status, 404); assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, follow');
    assert.doesNotMatch(await response.text(), /alert\(1\)/);
  }
});

test('buscas e categorias incorretas não são indexadas; duplicadas têm canonical único', () => {
  assert.ok(getMetadata('catalogo-casa.html', new URLSearchParams('q=teste'), activeProducts).noindex);
  assert.ok(getMetadata('catalogo-casa.html', new URLSearchParams('categoria=brinquedos-infantis'), activeProducts).noindex);
  const a = getMetadata('catalogo-biblias.html', new URLSearchParams('categoria=biblias-infantis'), activeProducts);
  const b = getMetadata('catalogo-infantil.html', new URLSearchParams('categoria=biblias-infantis'), activeProducts);
  assert.equal(a.canonical, b.canonical);
});

test('endpoint é somente leitura e rejeita arquivos fora da lista pública', async () => {
  for (const name of ['../../script.js', '__proto__', 'checkout.html', 'admin-pedidos.html']) {
    const url = new URL('/api/seo-page', SITE); url.searchParams.set('__seo_page', name);
    assert.equal((await endpoint.fetch(new Request(url))).status, 404);
  }
  assert.equal((await endpoint.fetch(new Request(SITE + '/api/seo-page?__seo_page=index.html', { method: 'POST' }))).status, 405);
});

test('roteamento intercepta apenas consultas públicas, preservando comércio e parâmetros', () => {
  for (const path of ['/api/frete', '/api/mercadopago-webhook', '/checkout.html', '/admin-pedidos.html', '/pagamento-sucesso.html', '/style.css']) {
    assert.ok(!config.matcher.includes(path));
    assert.equal(middleware(new Request(SITE + path + '?produto=teste')).headers.get('x-middleware-rewrite'), null);
  }
  assert.equal(middleware(new Request(SITE + '/')).headers.get('x-middleware-rewrite'), null);
  const response = middleware(new Request(SITE + '/catalogo-casa.html?produto=casa-balanca-digital-cozinha-10kg&__seo_page=checkout.html'));
  const target = new URL(response.headers.get('x-middleware-rewrite'));
  assert.equal(target.pathname, '/api/seo-page');
  assert.equal(target.searchParams.get('__seo_page'), 'catalogo-casa.html');
  assert.equal(target.searchParams.get('produto'), 'casa-balanca-digital-cozinha-10kg');
});

test('documentos comerciais recebem noindex sem relaxar a CSP', () => {
  const config = JSON.parse(read('vercel.json'));
  assert.ok(config.headers.some((rule) => rule.source.includes('checkout') && rule.headers.some((h) => h.key === 'X-Robots-Tag' && h.value.includes('noindex'))));
  assert.doesNotMatch(read('vercel.json'), /unsafe-inline|unsafe-eval/);
});
