# Sistema de Regras Técnicas — DevForge V2

> Prevenção automática de "context drift" entre Claude e Ollama

## Problema que Resolve

Quando diferentes modelos de IA (Claude Opus 4.6 + Ollama Qwen 2.5) trabalham no mesmo projecto, podem surgir inconsistências:

- Claude usa `cuid()`, Ollama usa `autoincrement()`
- Claude valida auth, Ollama esquece-se
- Claude filtra por `businessId`, Ollama não
- Claude usa bcrypt 12 rounds, Ollama usa 10

**Solução:** O Architect Agent gera **Regras Técnicas Absolutas** baseadas no PRD, que são enforçadas automaticamente pelo Code Validator.

---

## Arquitectura do Sistema

```
┌─────────────┐
│  PM Agent   │ ← User conversa em linguagem natural
└──────┬──────┘
       │ PRD (JSON)
       ▼
┌─────────────────┐
│ Architect Agent │ ← Gera arquitectura + REGRAS TÉCNICAS
└──────┬──────────┘
       │ Architecture + Rules
       ▼
┌─────────────────┐
│  Coder Agent    │ ← Claude/Ollama geram código
└──────┬──────────┘
       │ Generated Files
       ▼
┌─────────────────┐
│ Code Validator  │ ← Valida contra regras técnicas
└──────┬──────────┘
       │
       ├─ PASS → QA Engine (testes funcionais)
       │
       └─ FAIL → Auto-Fix Loop (volta ao Coder Agent)
```

---

## Componentes

### 1. Architect Agent (`architect.ts`)

**Responsabilidade:** Gerar arquitectura técnica + regras técnicas baseadas no PRD.

**Output:**
```typescript
interface ArchitectureOutput {
  stack: { frontend, backend, database, auth, ... }
  databaseSchema: { tables: [...] }
  fileStructure: { "app/": [...], "lib/": [...] }
  technicalRules: string[]  // ← NOVO
  architectureMarkdown: string
}
```

**Exemplos de Regras Geradas:**

```typescript
technicalRules: [
  "Usar UUIDs (cuid) como IDs, NUNCA auto-increment integers",
  "TODAS as queries devem filtrar por businessId (multi-tenant)",
  "Passwords SEMPRE com bcrypt (12 rounds minimum)",
  "Env vars NUNCA hardcoded, sempre process.env",
  "TypeScript strict: sem 'any', sem '@ts-ignore'",
  "API routes: validar auth ANTES de queries DB",
  "Formulários: validação client + server side",
  "Migrations: NUNCA editar existentes, sempre criar nova",
  "Relations: SEMPRE definir onDelete/onUpdate behavior",
  "NUNCA fazer deploy sem .env.example actualizado"
]
```

**Adaptação ao PRD:**
- Se `hasMultiTenant: true` → Enforçar `businessId` em TODAS as queries
- Se `hasAuth: true` → Enforçar bcrypt + session validation
- Se `hasPayments: true` → Enforçar Stripe webhook validation

---

### 2. Code Validator (`code-validator.ts`)

**Responsabilidade:** Validar código gerado contra regras técnicas usando Ollama.

**Modelo:** `qwen2.5-coder:7b` (temperature: 0.1 para rigor)

**Sistema Prompt:**
```
Analisa código linha por linha e identifica VIOLAÇÕES das regras técnicas.

Para cada violação:
- Número da regra violada
- Linha aproximada
- Descrição clara do problema
- Severidade: ERROR (bloqueia deploy) ou WARNING (corrigir)
```

**Output:**
```typescript
interface ValidationResult {
  passed: boolean
  violations: [{
    rule: "Regra #3",
    file: "prisma/schema.prisma",
    line: 12,
    description: "Business model usa autoincrement em vez de cuid()",
    severity: "ERROR"
  }]
  summary: "3 erros críticos, 2 warnings"
}
```

---

### 3. Integration Flow (`examples/technical-rules-flow.ts`)

**Exemplo completo** de como o sistema funciona end-to-end:

1. PM Agent → PRD
2. Architect Agent → Architecture + Rules
3. Coder Agent → Generated Files
4. Code Validator → Validation Report
5. Auto-Fix Loop (se necessário)
6. ARCHITECTURE.md (output final)

---

## ARCHITECTURE.md — Output Final

O Architect gera `ARCHITECTURE.md` com secção dedicada às regras técnicas:

