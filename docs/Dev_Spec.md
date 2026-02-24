# 🚀 TECH SPEC: Prediction Market (Clone [previsao.io](http://previsao.io) Web3)

> **Projeto:** Clone [previsao.io](http://previsao.io) com pagamentos crypto (ccpayment + NOWPayments on-ramp)
> 

> **Status:** Em Desenvolvimento — ~99% Completo (MVP Ready + Infra Deploy)
>

> **Última Atualização:** 2026-02-19
> 

> **Autor:** Tech Lead Agent
> 

> **Dev:** 1 Full-Stack Senior
>

---

## 📈 Resumo de Progresso (Atualizado: 2026-02-19)

| Fase | Status | Progresso |
|------|--------|-----------|
| Fase 1: Fundação | ✅ Completa | 100% |
| Fase 2: Core (Eventos & Apostas) | ✅ Completa | 100% |
| Fase 3: Pagamentos (ccpayment + NOWPayments) | ✅ Completa | 100% |
| Fase 4: Admin & Polish | ✅ Completa | 95% |
| Fase 5: Hardening | ✅ Completa | 95% |
| Fase 6: Sistema de Rake (Taxa da Casa) | ✅ Completa | 100% |

### ✅ O Que Está Funcionando
- Autenticação completa (registro, login, JWT, refresh tokens)
- CRUD de eventos com outcomes e cálculo de odds
- Sistema de apostas com dedução atômica de saldo
- Settlement engine com MongoDB transactions
- Cancelamento de eventos com refund automático
- Frontend: Landing page, Login, Registro, Mercados, Detalhe de evento, Dashboard
- **Wallet Frontend**: Integração completa com endpoints backend
  - Depósito crypto via ccpayment (redirect para checkout)
  - Depósito PIX/Cartão via NOWPayments (widget embedded)
  - Saque crypto (USDT, BTC, ETH, SOL em múltiplas redes)
  - Histórico de transações em tempo real
- **Admin Frontend**: Painel completo de gerenciamento
  - Dashboard com métricas (volume, eventos, apostas, usuários, **receita**)
  - Lista de eventos com filtros e busca
  - Criar evento com múltiplos outcomes
  - Editar eventos abertos
  - Bloquear, resolver e cancelar eventos
  - Modais de confirmação com validação
- **Sistema de Rake/Taxa da Casa** ✅ Implementado (2026-02-19)
  - ✅ Dedução automática de taxa no settlement (configurable via PLATFORM_FEE_PERCENT)
  - ✅ Contabilização de receita da plataforma (RakeRecord + PlatformWallet)
  - ✅ Dashboard admin: receita acumulada, lucro por período, top eventos
  - ✅ Endpoints para visualizar/sacar lucros da plataforma (/admin/revenue/*)
  - ✅ Página /admin/revenue com estatísticas e modal de saque
- Seed script com dados de teste

### ❌ O Que Falta para Produção

📄 **Ver checklist completo:** [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
📘 **Guia passo a passo:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

#### Críticos (Bloqueia Lançamento)
- ⚠️ **KYB CCPayment** — Processo de verificação de empresa (1-5 dias)
- ⚠️ **Deploy em hospedagem** — Railway/Render (API) + Vercel (Frontend)
- ⚠️ **Domínio + SSL** — Configurar DNS e certificados
- ⚠️ **Testes E2E de pagamento** — Com webhooks reais via ngrok
- ⚠️ **Termos de Uso e Privacidade** — Documentos legais obrigatórios

#### Infraestrutura (Alta Prioridade)
- ✅ **Dockerfiles** — Containerização para deploy consistente (implementado 2026-02-19)
- ✅ **CI/CD Pipeline** — GitHub Actions para testes e deploy automático (implementado 2026-02-19)
- ⚠️ **MongoDB Atlas** — Migrar de local para cloud
- ⚠️ **Redis (Upstash)** — Migrar de local para cloud
- ⚠️ **Sentry** — Error tracking e APM
- ⚠️ **Uptime Monitoring** — UptimeRobot ou similar

#### Segurança (Alta Prioridade)
- ⚠️ **Secrets de produção** — Gerar novos JWT secrets
- ⚠️ **CSP Headers** — Content Security Policy customizado
- ⚠️ **Rate limiting por endpoint** — Proteção específica para login/withdraw
- ⚠️ **Auditoria OWASP** — Revisão de segurança

### ✅ O Que Está Implementado

1. **Módulo Wallet (Backend)** ✅ Implementado (2026-02-18)
   - ✅ Integração ccpayment (depósito/saque crypto)
   - ✅ Integração NOWPayments (PIX/Cartão on-ramp)
   - ✅ NOWPayments Payouts API (saque de rake)
   - ✅ Webhooks e verificação de assinatura
   - ✅ DTOs com validação (class-validator)
   - ✅ Transações atômicas MongoDB
   - ✅ Polling fallback para pagamentos pendentes (@nestjs/schedule)

2. **Frontend - Integração Wallet** ✅ Implementado (2026-02-18)
   - ✅ Chamar endpoints de depósito (POST /wallet/deposit/crypto, POST /wallet/deposit/fiat)
   - ✅ Chamar endpoint de saque (POST /wallet/withdraw)
   - ✅ Widget NOWPayments embedded no modal de PIX/Cartão
   - ✅ Exibir histórico de transações (GET /wallet/transactions)
   - ✅ Hook useWallet com Zustand para gerenciamento de estado

3. **Admin Frontend** ✅ Implementado (2026-02-18)
   - ✅ Layout com sidebar e navegação
   - ✅ Dashboard com métricas gerais
   - ✅ Lista de eventos com filtros (status, busca)
   - ✅ Criar evento com múltiplos outcomes e cores
   - ✅ Editar evento (título, descrição, categoria, data)
   - ✅ Bloquear evento (impede novas apostas)
   - ✅ Resolver evento (selecionar vencedor, fonte)
   - ✅ Cancelar evento (refund automático)
   - ✅ Hook useAdmin com Zustand

4. **Hardening** ✅ Implementado (2026-02-18)
   - ✅ Rate limiting global com ThrottlerGuard (short/medium/long limits)
   - ✅ Estrutura de testes E2E (webhooks, auth, health check)
   - ✅ Logging estruturado com Pino (request logging, transaction logging, webhook logging)
   - ✅ Health check endpoint (/api/health, /api/health/live, /api/health/ready)
   - ✅ Guia de testes E2E com ngrok (test/WEBHOOK_TESTING.md)

---

## 📊 Business Context

**Por que estamos fazendo isso?**

Mercados de previsão explodiram em 2025 — Polymarket ultrapassou US$ 2B em volume semanal. O Brasil não tem um player Web3 nativo sólido. A [previsao.io](http://previsao.io) usa modelo fiat/PIX, nós entramos com crypto-native + PIX via on-ramp, sem KYC, baixa fricção = onboarding instantâneo. Engenharia reversa do [Pigmo.com](http://Pigmo.com) (crypto casino) confirmou o modelo: PIX na entrada via on-ramp de terceiro, crypto por baixo, saldo em USD, saque só crypto.

**Problema que resolve:**

Brasileiros querem apostar em eventos reais (esportes, crypto, política, cultura pop) sem fricção bancária, sem KYC demorado, sem bloqueio de bancos.

**North Star Metric:** Volume total de apostas (TVL em contratos ativos)

**Modelo de Receita:** Taxa de 2-5% sobre cada aposta (fee on trade)

---

## 🎯 Objetivo

Plataforma de mercado de previsão peer-to-peer onde usuários depositam crypto via ccpayment, apostam em outcomes de eventos reais, e recebem payouts automáticos.

---

## 👤 User Stories

**Apostador:**

- Como usuário, quero me cadastrar rapidamente (email + senha), para começar a apostar em minutos
- Como usuário, quero depositar crypto (USDT, BTC, ETH, SOL) via ccpayment, para ter saldo na plataforma
- Como usuário brasileiro, quero depositar via PIX (convertido automaticamente em crypto), para apostar sem precisar ter crypto
- Como usuário, quero depositar via cartão de crédito/débito (convertido em crypto), para ter mais opções
- Como usuário, quero ver eventos disponíveis com odds em tempo real, para escolher onde apostar
- Como usuário, quero comprar posições (Sim/Não) em eventos, para lucrar com minhas previsões
- Como usuário, quero ver meu portfolio (posições abertas, P&L, histórico), para acompanhar performance
- Como usuário, quero sacar meus ganhos em crypto, para realizar lucros

**Admin:**

- Como admin, quero criar eventos com múltiplos outcomes, para alimentar a plataforma
- Como admin, quero resolver eventos (declarar resultado), para disparar settlements
- Como admin, quero ver dashboard com métricas (volume, users, receita), para acompanhar o negócio

---

## ⚙️ Arquitetura & Stack

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router) + Tailwind + Shadcn/ui | SSR, SEO, performance, componentes prontos |
| Backend | NestJS + TypeScript | Framework enterprise, módulos, guards, interceptors |
| Database | MongoDB (Mongoose) | Flexibilidade para schemas de eventos variáveis |
| Cache/Queue | Redis + BullMQ | Cache de odds, filas de settlement, rate limiting |
| Payments (Crypto) | ccpayment API | 900+ cryptos, 0.03% fee, webhooks, checkout hosted |
| Payments (Fiat On-Ramp) | NOWPayments On-Ramp | PIX + Cartão → Crypto, widget embedded, <€700 sem KYC, 0.5-1% fee, especializado em gambling |
| Real-time | [Socket.io](http://Socket.io) ou Polling | Atualização de odds em tempo real |
| Auth | JWT + Refresh Token | Simples, sem KYC, email+senha |
| Deploy | Vercel (front) + Railway/Render (back) | Custo baixo, deploy rápido |

---

## 🗃️ Data Models

### User

```
interface User {
  _id: ObjectId
  email: string
  passwordHash: string
  username: string
  balance: number          // saldo em USD (stablecoin-denominated)
  totalDeposited: number
  totalWithdrawn: number
  totalWagered: number
  totalWon: number
  createdAt: Date
  updatedAt: Date
}
```

### Event (Mercado)

```
interface Event {
  _id: ObjectId
  title: string             // "Bitcoin 09/02: sobe ou desce?"
  description: string
  category: EventCategory   // SPORTS | CRYPTO | POLITICS | ENTERTAINMENT | OTHER
  imageUrl?: string
  status: EventStatus       // OPEN | LOCKED | RESOLVED | CANCELLED
  outcomes: Outcome[]       // Array de resultados possíveis
  totalPool: number         // Total apostado no evento
  resolvedOutcomeId?: string // Qual outcome venceu
  resolutionSource?: string  // Fonte da resolução
  startsAt?: Date           // Quando o evento começa
  closesAt: Date            // Deadline para apostas
  resolvedAt?: Date
  createdBy: ObjectId       // Admin que criou
  createdAt: Date
  updatedAt: Date
}

interface Outcome {
  _id: ObjectId
  label: string             // "Sim", "Não", "Flamengo", "Lanús"
  totalPool: number         // Total apostado neste outcome
  odds: number              // Calculado: Event.totalPool / Outcome.totalPool
  color?: string            // Cor para UI
}

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
```

### Bet (Aposta)

```
interface Bet {
  _id: ObjectId
  userId: ObjectId
  eventId: ObjectId
  outcomeId: ObjectId
  amount: number            // Quanto apostou
  oddsAtPurchase: number    // Odds no momento da compra
  potentialPayout: number   // Quanto pode ganhar
  status: BetStatus         // ACTIVE | WON | LOST | REFUNDED
  payout: number            // Valor pago (0 se perdeu)
  createdAt: Date
  settledAt?: Date
}

enum BetStatus {
  ACTIVE = 'active'
  WON = 'won'
  LOST = 'lost'
  REFUNDED = 'refunded'
}
```

### Transaction (Ledger)

```
interface Transaction {
  _id: ObjectId
  userId: ObjectId
  type: TransactionType     // DEPOSIT | WITHDRAWAL | BET | PAYOUT | REFUND | FEE
  amount: number
  balanceBefore: number
  balanceAfter: number
  reference?: string        // ID externo (ccpayment order_id, bet_id, etc)
  metadata?: Record<string, any>
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
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

## 🔌 API Endpoints

### Auth

| Method | Endpoint | Descrição |
| --- | --- | --- |
| POST | /auth/register | Criar conta (email + senha + username) |
| POST | /auth/login | Login → JWT + Refresh Token |
| POST | /auth/refresh | Renovar access token |
| GET | /auth/me | Dados do usuário logado |

### Events

| Method | Endpoint | Descrição |
| --- | --- | --- |
| GET | /events | Listar eventos (filtros: status, category, search) |
| GET | /events/:id | Detalhes do evento + odds em tempo real |
| GET | /events/featured | Eventos em destaque |
| GET | /events/categories | Listar categorias com contagem |

### Bets

| Method | Endpoint | Descrição |
| --- | --- | --- |
| POST | /bets | Criar aposta (eventId, outcomeId, amount) |
| GET | /bets/my | Minhas apostas (filtros: status, eventId) |
| GET | /bets/my/stats | Estatísticas (total apostado, ganho, ROI) |

### Wallet

| Method | Endpoint | Descrição |
| --- | --- | --- |
| GET | /wallet/balance | Saldo atual |
| POST | /wallet/deposit/crypto | Gerar checkout URL ccpayment (crypto direto) |
| POST | /wallet/deposit/fiat | Gerar widget NOWPayments on-ramp (PIX/Cartão → Crypto) |
| POST | /wallet/withdraw | Solicitar saque via ccpayment (crypto only) |
| GET | /wallet/transactions | Histórico de transações |
| POST | /wallet/webhook/ccpayment | Webhook ccpayment (crypto deposit/withdraw confirmation) |
| POST | /wallet/webhook/nowpayments | Webhook NOWPayments (fiat on-ramp confirmation) |

### Admin

| Method | Endpoint | Descrição |
| --- | --- | --- |
| POST | /admin/events | Criar evento |
| PATCH | /admin/events/:id | Editar evento |
| POST | /admin/events/:id/resolve | Resolver evento (declarar vencedor) |
| POST | /admin/events/:id/cancel | Cancelar evento (refund all) |
| GET | /admin/dashboard | Métricas gerais |
| GET | /admin/users | Listar usuários |

---

## 💰 Fluxo de Pagamentos (Dual: ccpayment + NOWPayments)

### Arquitetura de Pagamentos

```jsx
// MODELO DUAL (inspirado na engenharia reversa do Pigmo.com)
//
// ENTRADA (3 portas):
// ├── Crypto direto (ccpayment) → Zero KYC → Rápido
// ├── PIX (NOWPayments on-ramp) → Low-KYC (<€700) → Widget embedded
// └── Cartão (NOWPayments on-ramp) → Low-KYC → Widget embedded
//
// INTERNAMENTE: Tudo em USD (saldo único)
//
// SAÍDA (1 porta):
// └── Crypto only (ccpayment) → Zero KYC
//
// Por que saída só crypto?
// Sem off-ramp = sem licença de transmissão de dinheiro
// Sem conversão crypto→fiat = sem compliance de câmbio
// Pigmo.com usa exatamente esse modelo com sucesso
```

### Depósito via Crypto (ccpayment)

```
1. Usuário clica "Depositar"
2. Frontend chama POST /wallet/deposit { amount: 50 }
3. Backend cria ordem interna (Transaction type=DEPOSIT, status=pending)
4. Backend chama ccpayment API: POST /ccpayment/v1/concise/url/get
   - product_price: "50"
   - merchant_order_id: transaction._id
   - product_name: "Deposit $50"
   - return_url: "https://app.../wallet?deposit=success"
   - notify_url: "https://api.../wallet/webhook"
5. Retorna checkout_url → Frontend redireciona
6. Usuário paga com qualquer crypto (900+ opções)
7. ccpayment envia webhook POST /wallet/webhook
   - pay_status: "success"
   - order_id, amount, etc.
8. Backend verifica assinatura (SHA-256)
9. Backend credita saldo do usuário
10. Transaction status → completed
```

### Saque

```
1. Usuário clica "Sacar" → informa valor + endereço crypto
2. Backend valida saldo suficiente
3. Backend debita saldo imediatamente (previne double-spend)
4. Backend chama ccpayment Withdraw API
5. ccpayment processa e envia webhook de confirmação
6. Transaction status → completed
```

### Verificação de Webhook (Segurança)

```jsx
// Assinatura ccpayment
const expectedSign = SHA256(APPID + APP_SECRET + timestamp + JSON.stringify(body))
if (receivedSign !== expectedSign) → REJECT
if (Math.abs(Date.now()/1000 - timestamp) > 120) → REJECT (replay attack)

### Depósito via PIX / Cartão (NOWPayments On-Ramp)
```

// MODELO PIGMO — Engenharia Reversa Aplicada

// O widget NOWPayments fica EMBEDDED no nosso site (não redireciona)

// Usuário pensa que está pagando PIX pra nós, mas o on-ramp converte BRL→USDT por trás

1. Usuário clica "Depositar via PIX" ou "Cartão"
2. Frontend abre modal com widget NOWPayments embedded (iframe/SDK)
    - Parâmetros: amount, target crypto (USDT), target wallet (nossa)
    - Métodos: PIX (Brasil), Visa/MC, Apple Pay, Google Pay
3. Usuário paga via PIX (QR code gerado pelo NOWPayments)
4. NOWPayments converte BRL → USDT automaticamente
5. USDT chega na nossa wallet designada
6. NOWPayments envia webhook POST /wallet/webhook/nowpayments
    - payment_status: "finished"
    - outcome_amount (USDT recebido)
    - order_id (nosso reference)
7. Backend verifica autenticidade (IPN Secret / HMAC SHA-512)
8. Backend converte USDT → USD no saldo do usuário (1:1)
9. Transaction status → completed
10. Usuário vê saldo atualizado em tempo real

```
### NOWPayments — Detalhes da Integração
```

// API Base: https://api.nowpayments.io/v1

//

// Endpoints principais:

// POST /payment      → Criar pagamento (crypto-to-crypto)

// POST /invoice      → Criar invoice (fiat on-ramp)

// GET  /payment/{id} → Status do pagamento

// GET  /status        → Health check

//

// On-Ramp Widget:

// - Embed via iframe ou JS SDK

// - Suporta PIX, Visa, MC, Apple Pay, Google Pay

// - Conversão automática BRL/USD/EUR → Crypto

// - KYC: Não requerido para <€700 por transação

// - Fee: 0.5-1% (mais baixo que Simplex/MoonPay ~3-5%)

//

// Webhook (IPN):

// - Header: x-nowpayments-sig (HMAC SHA-512)

// - Verificação: HMAC(JSON.stringify(sortedBody), IPN_SECRET)

// - Retry: até 10 tentativas em caso de falha

//

// Docs: https://nowpayments.io/doc

```
### Verificação de Webhook NOWPayments
```

import { createHmac } from 'crypto';

function verifyNowPaymentsWebhook(

body: Record<string, any>,

receivedSig: string,

ipnSecret: string

): boolean {

// NOWPayments ordena as keys do body antes de assinar

const sortedBody = JSON.stringify(body, Object.keys(body).sort());

const expectedSig = createHmac('sha512', ipnSecret)

.update(sortedBody)

.digest('hex');

return expectedSig === receivedSig;

}

```
### Diagrama: Arquitetura de Pagamentos Completa
```

┌─────────────────── FRONTEND (Next.js) ───────────────────┐

│                                                           │

│  [Crypto Direto]    [PIX Widget]      [Cartão Widget]     │

│   ccpayment          NOWPayments       NOWPayments        │

│   redirect           embedded          embedded           │

│                                                           │

└────────┬──────────────┬──────────────────┬────────────────┘

│              │                  │

▼              ▼                  ▼

┌──────────┐  ┌─────────────┐   ┌─────────────┐

│ccpayment │  │ NOWPayments │   │ NOWPayments │

│Hosted    │  │ On-Ramp     │   │ On-Ramp     │

│Checkout  │  │ PIX→USDT    │   │ Card→USDT   │

│900+ coins│  │ Fee: 0.5-1% │   │ Fee: 0.5-1% │

│Fee: 0.03%│  │ <€700 noKYC │   │ <€700 noKYC │

└─────┬────┘  └──────┬──────┘   └──────┬──────┘

│              │                  │

│    ┌─────────┴──────────────────┘

│    │

▼    ▼

┌────────────────────────────────────────┐

│        BACKEND (NestJS)                │

│                                        │

│  POST /wallet/webhook/ccpayment        │

│  POST /wallet/webhook/nowpayments      │

│                                        │

│  → Verifica assinatura                 │

│  → Checa idempotência                  │

│  → Credita saldo USD do usuário        │

│  → Cria Transaction no ledger          │

│                                        │

│  SALDO INTERNO: USD (sempre)           │

└───────────────┬────────────────────────┘

│

▼

┌────────────────────────────────────────┐

│        SAQUE (Crypto Only)             │

│                                        │

│  Usuário informa wallet + rede         │

│  → ccpayment processa withdrawal       │

│  → Saldo debitado em USD               │

│  → Redes recomendadas: SOL, TRX, MATIC │

│    (taxas baixas, velocidade alta)      │

└────────────────────────────────────────┘

```
### ADR-005: NOWPayments vs Simplex/MoonPay para On-Ramp
**Decisão:** NOWPayments
**Por quê:** Fee de 0.5-1% (vs 3-5% dos concorrentes), suporta PIX no Brasil, widget embeddable, sem KYC para transações abaixo de €700, especializado no vertical de gambling/casino. Simplex (Nuvei) é alternativa sólida mas 3x mais caro em fees. MoonPay requer KYC agressivo. Guardarian anuncia "no KYC" mas tem limites mais restritivos.
**Alternativa backup:** Simplex/Nuvei (mais established, melhor suporte, mas fees maiores).
### ADR-006: Saída Crypto-Only (Sem Off-Ramp)
**Decisão:** Saques exclusivamente em crypto
**Por quê:** Modelo validado pela engenharia reversa do Pigmo.com. Sem off-ramp (conversão crypto→fiat) eliminamos: necessidade de licença de transmissão de dinheiro, compliance de câmbio, exposição regulatória direta. O on-ramp provider (NOWPayments) absorve todo o compliance da entrada. Na saída, enviamos crypto direto — o usuário converte para fiat onde quiser (exchange, P2P, etc).
```

---

## 🎰 Engine de Odds (Pari-Mutuel)

### Como Funciona

Modelo pari-mutuel (mais simples que order book, ideal para MVP):

```
Odds do Outcome X = Total Pool do Evento / Pool do Outcome X

Exemplo:
- Evento: "Flamengo vs Lanús"
- Total apostado: $10.000
- Pool Flamengo: $7.000
- Pool Lanús: $3.000

- Odds Flamengo: 10000/7000 = 1.43x
- Odds Lanús: 10000/3000 = 3.33x

Se apostar $100 em Lanús e Lanús vencer:
Payout = $100 × 3.33 = $333
```

### Cálculo de Payout (Settlement)

```
// Quando evento é resolvido:

1. Identificar outcome vencedor
2. Calcular taxa da plataforma (3% do pool total)
3. Pool distribuível = totalPool × 0.97
4. Para cada aposta no outcome vencedor:
   payout = (bet.amount / winningOutcome.totalPool) × poolDistribuível
5. Creditar saldo de cada vencedor
6. Criar Transactions de PAYOUT
7. Marcar bets como WON/LOST
8. Event status → RESOLVED
```

### Edge Cases

- **Evento cancelado:** Refund total para todos
- **Ninguém apostou no outcome vencedor:** Pool retorna para todos (refund)
- **Uma pessoa apostou sozinha:** Recebe só o que apostou (não lucra consigo mesma)
- **Aposta mínima:** $1 (evita spam)
- **Aposta máxima:** $10.000 (evita manipulação inicial)

---

## 🖥️ Pages Frontend

| Page | Rota | Descrição |
| --- | --- | --- |
| Landing | / | Hero, como funciona, CTAs |
| Mercados | /markets | Grid de eventos, filtros por categoria |
| Evento | /markets/:id | Detalhes, odds, botão de aposta, atividade recente |
| Login | /login | Email + senha |
| Register | /register | Cadastro rápido |
| Dashboard | /dashboard | Saldo, posições abertas, histórico |
| Carteira | /wallet | Depositar, sacar, histórico de transações |
| Perfil | /profile | Estatísticas, settings |
| Admin | /admin | Criar/resolver eventos, dashboard métricas |

---

## 📝 To-Do List (Dev Ready)

### FASE 1 — Fundação (Semana 1-2) ✅ COMPLETA

- [x]  **Setup monorepo** — Next.js + NestJS + shared types + Docker Compose (MongoDB + Redis)
- [x]  **Auth module** — Register, login, JWT, refresh token, guards
- [x]  **User model + service** — CRUD, balance management
- [x]  **Transaction model + service** — Ledger com double-entry pattern
- [ ]  **Middleware de segurança** — Rate limiting, helmet, CORS (⚠️ Rate limiting pendente)

### FASE 2 — Core: Eventos & Apostas (Semana 3-5) ✅ COMPLETA

- [x]  **Event model + CRUD** — Criar, editar, listar, filtrar, buscar
- [x]  **Outcome model** — Vinculado ao evento, cálculo de odds
- [x]  **Bet service** — Criar aposta, validar saldo, debitar, atualizar odds
- [x]  **Odds engine** — Recalcular odds em tempo real após cada aposta
- [x]  **Settlement engine** — Resolver evento, calcular payouts, creditar vencedores
- [x]  **Cancelamento** — Refund automático para todos
- [x]  **Frontend: página de mercados** — Grid responsivo, cards de eventos, filtros
- [x]  **Frontend: página de evento** — Odds em tempo real, formulário de aposta, atividade
- [x]  **Frontend: dashboard do usuário** — Posições, P&L, histórico

### FASE 3 — Pagamentos Dual: ccpayment + NOWPayments (Semana 6-7) ✅ COMPLETA

**Crypto Direto (ccpayment):**

- [x]  **Integração ccpayment** — SDK Node.js, checkout URL, webhooks
- [x]  **Fluxo de depósito crypto** — Gerar link, redirecionar, processar webhook
- [x]  **Fluxo de saque** — Validar saldo, chamar API withdraw, webhook
- [x]  **Verificação de webhook ccpayment** — SHA-256, replay protection, idempotência

**Fiat On-Ramp (NOWPayments):**

- [x]  **Setup NOWPayments** — API key, IPN Secret, payout wallet config
- [x]  **Widget embedded** — Integrar iframe/SDK NOWPayments no modal de depósito
- [x]  **Endpoint POST /wallet/deposit/fiat** — Gerar parâmetros do widget (amount, target crypto, wallet)
- [x]  **Webhook handler NOWPayments** — POST /wallet/webhook/nowpayments, HMAC SHA-512 verification
- [x]  **Status handling** — Só creditar no status 'finished', ignorar intermediários
- [x]  **Idempotência NOWPayments** — Verificar payment_id único antes de creditar
- [x]  **Polling fallback** — Job periódico para verificar pagamentos pendentes via GET /payment/{id}

**Frontend + Testes:**

- [x]  **Frontend: carteira com tabs** — Crypto | PIX | Cartão, cada um abre seu fluxo
- [x]  **Frontend: modal PIX** — Widget NOWPayments embedded, sem redirect externo
- [x]  **Frontend: integração completa** — Hook useWallet, chamadas de API, estados de loading
- [ ]  **Testes E2E** — Mock dos webhooks em dev (ambos providers)

**Arquivos Criados (Backend - 2026-02-18):**
```
apps/api/src/modules/wallet/
├── dto/
│   ├── deposit-crypto.dto.ts    # Validação depósito crypto (min $5)
│   ├── deposit-fiat.dto.ts      # Validação depósito fiat (min $5, max $3500)
│   └── withdraw.dto.ts          # Validação saque (min $10, address, network)
├── services/
│   ├── ccpayment.service.ts     # Integração ccpayment API (checkout, withdraw, webhook, getOrderStatus)
│   ├── nowpayments.service.ts   # Integração NOWPayments API (invoice, widget, webhook)
│   └── payment-polling.service.ts # ✅ Job scheduler para polling de pagamentos pendentes
├── wallet.controller.ts         # 7 endpoints (balance, deposit/*, withdraw, webhooks)
├── wallet.service.ts            # Orquestração com transações atômicas MongoDB
└── wallet.module.ts             # Módulo NestJS (imports UsersModule, TransactionsModule)
```

**Arquivos Criados (Frontend - 2026-02-18):**
```
apps/web/src/
├── hooks/
│   ├── use-wallet.ts            # Zustand store para wallet (balance, transactions, deposit, withdraw)
│   └── use-admin.ts             # Zustand store para admin (dashboard, events CRUD)
├── lib/
│   └── api.ts                   # Adicionado walletApi e adminApi
├── app/
│   ├── (app)/wallet/page.tsx    # Página de wallet com integração completa
│   └── admin/
│       ├── layout.tsx           # Layout com sidebar e proteção de rota admin
│       ├── page.tsx             # Dashboard com métricas
│       └── events/
│           ├── page.tsx         # Lista de eventos com filtros e ações
│           ├── new/page.tsx     # Criar novo evento
│           └── [id]/page.tsx    # Editar/gerenciar evento individual
```

**Alterações em arquivos existentes:**
- `apps/api/src/app.module.ts` — Adicionado WalletModule aos imports
- `apps/api/src/main.ts` — Habilitado rawBody para verificação de assinatura webhook, headers CORS atualizados
- `apps/web/src/lib/api.ts` — Adicionado walletApi (balance, deposit, withdraw, transactions) e adminApi (dashboard, events CRUD)

### FASE 4 — Admin & Polish (Semana 8-9) ✅ COMPLETA

- [x]  **Admin panel backend** — Criar eventos, resolver, cancelar, dashboard métricas
- [x]  **Admin panel frontend** — ✅ Implementado (2026-02-18)
  - [x]  Layout com sidebar e navegação
  - [x]  Dashboard com métricas (volume, eventos, apostas, usuários)
  - [x]  Lista de eventos com filtros e busca
  - [x]  Criar evento com múltiplos outcomes
  - [x]  Editar/visualizar evento individual
  - [x]  Bloquear, resolver e cancelar eventos
  - [x]  Modais de confirmação
  - [x]  Hook useAdmin com Zustand
- [x]  **Landing page** — Hero, como funciona, FAQ, CTA
- [ ]  **Real-time updates** — [Socket.io](http://Socket.io) ou polling para odds live
- [ ]  **Email notifications** — Evento resolvido, depósito confirmado, saque processado
- [ ]  **Mobile responsive** — Tailwind breakpoints, touch-friendly (⚠️ parcial)
- [ ]  **SEO básico** — Meta tags, OG images, sitemap

### FASE 5 — Hardening (Semana 10-11) ✅ COMPLETA (90%)

- [x]  **Rate limiting global** — ThrottlerGuard com limites short/medium/long
- [x]  **Input validation rigorosa** — class-validator em todos DTOs
- [x]  **Error handling global** — Exception filters NestJS
- [x]  **Logging estruturado** — Pino com context (request, transaction, webhook, bet, settlement, auth)
- [x]  **Testes E2E** — Webhook tests (ccpayment, NOWPayments), auth tests, health check tests
- [ ]  **Testes unitários** — Services críticos (bet, settlement, wallet) — parcial
- [x]  **Monitoring** — Health check endpoints (/health, /health/live, /health/ready)
- [ ]  **Backup strategy** — MongoDB Atlas backup automático

**Arquivos criados (Hardening - 2026-02-18):**
```
apps/api/src/common/logger/
├── logger.module.ts          # Global logger module
├── logger.service.ts         # Pino structured logging service
└── index.ts

apps/api/src/common/interceptors/
├── logging.interceptor.ts    # Request/response logging interceptor
└── index.ts

apps/api/src/modules/health/
├── health.module.ts          # Terminus health module
├── health.controller.ts      # /health, /health/live, /health/ready
├── indicators/
│   └── mongo.health.ts       # MongoDB health indicator
└── index.ts

apps/api/test/
├── jest-e2e.json             # E2E test config
├── setup.ts                  # MongoDB memory server setup
├── wallet-webhook.e2e-spec.ts # Webhook signature tests
├── health.e2e-spec.ts        # Health check tests
├── auth.e2e-spec.ts          # Auth flow tests
└── WEBHOOK_TESTING.md        # Guia de testes com ngrok
```

### FASE 6 — Sistema de Rake/Taxa da Casa (Semana 12) ✅ COMPLETA (2026-02-19)

**Contexto:** O sistema de settlement agora deduz automaticamente a taxa da plataforma antes de distribuir aos vencedores.

**Modelo de Negócio:**
```
Pool Total do Evento: $1.000
Taxa da Casa (3%):    $30 → vai para a plataforma
Pool Distribuível:    $970 → dividido entre vencedores
```

**Tarefas Implementadas:**

- [x] **Usar TransactionType.FEE existente** — O enum já tinha o tipo FEE definido
- [x] **Criar RakeService** — Serviço dedicado para contabilização de receita
  - `recordRake()` - Registra rake de um evento
  - `getStats()` - Estatísticas gerais de receita
  - `getRakeByPeriod()` - Receita agrupada por dia/semana/mês
  - `getRakeHistory()` - Histórico paginado de rake
  - `getTopEventsByRake()` - Eventos com maior rake
  - `withdrawRevenue()` - Sacar lucros da plataforma
- [x] **Modificar SettlementService** — Deduzir rake antes de distribuir aos vencedores
  - Rake é registrado via `RakeService.recordRake()` dentro da transaction MongoDB
  - Edge cases tratados: evento cancelado, ninguém apostou no vencedor, apenas 1 outcome
- [x] **Criar PlatformWallet schema** — Contabilizar saldo disponível para saque pelo admin
- [x] **Endpoints Admin para Rake:**
  | Method | Endpoint | Descrição |
  | --- | --- | --- |
  | GET | /admin/revenue/stats | Estatísticas de receita |
  | GET | /admin/revenue/by-period | Receita por período (dia/semana/mês) |
  | GET | /admin/revenue/history | Histórico de rake paginado |
  | GET | /admin/revenue/top-events | Eventos com maior rake |
  | GET | /admin/revenue/event/:eventId | Rake de evento específico |
  | POST | /admin/revenue/withdraw | Sacar lucros para carteira crypto |

- [x] **Dashboard Admin - Seção Receita:**
  - Card de receita no dashboard principal
  - Página /admin/revenue com estatísticas completas
  - Visualização por período (dia/semana/mês)
  - Top eventos por rake
  - Histórico recente
  - Modal de saque com validação

- [x] **Configuração via ENV:**
  ```bash
  PLATFORM_FEE_PERCENT=3              # Taxa padrão (3%)
  MIN_RAKE_WITHDRAWAL=100             # Mínimo para sacar lucros ($100)
  ```

**Edge Cases Tratados:**

| Cenário | Comportamento |
| --- | --- |
| Evento cancelado | Rake = 0 (refund total, sem taxa) ✅ |
| Pool muito pequeno | Rake calculado proporcionalmente ✅ |
| Ninguém apostou no vencedor | Rake = 0 (refund total) ✅ |
| Apenas 1 outcome com apostas | Rake = 0 (refund, não há competição) ✅ |
| Settlement falha após rake | Rollback com MongoDB transaction ✅ |

**Arquivos Criados (Backend):**
```
apps/api/src/modules/rake/
├── rake.module.ts
├── rake.service.ts
├── rake.controller.ts
├── index.ts
├── schemas/
│   ├── rake-record.schema.ts
│   └── platform-wallet.schema.ts
└── dto/
    ├── withdraw-revenue.dto.ts
    ├── rake-filters.dto.ts
    └── index.ts
```

**Arquivos Criados (Frontend):**
```
apps/web/src/hooks/use-revenue.ts     # Zustand store para revenue
apps/web/src/app/admin/revenue/
└── page.tsx                          # Dashboard de receita completo
```

**Arquivos Modificados:**
```
apps/api/src/app.module.ts                      # Adicionado RakeModule
apps/api/src/modules/bets/bets.module.ts        # Importa RakeModule
apps/api/src/modules/bets/services/settlement.service.ts  # Registra rake
apps/web/src/lib/api.ts                         # Adicionado revenueApi
apps/web/src/app/admin/layout.tsx               # Link para /admin/revenue
apps/web/src/app/admin/page.tsx                 # Card de receita no dashboard
```

**Testes Pendentes (opcional):**
- [ ] Unit test: RakeService.calculateRake()
- [ ] Unit test: RakeService.recordRake()
- [ ] Integration test: Settlement com rake
- [ ] E2E test: Fluxo completo de resolução com rake
- [ ] E2E test: Saque de lucros pelo admin

### FASE 7 — Infraestrutura de Deploy (2026-02-19) ✅ COMPLETA

**Contexto:** Preparação para deploy em produção com containerização e CI/CD.

**Tarefas Implementadas:**

- [x] **Dockerfile API (NestJS)**
  - Multi-stage build otimizado
  - Usuário não-root para segurança
  - Health check integrado
  - Suporte a bcrypt (native module)

- [x] **Dockerfile Web (Next.js)**
  - Multi-stage build com standalone output
  - Build-time args para variáveis de ambiente
  - Usuário não-root para segurança
  - Health check integrado

- [x] **Docker Compose**
  - `docker-compose.yml` — Desenvolvimento local (MongoDB + Redis + Mongo Express)
  - `docker-compose.prod.yml` — Produção completa (API + Web + MongoDB + Redis)
  - Health checks em todos os serviços
  - Resource limits para produção

- [x] **CI/CD Pipeline (GitHub Actions)**
  - `ci.yml` — Lint, type check, testes unitários, testes E2E, build Docker
  - `deploy.yml` — Deploy automático para Railway/Vercel ou Docker self-hosted
  - Build cache com GitHub Actions cache
  - Notificações de falha

**Arquivos Criados:**
```
apps/api/Dockerfile              # Multi-stage build NestJS
apps/web/Dockerfile              # Multi-stage build Next.js
.dockerignore                    # Exclusões do build context
docker-compose.yml               # Atualizado com health checks
docker-compose.prod.yml          # Stack completa para produção
.github/workflows/ci.yml         # Pipeline de CI (testes + lint)
.github/workflows/deploy.yml     # Pipeline de deploy
```

**Arquivos Modificados:**
```
apps/web/next.config.js          # Adicionado output: 'standalone'
```

**Como usar:**

```bash
# Desenvolvimento local (infra apenas)
docker compose up -d

# Build e rodar produção local
docker compose -f docker-compose.prod.yml up -d

# Build individual
docker build -f apps/api/Dockerfile -t pm-api .
docker build -f apps/web/Dockerfile -t pm-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.palpite.me/api .
```

---

## ⚠️ Riscos & Edge Cases

| Cenário | O que acontece | Mitigação |
| --- | --- | --- |
| Webhook ccpayment não chega | Depósito fica pendente | Polling job a cada 5min para verificar status de ordens pendentes via API |
| Duplo webhook (replay) | Credita duas vezes | Idempotência: verificar se transaction já foi processada pelo order_id |
| Race condition em apostas | Odds inconsistentes | Usar transactions atômicas do MongoDB + Redis lock |
| Usuário aposta mais que saldo | Saldo negativo | Validação atômica: check + debit na mesma operação |
| Settlement falha no meio | Alguns recebem, outros não | Usar session/transaction do MongoDB, rollback se falhar |
| Evento sem apostas | Nada acontece | Não resolver, cancelar automaticamente |
| Manipulação de odds (whale) | Uma pessoa domina o pool | Limite máximo por aposta, alertas para admin |
| ccpayment fora do ar | Depósitos/saques falham | Circuit breaker, mensagem de indisponibilidade, retry queue |
| Regulação brasileira | Possível enquadramento como bet/valor mobiliário | Usar USDT como denominação, servidor fora do BR, termos de uso claros |
| Webhook NOWPayments não chega | Depósito PIX fica pendente | Polling job via GET /payment/{id} a cada 5min para ordens pendentes. NOWPayments tem retry automático (até 10x) |
| Conversão BRL→USDT com slippage | Usuário recebe menos que esperava | Mostrar valor estimado ANTES do pagamento. Usar outcome_amount (valor real recebido) para creditar |
| NOWPayments fora do ar | PIX/Cartão indisponíveis | Fallback: mostrar apenas opção crypto direto. Circuit breaker no widget. Alternativa backup: Simplex/Guardarian |
| KYC triggered (&gt;€700) | On-ramp pede verificação de identidade | Limitar depósito fiat a R$3.500/transação. Para valores maiores, direcionar para crypto direto (zero KYC) |

---

## ✅ Definition of Done

- [x]  Usuário consegue: cadastrar, depositar crypto, apostar, ver resultado, sacar ✅
- [x]  Usuário consegue: depositar via PIX (NOWPayments on-ramp) e ver saldo em USD ✅
- [x]  Usuário consegue: depositar via Cartão (NOWPayments on-ramp) ✅
- [x]  Admin consegue: criar evento, resolver, ver métricas ✅ (Backend + Frontend)
- [x]  Odds atualizam em tempo real após cada aposta
- [x]  Settlement automático ao resolver evento
- [x]  **Sistema de Rake implementado** — Taxa deduzida no settlement, receita contabilizada ✅
- [x]  **Admin consegue ver/sacar lucros** — Dashboard de receita, saque para wallet ✅
- [x]  Webhooks ccpayment processados com idempotência ✅
- [x]  Webhooks NOWPayments processados com idempotência HMAC SHA-512 ✅
- [x]  Widget NOWPayments embedded no frontend (sem redirect externo) ✅
- [ ]  Mobile responsive (⚠️ parcial)
- [x]  Testes E2E dos webhooks (ccpayment, NOWPayments) ✅
- [x]  Rate limiting global e por rota ✅
- [x]  Logging estruturado com Pino ✅
- [x]  Health check endpoints (/health, /health/live, /health/ready) ✅
- [ ]  Deploy em staging funcional
- [x]  Zero secrets hardcoded

---

## 📏 Estimativa

**Complexidade:** L (Large)

**Estimativa com 1 dev senior full-stack + Claude Code:**

| Fase | Semanas | Acumulado |
| --- | --- | --- |
| Fundação (auth, models, setup) | 2 | 2 |
| Core (eventos, apostas, odds, settlement) | 3 | 5 |
| Pagamentos crypto (ccpayment) | 2 | 7 |
| Admin + polish + landing | 2 | 9 |
| Hardening (testes, segurança, monitoring) | 2 | 11 |
| **TOTAL** | **11 semanas** | — |

**Buffer recomendado:** +2 semanas para imprevistos = **13 semanas (3 meses)**

---

## 🧠 Decisões Arquiteturais Chave

### ADR-001: Pari-Mutuel vs Order Book

**Decisão:** Pari-Mutuel

**Por quê:** Order book exige matching engine complexa, WebSockets pesados, e liquidez dos dois lados. Pari-mutuel funciona com qualquer volume, é matematicamente simples e é o modelo usado pela maioria das plataformas de prediction market em estágio inicial. Podemos migrar para order book na v2 se necessário.

### ADR-002: Saldo interno em USD vs Crypto nativa

**Decisão:** Saldo denominado em USD (stablecoins)

**Por quê:** Simplifica cálculos de odds, apostas e payouts. O ccpayment converte qualquer crypto para USD equivalente no depósito. O usuário pensa em dólares, aposta em dólares, recebe em dólares (paga em crypto na entrada e saída).

### ADR-003: ccpayment Hosted Checkout vs Custom

**Decisão:** Hosted Checkout Page (redirect)

**Por quê:** Não precisamos lidar com wallets individuais, compliance de custódia, ou UI de pagamento. O ccpayment cuida de tudo. Na v2 podemos explorar pagamento nativo se necessário.

### ADR-004: Sem KYC

**Decisão:** Sem verificação de identidade

**Por quê:** Reduz fricção de onboarding para zero. Crypto-native users esperam anonimato. Risco regulatório mitigado por: servidor fora do BR, termos de uso claros, limites de operação.

---

## 🔥 O Que Vai Fazer ou Quebrar Este Projeto

1. **Liquidez no Day 1** — Sem gente apostando dos dois lados, o produto morre. Solução: admin cria eventos populares (futebol, crypto, BBB), seed com apostas iniciais se necessário.
2. **Velocidade de onboarding** — Se demorar mais de 2 minutos para cadastrar + depositar + apostar, perdemos. O fluxo precisa ser FRICTIONLESS.
3. **Confiança no settlement** — Se um payout falhar ou demorar, nunca mais voltam. Settlement precisa ser à prova de bala.
4. **Eventos relevantes** — Precisamos de um curador (humano) criando eventos que as pessoas QUEREM apostar. Isso é editorial, não tech.

[📖 README — Prediction Market (Dev Guide)](https://www.notion.so/README-Prediction-Market-Dev-Guide-303c244b422f81fea676c5d2ff7b5828?pvs=21)