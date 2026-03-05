# FASE 5 - Componentes UI DevForge V2

## Design System

### CSS (`src/styles/design-system.css`)
Design system completo copiado de `devforge-final.jsx`:
- **Cores:** bg, surface, raised, border, accent, green, amber, red, blue, orange, pink
- **Fontes:** Syne (display), DM Sans (body), JetBrains Mono (mono)
- **Animações:** fadeUp, fadeIn, slideRight, spin, pulse, glow, float, shimmer, ripple
- **Classes base:** titlebar, sidebar, btn, input, badge, card, progress-bar, sub-tab

## Componentes Criados

### 1. Layout
**`src/components/layout/`**

#### `TitleBar.tsx`
- Barra superior com 3 dots macOS (vermelho, amarelo, verde)
- Logo "DEVFORGE" centrado
- Versão (v2.0) à direita
- `-webkit-app-region: drag` para arrastar janela

#### `Sidebar.tsx`
- 56px de largura, vertical
- Ícones: Projects, Sprint, Team, Settings
- Estado activo com indicador roxo à esquerda
- Hover states suaves

#### `MainLayout.tsx`
- Container principal: TitleBar + Sidebar + Content
- Props: activeView, onViewChange, children
- Flex layout responsivo

### 2. Sprint Board
**`src/components/sprint/`**

#### `SprintHeader.tsx`
- Props: sprintNumber, goal, daysLeft, totalDays, velocity
- Mostra: número do sprint, goal, badge "ATIVO"
- Métricas: dias restantes, velocity média
- Progress bar animada

#### `FeatureCard.tsx`
- Props completas: id, title, type, priority, pts, status, branch, progress, qa, bugs, desc
- Badges de prioridade: CRITICAL (red), HIGH (orange), MEDIUM (amber), LOW (blue)
- Progress bar com cores dinâmicas
- QA score com cores: ≥90 green, ≥70 amber, <70 red
- Lista de bugs com ícone AlertCircle
- Branch indicator com GitBranch icon
- Merged timestamp

#### `KanbanColumn.tsx`
- Props: id, label, color, wip, count, children
- Header com dot colorido + label + count
- WIP limit badge (opcional)
- Container scrollável para cards

#### `SprintBoard.tsx`
- Props: features (array)
- 6 colunas: BACKLOG, READY, IN_PROGRESS, IN_REVIEW, IN_QA, DONE
- Filtra features por status
- Estado vazio elegante por coluna

### 3. Pipeline
**`src/components/pipeline/`**

#### `PhaseNode.tsx`
- Props: label, short, icon, color, colorRaw, glowRaw, status, isLoop
- Status: idle, running, done, error
- Círculo com 80px, border dinâmica
- **Ripple effect quando running** (2 ondas concêntricas)
- Loop indicator (ícone 🔄 rotativo no canto)
- Badge de conclusão (✓) ou erro (✕)

#### `PipelineTimeline.tsx`
- Props: phases (array)
- Layout horizontal com setas entre fases
- Indicador especial para fases paralelas (3 linhas)
- Cores dinâmicas conforme status

#### `LiveLogs.tsx`
- Props: logs (array), isRunning
- Container tipo terminal com scroll automático
- Header com ícone Terminal + badge "RUNNING"
- Logs com cores: error (red), warning (amber), success (green)
- Numeração de linhas (001, 002, ...)
- Cursor piscante quando running

### 4. Team
**`src/components/team/`**

#### `TeamPanel.tsx`
- Props: humans, agents
- **Secção Humanos:**
  - Avatar com iniciais + cor
  - Dot de status (online/offline)
  - Role + badge
- **Secção AI Agents:**
  - Ícone emoji
  - Nome + modelo (font-mono)
  - Dot pulsante quando activo
  - Badge "ATIVO" / "Idle"

#### `ActivityFeed.tsx`
- Props: activities (array)
- Feed cronológico com animação staggered
- Card por actividade: ícone, actor, timestamp, mensagem
- Badge AI para agentes
- Dot colorido à direita por tipo

### 5. Chat
**`src/components/chat/`**

#### `PMIntakeChat.tsx`
- Props: onClose, onSubmit, questions
- Painel deslizante (420px) vindo da direita
- Header com ícone Sparkles + progress dots
- Mensagens com animação msgIn
- Suporte para perguntas abertas (input) e choice (botões)
- Typing indicator (3 dots pulsantes)
- Resumo final + botões de confirmação

## Páginas Criadas

### `ProjectViewNew.tsx`
Página completa com 3 tabs:

**Tab Sprint:**
- SprintHeader no topo
- SprintBoard (6 colunas kanban)
- Botão "Nova Feature" abre PMIntakeChat

