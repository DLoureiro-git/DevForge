# DevForge V2 — Integration Guide

## 📊 Pipeline Completo

```
User Input (PRD)
    ↓
PM Agent (analysePRD)
    ↓
Architect Agent (generateArchitecture)
    ↓
Dev Team (execute) ← 4 devs em paralelo
    ↓
QA Engine (validate)
    ↓
Bug Fix Loop (runBugFixLoop)
    ↓
Deploy (Vercel/Railway)
```

## 🔗 Integrações

### 1. PM Agent → Architect Agent

```typescript
import { PMAgent } from '@/services/pm-agent'
import { ArchitectAgent } from '@/services/architect'

const pmAgent = new PMAgent()
const architect = new ArchitectAgent()

// 1. PM analisa input do user
const prd = await pmAgent.generatePRD(userInput)

// 2. Architect gera architecture
const architecture = await architect.generateArchitecture(prd)
```

### 2. Architect Agent → Dev Team

```typescript
import { ArchitectAgent } from '@/services/architect'
import { devTeam } from '@/services/dev-team'

// 1. Gerar architecture
const architect = new ArchitectAgent()
const architecture = await architect.generateArchitecture(prd)

// 2. Dev Team gera código
const codeResult = await devTeam.execute({
  architecture: architecture.architectureMarkdown,
  technicalRules: architecture.technicalRules  // IMPORTANTE!
})
```

### 3. Dev Team → File System

```typescript
import fs from 'fs/promises'
import path from 'path'

async function saveGeneratedFiles(
  result: DevTeamResponse,
  projectDir: string
) {
  for (const file of result.files) {
    if (file.success && file.code && !file.noChanges) {
      const fullPath = path.join(projectDir, file.filePath)

      // Criar directórios
      await fs.mkdir(path.dirname(fullPath), { recursive: true })

      // Gravar ficheiro
      await fs.writeFile(fullPath, file.code, 'utf-8')

      console.log(`✅ ${file.filePath} (${file.code.split('\n').length} linhas)`)
    }
  }
}

// Uso
const result = await devTeam.execute({ ... })
await saveGeneratedFiles(result, '/path/to/project')
```

### 4. Dev Team → QA Engine

```typescript
import { devTeam } from '@/services/dev-team'
import { executeQA } from '@/services/qa-executor'

// 1. Gerar código
const codeResult = await devTeam.execute({ ... })

// 2. Gravar ficheiros
await saveGeneratedFiles(codeResult, projectDir)

// 3. Executar QA
const qaResult = await executeQA({
  projectPath: projectDir,
  prd: prd,
  architecture: architecture,
  config: {
    skipManual: false,
    parallel: true,
    stopOnCritical: false
  }
})

console.log(`QA Score: ${qaResult.score.overall}%`)
```

### 5. QA Engine → Bug Fix Loop

```typescript
import { executeQA } from '@/services/qa-executor'
import { runBugFixLoop } from '@/services/bug-fix-loop'

// 1. Executar QA
const qaResult = await executeQA({ ... })

// 2. Se houver bugs, auto-fix
if (qaResult.bugs.length > 0) {
  const fixResult = await runBugFixLoop({
    projectPath: projectDir,
    bugs: qaResult.bugs,
    maxIterations: 3,
    prd: prd,
    architecture: architecture
  })

  console.log(`Fixed ${fixResult.fixedCount}/${fixResult.totalBugs} bugs`)
}
```

### 6. Pipeline Completo

```typescript
async function fullPipeline(userInput: string) {
  console.log('🚀 DevForge V2 — Full Pipeline\n')

  // 1. PM Agent
  console.log('📋 PM Agent: Gerando PRD...')
  const pmAgent = new PMAgent()
  const prd = await pmAgent.generatePRD(userInput)
  console.log(`✅ PRD gerado (${prd.features.length} features)\n`)

  // 2. Architect Agent
  console.log('📐 Architect: Gerando architecture...')
  const architect = new ArchitectAgent()
  const architecture = await architect.generateArchitecture(prd)
  console.log(`✅ Architecture gerada (${architecture.technicalRules.length} regras)\n`)

  // 3. Dev Team
  console.log('👥 Dev Team: Gerando código...')
  const codeResult = await devTeam.execute({
    architecture: architecture.architectureMarkdown,
    technicalRules: architecture.technicalRules
  })
  console.log(`✅ Código gerado (${codeResult.stats.successful} ficheiros)\n`)

  // 4. Gravar ficheiros
  console.log('💾 Gravando ficheiros...')
  const projectDir = path.join(process.env.OUTPUT_DIR!, prd.projectName)
  await saveGeneratedFiles(codeResult, projectDir)
  console.log(`✅ Ficheiros gravados em ${projectDir}\n`)

  // 5. QA
  console.log('🔍 QA Engine: Validando...')
  const qaResult = await executeQA({
    projectPath: projectDir,
    prd,
    architecture,
    config: { skipManual: false, parallel: true }
  })
  console.log(`✅ QA Score: ${qaResult.score.overall}%\n`)

  // 6. Bug Fix (se necessário)
  if (qaResult.bugs.length > 0) {
    console.log(`🔧 Bug Fix Loop: ${qaResult.bugs.length} bugs encontrados...`)
    const fixResult = await runBugFixLoop({
      projectPath: projectDir,
      bugs: qaResult.bugs,
      maxIterations: 3,
      prd,
      architecture
    })
    console.log(`✅ Fixed ${fixResult.fixedCount}/${fixResult.totalBugs}\n`)
  }

  // 7. Deploy (opcional)
  if (process.env.AUTO_DEPLOY === 'true') {
    console.log('🚀 Deploy: Enviando para Vercel...')
    // Deploy logic here
    console.log('✅ Deploy concluído\n')
  }

  console.log('✨ Pipeline concluído!')

  return {
    projectDir,
    prd,
    architecture,
    codeResult,
    qaResult
  }
}
```

