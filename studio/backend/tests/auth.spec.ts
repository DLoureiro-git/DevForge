import { test, expect } from '@playwright/test';

/**
 * DevForge V2 - Testes de Autenticação
 *
 * Garante que:
 * - Rotas protegidas redirecionam para login
 * - Login/Logout funcionam correctamente
 * - Tokens expirados são tratados
 * - Sessions persistem após refresh
 */

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar storage antes de cada teste
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('rotas protegidas devem redirecionar para login', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/projects', '/settings'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // Deve ter redirecionado para login ou mostrar modal de login
      const isLoginPage =
        currentUrl.includes('/login') ||
        currentUrl.includes('/auth') ||
        currentUrl.includes('/signin');

      const hasLoginModal = await page
        .locator('[data-testid="login-modal"], [role="dialog"]:has-text("Login")')
        .first()
        .isVisible()
        .catch(() => false);

      expect(
        isLoginPage || hasLoginModal,
        `Rota protegida ${route} não redirecionou para login`
      ).toBe(true);
    }
  });

  test('login com credenciais válidas deve funcionar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Encontrar form de login
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Entrar")').first();

    if (!(await emailInput.isVisible().catch(() => false))) {
      test.skip();
    }

    // Preencher credenciais
    await emailInput.fill('test@devforge.com');
    await passwordInput.fill('Test123456!');

    // Submit
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Deve ter navegado para dashboard
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    expect(
      currentUrl.includes('/dashboard') || currentUrl.includes('/projects'),
      'Login não redirecionou para área autenticada'
    ).toBe(true);

    // Verificar se token foi guardado
    const hasToken = await page.evaluate(() => {
      return (
        localStorage.getItem('token') !== null ||
        localStorage.getItem('session') !== null ||
        document.cookie.includes('auth')
      );
    });

    expect(hasToken, 'Token de autenticação não foi guardado').toBe(true);
  });

  test('login com credenciais inválidas deve mostrar erro', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (!(await emailInput.isVisible().catch(() => false))) {
      test.skip();
    }

    await emailInput.fill('wrong@email.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    await page.waitForTimeout(1500);

    // Verificar erro
    const errorVisible = await page
      .locator('.error, [role="alert"], .text-red-500, .text-destructive')
      .first()
      .isVisible()
      .catch(() => false);

    expect(errorVisible, 'Erro de login não foi exibido').toBe(true);

    // Não deve ter navegado
    const currentUrl = page.url();
    expect(currentUrl.includes('/dashboard')).toBe(false);
  });

  test('logout deve limpar sessão', async ({ page }) => {
    // Simular login (injetar token)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('user', JSON.stringify({ email: 'test@devforge.com' }));
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Encontrar botão de logout
    const logoutButton = page
      .locator('button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout"]')
      .first();

    if (!(await logoutButton.isVisible().catch(() => false))) {
      test.skip();
    }

    await logoutButton.click();
    await page.waitForTimeout(1000);

    // Verificar se token foi removido
    const hasToken = await page.evaluate(() => {
      return (
        localStorage.getItem('token') !== null || localStorage.getItem('session') !== null
      );
    });

    expect(hasToken, 'Token não foi removido após logout').toBe(false);

    // Deve ter redirecionado para home/login
    const currentUrl = page.url();
    expect(currentUrl.includes('/dashboard')).toBe(false);
  });

  test('sessão deve persistir após refresh', async ({ page }) => {
    // Simular login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: '123', email: 'test@devforge.com', name: 'Test User' })
      );
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar se está autenticado
    const isAuthenticated = await page
      .locator('[data-testid="user-menu"], .user-avatar, button:has-text("Sair")')
      .first()
      .isVisible()
      .catch(() => false);

    expect(isAuthenticated, 'Não está autenticado antes do refresh').toBe(true);

    // Refresh
    await page.reload({ waitUntil: 'networkidle' });

    // Verificar se ainda está autenticado
    const stillAuthenticated = await page
      .locator('[data-testid="user-menu"], .user-avatar, button:has-text("Sair")')
      .first()
      .isVisible()
      .catch(() => false);

    expect(stillAuthenticated, 'Sessão não persistiu após refresh').toBe(true);
  });

  test('token expirado deve redirecionar para login', async ({ page }) => {
    // Mock API retornando 401
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' }),
      });
    });

    // Simular token expirado
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired-token');
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Deve ter redirecionado para login
    const currentUrl = page.url();
    expect(
      currentUrl.includes('/login') || currentUrl.includes('/auth'),
      'Token expirado não redirecionou para login'
    ).toBe(true);

    // Token deve ter sido limpo
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('token') !== null;
    });

    expect(hasToken, 'Token expirado não foi removido').toBe(false);
  });

  test('deve mostrar informação do user autenticado', async ({ page }) => {
    // Simular login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: '123',
          email: 'john@devforge.com',
          name: 'John Doe',
        })
      );
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar se nome ou email aparecem
    const userInfo = await page
      .locator(
        '[data-testid="user-name"], .user-name, [data-testid="user-email"], text=/john@devforge.com/i, text=/John Doe/i'
      )
      .first()
      .textContent()
      .catch(() => '');

    expect(
      userInfo.toLowerCase().includes('john') || userInfo.includes('john@devforge.com'),
      'Informação do user não aparece na UI'
    ).toBe(true);
  });
});
