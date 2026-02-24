# Production Checklist - Prediction Market

> **Data:** 2026-02-19
> **Status:** Em Progresso
> **Estimativa Total:** 2-3 dias de trabalho

---

## Resumo Executivo

O MVP está ~99% funcional em ambiente de desenvolvimento. A infraestrutura de deploy (Docker + CI/CD) foi implementada. Este documento lista **tudo que falta para ir para produção** de forma segura e escalável.

---

## 1. Infraestrutura & DevOps

### 1.1 Containerização (Docker)

**Status:** ✅ IMPLEMENTADO (2026-02-19)

**Arquivos criados:**
- [x] `apps/api/Dockerfile` — Multi-stage build NestJS com health check
- [x] `apps/web/Dockerfile` — Multi-stage build Next.js standalone
- [x] `docker-compose.prod.yml` — Stack completa com resource limits
- [x] `.dockerignore` — Exclusões otimizadas

**Uso:**

```bash
# Build e rodar stack completa
docker compose -f docker-compose.prod.yml up -d

# Build individual
docker build -f apps/api/Dockerfile -t pm-api .
docker build -f apps/web/Dockerfile -t pm-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.palpite.me/api .
```

**Prioridade:** ~~ALTA~~ ✅ CONCLUÍDO

---

### 1.2 CI/CD Pipeline

**Status:** ✅ IMPLEMENTADO (2026-02-19)

**Arquivos criados:**
- [x] `.github/workflows/ci.yml` — Lint, type check, testes, build Docker
- [x] `.github/workflows/deploy.yml` — Deploy automático para Railway/Vercel/Docker

**Funcionalidades:**
- Lint e type check em API e Web
- Testes unitários e E2E com MongoDB e Redis em containers
- Build e validação de imagens Docker
- Deploy automático para staging (branch dev) e production (branch main)
- Health checks pós-deploy
- Notificações de falha
- Cache de build otimizado

**Secrets necessários no GitHub:**
```
RAILWAY_TOKEN          # Se usar Railway
VERCEL_TOKEN           # Se usar Vercel
SSH_HOST               # Se usar Docker self-hosted
SSH_USERNAME           # Se usar Docker self-hosted
SSH_PRIVATE_KEY        # Se usar Docker self-hosted
```

**Variables necessárias no GitHub (por environment):**
```
API_URL                # URL da API (ex: https://api.example.com)
FRONTEND_URL           # URL do frontend (ex: https://example.com)
NEXT_PUBLIC_API_URL    # URL da API para o frontend
NEXT_PUBLIC_APP_NAME   # Nome do app
NEXT_PUBLIC_APP_URL    # URL do app
DEPLOY_PLATFORM        # railway, vercel, ou docker
```

**Prioridade:** ~~ALTA~~ ✅ CONCLUÍDO

---

### 1.3 Hospedagem & Deploy

**Status:** NAO CONFIGURADO

**Opcoes recomendadas:**

| Servico | Uso | Custo Estimado |
|---------|-----|----------------|
| **Vercel** | Frontend (Next.js) | Free tier / $20/mes |
| **Railway** | Backend (NestJS) | ~$5-20/mes |
| **MongoDB Atlas** | Database | Free tier / $9+/mes |
| **Upstash** | Redis | Free tier / $10+/mes |
| **Cloudflare** | CDN + DNS + DDoS | Free tier |

**Checklist de configuracao:**

- [ ] Criar projeto no Vercel (conectar repo GitHub)
- [ ] Criar projeto no Railway (ou Render)
- [ ] Criar cluster MongoDB Atlas (regiao: South America)
- [ ] Criar database Redis no Upstash
- [ ] Configurar dominio no Cloudflare
- [ ] Configurar SSL (automatico no Vercel/Railway)
- [ ] Configurar variaveis de ambiente em cada servico

**Prioridade:** ALTA
**Tempo estimado:** 3-4 horas

---

### 1.4 Dominio & SSL

**Status:** NAO CONFIGURADO

