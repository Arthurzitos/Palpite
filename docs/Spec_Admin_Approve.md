# Especificacao: Sistema de Aprovacao de Saques

## Sumario Executivo

Este documento especifica o sistema de aprovacao manual de saques, onde o administrador deve revisar e aprovar/rejeitar solicitacoes de saque antes do processamento.

**Status:** IMPLEMENTADO
**Data:** Marco 2026

---

## 1. Problema Atual

### 1.1 Fluxo Atual de Saque

```
Usuario solicita saque -> Sistema valida saldo -> Processa payout automaticamente -> Crypto enviada
```

**Riscos do fluxo atual:**
- Saques fraudulentos podem ser processados sem revisao
- Sem verificacao de atividade suspeita
- Sem controle sobre limites diarios/mensais
- Dificuldade em reverter saques problematicos

### 1.2 Limitacao Atual

O sistema so suporta saques via **criptomoedas** (NowPayments). Nao ha opcao de saque para conta bancaria (PIX/transferencia).

---

## 2. Solucao Proposta

### 2.1 Novo Fluxo de Saque

```
Usuario solicita saque
    -> Sistema valida saldo
    -> Cria transacao com status PENDING_APPROVAL
    -> Admin recebe notificacao
    -> Admin revisa e aprova/rejeita
    -> Se aprovado: processa payout via NowPayments
    -> Se rejeitado: devolve saldo ao usuario
```

### 2.2 Beneficios

- Controle total sobre saques
- Prevencao de fraudes
- Verificacao manual de atividade suspeita
- Auditoria completa de decisoes
- Possibilidade de implementar regras de aprovacao automatica futuramente

---

## 3. Mudancas Tecnicas

### 3.1 Novos Status de Transacao

**Arquivo:** `packages/shared/src/enums/index.ts`

```typescript
export enum TransactionStatus {
  PENDING = 'pending',           // Aguardando processamento externo
  PENDING_APPROVAL = 'pending_approval', // NOVO: Aguardando aprovacao admin
  APPROVED = 'approved',         // NOVO: Aprovado, processando payout
  REJECTED = 'rejected',         // NOVO: Rejeitado pelo admin
  CANCELLED = 'cancelled',       // NOVO: Cancelado pelo usuario
  COMPLETED = 'completed',       // Concluido com sucesso
  FAILED = 'failed',             // Falhou no processamento
}
```

### 3.2 Novos Campos no Schema de Transacao

**Arquivo:** `apps/api/src/modules/transactions/schemas/transaction.schema.ts`

```typescript
// Campos adicionais para aprovacao
@Prop({ type: Types.ObjectId, ref: 'User' })
reviewedBy?: Types.ObjectId;      // Admin que revisou

@Prop()
reviewedAt?: Date;                // Data da revisao

@Prop()
reviewNotes?: string;             // Notas do admin

@Prop()
rejectionReason?: string;         // Motivo da rejeicao (se rejeitado)
```

### 3.3 Novo Schema: WithdrawalRequest (Opcional)

Se preferir separar logica de saques, criar schema dedicado:

```typescript
interface WithdrawalRequest {
  _id: string;
  userId: ObjectId;
  transactionId: ObjectId;
  amount: number;
  address: string;           // Endereco crypto
  network: string;           // Rede (usdttrc20, btc, etc)
  status: WithdrawalStatus;  // pending, approved, rejected, processing, completed, failed

  // Contexto do usuario (snapshot no momento da solicitacao)
  userBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  accountAge: number;        // Dias desde criacao da conta

  // Revisao
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;

  // Processamento
  payoutId?: string;         // ID do NowPayments
  payoutStatus?: string;
  txHash?: string;           // Hash da transacao na blockchain

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. Endpoints da API

### 4.1 Endpoints do Usuario (Existentes - Modificar)

| Metodo | Endpoint | Mudanca |
|--------|----------|---------|
| POST | `/wallet/withdraw` | Criar com status `PENDING_APPROVAL` em vez de processar |
| GET | `/wallet/withdrawals` | NOVO: Listar saques do usuario |
| DELETE | `/wallet/withdrawals/:id` | NOVO: Cancelar saque pendente |
| GET | `/wallet/available-balance` | NOVO: Retornar saldo disponivel (saldo - pendentes) |

### 4.2 Endpoints Admin (Novos)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/admin/withdrawals` | Listar todas solicitacoes de saque |
| GET | `/admin/withdrawals/:id` | Detalhes de uma solicitacao |
| POST | `/admin/withdrawals/:id/approve` | Aprovar saque |
| POST | `/admin/withdrawals/:id/reject` | Rejeitar saque |
| GET | `/admin/withdrawals/stats` | Estatisticas de saques |

