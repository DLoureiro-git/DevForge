import { defineConfig, devices } from '@playwright/test';

/**
 * DevForge V2 - Playwright Test Configuration
 *
 * Testa em múltiplos viewports para garantir responsividade:
 * - 375px: iPhone SE (mobile)
 * - 768px: iPad (tablet)
 * - 1024px: Small desktop
 * - 1280px: Standard desktop
 * - 1920px: Large desktop
 */

export default defineConfig({
  testDir: './tests',

  // Timeout por teste (30s)
  timeout: 30 * 1000,

  // Timeout global do test runner
  globalTimeout: 60 * 60 * 1000, // 1 hora

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Falhar ao primeiro erro (fast feedback)
  fullyParallel: true,

  // Retry em CI, não em local
  retries: process.env.CI ? 2 : 0,

  // Workers paralelos
  workers: process.env.CI ? 1 : 4,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list'],
  ],

  // Configuração partilhada
  use: {
    // Base URL do frontend
    baseURL: process.env.BASE_URL || 'http://localhost:5679',

    // Trace apenas em retry (economia de disco)
    trace: 'on-first-retry',

    // Screenshot apenas em falha
    screenshot: 'only-on-failure',

    // Video apenas em retry
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 15 * 1000,
  },

  // Múltiplos viewports para testes de responsividade
  projects: [
    {
      name: 'mobile-375',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'tablet-768',
      use: {
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'desktop-1024',
      use: {
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'desktop-1280',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'desktop-1920',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Servidor local (opcional - activar se quiser start automático)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5679',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
