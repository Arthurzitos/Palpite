# 📖 README — Prediction Market (Dev Guide)

# 📖 README — Prediction Market (Dev Guide)

> **Última atualização:** 2026-02-19
>

> **Tech Spec:** [Ver Tech Spec completa](./Dev_Spec.md)
>

> **Production Checklist:** [Ver o que falta para produção](./PRODUCTION_CHECKLIST.md)
>
> **Guia de Deploy:** [Passo a passo completo](./DEPLOYMENT_GUIDE.md)
>

> **Status:** MVP Ready (~99% Completo — Infra de Deploy Pronta)
>

---

## O que é este projeto?

Plataforma de mercado de previsão (prediction market) onde usuários apostam em resultados de eventos reais usando crypto. Clone da [previsao.io](http://previsao.io) com pagamentos via [NOWPayments](https://nowpayments.io) (PIX/Cartão/Crypto), sem KYC.

Modelo **pari-mutuel**: todo mundo aposta num pool, odds calculadas pelo volume. Quando o evento é resolvido, vencedores dividem o pool (menos taxa de 3% — ✅ **rake implementado e configurável via PLATFORM_FEE_PERCENT**).

---

## Resumo de Implementacao (2026-02-19)

### ✅ Implementado
- **Auth**: Registro, login, JWT, refresh tokens, guards
- **Events**: CRUD completo, filtros, categorias, odds engine
- **Bets**: Criar aposta, deducao atomica, settlement, refund
- **Admin (Backend)**: Criar/editar/resolver/cancelar eventos, dashboard
- **Admin (Frontend)**: ✅ Painel completo de gerenciamento
  - Layout com sidebar e navegação
  - Dashboard com métricas (volume, eventos, apostas, usuários)
  - Lista de eventos com filtros e busca
  - Criar/editar/bloquear/resolver/cancelar eventos
  - Hook useAdmin com Zustand
- **Frontend**: Landing, Login, Registro, Mercados, Evento Detalhe, Dashboard
- **Wallet (Backend)**: Integração completa NOWPayments
  - CcpaymentService: checkout URL, withdraw, webhook SHA-256
  - NowPaymentsService: invoice, widget config, webhook HMAC SHA-512
  - WalletController: 7 endpoints funcionais
  - Transações atômicas MongoDB, idempotência em webhooks
- **Wallet (Frontend)**: ✅ Integração completa
  - Depósito crypto via NOWPayments
  - Depósito PIX/Cartão via NOWPayments (widget embedded)
  - Saque crypto (múltiplas moedas e redes)
  - Histórico de transações em tempo real
  - Hook useWallet com Zustand
- **Sistema de Rake/Taxa**: ✅ Implementado (2026-02-19)
  - Dedução automática de taxa no settlement (configurável via PLATFORM_FEE_PERCENT)
  - Contabilização de receita (RakeRecord + PlatformWallet schemas)
  - Dashboard admin: receita acumulada, lucro por período, top eventos
  - Endpoints /admin/revenue/* para estatísticas e saque
  - Página /admin/revenue com dashboard completo
  - NOWPayments Payouts API para saque de rake
- **Hardening**: ✅ Implementado
  - Rate limiting global (ThrottlerGuard)
  - Logging estruturado (Pino)
  - Health check endpoints (/health, /health/live, /health/ready)
  - Testes E2E (webhooks, auth, health)

### ❌ Pendente para Produção

📄 **Ver checklist completo:** [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

**Críticos (Bloqueia Lançamento):**
- KYB CCPayment (verificação de empresa)
- Deploy em hospedagem (Railway + Vercel)
- Domínio + SSL
- Testes E2E com webhooks reais
- Termos de Uso e Política de Privacidade

**Infraestrutura:**
- ✅ Dockerfiles (API + Web) — Implementado 2026-02-19
- ✅ CI/CD (GitHub Actions) — Implementado 2026-02-19
- MongoDB Atlas, Redis Upstash, Sentry — Pendente configuração

**Opcional:**
- Mobile responsive (parcial), Real-time updates, Email notifications

### ✅ Recém Implementado (2026-02-19)
- **Rate limiting**: ThrottlerGuard com múltiplos limites (short/medium/long)
- **Logging estruturado**: Pino logger com contexto
- **Health check endpoints**: /health, /health/live, /health/ready
- **Polling fallback**: Job scheduler para verificar pagamentos pendentes automaticamente

---

## Quick Start (5 minutos)

### Pré-requisitos

```
Node.js >= 20.x
npm >= 10.x (ou pnpm)
Docker + Docker Compose
Git
```

### 1. Clonar e instalar

```bash
git clone git@github.com:zyra-dev/prediction-market.git
cd prediction-market
npm install
```

### 2. Subir infra local (MongoDB + Redis)

```bash
docker compose up -d
```

Isso sobe:

- MongoDB na porta `27017`
- Redis na porta `6379`
- Mongo Express (UI) na porta `8081` (opcional, pra visualizar dados)

### 3. Configurar variáveis de ambiente

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

Edite os `.env` com seus valores (veja seção Env Vars abaixo).

### 4. Rodar seed (dados iniciais)

```bash
npm run seed -w apps/api
```

Isso cria:

- 1 admin user (admin@prediction.local / Admin123!)
- 2 users de teste (user@prediction.local / User123!, user2@prediction.local / User123!)
- 8 eventos de exemplo com outcomes
- Saldo inicial: Admin $10.000, User $1.000, User2 $500

### 5. Iniciar dev

```bash
# Terminal 1: Backend
npm run dev -w apps/api
# → http://localhost:3001

# Terminal 2: Frontend
npm run dev -w apps/web
# → http://localhost:3000
```

Pronto. Acesse [`http://localhost:3000`](http://localhost:3000) e logue com user de teste.

---

## Estrutura do Projeto

```jsx
/prediction-market
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Login, registro, JWT, guards
│   │   │   │   ├── users/      # CRUD usuários, balance
│   │   │   │   ├── events/     # CRUD eventos, outcomes, odds
│   │   │   │   ├── bets/       # Criar aposta, settlement
│   │   │   │   ├── wallet/     # ✅ Depósito, saque, webhooks (NOWPayments)
│   │   │   │   ├── transactions/ # Ledger, histórico
│   │   │   │   └── admin/      # Painel admin, métricas
│   │   │   ├── common/
│   │   │   │   ├── guards/     # AuthGuard, AdminGuard
│   │   │   │   ├── filters/    # Exception filters
│   │   │   │   ├── interceptors/
│   │   │   │   ├── decorators/
│   │   │   │   └── pipes/
│   │   │   ├── config/         # Env validation, configs
│   │   │   ├── database/       # Mongoose connection, schemas
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── (public)/   # Landing, login, register
│       │   │   │   ├── page.tsx           # Landing
│       │   │   │   ├── login/page.tsx
│       │   │   │   └── register/page.tsx
│       │   │   ├── (app)/      # Rotas autenticadas
│       │   │   │   ├── markets/page.tsx    # Grid de eventos
│       │   │   │   ├── markets/[id]/page.tsx # Detalhe evento
│       │   │   │   ├── dashboard/page.tsx  # Posições + P&L
│       │   │   │   ├── wallet/page.tsx     # Saldo, depósito, saque
│       │   │   │   └── profile/page.tsx
│       │   │   ├── admin/      # ⚠️ PENDENTE - Rotas admin frontend (backend pronto)
│       │   │   │   ├── page.tsx           # (pendente) Dashboard métricas
│       │   │   │   ├── events/page.tsx     # (pendente) Gerenciar eventos
│       │   │   │   └── events/new/page.tsx # (pendente) Criar evento
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   │   ├── ui/         # Shadcn/ui components
│       │   │   ├── layout/     # Header, Footer, Sidebar
│       │   │   ├── events/     # EventCard, EventGrid, OddsBar
│       │   │   ├── bets/       # BetForm, BetHistory, BetCard
│       │   │   ├── wallet/     # DepositModal, WithdrawModal
│       │   │   └── admin/      # EventForm, ResolveModal
│       │   ├── hooks/          # useAuth, useBalance, useEvents
│       │   ├── lib/            # API client, utils, formatters
│       │   ├── types/          # TypeScript interfaces
│       │   └── styles/
│       ├── public/
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── shared/                 # Tipos e constantes compartilhados
│       ├── types/              # User, Event, Bet, Transaction
│       ├── constants/          # Categories, statuses, limits
│       └── utils/              # Formatters, validators
│
├── docker-compose.yml
├── package.json                # Workspaces root
├── tsconfig.base.json
└── README.md
```

---

## Env Vars

### Backend (`apps/api/.env.example`)

```bash
# ══════════════════════════════════════
# APP
# ══════════════════════════════════════
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# ══════════════════════════════════════
# DATABASE
# ══════════════════════════════════════
MONGODB_URI=mongodb://localhost:27017/prediction-market
REDIS_URL=redis://localhost:6379

# ══════════════════════════════════════
# AUTH
# ══════════════════════════════════════
JWT_SECRET=sua-chave-secreta-aqui-troque-em-prod
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outra-chave-secreta-aqui
JWT_REFRESH_EXPIRES_IN=7d

# ══════════════════════════════════════
# PLATFORM
# ══════════════════════════════════════
PLATFORM_FEE_PERCENT=3          # Taxa cobrada no settlement (3%)
MIN_BET_AMOUNT=1                 # Aposta mínima em USD
MAX_BET_AMOUNT=10000             # Aposta máxima em USD
MIN_DEPOSIT_AMOUNT=5             # Depósito mínimo em USD
MIN_WITHDRAWAL_AMOUNT=10         # Saque mínimo em USD

# ══════════════════════════════════════
# NOWPAYMENTS (Fiat On-Ramp: PIX + Cartão)
# ══════════════════════════════════════
# Pegue em: https://account.nowpayments.io > Store Settings > API Keys
NOWPAYMENTS_API_KEY=seu-api-key
NOWPAYMENTS_IPN_SECRET=seu-ipn-secret
NOWPAYMENTS_WEBHOOK_URL=https://api.palpite.me/api/wallet/webhook/nowpayments
# Crypto destino dos depósitos fiat (on-ramp converte BRL/USD > USDT e envia pra cá)
NOWPAYMENTS_PAYOUT_ADDRESS=sua-wallet-usdt
NOWPAYMENTS_PAYOUT_CURRENCY=usdttrc20
```

### Frontend (`apps/web/.env.example`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=PredictionMarket
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Scripts Disponíveis

### Root (monorepo)

| Script | Comando | O que faz |
| --- | --- | --- |
| Dev all | `npm run dev` | Sobe front + back simultaneamente |
| Build all | `npm run build` | Build de produção de tudo |
| Lint all | `npm run lint` | ESLint em todos os workspaces |
| Type check | `npm run typecheck` | tsc --noEmit em tudo |
| Clean | `npm run clean` | Remove node_modules e dist/ |

### Backend (`apps/api`)

| Script | Comando | O que faz |
| --- | --- | --- |
| Dev | `npm run dev -w apps/api` | NestJS em watch mode (porta 3001) |
| Build | `npm run build -w apps/api` | Compila para dist/ |
| Seed | `npm run seed -w apps/api` | Popula DB com dados de teste |
| Test | `npm run test -w apps/api` | Jest unit tests |
| Test e2e | `npm run test:e2e -w apps/api` | Testes de integração |
| Lint | `npm run lint -w apps/api` | ESLint |

### Frontend (`apps/web`)

| Script | Comando | O que faz |
| --- | --- | --- |
| Dev | `npm run dev -w apps/web` | Next.js dev (porta 3000) |
| Build | `npm run build -w apps/web` | Build de produção |
| Lint | `npm run lint -w apps/web` | ESLint |

---

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: prediction-market

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  mongo-express:
    image: mongo-express
    ports:
      - '8081:8081'
    environment:
      ME_CONFIG_MONGODB_URL: mongodb://mongodb:27017/
    depends_on:
      - mongodb

volumes:
  mongodb_data:
  redis_data:
```

---

## NOWPayments: Setup e Testes

### Como configurar

1. Crie conta em [nowpayments.io](http://nowpayments.io)
2. No dashboard, vá em **Store Settings → API Keys**
3. Copie `API_KEY` para o `.env`
4. Em **IPN Settings**, gere um `IPN Secret` e copie para `.env`
5. Configure o **IPN Callback URL**: [`https://api.palpite.me/api/wallet/webhook/nowpayments`](https://api.palpite.me/api/wallet/webhook/nowpayments)
6. Em **Payout Settings**, configure o endereço USDT (TRC20 recomendado por fees baixos)

### Fluxo de depósito PIX (como funciona)

```jsx
[Usuário] → clica "Depositar via PIX"
    ↓
[Frontend] → Abre modal com widget NOWPayments embedded
           → Parâmetros: amount, target_crypto=USDT, wallet=nossa
    ↓
[Widget NOWPayments] → Gera QR code PIX
                     → Usuário paga com app do banco
    ↓
[NOWPayments] → Recebe BRL via PIX
              → Converte BRL → USDT automaticamente
              → Envia USDT para nossa wallet
              → Envia POST webhook para /wallet/webhook/nowpayments
    ↓
[Backend] → Verifica assinatura HMAC SHA-512
          → Checa idempotência (payment_id único)
          → Credita saldo USD do usuário
          → Transaction status → completed
```

### Verificação do Webhook NOWPayments

```tsx
import { createHmac } from 'crypto';

function verifyNowPaymentsWebhook(
  body: Record<string, any>,
  receivedSig: string, // header: x-nowpayments-sig
  ipnSecret: string
): boolean {
  // NOWPayments ordena as keys alfabeticamente antes de assinar
  const sortedBody = JSON.stringify(body, Object.keys(body).sort());
  const expectedSig = createHmac('sha512', ipnSecret)
    .update(sortedBody)
    .digest('hex');
  return expectedSig === receivedSig;
}
```

### Testar NOWPayments em [localhost](http://localhost)

Use ngrok para expor seu localhost:

```bash
ngrok http 3001
# Cole a URL no dashboard NOWPayments como IPN Callback URL
# Ex: https://abc123.ngrok.io/wallet/webhook/nowpayments
```

### Status de pagamento NOWPayments

```jsx
// Os webhooks vêm com payment_status que pode ser:
// 'waiting'    → Aguardando pagamento
// 'confirming' → Transação na blockchain, aguardando confirmações
// 'confirmed'  → Confirmado, processando
// 'sending'    → Enviando crypto para nossa wallet
// 'finished'   → COMPLETO — só creditar o saldo nesse status
// 'failed'     → Falhou
// 'refunded'   → Reembolsado
// 'expired'    → Expirou sem pagamento
//
// IMPORTANTE: SÓ creditar saldo quando payment_status === 'finished'
// Outros status são intermediários e podem mudar
```

### Erros Comuns NOWPayments

**1. Webhook com status intermediário**

NOWPayments envia vários webhooks durante o ciclo de vida do pagamento. Só processe o `finished`:

```tsx
// ✅ Correto
if (webhookData.payment_status !== 'finished') {
  return; // ignora status intermediários
}
```

**2. Valor recebido diferente do esperado**

Por causa da conversão BRL→USDT, o valor recebido pode variar. Use `outcome_amount` (valor real em crypto) para creditar:

```tsx
// outcome_amount = quanto USDT realmente chegou
// price_amount = quanto o usuário pagou em BRL/USD
const creditAmount = parseFloat(webhookData.outcome_amount);
```

---

Usamos modelo **pari-mutuel** (pool-based). Entenda antes de codar:

```
Evento: "Flamengo vs Lanús"

Aposta 1: João aposta $100 em Flamengo
Aposta 2: Maria aposta $50 em Flamengo  
Aposta 3: Pedro aposta $50 em Lanús

Pool total: $200
Pool Flamengo: $150
Pool Lanús: $50

Odds Flamengo: 200 / 150 = 1.33x
Odds Lanús: 200 / 50 = 4.00x

── Se Flamengo vence ──
Taxa plataforma: $200 × 3% = $6
Pool distribuível: $194

João recebe: (100/150) × 194 = $129.33
Maria recebe: (50/150) × 194 = $64.67
Pedro recebe: $0

── Se Lanús vence ──
Taxa plataforma: $200 × 3% = $6
Pool distribuível: $194

Pedro recebe: (50/50) × 194 = $194
João recebe: $0
Maria recebe: $0
```

### Regras importantes

- Odds recalculam APÓS cada aposta
- Aposta mínima: $1
- Aposta máxima: $10.000
- Odds no momento da compra ficam salvas no Bet (para referência), mas o payout real é calculado no settlement com as odds FINAIS
- Taxa é cobrada apenas no settlement, não na aposta

---

## Settlement: Fluxo de resolução

> ✅ **IMPLEMENTADO (2026-02-19):** O sistema de rake/taxa está funcionando. Ver Dev_Spec.md Fase 6 para detalhes.

```
Admin clica "Resolver" → seleciona outcome vencedor
    ↓
1. Event.status → RESOLVED
2. Event.resolvedOutcomeId → ID do vencedor
3. Calcula taxa: totalPool × PLATFORM_FEE_PERCENT    ✅ IMPLEMENTADO
4. Pool distribuível = totalPool - taxa              ✅ IMPLEMENTADO
5. Para cada bet no outcome VENCEDOR:
   → payout = (bet.amount / winnerPool) × poolDistribuível
   → user.balance += payout
   → Cria Transaction(type: PAYOUT)
   → bet.status → WON
   → bet.payout → valor recebido
6. Para cada bet nos outcomes PERDEDORES:
   → bet.status → LOST
   → bet.payout → 0
7. Registra rake via RakeService                     ✅ IMPLEMENTADO
8. Admin pode sacar rake via /admin/revenue/withdraw ✅ IMPLEMENTADO
```

### Edge cases que PRECISAM funcionar

- **Evento cancelado:** Todas as bets recebem refund integral, sem taxa
- **Ninguém apostou no vencedor:** Refund total para todos
- **Só 1 outcome tem apostas:** Refund (não faz sentido)
- **Settlement falha no meio:** Usar MongoDB transactions — tudo ou nada

---

## Padrões de Código

### TypeScript

- **Strict mode** obrigatório (`strict: true` no tsconfig)
- **Zero `any`** — use `unknown` se necessário
- Tipos explícitos em parâmetros de função
- Interfaces para objetos, types para unions/intersections
- Arquivos com no máximo 300 linhas

### NestJS

- 1 controller por recurso
- Lógica de negócio SEMPRE no service, NUNCA no controller
- DTOs com `class-validator` em TODOS os endpoints
- Guards para autenticação (`@UseGuards(AuthGuard)`)
- Admin routes com `@UseGuards(AdminGuard)`

### React / Next.js

- Server Components por padrão
- Client Components apenas quando necessário (`'use client'`)
- Custom hooks para lógica reutilizável (`useAuth`, `useBalance`)
- Componentes com no máximo 150 linhas
- Tailwind para estilos, zero inline styles
- Shadcn/ui como base de componentes

### Naming

```
// Arquivos
user.service.ts          // kebab-case para módulos NestJS
EventCard.tsx            // PascalCase para componentes React
use-balance.ts           // kebab-case para hooks

// Variáveis e funções
const userName = ''      // camelCase
function getUserById() {}

// Classes e interfaces
class BetService {}
interface EventData {}

// Constantes
const MAX_BET_AMOUNT = 10000  // UPPER_SNAKE_CASE

// Enums
enum EventStatus {
  OPEN = 'open',
  RESOLVED = 'resolved'
}
```

---

## Git Workflow

### Branches

```
main              ← produção, sempre estável
  └── dev         ← branch de desenvolvimento
       └── feat/PM-001-setup-monorepo
       └── feat/PM-002-auth-module
       └── fix/PM-010-odds-calculation
```

### Commits

```bash
# Formato
<type>(scope): descrição curta

# Exemplos
feat(auth): add JWT login and registration
feat(events): create event CRUD with odds calculation
feat(wallet): integrate NOWPayments deposit flow
fix(bets): fix race condition in balance deduction
refactor(settlement): extract payout calculator to service
test(bets): add unit tests for settlement engine
docs(readme): update setup instructions
chore(deps): update nest to v10.3
```

### Fluxo

```
1. git checkout dev
2. git pull origin dev
3. git checkout -b feat/PM-XXX-descricao
4. Codar + commits atômicos
5. git push origin feat/PM-XXX-descricao
6. Abrir PR para dev
7. Code review (ou self-review se solo)
8. Squash and merge
9. Delete branch
```

---

## Ordem de Execução (Roadmap Dev)

Siga esta ordem. Cada fase depende da anterior:

### Semana 1-2: Fundação

```
1. Setup monorepo (npm workspaces)
2. Docker Compose (Mongo + Redis)
3. NestJS boilerplate (config, env validation, CORS, helmet)
4. Mongoose connection + schemas (User, Transaction)
5. Auth module (register, login, JWT, refresh, guards)
6. Next.js boilerplate (layout, Tailwind, Shadcn)
7. Pages: login, register (conectando à API)
8. Seed script
```

### Semana 3-5: Core

```
9.  Event schema + CRUD endpoints
10. Outcome schema (embedded no Event)
11. Odds calculation service
12. Bet schema + create bet endpoint
13. Balance deduction (atômica) ao apostar
14. Odds recalculation após cada bet
15. Settlement service (resolve event → payout)
16. Cancel event (refund all)
17. Frontend: markets page (grid de eventos)
18. Frontend: event detail page (odds, bet form)
19. Frontend: dashboard (posições, P&L)
```

### Semana 6-7: Pagamentos (NOWPayments) — ✅ COMPLETO

```jsx
// NOWPayments (PIX + Cartão + Crypto) ✅ COMPLETO
20. ✅ NOWPayments setup (NowPaymentsService)
21. ✅ Deposit endpoint crypto (POST /wallet/deposit/crypto)
22. ✅ Deposit endpoint fiat (POST /wallet/deposit/fiat)
23. ✅ Webhook endpoint NOWPayments (POST /wallet/webhook/nowpayments)
24. ✅ Webhook signature verification (HMAC SHA-512)
25. ✅ Idempotência NOWPayments (payment_id único)
26. ✅ Status handling (só credita no 'finished')
27. ✅ Withdraw endpoint (POST /wallet/withdraw)

// Frontend ✅ COMPLETO (2026-02-18)
32. ✅ Frontend: wallet page integrada com backend
33. ✅ Frontend: widget NOWPayments embedded no modal
34. ✅ Hook useWallet com Zustand
35. ❌ Testar fluxo E2E com ngrok
```

**Arquivos criados (Backend):**
```
apps/api/src/modules/wallet/
├── dto/deposit-crypto.dto.ts, deposit-fiat.dto.ts, withdraw.dto.ts
├── services/nowpayments.service.ts
├── wallet.controller.ts, wallet.service.ts, wallet.module.ts
```

**Arquivos criados (Frontend - 2026-02-18):**
```
apps/web/src/hooks/use-wallet.ts      # Zustand store para wallet
apps/web/src/app/(app)/wallet/page.tsx # Página completa com integração
```

### Semana 8-9: Admin + Polish — ✅ COMPLETO

```
28. ✅ Admin guard + routes
29. ✅ Admin: criar evento (form completo)
30. ✅ Admin: resolver evento (selecionar vencedor)
31. ✅ Admin: cancelar evento
32. ✅ Admin: dashboard métricas
33. ✅ Landing page
34. ⚠️ Mobile responsive (parcial)
35. ✅ Loading states, error handling na UI
36. ⚠️ Toast notifications (parcial)
```

**Arquivos criados (Admin Frontend - 2026-02-18):**
```
apps/web/src/hooks/use-admin.ts          # Zustand store para admin
apps/web/src/app/admin/layout.tsx        # Layout com sidebar
apps/web/src/app/admin/page.tsx          # Dashboard
apps/web/src/app/admin/events/page.tsx   # Lista de eventos
apps/web/src/app/admin/events/new/page.tsx    # Criar evento
apps/web/src/app/admin/events/[id]/page.tsx   # Editar evento
```

### Semana 10-11: Hardening ✅ COMPLETA (90%)

```
37. ✅ Rate limiting global (ThrottlerGuard com short/medium/long limits)
38. ✅ Input validation (todos os DTOs)
39. ✅ Error handling (exception filters globais)
40. ⚠️ Unit tests: BetService, SettlementService, WalletService — parcial
41. ✅ Integration/E2E tests: webhooks, auth, health check
42. ✅ Logging estruturado (Pino com contexto)
43. ✅ Health check endpoints (/health, /health/live, /health/ready)
44. ⏳ Deploy staging

Arquivos criados (Hardening - 2026-02-18):
- apps/api/src/common/logger/ (LoggerModule, LoggerService)
- apps/api/src/common/interceptors/ (LoggingInterceptor)
- apps/api/src/modules/health/ (HealthModule, HealthController, MongoHealthIndicator)
- apps/api/test/ (E2E tests, setup, guia ngrok)
```

---

## Erros Comuns (Leia antes de codar)

**1. Race condition no saldo**

NUNCA faça `find → check → update` separado. Use `findOneAndUpdate` com `$inc` negativo e condição `balance >= amount` na query. Se retornar null, saldo insuficiente.

```tsx
// ❌ ERRADO (race condition)
const user = await User.findById(userId);
if (user.balance < amount) throw new Error('Insufficient');
user.balance -= amount;
await user.save();

// ✅ CERTO (atômico)
const user = await User.findOneAndUpdate(
  { _id: userId, balance: { $gte: amount } },
  { $inc: { balance: -amount } },
  { new: true }
);
if (!user) throw new Error('Insufficient balance');
```

**2. Webhook duplicado**

O NOWPayments pode enviar o mesmo webhook mais de uma vez. Sempre verifique se a Transaction já foi processada:

```tsx
// ✅ Idempotência
const existing = await Transaction.findOne({
  reference: webhookData.order_id,
  status: 'completed'
});
if (existing) return; // já processou, ignora
```

**3. Settlement parcial**

Se o settlement falhar no meio (ex: 3 de 5 vencedores receberam), os dados ficam inconsistentes. Use MongoDB sessions:

```tsx
const session = await mongoose.startSession();
session.startTransaction();
try {
  // todas as operações aqui
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**4. Odds = Infinity**

Se um outcome tem pool = 0, a divisão dá Infinity. Trate:

```tsx
function calculateOdds(totalPool: number, outcomePool: number): number {
  if (outcomePool === 0) return 0; // sem apostas ainda
  return Math.round((totalPool / outcomePool) * 100) / 100;
}
```

---

## Requisitos para Ativação dos Pagamentos em Produção

O sistema de pagamentos está **100% implementado no código**, mas requer configuração de credenciais e infraestrutura externa para funcionar.

### Checklist Completo

#### NOWPayments (PIX/Cartão/Crypto)

| Item | Como Obter | Variável |
|------|------------|----------|
| API Key | [account.nowpayments.io](https://account.nowpayments.io) → Store Settings → API Keys | `NOWPAYMENTS_API_KEY` |
| IPN Secret | IPN Settings → Generate | `NOWPAYMENTS_IPN_SECRET` |
| Webhook URL | Sua URL + `/wallet/webhook/nowpayments` | `NOWPAYMENTS_WEBHOOK_URL` |
| Payout Wallet | Seu endereço USDT TRC20 | `NOWPAYMENTS_PAYOUT_ADDRESS` |
| Payout Currency | `usdttrc20` (recomendado) | `NOWPAYMENTS_PAYOUT_CURRENCY` |

**Setup:**
1. Criar conta em [nowpayments.io](https://nowpayments.io)
2. Criar store no dashboard
3. Gerar API Key em Store Settings
4. IPN Settings → Gerar IPN Secret + Configurar Callback URL
5. Payout Settings → Configurar wallet USDT destino

**Funcionalidades:**
- ✅ Depósito PIX (Brasil)
- ✅ Depósito Cartão (Visa/MC, Apple Pay, Google Pay)
- ✅ Widget embedded (sem redirect)
- ✅ <€700 sem KYC
- ✅ Fee: 0.5-1%

#### 3. Infraestrutura

| Item | Desenvolvimento | Produção |
|------|-----------------|----------|
| **HTTPS** | ngrok/cloudflared | Certificado SSL real |
| **Webhook URL** | `https://xxx.ngrok.io/...` | `https://api.palpite.me/...` |
| **Wallet Crypto** | Testnet ou pessoal | Wallet corporativa USDT TRC20 |

#### 4. Testar Webhooks (Desenvolvimento)

```bash
# Instalar ngrok
npm install -g ngrok

# Expor API local
ngrok http 3001

# Copiar URL (ex: https://abc123.ngrok.io)
# Configurar como webhook no dashboard:
# - NOWPayments: https://abc123.ngrok.io/wallet/webhook/nowpayments
```

Ver guia detalhado em `apps/api/test/WEBHOOK_TESTING.md`.

### Funcionalidades NOWPayments

| Funcionalidade | Suporte |
|----------------|---------|
| Depósito Crypto | ✅ 200+ moedas |
| Depósito PIX | ✅ Brasil |
| Depósito Cartão | ✅ Global |
| Saque Crypto | ✅ Via Payouts API |
| KYC Usuário | <€700 isento |
| Fee | 0.5-1% |
| UX | Widget embedded |

### Arquitetura Resumida

```
┌─────────────────────────────────────────────────────┐
│                    ENTRADA                          │
├─────────────────┬─────────────────┬─────────────────┤
│     Crypto      │       PIX       │     Cartão      │
│  (NOWPayments)  │  (NOWPayments)  │  (NOWPayments)  │
│  Widget embed   │  Widget embed   │  Widget embed   │
│   0.5-1% fee    │   0.5-1% fee    │   0.5-1% fee    │
└────────┬────────┴────────┬────────┴────────┬────────┘
         │                 │                 │
         └────────────────┼─────────────────┘
                          ▼
              ┌───────────────────────┐
              │   SALDO INTERNO USD   │
              │   (stablecoin-based)  │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │        SAÍDA          │
              │   Crypto Only         │
              │   (NOWPayments)       │
              │   USDT/BTC/ETH/SOL    │
              └───────────────────────┘
```

---

## Links Úteis

- [NOWPayments Docs](https://nowpayments.io/doc) — API reference + On-Ramp widget
- [NOWPayments Dashboard](https://account.nowpayments.io) — API keys, IPN settings
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Polymarket](https://polymarket.com) — referência de UX
- [previsao.io](http://previsao.io) — clone de referência
- [Pigmo.com](http://Pigmo.com) — referência de arquitetura de pagamentos (engenharia reversa)

---

## Dúvidas?

Se travou em qualquer ponto, antes de assumir e codar errado:

1. Releia esta doc e a Tech Spec
2. Se a dúvida for de **negócio** (ex: como resolver um edge case de evento) → fala com o CEO
3. Se a dúvida for **técnica** (ex: como estruturar o settlement) → fala com o Tech Lead
4. Se a dúvida for de **implementação** (ex: como usar a API do NOWPayments) → consulta a doc do NOWPayments

**Melhor perguntar do que assumir errado.**