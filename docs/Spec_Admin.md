# Especificacao da Area de Administracao

## Sumario Executivo

Este documento especifica a area de administracao do sistema Palpite Market, detalhando funcionalidades existentes, gaps identificados e requisitos para implementacao completa.

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
| Gestao de Usuarios | `/admin/users` | NAO IMPLEMENTADO |
| Configuracoes | `/admin/settings` | NAO IMPLEMENTADO |

### 1.2 Problemas Identificados

1. **Acesso a area admin**: Nao existe link visivel para usuarios admin acessarem `/admin`. O usuario precisa digitar a URL manualmente.

2. **Paginas incompletas**: A sidebar do admin lista "Usuarios" e "Configuracoes", mas essas paginas nao existem.

3. **Gestao de usuarios**: Nao ha forma de listar, editar ou gerenciar usuarios pela interface admin.

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

### 2.2 Endpoints Admin Existentes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/admin/dashboard` | Estatisticas gerais |
| GET | `/api/admin/events` | Listar eventos (filtros) |
| POST | `/api/admin/events` | Criar evento |
| PATCH | `/api/admin/events/:id` | Atualizar evento |
| POST | `/api/admin/events/:id/lock` | Bloquear apostas |
| POST | `/api/admin/events/:id/resolve` | Resolver evento |
| POST | `/api/admin/events/:id/cancel` | Cancelar evento |

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

---

## 3. Funcionalidades Detalhadas

### 3.1 Dashboard Admin (Implementado)

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

### 3.2 Gestao de Eventos (Implementado)

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

### 3.3 Criar Evento (Implementado)

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

### 3.4 Editar Evento (Implementado)

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

### 3.5 Receita/Rake (Implementado)

**Rota:** `/admin/revenue`

**Funcionalidades:**
- Total de receita (rake)
- Saldo disponivel
- Historico de rake por evento
- Top eventos por receita

**Arquivos:**
- `apps/web/src/app/admin/revenue/page.tsx`
- `apps/web/src/hooks/use-revenue.ts`

---

## 4. Funcionalidades a Implementar

### 4.1 Link de Acesso Admin no Site Principal

**Problema:** Usuarios admin nao conseguem acessar `/admin` sem digitar a URL manualmente.

**Solucao:** Adicionar link condicional no header e/ou sidebar para usuarios com `role === ADMIN`.

**Arquivos a modificar:**
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/layout/sidebar.tsx`

**Implementacao sugerida:**

```tsx
// No Header, apos o menu de usuario
{user?.role === UserRole.ADMIN && (
  <Link href="/admin">
    <Button variant="ghost" size="sm">
      <Settings className="h-4 w-4" />
      Admin
    </Button>
  </Link>
)}
```

### 4.2 Pagina de Gestao de Usuarios

**Rota:** `/admin/users`

**Requisitos Funcionais:**

1. **Listagem de usuarios**
   - Tabela com: nome, email, role, saldo, data de cadastro
   - Filtros: por role (user/admin), por status (ativo/inativo)
   - Busca por nome ou email
   - Paginacao

2. **Acoes por usuario**
   - Ver detalhes (apostas, historico, transacoes)
   - Editar role (promover a admin / rebaixar a user)
   - Ajustar saldo (creditar/debitar manualmente)
   - Desativar/reativar conta

3. **Estatisticas**
   - Total de usuarios
   - Usuarios ativos (com apostas nos ultimos 30 dias)
   - Novos usuarios (mes atual)
   - Distribuicao por role

**Endpoints necessarios (backend):**

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/admin/users` | Listar usuarios (paginado, filtros) |
| GET | `/api/admin/users/:id` | Detalhes do usuario |
| PATCH | `/api/admin/users/:id` | Atualizar usuario (role, status) |
| POST | `/api/admin/users/:id/adjust-balance` | Ajustar saldo |
| GET | `/api/admin/users/stats` | Estatisticas de usuarios |

**Arquivos a criar:**
- `apps/web/src/app/admin/users/page.tsx`
- `apps/web/src/app/admin/users/[id]/page.tsx`
- `apps/api/src/modules/admin/dto/user-filters.dto.ts`
- `apps/api/src/modules/admin/dto/adjust-balance.dto.ts`

**Arquivos a modificar:**
- `apps/api/src/modules/admin/admin.controller.ts`
- `apps/api/src/modules/admin/admin.module.ts`
- `apps/api/src/modules/users/users.service.ts`
- `apps/web/src/hooks/use-admin.ts`
- `apps/web/src/lib/api.ts`

### 4.3 Pagina de Configuracoes

**Rota:** `/admin/settings`

**Requisitos Funcionais:**

