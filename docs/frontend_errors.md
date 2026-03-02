# Frontend - Correções Planejadas

**Data:** 02/03/2026
**Status:** Pendente Implementação

---

## Sumário de Problemas

| # | Problema | Componente | Prioridade |
|---|----------|------------|------------|
| 1 | TickerBar removida incorretamente | `ticker-bar.tsx` | Alta |
| 2 | Categorias não redirecionam/destacam | `category-tabs.tsx`, `sidebar.tsx` | Alta |
| 3 | BetSlip sempre visível | `bet-slip.tsx` | Média |

---

## 1. TickerBar - Barra Animada de Contratos

### Descrição do Problema

A barra animada que exibia contratos no topo do site foi **completamente removida** no commit `7ffb074`. O usuário deseja:

- **Manter** a barra animada com scroll infinito
- **Remover** apenas o espaço vazio/área de scroll que existia antes

### Arquivos Afetados

- `apps/web/src/components/layout/ticker-bar.tsx` - **DELETADO** (precisa recriar)
- `apps/web/src/components/layout/index.ts` - Exportação removida
- `apps/web/src/app/(app)/layout.tsx` - Import e uso removidos

### Estrutura Original (para referência)

```tsx
// ticker-bar.tsx - Estrutura original
const mockTickerData = [
  { id: '1', title: 'Bitcoin $150K', price: 44, change: 2.5 },
  { id: '2', title: 'Brasil Copa 2026', price: 68, change: -1.2 },
  // ... 8 itens
]

// Animação CSS com @keyframes scroll
// Duplicação de itens para efeito infinito
```

### Causa Raiz

O componente tinha `overflow-x: auto` ou padding excessivo que criava uma área de scroll separada da animação.

### Plano de Correção

1. **Recriar** `ticker-bar.tsx` com estrutura simplificada
2. **CSS necessário:**
   ```css
   .ticker-container {
     overflow: hidden;        /* Impedir scroll manual */
     white-space: nowrap;
     height: 32px;            /* Altura fixa sem padding extra */
   }

   .ticker-content {
     display: inline-flex;
     animation: scroll 30s linear infinite;
   }

   @keyframes scroll {
     0% { transform: translateX(0); }
     100% { transform: translateX(-50%); }
   }
   ```
3. **Adicionar** de volta ao `layout.tsx` do app
4. **Re-exportar** em `index.ts`

### Critérios de Aceite

- [ ] Barra animada visível no topo
- [ ] Scroll automático funcionando
- [ ] Sem área de scroll manual
- [ ] Altura compacta (32px máximo)
- [ ] Dados de contratos exibidos (mock ou real)

---

## 2. Botões de Categorias - Redirecionamento e Destaque

### Descrição do Problema

Os botões de categorias (tanto no `CategoryTabs` horizontal quanto no `Sidebar`) não estão:

1. **Redirecionando** corretamente para a categoria selecionada
2. **Destacando** a categoria ativa visualmente

### Arquivos Afetados

- `apps/web/src/components/markets/category-tabs.tsx`
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/app/(app)/markets/page.tsx`

### Análise Técnica

#### CategoryTabs (Barra Horizontal)

**Problema atual:**
```tsx
// category-tabs.tsx
const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')

const handleCategoryChange = (category: CategoryFilter) => {
  setActiveCategory(category)
  onCategoryChange?.(category)  // Apenas estado local, não atualiza URL
}
```

**Falha:** O componente usa estado local (`useState`) em vez de sincronizar com a URL. Quando o usuário clica, a categoria muda visualmente mas:
- A URL não é atualizada
- Refresh da página perde a seleção
- Não sincroniza com a sidebar

#### Sidebar (Menu Lateral)

**Problema atual:**
```tsx
// sidebar.tsx - Categorias
const categories = [
  { href: '/markets', label: 'Todos' },
  { href: '/markets?category=politica', label: 'Política' },
  // ...
]

// Destaque baseado em pathname apenas
<Link className={pathname === item.href ? 'bg-primary' : ''}>
```

**Falha:** A comparação `pathname === item.href` não considera query params. `/markets?category=politica` nunca será igual a `/markets`.

### Plano de Correção

#### 2.1 Sincronizar CategoryTabs com URL

```tsx
// Usar useRouter e useSearchParams
const router = useRouter()
const searchParams = useSearchParams()

const activeCategory = searchParams.get('category') || 'all'

const handleCategoryChange = (category: CategoryFilter) => {
  const params = new URLSearchParams(searchParams)
  if (category === 'all') {
    params.delete('category')
  } else {
    params.set('category', category)
  }
  router.push(`/markets?${params.toString()}`)
}
```

#### 2.2 Corrigir Destaque na Sidebar

```tsx
// Verificar categoria nos searchParams
const searchParams = useSearchParams()
const currentCategory = searchParams.get('category')

