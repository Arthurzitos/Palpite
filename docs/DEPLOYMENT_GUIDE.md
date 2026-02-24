# Guia de Deploy - Prediction Market

> **Data:** 2026-02-19 | **Atualizado:** 2026-02-23
> **Tempo Estimado:** 2-3 dias
> **Pré-requisitos:** Node.js 20+, Docker, Git, Conta GitHub

---

## Status Atual

| Etapa | Status | Observação |
|-------|--------|------------|
| 1. Preparação Local | ✅ Concluído | Secrets gerados, `.env.production` criado |
| 2. MongoDB Atlas | 🔲 Pendente | Conta criada, falta preencher connection string |
| 3. Redis (Upstash) | 🔲 Pendente | Conta criada, falta preencher connection string |
| 4. NOWPayments | 🔲 Pendente | Conta criada, falta preencher credenciais |
| 5. Deploy API (Railway) | 🔲 Pendente | Conta criada, falta fazer deploy |
| 6. Deploy Frontend (Vercel) | 🔲 Pendente | Conta criada, falta fazer deploy |
| 7. Domínio e SSL | 🔲 Pendente | - |
| 8. CI/CD | ✅ Concluído | Workflows criados, falta configurar secrets no GitHub |
| 9. Monitoramento | 🔲 Pendente | - |
| 10. Testes Finais | 🔲 Pendente | - |

---

## Índice

