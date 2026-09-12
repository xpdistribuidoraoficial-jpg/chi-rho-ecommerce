import fs from 'node:fs';
import vm from 'node:vm';

const RETIRED_PRODUCT_SLUGS = new Set([
  'biblia-arc-harpa',
  'biblia-king-james-estudo-holman',
  'cute-jesus-and-disciples'
]);

// Reuse the exact existing catalog and its runtime commercial overrides. No second price list.
const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const overrides = fs.readFileSync(new URL('../catalog-pricing-overrides.js', import.meta.url), 'utf8');
const end = source.indexOf('const toggle');
if (end < 0) throw new Error('Catalog boundary not found');
const context = {};
vm.runInNewContext(`${source.slice(0, end)};${overrides};globalThis.activeProducts=catalogProducts.filter(isProductActive);`, context, { timeout: 1000 });
export const activeProducts = JSON.parse(JSON.stringify(context.activeProducts))
  .filter((product) => !RETIRED_PRODUCT_SLUGS.has(product.slug));
