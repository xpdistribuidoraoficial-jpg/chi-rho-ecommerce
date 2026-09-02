import fs from 'node:fs';
import { activeProducts } from '../seo/catalog.mjs';
import { getMetadata, pages } from '../seo/metadata.mjs';
import { renderPage } from '../seo/render.mjs';

// Fixed allowlist: requests cannot choose arbitrary files. No credentials or DB.
const templates = Object.fromEntries(Object.keys(pages).map((file) => [file, fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')]));

export default {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Método não permitido', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const url = new URL(request.url);
    const file = url.searchParams.get('__seo_page');
    if (!Object.hasOwn(templates, file)) return new Response('Página não encontrada', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
    const meta = getMetadata(file, url.searchParams, activeProducts);
    const preview = process.env.VERCEL_ENV === 'preview';
    if (preview) meta.noindex = true;
    return new Response(request.method === 'HEAD' ? null : renderPage(templates[file], meta), {
      status: meta.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': meta.noindex ? 'no-store' : 'public, max-age=0, s-maxage=60',
        ...(meta.noindex ? { 'X-Robots-Tag': 'noindex, follow' } : {})
      }
    });
  }
};
