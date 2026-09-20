# Plano — Revisão completa e preparação comercial do sistema de revendas IPTV (Lovable)

## Objetivo
Transformar o projeto enviado (Backup_fc93ce.zip) em um produto vendável: sem bugs, com fluxos coerentes, UX polida, cobrança por assinatura, landing page de vendas e onboarding — mantendo 100% de compatibilidade com o Lovable (o projeto precisa continuar abrindo, buildando e publicando lá sem ajustes manuais).

## O que o sistema é (premissa)
Painel SaaS para **revendedores de IPTV** gerenciarem seus clientes finais: cadastro de clientes, planos/pacotes, vencimentos e renovações, créditos/saldo, cobranças, avisos de vencimento e relatórios. A análise detalhada do zip na Fase 1 confirmará ou corrigirá essa premissa antes de qualquer alteração.

## Fases

### Fase 1 — Auditoria completa (nada é alterado ainda)
- Descompactar e mapear todo o projeto: telas, rotas, tabelas, políticas de acesso (RLS), edge functions, integrações externas.
- Levantar e classificar todos os problemas em três grupos:
  - **Bugs** (erros, telas quebradas, dados que não salvam/carregam, cálculos errados).
  - **Sem sentido** (telas/campos/botões inúteis ou duplicados, fluxos que não levam a nada, textos incoerentes, dados fictícios em produção).
  - **Riscos comerciais** (segurança: dados de um revendedor visíveis para outro, chaves expostas no frontend, ausência de validações; ausência de termos/política de privacidade).
- Entregar um relatório curto com a lista priorizada (Crítico / Importante / Cosmético) antes de iniciar a Fase 2.

### Fase 2 — Correção de bugs e segurança
- Corrigir todos os itens Críticos e Importantes do relatório.
- Garantir isolamento total de dados entre revendedores (cada revendedor só vê seus clientes, planos e finanças).
- Corrigir autenticação: login, cadastro, recuperação de senha, sessão expirada, proteção de rotas.
- Validar formulários (campos obrigatórios, formatos de telefone/CPF/e-mail, datas, valores).
- Remover dados falsos, botões mortos e código sem uso.

### Fase 3 — Coerência do produto e UX
- Revisar cada fluxo do revendedor de ponta a ponta: cadastrar cliente → atribuir plano → acompanhar vencimento → renovar → registrar pagamento → notificar.
- Padronizar textos em português do Brasil, mensagens de erro/sucesso, estados vazios ("nenhum cliente ainda") e carregamento.
- Dashboard com indicadores que fazem sentido para o negócio: clientes ativos, vencendo em 3/7 dias, vencidos, receita do mês, inadimplência.
- Responsividade completa (o revendedor usa muito pelo celular).
- Identidade visual consistente (cores, tipografia, componentes) sem alterar a marca já existente do projeto.

### Fase 4 — Cobrança e assinatura do SaaS (revendedor paga para usar o sistema)
- Planos de assinatura do sistema com limites por plano (ex.: quantidade de clientes cadastrados).
- Checkout, confirmação automática de pagamento, bloqueio suave quando a assinatura vence (aviso → somente leitura → bloqueio), página de gerenciar assinatura.
- Período de teste grátis configurável (assumido: 7 dias).
- **Importante:** como a hospedagem é no Lovable (backend Supabase), a cobrança precisa usar **uma conta de pagamento sua**, com as chaves guardadas como segredos no Supabase. Não é possível usar a conta de testes automática da plataforma aqui.

### Fase 5 — Landing page de vendas e onboarding
- Landing page pública: proposta de valor, funcionalidades, planos e preços, depoimentos (placeholders), perguntas frequentes, chamada para teste grátis.
- Onboarding do novo revendedor em poucos passos após o cadastro: nome da revenda, logo/cores (se já existir no projeto), primeiro plano de IPTV, primeiro cliente.
- Páginas legais: Termos de Uso e Política de Privacidade (texto base para revisão jurídica).

### Fase 6 — Compatibilidade final com o Lovable
- Garantir que a estrutura, dependências e configuração do projeto seguem o padrão que o Lovable espera (mesma stack, mesma organização, migrações do Supabase versionadas na pasta do projeto).
- Entregar o projeto pronto para ser importado/sincronizado no Lovable, com passo a passo de: chaves/segredos que precisam ser configurados, migrações a aplicar e como publicar.

## Decisões que precisam da sua confirmação
1. **Provedor de pagamento da Fase 4** (assumido: **Mercado Pago com Pix + cartão**, por ser o padrão do mercado brasileiro de IPTV). Alternativa: Stripe (cartão; Pix apenas para contas Stripe Brasil). Em ambos os casos você precisará criar a conta e fornecer as chaves de API.
2. **Preços e planos do SaaS** (assumido: 3 planos mensais — Básico / Profissional / Ilimitado — com limites por número de clientes; valores a definir por você, uso valores de exemplo até então).
3. **Escopo de notificações**: manter apenas o que já existe no projeto (ex.: link/mensagem de WhatsApp manual). Envio automático de mensagens por API do WhatsApp fica fora deste plano, salvo pedido.

## Fora do escopo (a menos que peça)
- Integração automática com painéis de IPTV externos (criação de logins no servidor de IPTV).
- Aplicativo mobile nativo.
- Envio automático de WhatsApp/SMS/e-mail via APIs pagas.
- Multi-idioma.

## Premissas
- O projeto no zip é o código completo e atual (frontend + migrações/funções do Supabase). Se faltarem partes (ex.: banco sem migrações), elas serão reconstruídas a partir do que o frontend usa.
- Alterações no banco e regras do Supabase são permitidas, sempre entregues como migrações dentro do projeto.
- Idioma do produto: português do Brasil.
