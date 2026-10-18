import test from 'node:test';
import assert from 'node:assert/strict';
import { commercePayload, createPurchaseTracker } from '../seo/ecommerce.mjs';
import { trackAnalyticsEvent } from '../seo/analytics-consent.mjs';
import { renderProductFeed } from '../lib/product-feed.mjs';
import feed from '../api/product-feed.js';
import fs from 'node:fs';
import vm from 'node:vm';

const snapshot = { total: 48.56, shippingPrice: 11.58, items: [{ slug: 'kit-casa-fone-carregador', product_name: 'Kit Fone + Carregador', quantity: 1, line_total: 36.98 }] };
const paid = { code: 'CHR-20261016-ABC123', financialStatus: 'pago' };
const memory = () => { const values = new Map(); return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }; };

test('e-commerce preserves discounted kit value and omits personal/contact fields', () => {
  const payload = commercePayload([{ quantity: 2, product: { slug: 'kit-casa', nome: 'Kit', preco: 36.98, email: 'private@example.com', taxId: 'private' } }], { shipping_tier: 'Retirada grátis', email: 'private@example.com' });
  assert.equal(payload.value, 73.96);
  assert.equal(payload.items[0].price, 36.98);
  assert.equal(payload.currency, 'BRL');
  assert.doesNotMatch(JSON.stringify(payload), /private|taxId|email/);
});

test('only server-confirmed paid status emits purchase, once across reloads', () => {
  const calls = [], storage = memory();
  const emit = (...args) => { calls.push(args); return true; };
  const track = createPurchaseTracker({ emit, storage });
  assert.equal(track({ ...paid, financialStatus: 'aguardando_pagamento' }, snapshot), false);
  assert.equal(track({ ...paid, financialStatus: 'cancelado' }, snapshot), false);
  assert.equal(track(paid, snapshot), true);
  assert.equal(track(paid, snapshot), false);
  assert.equal(createPurchaseTracker({ emit, storage })(paid, snapshot), false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].value, 36.98);
  assert.equal(calls[0][1].shipping, 11.58);
});

test('refused consent does not mark purchase as sent; inconsistent totals never emit', () => {
  let allowed = false, count = 0;
  const track = createPurchaseTracker({ emit: () => { count++; return allowed; }, storage: memory() });
  assert.equal(track(paid, { ...snapshot, total: 99 }), false);
  assert.equal(count, 0);
  assert.equal(track(paid, snapshot), false);
  allowed = true;
  assert.equal(track(paid, snapshot), true);
  assert.equal(count, 2);
});

test('Analytics never loads or emits an ecommerce event without analytics consent', t => {
  const originals = { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage };
  t.after(() => { for (const [key, value] of Object.entries(originals)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } });
  let accepted = false;
  const calls = [];
  globalThis.window = { gtag: (...args) => calls.push(args) };
  globalThis.document = { querySelector: () => ({}) };
  globalThis.localStorage = { getItem: () => JSON.stringify({ version: 1, analytics: accepted }) };
  assert.equal(trackAnalyticsEvent('add_to_cart', { value: 36.98 }), false);
  assert.equal(calls.length, 0);
  accepted = true;
  assert.equal(trackAnalyticsEvent('add_to_cart', { value: 36.98 }), true);
  assert.equal(calls[0][0], 'event');
  assert.equal(calls[0][1], 'add_to_cart');
});

const product = { slug: 'charger', nome: 'Carregador & cabo', descricao: 'USB-C <Lightning>', casa: true, imagem: 'assets/products/charger.png', ean: '7897732350052', preco: 999 };
const inventory = [{ slug: 'charger', unitPrice: 16.99, available: 20 }];

test('product feed uses live prices, valid GTIN, exact product URL and safe XML', () => {
  const xml = renderProductFeed([product], inventory);
  assert.match(xml, /<g:price>16\.99 BRL<\/g:price>/);
  assert.doesNotMatch(xml, /999/);
  assert.match(xml, /<g:availability>in_stock<\/g:availability>/);
  assert.match(xml, /catalogo-casa.html\?produto=charger/);
  assert.match(xml, /<g:gtin>7897732350052<\/g:gtin>/);
  assert.match(xml, /Carregador &amp; cabo/);
  assert.match(xml, /USB-C &lt;Lightning&gt;/);
  assert.match(renderProductFeed([product], [{ ...inventory[0], available: 0 }]), /out_of_stock/);
});

