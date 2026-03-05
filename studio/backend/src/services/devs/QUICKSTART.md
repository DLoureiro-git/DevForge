# Dev Team — Quick Start Guide

## 🚀 Setup Rápido

### 1. Instalar Ollama e Modelo

```bash
# Instalar Ollama (se não tiver)
curl -fsSL https://ollama.com/install.sh | sh

# Pull do modelo Qwen 2.5 Coder 32B
ollama pull qwen2.5-coder:32b
```

### 2. Configurar Environment Variables

```bash
# Editar .env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_DEV_MODEL="qwen2.5-coder:32b"
OLLAMA_DEV_VERBOSE="true"  # Para ver logs detalhados
```

### 3. Iniciar Ollama

```bash
ollama serve
```

## 📝 Uso Básico

### Exemplo 1: Gerar código para uma architecture

```typescript
import { devTeam } from '@/services/dev-team'

const architectureMarkdown = `
# Architecture

## Files

- src/app/api/users/route.ts
- src/app/(app)/users/page.tsx
- prisma/schema.prisma
`

const result = await devTeam.execute({
  architecture: architectureMarkdown,
  technicalRules: [
    'Usar UUIDs (cuid) como IDs',
    'TypeScript strict mode',
    'Validar inputs com Zod'
  ]
})

console.log(`Gerados ${result.stats.successful} ficheiros`)

// Gravar ficheiros
result.files.forEach(file => {
  if (file.success && file.code) {
    fs.writeFileSync(file.filePath, file.code)
  }
})
```

### Exemplo 2: Usar devs individuais

```typescript
import { FrontendDev } from '@/services/devs'

const frontendDev = new FrontendDev()

const result = await frontendDev.generateCode({
  architecture: architectureMarkdown,
  filePath: 'src/app/dashboard/page.tsx',
  fileDescription: 'Dashboard com stats e gráficos',
  technicalRules: ['Mobile-first', 'Dark mode support']
})

if (result.success) {
  console.log(result.code)
}
```

### Exemplo 3: Pipeline completo (Architect + DevTeam)

```typescript
import { ArchitectAgent } from '@/services/architect'
import { devTeam } from '@/services/dev-team'

// 1. Gerar architecture
const architect = new ArchitectAgent()
const architecture = await architect.generateArchitecture(prd)

// 2. Gerar código
const codeResult = await devTeam.execute({
  architecture: architecture.architectureMarkdown,
  technicalRules: architecture.technicalRules
})

// 3. Gravar ficheiros
codeResult.files.forEach(file => {
  if (file.success && file.code) {
    const fullPath = path.join(projectDir, file.filePath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, file.code)
  }
})

console.log(`✅ Projecto criado em ${projectDir}`)
```

## 🔧 Troubleshooting

### Erro: "Ollama not available"

```bash
# Verificar se Ollama está a correr
curl http://localhost:11434/api/tags

# Iniciar Ollama
ollama serve
```

### Erro: "Model not found"

```bash
# Listar modelos instalados
ollama list

# Instalar modelo
ollama pull qwen2.5-coder:32b
```

### Timeout errors

Aumentar timeout em `.env`:

```bash
OLLAMA_DEV_TIMEOUT="600000"  # 10 minutos
```

### Código com qualidade baixa

Ajustar temperature (mais baixo = mais determinístico):

```bash
OLLAMA_DEV_TEMPERATURE="0.1"  # Padrão: 0.2
```

## 📊 Performance

### Tempos esperados (Qwen 2.5 Coder 32B)

- **Frontend page:** ~15-30s
- **Backend API route:** ~20-35s
- **Prisma schema:** ~10-20s
- **Context/Hook:** ~10-15s

### Paralelização

O DevTeam executa **4 devs em paralelo** usando `Promise.all()`:

- 4 ficheiros = ~30s (vs ~120s sequencial)
- 10 ficheiros = ~60s (vs ~300s sequencial)

**Speedup: ~4x**

## 🎯 Boas Práticas

### 1. Technical Rules específicas

❌ **Mau:**
```typescript
technicalRules: ['Código limpo', 'Seguir boas práticas']
```

✅ **Bom:**
```typescript
technicalRules: [
  'Usar cuid() para IDs (NUNCA auto-increment)',
  'TODAS as queries filtrar por businessId',
  'Passwords com bcrypt (12 rounds)',
  'API routes: validar auth ANTES de DB queries'
]
```

### 2. Architecture clara

❌ **Mau:**
```
Criar um sistema de users
```

✅ **Bom:**
```
# Architecture

## Stack
- Frontend: Next.js 15 + Tailwind
- Backend: Next.js API Routes
- Database: PostgreSQL via Prisma

## Files

### API Routes
- src/app/api/users/route.ts # CRUD users
- src/app/api/users/[id]/route.ts # Get/Update/Delete user

### Pages
- src/app/(app)/users/page.tsx # Lista users
- src/app/(app)/users/[id]/page.tsx # Detalhes user

### Schema
- prisma/schema.prisma # User model
```

### 3. Validar output

Sempre verificar código gerado antes de deploy:

```typescript
const result = await devTeam.execute({ ... })

// Verificar erros
const failed = result.files.filter(f => !f.success)
if (failed.length > 0) {
  console.error('Falhas:', failed)
  return
}

// Verificar qualidade (exemplo: linhas de código)
result.files.forEach(file => {
  if (file.code) {
    const lines = file.code.split('\n').length
    if (lines < 10) {
      console.warn(`${file.filePath} muito curto (${lines} linhas)`)
    }
  }
})
```

## 📚 Próximos Passos

1. **QA Validation:** Integrar com `qa-engine.ts` para validar código gerado
2. **Auto-fix:** Usar `bug-fix-loop.ts` para corrigir erros automaticamente
3. **Deploy:** Pipeline completo até deploy em Vercel/Railway

Ver `examples/dev-team-example.ts` para exemplo completo.
