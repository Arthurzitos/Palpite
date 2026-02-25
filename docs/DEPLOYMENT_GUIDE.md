# Guia de Deploy - Prediction Market

> **Data:** 2026-02-19 | **Atualizado:** 2026-02-25
> **Tempo Estimado:** 2-3 dias
> **Pré-requisitos:** Node.js 20+, Docker, Git, Conta GitHub

---

## Status Atual

| Etapa | Status | Observação |
|-------|--------|------------|
| 1. Preparação Local | ✅ Concluído | Secrets gerados, `.env.production` criado |
| 2. MongoDB Atlas | ✅ Concluído | Cluster configurado em South America |
| 3. Redis (Upstash) | ✅ Concluído | Database configurado em South America |
| 4. NOWPayments | 🔲 Pendente | Falta configurar credenciais de produção |
| 5. Deploy API (Railway) | ✅ Concluído | Online em `api.palpite.me` |
| 6. Deploy Frontend (Railway) | ✅ Concluído | Online em `palpite.me` |
| 7. Domínio e SSL | ⚠️ Em progresso | DNS configurado, aguardando propagação + corrigir CORS |
| 8. CI/CD | ✅ Concluído | Workflows criados, falta configurar secrets no GitHub |
| 9. Monitoramento | 🔲 Pendente | - |
| 10. Testes Finais | 🔲 Pendente | - |

### Problemas Atuais

| Problema | Status | Solução |
|----------|--------|---------|
| Erro de CORS no login | ⚠️ Pendente | Configurar `FRONTEND_URL=https://palpite.me` na API |
| Seed não executado | ⚠️ Pendente | Rodar seed no banco de produção |

---

## Índice

