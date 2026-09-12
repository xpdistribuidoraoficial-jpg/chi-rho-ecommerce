# Etapa 6 — Preparação final e auditoria de lançamento

Data: 12/09/2026
Domínio: https://www.chirho.com.br

## Resumo

A preparação técnica de lançamento foi avançada sem alterar checkout, Mercado Pago, frete, reservas de estoque ou autenticação. O deploy mais recente desta etapa foi concluído com sucesso na Vercel.

## Implementado

### Páginas legais
- Política de Privacidade
- Termos de Uso
- Trocas e Devoluções
- Política de Entrega
- links de políticas adicionados ao rodapé das páginas públicas via módulo compartilhado
- identificação empresarial oficial publicada nas páginas legais e no rodapé público

### Identificação empresarial publicada
- Razão social: P S PERINI CHI RHO CASA E LIVROS
- CNPJ: 42.300.391/0001-00
- Responsável: Paulo Perini
- Endereço: Rua Bento Siqueira, 668, LT 6, CS 7 — São João de Meriti/RJ — CEP 25525-660
- Atendimento: (21) 99624-1324
- dados empresariais também adicionados ao `Organization` em JSON-LD para SEO estruturado

### Privacidade e segurança
- Minhas Compras permanece com `noindex, nofollow` no HTML
- `X-Robots-Tag: noindex, nofollow` também aplicado pelo Vercel a checkout, retornos de pagamento, painel e Minhas Compras
- CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy e Permissions-Policy preservados
- banner de privacidade adicionado às páginas públicas
- Google Analytics permanece bloqueado por padrão e só é carregado depois de autorização explícita do visitante
- opções disponíveis: aceitar Analytics, somente necessários e preferências
- preferência pode ser revista pelo rodapé em “Preferências de cookies”
- sinais de publicidade e personalização do Google permanecem negados nessa integração

### Mobile e acessibilidade
- link de salto “Pular para o conteúdo”
- foco visível por teclado
- suporte a `prefers-reduced-motion`
- alvos de toque mínimos de 44 px para controles principais
- ajuste adicional de cabeçalho para telas até 340 px
- menu mobile com `aria-controls` e `aria-expanded`
- imagens de conteúdo não prioritárias recebem `loading=lazy` e `decoding=async`
- grid de produtos já mantém 2 colunas nos breakpoints móveis existentes
- banner e preferências de cookies responsivos em celular

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
- dados estruturados da organização incluem razão social, CNPJ, telefone e endereço oficial

## Google — estado atual

### Search Console
Status: CONFIGURADO.

- propriedade de domínio `chirho.com.br` verificada via DNS
- sitemap `https://www.chirho.com.br/sitemap.xml` enviado e processado
- Search Console informou 77 páginas encontradas no sitemap no momento da configuração
- home `https://www.chirho.com.br/` confirmada como indexada
- rastreamento permitido e realizado pelo Googlebot Smartphone

### Google Analytics 4
Status: CONFIGURADO — MEDIÇÃO BASE COM CONSENTIMENTO.

- Measurement ID: `G-F8ZXRVDB72`
- tag carregada somente após consentimento de Analytics
- armazenamento analítico negado por padrão
- publicidade, `ad_user_data` e personalização de anúncios permanecem negados
- Política de Privacidade atualizada para explicar a medição e a alteração das preferências
- CSP atualizada somente para os hosts necessários ao carregamento e coleta do GA4

Observação: esta etapa configura a medição base de visitas nas páginas públicas que carregam o módulo do site. Eventos avançados de e-commerce, como `add_to_cart`, `begin_checkout` e `purchase`, devem ser tratados separadamente para não alterar o fluxo de pagamento nesta etapa.

### Merchant Center
Status: NÃO CONFIGURADO.

A estrutura SEO de produto existe e a identidade empresarial foi publicada. O Merchant Center ainda depende da configuração/validação da conta Google e do catálogo.

## Pendência legal de alta prioridade

RESOLVIDA com a publicação da razão social, CNPJ, responsável, endereço físico e telefone de atendimento informados pelo responsável da CHI RHO, além da atualização da política para o uso opcional de Analytics.

## Pendências externas para lançamento

1. Configurar Merchant Center, caso seja prioridade de lançamento.
2. Concluir a entrada em produção do Mercado Pago com credenciais de produção e uma compra real controlada.
3. Fazer auditoria final de regressão em desktop e celular.
4. Etiquetas/Frenet permanecem adiadas por decisão comercial e não bloqueiam o lançamento do checkout.

## Classificação

| Área | Status | Prioridade |
|---|---|---|
| Páginas legais | OK | Alta |
| Privacidade/LGPD | OK técnico com consentimento de Analytics | Alta |
| Identificação do fornecedor | OK | Alta |
| Mobile | OK por código; recomenda-se conferência física final | Média |
| Acessibilidade | Melhorada; auditoria assistiva completa ainda recomendada | Média |
| SEO técnico | OK | Alta |
| Search Console | OK | Alta |
| Analytics | OK para medição base consentida | Média |
| Merchant Center | Pendente conta Google | Média |
| Auditoria de regressão | Parcial: deploy e código validados; compra real de produção ainda pendente | Alta |

## Critério de encerramento da Etapa 6

A parte técnica principal da Etapa 6 está concluída: páginas legais, identificação empresarial, Search Console, sitemap e GA4 com consentimento estão configurados. Merchant Center permanece opcional/pós-configuração Google. A validação de pagamento real pertence ao fechamento da Etapa 1/lançamento financeiro.
