# FASE 5 - Índice de Navegação Rápida

## 📚 Documentação

### Leitura Recomendada (Por Ordem)
1. **[FASE5_RESUMO.md](./FASE5_RESUMO.md)** - Visão geral e estatísticas
2. **[FASE5_COMPONENTS.md](./FASE5_COMPONENTS.md)** - Guia completo de componentes
3. **[FASE5_CHECKLIST.md](./FASE5_CHECKLIST.md)** - Checklist detalhada
4. **[FASE5_SNIPPETS.md](./FASE5_SNIPPETS.md)** - Code snippets úteis

### Quick Links
- [Design System CSS](./src/styles/design-system.css)
- [Mock Data](./src/lib/mockData.ts)
- [Types Index](./src/types/index.ts)
- [Demo App](./src/App.demo.tsx)

## 🧩 Componentes por Categoria

### Layout (3)
```
src/components/layout/
├── TitleBar.tsx      → Barra superior macOS
├── Sidebar.tsx       → Menu lateral 56px
├── MainLayout.tsx    → Container principal
└── index.ts          → Exports
```
**Props principais:** `activeView`, `onViewChange`

### Sprint Board (4)
```
src/components/sprint/
├── SprintHeader.tsx   → Métricas do sprint
├── FeatureCard.tsx    → Card de feature individual
├── KanbanColumn.tsx   → Coluna do kanban
├── SprintBoard.tsx    → Board completo (6 colunas)
└── index.ts           → Exports
```
**Props principais:** `features`, `sprint`, `velocity`

### Pipeline (3)
```
src/components/pipeline/
├── PhaseNode.tsx         → Fase com animação ripple
├── PipelineTimeline.tsx  → Timeline horizontal
├── LiveLogs.tsx          → Terminal de logs
└── index.ts              → Exports
```
**Props principais:** `phases`, `logs`, `isRunning`

### Team (2)
```
src/components/team/
├── TeamPanel.tsx     → Lista de membros + agents
├── ActivityFeed.tsx  → Feed de actividades
└── index.ts          → Exports
```
**Props principais:** `humans`, `agents`, `activities`

### Chat (1)
```
src/components/chat/
├── PMIntakeChat.tsx  → Chat conversacional
└── index.ts          → Exports
```
**Props principais:** `questions`, `onSubmit`, `onClose`

## 📄 Páginas

### ProjectViewNew.tsx
**Path:** `src/pages/ProjectViewNew.tsx`
**Descrição:** Página completa com 3 tabs
**Tabs:**
- Sprint Board (kanban de 6 colunas)
- Pipeline (timeline + logs)
- Team (panel + activity feed)

### DesignSystemDemo.tsx
**Path:** `src/pages/DesignSystemDemo.tsx`
**Descrição:** Demo completo com navegação
**Features:**
- MainLayout integrado
- Navegação entre views
- Exemplo de uso real

### App.demo.tsx
**Path:** `src/App.demo.tsx`
**Descrição:** Exemplos de código e integração
**Conteúdo:** Snippets de uso individual dos componentes

## 🎨 Design System

### CSS Principal
**Path:** `src/styles/design-system.css`

**Cores:**
```css
--accent: #7C6AFA   /* Roxo principal */
--green: #3DFFA0    /* Success */
--amber: #FFB547    /* Warning */
--red: #FF6B6B      /* Error */
--blue: #5BB8FF     /* Info */
--orange: #FB923C   /* Progress */
--pink: #F472B6     /* Review */
```

**Fontes:**
```css
--font-display: 'Syne'           /* Títulos */
--font-body: 'DM Sans'           /* Texto */
--font-mono: 'JetBrains Mono'    /* Código */
```

**Classes Principais:**
- `.btn` `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-sm`
- `.badge` `.badge-green` `.badge-amber` `.badge-red` etc.
- `.card`
- `.input` `.input-mono`
- `.progress-bar` `.progress-fill`
- `.sub-tab`

**Animações:**
- `.fade-up` `.fade-in` `.slide-right` `.msg-in`
- `.spin` `.pulse` `.float`

## 📊 Types

### Types por Ficheiro
```
src/types/
├── sprint.ts    → Feature, Sprint, KanbanColumn
├── pipeline.ts  → Phase, LogEntry
├── team.ts      → HumanMember, AIAgent, Activity
├── chat.ts      → Question, ChatMessage
└── index.ts     → Exports + ViewType
```

### Imports Rápidos
```tsx
import type {
  Feature, Sprint,           // sprint.ts
  Phase, LogEntry,           // pipeline.ts
  HumanMember, AIAgent,      // team.ts
  Question, ChatMessage,     // chat.ts
  ViewType                   // index.ts
} from './types';
```

## 🗂️ Mock Data

**Path:** `src/lib/mockData.ts`

