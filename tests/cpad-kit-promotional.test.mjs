import './inventory-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialKits} from '../data/cpad-kits.mjs';
import {priceCart,paymentItems,cents} from '../lib/kit-pricing.mjs';
import {applyPaymentOffer,hasPaymentOffer} from '../data/payment-offers.mjs';
import {loadShippingCatalog} from '../data/shipping-products.mjs';
import {activeProducts} from '../seo/catalog.mjs';

test('kits CPAD liberados usam soma promocional e Pix único inclusive em carrinho misto',async()=>{
 const {baseProducts,kits,products}=await loadShippingCatalog();
 const leitura=initialKits[0].slug,estudo=initialKits[1].slug,at='comentario-biblico-beacon-antigo-testamento';
 assert.equal(products[leitura].price,74);assert.equal(products[estudo].price,549.89);
 assert.equal(products[estudo].category,'Kits CPAD');
 assert.equal(hasPaymentOffer([{slug:estudo,quantity:1}],kits),true);
 assert.equal(hasPaymentOffer([{slug:leitura,quantity:1}],kits),false);
 assert.equal(products['kit-cpad-culto'],undefined);
 const cart=[{slug:estudo,quantity:2,price:0.01},{slug:at,quantity:1},{slug:leitura,quantity:1}];
 const base=priceCart(cart,baseProducts,kits);
 const pix=applyPaymentOffer(base,'pix'),card=applyPaymentOffer(base,'card');
 assert.equal(pix.totalProducts,1313.80);assert.equal(card.totalProducts,1523.77);
 assert.equal(pix.pixDiscount,209.97);assert.equal(base.discount,0);
 for(const p of [pix,card]) assert.equal(paymentItems(p.items,p.discount).reduce((sum,item)=>sum+cents(item.unit_price)*item.quantity,0),cents(p.totalProducts));
 assert.equal(pix.items.find(item=>item.slug===at).quantity,3);
 assert.throws(()=>priceCart([{slug:estudo,quantity:5},{slug:at,quantity:1}],baseProducts,kits),/OUT_OF_STOCK/);
 assert.throws(()=>priceCart([{slug:'kit-cpad-culto',quantity:1}],baseProducts,kits),/KIT_INACTIVE/);
 assert.equal(activeProducts.find(p=>p.slug===estudo).casa,undefined);
});
