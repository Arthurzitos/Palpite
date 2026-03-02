# Especificacao da Area de Administracao

## Sumario Executivo

Este documento especifica a area de administracao do sistema Palpite Market, detalhando funcionalidades implementadas e arquitetura da solucao.

**Status: IMPLEMENTADO** (Atualizado em Março 2026)

---

## 1. Estado Atual

### 1.1 Funcionalidades Implementadas

| Funcionalidade | Rota | Status |
|----------------|------|--------|
| Dashboard | `/admin` | Implementado |
| Listagem de Eventos | `/admin/events` | Implementado |
| Criacao de Eventos | `/admin/events/new` | Implementado |
| Edicao de Eventos | `/admin/events/[id]` | Implementado |
| Receita (Rake) | `/admin/revenue` | Implementado |
| Gestao de Usuarios | `/admin/users` | Implementado |
| Detalhes do Usuario | `/admin/users/[id]` | Implementado |
| Configuracoes | `/admin/settings` | Implementado (MVP) |

### 1.2 Acesso a Area Admin

O acesso a area de administracao esta disponivel atraves de:
- **Header principal**: Link "Admin" visivel apenas para usuarios com `role === ADMIN`
- **URL direta**: `/admin` (protegido por autenticacao e role)

---

## 2. Arquitetura Existente

### 2.1 Autenticacao e Autorizacao

```typescript
// packages/shared/src/enums/index.ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
```

**Backend:**
- `JwtAuthGuard`: Valida token JWT
- `RolesGuard`: Verifica role do usuario
- Decorator `@Roles(UserRole.ADMIN)`: Protege endpoints

**Frontend:**
- `AdminLayout`: Verifica `user.role === UserRole.ADMIN`
- Redireciona para `/login` se nao for admin
- Hook `useAdmin`: State management para operacoes admin
- Hook `useAdminUsers`: State management para gestao de usuarios

### 2.2 Endpoints Admin Existentes

#### Eventos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/admin/dashboard` | Estatisticas gerais |
| GET | `/api/admin/events` | Listar eventos (filtros) |
| POST | `/api/admin/events` | Criar evento |
| PATCH | `/api/admin/events/:id` | Atualizar evento |
| POST | `/api/admin/events/:id/lock` | Bloquear apostas |
| POST | `/api/admin/events/:id/resolve` | Resolver evento |
| POST | `/api/admin/events/:id/cancel` | Cancelar evento |

#### Usuarios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/admin/users` | Listar usuarios (paginado, filtros) |
| GET | `/api/admin/users/:id` | Detalhes do usuario |
| GET | `/api/admin/users/:id/bets` | Apostas do usuario |
| PATCH | `/api/admin/users/:id` | Atualizar usuario (role) |
| POST | `/api/admin/users/:id/adjust-balance` | Ajustar saldo |
| GET | `/api/admin/users/stats` | Estatisticas de usuarios |

### 2.3 Schema de Evento

```typescript
interface Event {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;  // sports, crypto, politics, entertainment, other
  imageUrl?: string;
  status: EventStatus;      // open, locked, resolved, cancelled
  outcomes: Outcome[];
  totalPool: number;
  resolvedOutcomeId?: string;
  resolutionSource?: string;
  startsAt?: string;
  closesAt: string;
  resolvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Outcome {
  _id: string;
  label: string;
  totalPool: number;
  odds: number;
  color?: string;
}
```

### 2.4 Schema de Usuario (Admin View)

```typescript
interface AdminUser {
  _id: string;
  email: string;
  username: string;
  role: UserRole;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Funcionalidades Detalhadas

### 3.1 Dashboard Admin

**Rota:** `/admin`

**Funcionalidades:**
- Volume total de apostas
- Receita (rake) total e disponivel
- Eventos ativos
- Total de apostas
- Total de usuarios
- Lista de eventos recentes
- Eventos por status (abertos, resolvidos, total)
- Resumo de atividade (media por evento, taxa de resolucao)

**Arquivos:**
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/hooks/use-admin.ts`
- `apps/web/src/hooks/use-revenue.ts`

### 3.2 Gestao de Eventos

**Rota:** `/admin/events`

**Funcionalidades:**
- Listagem com paginacao
- Filtro por status (todos, abertos, bloqueados, resolvidos, cancelados)
- Busca por titulo
- Acoes rapidas via menu dropdown:
  - Ver evento (redireciona para `/markets/:id`)
  - Editar (redireciona para `/admin/events/:id`)
  - Bloquear apostas
  - Resolver (modal com selecao de outcome vencedor)
  - Cancelar (modal de confirmacao com valor a reembolsar)

**Arquivos:**
- `apps/web/src/app/admin/events/page.tsx`

### 3.3 Criar Evento

**Rota:** `/admin/events/new`

**Campos:**
- Titulo (obrigatorio, min 3 chars)
- Descricao (obrigatorio, min 10 chars)
- Categoria (selecao visual)
- URL da imagem (opcional)
- Data de inicio (opcional)
- Data de encerramento (obrigatorio)
- Outcomes (min 2, com label e cor)

**Validacoes:**
- Campos obrigatorios
- Data de encerramento no futuro
- Pelo menos 2 outcomes com labels preenchidos

**Arquivos:**
- `apps/web/src/app/admin/events/new/page.tsx`

