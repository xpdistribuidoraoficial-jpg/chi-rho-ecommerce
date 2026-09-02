import fs from 'node:fs';
import vm from 'node:vm';

// Reuse the exact existing catalog and its updates/exclusions. No second price list.
const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const end = source.indexOf('const toggle');
if (end < 0) throw new Error('Catalog boundary not found');
const context = {};
vm.runInNewContext(`${source.slice(0, end)};globalThis.activeProducts=catalogProducts.filter(isProductActive);`, context, { timeout: 1000 });
export const activeProducts = JSON.parse(JSON.stringify(context.activeProducts));
