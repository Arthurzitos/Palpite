# Plano de Implementação: Ativação de Pagamentos

> **Data:** 2026-02-19
> **Status:** Planejamento
> **Estimativa:** 2-3 dias (configuração + testes)

---

## Resumo Executivo

O código de integração de pagamentos está **100% implementado**. O que falta é:
1. Obter credenciais dos gateways
2. Configurar webhooks com URL pública
3. Testar fluxos E2E
4. Deploy em staging com SSL

---

## Fase 1: Configuração de Credenciais (1-2 horas)

### 1.1 CCPayment (Obrigatório)

**Pré-requisitos:**
- [ ] CNPJ ou empresa constituída (para KYB)
- [ ] Email corporativo
- [ ] Documentos da empresa

**Passos:**
1. [ ] Acessar [ccpayment.com](https://ccpayment.com)
2. [ ] Criar conta merchant
3. [ ] Submeter documentos para KYB
4. [ ] Aguardar aprovação (1-3 dias úteis)
5. [ ] Dashboard → Payment API → Criar aplicativo
6. [ ] Copiar `APP_ID` e `APP_SECRET`
7. [ ] Atualizar `apps/api/.env`:
   ```env
   CCPAYMENT_APP_ID=<seu-app-id>
   CCPAYMENT_APP_SECRET=<seu-app-secret>
   ```

### 1.2 NOWPayments (Recomendado)

**Pré-requisitos:**
- [ ] Email
- [ ] Wallet USDT TRC20 (ou outra stablecoin)

**Passos:**
1. [ ] Acessar [nowpayments.io](https://nowpayments.io)
2. [ ] Criar conta
3. [ ] Criar store no dashboard
4. [ ] Store Settings → Gerar API Key
5. [ ] IPN Settings → Gerar IPN Secret
6. [ ] Payout Settings → Configurar wallet USDT TRC20
7. [ ] Atualizar `apps/api/.env`:
   ```env
   NOWPAYMENTS_API_KEY=<seu-api-key>
   NOWPAYMENTS_IPN_SECRET=<seu-ipn-secret>
   NOWPAYMENTS_PAYOUT_ADDRESS=<sua-wallet-usdt>
   NOWPAYMENTS_PAYOUT_CURRENCY=usdttrc20
   ```

---

## Fase 2: Configuração de Webhooks (30 min)

### 2.1 Desenvolvimento (ngrok)

```bash
# Terminal 1: Subir API
npm run dev -w apps/api

# Terminal 2: Expor com ngrok
ngrok http 3001

# Copiar URL (ex: https://abc123.ngrok.io)
```

**Configurar nos dashboards:**
- [ ] **ccpayment:** Dashboard → Payment API → Notify URL
  - URL: `https://abc123.ngrok.io/wallet/webhook/ccpayment`
- [ ] **NOWPayments:** IPN Settings → IPN Callback URL
  - URL: `https://abc123.ngrok.io/wallet/webhook/nowpayments`

**Atualizar .env:**
```env
CCPAYMENT_WEBHOOK_URL=https://abc123.ngrok.io/wallet/webhook/ccpayment
NOWPAYMENTS_WEBHOOK_URL=https://abc123.ngrok.io/wallet/webhook/nowpayments
```

### 2.2 Produção (SSL real)

- [ ] Domínio configurado (ex: `api.prediction.com`)
- [ ] Certificado SSL válido
- [ ] Configurar URLs definitivas nos dashboards dos gateways

---

## Fase 3: Testes E2E (1-2 horas)

### 3.1 Teste de Depósito Crypto (ccpayment)

1. [ ] Logar como usuário de teste
2. [ ] Ir para `/wallet`
3. [ ] Clicar "Depositar" → selecionar crypto
4. [ ] Verificar redirect para checkout ccpayment
5. [ ] Fazer pagamento real (mínimo $5)
6. [ ] Verificar webhook recebido (logs)
7. [ ] Verificar saldo atualizado

**Verificação de logs:**
```bash
# Procurar no terminal da API por:
# [WebhookController] ccpayment webhook received
# [WalletService] Deposit confirmed for user xxx
```

### 3.2 Teste de Depósito PIX (NOWPayments)

1. [ ] Logar como usuário de teste
2. [ ] Ir para `/wallet`
3. [ ] Clicar "Depositar via PIX"
4. [ ] Verificar widget NOWPayments embedded
5. [ ] Escanear QR code e pagar (mínimo R$25)
6. [ ] Aguardar conversão BRL→USDT (1-5 min)
7. [ ] Verificar webhook recebido
8. [ ] Verificar saldo atualizado em USD

### 3.3 Teste de Saque Crypto (ccpayment)

1. [ ] Ter saldo disponível (>$10)
2. [ ] Ir para `/wallet`
3. [ ] Clicar "Sacar"
4. [ ] Informar valor + endereço crypto + rede
5. [ ] Verificar dedução de saldo
6. [ ] Verificar webhook de confirmação
7. [ ] Verificar recebimento na wallet

### 3.4 Teste de Edge Cases

- [ ] Webhook duplicado (mesmo payment_id) → deve ignorar
- [ ] Webhook com assinatura inválida → deve rejeitar (401)
- [ ] Depósito com valor abaixo do mínimo → deve retornar erro
- [ ] Saque com saldo insuficiente → deve retornar erro
- [ ] Saque com endereço inválido → deve retornar erro

---

## Fase 4: Validação de Segurança (30 min)

### 4.1 Verificação de Assinaturas

- [ ] Testar webhook ccpayment com assinatura errada → deve rejeitar
- [ ] Testar webhook NOWPayments com IPN secret errado → deve rejeitar
- [ ] Verificar logs de tentativas rejeitadas

### 4.2 Replay Attack Protection

- [ ] Testar webhook ccpayment com timestamp antigo (>2min) → deve rejeitar

### 4.3 Idempotência

- [ ] Enviar mesmo webhook 2x → deve processar apenas 1x
- [ ] Verificar que não há duplicação de saldo

---

## Fase 5: Deploy Staging (2-4 horas)

### 5.1 Pré-requisitos

- [ ] Servidor/cloud configurado (Railway, Render, AWS, etc)
- [ ] Domínio apontado (ex: `api-staging.prediction.com`)
- [ ] SSL configurado
- [ ] MongoDB Atlas ou equivalente
- [ ] Redis Cloud ou equivalente

### 5.2 Deploy

```bash
# Build
npm run build

# Deploy (exemplo Railway)
railway up
```

### 5.3 Configurar Variáveis de Ambiente em Staging

- [ ] Todas as variáveis do `.env.example`
- [ ] URLs de webhook atualizadas para domínio de staging
- [ ] Atualizar URLs nos dashboards dos gateways

### 5.4 Smoke Tests

- [ ] Health check: `GET /health` → 200
- [ ] Auth: registro + login funcional
- [ ] Depósito crypto funcional
- [ ] Depósito PIX funcional
- [ ] Saque funcional

---

## Cronograma Estimado

| Fase | Tempo | Dependências |
|------|-------|--------------|
| 1. Credenciais | 1-2h (+ tempo KYB) | Documentos da empresa |
| 2. Webhooks | 30min | ngrok instalado |
| 3. Testes E2E | 1-2h | Fases 1-2 completas |
| 4. Segurança | 30min | Fase 3 completa |
| 5. Deploy Staging | 2-4h | Infra cloud pronta |

**Total:** 5-9 horas (excluindo tempo de aprovação KYB)

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| KYB demorado (ccpayment) | Média | Alto | Iniciar processo ASAP; usar NOWPayments enquanto aguarda |
| Webhook não chega | Baixa | Médio | Polling fallback já implementado |
| Conversão PIX com slippage | Baixa | Baixo | Usar `outcome_amount` real |
| Rate limit dos gateways | Baixa | Baixo | Respeitar limites documentados |

---

## Checklist Final para Go-Live

- [ ] KYB aprovado no ccpayment
- [ ] Credenciais configuradas em produção
- [ ] Webhooks configurados com URLs de produção
- [ ] SSL válido
- [ ] Testes E2E passando
- [ ] Monitoring/alertas configurados
- [ ] Backup de wallet configurado
- [ ] Documentação atualizada

---

## Arquivos Relevantes

| Arquivo | Descrição |
|---------|-----------|
| `apps/api/.env.example` | Template de variáveis |
| `apps/api/src/modules/wallet/` | Módulo de wallet completo |
| `apps/api/src/modules/wallet/services/ccpayment.service.ts` | Integração ccpayment |
| `apps/api/src/modules/wallet/services/nowpayments.service.ts` | Integração NOWPayments |
| `apps/api/test/WEBHOOK_TESTING.md` | Guia de testes com ngrok |
| `apps/api/test/wallet-webhook.e2e-spec.ts` | Testes E2E de webhooks |

---

## Contatos de Suporte

| Gateway | Suporte | Tempo de Resposta |
|---------|---------|-------------------|
| ccpayment | support@ccpayment.com | 24-48h |
| NOWPayments | support@nowpayments.io | 24h |
