import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { activeProducts } from '../seo/catalog.mjs';
import { cpadProductSlugs } from '../data/cpad-products.mjs';
import { renderProductFeed } from '../lib/product-feed.mjs';

const get = slug => activeProducts.find(product => product.slug === slug);
const bibleSlugs = ['biblia-estudo-cronologica', 'biblia-estudo-cronologica-tricolor'];

test('cronológicas têm oferta autorizada, identidades distintas e estoque aguardando confirmação', () => {
  for (const slug of bibleSlugs) {
    const product = get(slug);
    assert.equal(product.precoOriginal, 499.99);
    assert.equal(product.preco, 352);
    assert.equal(product.estoque, null);
    assert.equal(product.ofertaHome, true);
    assert.equal(product.destaqueOfertaCpad, true);
    assert.ok(cpadProductSlugs.includes(slug));
  }
  assert.notEqual(get(bibleSlugs[0]).gtin, get(bibleSlugs[1]).gtin);
  assert.notEqual(get(bibleSlugs[0]).imagem, get(bibleSlugs[1]).imagem);
});

test('Beacon NT é uma coleção independente de 5 volumes com preço igual ao AT', () => {
  const nt = get('comentario-biblico-beacon-novo-testamento');
  assert.equal(nt.preco, get('comentario-biblico-beacon-antigo-testamento').preco);
  assert.match(nt.descricao, /volumes 6 a 10/);
  assert.equal(nt.gtin, '7898203060920');
  assert.equal(nt.livroCristao, true);
  assert.ok(cpadProductSlugs.includes(nt.slug));
  assert.notEqual(nt.imagem, get('comentario-biblico-beacon-antigo-testamento').imagem);
});

test('novas edições possuem imagens locais e URLs no sitemap', () => {
  const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  for (const slug of [bibleSlugs[1], 'comentario-biblico-beacon-novo-testamento']) {
    const product = get(slug);
    assert.ok(sitemap.includes(`?produto=${slug}</loc>`));
    assert.equal(product.imagens.length, 3);
    for (const image of product.imagens) assert.ok(fs.statSync(new URL(`../${image}`, import.meta.url)).size > 10000);
  }
});

test('feed usa preço vivo e não confunde GTIN entre as capas nem anuncia estoque zerado', () => {
  const products = bibleSlugs.map(get);
  const inventory = products.map(product => ({slug:product.slug, unitPrice:352, available:5}));
  const feed = renderProductFeed(products, inventory);
  assert.equal((feed.match(/<item>/g) || []).length, 2);
  assert.equal((feed.match(/352\.00 BRL/g) || []).length, 2);
  for (const product of products) assert.ok(feed.includes(`<g:gtin>${product.gtin}</g:gtin>`));
  inventory[1].available = 0;
  assert.ok(!renderProductFeed(products, inventory).includes(`<g:id>${bibleSlugs[1]}</g:id>`));
});
