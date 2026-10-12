// Deterministic public inventory fixture: tests must not depend on network availability.
import fs from 'node:fs';
import vm from 'node:vm';
import { initialKits } from '../data/cpad-kits.mjs';
const source=fs.readFileSync(new URL('../script.js',import.meta.url),'utf8');
const context={};
vm.runInNewContext(source.slice(0,source.indexOf('const toggle'))+';globalThis.products=catalogProducts;',context);
const componentSlugs=new Set(initialKits.filter(kit=>kit.active).flatMap(kit=>kit.components.map(item=>item.slug)));
export const inventory=context.products.filter(product=>product.testeCarrinho||componentSlugs.has(product.slug)).map(product=>({
  slug:product.slug,name:product.nome,unitPrice:product.preco,available:product.estoque||5,
  sku:product.slug==='casa-balanca-digital-cozinha-10kg'?'CASA-BALANCA-10KG':product.sku||product.slug,
  category:product.categoria,imageUrl:product.imagem,weight:0.5,length:25,width:18,height:5
}));
const networkFetch=globalThis.fetch;
globalThis.fetch=(url,options)=>String(url).includes('/functions/v1/inventory-status')
  ? Promise.resolve(Response.json({inventory}))
  : String(url).includes('/rest/v1/cpad_kits?')?Promise.resolve(Response.json(initialKits)):networkFetch(url,options);
