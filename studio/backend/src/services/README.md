# DevForge V2 - Sistema de QA Inteligente

Sistema completo de Quality Assurance com checklists adaptativas, validação automatizada e auto-fix com escalonamento de modelos.

## Características

### 1. Checklists Adaptativas
- Analisa o PRD do projeto
- Gera checklist personalizada baseada nas funcionalidades
- Adiciona checks condicionais (auth, payments, realtime, etc.)
- Estima tempo de execução

### 2. Validação Automatizada
- **7 categorias** de validação:
  - Deploy & Infraestrutura
  - Responsive & Mobile
  - Database & Persistência
  - Autenticação & Autorização
  - Formulários
  - Botões & Interatividade
  - Qualidade de Código

- **50+ validadores** prontos para produção
- Execução via Playwright (browser automation)
- Screenshots automáticos de bugs visuais
- Stack traces capturados

### 3. QA Score Inteligente
- Sistema de pontuação baseado em severidade
- **Pesos:**
  - CRITICAL: -25 pontos
  - HIGH: -10 pontos
  - MEDIUM: -3 pontos
  - LOW: -1 ponto

- Score de 0-100
- Identificação automática de blockers

### 4. Auto-Fix com Escalonamento
- **Iterações 1-3:** Ollama (local, grátis, rápido)
- **Iterações 4-6:** Claude Haiku (rápido, barato)
- **Iterações 7-10:** Claude Sonnet (poderoso, caro)

- Re-run inteligente (apenas checks relevantes)
- Revert automático se introduzir bugs críticos
- Batch fix com priorização por severidade

## Instalação

```bash
cd ~/devforge-v2/studio/backend
npm install
```

Dependências já instaladas:
- `playwright` - Browser automation
- `@playwright/test` - Testing utilities
- `@anthropic-ai/sdk` - Claude API

## Uso Básico

### Quick Start

```typescript
import { executeQA } from './services/qa-executor';

const result = await executeQA({
  prd: `
    # PRD - Meu App
    - Autenticação
    - Dashboard responsivo
    - Deploy: Vercel
  `,
  projectPath: '/caminho/para/projeto',
  deployUrl: 'https://meu-app.vercel.app',
  headless: true,
  autoFix: false,
});

console.log(`Score: ${result.score.percentage}%`);
console.log(`Bugs: ${result.allBugs.length}`);
```

### Quick QA (Apenas Checks Críticos)

```typescript
import { executeQuickQA } from './services/qa-executor';

const result = await executeQuickQA({
  prd: 'PRD aqui...',
  projectPath: '/projeto',
  deployUrl: 'https://app.com',
});
```

### QA Completo com Auto-Fix

```typescript
const result = await executeQA({
  prd: 'PRD...',
  projectPath: '/projeto',
  deployUrl: 'https://app.com',
  autoFix: true,
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  ollamaEndpoint: 'http://localhost:11434',
});
```

### Gerar Relatório

```typescript
import { generateQAReport } from './services/qa-executor';

const report = generateQAReport(result);
writeFileSync('qa-report.md', report);
```

## Estrutura

```
services/
├── qa-engine.ts              # Motor principal, checklists, score
├── qa-executor.ts            # Orquestrador de execução
├── bug-fix-loop.ts           # Loop de fix com escalonamento
├── qa-example.ts             # Exemplos de uso
├── validators/
│   ├── index.ts              # Export de todos os validadores
│   ├── deploy-validators.ts  # A1-A4: Deploy, env, build, fullstack
│   ├── responsive-validators.ts # B1-B4: Overflow, touch, breakpoints
│   ├── db-validators.ts      # C1-C3: Persistência, concurrency, migrations
│   ├── auth-validators.ts    # D1-D4: Routes, passwords, session, logout
│   ├── form-validators.ts    # E1-E3: Validação, erros, loading
│   ├── button-validators.ts  # F1-F3: Botões, loading, disabled
│   └── code-validators.ts    # G1-G4: Imports, TS, secrets, console.log
└── README.md                 # Esta documentação
```

## Categorias de Validação

### A. Deploy & Infraestrutura
- ✅ Deploy produção funciona
- ✅ Variáveis de ambiente configuradas
- ✅ Build sem erros
- ✅ Full-stack integrado (Frontend + Backend + DB)

### B. Responsive & Mobile
- ✅ Sem overflow horizontal
- ✅ Touch targets ≥44x44px
- ✅ Breakpoints funcionam (375, 768, 1024, 1440)
- ✅ Texto legível (≥14px mobile)

### C. Database & Persistência
- ✅ Persistência funciona
- ✅ Writes concorrentes não criam duplicados
- ✅ Migrations aplicadas

### D. Autenticação & Autorização
- ✅ Rotas protegidas redirecionam
- ✅ Passwords com requisitos mínimos
- ✅ Session expira corretamente
- ✅ Logout limpa session/cookies

### E. Formulários
- ✅ Validação client + server
- ✅ Erros de servidor exibidos
- ✅ Loading states durante submissão

