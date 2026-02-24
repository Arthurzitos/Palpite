# Prediction Market - Documentacao de Implementacao

> **Status:** MVP Ready (~98% Completo)
> **Data:** 2026-02-19
> **Stack:** NestJS + Next.js 14 + MongoDB + Redis

---

## Visao Geral

Plataforma de mercado de previsao onde usuarios apostam em resultados de eventos reais usando crypto. Clone da previsao.io com pagamentos via NOWPayments (PIX/Cartao/Crypto), sem KYC.

### Modelo de Negocios
- **Pari-Mutuel:** Todo mundo aposta num pool, odds calculadas pelo volume
- **Taxa:** 3% cobrada no settlement (✅ **IMPLEMENTADO** — configurável via PLATFORM_FEE_PERCENT)
- **Sem KYC:** Onboarding instantaneo

### Status de Implementacao (2026-02-19)

| Modulo | Backend | Frontend | Status |
|--------|---------|----------|--------|
| Auth | ✅ | ✅ | Completo |
| Events | ✅ | ✅ | Completo |
| Bets | ✅ | ✅ | Completo |
| Settlement | ✅ | N/A | Completo |
| **Rake/Taxa** | ✅ | ✅ | **Completo** |
| Wallet | ✅ | ✅ | Completo |
| Admin | ✅ | ✅ | Completo |
| Health Check | ✅ | N/A | Completo |
| Rate Limiting | ✅ | N/A | Completo |
| Logging | ✅ | N/A | Completo |
| Testes E2E | ✅ | N/A | Completo |

