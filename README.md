# Chi Rho E-commerce

E-commerce estático em HTML, CSS e JavaScript, hospedado na Vercel, com pedidos, estoque e autenticação administrativa no Supabase.

## Estado operacional

- 73 produtos cadastrados no catálogo: 64 ativos e 9 desativados.
- 2 produtos Casa liberados para compra, com preço, estoque e dados logísticos completos.
- 62 produtos ativos permanecem somente em catálogo até receberem SKU, estoque e dimensões; 15 deles também aguardam preço.
- Carrinho, cotação Frenet, seleção de entrega e checkout ativos para os 2 produtos liberados.
- Pedidos com reserva temporária de 30 minutos, expiração, idempotência e proteção contra estoque negativo.
- Status financeiro e operacional separados.
- Painel administrativo protegido por Supabase Auth, com alteração de senha, pedidos, estoque, histórico e expedição.
- Páginas de retorno consultam o status real do pedido; a URL de sucesso não aprova pagamentos.

## Integrações preparadas

### Mercado Pago Checkout Pro

Variáveis obrigatórias, somente nos ambientes seguros da Vercel/Supabase:

```text
MERCADO_PAGO_ACCESS_TOKEN
MERCADO_PAGO_PUBLIC_KEY
MERCADO_PAGO_WEBHOOK_SECRET
```

Sem as três variáveis, o botão permanece indisponível e nenhuma chamada de pagamento é feita. A integração financeira não deve ser considerada concluída antes dos testes oficiais de cartão, Pix e webhook.

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

1. Inserir as três credenciais no ambiente seguro correto.
2. Configurar o webhook para `/api/mercadopago-webhook` e o tópico `payment`.
3. Implantar as funções e o frontend revisados.
4. Confirmar que a disponibilidade do provedor ficou ativa.
5. Criar um pedido de teste com estoque reservado.
6. Testar cartão aprovado, recusado e pendente.
7. Testar Pix e sua confirmação assíncrona.
8. Validar assinatura, idempotência e reenvio do webhook.
9. Confirmar pedido `pago`, baixa de estoque e liberação do fluxo de separação.
10. Só então registrar a integração financeira como concluída.