1. **Configuracoes da plataforma**
   - Taxa de rake (porcentagem, padrao 3%)
   - Valor minimo de aposta
   - Valor maximo de aposta
   - Moeda padrao (BRL, USD)

2. **Configuracoes de pagamento**
   - PIX habilitado (sim/nao)
   - Crypto habilitado (sim/nao)
   - Enderecos de carteira (Ethereum, Bitcoin)

3. **Configuracoes de seguranca**
   - Tempo de sessao (minutos)
   - Tentativas de login antes de bloquear
   - Tempo de bloqueio

4. **Manutencao**
   - Modo de manutencao (on/off)
   - Mensagem de manutencao

**Abordagem sugerida:**

Para MVP, implementar apenas visualizacao das configuracoes atuais (hardcoded ou env vars). Edicao pode ser fase 2.

**Arquivos a criar:**
- `apps/web/src/app/admin/settings/page.tsx`
- `apps/api/src/modules/settings/settings.module.ts`
- `apps/api/src/modules/settings/settings.service.ts`
- `apps/api/src/modules/settings/settings.controller.ts`
- `apps/api/src/modules/settings/schemas/settings.schema.ts`

---

## 5. Priorizacao

### Prioridade Alta (Critico)
1. **Link de acesso admin** - Usuarios admin nao conseguem acessar a area existente
2. **Remover links quebrados** - Remover "Usuarios" e "Configuracoes" da sidebar ate implementacao

### Prioridade Media (Importante)
3. **Pagina de Gestao de Usuarios** - Necessario para operacao da plataforma
4. **Ajuste de saldo manual** - Necessario para suporte ao cliente

### Prioridade Baixa (Nice to have)
5. **Pagina de Configuracoes** - Pode usar env vars por enquanto
6. **Logs de auditoria** - Registrar acoes de admin

---

## 6. Estimativa de Esforco

| Item | Complexidade | Arquivos |
|------|--------------|----------|
| Link acesso admin | Baixa | 2 |
| Remover links quebrados | Baixa | 1 |
| Pagina usuarios (frontend) | Alta | 3 |
| Endpoints usuarios (backend) | Alta | 4 |
| Pagina configuracoes | Media | 4 |

---

## 7. Consideracoes de Seguranca

1. **Todas as rotas admin** devem ser protegidas por `RolesGuard`
2. **Acoes sensiveis** (promover admin, ajustar saldo) devem gerar log de auditoria
3. **Validacao de entrada** em todos os endpoints
4. **Rate limiting** em endpoints de gestao de usuarios
5. **Confirmacao** antes de acoes irreversiveis (promover admin, ajustar saldo negativo)

---

## 8. Padroes de UI/UX

Seguir padroes existentes:
- Tailwind CSS com tema escuro
- Componentes de `@/components/ui/`
- Cards com `rounded-2xl border border-border bg-card`
- Botoes primarios verdes, destructive vermelhos
- Modais para confirmacao de acoes
- Feedback visual de loading (Loader2 animate-spin)
- Mensagens de erro em card com bg-destructive/10
- Texto em portugues

---

## 9. Proximos Passos

1. [ ] Adicionar link de acesso admin no header/sidebar
2. [ ] Remover temporariamente links quebrados da sidebar admin
3. [ ] Implementar endpoints de gestao de usuarios no backend
4. [ ] Criar pagina de listagem de usuarios
5. [ ] Criar pagina de detalhes do usuario
6. [ ] Implementar ajuste de saldo manual
7. [ ] (Opcional) Implementar pagina de configuracoes

---

## Apendice A: Estrutura de Arquivos Admin

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
├── users/               # A CRIAR
│   ├── page.tsx         # Listagem
│   └── [id]/
│       └── page.tsx     # Detalhes
└── settings/            # A CRIAR
    └── page.tsx         # Configuracoes
```

## Apendice B: Endpoints Admin Completos

```
GET    /api/admin/dashboard         # Estatisticas
GET    /api/admin/events            # Listar eventos
POST   /api/admin/events            # Criar evento
PATCH  /api/admin/events/:id        # Atualizar evento
POST   /api/admin/events/:id/lock   # Bloquear
POST   /api/admin/events/:id/resolve# Resolver
POST   /api/admin/events/:id/cancel # Cancelar
GET    /api/admin/users             # Listar usuarios (A CRIAR)
GET    /api/admin/users/:id         # Detalhes usuario (A CRIAR)
PATCH  /api/admin/users/:id         # Atualizar usuario (A CRIAR)
POST   /api/admin/users/:id/adjust  # Ajustar saldo (A CRIAR)
GET    /api/admin/users/stats       # Stats usuarios (A CRIAR)
GET    /api/admin/settings          # Configuracoes (A CRIAR)
PATCH  /api/admin/settings          # Atualizar config (A CRIAR)
```
