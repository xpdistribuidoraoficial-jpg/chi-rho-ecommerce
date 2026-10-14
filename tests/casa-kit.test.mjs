import './inventory-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { casaKits } from '../data/casa-kits.mjs';
import { initialKits } from '../data/cpad-kits.mjs';
import { kitSummary, priceCart, paymentItems, cents } from '../lib/kit-pricing.mjs';
import { loadShippingCatalog } from '../data/shipping-products.mjs';
import { activeProducts } from '../seo/catalog.mjs';
import { productPath } from '../seo/metadata.mjs';

test('Casa kit applies exactly R$ 2 to current physical prices and reconciles payment', async () => {
  const {baseProducts,kits,products}=await loadShippingCatalog();
  const kit=casaKits[0];
  assert.deepEqual(kitSummary(kit,baseProducts),{original:38.98,price:36.98,discount:2,stock:10});
  assert.equal(products[kit.slug].category,'Kits Casa');
  const quote=priceCart([{slug:kit.slug,quantity:1,price:0.01,discount:99,components:[]}],baseProducts,kits);
  assert.equal(quote.totalProducts,36.98);
  assert.equal(quote.discount,2);
  assert.equal(quote.referenceDiscount,2);
  assert.equal(quote.items.length,2);
  assert.ok(quote.items.every(item=>item.quantity===1));
  assert.equal(quote.kits[0].discount_percent,0);
  assert.equal(quote.kits[0].pricing_mode,'sum_current_prices');
  assert.equal(quote.kits[0].discount_amount,2);
  assert.equal(paymentItems(quote.items,quote.discount).reduce((sum,item)=>sum+cents(item.unit_price)*item.quantity,0),3698);
});

test('Casa kit and avulso quantities share physical stock and exhaust together', async () => {
  const {baseProducts,kits}=await loadShippingCatalog();
  const kit=casaKits[0],charger=kit.components[1].slug;
  const cart=[{slug:kit.slug,quantity:9},{slug:charger,quantity:1}];
  const quote=priceCart(cart,baseProducts,kits);
  assert.equal(quote.items.find(item=>item.slug===charger).quantity,10);
  assert.throws(()=>priceCart([...cart,{slug:kit.slug,quantity:1}],baseProducts,kits),/OUT_OF_STOCK/);
  assert.throws(()=>priceCart([{slug:kit.slug,quantity:11}],baseProducts,kits),/OUT_OF_STOCK/);
  assert.equal(kitSummary(kit,{...baseProducts,[charger]:{...baseProducts[charger],stock:0}}).stock,0);
});

test('Casa pricing tracks current prices and cannot change CPAD discount rules', async () => {
  const {baseProducts,kits}=await loadShippingCatalog();
  const kit=casaKits[0],fone=kit.components[0].slug;
  assert.equal(kitSummary(kit,{...baseProducts,[fone]:{...baseProducts[fone],price:25}}).price,37.99);
  assert.throws(()=>kitSummary({...kit,discount_percent:30},baseProducts),/INVALID_KIT/);
  assert.throws(()=>kitSummary({...kit,discount_amount:-2},baseProducts),/INVALID_KIT/);
  assert.throws(()=>kitSummary({...kit,discount_amount:38.98},baseProducts),/INVALID_DISCOUNT/);
  assert.throws(()=>kitSummary({...initialKits[0],pricing_mode:'sum_current_prices',discount_percent:0},baseProducts),/INVALID_KIT/);
  const mixed=priceCart([{slug:kit.slug,quantity:1},{slug:initialKits[0].slug,quantity:1}],baseProducts,kits);
  assert.equal(mixed.totalProducts,120.94);
  assert.equal(mixed.referenceDiscount,37.98);
});

test('Casa kit has its own Casa product URL and the correct SEO price', () => {
  const product=activeProducts.find(p=>p.slug===casaKits[0].slug);
  assert.equal(product.preco,36.98);
  assert.equal(product.editora,undefined);
  assert.equal(productPath(product),'/catalogo-casa.html?produto=kit-casa-fone-carregador');
});

test('Casa kit checkout uses the signed server order and payment endpoints', async () => {
  const {kits}=await loadShippingCatalog();
  const source=fs.readFileSync(new URL('../checkout.js',import.meta.url),'utf8');
  const setup=source.slice(source.indexOf('const CART_STORAGE_KEY'),source.indexOf('let createdOrder'));
  for(const slug of [casaKits[0].slug,initialKits[0].slug]){
    const context={shippingKits:kits,localStorage:{getItem:()=>JSON.stringify([{slug,quantity:1}])}};
    vm.runInNewContext(setup+';globalThis.endpoints=[ORDER_ENDPOINT,PAYMENT_ENDPOINT];',context);
    assert.deepEqual(Array.from(context.endpoints),['/api/create-cpad-order','/api/mercadopago/cpad-preference']);
  }
});