## 🎯 Best Practices

### 1. Error Handling

```typescript
try {
  const result = await devTeam.execute({ ... })

  // Verificar falhas
  const failed = result.files.filter(f => !f.success)
  if (failed.length > 0) {
    console.error('❌ Falhas:')
    failed.forEach(f => {
      console.error(`  - ${f.filePath}: ${f.error}`)
    })

    // Retry ou fallback
    // ...
  }
} catch (error) {
  console.error('❌ Dev Team falhou:', error)
  // Alertar user, rollback, etc.
}
```

### 2. Progress Tracking

```typescript
import { devTeam } from '@/services/dev-team'

// Evento de progresso
devTeam.on('file-start', (file) => {
  console.log(`⏳ Gerando ${file.filePath}...`)
})

devTeam.on('file-complete', (file) => {
  console.log(`✅ ${file.filePath} (${file.duration}ms)`)
})

const result = await devTeam.execute({ ... })
```

### 3. Caching

```typescript
import crypto from 'crypto'

// Cache baseado em hash da architecture
function getCacheKey(architecture: string): string {
  return crypto.createHash('md5').update(architecture).digest('hex')
}

async function executeWithCache(request: DevTeamRequest) {
  const cacheKey = getCacheKey(request.architecture)
  const cachePath = path.join('.cache', `${cacheKey}.json`)

  // Check cache
  if (fs.existsSync(cachePath)) {
    console.log('📦 Cache hit!')
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
  }

  // Generate
  const result = await devTeam.execute(request)

  // Save cache
  fs.mkdirSync('.cache', { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(result))

  return result
}
```

### 4. Retry Logic

```typescript
async function executeWithRetry(
  request: DevTeamRequest,
  maxRetries = 3
): Promise<DevTeamResponse> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await devTeam.execute(request)

      // Se teve sucesso (mesmo parcial), retornar
      if (result.stats.failed === 0) {
        return result
      }

      // Retry apenas ficheiros falhados
      const failedAssignments = result.files
        .filter(f => !f.success)
        .map(f => ({
          devRole: f.devRole as any,
          filePath: f.filePath,
          description: 'Retry'
        }))

      if (failedAssignments.length === 0) {
        return result
      }

      console.log(`🔄 Retry ${i + 1}/${maxRetries} (${failedAssignments.length} ficheiros)`)
      // Continue loop
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Tentativa ${i + 1} falhou:`, error)
    }
  }

  throw lastError || new Error('Max retries excedido')
}
```

## 📚 API Reference

### DevTeam

```typescript
class DevTeam {
  // Pipeline completo: assign + generate
  execute(request: DevTeamRequest): Promise<DevTeamResponse>

  // Apenas assignment (parse architecture)
  assignFilesToDevs(architecture: string): FileAssignment[]

  // Apenas geração (com assignments manuais)
  generateAllCode(
    request: DevTeamRequest,
    assignments: FileAssignment[]
  ): Promise<DevTeamResponse>
}
```

### Individual Devs

```typescript
class FrontendDev {
  generateCode(request: FrontendDevRequest): Promise<FrontendDevResponse>
}

class BackendDev {
  generateCode(request: BackendDevRequest): Promise<BackendDevResponse>
}

class DatabaseDev {
  generateCode(request: DatabaseDevRequest): Promise<DatabaseDevResponse>
}

class UtilsDev {
  generateCode(request: UtilsDevRequest): Promise<UtilsDevResponse>
}
```

## 🔧 Configuration

Ver `.env.example` para todas as variáveis de ambiente disponíveis.

Ver `devs/dev-config.ts` para configuração programática.
