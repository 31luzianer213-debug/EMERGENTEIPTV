# Sigma Control

Painel SaaS para **revendedores de IPTV**: clientes, painel Sigma, pedidos com Pix, robô e cobrança automática pelo WhatsApp — com assinatura mensal para uso do sistema.

Projeto construído e hospedado no [Lovable](https://lovable.dev) (template TanStack Start + Supabase via Lovable Cloud).

## Stack

- **Frontend/SSR:** React 19 + TanStack Start/Router + Tailwind 4 + shadcn/ui
- **Backend:** server functions do TanStack Start (`src/lib/*.functions.ts` → `*.server.ts`) e rotas de webhook (`src/routes/api/public/hooks/*`)
- **Banco/Auth:** Supabase (Lovable Cloud) com RLS por revendedor — migrações versionadas em `supabase/migrations`
- **Integrações:** painel Sigma, Evolution API (WhatsApp), Mercado Pago e Asaas (Pix dos clientes finais), Mercado Pago (assinatura do sistema)

## Como colocar em produção no Lovable

1. **Sincronize o repositório** com o projeto Lovable (GitHub → Lovable). O Lovable Cloud aplica automaticamente as migrações novas em `supabase/migrations`:
   - `20260920000000_fixes_orders_cron_security.sql` — corrige a tabela `orders`, remove o cron antigo, adiciona `asaas_webhook_token`.
   - `20260920001000_saas_subscriptions.sql` — planos, assinaturas, pagamentos Pix do sistema, trial de 7 dias e limite de clientes por plano.
2. **Cadastre os segredos** em *Lovable → Cloud → Secrets* (nunca no repositório):

   | Segredo | Para que serve |
   |---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | Webhooks, robô e rotinas automáticas (já existe no Lovable Cloud) |
   | `PUBLIC_APP_URL` | URL publicada do app (ex.: `https://seuapp.lovable.app`) usada para registrar webhooks |
   | `BILLING_CRON_SECRET` | Protege `/api/public/hooks/cobranca-diaria` e `/sigma-sync` |
   | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` | Servidor Evolution API (WhatsApp) |
   | `SAAS_MERCADOPAGO_TOKEN` | Access token de **produção** da SUA conta Mercado Pago — recebe as assinaturas dos revendedores |
   | `SAAS_TRIAL_DAYS` | (opcional) dias de teste grátis, padrão 7 |

3. **Rotinas agendadas** (pg_cron no Supabase ou serviço externo), sempre com `Authorization: Bearer <BILLING_CRON_SECRET>`:
   - Diariamente: `POST {PUBLIC_APP_URL}/api/public/hooks/cobranca-diaria`
   - A cada 30 min: `POST {PUBLIC_APP_URL}/api/public/hooks/sigma-sync`
4. **Webhook da assinatura do sistema:** em *Mercado Pago → Suas integrações → Webhooks*, cadastre `{PUBLIC_APP_URL}/api/public/hooks/saas-mercadopago` (evento *Pagamentos*). O sistema também confere o Pix a cada 5 s na tela de assinatura, então o webhook é um reforço.
5. **Publique** pelo botão *Publish* do Lovable.

### Webhooks de cada revendedor (Pix dos clientes finais)

Cada revendedor copia sua URL em *Recebimentos (Pix)*; ela já inclui `?uid=<id-do-revendedor>`:

- Mercado Pago: `/api/public/hooks/mercadopago?uid=...`
- Asaas: `/api/public/hooks/asaas?uid=...` (opcional: token do webhook em `whatsapp_settings.asaas_webhook_token`, header `asaas-access-token`)

## Planos do sistema

Editáveis na tabela `saas_plans` (nome, preço mensal, limite de clientes, recursos). Semestral tem 10% e anual 20% de desconto. Quando a assinatura vence: 3 dias em modo somente leitura → bloqueio até renovar. O limite de clientes é aplicado no banco (trigger `clients_enforce_plan_limit`).

## Desenvolvimento local

```sh
npm install
cp .env.example .env   # preencha as variáveis
npm run dev
```

`npm run build` gera o bundle; `npx tsc --noEmit` valida os tipos.
