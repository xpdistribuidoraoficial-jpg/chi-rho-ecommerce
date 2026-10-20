import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { kitSummary } from '../lib/kit-pricing.mjs';
import { casaKits } from '../data/casa-kits.mjs';

const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const definitions = source.slice(0, source.indexOf('const toggle'));
const renderers = source.slice(source.indexOf('const renderProducts ='), source.indexOf('const catalogGrid ='));
const hydration = source.slice(source.indexOf('const refreshAvailableInventory ='), source.indexOf('document.addEventListener("click",', source.indexOf('const refreshAvailableInventory =')));
const kitSource = fs.readFileSync(new URL('../cpad-catalog.mjs', import.meta.url), 'utf8');
const kitInventory = kitSource.slice(kitSource.indexOf('const inventoryMap ='), kitSource.indexOf('function availability'));
const kitUpdater = kitSource.slice(kitSource.indexOf('function updateKits()'), kitSource.indexOf('function refreshViews()'));

function storefront(inventory = [], fails = false) {
  const containers = new Map();
  const context = vm.createContext({
    document: { querySelector: selector => containers.get(selector) || null },
    window: { dispatchEvent() {} }, Event, AbortSignal,
    fetch: async () => { if (fails) throw new Error('offline'); return { ok: true, json: async () => ({ inventory }) }; }
  });
  vm.runInContext(`${definitions}
    let inventoryHydrated = false;
    const INVENTORY_ENDPOINT = '/inventory', INVENTORY_PUBLIC_KEY = 'public';
    const catalogGrid = null, requestedCategory = '', requestedQuery = '';
    const renderTestCart = () => {};
    const createProductCard = product => '<article>' + product.slug + '</article>';
    ${renderers}
    ${hydration}
    globalThis.shop = { catalogProducts, isProductVisible, renderProducts, renderHomeProducts,
      refreshAvailableInventory, getProductCartAvailability };
  `, context);
  const addContainer = selector => { const container = { innerHTML: '' }; containers.set(selector, container); return container; };
  return { ...context.shop, addContainer, updateKits: () => {
    context.kitSummary = kitSummary;
    context.casaKits = casaKits;
    if (!context.kitsInitialized) {
      vm.runInContext(`let registryLoaded = true, registry = [], checkoutReady = true;
        const initialKits = [];
        ${kitInventory}
        ${kitUpdater}
        globalThis.refreshKits = updateKits;`, context);
      context.kitsInitialized = true;
    }
    context.refreshKits();
  }, reserveAllInCart: () => {
    context.window.ChiRhoCpad = { availability: () => ({ configured:true, stock:0, available:false }) };
  } };
}

test('cards wait for confirmed stock, disappear at zero and return after restocking', () => {
  const shop = storefront(), grid = shop.addContainer('#catalog');
  const product = { slug: 'replenishable', preco: 25, estoque: 20 };
  const draw = () => shop.renderProducts('#catalog', [product]);
  draw(); assert.equal(grid.innerHTML, ''); // a hardcoded balance is not confirmation
  product.inventoryConfirmed = true;
  draw(); assert.match(grid.innerHTML, /replenishable/);
  product.estoque = 0;
  draw(); assert.equal(grid.innerHTML, '');
  product.estoque = 3;
  draw(); assert.match(grid.innerHTML, /replenishable/);
});

test('pending prices, invalid balances and disabled Kit Culto stay out of the storefront', () => {
  const shop = storefront();
  const product = { slug: 'sample', preco: 25, estoque: 2, inventoryConfirmed: true };
  for (const changes of [{ preco: null }, { preco: NaN }, { preco: 0 }, { estoque: null },
    { estoque: -1 }, { estoque: 1.5 }, { inventoryConfirmed: false }, { cpadKitDisabled: true }]) {
    assert.equal(shop.isProductVisible({ ...product, ...changes }), false);
  }
  assert.equal(shop.isProductVisible(product), true);
});

test('putting the last unit in the cart does not hide a product with physical stock', () => {
  const shop = storefront();
  const product = { slug: 'last-unit', preco: 25, estoque: 1, inventoryConfirmed: true, testeCarrinho:true };
  assert.equal(shop.isProductVisible(product), true);
  assert.equal(shop.getProductCartAvailability(product).available, true);
  // Visibility does not depend on the cart-specific remaining availability.
  shop.reserveAllInCart();
  assert.equal(shop.getProductCartAvailability(product).available, false);
  assert.equal(shop.isProductVisible(product), true);
});

test('inventory hydration removes a zero balance from home sections and restores a replenished item', async () => {
  const slug = 'biblia-media-letra-gigante-harpa';
  const balance = { slug, unitPrice: 135.99, available: 0 };
  const shop = storefront([balance]), home = shop.addContainer('#featured-products');
  await shop.refreshAvailableInventory();
  assert.equal(home.innerHTML, '');
  const record = shop.catalogProducts.find(product => product.slug === slug);
  assert.equal(record.estoque, 0);
  balance.available = 2;
  await shop.refreshAvailableInventory();
  assert.match(home.innerHTML, /biblia-media-letra-gigante-harpa/);
  assert.equal(record.estoque, 2);
  assert.equal(shop.catalogProducts.filter(product => product.slug === slug).length, 1);
});

test('inventory outages never advertise the hardcoded charger balance', async () => {
  const shop = storefront([], true), home = shop.addContainer('#home-casa-products');
  await shop.refreshAvailableInventory();
  shop.renderHomeProducts();
  assert.equal(home.innerHTML, '');
});

test('kits require confirmation and positive stock for every component', () => {
  const shop = storefront();
  const kit = casaKits[0];
  const components = kit.components.map(component => shop.catalogProducts.find(product => product.slug === component.slug));
  for (const product of components) Object.assign(product, { preco: 25, estoque: 2, testeCarrinho: true, inventoryConfirmed:true });
  components[0].inventoryConfirmed = false;
  shop.updateKits();
  const bundle = shop.catalogProducts.find(product => product.slug === kit.slug);
  assert.equal(shop.isProductVisible(bundle), false);
  components[0].inventoryConfirmed = true;
  shop.updateKits();
  assert.equal(shop.isProductVisible(bundle), true);
  components[0].estoque = 0;
  shop.updateKits();
  assert.equal(shop.isProductVisible(bundle), false);
});

test('a product removed from a successful inventory response is no longer advertised', async () => {
  const inventory = [{ slug:'biblia-media-letra-gigante-harpa', unitPrice:135.99, available:2 }];
  const shop = storefront(inventory), grid = shop.addContainer('#featured-products');
  await shop.refreshAvailableInventory();
  assert.match(grid.innerHTML, /biblia-media-letra-gigante-harpa/);
  inventory.length = 0;
  await shop.refreshAvailableInventory();
  assert.equal(grid.innerHTML, '');
});
