import fs from 'node:fs';
import { activeProducts } from '../seo/catalog.mjs';
import { SITE, categories, escapeHtml, getMetadata, pages } from '../seo/metadata.mjs';
import { renderPage, sitemapUrls } from '../seo/render.mjs';

const root = new URL('../', import.meta.url);
for (const file of Object.keys(pages)) {
  const path = new URL(file, root);
  const html = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(path, renderPage(html, getMetadata(file)));
}
const urls = sitemapUrls(activeProducts, categories);
fs.writeFileSync(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${escapeHtml(SITE + path)}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`SEO atualizado: ${Object.keys(pages).length} páginas, ${activeProducts.length} produtos, ${urls.length} URLs no sitemap.`);
