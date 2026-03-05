# Dev Team Agents — DevForge V2

Sistema de 4 developers especializados que geram código em paralelo usando Ollama Qwen 2.5 Coder 32B.

## 📁 Estrutura

```
devs/
├── frontend-dev.ts     # Especialista em React/Next.js/Tailwind
├── backend-dev.ts      # Especialista em API Routes/Prisma
├── database-dev.ts     # Especialista em Prisma Schema
├── utils-dev.ts        # Especialista em Contexts/Hooks/Utils
└── index.ts            # Exports centrais
```

## 🧑‍💻 Developers

### Frontend Dev
**Responsabilidades:**
- Pages (page.tsx)
- Componentes React
- UI/UX com Tailwind CSS
- Hooks personalizados
- Estado e side effects

**Regras técnicas:**
- TypeScript strict
- 'use client' quando necessário
- Props tipadas com interfaces
- Acessibilidade (a11y)
- Mobile-first responsive

### Backend Dev
**Responsabilidades:**
- API Routes (route.ts)
- Queries Prisma otimizadas
- Validações de input (Zod)
- Error handling
- Multi-tenant security

**Regras técnicas:**
- Validar TODOS os inputs
- NextResponse com status codes corretos
- try/catch em async operations
- Importar { prisma } from '@/lib/prisma'
- NUNCA retornar dados de outro business (multi-tenant)

### Database Dev
**Responsabilidades:**
- Prisma schema models
- Migrations
- Indexes para performance
- Relações entre models

**Regras técnicas:**
- @id, @default, @relation corretos
- @@index em campos filtrados
- createdAt/updatedAt em todos os models
- Cascade deletes apropriados
- Usar cuid() para IDs

### Utils Dev
**Responsabilidades:**
- Contexts React
- Hooks personalizados
- Utility functions
- Types/Interfaces compartilhadas

**Regras técnicas:**
- Hooks seguem convenções React (use*)
- Contexts com Provider/Consumer
- Utils puros (sem side effects)
- Documentação clara

## 🚀 Uso

### Uso básico

```typescript
import { DevTeam } from '@/services/dev-team'

const devTeam = new DevTeam()

// Executar pipeline completo
const result = await devTeam.execute({
  architecture: architectureMarkdown,
  technicalRules: ['Usar UUIDs', 'Validar inputs', ...]
})

console.log(`Gerados ${result.stats.successful} ficheiros`)
```

### Uso avançado (manual)

```typescript
import { DevTeam } from '@/services/dev-team'

const devTeam = new DevTeam()

// 1. Atribuir ficheiros manualmente
const assignments = [
  {
    devRole: 'frontend',
    filePath: 'src/app/page.tsx',
    description: 'Homepage'
  },
  {
    devRole: 'backend',
    filePath: 'src/app/api/users/route.ts',
    description: 'Users API'
  }
]

// 2. Gerar código
const result = await devTeam.generateAllCode(
  {
    architecture: architectureMarkdown,
    technicalRules: [...]
  },
  assignments
)

// 3. Processar resultados
result.files.forEach(file => {
  if (file.success && file.code) {
    console.log(`✅ ${file.filePath} (${file.code.split('\n').length} linhas)`)
    // Gravar ficheiro, etc.
  }
})
```

### Uso individual (1 dev)

```typescript
import { FrontendDev, BackendDev } from '@/services/devs'

// Frontend
const frontendDev = new FrontendDev()
const pageResult = await frontendDev.generateCode({
  architecture: architectureMarkdown,
  filePath: 'src/app/dashboard/page.tsx',
  fileDescription: 'Dashboard page',
  technicalRules: [...]
})

// Backend
const backendDev = new BackendDev()
const apiResult = await backendDev.generateCode({
  architecture: architectureMarkdown,
  filePath: 'src/app/api/users/route.ts',
  fileDescription: 'Users CRUD API',
  technicalRules: [...]
})
```

## 📊 Response Structure

```typescript
interface DevTeamResponse {
  success: boolean                // true se nenhum erro
  files: GeneratedFile[]          // Array de ficheiros gerados
  totalDuration: number           // Tempo total (ms)
  stats: {
    total: number                 // Total ficheiros
    successful: number            // Sucessos
    failed: number                // Falhas
    noChanges: number             // Sem mudanças necessárias
  }
}

interface GeneratedFile {
  success: boolean
  devRole: string                 // 'frontend' | 'backend' | 'database' | 'utils'
  filePath: string
  code?: string                   // Código gerado (se success)
  duration: number                // Tempo geração (ms)
  error?: string                  // Mensagem erro (se !success)
  noChanges?: boolean             // true se NO_CHANGES
}
```

## 🔧 Configuração

### Model Ollama

Por defeito usa `qwen2.5-coder:32b`. Para mudar:

```typescript
import { FrontendDev } from '@/services/devs'

const dev = new FrontendDev('qwen2.5-coder:14b')  // Modelo alternativo
```

### Timeout

Timeout configurado em `lib/ollama.ts` (300s para generation).

### Temperature

Configurado em 0.2 para código mais consistente (menos criativo, mais determinístico).

## 🧪 Testes

```bash
npm test dev-team
```

Ver `__tests__/dev-team.test.ts` para exemplos de testes unitários.

## 📝 Notas Técnicas

### Paralelização

- Os 4 devs executam **em paralelo** usando `Promise.all()`
- Speedup ~4x vs sequencial
- Cada dev usa timeout independente (300s)

### Markdown Removal

- Ollama às vezes retorna código dentro de \`\`\`typescript ... \`\`\`
- Função `removeMarkdownCodeBlocks()` limpa automaticamente

### Assignment Logic

O `assignFilesToDevs()` detecta automaticamente:
- `route.ts` → Backend Dev
- `page.tsx` → Frontend Dev
- `schema.prisma` → Database Dev
- `Context.tsx` ou `use*.ts` → Utils Dev

### NO_CHANGES Response

Database Dev e Utils Dev podem retornar `NO_CHANGES` se não houver alterações necessárias ao schema/utils existentes.

## 🔗 Integração com Architect

O Dev Team é normalmente chamado **após** o Architect Agent:

```typescript
import { ArchitectAgent } from '@/services/architect'
import { DevTeam } from '@/services/dev-team'

// 1. Architect gera architecture
const architect = new ArchitectAgent()
const architecture = await architect.generateArchitecture(prd)

// 2. Dev Team gera código
const devTeam = new DevTeam()
const result = await devTeam.execute({
  architecture: architecture.architectureMarkdown,
  technicalRules: architecture.technicalRules
})

// 3. QA valida código gerado
// ...
```

## 📚 Referências

- **Architect Agent:** `services/architect.ts`
- **Ollama Client:** `lib/ollama.ts`
- **QA Engine:** `services/qa-engine.ts`
- **Exemplo completo:** `examples/dev-team-example.ts`