**O que falta:**
- [ ] Registrar dominio (ex: predictionmarket.com.br)
- [ ] Configurar DNS no Cloudflare
- [ ] Apontar subdominio api.* para Railway
- [ ] Apontar dominio principal para Vercel
- [ ] SSL automatico (Cloudflare + Vercel/Railway)

**Configuracao DNS exemplo:**

```
predictionmarket.com.br      A       -> Vercel IP
www.predictionmarket.com.br  CNAME   -> cname.vercel-dns.com
api.predictionmarket.com.br  CNAME   -> railway-app.com
```

**Prioridade:** ALTA
**Tempo estimado:** 1-2 horas

---

## 2. Seguranca

### 2.1 Variaveis de Ambiente de Producao

**Status:** PARCIAL (desenvolvimento configurado)

**Checklist de secrets para producao:**

```env
# ================================
# PRODUCAO - NUNCA COMMITAR
# ================================

# APP
NODE_ENV=production
PORT=3001
API_URL=https://api.palpite.me
FRONTEND_URL=https://palpite.me

# DATABASE (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/prediction-market?retryWrites=true&w=majority

# REDIS (Upstash)
REDIS_URL=rediss://<user>:<password>@xxxxx.upstash.io:6379

# AUTH (GERAR NOVOS SECRETS!)
JWT_SECRET=<gerar-com-openssl-rand-base64-64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<gerar-outro-secret-diferente>
JWT_REFRESH_EXPIRES_IN=7d

# NOWPAYMENTS (credenciais reais)
NOWPAYMENTS_API_KEY=<api-key-producao>
NOWPAYMENTS_IPN_SECRET=<ipn-secret-producao>
NOWPAYMENTS_WEBHOOK_URL=https://api.palpite.me/api/wallet/webhook/nowpayments
NOWPAYMENTS_PAYOUT_ADDRESS=<wallet-usdt-da-empresa>
NOWPAYMENTS_PAYOUT_CURRENCY=usdtsol
NOWPAYMENTS_EMAIL=<email-nowpayments>
NOWPAYMENTS_PASSWORD=<senha-nowpayments>

# PLATFORM
PLATFORM_FEE_PERCENT=3
MIN_BET_AMOUNT=1
MAX_BET_AMOUNT=10000
MIN_DEPOSIT_AMOUNT=5
MIN_WITHDRAWAL_AMOUNT=10
```

**Como gerar secrets seguros:**

```bash
# JWT_SECRET
openssl rand -base64 64

# JWT_REFRESH_SECRET
openssl rand -base64 64
```

**Prioridade:** CRITICA
**Tempo estimado:** 30 minutos

---

### 2.2 Helmet & Security Headers

**Status:** PARCIAL (helmet basico configurado)

**O que falta:**
- [ ] Content Security Policy (CSP) customizado
- [ ] HSTS configurado
- [ ] X-Frame-Options

**Implementacao no main.ts:**

```typescript
// Adicionar em apps/api/src/main.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.nowpayments.io", "https://api.ccpayment.com"],
        frameSrc: ["'self'", "https://nowpayments.io"], // Widget NOWPayments
      },
    },
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

**Prioridade:** ALTA
**Tempo estimado:** 1 hora

---

### 2.3 Rate Limiting por IP/Usuario

**Status:** PARCIAL (rate limiting global existe)

**O que falta:**
- [ ] Rate limiting especifico para endpoints sensiveis (login, registro, withdraw)
- [ ] Blocking de IPs suspeitos
- [ ] Captcha em endpoints publicos (opcional)

**Implementacao:**

```typescript
// Em auth.controller.ts
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
@Post('login')
async login(@Body() dto: LoginDto) { ... }

