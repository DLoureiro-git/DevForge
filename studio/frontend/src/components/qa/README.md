# QA Components Suite

Componentes React para visualizar QA em tempo real no DevForge V2.

## Quick Links

- **[QA_COMPONENTS.md](../QA_COMPONENTS.md)** — Documentação técnica completa
- **[INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md)** — 8 exemplos de integração
- **[qa-demo.tsx](./qa-demo.tsx)** — Demo ao vivo com dados mock

## 3 Componentes

### 1. BugTracker
Mostra bugs agrupados por severidade com contador animado.

```tsx
import { BugTracker } from '@/components'

<BugTracker
  bugs={bugs}
  onToggleDetail={(id) => console.log(id)}
/>
```

### 2. QAScoreCard
Score visual 0-100 com progress ring animado.

```tsx
import { QAScoreCard } from '@/components'

<QAScoreCard score={score} isLoading={false} />
```

### 3. ChecklistProgress
Progress das checks com filtros e busca.

```tsx
import { ChecklistProgress } from '@/components'

<ChecklistProgress checks={checks} />
```

## Dashboard Completo

Usa todos os 3 componentes integrados:

```tsx
import QADashboard from '@/components/qa/QADashboard'

<QADashboard projectId="project-123" />
```

## Tipos

```tsx
import type { Bug, Check, QAScore } from '@/components'
```

## Features

- Progress ring SVG com animação
- Badge animado com pulse + glow
- Filtros com memoization
- Auto-expand categorias com falhas
- Responsive design
- WebSocket ready
- TypeScript strict
- WCAG AA accessible

## Architecture

```
QADashboard (página completa)
├── QAScoreCard (score 0-100)
├── BugTracker (bugs agrupados)
└── ChecklistProgress (checks com filtros)

Types: Bug | Check | QAScore | QAData
```

## Mock Data

Para desenvolvimento:

```tsx
import { mockBugs, mockChecks, mockQAScore } from './qa-demo'

// Ou usar componente demo
import QADemo from './qa-demo'
<QADemo />
```

## Integração

Vê [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md) para:
- Página simples
- Componentes customizados
- Com tabs
- API routes
- WebSocket
- Testes

## Design System

Usa CSS variables do DevForge:
- `--bg-base`, `--bg-surface`, `--bg-raised`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--phase-intake`, `--phase-plan`, `--phase-build`
- Icons: Lucide React

## Status

✅ BugTracker.tsx — Completo
✅ QAScoreCard.tsx — Completo
✅ ChecklistProgress.tsx — Completo
✅ Types — Completo
✅ Dashboard — Completo
✅ Documentação — Completa
✅ Exemplos — Completos

## Próximos

- [ ] Conectar APIs backend
- [ ] WebSocket real-time
- [ ] Gráfico histórico
- [ ] Exportação PDF
- [ ] Notificações push
