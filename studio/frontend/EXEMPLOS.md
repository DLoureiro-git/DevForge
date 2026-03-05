# DevForge V2 - Exemplos de Uso

## PipelineVisual

```tsx
import { PipelineVisual } from '@/components/PipelineVisual'

const phases = [
  { id: 'intake', name: 'Intake', status: 'done' },
  { id: 'plan', name: 'Planeamento', status: 'running' },
  { id: 'build', name: 'Desenvolvimento', status: 'pending' },
  { id: 'qa', name: 'QA', status: 'pending' },
  { id: 'fix', name: 'Correções', status: 'pending' },
  { id: 'deploy', name: 'Deploy', status: 'pending' },
]

<PipelineVisual
  projectId="123"
  phases={phases}
  onPhaseClick={(phaseId) => console.log(phaseId)}
/>
```

## ProgressNarrative

```tsx
import { ProgressNarrative } from '@/components/ProgressNarrative'

<ProgressNarrative
  message="✨ A criar design das páginas..."
  progress={45}
/>
```

## DeliveryCard

```tsx
import { DeliveryCard } from '@/components/DeliveryCard'

<DeliveryCard
  projectId="123"
  projectName="Minha App Incrível"
  projectUrl="https://app.example.com"
  stats={{
    duration: '45 min',
    features: 12,
    qaScore: 95,
  }}
  onOpenProject={() => window.open('https://app.example.com')}
  onViewCode={() => console.log('view code')}
  onDownloadZip={() => console.log('download')}
/>
```

## Logs

```tsx
import { Logs } from '@/components/Logs'

<Logs projectId="123" />
```

## IntakeChat

```tsx
import { IntakeChat } from '@/components/IntakeChat'

<IntakeChat
  projectId="123"
  onComplete={(prd) => {
    console.log('PRD completo:', prd)
  }}
/>
```

## useSSE Hook

```tsx
import { useSSE } from '@/hooks/useSSE'

function MyComponent() {
  const { isConnected, error } = useSSE(
    `/api/projects/${projectId}/logs/stream`,
    {
      onMessage: (data) => {
        console.log('Nova mensagem:', data)
      },
      onError: (err) => {
        console.error('SSE error:', err)
      },
      reconnect: true,
      reconnectInterval: 3000,
    }
  )

  return (
    <div>
      {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      {error && <p>Erro: {error.message}</p>}
    </div>
  )
}
```

## API Client

```tsx
import { api } from '@/lib/api'

// Listar projetos
const projects = await api.getProjects()

// Criar projeto
const newProject = await api.createProject({
  name: 'Novo Projeto',
  description: 'Descrição do projeto',
})

// Enviar mensagem chat
const response = await api.sendMessage(projectId, 'Olá!')

// Get pipeline status
const pipeline = await api.getPipelineStatus(projectId)

// Testar conexão
const result = await api.testConnection('anthropic', {
  apiKey: 'sk-ant-...',
})
```

## Zustand Store

```tsx
import { useStore } from '@/lib/store'

function MyComponent() {
  const { user, currentProject, settings, setUser, updateSettings } = useStore()

  return (
    <div>
      <p>User: {user?.name}</p>
      <p>Project: {currentProject?.name}</p>
      <p>Anthropic Key: {settings.anthropicKey}</p>

      <button onClick={() => setUser({ id: '1', email: 'test@test.com' })}>
        Set User
      </button>

      <button onClick={() => updateSettings({ anthropicKey: 'sk-...' })}>
        Update Settings
      </button>
    </div>
  )
}
```

## Utility Classes

### Botões
```tsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-ghost">Ghost</button>
<button className="btn-success">Success</button>
```

### Cards
```tsx
<div className="glass-card p-6">
  Glassmorphism card
</div>
```

### Badges
```tsx
<span className="badge badge-pending">Pendente</span>
<span className="badge badge-running">A correr</span>
<span className="badge badge-done">Concluído</span>
<span className="badge badge-error">Erro</span>
```

### Inputs
```tsx
<input type="text" className="input" placeholder="Email..." />
<textarea className="input" placeholder="Mensagem..." />
```

### Terminal
```tsx
<div className="terminal">
  <pre>$ npm run dev</pre>
  <pre>Server running on http://localhost:3000</pre>
</div>
```

### Text Gradients
```tsx
<h1 className="text-gradient-primary">
  DevForge V2
</h1>
```

### Scrollbar Customizada
```tsx
<div className="custom-scrollbar overflow-auto">
  Conteúdo scrollável
</div>
```

## Animações

### Fade In
```tsx
<div className="animate-fade-in">
  Conteúdo com fade
</div>
```

### Slide Up
```tsx
<div className="animate-slide-up">
  Conteúdo com slide
</div>
```

### Pulse Glow
```tsx
<div className="animate-pulse-glow">
  Elemento com glow pulsante
</div>
```

### Animation Delays
```tsx
<div className="animate-fade-in animation-delay-100">Item 1</div>
<div className="animate-fade-in animation-delay-200">Item 2</div>
<div className="animate-fade-in animation-delay-300">Item 3</div>
```

## Layout Responsivo

### Grid Responsivo
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>
```

### Flex Responsivo
```tsx
<div className="flex flex-col lg:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Hide/Show por Breakpoint
```tsx
{/* Desktop apenas */}
<div className="hidden lg:block">Desktop</div>

{/* Mobile apenas */}
<div className="lg:hidden">Mobile</div>
```

## Error Handling

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

<ErrorBoundary>
  <MeuComponente />
</ErrorBoundary>
```

## Routing

```tsx
import { useNavigate, useParams } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate(`/projects/${id}`)}>Project</button>
      <button onClick={() => navigate('/settings')}>Settings</button>
    </div>
  )
}
```

## Cores por Fase

```tsx
// CSS
<div className="text-phase-intake">Intake</div>
<div className="text-phase-plan">Plan</div>
<div className="text-phase-build">Build</div>
<div className="text-phase-qa">QA</div>
<div className="text-phase-fix">Fix</div>
<div className="text-phase-deploy">Deploy</div>

// Background
<div className="bg-phase-intake/20">Intake bg</div>
<div className="bg-phase-plan/20">Plan bg</div>
```
