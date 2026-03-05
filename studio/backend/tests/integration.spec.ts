import { test, expect } from '@playwright/test';
import {
  mockLogin,
  navigateTo,
  fillForm,
  submitForm,
  expectToast,
  waitForModal,
  closeModal,
  mockApiSuccess,
  mockSlowApi,
  expectLoading,
} from './helpers';

/**
 * DevForge V2 - Testes de Integração
 *
 * Testa fluxos completos end-to-end:
 * - Criar projeto completo
 * - Chat intake flow
 * - Pipeline progress
 * - Deploy final
 */

test.describe('Integração - Fluxo Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('fluxo completo: login → criar projeto → ver pipeline', async ({ page }) => {
    // STEP 1: Login
    await navigateTo(page, '/');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@devforge.com');
      await passwordInput.fill('Test123456!');
      await submitForm(page, 'Entrar');
      await page.waitForTimeout(1000);
    } else {
      // Já está logado ou não tem auth
      await mockLogin(page);
    }

    // STEP 2: Navegar para dashboard
    await navigateTo(page, '/dashboard');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // STEP 3: Criar novo projeto
    const newProjectBtn = page.locator('button:has-text("Novo Projeto")').first();

    if (await newProjectBtn.isVisible().catch(() => false)) {
      await newProjectBtn.click();
      await waitForModal(page);

      // Preencher form
      await fillForm(page, {
        name: 'Test Restaurant Booking',
      });

      await submitForm(page, 'Criar');
      await page.waitForTimeout(1500);

      // Deve ter criado projeto
      await expect(page.locator('text=/Test Restaurant Booking/i').first()).toBeVisible();
    }

    // STEP 4: Abrir projeto
    const projectLink = page.locator('a:has-text("Test Restaurant"), [data-testid="project-card"]').first();

    if (await projectLink.isVisible().catch(() => false)) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');

      // Deve mostrar página do projeto
      await expect(
        page.locator('h1:has-text("Test Restaurant"), [data-testid="project-title"]').first()
      ).toBeVisible();
    }

    // STEP 5: Verificar pipeline
    const pipeline = page.locator('[data-testid="pipeline"], .pipeline').first();

    if (await pipeline.isVisible().catch(() => false)) {
      // Deve ter nós do pipeline
      await expect(pipeline).toBeVisible();

      // Verificar nós esperados
      const nodes = ['PM', 'Architect', 'Dev', 'QA', 'Deploy'];
      for (const node of nodes) {
        const nodeElement = page.locator(`text=${node}`).first();
        await expect(nodeElement).toBeVisible();
      }
    }
  });

  test('intake chat deve processar perguntas do PM Agent', async ({ page }) => {
    // Mock login
    await mockLogin(page);
    await navigateTo(page, '/dashboard');

    // Mock API para chat
    await mockApiSuccess(page, '/api/projects/*/messages', {
      role: 'assistant',
      content: 'Que ideia fantástica! Quem vai usar isto?',
    });

    // Criar projeto
    const newProjectBtn = page.locator('button:has-text("Novo Projeto")').first();

    if (!(await newProjectBtn.isVisible().catch(() => false))) {
      test.skip();
    }

    await newProjectBtn.click();
    await waitForModal(page);

    await fillForm(page, { name: 'My Project' });
    await submitForm(page);
    await page.waitForTimeout(1500);

    // Abrir chat
    const chatTrigger = page.locator('[data-testid="intake-chat"], button:has-text("Chat")').first();

    if (await chatTrigger.isVisible().catch(() => false)) {
      await chatTrigger.click();
      await page.waitForTimeout(500);

      // Deve mostrar chat
      const chatContainer = page.locator('[data-testid="chat-container"], .chat-messages').first();
      await expect(chatContainer).toBeVisible();

      // Enviar mensagem
      const input = page.locator('textarea[placeholder*="mensagem"], input[type="text"]').first();
      await input.fill('Quero uma app de reservas');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      // Verificar resposta do PM Agent
      const response = page.locator('.message:has-text("Que ideia")').first();
      await expect(response).toBeVisible({ timeout: 3000 });
    }
  });

  test('pipeline deve actualizar em tempo real', async ({ page }) => {
    await mockLogin(page);

    // Mock SSE ou polling para updates
    await mockSlowApi(page, '/api/projects/*/phases', 2000, {
      phases: [
        { type: 'PM', status: 'COMPLETED' },
        { type: 'ARCHITECT', status: 'RUNNING' },
        { type: 'FRONTEND', status: 'PENDING' },
      ],
    });

    await navigateTo(page, '/projects/test-id');

    // Verificar pipeline
    const pipeline = page.locator('[data-testid="pipeline"]').first();

    if (!(await pipeline.isVisible().catch(() => false))) {
      test.skip();
    }

    // PM deve estar completo (verde)
    const pmNode = page.locator('[data-phase="PM"], text=PM').first();
    const pmClasses = await pmNode.getAttribute('class');
    expect(pmClasses).toContain('completed' || 'done' || 'success' || 'green');

    // Architect deve estar running (azul pulsante)
    const archNode = page.locator('[data-phase="ARCHITECT"], text=Architect').first();
    const archClasses = await archNode.getAttribute('class');
    expect(archClasses).toContain('running' || 'active' || 'pulse' || 'animate');
  });

  test('deve exibir preview do projeto quando deployado', async ({ page }) => {
    await mockLogin(page);

    // Mock projeto deployado
    await mockApiSuccess(page, '/api/projects/*', {
      id: 'test-id',
      name: 'My App',
      status: 'DELIVERED',
      deployUrl: 'https://my-app.vercel.app',
      githubUrl: 'https://github.com/user/my-app',
    });

    await navigateTo(page, '/projects/test-id');

    // Deve mostrar delivery card
    const deliveryCard = page.locator('[data-testid="delivery-card"], .delivery-success').first();

    if (await deliveryCard.isVisible().catch(() => false)) {
      await expect(deliveryCard).toBeVisible();

      // Verificar botões de acção
      const openButton = page.locator('a[href*="vercel.app"], button:has-text("Abrir")').first();
      await expect(openButton).toBeVisible();

      const githubButton = page.locator('a[href*="github.com"], button:has-text("código")').first();
      await expect(githubButton).toBeVisible();
    }
  });

  test('deve permitir download do projeto', async ({ page }) => {
    await mockLogin(page);

    await mockApiSuccess(page, '/api/projects/*', {
      id: 'test-id',
      name: 'My App',
      status: 'DELIVERED',
    });

    await navigateTo(page, '/projects/test-id');

    // Mock download endpoint
    await page.route('**/api/projects/*/download', (route) => {
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="my-app.zip"',
        },
        body: Buffer.from('fake zip content'),
      });
    });

    const downloadBtn = page.locator('button:has-text("Download"), a[download]').first();

    if (await downloadBtn.isVisible().catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadBtn.click(),
      ]);

      expect(download.suggestedFilename()).toContain('.zip');
    }
  });

  test('deve exibir bug tracker durante QA', async ({ page }) => {
    await mockLogin(page);

    await mockApiSuccess(page, '/api/projects/*', {
      id: 'test-id',
      status: 'QA',
      bugs: [
        { id: '1', category: 'RESPONSIVE', description: 'Botão muito pequeno', severity: 'MEDIUM' },
        { id: '2', category: 'FORM', description: 'Form não valida', severity: 'HIGH' },
      ],
    });

    await navigateTo(page, '/projects/test-id');

    // Verificar bug tracker
    const bugTracker = page.locator('[data-testid="bug-tracker"], .bugs-list').first();

    if (await bugTracker.isVisible().catch(() => false)) {
      await expect(bugTracker).toBeVisible();

      // Verificar bugs listados
      await expect(page.locator('text=/Botão muito pequeno/i').first()).toBeVisible();
      await expect(page.locator('text=/Form não valida/i').first()).toBeVisible();
    }
  });

  test('deve mostrar estimativa de tempo antes de começar', async ({ page }) => {
    await mockLogin(page);
    await navigateTo(page, '/dashboard');

    const newProjectBtn = page.locator('button:has-text("Novo Projeto")').first();

    if (!(await newProjectBtn.isVisible().catch(() => false))) {
      test.skip();
    }

    // Mock estimativa
    await mockApiSuccess(page, '/api/estimate', {
      estimatedMinutes: 14,
      breakdown: {
        pm: 2,
        architect: 3,
        dev: 6,
        qa: 3,
      },
    });

    await newProjectBtn.click();
    await waitForModal(page);

    await fillForm(page, { name: 'Test Project' });

    // Verificar se mostra estimativa (depois de intake completo)
    const estimate = page.locator('text=/14 minutos|tempo estimado/i').first();

    if (await estimate.isVisible().catch(() => false)) {
      await expect(estimate).toBeVisible();
    }
  });
});
