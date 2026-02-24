# Guia de Testes de Webhooks com ngrok

Este guia explica como testar os webhooks de ccpayment e NOWPayments em ambiente local usando ngrok.

## Pré-requisitos

1. **ngrok instalado**
   ```bash
   # Via npm
   npm install -g ngrok

   # Ou via Chocolatey (Windows)
   choco install ngrok

   # Ou via Homebrew (Mac)
   brew install ngrok
   ```

2. **Conta no ngrok** (gratuita)
   - Registre-se em https://ngrok.com
   - Configure seu authtoken:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## Passo 1: Iniciar o Backend Local

```bash
# Na raiz do projeto
npm run dev -w apps/api
# Backend rodando em http://localhost:3001
```

## Passo 2: Expor com ngrok

```bash
# Em outro terminal
ngrok http 3001

# Saída será algo como:
# Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

Copie a URL HTTPS gerada (ex: `https://abc123.ngrok.io`).

## Passo 3: Configurar Webhooks nos Providers

### ccpayment

1. Acesse https://ccpayment.com → Dashboard → Payment API → Webhook Settings
2. Configure o Webhook URL:
   ```
   https://abc123.ngrok.io/api/wallet/webhook/ccpayment
   ```
3. Salve as configurações

### NOWPayments

1. Acesse https://account.nowpayments.io → Store Settings → IPN Settings
2. Configure o IPN Callback URL:
   ```
   https://abc123.ngrok.io/api/wallet/webhook/nowpayments
   ```
3. Salve as configurações

## Passo 4: Testar Webhooks

### Teste de Depósito Crypto (ccpayment)

1. Faça login na aplicação
2. Vá para a página de Wallet
3. Clique em "Depositar" → selecione crypto
4. Complete o pagamento no checkout do ccpayment
5. O webhook será enviado para sua máquina local

### Teste de Depósito PIX (NOWPayments)

1. Faça login na aplicação
2. Vá para a página de Wallet
3. Clique em "Depositar via PIX"
4. O widget NOWPayments será exibido
5. Complete o pagamento com PIX
6. O webhook será enviado para sua máquina local

## Passo 5: Monitorar Webhooks

### Via ngrok Dashboard

Acesse http://localhost:4040 para ver:
- Todas as requisições recebidas
- Headers e body de cada webhook
- Response do seu servidor
- Opção de "replay" para reenviar webhooks

### Via Logs do Backend

Os logs estruturados mostrarão:
```
INFO [Webhook]: ccpayment received (ref: tx-123)
INFO [Webhook]: ccpayment processed (ref: tx-123)
```

## Teste Manual com cURL

### ccpayment Webhook

```bash
# Gerar timestamp e assinatura
TIMESTAMP=$(date +%s)
BODY='{"order_id":"test-123","pay_status":"success","amount":"100","merchant_order_id":"tx-123"}'
APP_ID="seu-app-id"
APP_SECRET="seu-app-secret"
SIGN=$(echo -n "${APP_ID}${APP_SECRET}${TIMESTAMP}${BODY}" | sha256sum | cut -d' ' -f1)

curl -X POST https://abc123.ngrok.io/api/wallet/webhook/ccpayment \
  -H "Content-Type: application/json" \
  -H "timestamp: $TIMESTAMP" \
  -H "sign: $SIGN" \
  -d "$BODY"
```

### NOWPayments Webhook

```bash
# Node.js script para gerar assinatura
node -e "
const crypto = require('crypto');
const body = {
  payment_id: 12345,
  payment_status: 'finished',
  order_id: 'tx-123',
  outcome_amount: '100'
};
const sorted = JSON.stringify(body, Object.keys(body).sort());
const sig = crypto.createHmac('sha512', 'seu-ipn-secret').update(sorted).digest('hex');
console.log('x-nowpayments-sig:', sig);
console.log('body:', JSON.stringify(body));
"

# Usar os valores gerados no curl
curl -X POST https://abc123.ngrok.io/api/wallet/webhook/nowpayments \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: SIGNATURE_GERADA" \
  -d '{"payment_id":12345,"payment_status":"finished","order_id":"tx-123","outcome_amount":"100"}'
```

## Testes E2E Automatizados

Os testes E2E em `test/*.e2e-spec.ts` podem ser executados sem ngrok:

```bash
# Executa todos os testes E2E
npm run test:e2e -w apps/api
```

Esses testes usam MongoDB em memória e validam:
- Verificação de assinatura
- Proteção contra replay attack
- Idempotência
- Processamento correto de status

## Troubleshooting

### Webhook não chega

1. Verifique se o ngrok está rodando
2. Confirme a URL no dashboard do provider
3. Verifique se a URL inclui `/api/` no path

### Assinatura inválida

1. Confirme APP_SECRET/IPN_SECRET no .env
2. Verifique se o rawBody está habilitado no main.ts
3. Confira o formato do body (JSON válido)

### Timeout no webhook

1. Webhooks devem retornar em < 30 segundos
2. Processe pesado em background (filas)
3. Retorne 200 imediatamente, processe depois

## Variáveis de Ambiente para Teste

Adicione ao seu `apps/api/.env`:

```env
# Para usar com ngrok
CCPAYMENT_WEBHOOK_URL=https://abc123.ngrok.io/api/wallet/webhook/ccpayment
NOWPAYMENTS_WEBHOOK_URL=https://abc123.ngrok.io/api/wallet/webhook/nowpayments
```

## Boas Práticas

1. **Idempotência**: Sempre verifique se o webhook já foi processado
2. **Logging**: Registre todos os webhooks (sucesso e falha)
3. **Timeout**: Responda rápido, processe em background
4. **Retry**: Providers reenviam webhooks em caso de falha
5. **Segurança**: SEMPRE valide a assinatura antes de processar
