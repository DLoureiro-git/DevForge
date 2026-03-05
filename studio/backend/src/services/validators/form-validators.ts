/**
 * Form Validators - Categoria E: Formulários
 */

import type { Browser } from 'playwright';
import type { Bug, ValidationResult } from '../qa-engine';

// ============================================================================
// E1: FORM VALIDATION
// ============================================================================

export async function validateFormValidation(
  browser: Browser,
  projectPath: string,
  deployUrl?: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const bugs: Bug[] = [];
  const checkId = 'forms-001';

  if (!deployUrl) {
    bugs.push({
      id: `${checkId}-no-url`,
      checkId,
      severity: 'CRITICAL',
      title: 'URL de deploy não fornecida',
      description: 'Impossível testar validação de formulários',
      reproducible: true,
      foundAt: new Date(),
    });

    return {
      passed: false,
      checkId,
      bugs,
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  const page = await browser.newPage();

  try {
    await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });

    // Procurar formulários
    const forms = await page.$$('form');

    if (forms.length === 0) {
      bugs.push({
        id: `${checkId}-no-forms`,
        checkId,
        severity: 'MEDIUM',
        title: 'Nenhum formulário encontrado',
        description: 'Impossível testar validação de formulários',
        location: deployUrl,
        reproducible: true,
        foundAt: new Date(),
      });

      return {
        passed: true, // não é erro se não há forms
        checkId,
        bugs,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    // Testar primeiro formulário
    const firstForm = forms[0];

    // Procurar inputs obrigatórios
    const requiredInputs = await firstForm.$$('input[required], textarea[required], select[required]');

    if (requiredInputs.length === 0) {
      bugs.push({
        id: `${checkId}-no-required`,
        checkId,
        severity: 'MEDIUM',
        title: 'Formulário sem campos obrigatórios',
        description: 'Impossível testar validação client-side',
        location: deployUrl,
        reproducible: true,
        foundAt: new Date(),
      });
    } else {
      // Tentar submeter formulário vazio
      const submitButton = await firstForm.$('button[type="submit"], input[type="submit"]');

      if (submitButton) {
        // Limpar todos os inputs
        for (const input of requiredInputs) {
          await input.fill('');
        }

        // Clicar em submit
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Verificar se mostra erro de validação
        const hasValidationError = await page.evaluate(() => {
          const text = document.body.textContent?.toLowerCase() || '';
          return text.includes('required') ||
                 text.includes('obrigatório') ||
                 text.includes('campo') ||
                 text.includes('preencha') ||
                 text.includes('invalid') ||
                 text.includes('inválido');
        });

        // Verificar se HTML5 validation está ativa
        const hasHtml5Validation = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input[required]'));
          return inputs.some(input => (input as HTMLInputElement).validity?.valueMissing);
        });

        if (!hasValidationError && !hasHtml5Validation) {
          bugs.push({
            id: `${checkId}-no-client-validation`,
            checkId,
            severity: 'HIGH',
            title: 'Validação client-side não funciona',
            description: 'Formulário aceita submit sem preencher campos obrigatórios',
            location: deployUrl,
            screenshot: await page.screenshot({ fullPage: false }),
            reproducible: true,
            foundAt: new Date(),
          });
        }
      }
    }

    // Testar validação de email
    const emailInputs = await firstForm.$$('input[type="email"]');

    if (emailInputs.length > 0) {
      const emailInput = emailInputs[0];
      await emailInput.fill('invalid-email');

      const submitButton = await firstForm.$('button[type="submit"], input[type="submit"]');

      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        const hasEmailError = await page.evaluate(() => {
          const text = document.body.textContent?.toLowerCase() || '';
          return text.includes('email') && (
            text.includes('inválido') ||
            text.includes('invalid') ||
            text.includes('formato')
          );
        });

        if (!hasEmailError) {
          bugs.push({
            id: `${checkId}-no-email-validation`,
            checkId,
            severity: 'HIGH',
            title: 'Validação de email não funciona',
            description: 'Email inválido aceite sem erro',
            location: deployUrl,
            reproducible: true,
            foundAt: new Date(),
          });
        }
      }
    }

    // Verificar validação server-side (fazer POST com dados inválidos)
    const formAction = await firstForm.getAttribute('action');

    if (formAction) {
      const actionUrl = formAction.startsWith('http') ? formAction : `${deployUrl}${formAction}`;

      try {
        const response = await fetch(actionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invalid: 'data' }),
        });

        if (response.ok) {
          bugs.push({
            id: `${checkId}-no-server-validation`,
            checkId,
            severity: 'CRITICAL',
            title: 'Validação server-side não funciona',
            description: `API ${actionUrl} aceita dados inválidos`,
            location: actionUrl,
            reproducible: true,
            foundAt: new Date(),
          });
        }
      } catch {
        // Erro é esperado (validação funcionou)
      }
    }

  } catch (error) {
    bugs.push({
      id: `${checkId}-exception`,
      checkId,
      severity: 'CRITICAL',
      title: 'Exceção ao validar formulários',
      description: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      reproducible: true,
      foundAt: new Date(),
    });
  } finally {
    await page.close();
  }

  return {
    passed: bugs.length === 0,
    checkId,
    bugs,
    executionTime: Date.now() - startTime,
    timestamp: new Date(),
  };
}

// ============================================================================
// E2: SERVER ERROR DISPLAY
// ============================================================================

