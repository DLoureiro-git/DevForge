# Feature Pipeline (FASE 4) — DevForge V2

Pipeline completo para construir Features individuais dentro de um Projeto.

## Arquitectura

### Pipeline de 6 Fases

```
1. PM Agent      → Claude Opus 4.6 (gerar acceptance criteria)
2. Architect     → Claude Sonnet 4 (gerar plano técnico)
3. Dev Team      → 4 agentes Ollama PARALELO
   ├─ Frontend Dev
   ├─ Backend Dev
   ├─ Database Dev
   └─ Utils Dev
4. QA Agent      → Playwright + validators
5. Fix Loop      → Ollama (até 10 iterações ou QA >= 95%)
6. Deploy        → Git commit + push (branch isolation)
```

### Branch Isolation

Cada Feature trabalha num branch separado:

```
main
  └── feat/{featureId}
```

- Todo o código vai para o branch da feature
- Merge para main só quando QA >= 95%
- Permite múltiplas features em paralelo

### WebSocket Streaming

3 tipos de eventos emitidos em tempo real:

```typescript
// 1. Mudança de fase
{
  type: 'PHASE_CHANGED',
  data: { featureId: string, phase: string }
}

// 2. Novo log
{
  type: 'LOG_APPENDED',
  data: {
    featureId: string,
    log: {
      timestamp: Date,
      level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS',
      message: string,
      phase: string
    }
  }
}

// 3. Update de Feature
{
  type: 'FEATURE_UPDATED',
  data: {
    featureId: string,
    status?: string,
    progress?: number
  }
}
```

### Base de Dados

Updates automáticos em `Feature`:

```prisma
model Feature {
  agentProgress      Int           @default(0) // 0-100
  status             String        @default("BACKLOG") // BACKLOG → IN_PROGRESS → IN_REVIEW → DONE
  acceptanceCriteria String        @default("[]") // JSON array
  technicalPlan      Json?         // Plano técnico do Architect
  logs               String        @default("[]") // Array de logs
  bugs               String        @default("[]") // Array de bugs do QA
  qaScore            Float?        // 0-100
  branchName         String?       // ex: feat/abc123
}
```

## Uso

### 1. Via API (Recomendado)

```bash
# Start building uma feature
POST /api/projects/:projectId/features/:featureId/start-build
Authorization: Bearer <token>

# Response
{
  "id": "feature-123",
  "status": "IN_PROGRESS",
  "agentProgress": 0,
  "message": "Feature pipeline started in background"
}
```

### 2. Via Código

```typescript
import { runFeaturePipeline } from './services/feature-orchestrator'

const result = await runFeaturePipeline({
  featureId: 'feature-123',
  projectId: 'project-456',
  claudeApiKey: process.env.ANTHROPIC_API_KEY!,
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'qwen2.5-coder:32b',
  outputDirectory: './generated-projects',
  autoFix: true,
  maxFixIterations: 10,
  targetQAScore: 95,
})

console.log(result)
// {
//   success: true,
//   featureId: 'feature-123',
//   finalStatus: 'IN_REVIEW',
//   qaScore: 96.5,
//   branch: 'feat/feature-123',
//   phases: [...],
//   totalTime: 180000 // ms
// }
```

### 3. WebSocket Client (Frontend)

```typescript
// Connect to WebSocket
const token = localStorage.getItem('auth_token')
const ws = new WebSocket(`ws://localhost:5680/ws?token=${token}`)

ws.onopen = () => {
  // Subscribe to feature updates
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_FEATURE',
    featureId: 'feature-123',
    projectId: 'project-456'
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  switch (message.type) {
    case 'PHASE_CHANGED':
      console.log(`Fase: ${message.data.phase}`)
      break

    case 'LOG_APPENDED':
      console.log(`[${message.data.log.level}] ${message.data.log.message}`)
      break

    case 'FEATURE_UPDATED':
      console.log(`Progress: ${message.data.progress}%`)
      break
  }
}

