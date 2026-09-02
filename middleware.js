import { next, rewrite } from '@vercel/functions';

// Public documents only. Never intercept commerce APIs, checkout or admin.
export const config = {
  matcher: ['/', '/index.html', '/catalogo-biblias.html', '/catalogo-infantil.html', '/catalogo-casa.html', '/quem-somos.html']
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (!config.matcher.includes(url.pathname) || !['GET', 'HEAD'].includes(request.method)) return next();
  const hasSeoQuery = ['produto', 'categoria', 'q'].some((key) => url.searchParams.has(key));
  if (!hasSeoQuery) return next();
  url.searchParams.set('__seo_page', url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
  url.pathname = '/api/seo-page';
  return rewrite(url);
}