**Exports:**
```tsx
import {
  MOCK_SPRINT,      // Sprint data
  MOCK_FEATURES,    // 9 features
  MOCK_PHASES,      // 6 fases
  MOCK_LOGS,        // Logs de exemplo
  MOCK_HUMANS,      // 3 membros
  MOCK_AGENTS,      // 5 AI agents
  MOCK_ACTIVITY,    // 5 actividades
  PM_QUESTIONS,     // 5 perguntas
  MOCK_PROJECTS,    // 3 projectos
} from './lib/mockData';
```

## 🚀 Quick Start

### 1. Ver Demo Completo
```tsx
// src/App.tsx
import DesignSystemDemo from './pages/DesignSystemDemo';
import './styles/design-system.css';

export default function App() {
  return <DesignSystemDemo />;
}
```

### 2. Sprint Board Only
```tsx
import { SprintHeader, SprintBoard } from './components/sprint';
import { MOCK_SPRINT, MOCK_FEATURES } from './lib/mockData';

<div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <SprintHeader {...MOCK_SPRINT} />
  <SprintBoard features={MOCK_FEATURES} />
</div>
```

### 3. Pipeline Only
```tsx
import { PipelineTimeline, LiveLogs } from './components/pipeline';
import { MOCK_PHASES, MOCK_LOGS } from './lib/mockData';

<div>
  <PipelineTimeline phases={MOCK_PHASES} />
  <LiveLogs logs={MOCK_LOGS} isRunning />
</div>
```

### 4. Team Only
```tsx
import { TeamPanel, ActivityFeed } from './components/team';
import { MOCK_HUMANS, MOCK_AGENTS, MOCK_ACTIVITY } from './lib/mockData';

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
  <TeamPanel humans={MOCK_HUMANS} agents={MOCK_AGENTS} />
  <ActivityFeed activities={MOCK_ACTIVITY} />
</div>
```

### 5. PM Chat Only
```tsx
import { useState } from 'react';
import { PMIntakeChat } from './components/chat';
import { PM_QUESTIONS } from './lib/mockData';

const [show, setShow] = useState(false);

{show && (
  <PMIntakeChat
    questions={PM_QUESTIONS}
    onClose={() => setShow(false)}
    onSubmit={(a) => console.log(a)}
  />
)}
```

## 🔍 Troubleshooting

### Fontes não carregam
**Solução:** Verificar import no `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

### CSS não aplica
**Solução:** Importar design-system.css no componente ou App.tsx:
```tsx
import './styles/design-system.css';
```

### Types não encontrados
**Solução:** Verificar import path:
```tsx
import type { Feature } from './types'; // ou '../types' ou '@/types'
```

### Mock data não funciona
**Solução:** Verificar import:
```tsx
import { MOCK_FEATURES } from './lib/mockData'; // ou '../lib/mockData'
```

## 📦 Estrutura Final

```
studio/frontend/
├── src/
│   ├── components/
│   │   ├── layout/        (3 componentes + index.ts)
│   │   ├── sprint/        (4 componentes + index.ts)
│   │   ├── pipeline/      (3 componentes + index.ts)
│   │   ├── team/          (2 componentes + index.ts)
│   │   └── chat/          (1 componente + index.ts)
│   ├── pages/
│   │   ├── ProjectViewNew.tsx
│   │   └── DesignSystemDemo.tsx
│   ├── types/
│   │   ├── sprint.ts
│   │   ├── pipeline.ts
│   │   ├── team.ts
│   │   ├── chat.ts
│   │   └── index.ts
│   ├── lib/
│   │   └── mockData.ts
│   ├── styles/
│   │   └── design-system.css
│   ├── index.css          (actualizado)
│   └── App.demo.tsx
├── FASE5_RESUMO.md        (este ficheiro)
├── FASE5_COMPONENTS.md
├── FASE5_CHECKLIST.md
├── FASE5_SNIPPETS.md
└── FASE5_INDEX.md
```

## 🎯 Métricas Finais

| Item | Quantidade |
|------|------------|
| Componentes TSX | 23 total (13 novos) |
| Types definidos | 25+ interfaces |
| Mock entries | 35+ items |
| Páginas | 3 |
| CSS lines | 450+ |
| TS lines | ~2.400 |
| Animações | 12 |
| Docs | 5 ficheiros |

## ✅ Status

**FASE 5: 100% COMPLETA**

Todos os objectivos foram atingidos:
- ✅ Design system copiado
- ✅ Componentes principais criados
- ✅ Estados vazios implementados
- ✅ Animações suaves aplicadas
- ✅ Types completos
- ✅ Mock data para testes
- ✅ Documentação detalhada

**Ready for FASE 6:** Backend Integration

---

**Última actualização:** 05/03/2026
**Desenvolvedor:** Claude Opus 4.6