1. [Preparação Local](#1-preparação-local)
2. [Configurar MongoDB Atlas](#2-configurar-mongodb-atlas)
3. [Configurar Redis (Upstash)](#3-configurar-redis-upstash)
4. [Configurar NOWPayments](#4-configurar-nowpayments)
5. [Deploy da API (Railway)](#5-deploy-da-api-railway)
6. [Deploy do Frontend (Vercel)](#6-deploy-do-frontend-vercel)
7. [Configurar Domínio e SSL](#7-configurar-domínio-e-ssl)
8. [Configurar CI/CD](#8-configurar-cicd)
9. [Configurar Monitoramento](#9-configurar-monitoramento)
10. [Testes Finais](#10-testes-finais)
11. [Go-Live Checklist](#11-go-live-checklist)

---

## 1. Preparação Local ✅

### 1.1 Gerar Secrets de Produção ✅

```bash
# Gerar JWT_SECRET (64 caracteres)
openssl rand -base64 64

# Gerar JWT_REFRESH_SECRET (64 caracteres)
openssl rand -base64 64
```

**Salve esses valores em um local seguro (1Password, Bitwarden, etc).**

> ✅ **FEITO:** Secrets gerados e salvos em `apps/api/.env.production`

### 1.2 Criar arquivo .env.production ✅

Arquivo criado em `apps/api/.env.production` (NÃO commitar):

```env
# ══════════════════════════════════════
# PRODUCTION ENVIRONMENT
# ══════════════════════════════════════

# APP
NODE_ENV=production
PORT=3001
API_URL=https://api.palpite.me
FRONTEND_URL=https://palpite.me

# DATABASE (preencher após etapa 2)
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...

# AUTH (usar os secrets gerados acima)
JWT_SECRET=<seu-jwt-secret-64-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<seu-refresh-secret-64-chars>
JWT_REFRESH_EXPIRES_IN=7d

# NOWPAYMENTS (preencher após etapa 4)
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_WEBHOOK_URL=https://api.palpite.me/api/wallet/webhook/nowpayments
NOWPAYMENTS_PAYOUT_ADDRESS=
NOWPAYMENTS_PAYOUT_CURRENCY=usdttrc20
NOWPAYMENTS_EMAIL=
NOWPAYMENTS_PASSWORD=

# PLATFORM
PLATFORM_FEE_PERCENT=3
MIN_BET_AMOUNT=1
MAX_BET_AMOUNT=10000
MIN_DEPOSIT_AMOUNT=5
MIN_WITHDRAWAL_AMOUNT=10
MIN_RAKE_WITHDRAWAL=100
```

### 1.3 Verificar Build Local

```bash
# Instalar dependências
npm ci

# Build completo
npm run build

# Testar localmente
docker compose up -d
npm run dev
```

**Checkpoint:** ✅ Secrets gerados e salvos em local seguro

---

## 2. Configurar MongoDB Atlas 🔲

### 2.1 Criar Conta

1. Acesse [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Clique em **"Try Free"**
3. Preencha o cadastro (pode usar Google/GitHub)

### 2.2 Criar Cluster

1. Clique em **"Build a Database"**
2. Selecione **"M0 Free"** (ou M10 para produção)
3. **Provider:** AWS
4. **Region:** `South America (São Paulo) sa-east-1`
5. **Cluster Name:** `prediction-market-prod`
6. Clique em **"Create"**

### 2.3 Configurar Acesso

**Criar usuário de database:**

1. Menu lateral: **Database Access**
2. Clique em **"Add New Database User"**
3. **Authentication Method:** Password
4. **Username:** `pm_api_user`
5. **Password:** Gere uma senha forte (salve!)
6. **Database User Privileges:** Read and write to any database
7. Clique em **"Add User"**

**Configurar IP Whitelist:**

1. Menu lateral: **Network Access**
2. Clique em **"Add IP Address"**
3. Para Railway: Clique em **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - ⚠️ Em produção real, use IPs específicos do Railway
4. Clique em **"Confirm"**

### 2.4 Obter Connection String

1. Menu lateral: **Database**
2. Clique em **"Connect"** no seu cluster
3. Selecione **"Connect your application"**
4. **Driver:** Node.js
5. **Version:** 6.0 or later
6. Copie a connection string:

```
mongodb+srv://pm_api_user:<password>@prediction-market-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

7. Substitua `<password>` pela senha criada
8. Adicione o nome do database antes de `?`:

```
mongodb+srv://pm_api_user:SENHA@prediction-market-prod.xxxxx.mongodb.net/prediction-market?retryWrites=true&w=majority
```

### 2.5 Atualizar .env.production

```env
MONGODB_URI=mongodb+srv://pm_api_user:SENHA@prediction-market-prod.xxxxx.mongodb.net/prediction-market?retryWrites=true&w=majority
```

**Checkpoint:** 🔲 MongoDB Atlas configurado e connection string salva

> **PRÓXIMO PASSO:** Obter a connection string do MongoDB Atlas e preencher `MONGODB_URI` em `.env.production`

---

## 3. Configurar Redis (Upstash) 🔲

### 3.1 Criar Conta

1. Acesse [upstash.com](https://upstash.com)
2. Clique em **"Start for Free"**
3. Faça login com GitHub/Google

### 3.2 Criar Database

1. Clique em **"Create Database"**
2. **Name:** `prediction-market-prod`
3. **Type:** Regional
4. **Region:** `South America (São Paulo)`
5. **TLS:** Enabled (obrigatório)
6. Clique em **"Create"**

### 3.3 Obter Connection String

1. Na página do database, vá para a aba **"Details"**
2. Copie o **"Endpoint"** no formato Redis URL:

```
rediss://default:XXXXXXX@sa-east-1-1.upstash.io:6379
```

⚠️ Note o `rediss://` (com dois S) - indica conexão TLS.

### 3.4 Atualizar .env.production

```env
REDIS_URL=rediss://default:XXXXXXX@sa-east-1-1.upstash.io:6379
```

**Checkpoint:** 🔲 Redis Upstash configurado e connection string salva

> **PRÓXIMO PASSO:** Obter a Redis URL do Upstash e preencher `REDIS_URL` em `.env.production`

---

## 4. Configurar NOWPayments 🔲

### 5.1 Criar Conta

1. Acesse [nowpayments.io](https://nowpayments.io)
2. Clique em **"Sign Up"**
3. Preencha o cadastro

### 5.2 Criar Store

1. Após login, vá para **"Store Settings"**
2. Clique em **"Add Store"**
3. **Store Name:** `Prediction Market`
4. **Store URL:** `https://palpite.me`
5. Salve

### 5.3 Gerar API Key

1. Em **"Store Settings"** → **"API Keys"**
2. Clique em **"Generate API Key"**
3. Copie e salve a API Key

### 5.4 Configurar IPN (Webhook)

1. Vá para **"IPN Settings"**
2. Clique em **"Generate IPN Secret"**
3. Copie e salve o IPN Secret
4. **IPN Callback URL:** `https://api.palpite.me/api/wallet/webhook/nowpayments`
5. **IPN Status:** Enabled
6. Salve as configurações

### 5.5 Configurar Payout Wallet

1. Vá para **"Payout Settings"**
2. Adicione sua wallet USDT:
   - **Currency:** USDT TRC20 (recomendado - fees baixos)
   - **Address:** Seu endereço USDT TRC20
3. Salve

### 5.6 Obter Credenciais de Payout (para saque de rake)

1. Vá para **"Account Settings"**
2. Anote o email da conta
3. Anote a senha (ou crie uma senha de API se disponível)

### 5.7 Atualizar .env.production

```env
NOWPAYMENTS_API_KEY=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
NOWPAYMENTS_IPN_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NOWPAYMENTS_WEBHOOK_URL=https://api.palpite.me/api/wallet/webhook/nowpayments
NOWPAYMENTS_PAYOUT_ADDRESS=TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOWPAYMENTS_PAYOUT_CURRENCY=usdttrc20
NOWPAYMENTS_EMAIL=seu-email@nowpayments.io
NOWPAYMENTS_PASSWORD=sua-senha-nowpayments
```

**Checkpoint:** 🔲 NOWPayments configurado

> **PRÓXIMO PASSO:** Obter API Key, IPN Secret e Payout Address do NOWPayments e preencher em `.env.production`

---

## 5. Deploy da API (Railway) 🔲

### 5.1 Criar Conta Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"Login"** → **"GitHub"**
3. Autorize o acesso ao GitHub

### 5.2 Criar Novo Projeto

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Selecione o repositório `prediction-market`
4. Railway detectará automaticamente o Dockerfile

### 5.3 Configurar Serviço da API

1. Clique no serviço criado
2. Vá para **"Settings"**
3. **Root Directory:** `apps/api`
4. **Dockerfile Path:** `apps/api/Dockerfile`
5. **Watch Paths:** `apps/api/**`, `packages/shared/**`

### 5.4 Configurar Variáveis de Ambiente

1. Vá para a aba **"Variables"**
2. Clique em **"Raw Editor"**
3. Cole todas as variáveis do seu `.env.production`:

```env
NODE_ENV=production
PORT=3001
API_URL=https://api.palpite.me
FRONTEND_URL=https://palpite.me
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
JWT_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...
NOWPAYMENTS_WEBHOOK_URL=https://api.palpite.me/api/wallet/webhook/nowpayments
NOWPAYMENTS_PAYOUT_ADDRESS=...
NOWPAYMENTS_PAYOUT_CURRENCY=usdttrc20
NOWPAYMENTS_EMAIL=...
NOWPAYMENTS_PASSWORD=...
PLATFORM_FEE_PERCENT=3
MIN_BET_AMOUNT=1
MAX_BET_AMOUNT=10000
MIN_DEPOSIT_AMOUNT=5
MIN_WITHDRAWAL_AMOUNT=10
MIN_RAKE_WITHDRAWAL=100
```

### 5.5 Configurar Domínio

1. Vá para **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"** (para teste inicial)
3. Ou clique em **"Custom Domain"** → Adicione `api.palpite.me`

### 5.6 Deploy

1. Railway fará deploy automaticamente
2. Aguarde o build (5-10 minutos)
3. Verifique os logs em **"Deployments"**

### 5.7 Verificar Health Check

```bash
curl https://api.palpite.me/api/health
# Resposta esperada: {"status":"ok","info":{"mongodb":{"status":"up"},"redis":{"status":"up"}}}
```

**Checkpoint:** 🔲 API rodando no Railway

---

## 6. Deploy do Frontend (Vercel) 🔲

### 6.1 Criar Conta Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Sign Up"** → **"Continue with GitHub"**

### 6.2 Importar Projeto

1. Clique em **"Add New..."** → **"Project"**
2. Selecione o repositório `prediction-market`
3. **Framework Preset:** Next.js (auto-detectado)
4. **Root Directory:** `apps/web`

### 6.3 Configurar Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.palpite.me/api` |
| `NEXT_PUBLIC_APP_NAME` | `PredictionMarket` |
| `NEXT_PUBLIC_APP_URL` | `https://palpite.me` |

### 6.4 Configurar Build

Em **"Build & Development Settings"**:
- **Build Command:** `npm run build -w apps/web`
- **Output Directory:** `apps/web/.next`
- **Install Command:** `npm ci`

### 6.5 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (3-5 minutos)
3. Vercel fornecerá uma URL de preview

### 6.6 Configurar Domínio Customizado

1. Vá para **"Settings"** → **"Domains"**
2. Adicione `palpite.me`
3. Adicione `www.palpite.me` (redireciona para root)

**Checkpoint:** 🔲 Frontend rodando no Vercel

---

## 7. Configurar Domínio e SSL 🔲

### 7.1 Registrar Domínio

Registre seu domínio em:
- [Namecheap](https://namecheap.com)
- [Google Domains](https://domains.google)
- [Registro.br](https://registro.br) (para .com.br)

### 7.2 Configurar Cloudflare (Recomendado)

1. Acesse [cloudflare.com](https://cloudflare.com)
2. Clique em **"Add a Site"**
3. Digite seu domínio
4. Selecione o plano **Free**
5. Cloudflare mostrará os nameservers

### 7.3 Atualizar Nameservers

No seu registrador de domínio:

1. Vá para configurações de DNS
2. Altere os nameservers para os do Cloudflare:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
3. Aguarde propagação (até 24h, geralmente minutos)

### 7.4 Configurar DNS Records

No Cloudflare, adicione os seguintes records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| `CNAME` | `@` | `cname.vercel-dns.com` | DNS only |
| `CNAME` | `www` | `cname.vercel-dns.com` | DNS only |
| `CNAME` | `api` | `<seu-app>.up.railway.app` | DNS only |

⚠️ Mantenha **"Proxy status"** como **"DNS only"** para que Vercel e Railway gerenciem o SSL.

### 7.5 Verificar SSL

Após configurar DNS, verifique:

```bash
# Frontend
curl -I https://palpite.me
# Deve retornar HTTP/2 200

# API
curl -I https://api.palpite.me/api/health
# Deve retornar HTTP/2 200
```

**Checkpoint:** 🔲 Domínio e SSL configurados

---

## 8. Configurar CI/CD ✅ (parcial)

> ✅ **FEITO:** Workflows CI/CD criados em `.github/workflows/ci.yml` e `.github/workflows/deploy.yml`
> 🔲 **PENDENTE:** Configurar secrets no GitHub (RAILWAY_TOKEN, VERCEL_TOKEN)

### 8.1 Obter Railway Token

1. No Railway, vá para **"Account Settings"** → **"Tokens"**
2. Clique em **"Create Token"**
3. **Name:** `github-actions`
4. Copie o token

### 8.2 Obter Vercel Token

1. No Vercel, vá para **"Settings"** → **"Tokens"**
2. Clique em **"Create"**
3. **Name:** `github-actions`
4. **Scope:** Full Account
5. Copie o token

### 8.3 Configurar Secrets no GitHub

1. No GitHub, vá para seu repositório
2. **Settings** → **Secrets and variables** → **Actions**
3. Clique em **"New repository secret"**

Adicione os seguintes secrets:

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN` | Token do Railway |
| `VERCEL_TOKEN` | Token do Vercel |

### 8.4 Configurar Variables no GitHub

1. Na mesma página, vá para a aba **"Variables"**
2. Clique em **"New repository variable"**

Adicione para o environment `production`:

| Variable Name | Value |
|---------------|-------|
| `DEPLOY_PLATFORM` | `railway` |
| `API_URL` | `https://api.palpite.me` |
| `FRONTEND_URL` | `https://palpite.me` |
| `NEXT_PUBLIC_API_URL` | `https://api.palpite.me/api` |
| `NEXT_PUBLIC_APP_NAME` | `PredictionMarket` |
| `NEXT_PUBLIC_APP_URL` | `https://palpite.me` |

### 8.5 Testar CI/CD

1. Faça um commit na branch `main`:
   ```bash
   git add .
   git commit -m "test: trigger CI/CD pipeline"
   git push origin main
   ```

2. Vá para **Actions** no GitHub
3. Verifique se o workflow executou com sucesso

**Checkpoint:** 🔲 CI/CD configurado e funcionando (falta adicionar secrets no GitHub)

---

## 9. Configurar Monitoramento 🔲

### 9.1 Configurar Sentry (Error Tracking)

**Backend:**

1. Acesse [sentry.io](https://sentry.io)
2. Crie uma conta ou faça login
3. Crie um novo projeto: **"Node.js"**
4. Copie o DSN

Instale no projeto:
```bash
npm install @sentry/node -w apps/api
```

Adicione ao `.env.production`:
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Frontend:**

1. Crie outro projeto no Sentry: **"Next.js"**
2. Copie o DSN

```bash
npm install @sentry/nextjs -w apps/web
```

### 9.2 Configurar UptimeRobot

1. Acesse [uptimerobot.com](https://uptimerobot.com)
2. Crie uma conta gratuita
3. Clique em **"Add New Monitor"**

**Monitor 1 - API Health:**
- **Monitor Type:** HTTP(s)
- **Friendly Name:** `PM API Health`
- **URL:** `https://api.palpite.me/api/health`
- **Monitoring Interval:** 5 minutes

**Monitor 2 - Frontend:**
- **Monitor Type:** HTTP(s)
- **Friendly Name:** `PM Frontend`
- **URL:** `https://palpite.me`
- **Monitoring Interval:** 5 minutes

### 9.3 Configurar Alertas

No UptimeRobot:

1. Vá para **"My Settings"** → **"Alert Contacts"**
2. Adicione seu email
3. (Opcional) Adicione webhook do Slack/Discord

**Checkpoint:** 🔲 Monitoramento configurado

---

## 10. Testes Finais 🔲

### 10.1 Teste de Registro e Login

```bash
# 1. Criar usuário de teste
curl -X POST https://api.palpite.me/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"Teste123!","username":"testuser"}'

# 2. Login
curl -X POST https://api.palpite.me/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"Teste123!"}'
```

### 10.2 Teste de Depósito (com ngrok para webhook)

**Terminal 1:**
```bash
ngrok http 3001
# Copie a URL (ex: https://abc123.ngrok.io)
```

**Atualize temporariamente o webhook no dashboard:**
- NOWPayments: `https://abc123.ngrok.io/api/wallet/webhook/nowpayments`

**Terminal 2:**
```bash
npm run dev -w apps/api
```

**No navegador:**
1. Acesse `https://palpite.me/login`
2. Faça login
3. Vá para `/wallet`
4. Teste depósito PIX (mínimo R$25)
5. Teste depósito Cartão

### 10.3 Teste de Aposta

1. Acesse `/markets`
2. Selecione um evento
3. Faça uma aposta de $5
4. Verifique se o saldo foi deduzido
5. Verifique no dashboard admin se a aposta aparece

### 10.4 Teste de Saque

1. Vá para `/wallet`
2. Clique em "Sacar"
3. Informe valor ($10 mínimo)
4. Informe endereço crypto e rede
5. Verifique processamento

### 10.5 Teste de Admin

1. Acesse `/admin`
2. Verifique dashboard com métricas
3. Crie um evento de teste
4. Resolva um evento
5. Verifique rake em `/admin/revenue`

**Checkpoint:** 🔲 Todos os testes passando

---

## 11. Go-Live Checklist 🔲

### Críticos (Bloqueia Lançamento)

- [ ] MongoDB Atlas configurado e funcionando
- [ ] Redis Upstash configurado e funcionando
- [ ] NOWPayments configurado
- [ ] Webhooks configurados com URLs de produção
- [ ] API rodando no Railway
- [ ] Frontend rodando no Vercel
- [ ] Domínio configurado com SSL
- [ ] Health checks passando
- [ ] Testes E2E de pagamento passando

### Alta Prioridade

- [ ] CI/CD funcionando
- [ ] Sentry configurado
- [ ] UptimeRobot configurado
- [ ] Backup automático do MongoDB habilitado
- [ ] Alertas de email configurados

### Documentação

- [ ] Termos de Uso publicados em `/terms`
- [ ] Política de Privacidade publicada em `/privacy`
- [ ] FAQ básico em `/faq`

### Pós-Lançamento

- [ ] Criar eventos reais (esportes, crypto, etc)
- [ ] Configurar seed money para liquidez inicial
- [ ] Monitorar logs nas primeiras 24h
- [ ] Configurar backup diário

---

## Comandos Úteis

### Logs

```bash
# Railway - Ver logs da API
railway logs

# Vercel - Ver logs do frontend
vercel logs
```

### Rollback

```bash
# Railway - Rollback para deploy anterior
railway rollback

# Vercel - Rollback para deploy anterior
vercel rollback
```

### Seed de Produção

```bash
# Conectar ao MongoDB Atlas e rodar seed (cuidado!)
# Só faça isso uma vez, antes do lançamento
MONGODB_URI="mongodb+srv://..." npm run seed -w apps/api
```

---

## Troubleshooting

### API não inicia

1. Verifique logs no Railway
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Verifique se MongoDB Atlas está acessível (IP whitelist)

### Webhook não chega

1. Verifique se a URL do webhook está correta
2. Verifique se o domínio tem SSL válido
3. Teste com ngrok para debug

### Frontend não carrega API

1. Verifique CORS no backend (`FRONTEND_URL` configurado)
2. Verifique `NEXT_PUBLIC_API_URL` no Vercel
3. Verifique se não há mixed content (HTTP/HTTPS)

### Erro de autenticação

1. Verifique `JWT_SECRET` é o mesmo em todos os ambientes
2. Verifique se os cookies estão sendo enviados (CORS)

---

## Suporte

- **NOWPayments:** support@nowpayments.io
- **Railway:** [railway.app/help](https://railway.app/help)
- **Vercel:** [vercel.com/help](https://vercel.com/help)
- **MongoDB Atlas:** [mongodb.com/support](https://www.mongodb.com/support)

---

**Última atualização:** 2026-02-23