// Em wallet.controller.ts
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 saques por minuto
@Post('withdraw')
async withdraw(@Body() dto: WithdrawDto) { ... }
```

**Prioridade:** MEDIA
**Tempo estimado:** 1 hora

---

### 2.4 Auditoria de Seguranca

**Status:** NAO REALIZADA

**Checklist de revisao:**

- [ ] Revisar todos os endpoints sem autenticacao
- [ ] Verificar SQL/NoSQL injection em queries dinamicas
- [ ] Revisar validacao de DTOs (min/max values, patterns)
- [ ] Verificar permissoes de rotas admin
- [ ] Testar CORS com dominios nao autorizados
- [ ] Verificar exposicao de erros internos (stack traces)
- [ ] Revisar logs para nao expor dados sensiveis

**Prioridade:** ALTA
**Tempo estimado:** 2-3 horas

---

## 3. Monitoramento & Observabilidade

### 3.1 Error Tracking (Sentry)

**Status:** NAO IMPLEMENTADO

**O que falta:**
- [ ] Instalar @sentry/node e @sentry/nextjs
- [ ] Configurar DSN
- [ ] Capturar excecoes nao tratadas
- [ ] Adicionar contexto de usuario aos erros

**Implementacao Backend:**

```bash
npm install @sentry/node -w apps/api
```

```typescript
// apps/api/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% das requests para performance
});
```

**Implementacao Frontend:**

```bash
npm install @sentry/nextjs -w apps/web
```

```javascript
// apps/web/sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

**Prioridade:** ALTA
**Tempo estimado:** 2 horas

---

### 3.2 Application Performance Monitoring (APM)

**Status:** NAO IMPLEMENTADO

**Opcoes:**
- Sentry Performance (incluido no Sentry)
- New Relic (free tier)
- Datadog (mais caro, mais completo)

**Metricas a monitorar:**
- Tempo de resposta por endpoint
- Throughput (requests/segundo)
- Error rate
- Database query time
- External API latency (NOWPayments)

**Prioridade:** MEDIA
**Tempo estimado:** 2 horas

---

### 3.3 Log Aggregation

**Status:** PARCIAL (Pino configurado localmente)

**O que falta:**
- [ ] Enviar logs para servico externo (Logtail, Papertrail, Datadog)
- [ ] Configurar log rotation
- [ ] Alertas para logs de erro

**Implementacao (Logtail):**

```bash
npm install @logtail/pino -w apps/api
```

```typescript
// apps/api/src/common/logger/logger.service.ts
import { Logtail } from '@logtail/pino';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

// Adicionar transport ao Pino
```

**Prioridade:** MEDIA
**Tempo estimado:** 1 hora

---

### 3.4 Uptime Monitoring

**Status:** NAO IMPLEMENTADO

**Opcoes gratuitas:**
- UptimeRobot (free tier: 50 monitors)
- Better Uptime
- Pingdom

**O que monitorar:**
- [ ] `GET /api/health` (a cada 1 min)
- [ ] `GET /api/health/ready` (database + redis)
- [ ] Frontend home page
- [ ] API response time

**Alertas:**
- Email/SMS quando downtime > 1 min
- Slack/Discord webhook (opcional)

**Prioridade:** ALTA
**Tempo estimado:** 30 minutos

---

### 3.5 Business Metrics Dashboard

**Status:** PARCIAL (dashboard admin existe)

**O que falta:**
- [ ] Painel externo com metricas em tempo real (Grafana/Metabase)
- [ ] Alertas para metricas de negocio (volume baixo, muitos erros de pagamento)

**Metricas de negocio:**
- Volume total de apostas (diario/semanal/mensal)
- Receita (rake) acumulada
- Numero de usuarios ativos
- Taxa de conversao (visitante -> usuario -> aposta)
- Taxa de sucesso de depositos/saques

**Prioridade:** BAIXA (pos-lancamento)
**Tempo estimado:** 4-8 horas

---

## 4. Database & Persistencia

### 4.1 MongoDB Atlas Setup

**Status:** LOCAL (docker-compose)

**Checklist:**
- [ ] Criar cluster no MongoDB Atlas (M0 free ou M10 prod)
- [ ] Regiao: South America (Sao Paulo)
- [ ] Configurar IP whitelist (0.0.0.0/0 para Railway, ou IPs especificos)
- [ ] Criar usuario de database
- [ ] Habilitar backup automatico (M10+)
- [ ] Configurar alertas de uso

