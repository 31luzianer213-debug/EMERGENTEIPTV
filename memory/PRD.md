# Sigma Control — PRD / Estado do Projeto

## Problema original (usuário)
Painel SaaS de revenda IPTV (projeto Lovable: TanStack Start + Supabase). Pedidos:
1. Remover menus desnecessários do painel.
2. Busca geral de bugs / funções quebradas.
3. Deixar apenas UM plano de R$20 nas assinaturas.
4. Ter um campo no painel Admin para colar o token que gera os códigos Pix (pagamento automático).
5. Integrar a MisticPay para receber os Pix das assinaturas.

## Stack
- Frontend/SSR: React 19 + TanStack Start/Router + Tailwind 4 + shadcn/ui
- Backend: server functions (`src/lib/*.functions.ts` → `*.server.ts`) + rotas webhook (`src/routes/api/public/hooks/*`)
- Banco/Auth: Supabase (Lovable Cloud), migrações em `supabase/migrations`
- IMPORTANTE: o app roda no Lovable (precisa de Supabase Cloud + Node 22). Não roda no preview padrão do Emergent.

## Implementado (2026-06)
- **Menus removidos da sidebar**: "Clientes operação", "Sincronização Sigma", "Diagnóstico WhatsApp" (as páginas/rotas continuam existindo e acessíveis por links internos; só saíram do menu). `src/components/layout/navigation.ts`.
- **Plano único R$20**: migração `20260921000000_single_plan_and_mysticpay.sql` transforma o plano `ilimitado` em "Plano Mensal" R$20 (clientes ilimitados) e desativa Básico/Profissional. Landing e tela de Assinatura passam a mostrar só esse plano. Fallback da landing e textos atualizados.
- **MisticPay (assinaturas)**: substitui Mercado Pago no fluxo SaaS.
  - `src/lib/mysticpay.server.ts`: create (`/api/transactions/create`) e check (`/api/transactions/check`). Auth por `ci/cs` ou `Authorization: Basic` (pk_/sk_), detectado pelo prefixo. Gera CPF válido para o pagador.
  - `src/lib/system-settings.server.ts`: lê credenciais e admin_email da tabela `system_settings`.
  - `src/lib/admin.functions.ts`: getAdminStatus, getAdminSettings, saveAdminSettings, testMysticPayConnection (todas restritas ao admin).
  - `src/lib/subscription.server.ts`: gera/consulta Pix pela MisticPay usando as credenciais do banco.
  - Webhook: `src/routes/api/public/hooks/saas-mysticpay.ts` (reconfere na API antes de ativar).
- **Painel Admin**: nova rota `/_authenticated/admin.tsx` (menu "Administração", visível só para o admin). Campos Client ID / Client Secret, teste de conexão, salvar, e URL do webhook.
  - Tabela `system_settings` (singleton, RLS só service_role) guarda `mysticpay_client_id`, `mysticpay_client_secret`, `admin_email`.
  - Admin default: `frfrfrfrfr@gmail.com` (semeado na migração + fallback em `system-settings.server.ts`; sobrescrevível por env `ADMIN_EMAIL`).

## Validação
- `npx tsc --noEmit` → 0 erros.
- Não foi possível rodar/preview ao vivo aqui (requer Supabase Cloud + Node 22 do Lovable). Testar após sincronizar no Lovable.

## Backlog / próximos
- P1: Rodar migrações no Lovable e testar geração/confirmação de Pix real com token da MisticPay.
- P2: Revisão de bugs em runtime (fluxos Sigma/WhatsApp) só é possível com o app publicado.
- P2: Opcional — simplificar seletor de período (mensal/semestral/anual) se o usuário quiser só mensal.