**Tab Pipeline:**
- PipelineTimeline (6 fases horizontais)
- LiveLogs abaixo

**Tab Team:**
- Grid 2 colunas: TeamPanel + ActivityFeed

### `DesignSystemDemo.tsx`
Demo completa com MainLayout:
- Integra TitleBar + Sidebar + ProjectViewNew
- Demonstra navegação entre views

## Estados Vazios

Todos os componentes têm estados vazios elegantes:
- KanbanColumn: "Nenhuma feature" centrado
- LiveLogs: "Aguardando logs..." centrado
- ActivityFeed: "Nenhuma atividade recente" centrado

## Animações Aplicadas

- **fadeUp:** SprintHeader, cards
- **fadeIn:** FeatureCard, logs
- **slideRight:** PMIntakeChat
- **msgIn:** Mensagens do chat
- **pulse:** Status dots, running badges
- **ripple:** PhaseNode quando running
- **spin:** Loop indicators

## Cores Principais

```css
--accent: #7C6AFA  (roxo)
--green: #3DFFA0
--amber: #FFB547
--red: #FF6B6B
--blue: #5BB8FF
--orange: #FB923C
--pink: #F472B6
```

## Fontes

- **Display (títulos):** Syne (800, 700, 600)
- **Body (texto):** DM Sans (500, 600, 700)
- **Mono (código):** JetBrains Mono

## Como Usar

### Opção 1: Demo Completo (Recomendado)

```tsx
// Em src/App.tsx
import DesignSystemDemo from './pages/DesignSystemDemo';
import './styles/design-system.css';

function App() {
  return <DesignSystemDemo />;
}

export default App;
```

### Opção 2: Componentes Individuais

```tsx
import { MainLayout } from './components/layout';
import { SprintBoard, SprintHeader } from './components/sprint';
import { PipelineTimeline, LiveLogs } from './components/pipeline';
import { TeamPanel, ActivityFeed } from './components/team';
import { PMIntakeChat } from './components/chat';
import {
  MOCK_FEATURES,
  MOCK_SPRINT,
  MOCK_PHASES,
  MOCK_LOGS,
  MOCK_HUMANS,
  MOCK_AGENTS,
  MOCK_ACTIVITY,
  PM_QUESTIONS,
} from './lib/mockData';

// Sprint Board
<SprintHeader {...MOCK_SPRINT} />
<SprintBoard features={MOCK_FEATURES} />

// Pipeline
<PipelineTimeline phases={MOCK_PHASES} />
<LiveLogs logs={MOCK_LOGS} isRunning={true} />

// Team
<TeamPanel humans={MOCK_HUMANS} agents={MOCK_AGENTS} />
<ActivityFeed activities={MOCK_ACTIVITY} />

// PM Chat
<PMIntakeChat
  questions={PM_QUESTIONS}
  onClose={() => {}}
  onSubmit={(answers) => console.log(answers)}
/>
```

### Opção 3: Integração com Backend Real

```tsx
import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './lib/api';

function RealProject({ projectId }) {
  const [features, setFeatures] = useState([]);
  const [sprint, setSprint] = useState(null);

  const { data: wsData } = useWebSocket(`ws://localhost:8000/ws/${projectId}`);

  useEffect(() => {
    api.getProject(projectId).then((data) => {
      setFeatures(data.features);
      setSprint(data.sprint);
    });
  }, [projectId]);

  useEffect(() => {
    if (wsData?.type === 'feature_update') {
      setFeatures((prev) =>
        prev.map((f) => (f.id === wsData.featureId ? { ...f, ...wsData.data } : f))
      );
    }
  }, [wsData]);

  return (
    <>
      <SprintHeader {...sprint} />
      <SprintBoard features={features} />
    </>
  );
}
```

## Próximos Passos

1. **WebSocket hook:** Integrar real-time updates
2. **Settings page:** API keys, Ollama config
3. **Drag & drop:** Kanban columns
4. **Keyboard shortcuts:** Navegação rápida
5. **Dark/Light mode toggle:** (opcional)

## Notas Técnicas

- **Sem mock data hardcoded:** Todos os componentes aceitam props vazias
- **TypeScript completo:** Interfaces bem definidas
- **Performance:** Animações GPU-accelerated (transform, opacity)
- **Acessibilidade:** Buttons com aria-labels (a adicionar)
- **Responsivo:** Funciona em 1280px+ (desktop-first)

---

**Status:** UI completa e polida ✅
**Design System:** 100% copiado do devforge-final.jsx ✅
**Animações:** Ripple, pulse, shimmer implementadas ✅
