import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const definitions = source.slice(0, source.indexOf('const toggle'));
const filters = source.slice(source.indexOf('const faithCategorySlugs ='), source.indexOf('const catalogParams ='));

function storefront() {
  const grid = { innerHTML: '' }, count = { textContent: '' };
  const context = { window: {}, grid, count };
  vm.runInNewContext(`${definitions}
    const catalogGrid = grid, catalogTitle = null, resultCount = count, filterButtons = [];
    const createProductCard = product => product.slug;
    ${filters}
    catalogProducts.forEach(product => {
      product.inventoryConfirmed = true;
      product.estoque = 5;
    });
    globalThis.shop = { setCatalogFilter, catalogProducts };
  `, context);
  return { grid, count, ...context.shop };
}

test('cronologica com e sem acento encontra as duas capas do catálogo real', () => {
  const shop = storefront();
  for (const term of ['cronologica', 'cronológica', 'CRONOLOGICA', '  cronolo\u0301gica  ', 'biblia   de estudo cronologica', 'cronologica biblia', 'biblias cronologicas CPAD', 'cronolgica', 'cronolgoica']) {
    shop.setCatalogFilter('todas', term);
    assert.equal(shop.grid.innerHTML, 'biblia-estudo-cronologicabiblia-estudo-cronologica-tricolor', term);
    assert.equal(shop.count.textContent, '2 produtos selecionados');
  }
});

test('normalização preserva categoria, estoque confirmado e consulta sem resultado', () => {
  const shop = storefront();
  shop.setCatalogFilter('livros-cristaos', 'cronologica');
  assert.match(shop.grid.innerHTML, /Nenhum item/);
  shop.catalogProducts.find(product => product.slug === 'biblia-estudo-cronologica-tricolor').estoque = 0;
  shop.setCatalogFilter('todas', 'cronologica');
  assert.equal(shop.grid.innerHTML, 'biblia-estudo-cronologica');
  shop.setCatalogFilter('todas', 'produto-inexistente-xyz');
  assert.match(shop.grid.innerHTML, /Nenhum item/);
});

test('comentario também encontra o Beacon sem exigir acento', () => {
  const shop = storefront();
  shop.setCatalogFilter('livros-cristaos', 'comentario biblico beacon');
  const unaccented = shop.grid.innerHTML;
  shop.setCatalogFilter('livros-cristaos', 'comentário bíblico beacon');
  assert.equal(shop.grid.innerHTML, unaccented);
  assert.ok(unaccented.includes('comentario-biblico-beacon-novo-testamento'));
});


test('cliente pode buscar por cor, código e palavras em outra ordem', () => {
  const shop = storefront();
  for (const term of ['CPAD tricolor', 'biblia cronologica verde', '7898203062375', 'cronologica capa tricolor']) {
    shop.setCatalogFilter('todas', term);
    assert.equal(shop.grid.innerHTML, 'biblia-estudo-cronologica-tricolor', term);
  }
  shop.setCatalogFilter('todas', '7898203062376');
  assert.match(shop.grid.innerHTML, /Nenhum item/);
});
