import { test, expect, Page } from '@playwright/test';

/**
 * DevForge V2 - Testes de Responsividade
 *
 * Garante que a aplicação funciona perfeitamente em todos os viewports:
 * - Sem scroll horizontal
 * - Touch targets adequados (≥44x44px)
 * - Texto legível (≥12px)
 * - Imagens com dimensões definidas
 * - Modais que cabem no viewport
 */

const ROUTES = [
  '/',
  '/dashboard',
  '/projects',
  '/settings',
];

test.describe('Responsividade', () => {
  test('não deve ter scroll horizontal em nenhum viewport', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const hasHorizontalOverflow = await checkHorizontalOverflow(page);
      expect(hasHorizontalOverflow, `Scroll horizontal detectado em ${route}`).toBe(false);
    }
  });

  test('todos os touch targets devem ter ≥44x44px', async ({ page, viewport }) => {
    // Apenas em mobile/tablet
    if (!viewport || viewport.width > 1024) {
      test.skip();
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const smallTargets = await page.evaluate(() => {
      const clickables = Array.from(
        document.querySelectorAll('button, a, input[type="submit"], [role="button"]')
      );

      return clickables
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        })
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            class: el.className,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });
    });

    expect(
      smallTargets,
      `Touch targets pequenos detectados: ${JSON.stringify(smallTargets, null, 2)}`
    ).toHaveLength(0);
  });

  test('texto deve ser legível (≥12px)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const smallText = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));

      return allElements
        .filter((el) => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const hasText = (el.textContent || '').trim().length > 0;

          return hasText && fontSize > 0 && fontSize < 12;
        })
        .map((el) => ({
          tag: el.tagName,
          class: el.className,
          fontSize: window.getComputedStyle(el).fontSize,
          text: (el.textContent || '').slice(0, 50),
        }));
    });

    expect(
      smallText,
      `Texto pequeno (<12px) detectado: ${JSON.stringify(smallText, null, 2)}`
    ).toHaveLength(0);
  });

  test('imagens devem ter dimensões definidas', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const imagesWithoutDimensions = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));

      return images
        .filter((img) => {
          const hasWidth = img.hasAttribute('width') || img.style.width;
          const hasHeight = img.hasAttribute('height') || img.style.height;
          const hasAspectRatio = img.style.aspectRatio;

          // OK se tem (width + height) OU aspect-ratio
          return !(hasWidth && hasHeight) && !hasAspectRatio;
        })
        .map((img) => ({
          src: img.src,
          alt: img.alt,
          class: img.className,
        }));
    });

    expect(
      imagesWithoutDimensions,
      `Imagens sem dimensões: ${JSON.stringify(imagesWithoutDimensions, null, 2)}`
    ).toHaveLength(0);
  });

  test('modais devem caber no viewport', async ({ page, viewport }) => {
    if (!viewport) {
      test.skip();
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tentar abrir modais comuns (adaptado à tua UI)
    const modalTriggers = [
      '[data-testid="new-project-button"]',
      '[data-testid="settings-button"]',
      'button:has-text("Novo Projeto")',
    ];

    for (const selector of modalTriggers) {
      const trigger = page.locator(selector).first();
      const isVisible = await trigger.isVisible().catch(() => false);

      if (isVisible) {
        await trigger.click();
        await page.waitForTimeout(500); // Animação

        // Verificar se modal cabe no viewport
        const modalOverflow = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"], .modal, [data-modal]');
          if (!modal) return false;

          const rect = modal.getBoundingClientRect();
          return (
            rect.right > window.innerWidth ||
            rect.bottom > window.innerHeight ||
            rect.left < 0 ||
            rect.top < 0
          );
        });

        expect(modalOverflow, `Modal overflow detectado com trigger ${selector}`).toBe(false);

        // Fechar modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  });

  test('pipeline deve ser horizontal ≥1024px e vertical <1024px', async ({ page, viewport }) => {
    if (!viewport) {
      test.skip();
    }

    await page.goto('/projects'); // ou rota onde está o pipeline
    await page.waitForLoadState('networkidle');

    const pipelineLayout = await page.evaluate(() => {
      const pipeline = document.querySelector('[data-testid="pipeline"]') as HTMLElement;
      if (!pipeline) return null;

      const style = window.getComputedStyle(pipeline);
      return {
        flexDirection: style.flexDirection,
        display: style.display,
      };
    });

    if (!pipelineLayout) {
      // Pipeline não encontrado nesta página
      test.skip();
    }

    if (viewport.width >= 1024) {
      expect(pipelineLayout.flexDirection).toBe('row');
    } else {
      expect(pipelineLayout.flexDirection).toBe('column');
    }
  });
});

/**
 * Helper: Verifica se existe scroll horizontal
 */
async function checkHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;

    const bodyWidth = body.scrollWidth;
    const htmlWidth = html.scrollWidth;
    const viewportWidth = window.innerWidth;

    return bodyWidth > viewportWidth || htmlWidth > viewportWidth;
  });
}