1. [Preparação Local](#1-preparação-local)
2. [Configurar MongoDB Atlas](#2-configurar-mongodb-atlas)
3. [Configurar Redis (Upstash)](#3-configurar-redis-upstash)
4. [Configurar NOWPayments](#4-configurar-nowpayments)
5. [Deploy da API (Railway)](#5-deploy-da-api-railway)
6. [Deploy do Frontend (Railway)](#6-deploy-do-frontend-railway)
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

> ✅ **FEITO:** Secrets gerados e salvos

### 1.2 Criar arquivo .env.production ✅

Arquivo criado em `apps/api/.env.production` (NÃO commitar):

```env
# APP
NODE_ENV=production
PORT=3001
API_URL=https://api.palpite.me
FRONTEND_URL=https://palpite.me

# DATABASE
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...

# AUTH
JWT_SECRET=<seu-jwt-secret-64-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<seu-refresh-secret-64-chars>
JWT_REFRESH_EXPIRES_IN=7d

# NOWPAYMENTS
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

**Checkpoint:** ✅ Secrets gerados e salvos em local seguro

---

## 2. Configurar MongoDB Atlas ✅

### 2.1 Criar Conta ✅

1. Acesse [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Clique em **"Try Free"**
3. Preencha o cadastro (pode usar Google/GitHub)

### 2.2 Criar Cluster ✅

1. Clique em **"Build a Database"**
2. Selecione **"M0 Free"** (ou M10 para produção)
3. **Provider:** AWS
4. **Region:** `South America (São Paulo) sa-east-1`
5. **Cluster Name:** `prediction-market-prod`
6. Clique em **"Create"**

### 2.3 Configurar Acesso ✅

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
4. Clique em **"Confirm"**

### 2.4 Obter Connection String ✅

```
mongodb+srv://pm_api_user:SENHA@prediction-market-prod.xxxxx.mongodb.net/prediction-market?retryWrites=true&w=majority
```

**Checkpoint:** ✅ MongoDB Atlas configurado e connection string salva

---

## 3. Configurar Redis (Upstash) ✅

### 3.1 Criar Conta ✅

1. Acesse [upstash.com](https://upstash.com)
2. Clique em **"Start for Free"**
3. Faça login com GitHub/Google

### 3.2 Criar Database ✅

1. Clique em **"Create Database"**
2. **Name:** `prediction-market-prod`
3. **Type:** Regional
4. **Region:** `South America (São Paulo)`
5. **TLS:** Enabled (obrigatório)
6. Clique em **"Create"**

### 3.3 Obter Connection String ✅

```
rediss://default:XXXXXXX@sa-east-1-1.upstash.io:6379
```

**Checkpoint:** ✅ Redis Upstash configurado e connection string salva

---

## 4. Configurar NOWPayments 🔲

### 4.1 Criar Conta

1. Acesse [nowpayments.io](https://nowpayments.io)
2. Clique em **"Sign Up"**
3. Preencha o cadastro

### 4.2 Criar Store

1. Após login, vá para **"Store Settings"**
2. Clique em **"Add Store"**
3. **Store Name:** `Palpite.me`
4. **Store URL:** `https://palpite.me`
5. Salve

### 4.3 Gerar API Key

1. Em **"Store Settings"** → **"API Keys"**
2. Clique em **"Generate API Key"**
3. Copie e salve a API Key

### 4.4 Configurar IPN (Webhook)

1. Vá para **"IPN Settings"**
2. Clique em **"Generate IPN Secret"**
3. Copie e salve o IPN Secret
4. **IPN Callback URL:** `https://api.palpite.me/api/wallet/webhook/nowpayments`
5. **IPN Status:** Enabled
6. Salve as configurações

### 4.5 Configurar Payout Wallet

1. Vá para **"Payout Settings"**
2. Adicione sua wallet USDT:
   - **Currency:** USDT TRC20 (recomendado - fees baixos)
   - **Address:** Seu endereço USDT TRC20
3. Salve

### 4.6 Atualizar Variáveis na API (Railway)

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

---

## 5. Deploy da API (Railway) ✅

### 5.1 Criar Conta Railway ✅

1. Acesse [railway.app](https://railway.app)
2. Clique em **"Login"** → **"GitHub"**
3. Autorize o acesso ao GitHub

### 5.2 Criar Novo Projeto ✅

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Selecione o repositório `prediction-market`

### 5.3 Configurar Serviço da API ✅

**Settings → Build & Deploy:**

| Campo | Valor |
|-------|-------|
| Root Directory | `/` (raiz) |
| Build Command | `npm run build --workspace=@prediction-market/shared && npm run build --workspace=@prediction-market/api` |
| Start Command | `npm run start --workspace=@prediction-market/api` |

### 5.4 Configurar Variáveis de Ambiente ✅

Na aba **Variables**, adicionar:

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

### 5.5 Configurar Domínio ✅

1. Vá para **Settings** → **Networking** → **Custom Domain**
2. Adicione `api.palpite.me`
3. **Custom Port:** `3001`
4. Configure o DNS conforme instruções do Railway

**Checkpoint:** ✅ API rodando no Railway

---

## 6. Deploy do Frontend (Railway) ✅

> **Nota:** Optamos por Railway ao invés de Vercel para manter tudo em uma plataforma.

### 6.1 Criar Serviço Web no Railway ✅

1. No mesmo projeto, clique em **"+ Create"**
2. Selecione **"GitHub Repo"**
3. Selecione o mesmo repositório

### 6.2 Configurar Build ✅

**Settings → Build & Deploy:**

| Campo | Valor |
|-------|-------|
| Root Directory | `/` (raiz) |
| Build Command | `npm run build --workspace=@prediction-market/shared && npm run build --workspace=@prediction-market/web` |
| Start Command | `npm run start --workspace=@prediction-market/web` |

> **Problema encontrado:** O Railpack (builder padrão) não compilava o `@prediction-market/shared` antes do web, causando erro:
> ```
> Module not found: Can't resolve '@prediction-market/shared'
> ```
> **Solução:** Configurar build command customizado que compila shared primeiro.

### 6.3 Configurar Variáveis de Ambiente ✅

```env
NEXT_PUBLIC_API_URL=https://api.palpite.me/api
NEXT_PUBLIC_APP_NAME=PredictionMarket
NEXT_PUBLIC_APP_URL=https://palpite.me
PORT=3000
```

### 6.4 Configurar Domínio ✅

1. Vá para **Settings** → **Networking** → **Custom Domain**
2. Adicione `palpite.me`
3. **Custom Port:** `3000`
4. Configure o DNS conforme instruções do Railway

**Checkpoint:** ✅ Frontend rodando no Railway

---

## 7. Configurar Domínio e SSL ⚠️

### 7.1 Domínio Registrado ✅

- **Domínio:** `palpite.me`
- **Registrador:** Spaceship.com

### 7.2 Configurar DNS (Spaceship) ✅

1. Acesse [spaceship.com](https://spaceship.com) e faça login
2. Vá em **Launchpad** → **Gestor de Domínios**
3. Clique em `palpite.me`
4. Vá em **Servidores de nomes e DNS** → **Gerenciar configurações de DNS**

**Registros DNS configurados:**

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | `@` | `ag6bmyoc.up.railway.app` |
| TXT | `_railway-verify` | `railway-verify=5ad765257189f880383b5f1fd32f...` |
| CNAME | `api` | `[valor fornecido pelo Railway]` |
| TXT | `_railway-verify.api` | `[valor fornecido pelo Railway]` |

### 7.3 Aguardar Propagação DNS

- **Tempo estimado:** 5-15 minutos (pode levar até 1h)
- **Verificar:** Os domínios devem ficar verdes no Railway (sem ⚠️)

### 7.4 Corrigir Erro de CORS ⚠️ PENDENTE

**Problema:** Ao tentar fazer login, aparece erro de CORS:
```
Access to XMLHttpRequest has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

**Causa:** A variável `FRONTEND_URL` na API não estava configurada com o domínio de produção.

**Solução:**

1. No Railway, serviço **@prediction-market/api**
2. Vá em **Variables**
3. Certifique-se que existe:
   ```
   FRONTEND_URL=https://palpite.me
   ```
4. Faça **Redeploy**

### 7.5 Verificar SSL

Após DNS propagar e CORS corrigido:

```bash
# Frontend
curl -I https://palpite.me
# Deve retornar HTTP/2 200

# API
curl -I https://api.palpite.me/api/health
# Deve retornar HTTP/2 200
```

**Checkpoint:** ⚠️ DNS configurado, aguardando propagação + corrigir CORS

---

## 8. Configurar CI/CD ✅ (parcial)

> ✅ **FEITO:** Workflows CI/CD criados em `.github/workflows/ci.yml` e `.github/workflows/deploy.yml`
> 🔲 **PENDENTE:** Configurar secrets no GitHub (RAILWAY_TOKEN)

### 8.1 Obter Railway Token

1. No Railway, vá para **Account Settings** → **Tokens**
2. Clique em **"Create Token"**
3. **Name:** `github-actions`
4. Copie o token

### 8.2 Configurar Secrets no GitHub

1. No GitHub, vá para seu repositório
2. **Settings** → **Secrets and variables** → **Actions**
3. Clique em **"New repository secret"**

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN` | Token do Railway |

### 8.3 Configurar Variables no GitHub

| Variable Name | Value |
|---------------|-------|
| `DEPLOY_PLATFORM` | `railway` |
| `API_URL` | `https://api.palpite.me` |
| `FRONTEND_URL` | `https://palpite.me` |
| `NEXT_PUBLIC_API_URL` | `https://api.palpite.me/api` |
| `NEXT_PUBLIC_APP_NAME` | `PredictionMarket` |
| `NEXT_PUBLIC_APP_URL` | `https://palpite.me` |

**Checkpoint:** ✅ Workflows criados, 🔲 falta configurar secrets no GitHub

---

## 9. Configurar Monitoramento 🔲

### 9.1 Configurar Sentry (Error Tracking)

**Backend:**

1. Acesse [sentry.io](https://sentry.io)
2. Crie uma conta ou faça login
3. Crie um novo projeto: **"Node.js"**
4. Copie o DSN

```bash
npm install @sentry/node -w apps/api
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
3. Adicione monitores:

**Monitor 1 - API Health:**
- **URL:** `https://api.palpite.me/api/health`
- **Interval:** 5 minutes

**Monitor 2 - Frontend:**
- **URL:** `https://palpite.me`
- **Interval:** 5 minutes

**Checkpoint:** 🔲 Monitoramento configurado

---

## 10. Testes Finais 🔲

### 10.1 Executar Seed no Banco de Produção

```bash
# Localmente, com a connection string do Atlas
MONGODB_URI="mongodb+srv://usuario:senha@cluster.mongodb.net/prediction-market" npm run seed --workspace=@prediction-market/api
```

**Credenciais de teste criadas pelo seed:**

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | `admin@prediction.local` | `Admin123!` |
| Usuário | `user@prediction.local` | `User123!` |
| Usuário 2 | `user2@prediction.local` | `User123!` |

### 10.2 Teste de Registro e Login

1. Acesse `https://palpite.me`
2. Crie uma conta nova ou use as credenciais de teste
3. Faça login

### 10.3 Teste de Listagem de Eventos

1. Acesse `/markets`
2. Verifique se os eventos carregam
3. Clique em um evento para ver detalhes

### 10.4 Teste de Depósito

1. Vá para `/wallet`
2. Clique em "Depositar"
3. Teste depósito PIX (mínimo R$25)

### 10.5 Teste de Aposta

1. Selecione um evento
2. Faça uma aposta de $5
3. Verifique se o saldo foi deduzido

### 10.6 Teste de Admin

1. Acesse `/admin` com credenciais de admin
2. Verifique dashboard com métricas
3. Crie um evento de teste

**Checkpoint:** 🔲 Todos os testes passando

---

## 11. Go-Live Checklist

### Críticos (Bloqueia Lançamento)

- [x] MongoDB Atlas configurado e funcionando
- [x] Redis Upstash configurado e funcionando
- [ ] NOWPayments configurado
- [ ] Webhooks configurados com URLs de produção
- [x] API rodando no Railway
- [x] Frontend rodando no Railway
- [ ] Domínio configurado com SSL (aguardando propagação)
- [ ] CORS corrigido (`FRONTEND_URL=https://palpite.me`)
- [ ] Health checks passando
- [ ] Testes E2E de pagamento passando

### Alta Prioridade

- [ ] CI/CD funcionando (falta secrets no GitHub)
- [ ] Sentry configurado
- [ ] UptimeRobot configurado
- [ ] Seed executado no banco de produção
- [ ] Alertas de email configurados

### Documentação

- [ ] Termos de Uso publicados em `/terms`
- [ ] Política de Privacidade publicada em `/privacy`
- [ ] FAQ básico em `/faq`

### Pós-Lançamento

- [ ] Criar eventos reais (esportes, crypto, etc)
- [ ] Configurar seed money para liquidez inicial
- [ ] Monitorar logs nas primeiras 24h
- [ ] Configurar backup diário no MongoDB Atlas

---

## Troubleshooting

### Build do Web falha com "Can't resolve '@prediction-market/shared'"

**Causa:** O Railpack não compila o pacote shared antes do web.

**Solução:** Configurar build command customizado:
```
npm run build --workspace=@prediction-market/shared && npm run build --workspace=@prediction-market/web
```

### Erro de CORS no login

**Causa:** `FRONTEND_URL` não está configurado na API.

**Solução:**
1. No Railway, serviço da API
2. Variables → adicionar `FRONTEND_URL=https://palpite.me`
3. Redeploy

### API não inicia

1. Verifique logs no Railway
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Verifique se MongoDB Atlas está acessível (IP whitelist `0.0.0.0/0`)

### Webhook não chega

1. Verifique se a URL do webhook está correta
2. Verifique se o domínio tem SSL válido
3. Teste com ngrok para debug

### DNS não propaga

1. Aguarde até 1 hora
2. Verifique se os registros estão corretos no Spaceship
3. Use [dnschecker.org](https://dnschecker.org) para verificar propagação

---

## Comandos Úteis

### Seed de Produção

```bash
# Conectar ao MongoDB Atlas e rodar seed
MONGODB_URI="mongodb+srv://..." npm run seed --workspace=@prediction-market/api
```

### Verificar Health

```bash
curl https://api.palpite.me/api/health
```

### Verificar DNS

```bash
# Linux/Mac
nslookup palpite.me
nslookup api.palpite.me

# Ou use dnschecker.org
```

---

## Suporte

- **Railway:** [railway.app/help](https://railway.app/help)
- **Spaceship:** [spaceship.com/support](https://spaceship.com/support)
- **MongoDB Atlas:** [mongodb.com/support](https://www.mongodb.com/support)
- **NOWPayments:** support@nowpayments.io

---

**Última atualização:** 2026-02-25
