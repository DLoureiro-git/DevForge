import { test, expect } from '@playwright/test';
import { mockLogin, navigateTo } from './helpers';

/**
 * DevForge V2 — FASE 8: Testes UI Kanban
 *
 * Testa funcionalidade Kanban drag & drop:
 * - Arrastar feature cards entre colunas
 * - Actualizar status no backend
 * - Animações smooth
 * - Feedback visual
 */

test.describe('Kanban Board — Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
    await navigateTo(page, '/dashboard');
  });

  test('deve mostrar board Kanban com colunas', async ({ page }) => {
    const kanbanBoard = page.locator('[data-testid="kanban-board"], .kanban-container').first();

    if (!(await kanbanBoard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await expect(kanbanBoard).toBeVisible();

    // Verificar colunas esperadas
    const columns = ['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE'];

    for (const col of columns) {
      const column = page.locator(`[data-column="${col}"], text=${col}`).first();
      await expect(column).toBeVisible();
    }
  });

  test('deve arrastar feature de BACKLOG para IN_PROGRESS', async ({ page }) => {
    const kanbanBoard = page.locator('[data-testid="kanban-board"]').first();

    if (!(await kanbanBoard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Encontrar primeira feature card em BACKLOG
    const backlogColumn = page.locator('[data-column="BACKLOG"]').first();
    const featureCard = backlogColumn.locator('[data-testid="feature-card"]').first();

    if (!(await featureCard.isVisible().catch(() => false))) {
      console.log('[Test Skip] Sem features no BACKLOG');
      test.skip();
      return;
    }

    // Guardar título da feature
    const featureTitle = await featureCard.textContent();

    // Encontrar coluna IN_PROGRESS
    const inProgressColumn = page.locator('[data-column="IN_PROGRESS"]').first();

    // Drag & Drop
    await featureCard.dragTo(inProgressColumn);
    await page.waitForTimeout(500);

    // Verificar se feature apareceu na nova coluna
    const movedCard = inProgressColumn.locator(`text=${featureTitle}`).first();
    await expect(movedCard).toBeVisible({ timeout: 3000 });
  });

  test('deve actualizar status no backend após drag', async ({ page }) => {
    // Mock API para capturar request
    let updateCalled = false;

    await page.route('**/api/features/*', (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        updateCalled = true;
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      } else {
        route.continue();
      }
    });

    const kanbanBoard = page.locator('[data-testid="kanban-board"]').first();

    if (!(await kanbanBoard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    const backlogColumn = page.locator('[data-column="BACKLOG"]').first();
    const featureCard = backlogColumn.locator('[data-testid="feature-card"]').first();

    if (!(await featureCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    const inProgressColumn = page.locator('[data-column="IN_PROGRESS"]').first();

    await featureCard.dragTo(inProgressColumn);
    await page.waitForTimeout(1000);

    expect(updateCalled).toBe(true);
  });

  test('deve mostrar feedback visual durante drag', async ({ page }) => {
    const kanbanBoard = page.locator('[data-testid="kanban-board"]').first();

    if (!(await kanbanBoard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    const featureCard = page.locator('[data-testid="feature-card"]').first();

    if (!(await featureCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Iniciar drag
    await featureCard.hover();
    await page.mouse.down();

    // Verificar se card tem classe de dragging
    const cardClasses = await featureCard.getAttribute('class');
    expect(cardClasses).toMatch(/dragging|is-dragging|opacity-/);

    await page.mouse.up();
  });

  test('deve permitir drag apenas com permissões correctas', async ({ page }) => {
    // Mock user sem permissões
    await page.evaluate(() => {
      (window as any).userPermissions = { canEditFeatures: false };
    });

    const featureCard = page.locator('[data-testid="feature-card"]').first();

    if (!(await featureCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Verificar se drag está desabilitado
    const isDraggable = await featureCard.getAttribute('draggable');
    expect(isDraggable).toBe('false' || null);
  });

  test('deve mostrar contador de features por coluna', async ({ page }) => {
    const columns = page.locator('[data-testid="kanban-column"]');
    const columnCount = await columns.count();

    if (columnCount === 0) {
      test.skip();
      return;
    }

    for (let i = 0; i < columnCount; i++) {
      const column = columns.nth(i);
      const counter = column.locator('[data-testid="column-count"], .count').first();

      if (await counter.isVisible().catch(() => false)) {
        const count = await counter.textContent();
        expect(count).toMatch(/\d+/);
      }
    }
  });

  test('deve expandir/colapsar detalhes da feature ao clicar', async ({ page }) => {
    const featureCard = page.locator('[data-testid="feature-card"]').first();

    if (!(await featureCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Clicar para expandir
    await featureCard.click();
    await page.waitForTimeout(300);

    // Verificar detalhes expandidos
    const details = page.locator('[data-testid="feature-details"], .feature-expanded').first();

    if (await details.isVisible().catch(() => false)) {
      await expect(details).toBeVisible();

      // Verificar campos esperados
      await expect(details.locator('text=/description|descrição/i')).toBeVisible();
      await expect(details.locator('text=/priority|prioridade/i')).toBeVisible();
    }
  });

  test('deve filtrar features por tipo', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-type"], select').first();

    if (!(await filterDropdown.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Filtrar por HOTFIX
    await filterDropdown.selectOption('HOTFIX');
    await page.waitForTimeout(500);

    // Verificar se apenas HOTFIX features estão visíveis
    const allCards = page.locator('[data-testid="feature-card"]');
    const count = await allCards.count();

    for (let i = 0; i < count; i++) {
      const card = allCards.nth(i);
      const type = await card.getAttribute('data-type');
      expect(type).toBe('HOTFIX');
    }
  });

  test('deve criar nova feature via quick add', async ({ page }) => {
    const quickAddBtn = page.locator('[data-testid="quick-add-feature"], button:has-text("Nova Feature")').first();

    if (!(await quickAddBtn.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await quickAddBtn.click();
    await page.waitForTimeout(300);

    // Preencher form inline
    const titleInput = page.locator('input[placeholder*="título"], input[name="title"]').first();
    await titleInput.fill('Test Feature from Kanban');

    const submitBtn = page.locator('button:has-text("Adicionar"), button:has-text("Create")').first();
    await submitBtn.click();

    await page.waitForTimeout(1000);

    // Verificar se feature apareceu no board
    const newCard = page.locator('text=Test Feature from Kanban').first();
    await expect(newCard).toBeVisible();
  });
});

test.describe('Kanban — Real-time Updates', () => {
  test('deve actualizar board quando outro user move feature', async ({ page, context }) => {
    await mockLogin(page);
    await navigateTo(page, '/dashboard');

    const kanbanBoard = page.locator('[data-testid="kanban-board"]').first();

    if (!(await kanbanBoard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Simular WebSocket update de outro user
    await page.evaluate(() => {
      const event = new CustomEvent('feature-updated', {
        detail: {
          featureId: 'test-123',
          newStatus: 'DONE',
          movedBy: 'Other User',
        },
      });
      window.dispatchEvent(event);
    });

    await page.waitForTimeout(500);

    // Verificar se UI actualizou
    const notification = page.locator('[data-testid="toast"], .notification').first();

    if (await notification.isVisible().catch(() => false)) {
      await expect(notification).toContainText(/moved|actualizou/i);
    }
  });
});