### 4.3 Detalhes dos Endpoints

#### GET /admin/withdrawals

**Query params:**
- `status`: pending_approval, approved, rejected, completed, failed
- `page`: Pagina (default: 1)
- `limit`: Itens por pagina (default: 20)
- `search`: Busca por email/username
- `dateFrom`: Data inicial
- `dateTo`: Data final
- `minAmount`: Valor minimo
- `maxAmount`: Valor maximo

**Response:**
```json
{
  "withdrawals": [
    {
      "id": "...",
      "user": {
        "id": "...",
        "email": "user@example.com",
        "username": "user123"
      },
      "amount": 100,
      "address": "TXrk...",
      "network": "usdttrc20",
      "status": "pending_approval",
      "userContext": {
        "balance": 150,
        "totalDeposited": 500,
        "totalWithdrawn": 200,
        "accountAgeDays": 45,
        "totalBets": 23
      },
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "stats": {
    "pendingCount": 5,
    "pendingAmount": 1500,
    "todayApproved": 3,
    "todayRejected": 1
  }
}
```

#### POST /admin/withdrawals/:id/approve

**Body:**
```json
{
  "notes": "Verificado - usuario legitimo" // Opcional
}
```

**Acao:**
1. Valida que status = pending_approval
2. Atualiza status para `approved`
3. Registra reviewedBy, reviewedAt, notes
4. Chama `NowPaymentsService.createPayout()`
5. Atualiza status para `completed` ou `failed`

#### POST /admin/withdrawals/:id/reject

**Body:**
```json
{
  "reason": "Atividade suspeita detectada", // Obrigatorio
  "notes": "Usuario criou conta ha 2 dias e ja quer sacar" // Opcional
}
```

**Acao:**
1. Valida que status = pending_approval
2. Atualiza status para `rejected`
3. Registra reviewedBy, reviewedAt, rejectionReason, notes
4. **Devolve o saldo ao usuario** (importante!)
5. Notifica usuario (se sistema de notificacao implementado)

---

## 5. Interface Admin

### 5.1 Nova Pagina: /admin/withdrawals

**Componentes:**

1. **Cards de estatisticas**
   - Saques pendentes (quantidade e valor)
   - Aprovados hoje
   - Rejeitados hoje
   - Volume total do mes

2. **Filtros**
   - Status (dropdown)
   - Periodo (date range)
   - Valor minimo/maximo
   - Busca por usuario

3. **Tabela de saques**
   - Usuario (link para detalhes)
   - Valor
   - Endereco (truncado)
   - Rede
   - Status (badge colorido)
   - Data
   - Acoes (aprovar/rejeitar)

4. **Indicadores de risco** (badges)
   - Conta nova (< 7 dias)
   - Primeiro saque
   - Valor alto (> media)
   - Sem depositos (so ganhos)

### 5.2 Modal de Aprovacao

```
+------------------------------------------+
|  Aprovar Saque                           |
+------------------------------------------+
|  Usuario: user123 (user@example.com)     |
|  Valor: $100.00                          |
|  Endereco: TXrk...abc123                 |
|  Rede: USDT (TRC20)                      |
|                                          |
|  Contexto do Usuario:                    |
|  - Membro ha: 45 dias                    |
|  - Total depositado: $500                |
|  - Total sacado: $200                    |
|  - Saldo atual: $150                     |
|  - Total de apostas: 23                  |
|                                          |
|  Notas (opcional):                       |
|  [________________________]              |
|                                          |
|  [Cancelar]  [Confirmar Aprovacao]       |
+------------------------------------------+
```

### 5.3 Modal de Rejeicao