### F. Botões & Interatividade
- ✅ Todos os botões funcionam
- ✅ Loading states em botões async
- ✅ Disabled state funciona

### G. Qualidade de Código
- ✅ Sem imports quebrados
- ✅ TypeScript strict sem erros
- ✅ Sem segredos hardcoded
- ✅ Sem console.log em produção

## Checks Condicionais

O sistema adiciona checks automaticamente baseado no PRD:

### Auth
Keywords: `autenticação`, `login`, `signup`, `auth`, `sessão`

### Payments
Keywords: `pagamento`, `stripe`, `paypal`, `checkout`, `compra`

### Realtime
Keywords: `realtime`, `websocket`, `tempo real`, `live`

### File Upload
Keywords: `upload`, `ficheiro`, `imagem`, `storage`

### Email
Keywords: `email`, `notificação`, `resend`, `sendgrid`

## Auto-Fix

### Escalonamento de Modelos

```
Iteração 1-3:  Ollama (qwen2.5-coder:14b)  → Local, grátis
Iteração 4-6:  Claude Haiku                → Rápido, $0.25/MTok
Iteração 7-10: Claude Sonnet               → Poderoso, $3/MTok
```

### Re-Run Inteligente

Após aplicar fix, executa apenas checks relevantes:

```typescript
// Exemplo: se alterou ficheiros auth, executa apenas auth checks
filesChanged: ['src/middleware.ts', 'src/app/api/auth/route.ts']
→ Re-run: auth-001, auth-002, auth-003, auth-004
```

### Proteções

- Reverte automaticamente se introduzir bugs CRITICAL
- Máximo 10 iterações por bug
- Abandona se não conseguir corrigir

## CLI

### Executar via CLI

```bash
# QA completo
npx tsx src/services/qa-example.ts full

# Quick check (apenas críticos)
npx tsx src/services/qa-example.ts quick

# Apenas reportar (sem fix)
npx tsx src/services/qa-example.ts report

# Debug (browser visível)
npx tsx src/services/qa-example.ts debug

# CI/CD mode
npx tsx src/services/qa-example.ts ci

# Progressivo (por categoria)
npx tsx src/services/qa-example.ts progressive
```

## Integração CI/CD

### GitHub Actions

```yaml
name: QA Check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install chromium
      - name: Run QA
        env:
          PRD: ${{ secrets.PRD }}
          DEPLOY_URL: ${{ secrets.DEPLOY_URL }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npx tsx src/services/qa-example.ts ci
```

### Vercel Deploy Hook

```typescript
// vercel.json
{
  "buildCommand": "npm run build && npx tsx src/services/qa-example.ts quick"
}
```

## Performance

### Tempos Médios

- Quick QA (10 checks críticos): ~30s
- Full QA (30-50 checks): 3-8 min
- Auto-Fix (por bug): 1-5 min

### Otimizações

- Checks paralelos quando possível
- Browser reutilizado entre checks
- Validadores cacheiam resultados de análise estática
- Re-run inteligente após fixes

## Extensibilidade

### Adicionar Novo Validador

1. Criar ficheiro em `validators/`:

```typescript
// validators/my-validator.ts
export async function validateMyFeature(
  browser: Browser,
  projectPath: string,
  deployUrl?: string
): Promise<ValidationResult> {
  // implementação
}
```

2. Exportar em `validators/index.ts`

3. Adicionar check em `qa-engine.ts`:

```typescript
export const MY_CHECKS: QACheck[] = [
  {
    id: 'my-001',
    category: 'custom',
    priority: 'high',
    description: 'Minha validação',
    validator: 'validateMyFeature',
    automatable: true,
    estimatedTime: 2,
    prdTriggers: ['keyword1', 'keyword2'],
  },
];
```

4. Adicionar a checklist condicional em `generateAdaptiveChecklist()`

## Troubleshooting

### Playwright não funciona

```bash
npx playwright install chromium
```

### Ollama não responde

```bash
ollama serve
ollama pull qwen2.5-coder:14b
```

### Claude API erro

Verificar:
- `ANTHROPIC_API_KEY` configurada
- Créditos disponíveis na conta Anthropic

### Timeout em validações

Aumentar timeout:

```typescript
const response = await page.goto(url, { timeout: 60000 });
```

## Roadmap

- [ ] Validadores de performance (Lighthouse)
- [ ] Validadores de acessibilidade (WCAG)
- [ ] Integração com Sentry/analytics
- [ ] Dashboard web para visualizar resultados
- [ ] Suporte para testes E2E customizados
- [ ] Export de relatórios em PDF
- [ ] Integração com Jira/Linear

## Contribuir

1. Fork do repo
2. Criar branch (`git checkout -b feature/nova-validacao`)
3. Commit (`git commit -m 'Add: nova validação X'`)
4. Push (`git push origin feature/nova-validacao`)
5. Pull Request

## Licença

MIT

## Autor

DevForge V2 Team

## Suporte

Issues: GitHub Issues
Docs: Este README
