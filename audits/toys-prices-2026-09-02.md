# Brinquedos — preços cheios e desconto de 15%

## Autorização e origem

Em 02/09/2026, o lojista autorizou usar os valores das capturas fornecidas como preços cheios dos dez brinquedos correspondentes e aplicar 15% de desconto. A autorização seguinte liberou a validação e publicação.

Fonte informada: [listagem Mercado Livre, vendedor 222722705](https://lista.mercadolivre.com.br/brinquedos-hobbies/_CustId_222722705). Os valores foram transcritos das capturas enviadas pelo lojista, não de consulta ao vivo; a listagem não pôde ser aberta nesta sessão. A data registrada no catálogo corresponde à aprovação desse material. Não foram copiados frete grátis, prazos, avaliações, estoque, preços de kits diferentes ou condições promocionais do marketplace.

A correspondência usa título, quantidade/composição, cor e imagem dos anúncios enviados. Não comprova SKU ou estoque físico. A pendência de possível duplicidade dos dois bombeiros continua registrada na auditoria anterior; nenhum produto foi fundido ou removido.

## Valores aplicados

`precoOriginal` recebe o preço cheio aprovado; `preco` recebe o preço final. Cálculo em centavos: `Math.round(precoCheioEmCentavos * 85 / 100)`. O preço final é salvo uma única vez, sem desconto adicional em tempo de execução. “Preço cheio” não significa histórico comprovado de venda na CHI RHO.

| Produto | Preço anterior no site | Preço cheio aprovado | Preço com 15% |
|---|---:|---:|---:|
| Caminhão de Bombeiro Resgate | Sem preço | R$ 26,99 | R$ 22,94 |
| Caminhão Infantil Baú 46 cm | Sem preço | R$ 38,99 | R$ 33,14 |
| Caminhão Boiadeiro com 4 Bois | Sem preço | R$ 26,96 | R$ 22,92 |
| Caminhão de Bombeiro com Escada Articulada | Sem preço | R$ 29,90 | R$ 25,42 |
| Trator Miniatura Pá Carregadeira | Sem preço | R$ 33,90 | R$ 28,82 |
| Caminhonete Jeep Trilha Off-Road | Sem preço | R$ 27,98 | R$ 23,78 |
| Trator Grande Articulado com Pá | R$ 62,80 | R$ 58,26 | R$ 49,52 |
| Caminhão Basculante 24 cm | Sem preço | R$ 22,90 | R$ 19,47 |
| Ônibus Speed Bus Vermelho na Caixa | R$ 42,58 | R$ 39,90 | R$ 33,92 |
| Kit com 3 Carretas Boiadeiro e 12 Bois | Sem preço | R$ 69,90 | R$ 59,42 |

## Preservado e pendente

- Blocos de 104 peças continuam sem preço: a captura refere-se à versão de 52 peças.
- Kit de três caminhões basculantes continua sem preço: não confundir com kit de três pás carregadeiras.
- Nenhum dos demais anúncios da listagem foi cadastrado automaticamente.
- Estoques continuam `null`; preços não habilitam compras sem estoque e cadastro logístico. Controles existentes permanecem desabilitados nesses brinquedos, como antes.
- Imagens, galerias, títulos, categorias, SKU/GTIN, dimensões e descrições não foram alterados nesta atualização.
- Carrinho, checkout, frete, pagamentos, banco e painel não receberam alterações.
- Cards e detalhes reutilizam `getProductPriceMarkup`, exibindo “De” e “Por”.

## Validação reproduzível

- `npm test` verifica os dez pares de preços, arredondamento, os dois itens pendentes, disponibilidade, imagens locais e renderização compartilhada.
- SHA-256 dos dados de catálogo excluindo somente os campos de preços dos brinquedos: `72c19b111d57422b31b80a72eda215ae29a1a2e29b6a924bb221aa374f27828b`. O teste garante preservação dos demais dados e das outras categorias.
- `npm run test:syntax` e `git diff --check` verificam sintaxe e integridade do patch.
- Resultado de deploy e conferência visual são reportados separadamente após publicação; os testes automatizados não comprovam sozinhos a versão publicada nem uso em celular físico.
