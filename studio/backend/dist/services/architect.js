/**
 * ARCHITECT AGENT — Traduz PRD em Arquitectura Técnica
 *
 * Gera ARCHITECTURE.md completo com:
 * - Stack tech
 * - Schema DB
 * - File structure
 * - REGRAS TÉCNICAS (para prevenir context drift)
 */
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});
const ARCHITECT_SYSTEM_PROMPT = `És o Architect Agent do DevForge — um arquitecto de software sénior com 20 anos de experiência.

A tua missão é traduzir o PRD num plano técnico completo e GERAR REGRAS TÉCNICAS ABSOLUTAS
que serão enforced automaticamente pelo sistema de validação.

STACK PADRÃO (sempre usar a não ser que haja razão forte):
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes + tRPC (type-safe)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js v5 (credentials + OAuth)
- **Payments:** Stripe (se necessário)
- **Storage:** Vercel Blob (se file upload)
- **Deployment:** Vercel (automatic CI/CD)

REGRAS TÉCNICAS QUE DEVES GERAR:

Analisa o PRD e gera 10-20 regras técnicas ESPECÍFICAS para este projecto que DEVEM ser seguidas
para evitar "context drift" entre Claude e Ollama.

Exemplos de categorias de regras:

1. **IDs e Primary Keys:**
   - "Usar UUIDs (cuid) como IDs, NUNCA auto-increment integers"
   - "Campos ID sempre em formato: id String @id @default(cuid())"

2. **Multi-Tenancy (se aplicável):**
   - "TODAS as queries devem filtrar por businessId (multi-tenant obrigatório)"
   - "NUNCA fazer queries sem where: { businessId }"
   - "businessId SEMPRE obrigatório em relações"

3. **Autenticação:**
   - "Passwords SEMPRE com bcrypt (12 rounds minimum)"
   - "TODAS as API routes protegidas devem validar auth ANTES de queries DB"
   - "Session validate: getServerSession() no topo de cada protected route"

4. **Segurança:**
   - "Env vars NUNCA hardcoded, sempre process.env com fallback claro"
   - "Secrets (.env) NUNCA em git (verificar .gitignore)"
   - "SQL injection: SEMPRE usar Prisma parameterized queries"

5. **TypeScript:**
   - "TypeScript strict mode: sem 'any', sem '@ts-ignore'"
   - "Imports: named imports do Prisma (@prisma/client)"
   - "Types: definir em types/ folder, NUNCA inline interfaces"

6. **Validação:**
   - "Formulários: validação client (react-hook-form) + server (zod)"
   - "API inputs: SEMPRE validar com zod schemas antes de DB operations"
   - "Error handling: try-catch em TODAS as async operations"

7. **Database:**
   - "Migrations: NUNCA editar migrations existentes, sempre criar nova"
   - "Relations: SEMPRE definir onDelete/onUpdate behavior"
   - "Indexes: adicionar em campos usados em WHERE/ORDER BY"

8. **Performance:**
   - "Queries: usar select para limitar campos retornados"
   - "Pagination: SEMPRE implementar em listas com 10+ items"
   - "Caching: usar React Server Components cache quando possível"

9. **Code Style:**
   - "Componentes: 1 componente = 1 ficheiro em components/"
   - "API routes: 1 endpoint = 1 ficheiro em app/api/"
   - "Functions: max 50 linhas, extrair helpers se > 50"

10. **Testing:**
    - "NUNCA fazer deploy sem testar auth flow completo"
    - "NUNCA fazer deploy sem verificar env vars em .env.example"

FORMATO DE OUTPUT:

Gera JSON neste formato exacto:

{
  "stack": { ... },
  "databaseSchema": {
    "tables": [
      {
        "name": "User",
        "fields": [
          { "name": "id", "type": "String", "constraints": ["@id", "@default(cuid())"] },
          { "name": "email", "type": "String", "constraints": ["@unique"] },
          { "name": "password", "type": "String", "constraints": [] }
        ],
        "relations": []
      }
    ]
  },
  "fileStructure": {
    "app/": ["page.tsx", "layout.tsx", "globals.css"],
    "app/api/": ["auth/[...nextauth]/route.ts"],
    "components/": ["Navbar.tsx", "Footer.tsx"],
    "lib/": ["prisma.ts", "auth.ts"],
    "prisma/": ["schema.prisma"],
    "types/": ["index.ts"]
  },
  "technicalRules": [
    "Usar UUIDs (cuid) como IDs, NUNCA auto-increment integers",
    "Passwords SEMPRE com bcrypt (12 rounds minimum)",
    "TODAS as API routes protegidas devem validar auth ANTES de queries DB",
    "TypeScript strict: sem 'any', sem '@ts-ignore'",
    "Env vars NUNCA hardcoded, sempre process.env",
    "Formulários: validação client + server side",
    "Migrations: NUNCA editar existentes, sempre criar nova",
    "Relations: SEMPRE definir onDelete/onUpdate behavior",
    "Queries: filtrar por businessId se multi-tenant",
    "NUNCA fazer deploy sem .env.example actualizado"
  ]
}

IMPORTANTE:
- Gera regras ESPECÍFICAS para este projecto (não genéricas)
- Cada regra deve ser ENFORÇÁVEL (clara, verificável automaticamente)
- Prioriza regras que previnem erros comuns entre Claude/Ollama
- Adapta regras conforme features do PRD (auth, payments, multi-tenant, etc.)
- Se multi-tenant, ENFORÇAR businessId em TODAS as queries
- Se auth, ENFORÇAR bcrypt + session validation
- Se payments, ENFORÇAR Stripe webhook validation

NÃO INCLUIR:
- Markdown formatting
- Código completo (só estrutura)
- Comentários longos
- Anything além do JSON`;
export class ArchitectAgent {
    /**
     * Gerar arquitectura completa a partir do PRD
     */
    async generateArchitecture(prd) {
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 16000,
            system: ARCHITECT_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `PRD do projecto:\n\n${JSON.stringify(prd, null, 2)}\n\nGera a arquitectura completa em JSON puro (sem markdown).`
                }
            ]
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const architecture = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        // Validar que technical rules foram geradas
        if (!architecture.technicalRules || architecture.technicalRules.length < 5) {
            throw new Error('Architect Agent falhou ao gerar regras técnicas suficientes');
        }
        // Gerar ARCHITECTURE.md
        architecture.architectureMarkdown = this.generateArchitectureMarkdown(architecture, prd);
        return architecture;
    }
    /**
     * Gerar ARCHITECTURE.md completo
     */
    generateArchitectureMarkdown(arch, prd) {
        return `# ARCHITECTURE.md — ${prd.projectName}

> Gerado automaticamente pelo DevForge Architect Agent
> Data: ${new Date().toISOString()}

## 📋 Visão Geral

**Projecto:** ${prd.projectName}
**Tagline:** ${prd.tagline}
**Complexidade:** ${prd.complexity}
**Tempo Estimado:** ${prd.estimatedMinutes} minutos

${prd.userSummary}

---

## 🛠️ Stack Técnica

- **Frontend:** ${arch.stack.frontend}
- **Backend:** ${arch.stack.backend}
- **Database:** ${arch.stack.database}
- **Auth:** ${arch.stack.auth}
${arch.stack.payments ? `- **Payments:** ${arch.stack.payments}` : ''}
${arch.stack.storage ? `- **Storage:** ${arch.stack.storage}` : ''}
- **Deployment:** ${arch.stack.deployment}

---

## 🗄️ Database Schema

${this.formatDatabaseSchema(arch.databaseSchema)}

---

## 📁 File Structure

\`\`\`
${this.formatFileStructure(arch.fileStructure)}
\`\`\`

---

## ⚠️ REGRAS TÉCNICAS OBRIGATÓRIAS

> Estas regras DEVEM ser seguidas rigorosamente.
> São enforçadas automaticamente pelo QA Engine.

${arch.technicalRules.map((rule, i) => `${i + 1}. **${rule}**`).join('\n')}

---

## 🎯 Features Principais

${prd.features.map((f) => `### ${f.name}\n**Prioridade:** ${f.priority}\n${f.description}\n`).join('\n')}

---

## 🔐 Segurança

${this.getSecuritySection(prd, arch)}

---

## 🚀 Deployment

**Platform:** ${arch.stack.deployment}

**Environment Variables Required:**
${this.getRequiredEnvVars(prd, arch)}

**Deploy Command:**
\`\`\`bash
vercel --prod
\`\`\`

---

## 📝 Notas Técnicas

- Todas as migrations devem ser aplicadas antes de deploy
- Env vars devem estar em .env.example (sem valores reais)
- Testar auth flow completo em staging antes de prod
- Verificar que todos os endpoints têm rate limiting adequado
- Confirmar que logs não expõem dados sensíveis

---

**Gerado por DevForge v2.0**
`;
    }
    /**
     * Formatar database schema para markdown
     */
    formatDatabaseSchema(schema) {
        return schema.tables.map(table => {
            const fields = table.fields.map(f => `  ${f.name.padEnd(20)} ${f.type.padEnd(15)} ${f.constraints.join(' ')}`).join('\n');
            const relations = table.relations.length > 0
                ? '\n\n  Relations:\n' + table.relations.map(r => `  - ${r.field} → ${r.references}${r.onDelete ? ` (onDelete: ${r.onDelete})` : ''}`).join('\n')
                : '';
            return `### ${table.name}\n\`\`\`prisma\n${fields}${relations}\n\`\`\``;
        }).join('\n\n');
    }
    /**
     * Formatar file structure para tree view
     */
    formatFileStructure(structure) {
        const lines = [];
        Object.entries(structure).forEach(([path, files]) => {
            lines.push(path);
            files.forEach(file => {
                lines.push(`  ${file}`);
            });
        });
        return lines.join('\n');
    }
    /**
     * Gerar secção de segurança
     */
    getSecuritySection(prd, arch) {
        const items = [];
        if (prd.technical.hasAuth) {
            items.push('- **Autenticação:** NextAuth.js v5 com session JWT + bcrypt para passwords');
            items.push('- **Session Management:** HTTP-only cookies, 7 dias de validade');
        }
        if (prd.technical.hasPayments) {
            items.push('- **Payments:** Stripe webhook signature validation obrigatória');
            items.push('- **PCI Compliance:** NUNCA guardar dados de cartão, usar Stripe Elements');
        }
        if (prd.technical.hasMultiTenant) {
            items.push('- **Multi-Tenancy:** Row-Level Security via businessId em TODAS as queries');
        }
        items.push('- **CORS:** Restrito ao domínio de produção');
        items.push('- **Rate Limiting:** 100 req/min por IP em API routes');
        items.push('- **SQL Injection:** Prevenido via Prisma parameterized queries');
        items.push('- **XSS:** React escape automático + CSP headers');
        return items.join('\n');
    }
    /**
     * Obter env vars necessárias
     */
    getRequiredEnvVars(prd, arch) {
        const vars = [
            'DATABASE_URL',
            'NEXTAUTH_SECRET',
            'NEXTAUTH_URL'
        ];
        if (prd.technical.hasAuth && prd.technical.authMethod.includes('Google')) {
            vars.push('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET');
        }
        if (prd.technical.hasPayments) {
            vars.push('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET');
        }
        if (prd.technical.hasEmail) {
            vars.push('RESEND_API_KEY');
        }
        if (prd.technical.hasFileUpload) {
            vars.push('BLOB_READ_WRITE_TOKEN');
        }
        return vars.map(v => `- \`${v}\``).join('\n');
    }
    /**
     * Gerar plano técnico para uma Feature específica
     */
    async generateFeaturePlan(feature, acceptanceCriteria, projectArchitecture) {
        const prompt = `És o Architect Agent do DevForge — especialista em planear features técnicas.

**ARQUITECTURA DO PROJECTO:**
${JSON.stringify(projectArchitecture, null, 2)}

**FEATURE:**
- **Título:** ${feature.title}
- **Descrição:** ${feature.description}
- **Tipo:** ${feature.type}
- **Prioridade:** ${feature.priority}

**ACCEPTANCE CRITERIA:**
${acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**TAREFA:**
Gera um plano técnico detalhado para implementar esta feature, incluindo:

1. **Alterações na Base de Dados** (se necessário):
   - Novas tabelas
   - Novos campos em tabelas existentes
   - Novas relações
   - Migrations necessárias

2. **Ficheiros a Criar/Modificar:**
   - Frontend (componentes, páginas, hooks)
   - Backend (API routes, tRPC procedures)
   - Types (TypeScript types/interfaces)
   - Utils (helper functions)

3. **Fluxo de Dados:**
   - User Action → Frontend → API → Database → Response
   - Validações necessárias
   - Error handling

4. **Testes QA:**
   - Playwright tests necessários
   - Validações de UI
   - Validações de API

5. **Regras Técnicas Específicas:**
   - Regras que devem ser seguidas para esta feature
   - Enforcement de segurança
   - Performance considerations

**FORMATO OUTPUT (JSON):**
{
  "databaseChanges": {
    "newTables": [],
    "modifiedTables": [],
    "newRelations": [],
    "migrations": []
  },
  "files": {
    "create": [
      { "path": "app/features/example/page.tsx", "purpose": "Feature page", "priority": "HIGH" }
    ],
    "modify": [
      { "path": "lib/prisma.ts", "changes": "Add new model import", "priority": "MEDIUM" }
    ]
  },
  "dataFlow": [
    "1. User clicks button → triggers handleSubmit",
    "2. Frontend validates with zod → calls API /api/features",
    "3. API validates session → creates DB record",
    "4. Returns success → redirects to /dashboard"
  ],
  "qaTests": [
    { "type": "UI", "description": "Verify button is visible and clickable" },
    { "type": "API", "description": "Test /api/features returns 200 with valid data" }
  ],
  "technicalRules": [
    "MUST validate session before any DB operation",
    "MUST use Prisma transactions for multi-table operations"
  ]
}

Gera JSON puro (sem markdown).`;
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            messages: [{ role: 'user', content: prompt }]
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const plan = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        return plan;
    }
}
