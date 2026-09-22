import fs from 'node:fs';
import vm from 'node:vm';

const SEO_EXCLUDED_SLUGS = new Set([
  'biblia-arc-harpa',
  'biblia-king-james-estudo-holman',
  'ate-que-nada-mais-importe',
  'cartas-de-um-diabo-a-seu-aprendiz',
  'cristianismo-puro-e-simples',
  'uma-vida-com-propositos',
  'manso-e-humilde',
  'o-deus-que-destroi-sonhos',
  'oi-deus-sou-eu-de-novo',
  'uma-mulher-segundo-o-coracao-de-deus',
  'ego-transformado',
  'cute-jesus-and-disciples'
]);

const COLLAR_SLUG = 'colarinho-clerical-palheta-pastores-pacote-7';
const COLLAR_IMAGE = 'assets/products/colarinho-clerical-palheta-pastores-pacote-7.webp';

// Read-only SEO projection aligned with the operational catalog.
const source = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const overrides = fs.readFileSync(new URL('../catalog-pricing-overrides.js', import.meta.url), 'utf8');
const end = source.indexOf('const toggle');
if (end < 0) throw new Error('Catalog boundary not found');
const context = {};
vm.runInNewContext(`${source.slice(0, end)};${overrides};globalThis.catalog=catalogProducts.filter(isProductActive);`, context, { timeout: 1000 });

const products = JSON.parse(JSON.stringify(context.catalog));

const collar = products.find((product) => product.slug === 'brinquedo-kit-caminhoes-basculantes');
if (collar) {
  Object.assign(collar, {
    id: COLLAR_SLUG,
    slug: COLLAR_SLUG,
    nome: 'Colarinho Clerical Palheta para Pastores (24x3 cm) — Pacote com 7',
    categoria: 'Acessórios Ministeriais',
    categoriaSlug: 'acessorios-ministeriais',
    imagem: COLLAR_IMAGE,
    imagens: [COLLAR_IMAGE],
    descricao: 'Pacote com 7 palhetas de colarinho clerical no tamanho 24 × 3 cm, indicado para uso com camisa clerical por pastores e ministros.',
    perfil: 'Uso ministerial',
    sku: 'MIN-COLARINHO-24X3-PCT7',
    preco: 28,
    precoOriginal: null,
    estoque: 5,
    testeCarrinho: true,
    destaque: false,
    maisVendido: false,
    destaqueInfantil: false,
    infantil: false,
    brinquedo: false,
    casa: false
  });
}

const defense = products.find((product) => product.slug === 'biblia-estudo-defesa-da-fe');
if (defense) {
  defense.nome = 'Bíblia de Estudo em Defesa da Fé Grande Capa Dura';
  defense.sku = 'CHR-9677553EAF86';
  defense.preco = 127.49;
  defense.estoque = 5;
  defense.testeCarrinho = true;
}

export const activeProducts = products
  .filter((product) => !SEO_EXCLUDED_SLUGS.has(product.slug));
