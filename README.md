# Chi Rho E-commerce

E-commerce estático em HTML, CSS e JavaScript, hospedado na Vercel, com pedidos, estoque e autenticação administrativa no Supabase.

## Estado operacional

- 73 produtos cadastrados no catálogo: 64 ativos e 9 desativados.
- 2 produtos Casa liberados para compra, com preço, estoque e dados logísticos completos.
- 62 produtos ativos permanecem somente em catálogo até receberem SKU, estoque e dimensões; 13 deles também aguardam preço.
- Carrinho, cotação Frenet, seleção de entrega e checkout ativos para os 2 produtos liberados.
- Pedidos com reserva temporária de 30 minutos, expiração, idempotência e proteção contra estoque negativo.
- Status financeiro e operacional separados.
- Painel administrativo protegido por Supabase Auth, com alteração de senha, pedidos, estoque, histórico e expedição.
- Páginas de retorno consultam o status real do pedido; a URL de sucesso não aprova pagamentos.

## Integrações preparadas

### Mercado Pago Checkout Pro

Como a integração financeira é executada nas Edge Functions, os valores devem ser
cadastrados em **Supabase Edge Function Secrets**. Não é necessário duplicar o Access
Token ou o secret do webhook na Vercel, que atua apenas como proxy HTTPS:

```text
MERCADO_PAGO_ACCESS_TOKEN
MERCADO_PAGO_PUBLIC_KEY
MERCADO_PAGO_WEBHOOK_SECRET
MERCADO_PAGO_TEST_MODE=true
```

Sem as três credenciais, o botão permanece indisponível e nenhuma chamada de pagamento é feita. Com `MERCADO_PAGO_TEST_MODE=true` (valor seguro e padrão), o Checkout Pro fica habilitado somente em uma URL de Preview da CHI RHO; o domínio público continua bloqueado. A integração financeira não deve ser considerada concluída antes dos testes oficiais de cartão, Pix e webhook.

### Frenet

```text
FRENET_TOKEN
FRENET_SELLER_CEP
FRENET_PARTNER_TOKEN
FRENET_PRINTING_FORMAT=A4
```

O token de cotação é independente do Partner Token do OneClick. Sem o Partner Token homologado, a emissão de etiqueta permanece indisponível e nenhuma etiqueta é simulada.

## Estrutura principal

- `script.js`: catálogo, produto, carrinho e frete.
- `checkout.js`: identificação, endereço, pedido e início do Checkout Pro.
- `admin-pedidos.js`: sessão administrativa, pedidos, histórico e expedição.
- `api/`: proxies Vercel para CEP, Frenet e Mercado Pago.
- `supabase/functions/`: funções de pedidos, estoque, administração, pagamento e etiqueta.
- `supabase/migrations/`: esquema e regras transacionais.
- `tests/`: auditoria de catálogo e testes SQL internos com `rollback`.

## Verificações locais

```bash
npm test
npm run test:syntax
```

Os testes SQL podem ser executados no SQL Editor/Supabase em ambiente controlado. Eles abrem uma transação e terminam com `rollback`; estados financeiros usados nesses arquivos são simulações internas e não são testes oficiais do Mercado Pago.

## Liberação do Mercado Pago

1. Inserir as três credenciais do vendedor de teste em Supabase Edge Function Secrets.
2. Manter `MERCADO_PAGO_TEST_MODE=true` durante toda a validação.
3. Configurar a URL de teste do webhook como `/api/mercadopago-webhook`, selecionar o tópico `payment` e copiar a assinatura secreta gerada.
4. Implantar as funções e o frontend revisados em Preview.
5. Confirmar que o provedor ficou ativo no Preview e segue bloqueado no domínio público.
6. Criar um pedido de teste com estoque reservado.
7. Testar cartão aprovado, recusado e pendente com a conta compradora de teste.
8. Testar Pix; no ambiente de teste, o resultado esperado é `aguardando_pagamento`.
9. Validar assinatura, idempotência e reenvio pelo simulador oficial de Webhooks.
10. Confirmar pedido `pago`, baixa de estoque e liberação do fluxo de separação.
11. Só então registrar a integração de teste como concluída.
