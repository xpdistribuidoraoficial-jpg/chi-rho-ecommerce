# Emissão ao preparar o envio

O administrador confere peso e dimensões de **uma caixa fechada** e confirma a preparação de um pedido pago. O backend salva essa conferência e solicita a etiqueta no mesmo fluxo. Retiradas não geram etiquetas. Vários volumes, peso acima de 30 kg e exigências fiscais específicas devem ser conferidos diretamente na Frenet.

## Configuração

No Supabase do projeto `sailabcmcqdzrqhqztqs`, conferir `FRENET_TOKEN`, `FRENET_PARTNER_TOKEN` autorizado e `FRENET_SELLER_CEP`. O CEP padrão desta integração é `21210250`, correspondente ao endereço operacional informado pelo lojista. Conferir se o remetente cadastrado na Frenet usa esse endereço: o OneClick utiliza `UseFrenetRegistration=true`. Nunca copiar valores de chaves para o repositório, mensagens ou logs.

É necessário saldo e limite de etiquetas na carteira Frenet. A existência dos tokens não comprova homologação, saldo ou disponibilidade de emissão por todas as transportadoras. O GET autenticado de `admin-shipping-label` informa somente disponibilidade de configuração.

## Proteções

- Autenticação administrativa, sessão ativa e vínculo do portal continuam obrigatórios.
- Pagamento, baixa de estoque e integridade dos valores são conferidos antes de reservar a emissão.
- O serviço escolhido é cotado novamente com o pacote fechado. Serviço indisponível, erro ou valor maior que o frete cobrado interrompem o fluxo antes do OneClick. Não há troca automática de transportadora.
- Os descontos já existentes no pedido são distribuídos uma vez, em centavos, para a declaração dos itens. Os preços individuais, o estoque e os totais do pedido não são modificados.
- Uma chamada OneClick é enviada por reserva. Falha de rede, resposta incompleta, HTTP inseguro, erro de salvamento ou retorno inconclusivo mantêm o bloqueio (`gerando` / `LABEL_RECONCILIATION_REQUIRED`). O prazo de cinco minutos não libera uma nova compra.
- Após resultado inconclusivo, conferir no painel da Frenet o pedido pelo código da loja e conciliar o envio existente. Não limpar a reserva ou reenviar o OneClick sem confirmar o resultado financeiro.
- Preparar envio não marca o pedido como postado. A etiqueta deve ser impressa e o pacote efetivamente postado antes de marcar como enviado.

## Validação

`node --test tests/frenet-label.test.mjs tests/frenet-admin-integration.test.mjs tests/admin-panel.test.mjs tests/admin-filters.test.mjs`

`tests/automatic-frenet-labels.sql` verifica as regras no banco em uma transação com rollback; não compra etiquetas ou envia notificações. A homologação de uma etiqueta real requer pedido, pacote, conta/remetente corretos e valor autorizado. A requisição OneClick e os campos usados seguem a documentação oficial:

- https://docs.frenet.com.br/reference/createorderoneclickasync
- https://docs.frenet.com.br/docs/orders-oneclick-gera%C3%A7%C3%A3o-autom%C3%A1tica-de-etiquetas

Antes de ativar o uso operacional, conferir o cadastro e realizar uma emissão real acompanhada. Não há recarga automática de saldo nem garantia de valor final da transportadora: divergências posteriores são conciliadas pela Frenet.
