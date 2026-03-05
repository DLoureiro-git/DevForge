# DevForge V2 - QA System Commands

Guia rápido de comandos para usar o sistema de QA.

## Instalação

```bash
cd ~/devforge-v2/studio/backend
npm install
npx playwright install chromium
```

## Comandos Básicos

### 1. QA Completo

```bash
npx tsx scripts/run-qa.ts full /caminho/projeto https://app.com "PRD aqui"
```

### 2. Quick Check

```bash
npx tsx scripts/run-qa.ts quick /caminho/projeto https://app.com
```

### 3. Com Auto-Fix

```bash
npx tsx scripts/run-qa.ts full /caminho/projeto https://app.com "PRD" --fix
```

### 4. Browser Visível (Debug)

```bash
npx tsx scripts/run-qa.ts full /caminho/projeto http://localhost:3000 "PRD" --show
```

## Uso Programático

### Quick Start

```typescript
import { executeQA } from './services/qa-executor';

const result = await executeQA({
  prd: 'Sistema com auth e deploy Vercel',
  projectPath: '/caminho/projeto',
  deployUrl: 'https://app.vercel.app',
});

console.log(`Score: ${result.score.percentage}%`);
```

### Quick Check (Apenas Críticos)

```typescript
import { executeQuickQA } from './services/qa-executor';

const result = await executeQuickQA({
  prd: 'Landing page',
  projectPath: '/caminho/projeto',
  deployUrl: 'https://landing.com',
});

if (result.score.blockers.length > 0) {
  console.log('BLOQUEADORES ENCONTRADOS');
}
```

### Com Auto-Fix

```typescript
import { executeQA } from './services/qa-executor';

const result = await executeQA({
  prd: 'Sistema completo',
  projectPath: '/projeto',
  deployUrl: 'https://app.com',
  autoFix: true,
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
});

console.log(`${result.autoFixResults?.filter(r => r.fixed).length} bugs corrigidos`);
```

### Gerar Relatório

```typescript
import { executeQA, generateQAReport } from './services/qa-executor';
import { writeFileSync } from 'fs';

const result = await executeQA({ /* config */ });
const report = generateQAReport(result);

writeFileSync('qa-report.md', report);
```

## Integração PM Agent

### Validar Projeto

```typescript
import { pmValidateProject } from './services/pm-qa-integration';

const result = await pmValidateProject({
  projectId: 'proj_123',
  projectPath: '/projeto',
  deployUrl: 'https://app.com',
  prd: 'Sistema completo',
});
```

### Pre-Deploy Check

```typescript
import { pmPreDeployCheck } from './services/pm-qa-integration';

const canDeploy = await pmPreDeployCheck({
  projectId: 'proj_123',
  projectPath: '/projeto',
  deployUrl: 'https://app.com',
  prd: 'Sistema',
});

if (!canDeploy) {
  console.log('Deploy bloqueado');
}
```

### Workflow Completo

```typescript
import { pmFullWorkflow } from './services/pm-qa-integration';

const result = await pmFullWorkflow({
  projectId: 'proj_123',
  projectPath: '/projeto',
  deployUrl: 'https://app.com',
  prd: 'Sistema',
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
});

console.log(`Success: ${result.success}`);
console.log(`Final Score: ${result.finalScore}%`);
```

## Validadores Individuais

### Deploy Validator

```typescript
import { validateDeploy } from './services/validators';
import { initBrowser } from './services/qa-engine';

const browser = await initBrowser();

const result = await validateDeploy(
  browser,
  '/projeto',
  'https://app.com'
);

console.log(`Passou: ${result.passed}`);
console.log(`Bugs: ${result.bugs.length}`);

await browser.close();
```

### Auth Validator

```typescript
import { validateRouteProtection } from './services/validators';
import { initBrowser } from './services/qa-engine';

const browser = await initBrowser();

const result = await validateRouteProtection(
  browser,
  '/projeto',
  'https://app.com'
);

await browser.close();
```

## CI/CD

### GitHub Actions

```yaml
name: QA Check
on: [pull_request]

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
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx tsx scripts/run-qa.ts full . ${{ secrets.DEPLOY_URL }} "${{ secrets.PRD }}"
```

### Vercel Build