```
+------------------------------------------+
|  Rejeitar Saque                          |
+------------------------------------------+
|  Usuario: user123                        |
|  Valor: $100.00                          |
|                                          |
|  Motivo da rejeicao: *                   |
|  [________________________]              |
|                                          |
|  Notas internas (opcional):              |
|  [________________________]              |
|                                          |
|  ATENCAO: O saldo sera devolvido ao      |
|  usuario automaticamente.                |
|                                          |
|  [Cancelar]  [Confirmar Rejeicao]        |
+------------------------------------------+
```

### 5.4 Integracao com Sidebar Admin

Adicionar item no menu:
- Icone: Wallet ou ArrowUpRight
- Label: "Saques"
- Badge: contador de pendentes (se > 0)

---

## 6. Interface do Usuario

### 6.1 Pagina de Carteira - Mudancas

Adicionar secao "Saques Pendentes" mostrando:
- Lista de saques aguardando aprovacao
- Status visual (pendente, aprovado, rejeitado)
- Opcao de cancelar saque pendente
- Motivo de rejeicao (se aplicavel)

### 6.2 Feedback ao Usuario

Ao solicitar saque, mostrar mensagem:
> "Sua solicitacao de saque foi recebida e esta aguardando aprovacao.
> Voce sera notificado quando for processada. Tempo medio: 24 horas."

---

## 7. Regras de Negocio

### 7.1 Validacoes na Solicitacao

1. **Saldo disponivel suficiente** (saldo - saques pendentes >= valor solicitado)
2. Valor minimo: $10
3. Endereco valido (formato basico)
4. Usuario nao bloqueado
5. **Prevencao de duplicidade**: Nao permitir saque identico (mesmo valor + endereco + rede) pendente

### 7.2 Validacoes na Aprovacao

1. Status deve ser `pending_approval`
2. Saldo do usuario ainda suficiente
3. Payout configurado no NowPayments

### 7.3 Regras de Devolucao (Rejeicao)

1. Devolver valor integral ao saldo
2. Registrar transacao de estorno
3. Manter historico da tentativa

### 7.4 Timeout Automatico (Futuro)

Considerar implementar:
- Auto-rejeicao apos X dias sem revisao
- Notificacao ao admin sobre saques antigos

---

## 8. Pendencias Importantes

### 8.1 Pre-requisitos Tecnicos

| Item | Status | Prioridade |
|------|--------|------------|
| Novos status no enum TransactionStatus | Completo | Alta |
| Campos de revisao no schema | Completo | Alta |
| Indices no MongoDB para queries | Completo | Media |

### 8.2 Decisoes Aprovadas

| Decisao | Resposta | Detalhes |
|---------|----------|----------|
| Multiplos saques pendentes? | **SIM** | Permitir varios saques do mesmo usuario, desde que haja saldo disponivel. Nunca permitir saque duplicado (mesmo valor + endereco + rede). |
| Notificacoes por email? | **SIM** | Notificar usuario sobre status do saque (solicitado, aprovado, rejeitado). |
| Cancelamento pelo usuario? | **SIM** | Usuario pode cancelar saque pendente a qualquer momento. |
| Aprovacao automatica? | **NAO** | Iniciar com aprovacao 100% manual. |
| Limites de saque? | **FUTURO** | Implementar posteriormente. |

#### 8.2.1 Calculo de Saldo Disponivel

Para permitir multiplos saques, o sistema deve calcular o "saldo disponivel":

```typescript
saldoDisponivel = saldoAtual - somaSaquesPendentes
```

**Exemplo:**
- Saldo atual: $500
- Saque pendente 1: $100
- Saque pendente 2: $150
- Saldo disponivel: $500 - $100 - $150 = $250
- Usuario pode solicitar novo saque de ate $250

#### 8.2.2 Prevencao de Duplicidade

Antes de criar novo saque, verificar se ja existe saque pendente com:
- Mesmo `amount`
- Mesmo `address`
- Mesmo `network`

Se existir, retornar erro: "Ja existe uma solicitacao de saque identica pendente."

#### 8.2.3 Notificacoes por Email

