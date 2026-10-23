import test from 'node:test';
import assert from 'node:assert/strict';
import { renderProductFeed } from '../lib/product-feed.mjs';

const products = [
  { slug:'biblia-disponivel', nome:'Bíblia disponível', descricao:'Livro impresso', imagem:'assets/products/biblia-disponivel.jpg' },
  { slug:'biblia-esgotada', nome:'Bíblia esgotada', descricao:'Livro impresso', imagem:'assets/products/biblia-esgotada.jpg' },
  { slug:'biblia-negativa', nome:'Bíblia com saldo negativo', descricao:'Livro impresso', imagem:'assets/products/biblia-negativa.jpg' },
  { slug:'biblia-sem-registro', nome:'Bíblia sem inventário', descricao:'Livro impresso', imagem:'assets/products/biblia-sem-registro.jpg' }
];

test('Google Shopping publica exclusivamente produtos com estoque disponível positivo', () => {
  const xml = renderProductFeed(products, [
    { slug:'biblia-disponivel', available:3, unitPrice:89.90 },
    { slug:'biblia-esgotada', available:0, unitPrice:49.90 },
    { slug:'biblia-negativa', available:-1, unitPrice:49.90 }
  ]);
  assert.match(xml, /<g:id>biblia-disponivel<\/g:id>/);
  assert.match(xml, /<g:availability>in_stock<\/g:availability>/);
  assert.doesNotMatch(xml, /<g:id>biblia-esgotada<\/g:id>/);
  assert.doesNotMatch(xml, /<g:id>biblia-negativa<\/g:id>/);
  assert.doesNotMatch(xml, /<g:id>biblia-sem-registro<\/g:id>/);
  assert.doesNotMatch(xml, /out_of_stock/);
  assert.equal((xml.match(/<item>/g) || []).length, 1);
});

test('produto retorna ao feed quando estoque positivo volta a constar no inventário', () => {
  const xml = renderProductFeed([products[1]], [{ slug:'biblia-esgotada', available:1, unitPrice:49.90 }]);
  assert.match(xml, /<g:id>biblia-esgotada<\/g:id>/);
  assert.match(xml, /<g:price>49.90 BRL<\/g:price>/);
});

test('títulos do Merchant diferenciam as duas Bíblias Cronológicas por edição e capa', () => {
  const editions = [
    { slug: 'biblia-estudo-cronologica', nome: 'Bíblia de Estudo Cronológica Aplicação Pessoal Tarja Marrom', descricao: 'Bíblia ARC CPAD', imagem: 'assets/products/biblia-estudo-cronologica-01.webp' },
    { slug: 'biblia-estudo-cronologica-tricolor', nome: 'Bíblia de Estudo Cronológica Aplicação Pessoal — Tricolor (Tarja Verde)', descricao: 'Bíblia ARC CPAD', imagem: 'assets/products/biblia-estudo-cronologica-tricolor-01.jpg' }
  ];
  const xml = renderProductFeed(editions, editions.map(p => ({ slug: p.slug, available: 5, unitPrice: 352 })));
  assert.match(xml, /<g:title>Bíblia de Estudo Cronológica Aplicação Pessoal CPAD ARC — Tarja Marrom<\/g:title>/);
  assert.match(xml, /<g:title>Bíblia de Estudo Cronológica Aplicação Pessoal CPAD ARC — Tricolor \(Tarja Verde\)<\/g:title>/);
  assert.equal((xml.match(/<g:price>352\.00 BRL<\/g:price>/g) || []).length, 2);
  assert.equal((xml.match(/<item>/g) || []).length, 2);
});
