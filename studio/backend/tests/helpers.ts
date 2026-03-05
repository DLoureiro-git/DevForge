import { Page, expect } from '@playwright/test';
import type { AxeResults } from 'axe-core';

/**
 * DevForge V2 - Test Helpers
 *
 * Funções reutilizáveis para testes Playwright
 */

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Simula login injetando token no localStorage
 */
export async function mockLogin(page: Page, userData?: any) {
  await page.goto('/');

  await page.evaluate((user) => {
    localStorage.setItem('token', 'fake-jwt-token-' + Date.now());
    localStorage.setItem(
      'user',
      JSON.stringify(
        user || {
          id: '123',
          email: 'test@devforge.com',
          name: 'Test User',
        }
      )
    );
  }, userData);
}

/**
 * Faz logout limpando storage
 */
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

// ============================================
// NAVIGATION HELPERS
// ============================================

/**
 * Navega e aguarda load completo
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300); // Animations
}

/**
 * Verifica se está na página esperada
 */
export async function expectPageToBe(page: Page, expectedPath: string) {
  const currentUrl = page.url();
  expect(currentUrl).toContain(expectedPath);
}

// ============================================
// FORM HELPERS
// ============================================

/**
 * Preenche formulário com dados
 */
export async function fillForm(page: Page, data: Record<string, string>) {
  for (const [name, value] of Object.entries(data)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
    await input.fill(value);
  }
}

/**
 * Submete formulário e aguarda resposta
 */
export async function submitForm(page: Page, buttonText?: string) {
  const button = buttonText
    ? page.locator(`button:has-text("${buttonText}")`).first()
    : page.locator('button[type="submit"]').first();

  await button.click();
  await page.waitForTimeout(500);
}

/**
 * Verifica se form tem erro
 */
export async function expectFormError(page: Page, errorText?: string) {
  const errorElement = page.locator('.error, [role="alert"], .text-red-500').first();
  await expect(errorElement).toBeVisible();

  if (errorText) {
    const text = await errorElement.textContent();
    expect(text?.toLowerCase()).toContain(errorText.toLowerCase());
  }
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Aguarda modal abrir
 */
export async function waitForModal(page: Page) {
  await page.waitForSelector('[role="dialog"], .modal, [data-modal]', { state: 'visible' });
  await page.waitForTimeout(300); // Animation
}

/**
 * Fecha modal (ESC)
 */
export async function closeModal(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

/**
 * Verifica se toast/notification apareceu
 */
export async function expectToast(page: Page, text?: string) {
  const toast = page.locator('.toast, [role="status"]').first();
  await expect(toast).toBeVisible({ timeout: 3000 });

  if (text) {
    await expect(toast).toContainText(text);
  }
}

/**
 * Verifica loading state
 */
export async function expectLoading(page: Page, isLoading: boolean) {
  const loadingIndicators = page.locator('.loading, .spinner, [data-loading], svg[class*="animate-spin"]');

  if (isLoading) {
    await expect(loadingIndicators.first()).toBeVisible();
  } else {
    await expect(loadingIndicators.first()).not.toBeVisible();
  }
}

// ============================================
// ACCESSIBILITY HELPERS
// ============================================

/**
 * Injeta axe-core na página
 */
export async function injectAxe(page: Page) {
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js',
  });

  await page.waitForFunction(() => typeof (window as any).axe !== 'undefined');
}

/**
 * Executa análise axe-core
 */
export async function runAxe(page: Page, options?: any): Promise<AxeResults> {
  return page.evaluate((opts) => {
    return (window as any).axe.run(opts || {});
  }, options);
}

/**
 * Formata violations para output legível
 */
export function formatViolations(violations: any[]): string {
  if (violations.length === 0) {
    return 'Nenhuma violation encontrada';
  }

  return violations
    .map((v) => {
      const nodes = v.nodes.slice(0, 3);
      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Violation: ${v.id}
Impact: ${v.impact}
Description: ${v.description}
Help: ${v.helpUrl}

Nodes afetados (${v.nodes.length} total, mostrando ${nodes.length}):
${nodes.map((n: any, i: number) => `  ${i + 1}. ${n.html}\n     Target: ${n.target.join(' > ')}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    })
    .join('\n');
}

// ============================================
// RESPONSIVE HELPERS
// ============================================

/**
 * Verifica scroll horizontal
 */
export async function checkHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;

    const bodyWidth = body.scrollWidth;
    const htmlWidth = html.scrollWidth;
    const viewportWidth = window.innerWidth;

    return bodyWidth > viewportWidth || htmlWidth > viewportWidth;
  });
}

/**
 * Mede dimensões de elemento
 */
export async function getElementSize(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      left: Math.round(rect.left),
    };
  }, selector);
}

// ============================================
// API MOCK HELPERS
// ============================================

/**
 * Mock API success response
 */
export async function mockApiSuccess(page: Page, path: string, data: any) {
  await page.route(`**${path}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/**
 * Mock API error response
 */
export async function mockApiError(page: Page, path: string, status: number, error: string) {
  await page.route(`**${path}`, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error }),
    });
  });
}

/**
 * Mock slow API (para testar loading states)
 */
export async function mockSlowApi(page: Page, path: string, delay: number, data?: any) {
  await page.route(`**${path}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data || { success: true }),
    });
  });
}

// ============================================
// SCREENSHOT HELPERS
// ============================================

/**
 * Tira screenshot com nome descritivo
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Tira screenshot de elemento específico
 */
export async function screenshotElement(page: Page, selector: string, name: string) {
  const element = page.locator(selector).first();
  await element.screenshot({
    path: `test-results/screenshots/${name}.png`,
  });
}

// ============================================
// WAIT HELPERS
// ============================================

/**
 * Aguarda elemento desaparecer
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Aguarda texto aparecer na página
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
}

/**
 * Aguarda network idle (útil após navegações)
 */
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300); // Buffer para animações
}

// ============================================
// DEBUG HELPERS
// ============================================

/**
 * Imprime console logs da página
 */
export function logPageConsole(page: Page) {
  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  page.on('pageerror', (err) => {
    console.error('[BROWSER ERROR]', err);
  });
}

/**
 * Dump HTML de elemento para debug
 */
export async function dumpHTML(page: Page, selector: string) {
  const html = await page.locator(selector).first().innerHTML();
  console.log(`\n=== HTML de ${selector} ===\n${html}\n`);
}