| Evento | Destinatario | Template |
|--------|--------------|----------|
| Saque solicitado | Usuario | "Sua solicitacao de saque de $X foi recebida e esta em analise." |
| Saque aprovado | Usuario | "Seu saque de $X foi aprovado e esta sendo processado." |
| Saque rejeitado | Usuario | "Seu saque de $X foi rejeitado. Motivo: {reason}" |
| Saque concluido | Usuario | "Seu saque de $X foi enviado. TxHash: {hash}" |
| Novo saque pendente | Admin | "Nova solicitacao de saque: $X de {username}" |

**Implementacao sugerida:**
- Usar servico de email existente ou criar `EmailService`
- Templates em HTML responsivo
- Fila de envio para nao bloquear requisicoes

#### 8.2.4 Cancelamento pelo Usuario

**Endpoint:** `DELETE /wallet/withdrawals/:id`

**Validacoes:**
1. Saque pertence ao usuario
2. Status = `pending_approval` (nao pode cancelar se ja aprovado)

**Acao:**
1. Atualizar status para `cancelled`
2. Saldo automaticamente liberado (ja que usamos calculo de saldo disponivel)
3. Notificar usuario por email (opcional)

### 8.3 Integracao com Sistema Existente

| Componente | Impacto |
|------------|---------|
| `packages/shared/src/enums/index.ts` | Adicionar novos status ao enum |
| `apps/api/src/modules/transactions/schemas/transaction.schema.ts` | Novos campos de revisao |
| `wallet.service.ts` | Modificar `withdraw()`, adicionar `getAvailableBalance()` |
| `wallet.controller.ts` | Adicionar endpoints de listagem/cancelamento/saldo disponivel |
| Criar `admin-withdrawals.controller.ts` | Novo controller |
| Criar `admin-withdrawals.service.ts` | Novo service |
| Criar `email.service.ts` | Servico de envio de emails |
| Dashboard admin | Adicionar contador de pendentes |
| Sidebar admin | Adicionar link para saques |

---

## 9. Estimativa de Implementacao

### Fase 1: Backend Core (Prioridade Alta) - COMPLETO
- [x] Adicionar novos status ao enum (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `CANCELLED`)
- [x] Atualizar schema de Transaction (campos de revisao)
- [x] Implementar calculo de saldo disponivel
- [x] Implementar validacao de duplicidade de saque
- [x] Modificar `withdraw()` para criar pendente
- [x] Endpoint `GET /wallet/withdrawals` (listar saques do usuario)
- [x] Endpoint `DELETE /wallet/withdrawals/:id` (cancelar saque)
- [x] Endpoint `GET /wallet/available-balance` (saldo disponivel)
- [ ] Testes unitarios

### Fase 2: Backend Admin (Prioridade Alta) - COMPLETO
- [x] Criar `admin-withdrawals.controller.ts`
- [x] Criar `admin-withdrawals.service.ts`
- [x] Endpoint `GET /admin/withdrawals` (listar todos)
- [x] Endpoint `GET /admin/withdrawals/:id` (detalhes)
- [x] Endpoint `POST /admin/withdrawals/:id/approve`
- [x] Endpoint `POST /admin/withdrawals/:id/reject`
- [x] Endpoint `GET /admin/withdrawals/stats`
- [ ] Testes unitarios

### Fase 3: Sistema de Email (Prioridade Alta) - COMPLETO
- [x] Criar `EmailService` (ou integrar com existente)
- [x] Configurar provedor de email (console provider, extensivel para SMTP/SendGrid)
- [x] Template: Saque solicitado
- [x] Template: Saque aprovado
- [x] Template: Saque rejeitado
- [x] Template: Saque concluido
- [x] Template: Notificacao para admin

### Fase 4: Frontend Admin (Prioridade Alta) - COMPLETO
- [x] Pagina `/admin/withdrawals`
- [x] Componente de listagem com filtros
- [x] Modal de aprovacao
- [x] Modal de rejeicao
- [x] Integracao com sidebar (link + badge)
- [ ] Contador no dashboard

### Fase 5: Frontend Usuario (Prioridade Media) - COMPLETO
- [x] Mostrar saldo disponivel na carteira
- [x] Secao de saques pendentes
- [x] Botao de cancelar saque
- [x] Historico de saques com status
- [x] Feedback visual (badges de status)

### Fase 6: Melhorias Futuras (Prioridade Baixa)
- [ ] Regras de aprovacao automatica
- [ ] Limites de saque (diario/semanal/mensal)
- [ ] Relatorios e exportacao CSV
- [ ] Notificacoes in-app para admin

