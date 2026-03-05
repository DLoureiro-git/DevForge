import { test, expect } from '@playwright/test';
import type { AxeResults } from 'axe-core';

/**
 * DevForge V2 - Testes de Acessibilidade
 *
 * Usa axe-core para validar:
 * - Zero violations críticas
 * - Imagens com alt text
 * - Formulários com labels
 * - Estrutura semântica
 * - Contraste de cores
 */

const ROUTES = ['/', '/dashboard', '/projects', '/settings'];

test.describe('Acessibilidade', () => {
  test('não deve ter violations críticas de a11y', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Injetar axe-core
      await injectAxe(page);

      // Executar análise
      const results = await runAxe(page);

      // Filtrar apenas violations críticas e graves
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        criticalViolations,
        `Violations críticas encontradas em ${route}:\n${formatViolations(criticalViolations)}`
      ).toHaveLength(0);
    }
  });

  test('todas as imagens devem ter alt text', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const imagesWithoutAlt = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));

        return images
          .filter((img) => {
            const alt = img.getAttribute('alt');
            const role = img.getAttribute('role');

            // OK se:
            // - Tem alt (mesmo que vazio para decorativas)
            // - OU role="presentation" (decorativa)
            // - OU está hidden
            return (
              alt === null &&
              role !== 'presentation' &&
              img.getAttribute('aria-hidden') !== 'true'
            );
          })
          .map((img) => ({
            src: img.src,
            class: img.className,
          }));
      });

      expect(
        imagesWithoutAlt,
        `Imagens sem alt em ${route}: ${JSON.stringify(imagesWithoutAlt, null, 2)}`
      ).toHaveLength(0);
    }
  });

  test('inputs de formulários devem ter labels', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const inputsWithoutLabels = await page.evaluate(() => {
        const inputs = Array.from(
          document.querySelectorAll('input:not([type="hidden"]), textarea, select')
        );

        return inputs
          .filter((input) => {
            const id = input.id;
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            const placeholder = input.getAttribute('placeholder');

            // OK se tem:
            // - Label associado (via for)
            // - aria-label
            // - aria-labelledby
            // - Está dentro de <label>
            const hasLabel = id && document.querySelector(`label[for="${id}"]`) !== null;
            const isInLabel = input.closest('label') !== null;

            return !hasLabel && !isInLabel && !ariaLabel && !ariaLabelledBy && !placeholder;
          })
          .map((input) => ({
            tag: input.tagName,
            type: input.getAttribute('type'),
            name: input.getAttribute('name'),
            class: input.className,
          }));
      });

      expect(
        inputsWithoutLabels,
        `Inputs sem labels em ${route}: ${JSON.stringify(inputsWithoutLabels, null, 2)}`
      ).toHaveLength(0);
    }
  });

  test('deve ter estrutura semântica correcta', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const semanticIssues = await page.evaluate(() => {
        const issues: string[] = [];

        // 1. Deve ter apenas um h1
        const h1Count = document.querySelectorAll('h1').length;
        if (h1Count === 0) {
          issues.push('Nenhum <h1> encontrado');
        } else if (h1Count > 1) {
          issues.push(`Múltiplos <h1> encontrados (${h1Count})`);
        }

        // 2. Headings devem estar em ordem
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let lastLevel = 0;
        headings.forEach((h) => {
          const level = parseInt(h.tagName[1]);
          if (level > lastLevel + 1) {
            issues.push(`Heading skip: ${h.tagName} após h${lastLevel}`);
          }
          lastLevel = level;
        });

        // 3. Deve ter <main>
        if (!document.querySelector('main')) {
          issues.push('Nenhum elemento <main> encontrado');
        }

        // 4. Links devem ter texto
        const emptyLinks = Array.from(document.querySelectorAll('a')).filter((a) => {
          const text = (a.textContent || '').trim();
          const ariaLabel = a.getAttribute('aria-label');
          const title = a.getAttribute('title');
          return !text && !ariaLabel && !title;
        });

        if (emptyLinks.length > 0) {
          issues.push(`${emptyLinks.length} links sem texto`);
        }

        return issues;
      });

      expect(
        semanticIssues,
        `Problemas semânticos em ${route}: ${semanticIssues.join(', ')}`
      ).toHaveLength(0);
    }
  });

  test('deve ter contraste adequado', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      await injectAxe(page);

      const results = await runAxe(page);

      // Filtrar apenas violations de contraste
      const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

      expect(
        contrastViolations,
        `Problemas de contraste em ${route}:\n${formatViolations(contrastViolations)}`
      ).toHaveLength(0);
    }
  });

  test('elementos interactivos devem ter focus visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const interactiveElements = await page.locator('button, a, input, select, textarea').all();

    for (const element of interactiveElements.slice(0, 5)) {
      // Testar apenas primeiros 5
      if (!(await element.isVisible())) {
        continue;
      }

      await element.focus();
      await page.waitForTimeout(100);

      const hasFocusVisible = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.outline !== 'none' ||
          style.boxShadow !== 'none' ||
          el.classList.contains('focus-visible') ||
          el.classList.contains('focus')
        );
      });

      expect(
        hasFocusVisible,
        `Elemento sem focus visible: ${await element.textContent()}`
      ).toBe(true);
    }
  });

  test('deve ter lang attribute no HTML', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const lang = await page.evaluate(() => {
      return document.documentElement.getAttribute('lang');
    });

    expect(lang, 'HTML sem atributo lang').toBeTruthy();
  });

  test('botões devem ter aria-label se apenas ícone', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const iconButtonsWithoutLabel = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));

        return buttons
          .filter((btn) => {
            const text = (btn.textContent || '').trim();
            const ariaLabel = btn.getAttribute('aria-label');
            const ariaLabelledBy = btn.getAttribute('aria-labelledby');
            const title = btn.getAttribute('title');
            const hasSvg = btn.querySelector('svg') !== null;

            // Se tem apenas SVG e sem labels
            return hasSvg && !text && !ariaLabel && !ariaLabelledBy && !title;
          })
          .map((btn) => ({
            class: btn.className,
            hasSvg: btn.querySelector('svg') !== null,
          }));
      });

      expect(
        iconButtonsWithoutLabel,
        `Botões ícone sem aria-label em ${route}: ${JSON.stringify(iconButtonsWithoutLabel, null, 2)}`
      ).toHaveLength(0);
    }
  });
});

/**
 * Helpers para axe-core
 */

async function injectAxe(page: any) {
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
  });

  // Aguardar axe carregar
  await page.waitForFunction(() => typeof (window as any).axe !== 'undefined');
}

async function runAxe(page: any): Promise<AxeResults> {
  return page.evaluate(() => {
    return (window as any).axe.run({
      rules: {
        // Desactivar rules que podem ter falsos positivos
        region: { enabled: false }, // Pode conflitar com SPA
      },
    });
  });
}

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.slice(0, 3); // Max 3 exemplos
      return `
- ${v.id} (${v.impact})
  ${v.description}
  Exemplos: ${nodes.map((n: any) => n.html).join('\n           ')}
`;
    })
    .join('\n');
}
