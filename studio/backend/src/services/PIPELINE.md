# DevForge V2 — Pipeline Completo

Arquitectura do sistema de geração automática de aplicações web full-stack.

---

## 📋 Visão Geral

O DevForge V2 transforma descrições em linguagem natural em aplicações web completas e deployadas, seguindo 6 etapas:

1. **PM Agent** — Intake conversacional (já executado antes do pipeline)
2. **Architect Agent** — Gera arquitectura técnica
3. **Dev Team** — 4 agentes Ollama em paralelo geram código
4. **QA Pipeline** — Validações automáticas com Playwright
5. **Bug Fix Loop** — Correcção automática com escalonamento (Ollama → Haiku → Sonnet)
6. **Delivery Agent** — Documentação de entrega + aprovação

---

## 🏗️ Arquitectura de Serviços

### 1. PM Agent (`pm-agent.ts`)
**Modelo:** Claude Sonnet 4
**Input:** Mensagem do utilizador
**Output:** PRD (Product Requirements Document) completo

**Responsabilidades:**
- Conduzir intake conversacional não-técnico
- Fazer perguntas adaptativas (árvore de decisão)
- Detectar features automaticamente (auth, payments, multi-tenant, etc.)
- Gerar PRD estruturado em JSON

**Key Features:**
- Linguagem não-técnica (nunca menciona React, PostgreSQL, etc.)
- Quick replies para perguntas comuns
- Validação de respostas com Claude
- Estimativa de tempo baseada em features

### 2. Architect Agent (`architect.ts`)
**Modelo:** Claude Sonnet 4
**Input:** PRD
**Output:** ARCHITECTURE.md + JSON estruturado

**Responsabilidades:**
- Traduzir PRD em decisões técnicas
- Gerar database schema (Prisma)
- Definir file structure
- **GERAR REGRAS TÉCNICAS OBRIGATÓRIAS** (10-20 regras específicas)

**Stack Padrão:**
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- Backend: Next.js API Routes + tRPC
- Database: PostgreSQL + Prisma ORM
- Auth: NextAuth.js v5
- Deployment: Vercel (frontend) + Railway (DB)

**Regras Técnicas Geradas:**
- IDs: sempre UUIDs (cuid), nunca auto-increment
- Multi-tenant: businessId obrigatório em TODAS as queries
- Auth: bcrypt + session validation antes de DB queries
- TypeScript strict: sem 'any', sem '@ts-ignore'
- Validação: client + server side (zod)

### 3. Dev Team (`dev-team.ts`)
**Modelo:** Ollama Qwen 2.5 Coder 32B (local)
**4 Agentes em Paralelo:**

#### Frontend Dev
- Pages (Next.js App Router)
- Components React
- Client-side validation
- Tailwind CSS + shadcn/ui

#### Backend Dev
- API Routes
- Business logic
- Server-side validation (zod)
- Error handling

#### Database Dev
- Prisma schema completo
- Relations + indexes
- Migrations strategy
- Seed data

#### Integration Dev
- Config files (next.config.js, tailwind.config.js)
- Auth setup (NextAuth)
- External APIs (Stripe, email)
- .env.example
- package.json

**Output:** Todos os ficheiros do projecto gerados

### 4. QA Pipeline (`qa-executor.ts`)
**Ferramenta:** Playwright (browser automation)
**Input:** Código gerado + PRD
**Output:** QA Report + Bug list + Score

**Checklist Adaptativa:**
- Universal checks (sempre executa)
- Feature-specific checks (baseado no PRD)
- Validators especializados por categoria

**Categorias de Validação:**
- Responsive design (mobile, tablet, desktop)
- Database connections
- Auth flows
- Forms (validation, submission)
- Buttons (functionality, accessibility)
- Console errors
- Performance
- Security
- Accessibility (WCAG 2.1 AA)

**QA Score:**
- 0-100% baseado em severidade dos bugs
- CRITICAL bugs: bloqueiam produção
- Breakdown por categoria

### 5. Bug Fix Loop (`bug-fix-loop.ts`)
**Escalonamento Inteligente:**
- Iterações 1-3: **Ollama** (local, grátis, rápido)
- Iterações 4-6: **Claude Haiku** (rápido, barato)
- Iterações 7-10: **Claude Sonnet** (poderoso, caro)

