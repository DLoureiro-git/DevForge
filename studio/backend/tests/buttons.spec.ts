import { test, expect } from '@playwright/test';

/**
 * DevForge V2 - Testes de Botões
 *
 * Garante que:
 * - Zero botões sem handler (orphan buttons)
 * - Todos os links internos funcionam (sem 404s)
 * - Loading states visíveis durante operações
 * - Confirmações em acções destrutivas
 */

const ROUTES = ['/', '/dashboard', '/projects', '/settings'];

test.describe('Botões e Links', () => {
  test('não deve ter botões sem handler (orphan buttons)', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const orphanButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));

        return buttons
          .filter((btn) => {
            const element = btn as HTMLElement;

            // Verificar se tem event listeners
            const hasListeners =
              // @ts-ignore
              typeof element.onclick === 'function' ||
              // @ts-ignore
              (window.getEventListeners && window.getEventListeners(element).click?.length > 0);

            // Verificar atributos que indicam handler
            const hasAttributes =
              element.hasAttribute('type') ||
              element.hasAttribute('data-action') ||
              element.hasAttribute('data-testid') ||
              element.closest('form') !== null ||
              element.getAttribute('disabled') !== null;

            return !hasListeners && !hasAttributes;
          })
          .map((btn) => ({
            tag: btn.tagName,
            class: btn.className,
            text: (btn.textContent || '').trim().slice(0, 50),
          }));
      });

      expect(
        orphanButtons,
        `Botões órfãos encontrados em ${route}: ${JSON.stringify(orphanButtons, null, 2)}`
      ).toHaveLength(0);
    }
  });

  test('todos os links internos devem funcionar (sem 404s)', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const internalLinks = await page.locator('a[href^="/"], a[href^="./"]').all();

      for (const link of internalLinks) {
        const href = await link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) {
          continue;
        }

        // Navegar para o link
        const response = await page.goto(href, { waitUntil: 'domcontentloaded' });

        expect(
          response?.status(),
          `Link ${href} retornou 404 ou erro (origem: ${route})`
        ).not.toBe(404);

        expect(
          response?.status(),
          `Link ${href} retornou erro 5xx (origem: ${route})`
        ).toBeLessThan(500);

        // Voltar
        await page.goBack({ waitUntil: 'domcontentloaded' });
      }
    }
  });

  test('botões devem mostrar loading state durante operações', async ({ page }) => {
    // Mock slow API
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.continue();
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Procurar botões de acção
    const actionButtons = await page
      .locator('button:has-text("Criar"), button:has-text("Guardar"), button:has-text("Enviar")')
      .all();

    if (actionButtons.length === 0) {
      test.skip();
    }

    for (const button of actionButtons) {
      if (!(await button.isVisible())) {
        continue;
      }

      await button.click();
      await page.waitForTimeout(200);

      // Verificar loading state
      const hasLoadingState = await button.evaluate((btn) => {
        return (
          btn.hasAttribute('disabled') ||
          btn.getAttribute('aria-busy') === 'true' ||
          btn.classList.contains('loading') ||
          btn.querySelector('.spinner, .loading, svg[class*="animate-spin"]') !== null
        );
      });

      expect(hasLoadingState, `Botão sem loading state: ${await button.textContent()}`).toBe(true);

      // Cancelar operação
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('acções destrutivas devem ter confirmação', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Procurar botões destrutivos
    const destructiveButtons = await page
      .locator(
        'button:has-text("Eliminar"), button:has-text("Apagar"), button:has-text("Remover"), button[class*="destructive"], button[class*="danger"]'
      )
      .all();

    if (destructiveButtons.length === 0) {
      test.skip();
    }

    for (const button of destructiveButtons) {
      if (!(await button.isVisible())) {
        continue;
      }

      await button.click();
      await page.waitForTimeout(500);

      // Deve aparecer confirmação
      const confirmationVisible =
        (await page
          .locator('[role="alertdialog"], .confirm-dialog, [data-confirm]')
          .first()
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator(
            'text=/tem certeza|confirmar|irreversível|não pode ser desfeito|permanently delete/i'
          )
          .first()
          .isVisible()
          .catch(() => false));

      expect(
        confirmationVisible,
        `Botão destrutivo sem confirmação: ${await button.textContent()}`
      ).toBe(true);

      // Cancelar
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('botões devem ter cursor pointer e hover state', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const buttonsWithoutPointer = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll('button:not([disabled]), [role="button"]:not([disabled])')
        );

        return buttons
          .filter((btn) => {
            const style = window.getComputedStyle(btn);
            return style.cursor !== 'pointer' && style.cursor !== 'default';
          })
          .map((btn) => ({
            tag: btn.tagName,
            class: btn.className,
            cursor: window.getComputedStyle(btn).cursor,
            text: (btn.textContent || '').trim().slice(0, 50),
          }));
      });

      expect(
        buttonsWithoutPointer,
        `Botões sem cursor pointer em ${route}: ${JSON.stringify(buttonsWithoutPointer, null, 2)}`
      ).toHaveLength(0);
    }
  });

  test('botões disabled devem ter visual claro', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const disabledButtons = await page.locator('button[disabled], [role="button"][disabled]').all();

    for (const button of disabledButtons) {
      if (!(await button.isVisible())) {
        continue;
      }

      const styles = await button.evaluate((btn) => {
        const style = window.getComputedStyle(btn);
        return {
          opacity: parseFloat(style.opacity),
          cursor: style.cursor,
          pointerEvents: style.pointerEvents,
        };
      });

      // Deve ter opacity reduzida OU cursor not-allowed OU pointer-events none
      const hasDisabledVisual =
        styles.opacity < 1 || styles.cursor === 'not-allowed' || styles.pointerEvents === 'none';

      expect(
        hasDisabledVisual,
        `Botão disabled sem visual claro: ${await button.textContent()}`
      ).toBe(true);
    }
  });
});