```json
{
  "buildCommand": "npm run build && npx tsx scripts/run-qa.ts quick ."
}
```

### Railway Deploy Hook

```bash
# railway.json
{
  "build": {
    "buildCommand": "npm run build"
  },
  "deploy": {
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  },
  "hooks": {
    "postDeploy": "npx tsx scripts/run-qa.ts quick . $RAILWAY_PUBLIC_DOMAIN"
  }
}
```

## Variáveis de Ambiente

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxx
OLLAMA_ENDPOINT=http://localhost:11434
```

## Exemplos Práticos

### 1. E-commerce

```typescript
const result = await executeQA({
  prd: `
    E-commerce com:
    - Autenticação
    - Carrinho
    - Checkout Stripe
    - Dashboard admin
  `,
  projectPath: '/ecommerce',
  deployUrl: 'https://shop.com',
  autoFix: true,
});
```

### 2. SaaS

```typescript
const result = await executeQA({
  prd: `
    SaaS B2B:
    - Auth (SSO)
    - Dashboard analítico
    - API REST
    - Realtime
    - Deploy Vercel
  `,
  projectPath: '/saas',
  deployUrl: 'https://app.com',
});
```

### 3. Landing Page

```typescript
const result = await executeQuickQA({
  prd: 'Landing page com hero, features, CTA',
  projectPath: '/landing',
  deployUrl: 'https://landing.com',
});
```

## Debug

### Ver Browser em Ação

```typescript
const result = await executeQA({
  prd: 'Sistema',
  projectPath: '/projeto',
  deployUrl: 'http://localhost:3000',
  headless: false, // mostrar browser
});
```

### Logs Detalhados

```bash
DEBUG=* npx tsx scripts/run-qa.ts full /projeto
```

### Testar Validador Individual

```typescript
import { validateFormValidation } from './services/validators';
import { initBrowser } from './services/qa-engine';

const browser = await initBrowser(false); // mostrar browser

const result = await validateFormValidation(
  browser,
  '/projeto',
  'http://localhost:3000'
);

console.log(JSON.stringify(result, null, 2));

await browser.close();
```

## Troubleshooting

### Playwright não instala

```bash
npx playwright install-deps
npx playwright install chromium
```

### Ollama não responde

```bash
ollama serve
ollama pull qwen2.5-coder:14b
curl http://localhost:11434/api/tags
```

### Claude API erro

```bash
echo $ANTHROPIC_API_KEY
# Verificar em: https://console.anthropic.com/
```

### Timeout em checks

Aumentar timeout no validador:

```typescript
await page.goto(url, { timeout: 60000 }); // 60s
```

## Performance

### Executar em Paralelo

```typescript
import { executeQuickQA } from './services/qa-executor';

const projects = ['/proj1', '/proj2', '/proj3'];

const results = await Promise.all(
  projects.map(path => executeQuickQA({
    prd: 'Sistema',
    projectPath: path,
  }))
);
```

### Cache de Resultados

```typescript
const cache = new Map();

function getCachedQA(projectPath: string) {
  if (cache.has(projectPath)) {
    return cache.get(projectPath);
  }

  const result = await executeQA({ projectPath, /* ... */ });
  cache.set(projectPath, result);

  return result;
}
```

## Customização

### Adicionar Novo Check

1. Criar validador:

```typescript
// validators/my-validator.ts
export async function validateMyFeature(browser, projectPath, deployUrl) {
  // implementação
  return { passed: true, bugs: [], /* ... */ };
}
```

2. Adicionar a `qa-engine.ts`:

```typescript
export const MY_CHECKS: QACheck[] = [{
  id: 'my-001',
  category: 'custom',
  priority: 'high',
  description: 'Validar X',
  validator: 'validateMyFeature',
  automatable: true,
  estimatedTime: 2,
}];
```

3. Incluir em checklist:

```typescript
// qa-engine.ts
if (prdContainsKeyword('minha-feature')) {
  checklist.push(...MY_CHECKS);
}
```

## Recursos

- Documentação: `README.md`
- Exemplos: `qa-example.ts`
- Testes: `qa-engine.test.ts`
- Playwright Docs: https://playwright.dev
- Claude API: https://docs.anthropic.com