**Processo:**
1. Gerar fix com modelo actual
2. Aplicar mudanças aos ficheiros
3. Re-run APENAS checks relevantes (smart re-validation)
4. Verificar se bug foi corrigido
5. Se introduziu bugs críticos: reverter (git checkout)
6. Se não corrigiu: escalar para modelo mais poderoso

**Máximo:** 10 iterações por bug

### 6. Delivery Agent (`delivery.ts`)
**Modelo:** Claude Opus 4.6
**Input:** PRD + Architecture + Code + QA Results + Bug Fix Results
**Output:** DELIVERY.md completo

**Gera:**
- **Changelog** (features, fixes, security, performance)
- **Deploy Checklist** (critical steps, automated vs manual)
- **Testing Guide** (cenários críticos, smoke tests)
- **Rollback Plan** (steps sequenciais com comandos exactos)
- **Success Metrics** (KPIs, thresholds, alertas)
- **Environment Variables** (lista completa com descrições)
- **Post-Deploy Verification** (health checks, smoke tests)

**Aprovação para Produção:**
- QA Score ≥ 85%
- 0 bugs CRITICAL
- 0 blockers activos
- Rollback plan definido

---

## 🔄 Orchestrator (`orchestrator.ts`)

**Classe Principal:** `Pipeline`

**Método:** `run()`

**Fluxo:**
```typescript
1. Carregar Project da DB (validar PRD existe)
2. Update status: PLANNING

3. FASE PM (skip — já executado)
   - Carregar PRD existente

4. FASE ARCHITECT
   - Gerar arquitectura técnica
   - Gravar em Project.architecture

5. FASE DEV TEAM
   - Update status: BUILDING
   - Executar 4 devs em paralelo
   - Gravar ficheiros no disco
   - Update Project.outputPath

6. FASE QA
   - Update status: QA
   - Executar validações Playwright
   - Gravar QA report na DB
   - Update Project.qaScore

7. FASE BUG FIX (se autoFix = true)
   - Update status: FIXING
   - Corrigir bugs automaticamente
   - Increment Project.loopCount

8. FASE DELIVERY
   - Update status: DEPLOYING
   - Gerar DELIVERY.md
   - Aprovar para produção
   - Update status: DELIVERED (se aprovado)

9. Return PipelineResult
```

**Error Handling:**
- Todas as fases em try-catch
- Update status: FAILED em erro
- Gravar erro na Phase.error
- Return error details

**Logging:**
- Callback para SSE broadcast
- Logs técnicos vs user-friendly
- Gravar logs em Phase na DB

---

## 🚀 Deploy Service (`deploy-service.ts`)

### Vercel Deploy
```typescript
deployToVercel(config) → { url, success, logs }
```

**Processo:**
1. Verificar Vercel CLI instalado
2. Criar .env.production.local
3. Executar `vercel --prod`
4. Configurar env vars via API (se tiver token)
5. Retornar URL do deployment

### Railway Deploy
```typescript
deployToRailway(config) → { url, success, logs }
```

**Processo:**
1. Verificar Railway CLI instalado
2. Login (se tiver token)
3. Criar projecto
4. Adicionar PostgreSQL database
5. Configurar env vars
6. Executar `railway up`
7. Obter URL do deployment

### GitHub Repo
```typescript
createGitHubRepo(config) → { repoUrl, success, logs }
```

**Processo:**
1. Criar repo via GitHub API
2. Inicializar git local
3. Commit inicial
4. Push para remote (autenticado com token)

---

## 📦 Project Generator (`project-generator.ts`)

**Classe:** `ProjectGenerator`

**Métodos:**

### `createProjectStructure()`
Criar pastas baseadas em architecture.fileStructure

### `generatePackageJson()`
- Dependencies dinâmicas baseadas em features do PRD
- Scripts padrão (dev, build, start, db:*)
- Engines (Node ≥20, npm ≥10)

### `generateEnvExample()`
- Variáveis obrigatórias (DATABASE_URL, NEXTAUTH_*)
- Variáveis condicionais (Stripe, Google OAuth, etc.)
- Placeholders seguros (nunca valores reais)

### `generateReadme()`
- Quick start guide
- Stack técnica
- Database schema
- Deploy instructions
- Troubleshooting

