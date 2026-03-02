# Erros e Bugs Identificados

Data da análise: 2026-03-01
**Última atualização: 2026-03-01**

---

## 1. Erro de TypeScript - Tipo de Status Desatualizado

**Severidade:** 🔴 Crítica (quebra o build)

**Arquivo:** `apps/web/src/app/(app)/history/page.tsx:26`

**Status:** ✅ **CORRIGIDO**

**Descrição:**
O tipo `HistoryItem.status` não incluía os novos status de transação adicionados para o sistema de aprovação de saques.

**Correções aplicadas:**
1. Atualizada a interface `HistoryItem` para incluir todos os status:
   ```typescript
   status: 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'failed';
   ```

2. Adicionados badges de UI para exibir todos os novos status (pending_approval, approved, rejected, cancelled, failed)

---

## 2. Variável Não Utilizada

**Severidade:** 🟡 Média (warning de lint)

**Arquivo:** `apps/api/src/modules/bets/services/settlement.service.ts:243`

**Status:** ✅ **CORRIGIDO**

**Descrição:**
A variável `totalRefunded` era incrementada mas nunca utilizada.

**Correções aplicadas:**
1. Adicionado campo `totalRefunded` à interface `SettlementResult`
2. A variável agora é retornada em todos os métodos de settlement (refundAllBets, cancelEvent)
3. Isso permite tracking de métricas de reembolso

---

## 3. Uso de `any` em Arquivos de Teste

**Severidade:** 🟢 Baixa (boas práticas)

**Arquivos afetados:**
- `apps/api/src/modules/users/users.service.spec.ts` (8 ocorrências)
- `apps/api/src/modules/wallet/services/nowpayments.service.spec.ts` (1 ocorrência)
- `apps/api/src/modules/wallet/services/payment-polling.service.spec.ts` (13 ocorrências)

**Status:** ⏳ **PENDENTE** (baixa prioridade)

**Descrição:**
Uso de `@typescript-eslint/no-explicit-any` em mocks e fixtures de teste.

**Nota:** Este é um problema de baixa prioridade que não afeta o funcionamento do código. Os mocks com `any` são aceitáveis em arquivos de teste, desde que devidamente comentados.

---

## 4. Arquivos E2E Não Incluídos no TSConfig

**Severidade:** 🟢 Baixa (configuração)

**Arquivos afetados:**
- `apps/api/test/auth.e2e-spec.ts`
- `apps/api/test/health.e2e-spec.ts`
- `apps/api/test/setup.ts`
- `apps/api/test/wallet-webhook.e2e-spec.ts`

**Status:** ✅ **CORRIGIDO**

**Descrição:**
Os arquivos de teste e2e não estavam incluídos no `tsconfig.json`, causando erro de parsing no ESLint.

**Correções aplicadas:**
1. Criado `apps/api/tsconfig.e2e.json` que estende o tsconfig base e inclui os arquivos de teste
2. Atualizado `.eslintrc.js` para usar ambos os tsconfigs no parserOptions

---

## 5. Require Statement em Arquivo de Teste

**Severidade:** 🟢 Baixa (boas práticas)

**Arquivo:** `apps/api/src/modules/wallet/services/nowpayments.service.spec.ts:97`

**Status:** ✅ **CORRIGIDO**

**Descrição:**
Uso de `require()` ao invés de `import` em arquivo TypeScript.

**Correções aplicadas:**
1. Adicionado `import * as crypto from 'crypto';` no topo do arquivo
2. Removido o `require('crypto')` inline do teste

---

## Resumo de Prioridades

| # | Erro | Severidade | Status |
|---|------|------------|--------|
| 1 | Tipo de Status Desatualizado | 🔴 Crítica | ✅ Corrigido |
| 2 | Variável Não Utilizada | 🟡 Média | ✅ Corrigido |
| 3 | Uso de `any` em Testes | 🟢 Baixa | ⏳ Pendente (baixa prioridade) |
| 4 | TSConfig E2E | 🟢 Baixa | ✅ Corrigido |
| 5 | Require em Teste | 🟢 Baixa | ✅ Corrigido |

---

## Comandos para Verificação

```bash
# Verificar erros de TypeScript
npm run typecheck

# Verificar erros de lint
npm run lint

# Executar testes
npm run test
```