**Indices recomendados (performance):**

```javascript
// Collection: users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })

// Collection: events
db.events.createIndex({ status: 1, category: 1 })
db.events.createIndex({ createdAt: -1 })
db.events.createIndex({ closesAt: 1 })

// Collection: bets
db.bets.createIndex({ userId: 1, status: 1 })
db.bets.createIndex({ eventId: 1 })
db.bets.createIndex({ createdAt: -1 })

// Collection: transactions
db.transactions.createIndex({ userId: 1, createdAt: -1 })
db.transactions.createIndex({ reference: 1 }, { sparse: true })
db.transactions.createIndex({ status: 1, type: 1 })

// Collection: rakerecords
db.rakerecords.createIndex({ eventId: 1 }, { unique: true })
db.rakerecords.createIndex({ createdAt: -1 })
```

**Prioridade:** ALTA
**Tempo estimado:** 1 hora

---

### 4.2 Redis (Upstash)

**Status:** LOCAL (docker-compose)

**Checklist:**
- [ ] Criar database no Upstash
- [ ] Regiao: South America
- [ ] Configurar connection string (rediss://)
- [ ] Habilitar eviction policy (allkeys-lru)

**Uso atual:**
- Rate limiting (ThrottlerModule)
- Cache de odds (futuro)
- Session storage (futuro)

**Prioridade:** ALTA
**Tempo estimado:** 30 minutos

---

### 4.3 Backup & Recovery

**Status:** NAO CONFIGURADO

**MongoDB Atlas Backups:**
- [ ] Habilitar continuous backup (M10+)
- [ ] Configurar retention period (7-30 dias)
- [ ] Testar restore em ambiente de staging

**Backup manual (alternativa gratuita):**

```bash
# Cron job diario
mongodump --uri="$MONGODB_URI" --archive | gzip > backup_$(date +%Y%m%d).gz
# Upload para S3/GCS
```

**Prioridade:** ALTA (apos go-live)
**Tempo estimado:** 1 hora

---

## 5. Pagamentos (Ativacao)

### 5.1 NOWPayments

**Status:** CREDENCIAIS CONFIGURADAS

**Checklist:**
- [ ] Verificar credenciais sao de producao (nao sandbox)
- [ ] Atualizar webhook URL para dominio de producao
- [ ] Testar deposito PIX real
- [ ] Testar deposito cartao real
- [ ] Verificar wallet de payout esta correta

**Prioridade:** ALTA
**Tempo estimado:** 1-2 horas

---

### 5.2 Testes E2E de Pagamento

**Status:** NAO REALIZADO

**Checklist:**
- [ ] Testar deposito PIX (NOWPayments) → saldo atualiza
- [ ] Testar deposito Cartao (NOWPayments) → saldo atualiza
- [ ] Testar saque crypto → recebe na wallet
- [ ] Testar saque de rake (admin) → recebe na wallet corporativa
- [ ] Testar webhook com assinatura invalida → rejeita
- [ ] Testar webhook duplicado → processa apenas 1x

**Prioridade:** CRITICA
**Tempo estimado:** 2-4 horas

---

## 6. Frontend & UX

### 6.1 Mobile Responsivo

**Status:** PARCIAL

**O que falta:**
- [ ] Testar todas as paginas em mobile (375px, 414px)
- [ ] Ajustar layout da sidebar admin em mobile
- [ ] Ajustar modais de deposito/saque em mobile
- [ ] Testar widget NOWPayments em mobile

**Prioridade:** MEDIA
**Tempo estimado:** 4-6 horas

---

### 6.2 Loading States & Skeleton

**Status:** PARCIAL

**O que falta:**
- [ ] Skeleton loading em listas de eventos
- [ ] Loading state em botoes de acao (apostar, depositar, sacar)
- [ ] Empty state quando nao ha dados

**Prioridade:** BAIXA
**Tempo estimado:** 2-3 horas

---

### 6.3 SEO & Meta Tags

**Status:** NAO IMPLEMENTADO

**O que falta:**
- [ ] Meta tags dinamicas por pagina
- [ ] Open Graph tags (compartilhamento social)
- [ ] robots.txt
- [ ] sitemap.xml

**Implementacao:**

```typescript
// apps/web/src/app/layout.tsx
export const metadata: Metadata = {
  title: 'Prediction Market - Apostas em Eventos Reais',
  description: 'Aposte em eventos de esportes, crypto, politica e mais. Deposite via PIX ou crypto.',
  openGraph: {
    title: 'Prediction Market',
    description: 'Plataforma de mercado de previsao',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

**Prioridade:** BAIXA
**Tempo estimado:** 2 horas

---

## 7. Legal & Compliance

### 7.1 Termos de Uso

**Status:** NAO EXISTE

**O que incluir:**
- Natureza do servico (mercado de previsao)
- Requisitos de idade (18+)
- Responsabilidade do usuario
- Politica de depositos e saques
- Resolucao de disputas
- Limitacao de responsabilidade
- Jurisdicao

**Prioridade:** CRITICA (antes do lancamento)
**Tempo estimado:** Consulta juridica recomendada

---

### 7.2 Politica de Privacidade

**Status:** NAO EXISTE

**O que incluir:**
- Dados coletados (email, endereco crypto, historico)
- Uso dos dados
- Compartilhamento com terceiros (ccpayment, NOWPayments)
- Cookies e rastreamento
- Direitos do usuario (LGPD)
- Retencao de dados
- Contato do DPO

**Prioridade:** CRITICA (antes do lancamento)
**Tempo estimado:** Consulta juridica recomendada

---

### 7.3 Conformidade Regulatoria

**Consideracoes:**
- [ ] Verificar regulamentacao de apostas no Brasil
- [ ] Avaliar necessidade de licenca
- [ ] Considerar operacao offshore se necessario
- [ ] Implementar restricao por geolocalizacao (se aplicavel)

**Nota:** Consulte advogado especializado em jogos e apostas.

**Prioridade:** CRITICA
**Tempo estimado:** Variavel

---

## 8. Testes Adicionais

### 8.1 Testes de Carga

**Status:** NAO REALIZADO

**Ferramentas:**
- k6 (recomendado)
- Artillery
- JMeter

**Cenarios a testar:**
- 100 usuarios simultaneos apostando
- 1000 requests/min em /events
- Settlement de evento com 500 apostas

**Implementacao (k6):**

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
};

export default function () {
  const res = http.get('https://api.palpite.me/api/events');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

**Prioridade:** MEDIA (antes de grandes campanhas)
**Tempo estimado:** 4-6 horas

---

### 8.2 Testes de Seguranca

**Status:** NAO REALIZADO

**Checklist OWASP Top 10:**
- [ ] Injection (SQL, NoSQL, Command)
- [ ] Broken Authentication
- [ ] Sensitive Data Exposure
- [ ] XML External Entities (N/A)
- [ ] Broken Access Control
- [ ] Security Misconfiguration
- [ ] Cross-Site Scripting (XSS)
- [ ] Insecure Deserialization
- [ ] Using Components with Known Vulnerabilities
- [ ] Insufficient Logging & Monitoring

**Ferramentas:**
- OWASP ZAP (scan automatico)
- Burp Suite (teste manual)
- npm audit (dependencias)

**Prioridade:** ALTA
**Tempo estimado:** 4-8 horas

---

## 9. Pos-Lancamento

### 9.1 Seed de Eventos

**Status:** DADOS DE TESTE

**O que fazer:**
- [ ] Criar eventos reais (esportes, crypto, politica)
- [ ] Definir curador/admin responsavel
- [ ] Criar calendario de eventos recorrentes

**Prioridade:** CRITICA (Day 1)
**Tempo estimado:** Continuo

---

### 9.2 Liquidez Inicial

**Estrategia:**
- [ ] Depositar capital inicial para apostas
- [ ] Criar apostas em ambos os lados (market making manual)
- [ ] Promocoes de boas-vindas (bonus de deposito)

**Prioridade:** ALTA (Day 1)
**Tempo estimado:** Decisao de negocio

---

### 9.3 Suporte ao Usuario

**O que configurar:**
- [ ] Email de suporte (suporte@palpite.me)
- [ ] Chat widget (Crisp, Intercom, Zendesk)
- [ ] FAQ/Central de Ajuda
- [ ] SLA de resposta definido

**Prioridade:** MEDIA
**Tempo estimado:** 2-4 horas

---

## Resumo de Prioridades

### CRITICOS (Bloqueia Lancamento)

| Item | Tempo | Status |
|------|-------|--------|
| Variaveis de ambiente de producao | 30min | Pendente |
| Configurar NOWPayments producao | 1-2h | Pendente |
| Testes E2E de pagamento | 2-4h | Pendente |
| Termos de Uso | Variavel | Pendente |
| Politica de Privacidade | Variavel | Pendente |
| Deploy em hospedagem | 3-4h | Pendente |

### ALTA PRIORIDADE (Lancamento Seguro)

| Item | Tempo | Status |
|------|-------|--------|
| Dockerfile | ~~2-3h~~ | ✅ Completo |
| CI/CD Pipeline | ~~2-4h~~ | ✅ Completo |
| MongoDB Atlas + Redis | 1.5h | Pendente |
| Dominio + SSL | 1-2h | Pendente |
| Sentry (error tracking) | 2h | Pendente |
| Uptime monitoring | 30min | Pendente |
| Auditoria de seguranca | 2-3h | Pendente |
| Backup strategy | 1h | Pendente |

### MEDIA PRIORIDADE (Pos-Lancamento)

| Item | Tempo | Status |
|------|-------|--------|
| Rate limiting por endpoint | 1h | Pendente |
| APM | 2h | Pendente |
| Log aggregation | 1h | Pendente |
| Mobile responsive | 4-6h | Parcial |
| Testes de carga | 4-6h | Pendente |
| Testes de seguranca | 4-8h | Pendente |

### BAIXA PRIORIDADE (Futuro)

| Item | Tempo | Status |
|------|-------|--------|
| Business metrics dashboard | 4-8h | Pendente |
| Loading states & skeleton | 2-3h | Parcial |
| SEO & Meta tags | 2h | Pendente |

---

## Estimativa Total

| Fase | Tempo Estimado | Status |
|------|----------------|--------|
| Infraestrutura (Docker, CI/CD, Deploy) | ~~8-12 horas~~ | ✅ Completo |
| Hospedagem (Railway, Vercel, Atlas, Upstash) | 3-4 horas | Pendente |
| Seguranca (Headers, Rate limiting, Audit) | 4-7 horas | Pendente |
| Monitoramento (Sentry, Logs, Uptime) | 4-6 horas | Pendente |
| Database (Atlas, Redis, Backup) | 2-3 horas | Pendente |
| Pagamentos (Testes E2E) | 2-4 horas | Pendente |
| Legal (Termos, Privacidade) | Variavel | Pendente |
| **TOTAL (sem legal)** | **15-24 horas** | |

**Com buffer:** 2-3 dias de trabalho full-time

---

## Proximos Passos Recomendados

1. **Hoje:** Configurar MongoDB Atlas e Upstash
2. **Hoje:** Configurar NOWPayments (API Key, IPN Secret, Webhook)
3. **Amanha:** Criar Dockerfiles e CI/CD
4. **Amanha:** Deploy em staging (Railway + Vercel)
5. **Dia 3:** Testes E2E de pagamento com ngrok
6. **Dia 3:** Configurar Sentry e uptime monitoring
7. **Dia 4:** Revisao de seguranca
8. **Dia 5:** Deploy em producao + DNS
