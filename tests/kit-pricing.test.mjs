import test from 'node:test';
import assert from 'node:assert/strict';
import { priceCart, paymentItems, kitSummary, cents } from '../lib/kit-pricing.mjs';
import { initialKits } from '../data/cpad-kits.mjs';
const inventory = {
  'panorama-da-biblia': {name:'Panorama da Bíblia',price:59.46,stock:5,sku:'PAN'},
  'herois-da-fe': {name:'Heróis da Fé',price:42.49,stock:5,sku:'HER'},
  'biblia-estudo-pentecostal': {name:'Pentecostal',price:280.49,stock:5,sku:'PEN'},
  'comentario-biblico-beacon-antigo-testamento': {name:'Beacon AT',price:416.49,stock:5,sku:'BEA'}
};
test('30% on full list prices rounds once per kit, without compounded reductions', () => {
  assert.deepEqual(kitSummary(initialKits[0],inventory),{original:119.94,price:83.96,discount:35.98,stock:5});
  const quote=priceCart([{slug:initialKits[0].slug,quantity:2}],inventory,initialKits);
  assert.equal(quote.totalProducts,167.92);assert.equal(quote.subtotal,203.9);assert.equal(quote.discount,35.98);
  assert.equal(quote.referenceSubtotal,239.88);assert.equal(quote.referenceDiscount,71.96);
  assert.equal(quote.items.find(item=>item.slug==='herois-da-fe').quantity,2);
  assert.equal(quote.kits[0].components.length,2);
});
test('study kit total and payment preserve every cent', () => {
  const quote=priceCart([{slug:initialKits[1].slug,quantity:1}],inventory,initialKits);
  assert.equal(quote.totalProducts,573.99);assert.equal(quote.subtotal,696.98);assert.equal(quote.discount,122.99);
  assert.equal(quote.referenceSubtotal,819.98);assert.equal(quote.referenceDiscount,245.99);
  assert.equal(paymentItems(quote.items,quote.discount).reduce((sum,item)=>sum+cents(item.unit_price)*item.quantity,0),57399);
});
test('mixed cart shares physical inventory across kits and individual purchases', () => {
  const cart=[{slug:initialKits[0].slug,quantity:2},{slug:'herois-da-fe',quantity:3}];
  const quote=priceCart(cart,inventory,initialKits);
  assert.equal(quote.items.find(item=>item.slug==='herois-da-fe').quantity,5);
  assert.equal(quote.totalProducts,295.39);
  assert.throws(()=>priceCart([...cart,{slug:'herois-da-fe',quantity:1}],inventory,initialKits),/OUT_OF_STOCK/);
});
test('client prices, discount and forged composition cannot change server pricing', () => {
  const quote=priceCart([{slug:initialKits[0].slug,quantity:1,price:0.01,discount:99,components:[]}],inventory,initialKits);
  assert.equal(quote.totalProducts,83.96);
  assert.throws(()=>priceCart([{slug:'kit-falso',quantity:1}],inventory,initialKits),/INVALID_ITEMS/);
  assert.throws(()=>priceCart([{slug:initialKits[2].slug,quantity:1}],inventory,initialKits),/KIT_INACTIVE/);
});
test('invalid quantities, unavailable components and altered discount are rejected', () => {
  for(const quantity of [0,-1,1.5,100,'1']) assert.throws(()=>priceCart([{slug:initialKits[0].slug,quantity}],inventory,initialKits),/INVALID_ITEMS/);
  assert.throws(()=>kitSummary({...initialKits[0],discount_percent:31},inventory),/INVALID_KIT/);
  assert.throws(()=>kitSummary({...initialKits[0],components:[{slug:'missing',quantity:1},{slug:'herois-da-fe',quantity:1}]},inventory),/COMPONENT/);
  assert.throws(()=>paymentItems([{sku:'a',name:'a',unit_price:1,quantity:1}],1),/INVALID_DISCOUNT/);
});
test('unmapped full prices and kits above actual avulso price fail closed', () => {
  const badKit={...initialKits[0],components:[{slug:'unknown-full-price',quantity:1},{slug:'herois-da-fe',quantity:1}]};
  const changedInventory={...inventory,'unknown-full-price':{name:'Unknown',price:19.99,stock:5,sku:'UNK'}};
  assert.throws(()=>kitSummary(badKit,changedInventory),/KIT_LIST_PRICE_UNAVAILABLE/);
  const tooLow={...inventory,'herois-da-fe':{...inventory['herois-da-fe'],price:0.01}};
  assert.throws(()=>kitSummary(initialKits[0],tooLow),/KIT_PRICE_ABOVE_AVULSO/);
});
test('provider allocation reconciles mixed quantities and fractional discounts', () => {
  for(let index=1;index<150;index++) {
    const items=[{sku:'A',name:'A',unit_price:index/100+1,quantity:3},{sku:'B',name:'B',unit_price:index/100+2.03,quantity:2}];
    const original=items.reduce((sum,item)=>sum+cents(item.unit_price)*item.quantity,0);
    const discount=Math.round(original*.3)/100;
    const result=paymentItems(items,discount);
    assert.equal(result.reduce((sum,item)=>sum+cents(item.unit_price)*item.quantity,0),original-cents(discount));
  }
});
