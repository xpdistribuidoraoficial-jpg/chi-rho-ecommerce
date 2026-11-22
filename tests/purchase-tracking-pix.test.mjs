import test from 'node:test';
import assert from 'node:assert/strict';
import { commerceItems, discountPurchaseItems, createPurchaseTracker } from '../seo/ecommerce.mjs';

const order = { code: 'CHR-PIX-TEST', financialStatus: 'pago' };
const item = { slug: 'comentario-biblico-beacon-antigo-testamento',
  product_name: 'Comentário Bíblico Beacon — Antigo Testamento',
  quantity: 1, line_total: 349.99 };

test('a compra paga por Pix registra o valor líquido sem perder a receita no GA4', () => {
  const calls = [];
  const track = createPurchaseTracker({ emit: (name, payload) => { calls.push({ name, payload }); return true; } });
  const snapshot = { items: [item], total: 280, shippingPrice: 0, paymentDiscount: 69.99 };
  assert.equal(track(order, snapshot), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'purchase');
  assert.equal(calls[0].payload.value, 280);
  assert.equal(calls[0].payload.items[0].price, 280);
  assert.equal(calls[0].payload.items[0].discount, 69.99);
  assert.equal(calls[0].payload.transaction_id, order.code);
  assert.equal(track(order, snapshot), false, 'eventos não devem duplicar');
});

test('a compra de cartão sem desconto preserva o valor e não inventa desconto', () => {
  const calls = [];
  const track = createPurchaseTracker({ emit: (name, payload) => { calls.push(payload); return true; } });
  assert.equal(track({ code: 'CHR-CARD-TEST', financialStatus: 'pago' },
    { items: [item], total: 349.99, shippingPrice: 0, paymentDiscount: 0 }), true);
  assert.equal(calls[0].value, 349.99);
  assert.equal(calls[0].items[0].price, 349.99);
  assert.equal(calls[0].items[0].discount, undefined);
});

test('desconto distribui centavos entre quantidades sem distorcer o faturamento', () => {
  const entries = commerceItems([{ slug: 'biblia-teste', product_name: 'Bíblia Teste', quantity: 3, line_total: 36 }]);
  const discounted = discountPurchaseItems(entries, 1);
  assert.equal(discounted.reduce((sum, part) => sum + Math.round(part.price * 100) * part.quantity, 0), 3500);
  assert.equal(discounted.reduce((sum, part) => sum + part.quantity, 0), 3);
  assert.deepEqual(discounted.map(x => [x.price, x.quantity, x.discount]), [[11.67, 2, 0.33], [11.66, 1, 0.34]]);
});

test('não registra purchase com preço adulterado, desconto inválido ou pedido não aprovado', () => {
  const calls = [];
  const track = createPurchaseTracker({ emit: (...args) => { calls.push(args); return true; } });
  const base = { items: [item], total: 280, shippingPrice: 0, paymentDiscount: 69.99 };
  assert.equal(track({ code: 'CHR-FAIL-1', financialStatus: 'aguardando_pagamento' }, base), false);
  assert.equal(track({ code: 'CHR-FAIL-2', financialStatus: 'pago' }, { ...base, total: 281 }), false);
  assert.equal(track({ code: 'CHR-FAIL-3', financialStatus: 'pago' }, { ...base, paymentDiscount: -2 }), false);
  assert.equal(track({ code: 'CHR-FAIL-4', financialStatus: 'pago' }, { ...base, paymentDiscount: 350 }), false);
  assert.equal(calls.length, 0);
});

test('sem consentimento de Analytics não persiste marcador de compra enviada', () => {
  const state = new Map(), storage = { getItem: key => state.get(key), setItem: (key, value) => state.set(key, value) };
  const track = createPurchaseTracker({ emit: () => false, storage });
  assert.equal(track(order, { items: [item], total: 280, shippingPrice: 0, paymentDiscount: 69.99 }), false);
  assert.equal(state.size, 0);
});
