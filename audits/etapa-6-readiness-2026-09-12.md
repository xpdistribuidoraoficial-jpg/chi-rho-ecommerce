# Etapa 6 — Preparação final e auditoria de lançamento

Data: 12/09/2026
Domínio: https://www.chirho.com.br

## Resumo

A preparação técnica de lançamento foi avançada sem alterar checkout, Mercado Pago, frete, reservas de estoque ou autenticação. O deploy final desta rodada foi concluído com sucesso na Vercel.

## Implementado

### Páginas legais
- Política de Privacidade
- Termos de Uso
- Trocas e Devoluções
- Política de Entrega
- links de políticas adicionados ao rodapé das páginas públicas via módulo compartilhado

### Privacidade e segurança
- Minhas Compras permanece com `noindex, nofollow` no HTML
- `X-Robots-Tag: noindex, nofollow` também aplicado pelo Vercel a checkout, retornos de pagamento, painel e Minhas Compras
- CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy e Permissions-Policy preservados

### Mobile e acessibilidade
- link de salto “Pular para o conteúdo”
- foco visível por teclado
- suporte a `prefers-reduced-motion`
- alvos de toque mínimos de 44 px para controles principais
- ajuste adicional de cabeçalho para telas até 340 px
- menu mobile com `aria-controls` e `aria-expanded`
- imagens de conteúdo não prioritárias recebem `loading=lazy` e `decoding=async`
- grid de produtos já mantém 2 colunas nos breakpoints móveis existentes

### SEO técnico
- `robots.txt` preservado com sitemap oficial
- sitemap atualizado com as páginas legais
- catálogo SEO preparado para excluir produtos aposentados
- removidas do sitemap as URLs de:
  - Bíblia Sagrada ARC com Harpa Cristã
  - Bíblia King James de Estudo Holman
  - Cute Jesus & Disciples — Livro de Colorir
- acessos diretos a esses produtos são redirecionados ao catálogo e cards reapresentados dinamicamente são removidos do catálogo público
- metadados e canônicos continuam apontando para `https://www.chirho.com.br`

## Google — estado atual

### Search Console
Status: PENDENTE DE AÇÃO NA CONTA GOOGLE.

O site já está preparado tecnicamente para cadastro: domínio oficial, robots.txt e sitemap.xml. Falta criar/confirmar a propriedade no Google Search Console, validar a propriedade (preferencialmente via DNS do domínio) e enviar `https://www.chirho.com.br/sitemap.xml`.

### Google Analytics 4
Status: NÃO CONFIGURADO.

Não existe Measurement ID `G-...` no repositório. Não foi inserido rastreamento fictício. A implementação deve ocorrer somente após a criação da propriedade GA4 e definição do tratamento de consentimento/privacidade aplicável.

### Merchant Center
Status: NÃO CONFIGURADO.

A estrutura SEO de produto existe, mas o Merchant Center ainda depende da conta Google, identidade empresarial final, políticas publicadas, dados comerciais consistentes e configuração/validação do catálogo no Google.

## Pendência legal de alta prioridade

O site ainda não contém nome empresarial/razão social, CPF/CNPJ do fornecedor e endereço físico empresarial. Esses dados não foram inventados. Devem ser fornecidos pelo responsável da CHI RHO e publicados em local de fácil acesso antes do lançamento comercial definitivo.

## Pendências externas para lançamento

1. Informar e publicar razão social/nome empresarial, CPF ou CNPJ e endereço físico do fornecedor.
2. Concluir Google Search Console e enviar o sitemap.
3. Criar GA4 e fornecer o Measurement ID se o rastreamento for desejado.
4. Configurar Merchant Center depois da identidade empresarial e catálogo final.
5. Concluir a entrada em produção do Mercado Pago com credenciais de produção e uma compra real controlada.
6. Etiquetas/Frenet permanecem adiadas por decisão comercial e não bloqueiam o lançamento do checkout.

## Classificação

| Área | Status | Prioridade |
|---|---|---|
| Páginas legais | OK técnico | Alta |
| Privacidade/LGPD | OK técnico; identificação empresarial pendente | Alta |
| Mobile | OK por código; recomenda-se conferência física final | Média |
| Acessibilidade | Melhorada; auditoria assistiva completa ainda recomendada | Média |
| SEO técnico | OK | Alta |
| Search Console | Pendente conta Google | Alta |
| Analytics | Pendente conta Google/ID | Média |
| Merchant Center | Pendente conta Google e dados empresariais | Média |
| Auditoria de regressão | Parcial: deploy e código validados; compra real de produção ainda pendente | Alta |

## Critério de encerramento da Etapa 6

A parte de código da Etapa 6 está concluída. Para encerramento completo antes do lançamento, faltam os dados empresariais obrigatórios, a configuração do Search Console e a decisão/configuração sobre Analytics e Merchant Center. A validação de pagamento real pertence ao fechamento da Etapa 1/lançamento financeiro.
