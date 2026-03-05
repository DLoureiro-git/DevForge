# QA Components — DevForge V2

Conjunto de 3 componentes React para visualização do QA em tempo real.

## Componentes

### 1. BugTracker.tsx

Visualização de bugs agrupados por severidade com animações e contador regressivo.

**Props:**
```typescript
interface BugTrackerProps {
  bugs: Bug[]
  onToggleDetail?: (bugId: string) => void
}
```

**Severidades:**
- `CRITICAL` — Vermelho, bloqueia deploy
- `HIGH` — Laranja, necessita correcção urgente
- `MEDIUM` — Amarelo, deve ser corrigido
- `LOW` — Cinza, nice to have

**Status de Bug:**
- `open` — Problema detectado, aguarda correcção
- `fixing` — Em desenvolvimento, análise em curso
- `fixed` — Corrigido, aguarda validação

**Features:**
- Badge animado com contador (pulse + glow)
- Agrupamento por severidade com toggle expand/collapse
- Toggle "Vista Simples" vs "Vista Técnica" (mostrar detalhes técnicos)
- Cada bug mostra: categoria, descrição user-friendly, status
- Detalhes técnicos ao expandir
- Timestamps de criação/actualização

**Exemplo:**
```tsx
import BugTracker from '@/components/BugTracker'

export default function Page() {
  const bugs: Bug[] = [
    {
      id: '1',
      category: 'Validação',
      description: 'Email não valida domínios com subdomain',
      userFriendlyDescription: 'Alguns emails não são aceitos',
      severity: 'CRITICAL',
      status: 'open',
      technicalDetails: 'Regex padrão não captura emails tipo user@mail.company.co.uk',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  return (
    <BugTracker
      bugs={bugs}
      onToggleDetail={(id) => console.log('Toggle:', id)}
    />
  )
}
```

---

### 2. QAScoreCard.tsx

Card com visualização do score QA geral e breakdown por categoria.

**Props:**
```typescript
interface QAScoreCardProps {
  score: QAScore
  isLoading?: boolean
}
```

**QAScore Structure:**
```typescript
interface QAScore {
  overallScore: number // 0-100
  canDeliver: boolean
  totalChecks: number
  passedChecks: number
  failedChecks: number
  totalDuration: number // em milisegundos
  categoryBreakdown: Record<string, {
    score: number
    passed: number
    total: number
  }>
}
```

**Features:**
- Progress ring animado com número do score (0-100)
- Cor dinâmica baseada no score:
  - Verde (≥90): Excelente
  - Azul (75-89): Bom
  - Amarelo (60-74): Aceitável
  - Vermelho (<60): Crítico
- Status badge: "✅ Pronto para produção" vs "⚠️ Precisa revisão"
- Metrics: X/Y checks passaram, tempo total QA
- Breakdown por categoria (Deploy, DB, Responsive, Performance, Segurança, Acessibilidade)
- Mini progress bars por categoria
- Alert se há failed checks (fundo vermelho)

**Exemplo:**
```tsx
import QAScoreCard from '@/components/QAScoreCard'

export default function Page() {
  const score: QAScore = {
    overallScore: 92,
    canDeliver: true,
    totalChecks: 14,
    passedChecks: 13,
    failedChecks: 1,
    totalDuration: 156000,
    categoryBreakdown: {
      'Deploy': { score: 100, passed: 3, total: 3 },
      'DB': { score: 100, passed: 2, total: 2 },
      'Responsive': { score: 75, passed: 2, total: 3 },
      // ...
    }
  }

  return <QAScoreCard score={score} />
}
```

---

### 3. ChecklistProgress.tsx

Progress visual das checks QA com filtros e busca.

**Props:**
```typescript
interface ChecklistProgressProps {
  checks: Check[]
  isLoading?: boolean
}
```

**Check Structure:**
```typescript
interface Check {
  id: string
  name: string
  category: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  duration: number // em milisegundos
  message?: string
  isCritical: boolean
  details?: Record<string, any>
}
```

**Features:**
- Progress bar geral (checks passadas / total)
- Quick stats: X passou, Y falhou, Z a executar
- Search bar para filtrar checks
- Filtros: "Todas", "Falhadas", "Críticas"
- Agrupamento por categoria com toggle expand/collapse
- Cada categoria mostra stats (N ✓ / M ✗) + mini progress bar
- Para cada check:
  - Status icon (animado se "running")
  - Nome, status badge, duração
  - Badge "CRÍTICA" se isCritical=true
  - Mensagem de erro se falhou (fundo vermelho, mono font)
  - Detalhes técnicos (key-value pairs)
- Categorias com falhas expandem por defeito
- Se nenhuma falhada, expand primeira categoria

**Exemplo:**
```tsx
import ChecklistProgress from '@/components/ChecklistProgress'

export default function Page() {
  const checks: Check[] = [
    {
      id: 'check-1',
      name: 'Build sem erros',
      category: 'Deploy',
      status: 'passed',
      duration: 45000,
      isCritical: true
    },
    {
      id: 'check-2',
      name: 'Dependencies vulneráveis',
      category: 'Deploy',
      status: 'failed',
      duration: 8000,
      message: 'npm audit found 2 high vulnerability',
      isCritical: true
    }
  ]

  return <ChecklistProgress checks={checks} />
}
```

