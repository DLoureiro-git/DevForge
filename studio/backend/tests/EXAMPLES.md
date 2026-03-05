# DevForge V2 - Exemplos Práticos de Testes Playwright

Guia prático com exemplos reais de como usar e estender a suite de testes.

---

## 📚 Índice

1. [Executar Testes](#executar-testes)
2. [Criar Novos Testes](#criar-novos-testes)
3. [Usar Helpers](#usar-helpers)
4. [Debug](#debug)
5. [Mock APIs](#mock-apis)
6. [Screenshots](#screenshots)
7. [Testes Visuais](#testes-visuais)

---

## 🚀 Executar Testes

### Todos os testes, todos os viewports
```bash
npm test
```

### UI Mode (recomendado para desenvolvimento)
```bash
npm run test:ui
```

### Apenas um ficheiro
```bash
npx playwright test responsive.spec.ts
```

### Apenas um viewport
```bash
npx playwright test --project=mobile-375
```

### Apenas um teste específico
```bash
npx playwright test -g "não deve ter scroll horizontal"
```

### Debug mode (pausa execução)
```bash
npm run test:debug
```

### Com browser visível
```bash
npm run test:headed
```

### Ver relatório HTML
```bash
npm run test:report
```

---

## ✍️ Criar Novos Testes

### Exemplo 1: Teste Simples

```typescript
import { test, expect } from '@playwright/test';

test.describe('Nova Feature', () => {
  test('deve fazer X', async ({ page }) => {
    // Navegar
    await page.goto('/');

    // Interagir
    await page.locator('button:has-text("Clique")').click();

    // Verificar
    await expect(page.locator('h1')).toContainText('Sucesso');
  });
});
```

### Exemplo 2: Usar Helpers

```typescript
import { test, expect } from '@playwright/test';
import { mockLogin, navigateTo, fillForm, submitForm } from './helpers';

test.describe('Criar Projeto', () => {
  test('deve criar projeto com sucesso', async ({ page }) => {
    // Login
    await mockLogin(page);

    // Navegar
    await navigateTo(page, '/dashboard');

    // Abrir form
    await page.locator('button:has-text("Novo Projeto")').click();

    // Preencher
    await fillForm(page, {
      name: 'My Project',
      description: 'Test description',
    });

    // Submit
    await submitForm(page);

    // Verificar sucesso
    await expect(page.locator('text=/criado com sucesso/i')).toBeVisible();
  });
});
```

### Exemplo 3: Teste com Mock API

```typescript
import { test, expect } from '@playwright/test';
import { mockApiSuccess, mockLogin } from './helpers';

test('deve carregar lista de projectos', async ({ page }) => {
  await mockLogin(page);

  // Mock API
  await mockApiSuccess(page, '/api/projects', {
    projects: [
      { id: '1', name: 'Project A', status: 'DELIVERED' },
      { id: '2', name: 'Project B', status: 'BUILDING' },
    ],
  });

  await page.goto('/dashboard');

  // Verificar que projectos aparecem
  await expect(page.locator('text=Project A')).toBeVisible();
  await expect(page.locator('text=Project B')).toBeVisible();
});
```

### Exemplo 4: Teste Multi-Step

```typescript
import { test, expect } from '@playwright/test';
import { mockLogin, navigateTo, waitForModal, closeModal } from './helpers';

test('fluxo completo de criação de projeto', async ({ page }) => {
  // STEP 1: Login
  await mockLogin(page);

  // STEP 2: Dashboard
  await navigateTo(page, '/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');

  // STEP 3: Abrir modal
  await page.locator('[data-testid="new-project"]').click();
  await waitForModal(page);

  // STEP 4: Preencher
  await page.locator('input[name="name"]').fill('Test Project');
  await page.locator('button[type="submit"]').click();

  // STEP 5: Verificar criado
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Test Project')).toBeVisible();

  // STEP 6: Abrir projeto
  await page.locator('text=Test Project').click();
  await expect(page.url()).toContain('/projects/');
});
```

---

## 🛠️ Usar Helpers

### Autenticação

```typescript
import { mockLogin, logout } from './helpers';

// Login
await mockLogin(page);

// Login com user customizado
await mockLogin(page, {
  id: 'custom-id',
  email: 'custom@email.com',
  name: 'Custom User',
});

// Logout
await logout(page);
```

### Formulários

```typescript
import { fillForm, submitForm, expectFormError } from './helpers';

// Preencher múltiplos campos
await fillForm(page, {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
});

// Submit
await submitForm(page, 'Criar'); // Texto do botão (opcional)

// Verificar erro
await expectFormError(page, 'Email inválido');
```

### UI

```typescript
import { waitForModal, closeModal, expectToast, expectLoading } from './helpers';

// Aguardar modal
await waitForModal(page);

// Fechar modal
await closeModal(page);

// Verificar toast
await expectToast(page, 'Sucesso!');

// Verificar loading
await expectLoading(page, true); // Está loading
await expectLoading(page, false); // Não está loading
```

### Mock API

```typescript
import { mockApiSuccess, mockApiError, mockSlowApi } from './helpers';

// Success
await mockApiSuccess(page, '/api/projects', { data: [...] });

// Error
await mockApiError(page, '/api/projects', 400, 'Bad request');

// Slow (testar loading)
await mockSlowApi(page, '/api/projects', 2000, { data: [...] });
```

### Responsive

```typescript
import { checkHorizontalOverflow, getElementSize } from './helpers';

// Verificar scroll horizontal
const hasOverflow = await checkHorizontalOverflow(page);
expect(hasOverflow).toBe(false);

// Medir elemento
const size = await getElementSize(page, '.my-button');
expect(size.width).toBeGreaterThanOrEqual(44);
expect(size.height).toBeGreaterThanOrEqual(44);
```

### Acessibilidade

```typescript
import { injectAxe, runAxe, formatViolations } from './helpers';

// Injetar axe-core
await injectAxe(page);

// Executar análise
const results = await runAxe(page);

// Verificar violations
const critical = results.violations.filter(v => v.impact === 'critical');
expect(critical, formatViolations(critical)).toHaveLength(0);
```

---

## 🐛 Debug

### Ver browser durante teste

```bash
npm run test:headed
```

### Pausar execução

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/');

  // Pausa aqui (abre DevTools)
  await page.pause();

  await page.locator('button').click();
});
```

### Logs do browser

```typescript
import { logPageConsole } from './helpers';

test('com logs', async ({ page }) => {
  logPageConsole(page); // Printa console.log, errors, etc

  await page.goto('/');
});
```

### Dump HTML

```typescript
import { dumpHTML } from './helpers';

test('debug HTML', async ({ page }) => {
  await page.goto('/');

  // Printa HTML de elemento
  await dumpHTML(page, '.my-component');
});
```

### Trace Viewer

```bash
# Executar com trace
npx playwright test --trace on

# Ver trace
npx playwright show-trace trace.zip
```

---

## 🎨 Screenshots

### Automático (apenas em falhas)

Screenshots são tirados automaticamente quando um teste falha.
Localização: `test-results/<test-name>/<screenshot>.png`

### Manual

```typescript
import { takeScreenshot, screenshotElement } from './helpers';

test('com screenshots', async ({ page }) => {
  await page.goto('/');

  // Screenshot da página toda
  await takeScreenshot(page, 'home-page');

  // Screenshot de elemento específico
  await screenshotElement(page, '.pipeline', 'pipeline-component');
});
```

### Forçar screenshot sempre

```typescript
test('sempre screenshot', async ({ page }) => {
  await page.goto('/');

  await page.screenshot({
    path: 'test-results/screenshots/my-test.png',
    fullPage: true,
  });
});
```

---

## 🎯 Testes Visuais

### Comparação de screenshots (exemplo básico)

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/');

  // Tira screenshot e compara com baseline
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100, // Tolera 100 pixels diferentes
  });
});
```

### Actualizar baselines

```bash
npx playwright test --update-snapshots
```

---

## 💡 Patterns Úteis

### Testar elemento que aparece dinamicamente

```typescript
test('aguardar elemento', async ({ page }) => {
  await page.goto('/');

  await page.locator('button').click();

  // Aguardar aparecer (max 5s)
  await page.waitForSelector('.dynamic-content', {
    state: 'visible',
    timeout: 5000,
  });

  await expect(page.locator('.dynamic-content')).toBeVisible();
});
```

### Testar com diferentes users

```typescript
const users = [
  { email: 'admin@test.com', role: 'admin' },
  { email: 'user@test.com', role: 'user' },
];

for (const user of users) {
  test(`deve funcionar para ${user.role}`, async ({ page }) => {
    await mockLogin(page, user);
    await page.goto('/dashboard');

    // Testar comportamento específico do role
    if (user.role === 'admin') {
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
    }
  });
}
```

### Testar com retry automático

```typescript
test('com retry', async ({ page }) => {
  test.setTimeout(60000); // Timeout 1 min

  await page.goto('/');

  // Retry até 3x se falhar
  await test.step('verificar elemento', async () => {
    await expect(page.locator('.may-fail')).toBeVisible();
  });
});
```

---

## 🚨 Erros Comuns

### Timeout

```typescript
// ❌ Pode dar timeout
await page.locator('button').click();

// ✅ Melhor
await page.locator('button').click({ timeout: 10000 });

// ✅ Ainda melhor
await page.waitForSelector('button', { state: 'visible' });
await page.locator('button').click();
```

### Element não interactable

```typescript
// ❌ Pode estar coberto por outro elemento
await page.locator('button').click();

// ✅ Force click
await page.locator('button').click({ force: true });

// ✅ Ou aguardar estar visível
await page.waitForSelector('button', { state: 'visible' });
await page.locator('button').click();
```

### Múltiplos elementos

```typescript
// ❌ Pode encontrar múltiplos
await page.locator('button').click();

// ✅ Especificar qual
await page.locator('button').first().click();
await page.locator('button:has-text("Submit")').click();
await page.locator('[data-testid="submit-button"]').click();
```

---

## 📖 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

---

**DevForge V2** - Suite de Testes Playwright
Criado por Diogo Loureiro (Prisma88) - 2026-03-05