### 3.4 Editar Evento

**Rota:** `/admin/events/[id]`

**Funcionalidades:**
- Visualizacao de estatisticas (pool, outcomes, data)
- Edicao de campos (apenas se status = open):
  - Titulo
  - Descricao
  - Categoria
  - URL da imagem
  - Data de encerramento
- Botoes de acao:
  - Bloquear (se open)
  - Resolver (se open ou locked)
  - Cancelar (se open)
- Informacoes de resolucao (se resolvido)

**Arquivos:**
- `apps/web/src/app/admin/events/[id]/page.tsx`

### 3.5 Receita/Rake

**Rota:** `/admin/revenue`

**Funcionalidades:**
- Total de receita (rake)
- Saldo disponivel
- Historico de rake por evento
- Top eventos por receita
- Filtro por periodo (dia, semana, mes)

**Arquivos:**
- `apps/web/src/app/admin/revenue/page.tsx`
- `apps/web/src/hooks/use-revenue.ts`

### 3.6 Gestao de Usuarios

**Rota:** `/admin/users`

**Funcionalidades:**
- Estatisticas gerais:
  - Total de usuarios
  - Total de admins
  - Usuarios ativos (com apostas)
  - Novos usuarios no mes
- Listagem com paginacao
- Filtro por role (todos, usuarios, admins)
- Busca por nome ou email
- Acoes por usuario:
  - Ver detalhes
  - Ajustar saldo (creditar/debitar)
  - Toggle admin (promover/rebaixar)

**Arquivos:**
- `apps/web/src/app/admin/users/page.tsx`
- `apps/web/src/hooks/use-admin-users.ts`

### 3.7 Detalhes do Usuario

**Rota:** `/admin/users/[id]`

**Funcionalidades:**
- Informacoes do usuario (nome, email, role)
- Estatisticas:
  - Saldo atual
  - Total apostado
  - Total ganho
  - Membro desde
- Informacoes financeiras:
  - Total depositado
  - Total sacado
  - Lucro/prejuizo
- Historico de apostas com status
- Acoes:
  - Ajustar saldo
  - Toggle admin

**Arquivos:**
- `apps/web/src/app/admin/users/[id]/page.tsx`

### 3.8 Configuracoes

**Rota:** `/admin/settings`

**Funcionalidades (MVP - Read-only):**
- Configuracoes da plataforma:
  - Taxa de rake (3%)
  - Valor minimo de aposta
  - Valor maximo de aposta
  - Moeda (BRL)
- Configuracoes de pagamento:
  - PIX habilitado
  - Crypto habilitado
  - Deposito minimo
  - Saque minimo
- Configuracoes de seguranca:
  - Tempo de sessao
  - Tentativas de login
  - Tempo de bloqueio
- Status de manutencao

**Nota:** Edicao de configuracoes via interface sera implementada em versao futura. Atualmente gerenciado via variaveis de ambiente.

**Arquivos:**
- `apps/web/src/app/admin/settings/page.tsx`

---

## 4. Estrutura de Arquivos Admin

```
apps/web/src/app/admin/
├── layout.tsx           # Layout com sidebar
├── page.tsx             # Dashboard
├── events/
│   ├── page.tsx         # Listagem
│   ├── new/
│   │   └── page.tsx     # Criar evento
│   └── [id]/
│       └── page.tsx     # Editar evento
├── revenue/
│   └── page.tsx         # Receita/Rake
├── users/
│   ├── page.tsx         # Listagem
│   └── [id]/
│       └── page.tsx     # Detalhes
└── settings/
    └── page.tsx         # Configuracoes

apps/web/src/hooks/
├── use-admin.ts         # Store para eventos e dashboard
├── use-admin-users.ts   # Store para gestao de usuarios
└── use-revenue.ts       # Store para receita
```

---

## 5. Consideracoes de Seguranca

1. **Todas as rotas admin** sao protegidas por `RolesGuard`
2. **Validacao de entrada** em todos os endpoints via DTOs
3. **Rate limiting** configurado nos endpoints
4. **Confirmacao** antes de acoes sensiveis (modais de confirmacao)

---

## 6. Padroes de UI/UX

Padroes seguidos:
- Tailwind CSS com tema escuro
- Componentes de `@/components/ui/`
- Cards com `rounded-2xl border border-border bg-card`
- Botoes primarios verdes, destructive vermelhos
- Modais para confirmacao de acoes
- Feedback visual de loading (Loader2 animate-spin)
- Mensagens de erro em card com bg-destructive/10
- Texto em portugues

---

## 7. Proximas Melhorias (Roadmap)

- [ ] Edicao de configuracoes via interface
- [ ] Logs de auditoria para acoes de admin
- [ ] Dashboard com graficos e tendencias
- [ ] Exportacao de dados (CSV/Excel)
- [ ] Sistema de notificacoes para admins

---

## Historico de Implementacao

| Data | Funcionalidade | Status |
|------|----------------|--------|
| 2026-03 | Gestao de Usuarios (listagem, detalhes, toggle role, ajuste de saldo) | Implementado |
| 2026-03 | Pagina de Configuracoes (MVP read-only) | Implementado |
| 2026-03 | Link de acesso admin no Header | Implementado |
| 2026-02 | Dashboard, Eventos, Receita | Implementado |

---

*Documento atualizado em Marco de 2026*