### Implementado nesta Sprint (2026-02-19)
- **Sistema de Rake/Taxa da Casa** (Fase 6):
  - RakeRecord e PlatformWallet schemas
  - RakeService com contabilização automática
  - Dedução de taxa no SettlementService
  - Endpoints /admin/revenue/* para estatísticas e saque
  - Página /admin/revenue com dashboard de receita
  - Hook useRevenue com Zustand
  - Card de receita no dashboard principal

### Implementado Anteriormente (2026-02-18)
- **Wallet Frontend**: Integração completa com endpoints backend
  - Depósito crypto via NOWPayments
  - Depósito PIX/Cartão via NOWPayments (widget embedded)
  - Saque crypto (múltiplas moedas e redes)
  - Histórico de transações em tempo real
  - Hook useWallet com Zustand
- **Admin Frontend**: Painel completo de gerenciamento
  - Dashboard com métricas
  - CRUD de eventos com filtros
  - Bloquear/resolver/cancelar eventos
  - Hook useAdmin com Zustand
- **Hardening (MVP Ready)**:
  - Rate limiting global com ThrottlerGuard (short/medium/long limits)
  - Logging estruturado com Pino (requests, transactions, webhooks, auth)
  - Health check endpoints (/health, /health/live, /health/ready)
  - Testes E2E para webhooks, auth e health check
  - Guia de testes com ngrok (test/WEBHOOK_TESTING.md)

### ❌ Pendente para Produção

📄 **Ver checklist completo:** [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

**Críticos (Bloqueia Lançamento):**
- KYB CCPayment (verificação de empresa)
- Deploy em hospedagem (Railway + Vercel)
- Domínio + SSL
- Testes E2E com webhooks reais (ngrok)
- Termos de Uso e Política de Privacidade

**Infraestrutura:**
- Dockerfiles para API e Web
- CI/CD Pipeline (GitHub Actions)
- MongoDB Atlas (cloud)
- Redis Upstash (cloud)
- Sentry (error tracking)

**Funcionalidades Opcionais:**
- Mobile responsive (parcial)
- Real-time updates (Socket.io/polling)
- Email notifications

### ✅ Recém Implementado
- **Polling Fallback**: PaymentPollingService para verificar pagamentos pendentes automaticamente (a cada 5 min)

---

## Stack Tecnica

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Frontend | Next.js 14 (App Router) + Tailwind + Shadcn/ui | SSR, SEO, componentes prontos |
| Backend | NestJS + TypeScript | Framework enterprise, modular |
| Database | MongoDB (Mongoose) | Flexibilidade para schemas variaveis |
| Cache/Queue | Redis + BullMQ | Cache de odds, filas de settlement |
| Payments | NOWPayments API | PIX, Cartão, Crypto |
| Payments (Fiat) | NOWPayments On-Ramp | PIX + Cartao, <700 EUR sem KYC |
| Auth | JWT + Refresh Token | Simples, sem KYC |
| Deploy | Vercel (front) + Railway (back) | Custo baixo |

---

## Estrutura do Monorepo

```
/prediction-market
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Login, registro, JWT, guards
│   │   │   │   ├── users/      # CRUD usuarios, balance
│   │   │   │   ├── events/     # CRUD eventos, outcomes, odds
│   │   │   │   ├── bets/       # Criar aposta, settlement
│   │   │   │   ├── wallet/     # ✅ Deposito, saque, webhooks (NOWPayments)
│   │   │   │   ├── transactions/ # Ledger, historico
│   │   │   │   ├── admin/      # Painel admin, metricas
│   │   │   │   └── health/     # ✅ Health check endpoints
│   │   │   ├── common/
│   │   │   │   ├── guards/     # AuthGuard, AdminGuard
│   │   │   │   ├── filters/    # Exception filters
│   │   │   │   ├── interceptors/ # ✅ Logging interceptor
│   │   │   │   ├── logger/     # ✅ Pino structured logging
│   │   │   │   ├── decorators/
│   │   │   │   └── pipes/
│   │   │   ├── config/         # Env validation, configs
│   │   │   ├── database/       # Mongoose connection, schemas
│   │   │   └── main.ts
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── (public)/   # Landing, login, register
│       │   │   ├── (app)/      # Rotas autenticadas
│       │   │   ├── admin/      # Rotas admin
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   │   ├── ui/         # Shadcn/ui components
│       │   │   ├── layout/     # Header, Footer, Sidebar
│       │   │   ├── events/     # EventCard, EventGrid
│       │   │   ├── bets/       # BetForm, BetHistory
│       │   │   ├── wallet/     # DepositModal, WithdrawModal
│       │   │   └── admin/      # EventForm, ResolveModal
│       │   ├── hooks/          # useAuth, useBalance, useEvents
│       │   ├── lib/            # API client, utils
│       │   └── types/
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── shared/                 # Tipos e constantes compartilhados
│       ├── src/
│       │   ├── types/          # User, Event, Bet, Transaction
│       │   ├── constants/      # Categories, statuses, limits
│       │   └── utils/          # Formatters, validators
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml          # MongoDB + Redis
├── package.json                # Workspaces root
├── tsconfig.base.json
└── README.md
```

---

## Data Models

### User
```typescript
interface User {
  _id: ObjectId
  email: string
  passwordHash: string
  username: string
  role: 'user' | 'admin'
  balance: number          // saldo em USD
  totalDeposited: number
  totalWithdrawn: number
  totalWagered: number
  totalWon: number
  createdAt: Date
  updatedAt: Date
}
```

### Event (Mercado)
```typescript
interface Event {
  _id: ObjectId
  title: string             // "Bitcoin 09/02: sobe ou desce?"
  description: string
  category: EventCategory   // SPORTS | CRYPTO | POLITICS | ENTERTAINMENT | OTHER
  imageUrl?: string
  status: EventStatus       // OPEN | LOCKED | RESOLVED | CANCELLED
  outcomes: Outcome[]       // Array de resultados possiveis
  totalPool: number         // Total apostado no evento
  resolvedOutcomeId?: string
  resolutionSource?: string
  startsAt?: Date
  closesAt: Date
  resolvedAt?: Date
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

interface Outcome {
  _id: ObjectId
  label: string             // "Sim", "Nao", "Flamengo"
  totalPool: number         // Total apostado neste outcome
  odds: number              // Event.totalPool / Outcome.totalPool
  color?: string
}
```

### Bet (Aposta)
```typescript
interface Bet {
  _id: ObjectId
  userId: ObjectId
  eventId: ObjectId
  outcomeId: ObjectId
  amount: number
  oddsAtPurchase: number
  potentialPayout: number
  status: BetStatus         // ACTIVE | WON | LOST | REFUNDED
  payout: number
  createdAt: Date
  settledAt?: Date
}
```

### Transaction (Ledger)
```typescript
interface Transaction {
  _id: ObjectId
  userId: ObjectId
  type: TransactionType     // DEPOSIT | WITHDRAWAL | BET | PAYOUT | REFUND | FEE
  amount: number
  balanceBefore: number
  balanceAfter: number
  reference?: string
  metadata?: Record<string, any>
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}
```

### Enums
```typescript
enum EventCategory {
  SPORTS = 'sports'
  CRYPTO = 'crypto'
  POLITICS = 'politics'
  ENTERTAINMENT = 'entertainment'
  OTHER = 'other'
}

enum EventStatus {
  OPEN = 'open'
  LOCKED = 'locked'
  RESOLVED = 'resolved'
  CANCELLED = 'cancelled'
}

enum BetStatus {
  ACTIVE = 'active'
  WON = 'won'
  LOST = 'lost'
  REFUNDED = 'refunded'
}

enum TransactionType {
  DEPOSIT = 'deposit'
  WITHDRAWAL = 'withdrawal'
  BET = 'bet'
  PAYOUT = 'payout'
  REFUND = 'refund'
  FEE = 'fee'
}
```

---

## API Endpoints

### Auth
| Method | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /auth/register | Criar conta |
| POST | /auth/login | Login -> JWT + Refresh Token |
| POST | /auth/refresh | Renovar access token |
| GET | /auth/me | Dados do usuario logado |

### Events
| Method | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /events | Listar eventos |
| GET | /events/:id | Detalhes do evento + odds |
| GET | /events/featured | Eventos em destaque |
| GET | /events/categories | Categorias com contagem |

### Bets
| Method | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /bets | Criar aposta |
| GET | /bets/my | Minhas apostas |
| GET | /bets/my/stats | Estatisticas |

### Wallet
| Method | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /wallet/balance | Saldo atual |
| POST | /wallet/deposit/crypto | Checkout NOWPayments |
| POST | /wallet/deposit/fiat | Widget NOWPayments |
| POST | /wallet/withdraw | Solicitar saque |
| GET | /wallet/transactions | Historico |
| POST | /wallet/webhook/nowpayments | Webhook NOWPayments |
| POST | /wallet/webhook/nowpayments | Webhook NOWPayments |

### Admin
| Method | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /admin/events | Criar evento |
| PATCH | /admin/events/:id | Editar evento |
| POST | /admin/events/:id/resolve | Resolver evento |
| POST | /admin/events/:id/cancel | Cancelar evento |
| GET | /admin/dashboard | Metricas gerais |
| GET | /admin/users | Listar usuarios |

---

## Odds Engine (Pari-Mutuel)

### Formula
```
Odds do Outcome X = Total Pool do Evento / Pool do Outcome X
```

### Exemplo
```
Evento: "Flamengo vs Lanus"
Total apostado: $10.000
Pool Flamengo: $7.000
Pool Lanus: $3.000

Odds Flamengo: 10000/7000 = 1.43x
Odds Lanus: 10000/3000 = 3.33x

Se apostar $100 em Lanus e Lanus vencer:
Payout = $100 * 3.33 = $333
```

### Settlement (Resolucao)
```
1. Admin resolve evento -> seleciona outcome vencedor
2. Event.status -> RESOLVED
3. Calcula taxa: totalPool * 3%
4. Pool distribuivel = totalPool - taxa
5. Para cada bet no outcome VENCEDOR:
   -> payout = (bet.amount / winnerPool) * poolDistribuivel
   -> user.balance += payout
   -> bet.status -> WON
6. Para cada bet nos outcomes PERDEDORES:
   -> bet.status -> LOST
7. Cria Transaction(type: FEE) para plataforma
```

### Edge Cases
- Evento cancelado: Refund integral, sem taxa
- Ninguem apostou no vencedor: Refund total
- So 1 outcome tem apostas: Refund
- Settlement falha no meio: MongoDB transactions (tudo ou nada)

---

## Fluxo de Pagamentos

### Arquitetura de Pagamentos
```
ENTRADA (via NOWPayments):
├── Crypto -> Zero KYC
├── PIX (Brasil) -> Low-KYC (<700 EUR)
└── Cartao -> Low-KYC

INTERNAMENTE: Saldo em USD (unico)

SAIDA:
└── Crypto (via NOWPayments Payouts)
```

### Deposito PIX/Cartao/Crypto (NOWPayments)
```
1. Usuario clica "Depositar via PIX"
2. Frontend abre widget NOWPayments embedded
3. Usuario paga via PIX (QR code)
4. NOWPayments converte BRL -> USDT
5. NOWPayments envia webhook
6. Backend verifica HMAC SHA-512
7. Credita saldo em USD (1:1 com USDT)
```

### Verificacao de Webhooks
```typescript
// NOWPayments (HMAC SHA-512)
const sortedBody = JSON.stringify(body, Object.keys(body).sort())
const expectedSig = HMAC_SHA512(sortedBody, IPN_SECRET)
if (receivedSig !== expectedSig) REJECT
```

---

## Variaveis de Ambiente

### Backend (apps/api/.env.example)
```env
# APP
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# DATABASE
MONGODB_URI=mongodb://localhost:27017/prediction-market
REDIS_URL=redis://localhost:6379

# AUTH
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outra-chave-secreta
JWT_REFRESH_EXPIRES_IN=7d

# CCPAYMENT
CCPAYMENT_APP_ID=seu-app-id
CCPAYMENT_APP_SECRET=seu-app-secret
CCPAYMENT_WEBHOOK_URL=https://api.palpite.me/api/wallet/webhook

# NOWPAYMENTS
NOWPAYMENTS_API_KEY=seu-api-key
NOWPAYMENTS_IPN_SECRET=seu-ipn-secret
NOWPAYMENTS_WEBHOOK_URL=https://api.palpite.me/api/wallet/webhook/nowpayments
NOWPAYMENTS_PAYOUT_ADDRESS=sua-wallet-usdt
NOWPAYMENTS_PAYOUT_CURRENCY=usdttrc20

# PLATFORM
PLATFORM_FEE_PERCENT=3
MIN_BET_AMOUNT=1
MAX_BET_AMOUNT=10000
MIN_DEPOSIT_AMOUNT=5
MIN_WITHDRAWAL_AMOUNT=10
```

### Frontend (apps/web/.env.example)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=PredictionMarket
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Docker Compose

```yaml
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

## Scripts Disponiveis

### Root (monorepo)
| Script | Comando | Descricao |
|--------|---------|-----------|
| Dev all | `npm run dev` | Front + back simultaneamente |
| Build all | `npm run build` | Build de producao |
| Lint all | `npm run lint` | ESLint em todos workspaces |
| Type check | `npm run typecheck` | tsc --noEmit |
| Clean | `npm run clean` | Remove node_modules e dist |

### Backend (apps/api)
| Script | Comando | Descricao |
|--------|---------|-----------|
| Dev | `npm run dev -w apps/api` | NestJS watch mode (3001) |
| Build | `npm run build -w apps/api` | Compila para dist |
| Seed | `npm run seed -w apps/api` | Popula DB com dados teste |
| Test | `npm run test -w apps/api` | Jest unit tests |

### Frontend (apps/web)
| Script | Comando | Descricao |
|--------|---------|-----------|
| Dev | `npm run dev -w apps/web` | Next.js dev (3000) |
| Build | `npm run build -w apps/web` | Build producao |
| Lint | `npm run lint -w apps/web` | ESLint |

---

## Roadmap de Desenvolvimento

### Fase 1: Fundacao (Semana 1-2) ✅ COMPLETA
- [x] Setup monorepo (npm workspaces)
- [x] Docker Compose (Mongo + Redis)
- [x] NestJS boilerplate (config, env, CORS, helmet)
- [x] Mongoose connection + schemas (User, Transaction)
- [x] Auth module (register, login, JWT, refresh, guards)
- [x] Next.js boilerplate (layout, Tailwind, Shadcn)
- [x] Pages: login, register
- [x] Seed script

### Fase 2: Core (Semana 3-5) ✅ COMPLETA
- [x] Event schema + CRUD
- [x] Outcome schema (embedded)
- [x] Odds calculation service
- [x] Bet schema + create endpoint
- [x] Balance deduction atomica
- [x] Odds recalculation
- [x] Settlement service
- [x] Cancel event (refund)
- [x] Frontend: markets page
- [x] Frontend: event detail
- [x] Frontend: dashboard

### Fase 3: Pagamentos (Semana 6-7) ✅ COMPLETA

**Backend (Completo):**
- [x] CcpaymentService: checkout URL, withdraw, webhook SHA-256
- [x] NowPaymentsService: invoice, webhook HMAC SHA-512
- [x] WalletService: orquestra deposito/saque com transacoes atomicas
- [x] WalletController: 7 endpoints (balance, deposit crypto/fiat, withdraw, webhooks)
- [x] DTOs com validacao (deposit-crypto, deposit-fiat, withdraw)
- [x] Idempotencia nos webhooks (verifica reference existente)
- [x] rawBody habilitado no main.ts para verificacao de assinatura

**Frontend (Pendente):**
- [x] Wallet page UI (estrutura pronta)
- [ ] Integracao com endpoints de deposito/saque
- [ ] Widget NOWPayments embedded no modal de PIX/Cartao
- [ ] Testes E2E com ngrok

### Fase 4: Admin + Polish (Semana 8-9) ✅ COMPLETA
- [x] Admin guard + routes (backend)
- [x] Admin: criar evento (backend)
- [x] Admin: resolver evento (backend)
- [x] Admin: dashboard metricas (backend)
- [x] Admin: paginas frontend
- [x] Landing page
- [ ] Mobile responsive (parcial)
- [x] Loading states, error handling
- [ ] Toast notifications (parcial)

### Fase 5: Hardening (Semana 10-11) ✅ COMPLETA (95%)
- [x] Rate limiting (ThrottlerGuard)
- [x] Input validation
- [x] Error handling global
- [ ] Unit tests (parcial)
- [x] Integration tests (E2E)
- [x] Logging estruturado (Pino)
- [x] Health check (/health, /health/live, /health/ready)
- [x] Polling fallback para pagamentos pendentes
- [ ] Deploy staging

---

## Padroes de Codigo

### TypeScript
- Strict mode obrigatorio
- Zero `any` - usar `unknown` se necessario
- Tipos explicitos em parametros
- Arquivos max 300 linhas

### NestJS
- 1 controller por recurso
- Logica de negocio SEMPRE no service
- DTOs com class-validator
- Guards para autenticacao

### React/Next.js
- Server Components por padrao
- Client Components apenas quando necessario
- Custom hooks para logica reutilizavel
- Componentes max 150 linhas
- Tailwind para estilos

### Naming
```
// Arquivos
user.service.ts          // kebab-case (NestJS)
EventCard.tsx            // PascalCase (React)
use-balance.ts           // kebab-case (hooks)

// Variaveis e funcoes
const userName = ''      // camelCase
function getUserById() {}

// Classes e interfaces
class BetService {}
interface EventData {}

// Constantes
const MAX_BET_AMOUNT = 10000  // UPPER_SNAKE_CASE
```

### Git Commits
```bash
feat(auth): add JWT login and registration
feat(events): create event CRUD with odds calculation
fix(bets): fix race condition in balance deduction
refactor(settlement): extract payout calculator
test(bets): add unit tests for settlement engine
docs(readme): update setup instructions
```

---

## Erros Comuns a Evitar

### 1. Race Condition no Saldo
```typescript
// ERRADO
const user = await User.findById(userId);
if (user.balance < amount) throw new Error('Insufficient');
user.balance -= amount;
await user.save();

// CERTO (atomico)
const user = await User.findOneAndUpdate(
  { _id: userId, balance: { $gte: amount } },
  { $inc: { balance: -amount } },
  { new: true }
);
if (!user) throw new Error('Insufficient balance');
```

### 2. Webhook Duplicado
```typescript
// Idempotencia
const existing = await Transaction.findOne({
  reference: webhookData.order_id,
  status: 'completed'
});
if (existing) return; // ja processou
```

### 3. Settlement Parcial
```typescript
// Usar MongoDB sessions
const session = await mongoose.startSession();
session.startTransaction();
try {
  // todas operacoes aqui
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 4. Odds = Infinity
```typescript
function calculateOdds(totalPool: number, outcomePool: number): number {
  if (outcomePool === 0) return 0;
  return Math.round((totalPool / outcomePool) * 100) / 100;
}
```

---

## Quick Start

### Pre-requisitos
- Node.js >= 20.x
- npm >= 10.x
- Docker + Docker Compose
- Git

### 1. Clonar e instalar
```bash
git clone <repo>
cd prediction-market
npm install
```

### 2. Subir infra local
```bash
docker compose up -d
```

### 3. Configurar ambiente
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Rodar seed
```bash
npm run seed -w apps/api
```

### 5. Iniciar dev
```bash
# Terminal 1
npm run dev -w apps/api    # localhost:3001

# Terminal 2
npm run dev -w apps/web    # localhost:3000
```

---

## Requisitos para Ativação dos Pagamentos em Produção

O sistema de pagamentos está **100% implementado no código**. Para ativar em produção, configure:

### NOWPayments (PIX/Cartão/Crypto)

| Variável | Onde Obter |
|----------|------------|
| `NOWPAYMENTS_API_KEY` | [account.nowpayments.io](https://account.nowpayments.io) → Store Settings |
| `NOWPAYMENTS_IPN_SECRET` | IPN Settings → Generate |
| `NOWPAYMENTS_WEBHOOK_URL` | Sua URL + `/wallet/webhook/nowpayments` |
| `NOWPAYMENTS_PAYOUT_ADDRESS` | Seu endereço USDT TRC20 |

**Setup:** Criar conta → Store → API Key → IPN Secret → Wallet destino

### 3. Infraestrutura

| Ambiente | Webhook URL |
|----------|-------------|
| Dev | `ngrok http 3001` → usar URL gerada |
| Prod | `https://api.palpite.me/...` com SSL |

### Teste Local com ngrok

```bash
npm install -g ngrok
ngrok http 3001
# Usar URL gerada nos dashboards dos gateways
```

Ver detalhes completos em `apps/api/test/WEBHOOK_TESTING.md`.

---

## Links Uteis

- [NOWPayments Docs](https://nowpayments.io/doc)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
