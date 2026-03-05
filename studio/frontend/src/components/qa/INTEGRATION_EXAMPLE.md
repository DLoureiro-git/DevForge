# Exemplo de Integração — QA Components

## 1. Página Simples com Dashboard Completo

**File:** `src/app/projects/[id]/qa/page.tsx`

```tsx
'use client'

import { useParams } from 'next/navigation'
import QADashboard from '@/components/qa/QADashboard'

export default function ProjectQAPage() {
  const params = useParams()
  const projectId = params.id as string

  return <QADashboard projectId={projectId} />
}
```

---

## 2. Página com Componentes Individuais + Custom Logic

**File:** `src/app/projects/[id]/qa/advanced.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BugTracker, QAScoreCard, ChecklistProgress } from '@/components'
import type { Bug, Check, QAScore } from '@/components/types/qa'

export default function AdvancedQAPage() {
  const params = useParams()
  const projectId = params.id as string

  const [bugs, setBugs] = useState<Bug[]>([])
  const [checks, setChecks] = useState<Check[]>([])
  const [score, setScore] = useState<QAScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [bugsRes, checksRes, scoreRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/qa/bugs`),
          fetch(`/api/projects/${projectId}/qa/checks`),
          fetch(`/api/projects/${projectId}/qa/score`)
        ])

        if (!bugsRes.ok || !checksRes.ok || !scoreRes.ok) {
          throw new Error('Failed to fetch QA data')
        }

        const [bugsData, checksData, scoreData] = await Promise.all([
          bugsRes.json(),
          checksRes.json(),
          scoreRes.json()
        ])

        setBugs(bugsData)
        setChecks(checksData)
        setScore(scoreData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh a cada 10s
    return () => clearInterval(interval)
  }, [projectId])

  // Custom handlers
  const handleBugToggle = (bugId: string) => {
    console.log('Bug toggled:', bugId)
    // Enviar analytics ou update
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Erro ao carregar dados QA: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">QA Report</h1>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <>
          {/* Score in top-right corner */}
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1 space-y-6">
              <BugTracker
                bugs={bugs}
                onToggleDetail={handleBugToggle}
              />
              <ChecklistProgress checks={checks} />
            </div>

            {score && (
              <div className="w-80">
                <QAScoreCard score={score} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
```

---

## 3. Com Tabs e Filtros Adicionais

**File:** `src/app/projects/[id]/qa/tabs.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BugTracker, QAScoreCard, ChecklistProgress } from '@/components'
import type { Bug, Check, QAScore } from '@/components/types/qa'

export default function TabbedQAPage() {
  const params = useParams()
  const projectId = params.id as string

  const [bugs, setBugs] = useState<Bug[]>([])
  const [checks, setChecks] = useState<Check[]>([])
  const [score, setScore] = useState<QAScore | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Fetch data...
  }, [projectId])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">QA Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bugs">Bugs ({bugs.length})</TabsTrigger>
          <TabsTrigger value="checks">Checks ({checks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {score && (
            <div className="grid grid-cols-3 gap-6">
              <QAScoreCard score={score} />
              <div className="col-span-2">
                <BugTracker bugs={bugs} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bugs">
          <BugTracker bugs={bugs} />
        </TabsContent>

        <TabsContent value="checks">
          <ChecklistProgress checks={checks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 4. Com Mock Data para Dev

**File:** `src/app/qa-demo/page.tsx`

```tsx
import QADemo from '@/components/qa/qa-demo'

export default function QADemoPage() {
  return <QADemo />
}
```

Acesso em: `http://localhost:3000/qa-demo`

---

## 5. API Routes

**File:** `src/app/api/projects/[id]/qa/bugs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id

  try {
    // Buscar bugs da base de dados ou serviço
    const bugs = await fetchProjectBugs(projectId)

    return NextResponse.json(bugs)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bugs' },
      { status: 500 }
    )
  }
}

async function fetchProjectBugs(projectId: string) {
  // Implementar lógica real
  return []
}
```

---

## 6. WebSocket Integration

**File:** `src/lib/qa-socket.ts`

```typescript
export class QASocket {
  private ws: WebSocket | null = null
  private url: string
  private projectId: string
  private listeners: Map<string, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(projectId: string) {
    this.projectId = projectId
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    this.url = `${protocol}//${window.location.host}/api/projects/${projectId}/qa/ws`
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[QASocket] Conectado')
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data)
          this.emit(type, data)
        } catch (err) {
          console.error('[QASocket] Parse error:', err)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[QASocket] Error:', error)
        this.emit('error', error)
      }

      this.ws.onclose = () => {
        this.emit('disconnected')
        this.reconnect()
      }
    } catch (err) {
      console.error('[QASocket] Connection error:', err)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      console.log(`[QASocket] Reconectando em ${delay}ms...`)
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) listeners.splice(index, 1)
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.listeners.get(event) || []
    listeners.forEach(callback => callback(data))
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
```

**File:** `src/hooks/useQASocket.ts`

```typescript
import { useEffect, useRef } from 'react'
import { QASocket } from '@/lib/qa-socket'

export function useQASocket(projectId: string, handlers: Record<string, Function>) {
  const socketRef = useRef<QASocket | null>(null)

  useEffect(() => {
    socketRef.current = new QASocket(projectId)
    socketRef.current.connect()

    // Registrar handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socketRef.current!.on(event, handler)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [projectId])

  return socketRef.current
}
```

**Usage:**

```tsx
export default function QAPage() {
  const [bugs, setBugs] = useState<Bug[]>([])
  const [checks, setChecks] = useState<Check[]>([])

  useQASocket(projectId, {
    'bug-update': (bugs) => setBugs(bugs),
    'check-update': (checks) => setChecks(checks),
    'qa-complete': () => console.log('QA rodou!')
  })

  // ...
}
```

---

## 7. Testes com Vitest

**File:** `src/components/__tests__/BugTracker.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BugTracker from '@/components/BugTracker'
import type { Bug } from '@/components/types/qa'

describe('BugTracker', () => {
  it('renders empty state', () => {
    render(<BugTracker bugs={[]} />)
    expect(screen.getByText(/Nenhum bug detectado/i)).toBeInTheDocument()
  })

  it('displays bugs grouped by severity', () => {
    const bugs: Bug[] = [
      {
        id: '1',
        category: 'Test',
        description: 'Test bug',
        userFriendlyDescription: 'User description',
        severity: 'CRITICAL',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    render(<BugTracker bugs={bugs} />)
    expect(screen.getByText('Crítico')).toBeInTheDocument()
  })

  it('toggles bug details', () => {
    const mockToggle = vitest.fn()
    const bugs: Bug[] = [/* ... */]

    render(<BugTracker bugs={bugs} onToggleDetail={mockToggle} />)
    const bugElement = screen.getByText(/Test bug/i)
    fireEvent.click(bugElement)
    expect(mockToggle).toHaveBeenCalled()
  })
})
```

---

## 8. Variáveis Ambiente (env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Analytics (opcional)
NEXT_PUBLIC_ANALYTICS_ID=abc123
```

---

## Resumo de Implementação

1. **Rápido:** Copiar `QADashboard` e usar
2. **Customizável:** Importar componentes individuais
3. **WebSocket Ready:** Usar hook `useQASocket`
4. **Testável:** Componentes isolados, fáceis de testar
5. **Performante:** Memoization, lazy load

Ver `QA_COMPONENTS.md` para documentação completa.