### `generateDockerfile()`
- Multi-stage build
- Prisma generate
- Next.js standalone output
- Production-ready

### `generateGitignore()`
- node_modules, .next, .env
- Patterns padrão Next.js

### `zipProject()`
- Criar zip de todo o projecto
- Excluir node_modules, .next, .git
- Retornar Buffer para download

---

## 🔧 Uso

### Pipeline Completo
```typescript
import { Pipeline } from './services/orchestrator'

const pipeline = new Pipeline({
  projectId: 'abc123',
  outputDirectory: './generated-projects',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'qwen2.5-coder:32b',
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  autoFix: true,
  autoDeploy: false
})

// SSE logging
pipeline.onLog((log) => {
  console.log(`[${log.level}] ${log.message}`)
  // Broadcast via SSE para frontend
})

const result = await pipeline.run()

if (result.success) {
  console.log(`✅ Projecto gerado: ${result.artifacts.deliveryDoc.markdown}`)
  console.log(`🚀 Deploy URL: ${result.deployUrl}`)
} else {
  console.error(`❌ Pipeline falhou: ${result.error}`)
}
```

### Deploy Standalone
```typescript
import { deployComplete } from './services/deploy-service'

const result = await deployComplete({
  projectPath: './generated-projects/abc123',
  projectName: 'my-awesome-app',
  envVars: {
    DATABASE_URL: 'postgresql://...',
    NEXTAUTH_SECRET: '...',
    NEXTAUTH_URL: 'https://my-app.vercel.app'
  },
  githubToken: process.env.GITHUB_TOKEN,
  vercelToken: process.env.VERCEL_TOKEN,
  railwayToken: process.env.RAILWAY_TOKEN
})

console.log(`GitHub: ${result.github?.repoUrl}`)
console.log(`Vercel: ${result.vercel?.url}`)
console.log(`Railway: ${result.railway?.url}`)
```

---

## 📊 Database Schema

```prisma
model Project {
  id           String        @id @default(cuid())
  userId       String
  name         String
  description  String        // prompt original
  status       ProjectStatus @default(INTAKE)
  prd          Json?         // PRD do PM Agent
  architecture Json?         // Architecture do Architect
  qaReport     Json?         // QA Report
  qaScore      Float?        // 0-100
  loopCount    Int           @default(0)
  outputPath   String?       // path do código gerado
  deployUrl    String?       // URL deployado
  repoUrl      String?       // GitHub repo
  estimatedMin Int?          // tempo estimado
  actualMin    Int?          // tempo real
  phases       Phase[]
  bugs         Bug[]
  messages     Message[]
}

model Phase {
  id              String      @id @default(cuid())
  projectId       String
  type            PhaseType   // PM, ARCHITECT, FRONTEND, QA, BUGFIX, DELIVERY
  status          PhaseStatus // PENDING, RUNNING, DONE, ERROR
  startedAt       DateTime?
  finishedAt      DateTime?
  durationSec     Int?
  summary         String?     // user-friendly
  technicalOutput String?     // JSON completo
  logs            Log[]
}
```

---

## ⚡ Performance

**Tempos Esperados:**
- PM Agent: 2-5 min (conversacional)
- Architect: 30-60s
- Dev Team: 2-4 min (paralelo)
- QA Pipeline: 1-3 min
- Bug Fix: 0-10 min (depende dos bugs)
- Delivery: 20-40s

**Total:** 5-15 minutos para projecto completo pronto para produção

**Custos:**
- PM + Architect + Delivery: ~$0.10-0.30 (Claude API)
- Dev Team: $0 (Ollama local)
- QA: $0 (Playwright local)
- Bug Fix 1-3: $0 (Ollama local)
- Bug Fix 4-6: ~$0.01-0.05 (Haiku)
- Bug Fix 7-10: ~$0.10-0.30 (Sonnet)

**Custo médio por projecto:** $0.20-0.60

---

## 🎯 Next Steps

1. Integrar Orchestrator com API routes (Express)
2. SSE endpoints para live updates
3. Frontend dashboard para visualizar progresso
4. Auto-deploy automático após aprovação
5. Webhook notifications (Discord, Slack, Email)
6. Metrics & monitoring (Sentry, LogRocket)

---

**Gerado por DevForge V2 — Diogo Loureiro**