// Unsubscribe
ws.send(JSON.stringify({
  type: 'UNSUBSCRIBE_FEATURE'
}))
```

## Pré-requisitos

1. **Project deve ter PRD gerado**
   ```typescript
   if (!project.prd) {
     throw new Error('Run PM Agent first')
   }
   ```

2. **Project deve ter código base gerado**
   ```typescript
   if (!project.outputPath) {
     throw new Error('Run full pipeline first')
   }
   ```

3. **User deve ter Anthropic API key**
   ```typescript
   if (!settings.anthropicKey) {
     throw new Error('Configure API key in settings')
   }
   ```

4. **Ollama deve estar a correr**
   ```bash
   ollama serve
   ollama pull qwen2.5-coder:32b
   ```

## Fluxo Detalhado

### Fase 1: PM Agent (Claude)

**Input:**
- Feature title, description, type, priority
- Project PRD

**Output:**
- 5-10 acceptance criteria (Given-When-Then format)

**Exemplo:**
```json
[
  "Given the user is logged in, When they click 'Add Feature', Then a modal should appear",
  "Given the modal is open, When they fill the form and submit, Then the feature should be created",
  "Given the feature was created, When they view the list, Then it should appear at the top"
]
```

### Fase 2: Architect (Claude)

**Input:**
- Feature + acceptance criteria
- Project architecture

**Output:**
- Database changes (new tables, fields, relations)
- Files to create/modify
- Data flow
- QA tests
- Technical rules

**Exemplo:**
```json
{
  "databaseChanges": {
    "modifiedTables": ["Feature"],
    "newRelations": [],
    "migrations": ["ALTER TABLE Feature ADD COLUMN priority TEXT"]
  },
  "files": {
    "create": [
      { "path": "app/features/new/page.tsx", "purpose": "Feature creation page" }
    ],
    "modify": [
      { "path": "lib/prisma.ts", "changes": "Add Feature model import" }
    ]
  }
}
```

### Fase 3: Dev Team (Ollama)

**Execução Paralela:**

```
Frontend Dev ──┐
Backend Dev  ──┼──> Código gerado em paralelo
Database Dev ──┤
Utils Dev    ──┘
```

**Cada dev:**
1. Recebe file assignment
2. Gera código com Ollama
3. Valida sintaxe
4. Escreve ficheiro

### Fase 4: QA Agent (Playwright)

**Validações:**
- UI exists and is functional
- API endpoints return correct data
- Database constraints are respected
- Acceptance criteria are met

**Output:**
```json
{
  "score": {
    "percentage": 85,
    "passed": 17,
    "failed": 3
  },
  "allBugs": [
    {
      "severity": "HIGH",
      "category": "BUTTON",
      "description": "Submit button not visible"
    }
  ]
}
```

### Fase 5: Fix Loop (Ollama)

**Condições:**
- `autoFix: true`
- `qaScore < targetQAScore` (default 95%)

**Loop:**
```
1. Fix bugs (max 1 iteration per loop)
2. Re-run QA
3. Update qaScore
4. Repeat até qaScore >= 95% OU maxIterations (default 10)
```

### Fase 6: Deploy (Git)

**Acções:**
```bash
git add .
git commit -m "feat: <title>"
git push -u origin feat/<featureId>
```

**Status final:**
- `IN_REVIEW` se qaScore >= 95%
- `BLOCKED` se qaScore < 95%

## Configuração

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# Ollama
OLLAMA_ENDPOINT="http://localhost:11434"
OLLAMA_MODEL_DEV="qwen2.5-coder:32b"

# Output
OUTPUT_DIRECTORY="./generated-projects"

# QA
TARGET_QA_SCORE=95
MAX_FIX_ITERATIONS=10
```

### User Settings (DB)

```typescript
interface Settings {
  anthropicKey: string
  ollamaUrl: string
  ollamaModelDev: string
  outputDirectory: string
  autoFix: boolean
}
```

## Troubleshooting

### Pipeline fica stuck

**Sintoma:** Feature status = IN_PROGRESS mas sem progress

**Causa:** Ollama não está a responder

**Fix:**
```bash
# Verificar Ollama
curl http://localhost:11434/api/version

# Reiniciar Ollama
killall ollama
ollama serve
```

### QA Score sempre baixo

**Sintoma:** qaScore < 60% mesmo após fix loop

**Causa:** Acceptance criteria demasiado vagos ou impossíveis

**Fix:**
1. Rever acceptance criteria
2. Simplificar feature
3. Dividir em sub-features

### WebSocket não conecta

**Sintoma:** Frontend não recebe eventos

**Causa:** JWT token inválido ou expirado

**Fix:**
```typescript
// Renovar token
const newToken = await refreshAuthToken()
const ws = new WebSocket(`ws://localhost:5680/ws?token=${newToken}`)
```

## Performance

### Tempos Típicos

| Fase | Tempo (estimado) |
|------|------------------|
| PM Agent | 30-60s |
| Architect | 45-90s |
| Dev Team | 2-5min (paralelo) |
| QA Agent | 1-3min |
| Fix Loop | 3-10min (depende de bugs) |
| Deploy | 10-30s |
| **TOTAL** | **7-20min** |

### Optimizações

1. **Ollama local vs remoto:**
   - Local (32B): 2-5min Dev Team
   - Remoto (API): 5-15min Dev Team

2. **Paralelização:**
   - 4 devs paralelo: 2min
   - 4 devs sequencial: 8min

3. **QA Headless:**
   - Headless: 1min
   - Com UI: 3min

## Roadmap

- [ ] Deploy automático para Vercel/Railway após merge
- [ ] Suporte para múltiplas features em paralelo
- [ ] AI code review antes de merge
- [ ] Auto-merge se qaScore = 100%
- [ ] Rollback automático se produção falhar