test('feed omits drafts, missing operational prices and bundles with incomplete media', () => {
  assert.doesNotMatch(renderProductFeed([{ ...product, kitComponents: [] }], inventory), /<item>/);
  assert.doesNotMatch(renderProductFeed([{ ...product, descricao: 'Imagem definitiva em confirmação.' }], inventory), /<item>/);
  assert.doesNotMatch(renderProductFeed([product], [{ ...inventory[0], unitPrice: null }]), /<item>/);
  assert.doesNotMatch(renderProductFeed([{ ...product, ean: '7897732350053' }], inventory), /<g:gtin>/);
});

test('feed provides confirmed handling time and valid package data without inventing a freight price', () => {
  const parcel = { ...inventory[0], weight: 0.15, length: 12, width: 10, height: 6 };
  const xml = renderProductFeed([product], [parcel]);
  assert.match(xml, /<g:max_handling_time>5<\/g:max_handling_time>/);
  assert.match(xml, /<g:shipping_weight>0\.15 kg<\/g:shipping_weight>/);
  assert.match(xml, /<g:shipping_length>12 cm<\/g:shipping_length>/);
  assert.match(xml, /<g:shipping_width>10 cm<\/g:shipping_width>/);
  assert.match(xml, /<g:shipping_height>6 cm<\/g:shipping_height>/);
  assert.doesNotMatch(xml, /<g:(?:shipping>|min_handling_time>|max_transit_time>)/);
  for (const invalid of [{ weight: null, height: null }, { weight: -1, height: 0 }, { weight: Infinity, length: 401 }, { weight: 2001, width: 'invalid' }]) {
    const result = renderProductFeed([product], [{ ...parcel, ...invalid }]);
    assert.match(result, /<item>/);
    assert.doesNotMatch(result, /<g:shipping_(?:weight|length|width|height)>/);
  }
});

test('feed fails closed during inventory outages and accepts only read operations', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => Response.json({ error: 'offline' }, { status: 503 });
  const response = await feed.fetch(new Request('https://www.chirho.com.br/api/product-feed'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.doesNotMatch(await response.text(), /<item>/);
  assert.equal((await feed.fetch(new Request('https://www.chirho.com.br/api/product-feed', { method: 'POST' }))).status, 405);
});

test('payment continuation opens the provider once, and a failed attempt remains retryable', async () => {
  const source = fs.readFileSync(new URL('../checkout.js', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('let paymentOpening = false;'), source.indexOf('paymentButton?.addEventListener("click", openPayment);'));
  let fail = true;
  const requests = [], redirects = [];
  const context = { createdOrder: { code: paid.code, publicToken: 'test-token' }, paymentAvailable: true,
    paymentButton: {}, paymentStatus: {}, cart: [], PAYMENT_ENDPOINT: '/api/mercadopago/cpad-preference',
    URL, AbortSignal, trackCommerce: () => {}, window: { location: { assign: url => redirects.push(url) } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      await Promise.resolve();
      return fail ? Response.json({ error: 'Temporary failure' }, { status: 503 }) : Response.json({ paymentUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=example' });
    } };
  vm.runInNewContext(`${code}\nglobalThis.continuePayment=openPayment;`, context);
  await Promise.all([context.continuePayment(), context.continuePayment()]);
  assert.equal(requests.length, 1);
  assert.equal(redirects.length, 0);
  assert.equal(context.paymentButton.disabled, false);
  fail = false;
  await context.continuePayment();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, '/api/mercadopago/cpad-preference');
  assert.equal(JSON.parse(requests[1].options.body).code, paid.code);
  assert.equal(redirects.length, 1);
  assert.equal(new URL(redirects[0]).hostname, 'www.mercadopago.com.br');
});
