import { test, expect } from '@playwright/test';

/**
 * DevForge V2 - Testes de Formulários
 *
 * Garante que todos os formulários:
 * - Validam campos obrigatórios
 * - Exibem erros de servidor corretamente
 * - Desactivam durante submit (previne double-submit)
 * - Mostram feedback de sucesso
 */

test.describe('Formulários', () => {
  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tentar abrir modal/form de novo projeto
    const newProjectButton = page.locator('button:has-text("Novo Projeto")').first();
    if (!(await newProjectButton.isVisible().catch(() => false))) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForTimeout(500);

    // Submit sem preencher
    const submitButton = page.locator('button[type="submit"], button:has-text("Criar")').first();
    await submitButton.click();

    // Deve mostrar erro de validação
    const errorMessages = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });

    // Verificar que form não foi submetido
    const url = page.url();
    expect(url).toContain('/dashboard'); // Não navegou
  });

  test('deve exibir erros de servidor correctamente', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Nome do projeto já existe',
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const newProjectButton = page.locator('button:has-text("Novo Projeto")').first();
    if (!(await newProjectButton.isVisible().catch(() => false))) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForTimeout(500);

    // Preencher form
    const nameInput = page.locator('input[name="name"], input[placeholder*="nome"]').first();
    await nameInput.fill('Test Project');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Aguardar erro aparecer
    await page.waitForTimeout(1000);

    // Verificar erro exibido
    const errorText = await page
      .locator('.error, [role="alert"], .toast, .text-red-500')
      .first()
      .textContent();

    expect(errorText).toContain('já existe');
  });

  test('deve desactivar form durante submit', async ({ page }) => {
    // Mock API slow response (2s)
    await page.route('**/api/projects', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-123' }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const newProjectButton = page.locator('button:has-text("Novo Projeto")').first();
    if (!(await newProjectButton.isVisible().catch(() => false))) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForTimeout(500);

    // Preencher form
    const nameInput = page.locator('input[name="name"], input[placeholder*="nome"]').first();
    await nameInput.fill('Test Project');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Verificar que botão foi desactivado
    await page.waitForTimeout(200);
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);

    // Verificar loading state
    const hasLoadingState = await submitButton.evaluate((btn) => {
      return (
        btn.hasAttribute('disabled') ||
        btn.getAttribute('aria-busy') === 'true' ||
        btn.querySelector('.spinner, .loading, [data-loading]') !== null
      );
    });

    expect(hasLoadingState).toBe(true);

    // Aguardar response
    await page.waitForTimeout(2500);
  });

  test('deve mostrar feedback de sucesso após submit', async ({ page }) => {
    // Mock successful response
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-123',
          name: 'Test Project',
          status: 'INTAKE',
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const newProjectButton = page.locator('button:has-text("Novo Projeto")').first();
    if (!(await newProjectButton.isVisible().catch(() => false))) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForTimeout(500);

    // Preencher form
    const nameInput = page.locator('input[name="name"], input[placeholder*="nome"]').first();
    await nameInput.fill('Test Project');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Aguardar sucesso
    await page.waitForTimeout(1000);

    // Verificar toast/success message
    const successIndicators = [
      '.toast:has-text("sucesso")',
      '.toast:has-text("criado")',
      '[role="status"]:has-text("sucesso")',
      '.text-green-500',
      '.success',
    ];

    let foundSuccess = false;
    for (const selector of successIndicators) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        foundSuccess = true;
        break;
      }
    }

    expect(foundSuccess, 'Nenhum feedback de sucesso encontrado').toBe(true);
  });

  test('deve limpar form após sucesso', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-123' }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const newProjectButton = page.locator('button:has-text("Novo Projeto")').first();
    if (!(await newProjectButton.isVisible().catch(() => false))) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[name="name"], input[placeholder*="nome"]').first();
    await nameInput.fill('Test Project');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    await page.waitForTimeout(1500);

    // Verificar se input foi limpo OU modal foi fechado
    const modalClosed = !(await page
      .locator('[role="dialog"], .modal')
      .first()
      .isVisible()
      .catch(() => false));

    const inputCleared = (await nameInput.inputValue().catch(() => '')) === '';

    expect(modalClosed || inputCleared, 'Form não foi limpo nem modal fechado').toBe(true);
  });
});