const isActive = (href: string) => {
  const url = new URL(href, 'http://localhost')
  const hrefCategory = url.searchParams.get('category')

  if (!hrefCategory && !currentCategory && pathname === '/markets') {
    return true  // "Todos" ativo
  }
  return hrefCategory === currentCategory
}
```

#### 2.3 Unificar Estado entre Componentes

Opções:
- **A)** Usar apenas URL como fonte de verdade (recomendado)
- **B)** Criar contexto compartilhado
- **C)** Elevar estado para página pai

**Recomendação:** Opção A - URL como fonte de verdade

### Critérios de Aceite

- [ ] Clicar em categoria atualiza a URL
- [ ] Categoria ativa fica visualmente destacada
- [ ] Sidebar e CategoryTabs sincronizados
- [ ] Refresh mantém categoria selecionada
- [ ] Navegação com back/forward funciona
- [ ] "Todos" ativo quando sem categoria na URL

---

## 3. BetSlip (Seu Palpite) - Minimização

### Descrição do Problema

O menu lateral direito "Seu Palpite" está **sempre visível** ocupando 320px. Deveria:

1. **Iniciar minimizado** (apenas um botão/ícone visível)
2. **Expandir** quando o usuário clicar para abrir
3. **Expandir automaticamente** quando uma aposta for adicionada
4. **Layout principal** deve adaptar-se ao estado (expandido/minimizado)

### Arquivos Afetados

- `apps/web/src/components/layout/bet-slip.tsx`
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/styles/globals.css` (variável `--betslip-width`)
- `apps/web/src/hooks/use-bet-slip.ts`

### Análise Técnica

**Estado atual:**
```tsx
// layout.tsx
<aside className="hidden xl:block fixed right-0 w-[var(--betslip-width)]">
  <BetSlip />
</aside>

<main className="xl:mr-[var(--betslip-width)]">
  {children}
</main>
```

O BetSlip sempre ocupa 320px e o main sempre tem margin-right correspondente.

### Plano de Correção

#### 3.1 Adicionar Estado de Expansão

```tsx
// use-bet-slip.ts - Adicionar ao store
interface BetSlipState {
  items: BetSlipItem[]
  isExpanded: boolean  // NOVO
  // ...
}

const useBetSlip = create<BetSlipState>((set) => ({
  isExpanded: false,

  toggleExpanded: () => set((state) => ({
    isExpanded: !state.isExpanded
  })),

  addItem: (item) => set((state) => ({
    items: [item],
    isExpanded: true,  // Expande automaticamente
  })),
}))
```

#### 3.2 Criar Componente Minimizado

```tsx
// bet-slip.tsx
const BetSlip = () => {
  const { isExpanded, toggleExpanded, items } = useBetSlip()

  if (!isExpanded) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2">
        <Button onClick={toggleExpanded} className="rounded-l-lg rounded-r-none">
          <ChevronLeft />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -left-2">{items.length}</Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="w-[var(--betslip-width)]">
      <Button onClick={toggleExpanded}>
        <ChevronRight /> Minimizar
      </Button>
      {/* ... conteúdo atual ... */}
    </div>
  )
}
```

#### 3.3 Adaptar Layout Principal

```tsx
// layout.tsx
const { isExpanded } = useBetSlip()

<main className={cn(
  "transition-all duration-300",
  isExpanded ? "xl:mr-[var(--betslip-width)]" : "xl:mr-0"
)}>
  {children}
</main>

<aside className={cn(
  "hidden xl:block fixed right-0 transition-all duration-300",
  isExpanded ? "w-[var(--betslip-width)]" : "w-12"
)}>
  <BetSlip />
</aside>
```

#### 3.4 CSS para Transição Suave

```css
/* globals.css */
.betslip-transition {
  transition: width 300ms ease-in-out,
              margin-right 300ms ease-in-out,
              transform 300ms ease-in-out;
}
```

### Critérios de Aceite

- [ ] BetSlip inicia minimizado (apenas botão visível)
- [ ] Clicar no botão expande/minimiza
- [ ] Adicionar aposta expande automaticamente
- [ ] Layout principal ocupa espaço liberado quando minimizado
- [ ] Transição suave (300ms)
- [ ] Badge mostra quantidade de itens quando minimizado
- [ ] Funciona em todas as páginas do (app)

---

## Dependências entre Correções

```
┌─────────────────┐
│  1. TickerBar   │  ← Independente
└─────────────────┘

┌─────────────────┐
│  2. Categorias  │  ← Independente
└─────────────────┘

┌─────────────────┐
│  3. BetSlip     │  ← Independente (mas afeta layout)
└─────────────────┘
```

**Ordem recomendada de implementação:**
1. **BetSlip** - Maior impacto no layout, testar primeiro
2. **Categorias** - Funcionalidade core
3. **TickerBar** - Visual/cosmético

---

## Arquivos a Criar/Modificar

### Criar
- `apps/web/src/components/layout/ticker-bar.tsx`

### Modificar
- `apps/web/src/components/layout/index.ts`
- `apps/web/src/components/layout/bet-slip.tsx`
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/components/markets/category-tabs.tsx`
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/hooks/use-bet-slip.ts`
- `apps/web/src/styles/globals.css`

---

## Estimativa de Impacto

| Correção | Arquivos | Complexidade | Risco de Regressão |
|----------|----------|--------------|-------------------|
| TickerBar | 3 | Baixa | Baixo |
| Categorias | 3 | Média | Médio (navegação) |
| BetSlip | 4 | Alta | Alto (layout global) |

---

## Testes Necessários

### Funcionais
- [ ] Navegação entre categorias
- [ ] URL reflete categoria selecionada
- [ ] BetSlip abre/fecha corretamente
- [ ] Adicionar aposta expande BetSlip
- [ ] TickerBar anima sem scroll manual

### Responsivos
- [ ] Desktop (>1280px): Todos os elementos visíveis
- [ ] Tablet (768-1279px): BetSlip oculto, sidebar visível
- [ ] Mobile (<768px): Apenas header e conteúdo

### Regressão
- [ ] Login/logout funciona
- [ ] Apostas são processadas
- [ ] Filtros (live, trending, popular, new) funcionam
- [ ] Perfil e carteira acessíveis
