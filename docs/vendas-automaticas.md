# Compra e medição automáticas — CHI RHO

Implementação de 16/10/2026, exclusiva do projeto `chi-rho-ecommerce`.

- `Comprar agora` adiciona a quantidade escolhida ao carrinho e abre a seleção de entrega/retirada. Nenhuma modalidade é escolhida pelo cliente automaticamente.
- `Continuar para pagamento` registra o pedido com validação no servidor e abre Checkout Pro. Em falhas, o botão de pagamento permite tentar novamente com o mesmo pedido.
- Estoque, preços individuais, conciliação dos componentes e assinatura HMAC permanecem no servidor. O Kit Culto permanece desativado.
- A retirada mostra Rua Maria do Carmo, 202, Penha Circular, Rio de Janeiro/RJ, CEP 21210-250. O endereço fiscal permanece independente.
- A página de retorno consulta o status a cada 15 segundos, por até 20 consultas enquanto estiver visível, e encerra após um status final. Retomar a aba ou atualizar manualmente permite uma nova consulta.
- Os modelos transacionais já existentes em produção foram preservados e sincronizados no repositório, com correção do número e CEP da retirada. Não foi criado disparo promocional.

## Medição

O Analytics carrega e recebe eventos apenas com consentimento analítico. São implementados `view_item`, `view_cart`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info` e `purchase`.

`purchase` depende de `financialStatus=pago` retornado pela consulta segura de status; um redirecionamento ou página de sucesso isolada não confirma a compra. O valor dos produtos e o frete são separados; o identificador da transação evita repetição no mesmo navegador. Não são enviados nome, e-mail, telefone, CPF, endereço ou token do pedido nos parâmetros dos eventos.

Limites: bloqueadores e recusa de consentimento impedem medição. A compra é observada quando o cliente consulta a página de retorno; pagamentos confirmados sem retorno ao site continuam registrados no banco, mas não são enviados ao Analytics por esse mecanismo. Validar o recebimento no DebugView/painel do GA4 com um acesso consentido. Não foi instalado Pixel da Meta sem identificar o ativo comercial correto e configurar o consentimento correspondente.

## Feed do Google

URL: `https://www.chirho.com.br/api/product-feed`.

Feed RSS/XML com leitura do estoque operacional, preço atual, disponibilidade, URLs individuais e GTIN validado quando disponível. Cache de 60 segundos. Em falha de consulta, responde 503 e não publica catálogo vazio nem preço inventado. Produtos em rascunho, imagens em confirmação e kits com mídia/identificadores incompletos ficam fora desta primeira versão.

No Merchant Center da CHI RHO, cadastrar a URL como fonte programada, conferir domínio, frete e devoluções, e resolver eventuais reprovações. O endpoint pronto não equivale a conta vinculada, produtos aprovados ou campanha publicada.

## Para aquisição paga

Ainda são necessários o custo dos produtos, o teto de investimento e a identificação da conta de anúncios CHI RHO. O estoque compartilhado atual permite até 10 kits fone + carregador, sujeito às vendas avulsas. Aumentar investimento exige margem e reposição; não há promessa de volume de vendas.

## Validação

Testes cobrem consentimento, dados pessoais ausentes, compra confirmada e deduplicação, conciliação de kit, retomada do pagamento, estoque/GTIN do feed e falha do estoque. Uma cobrança real e sua aprovação não foram executadas nesta alteração.