---

## 10. Fluxograma

```
                         +-------------------+
                         | Usuario solicita  |
                         |      saque        |
                         +--------+----------+
                                  |
                                  v
                         +-------------------+
                         | Validar:          |
                         | - Saldo disponivel|
                         | - Duplicidade     |
                         +--------+----------+
                                  |
                   +--------------+--------------+
                   |                             |
                   v                             v
          +----------------+            +------------------+
          | Validacao OK   |            | Erro (saldo/dup) |
          +-------+--------+            +------------------+
                  |
                  v
          +----------------+
          | Criar transacao|
          | PENDING_APPROVAL
          +-------+--------+
                  |
                  v
          +----------------+
          | Email: usuario |
          | + admin        |
          +-------+--------+
                  |
     +------------+------------+
     |                         |
     v                         v
+----------+            +-------------+
| Usuario  |            | Admin revisa|
| cancela? |            +------+------+
+----+-----+                   |
     |                  +------+------+
     v                  |             |
+---------+             v             v
|CANCELLED|       +--------+    +---------+
+---------+       | APROVAR|    | REJEITAR|
     |            +---+----+    +----+----+
     v                |              |
+---------+           v              v
| Email:  |     +--------+     +---------+
| cancel  |     | Payout |     | Email:  |
+---------+     | API    |     | rejeitado
                +---+----+     +---------+
                    |               |
               +----+----+          v
               |         |     +---------+
               v         v     | REJECTED|
          +--------+ +------+  +---------+
          |COMPLETED | FAILED|
          +--------+ +------+
               |         |
               v         v
          +---------+ +---------+
          | Email:  | | Email:  |
          | sucesso | | falha   |
          +---------+ +---------+
```

---

## 11. Consideracoes de Seguranca

1. **Apenas admins** podem aprovar/rejeitar
2. **Auditoria completa** de todas as acoes
3. **Validacao dupla** de saldo antes de processar
4. **Rate limiting** nos endpoints
5. **Logs detalhados** para investigacao

---

## Historico do Documento

| Data | Autor | Mudanca |
|------|-------|---------|
| 2026-03-01 | Claude | Criacao inicial |
| 2026-03-01 | Usuario | Decisoes aprovadas: multiplos saques, email, cancelamento |
| 2026-03-01 | Claude | Implementacao completa das Fases 1-5 |

---

## Arquivos Criados/Modificados

### Backend
- `packages/shared/src/enums/index.ts` - Novos status TransactionStatus
- `apps/api/src/modules/transactions/schemas/transaction.schema.ts` - Campos de revisao
- `apps/api/src/modules/transactions/transactions.service.ts` - Novos metodos
- `apps/api/src/modules/wallet/wallet.service.ts` - Modificado withdraw(), novos metodos
- `apps/api/src/modules/wallet/wallet.controller.ts` - Novos endpoints
- `apps/api/src/modules/wallet/dto/withdrawal-filters.dto.ts` - NOVO
- `apps/api/src/modules/admin/admin-withdrawals.service.ts` - NOVO
- `apps/api/src/modules/admin/admin-withdrawals.controller.ts` - NOVO
- `apps/api/src/modules/admin/dto/admin-withdrawal-filters.dto.ts` - NOVO
- `apps/api/src/modules/admin/dto/approve-withdrawal.dto.ts` - NOVO
- `apps/api/src/modules/admin/dto/reject-withdrawal.dto.ts` - NOVO
- `apps/api/src/modules/email/email.service.ts` - NOVO
- `apps/api/src/modules/email/email.module.ts` - NOVO

### Frontend
- `apps/web/src/lib/api.ts` - Novos tipos e APIs
- `apps/web/src/hooks/use-wallet.ts` - Novos metodos
- `apps/web/src/hooks/use-admin-withdrawals.ts` - NOVO
- `apps/web/src/app/admin/withdrawals/page.tsx` - NOVO
- `apps/web/src/app/admin/layout.tsx` - Item no sidebar
- `apps/web/src/app/(app)/wallet/page.tsx` - UI atualizada

---

*Implementacao concluida. Testes unitarios pendentes.*
