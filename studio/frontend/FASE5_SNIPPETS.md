# FASE 5 - Code Snippets Úteis

## Quick Start

### 1. Testar Design System Completo

```tsx
// src/App.tsx
import DesignSystemDemo from './pages/DesignSystemDemo';
import './styles/design-system.css';

export default function App() {
  return <DesignSystemDemo />;
}
```

### 2. Sprint Board Standalone

```tsx
import { SprintHeader, SprintBoard } from './components/sprint';
import { MOCK_SPRINT, MOCK_FEATURES } from './lib/mockData';

export default function SprintView() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SprintHeader {...MOCK_SPRINT} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SprintBoard features={MOCK_FEATURES} />
      </div>
    </div>
  );
}
```

### 3. Pipeline Standalone

```tsx
import { PipelineTimeline, LiveLogs } from './components/pipeline';
import { MOCK_PHASES, MOCK_LOGS } from './lib/mockData';

export default function PipelineView() {
  return (
    <div style={{ padding: 20 }}>
      <PipelineTimeline phases={MOCK_PHASES} />
      <div style={{ marginTop: 20, maxWidth: 800, margin: '20px auto' }}>
        <LiveLogs logs={MOCK_LOGS} isRunning={true} />
      </div>
    </div>
  );
}
```

### 4. Team Standalone

```tsx
import { TeamPanel, ActivityFeed } from './components/team';
import { MOCK_HUMANS, MOCK_AGENTS, MOCK_ACTIVITY } from './lib/mockData';

export default function TeamView() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        padding: 20,
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <TeamPanel humans={MOCK_HUMANS} agents={MOCK_AGENTS} />
      <ActivityFeed activities={MOCK_ACTIVITY} />
    </div>
  );
}
```

### 5. PM Chat Modal

```tsx
import { useState } from 'react';
import { PMIntakeChat } from './components/chat';
import { PM_QUESTIONS } from './lib/mockData';

export default function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChat(true)}>Abrir PM Chat</button>

      {showChat && (
        <PMIntakeChat
          questions={PM_QUESTIONS}
          onClose={() => setShowChat(false)}
          onSubmit={(answers) => {
            console.log('Respostas:', answers);
            setShowChat(false);
          }}
        />
      )}
    </div>
  );
}
```

## Customização

### Criar Nova Feature

```tsx
import type { Feature } from './types';

const newFeature: Feature = {
  id: 'f10',
  title: 'Nova funcionalidade',
  type: 'FEATURE',
  priority: 'HIGH',
  pts: 5,
  status: 'BACKLOG',
  desc: 'Descrição da feature',
};
```

### Criar Nova Phase

```tsx
import type { Phase } from './types';

const newPhase: Phase = {
  id: 'custom',
  label: 'Custom Phase',
  short: 'CUS',
  icon: '🎯',
  color: 'var(--accent)',
  colorRaw: '#7C6AFA',
  glowRaw: 'rgba(124,106,250,0.18)',
  status: 'idle',
};
```

### Custom Badge

```tsx
// Usar classes existentes
<span className="badge badge-green">Novo Badge</span>

// Ou criar custom
<span
  style={{
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: 'var(--blue-dim)',
    color: 'var(--blue)',
  }}
>
  CUSTOM
</span>
```

### Custom Button

```tsx
// Usar classes existentes
<button className="btn btn-primary">Primário</button>
<button className="btn btn-secondary">Secundário</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-sm btn-green">Small Green</button>

// Ou criar custom
<button
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    transition: 'all 0.15s',
  }}
>
  Custom Button
</button>
```

## Integração Backend

### WebSocket Hook (exemplo)

```tsx
import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [url]);

  return { data, ws };
}

// Usar no componente
const { data } = useWebSocket('ws://localhost:8000/ws/project/123');

useEffect(() => {
  if (data?.type === 'feature_update') {
    // Actualizar feature
  }
}, [data]);
```

### API Integration

```tsx
import { useEffect, useState } from 'react';
import { api } from './lib/api';
import { SprintBoard } from './components/sprint';
import type { Feature } from './types';

export default function RealSprintBoard({ projectId }: { projectId: string }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProject(projectId)
      .then((data) => {
        setFeatures(data.features);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return <div>A carregar...</div>;
  }

  return <SprintBoard features={features} />;
}
```

### Live Logs Streaming

```tsx
import { useEffect, useState } from 'react';
import { LiveLogs } from './components/pipeline';

export default function LiveLogsStream({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/logs/${projectId}`);

    ws.onmessage = (event) => {
      const newLog = event.data;
      setLogs((prev) => [...prev, newLog]);
    };

    ws.onclose = () => {
      setIsRunning(false);
    };

    return () => {
      ws.close();
    };
  }, [projectId]);

  return <LiveLogs logs={logs} isRunning={isRunning} />;
}
```

## Animações Custom

### Adicionar nova animação

```css
/* Em design-system.css */
@keyframes customAnim {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.custom-anim {
  animation: customAnim 0.3s ease-out forwards;
}
```

### Usar no componente

```tsx
<div className="custom-anim" style={{ animationDelay: '0.2s' }}>
  Conteúdo animado
</div>
```

## Temas (Futuro)

### Preparar para Dark/Light mode

```tsx
// hooks/useTheme.ts
import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg', '#FFFFFF');
      root.style.setProperty('--text', '#000000');
      // etc...
    } else {
      root.style.setProperty('--bg', '#09090F');
      root.style.setProperty('--text', '#EEF0F8');
      // etc...
    }
  }, [theme]);

  return { theme, setTheme };
}
```

## Performance Tips

### Memoizar componentes pesados

```tsx
import { memo } from 'react';

const FeatureCard = memo(
  ({ feature }: { feature: Feature }) => {
    // render
  },
  (prev, next) => prev.feature.id === next.feature.id
);
```

### Virtual scrolling para logs

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: logs.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 20,
});
```

## Debug

### Ver todos os componentes

```tsx
import * as Layout from './components/layout';
import * as Sprint from './components/sprint';
import * as Pipeline from './components/pipeline';
import * as Team from './components/team';
import * as Chat from './components/chat';

console.log('Layout:', Layout);
console.log('Sprint:', Sprint);
console.log('Pipeline:', Pipeline);
console.log('Team:', Team);
console.log('Chat:', Chat);
```

### Testar loading states

```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  setTimeout(() => setLoading(false), 2000);
}, []);

if (loading) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div className="spin" style={{ display: 'inline-block' }}>
        ⚡
      </div>
    </div>
  );
}
```

---

**Tip:** Usar `MOCK_*` data durante desenvolvimento e substituir gradualmente por dados reais do backend.