export async function validateServerErrorDisplay(
  browser: Browser,
  projectPath: string,
  deployUrl?: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const bugs: Bug[] = [];
  const checkId = 'forms-002';

  if (!deployUrl) {
    bugs.push({
      id: `${checkId}-no-url`,
      checkId,
      severity: 'HIGH',
      title: 'URL de deploy não fornecida',
      description: 'Impossível testar display de erros',
      reproducible: true,
      foundAt: new Date(),
    });

    return {
      passed: false,
      checkId,
      bugs,
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  const page = await browser.newPage();

  try {
    await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });

    // Procurar formulários
    const forms = await page.$$('form');

    if (forms.length === 0) {
      return {
        passed: true,
        checkId,
        bugs,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const firstForm = forms[0];

    // Interceptar requests para forçar erro 500
    await page.route('**/api/**', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    // Preencher e submeter formulário
    const inputs = await firstForm.$$('input[type="text"], input[type="email"], textarea');

    if (inputs.length > 0) {
      await inputs[0].fill('test@example.com');
    }

    const submitButton = await firstForm.$('button[type="submit"], input[type="submit"]');

    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Verificar se erro é exibido ao utilizador
      const hasErrorMessage = await page.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || '';
        return text.includes('erro') ||
               text.includes('error') ||
               text.includes('falhou') ||
               text.includes('failed') ||
               text.includes('problema');
      });

      if (!hasErrorMessage) {
        bugs.push({
          id: `${checkId}-no-error-display`,
          checkId,
          severity: 'HIGH',
          title: 'Erros de servidor não são exibidos',
          description: 'Utilizador não recebe feedback quando API falha',
          location: deployUrl,
          screenshot: await page.screenshot({ fullPage: false }),
          reproducible: true,
          foundAt: new Date(),
        });
      }

      // Verificar se mostra stack trace (SECURITY ISSUE)
      const hasStackTrace = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.includes('at ') && text.includes('.ts:') || text.includes('Error:');
      });

      if (hasStackTrace) {
        bugs.push({
          id: `${checkId}-stack-trace-exposed`,
          checkId,
          severity: 'CRITICAL',
          title: 'Stack trace exposto ao utilizador',
          description: 'Informação sensível de debug visível em produção',
          location: deployUrl,
          screenshot: await page.screenshot({ fullPage: false }),
          reproducible: true,
          foundAt: new Date(),
        });
      }
    }

  } catch (error) {
    bugs.push({
      id: `${checkId}-exception`,
      checkId,
      severity: 'HIGH',
      title: 'Exceção ao validar display de erros',
      description: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      reproducible: true,
      foundAt: new Date(),
    });
  } finally {
    await page.close();
  }

  return {
    passed: bugs.length === 0,
    checkId,
    bugs,
    executionTime: Date.now() - startTime,
    timestamp: new Date(),
  };
}

// ============================================================================
// E3: FORM LOADING STATES
// ============================================================================

export async function validateFormLoadingStates(
  browser: Browser,
  projectPath: string,
  deployUrl?: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const bugs: Bug[] = [];
  const checkId = 'forms-003';

  if (!deployUrl) {
    bugs.push({
      id: `${checkId}-no-url`,
      checkId,
      severity: 'MEDIUM',
      title: 'URL de deploy não fornecida',
      description: 'Impossível testar loading states',
      reproducible: true,
      foundAt: new Date(),
    });

    return {
      passed: false,
      checkId,
      bugs,
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  const page = await browser.newPage();

  try {
    await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });

    const forms = await page.$$('form');

    if (forms.length === 0) {
      return {
        passed: true,
        checkId,
        bugs,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const firstForm = forms[0];

    // Adicionar delay às requests de API
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 2000);
    });

    // Preencher formulário
    const inputs = await firstForm.$$('input[type="text"], input[type="email"], textarea');

    if (inputs.length > 0) {
      await inputs[0].fill('test@example.com');
    }

    const submitButton = await firstForm.$('button[type="submit"], input[type="submit"]');

    if (submitButton) {
      // Verificar estado inicial
      const initialText = await submitButton.textContent();

      // Clicar
      await submitButton.click();
      await page.waitForTimeout(500);

      // Verificar loading state
      const isDisabledDuringSubmit = await submitButton.isDisabled();
      const textDuringSubmit = await submitButton.textContent();

      const hasLoadingIndicator = await page.evaluate(() => {
        const indicators = ['loading', 'carregando', 'enviando', 'aguarde'];
        const text = document.body.textContent?.toLowerCase() || '';
        return indicators.some(ind => text.includes(ind));
      });

      const hasSpinner = await page.evaluate(() => {
        return document.querySelector('[class*="spin"], [class*="load"], [role="progressbar"]') !== null;
      });

      if (!isDisabledDuringSubmit && !hasLoadingIndicator && !hasSpinner) {
        bugs.push({
          id: `${checkId}-no-loading-state`,
          checkId,
          severity: 'MEDIUM',
          title: 'Formulário sem loading state durante submissão',
          description: 'Utilizador não tem feedback visual de que submissão está em progresso',
          location: deployUrl,
          screenshot: await page.screenshot({ fullPage: false }),
          reproducible: true,
          foundAt: new Date(),
        });
      }
    }

  } catch (error) {
    bugs.push({
      id: `${checkId}-exception`,
      checkId,
      severity: 'MEDIUM',
      title: 'Exceção ao validar loading states',
      description: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      reproducible: true,
      foundAt: new Date(),
    });
  } finally {
    await page.close();
  }

  return {
    passed: bugs.length === 0,
    checkId,
    bugs,
    executionTime: Date.now() - startTime,
    timestamp: new Date(),
  };
}