```markdown
# ARCHITECTURE.md — SalesPro CRM

## 🛠️ Stack Técnica
...

## 🗄️ Database Schema
...

## 📁 File Structure
...

## ⚠️ REGRAS TÉCNICAS OBRIGATÓRIAS

> Estas regras DEVEM ser seguidas rigorosamente.
> São enforçadas automaticamente pelo Code Validator.

1. **Usar UUIDs (cuid) como IDs, NUNCA auto-increment integers**
2. **TODAS as queries devem filtrar por businessId (multi-tenant)**
3. **Passwords SEMPRE com bcrypt (12 rounds minimum)**
4. **Env vars NUNCA hardcoded, sempre process.env**
5. **TypeScript strict: sem 'any', sem '@ts-ignore'**
6. **API routes: validar auth ANTES de queries DB**
7. **Formulários: validação client + server side**
8. **Migrations: NUNCA editar existentes, sempre criar nova**
9. **Relations: SEMPRE definir onDelete/onUpdate behavior**
10. **NUNCA fazer deploy sem .env.example actualizado**

---

## 🚀 Deployment
...
```

---

## Como Usar

### Pipeline Completo

```typescript
import { PMAgent } from './services/pm-agent'
import { ArchitectAgent } from './services/architect'
import { CodeValidator } from './services/code-validator'

// 1. PM Agent gera PRD
const pmAgent = new PMAgent()
const prd = await pmAgent.generatePRD()

// 2. Architect Agent gera arquitectura + regras técnicas
const architectAgent = new ArchitectAgent()
const architecture = await architectAgent.generateArchitecture(prd)

// 3. Coder Agent gera código (Claude/Ollama)
const generatedFiles = await coderAgent.generateCode(architecture)

// 4. Code Validator valida contra regras técnicas
const validator = new CodeValidator(architecture)
const validationResult = await validator.validateBatch(generatedFiles)

if (!validationResult.passed) {
  console.log(validator.generateReport(validationResult))

  // 5. Auto-fix loop
  const fixedFiles = await coderAgent.fixViolations(validationResult.violations)
  const revalidation = await validator.validateBatch(fixedFiles)
}

// 6. Se passou validação, avançar para QA Engine
const qaChecklist = generateAdaptiveChecklist(prd)
// ... executar testes funcionais
```

### Validação Individual

```typescript
const validator = new CodeValidator(architecture)

const result = await validator.validateFile(
  'app/api/users/route.ts',
  fileContent
)

if (!result.passed) {
  console.log(validator.generateReport(result))
}
```

---

## Benefícios

### 1. Previne Context Drift
- Claude e Ollama seguem regras exactas
- Reduz inconsistências entre modelos

### 2. Enforcement Automático
- Validação antes de deploy
- Feedback imediato ao Coder Agent

### 3. Rastreabilidade
- Regras documentadas em ARCHITECTURE.md
- Audit trail de violations

### 4. Adaptativo ao PRD
- Regras específicas para features
- Multi-tenant → `businessId` obrigatório
- Auth → bcrypt + session validation

### 5. Iteração Rápida
- Auto-fix de violations comuns
- Reduz ciclos de correcção manual

---

## Severidades

### ERROR (bloqueia deploy)
- Violações críticas de segurança
- Data integrity issues
- Multi-tenant leaks
- Hardcoded secrets

**Acção:** DEVE ser corrigido antes de continuar

### WARNING (deve ser corrigido)
- Boas práticas não seguidas
- Performance issues menores
- Code style violations

**Acção:** Corrigir antes de deploy, mas não bloqueia

---

## Exemplos de Violations Comuns

### ❌ ID com autoincrement (multi-tenant)
```prisma
// ERRADO
model Business {
  id Int @id @default(autoincrement())
}

// CORRECTO
model Business {
  id String @id @default(cuid())
}
```

### ❌ Query sem businessId (multi-tenant)
```typescript
// ERRADO
const deals = await prisma.deal.findMany()

// CORRECTO
const deals = await prisma.deal.findMany({
  where: { businessId }
})
```

### ❌ API route sem auth
```typescript
// ERRADO
export async function GET() {
  const users = await prisma.user.findMany()
  return NextResponse.json(users)
}

// CORRECTO
export async function GET() {
  const session = await getServerSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const users = await prisma.user.findMany({
    where: { businessId: session.user.businessId }
  })
  return NextResponse.json(users)
}
```

### ❌ Hardcoded secrets
```typescript
// ERRADO
const API_KEY = 'sk_live_123456'

// CORRECTO
const API_KEY = process.env.STRIPE_SECRET_KEY
if (!API_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
```

---

## Roadmap

- [ ] Implementar auto-fix automático de violations comuns
- [ ] Dashboard UI para visualizar violations em tempo real
- [ ] Metrics: % de violations por categoria
- [ ] Integração com Git pre-commit hooks
- [ ] Custom rules definidas pelo utilizador

---

## Ficheiros Relacionados

- `studio/backend/src/services/architect.ts` — Gera regras técnicas
- `studio/backend/src/services/code-validator.ts` — Valida código
- `studio/backend/src/examples/technical-rules-flow.ts` — Exemplo completo
- `studio/backend/src/services/pm-agent.ts` — Gera PRD
- `studio/backend/src/services/qa-engine.ts` — Testes funcionais

---

**Gerado por DevForge V2 — 05/03/2026**