---

## Types (types/qa.ts)

Todos os tipos estão em `/components/types/qa.ts`:

```typescript
export type BugSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type BugStatus = 'open' | 'fixing' | 'fixed'
export type CheckStatus = 'pending' | 'running' | 'passed' | 'failed'

export interface Bug { /* ... */ }
export interface Check { /* ... */ }
export interface QAScore { /* ... */ }
export interface QAData { /* ... */ }
```

---

## Integração Completa

### Layout recomendado:

```tsx
// pages/projects/[id]/qa.tsx
import { useState, useEffect } from 'react'
import BugTracker from '@/components/BugTracker'
import QAScoreCard from '@/components/QAScoreCard'
import ChecklistProgress from '@/components/ChecklistProgress'
import type { Bug, Check, QAScore } from '@/components/types/qa'

export default function ProjectQAPage({ projectId }: { projectId: string }) {
  const [bugs, setBugs] = useState<Bug[]>([])
  const [checks, setChecks] = useState<Check[]>([])
  const [score, setScore] = useState<QAScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch inicial
  useEffect(() => {
    const fetchQAData = async () => {
      try {
        const [bugsRes, checksRes, scoreRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/qa/bugs`),
          fetch(`/api/projects/${projectId}/qa/checks`),
          fetch(`/api/projects/${projectId}/qa/score`)
        ])

        const [bugsData, checksData, scoreData] = await Promise.all([
          bugsRes.json(),
          checksRes.json(),
          scoreRes.json()
        ])

        setBugs(bugsData)
        setChecks(checksData)
        setScore(scoreData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQAData()
  }, [projectId])

  // WebSocket para atualizações em tempo real (opcional)
  useEffect(() => {
    const ws = new WebSocket(`wss://api.devforge.local/ws/projects/${projectId}/qa`)

    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)

      if (type === 'bug-update') setBugs(data)
      if (type === 'check-update') setChecks(data)
      if (type === 'score-update') setScore(data)
    }

    return () => ws.close()
  }, [projectId])

  if (isLoading) {
    return <div>Carregando QA data...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">QA Dashboard</h1>

      {/* Grid 3:1 — Score Card pequeno, Bug Tracker grande */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          {score && <QAScoreCard score={score} isLoading={isLoading} />}
        </div>
        <div className="lg:col-span-3">
          <BugTracker bugs={bugs} />
        </div>
      </div>

      {/* Checklist — Full width */}
      <div>
        <ChecklistProgress checks={checks} isLoading={isLoading} />
      </div>
    </div>
  )
}
```

### Layout alternativo — Vertical:

```tsx
<div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <QAScoreCard score={score} />
    <BugTracker bugs={bugs} />
  </div>
  <ChecklistProgress checks={checks} />
</div>
```

---

## Design System

### Cores (CSS Variables):
- `--bg-base` — Background base
- `--bg-surface` — Surface elevada
- `--bg-raised` — Raised container
- `--text-primary` — Texto principal
- `--text-secondary` — Texto secundário
- `--text-muted` — Texto desatived/muted
- `--border` — Borda padrão
- `--border-bright` — Borda highlighted
- `--phase-intake` — Cor fase intake
- `--phase-plan` — Cor fase plan
- `--phase-build` — Cor fase build
- `--status-success` — Verde/sucesso
- `--status-warning` — Laranja/warning

### Fonts:
- `font-display` — Syne (headings)
- `font-body` — Padrão (body text)

### Icons (Lucide):
- `AlertOctagon` — CRITICAL
- `AlertTriangle` — HIGH
- `AlertCircle` — MEDIUM
- `Info` — LOW
- `CheckCircle2` — Passed
- `Loader2` — Running (com animate-spin)
- `Circle` — Pending
- `Clock` — Duration
- `ChevronUp/Down` — Expand/collapse
- `Search` — Search bar

---

## Dados Mock

Exemplos completos em `/components/qa/qa-demo.tsx`:
- `mockBugs` — 5 bugs com severidades variadas
- `mockChecks` — 14 checks para 6 categorias
- `mockQAScore` — Score calculado com breakdown

---

## Performance

### Otimizações implementadas:
- Memoization de arrays filtrados (useMemo)
- CSS transitions suaves (duration-200, duration-700)
- Icons do Lucide (SVG otimizado)
- Layout flex/grid eficiente
- Lazy expand/collapse para listas grandes

### Para listas muito grandes (>100 checks):
- Implementar virtualization (react-window)
- Paginar categorias
- Lazy load detalhes de check

---

## Acessibilidade

- Buttons com estados focus visíveis
- Icons com aria-label em context
- Search input focusável
- Cores não são único indicador (icons + texto)
- Contraste WCAG AA
- Keyboard navigation completa

---

## Próximos passos

1. Integrar com backend QA (APIs)
2. Adicionar WebSocket para real-time
3. Implementar histórico de scores (gráfico)
4. Adicionar exportação de relatórios (PDF)
5. Integrar com GitHub Actions/CI logs
6. Notificações push para failing checks críticas
