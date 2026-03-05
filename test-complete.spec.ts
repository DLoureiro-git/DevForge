import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const APP_URL = 'https://perceptive-possibility-production-f87c.up.railway.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-results');

test.describe('DevForge - Teste Completo', () => {
  test.beforeAll(async () => {
    // Criar directório para screenshots
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  });

  test('Teste completo do fluxo de criação de projecto', async ({ page, browser }) => {
    const consoleLogs: any[] = [];
    const consoleErrors: any[] = [];
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];

    // Capturar logs do console
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      consoleLogs.push(logEntry);

      if (msg.type() === 'error') {
        consoleErrors.push(logEntry);
      }

      console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
    });

    // Capturar erros de página
    page.on('pageerror', error => {
      const errorEntry = {
        message: error.message,
        stack: error.stack
      };
      consoleErrors.push(errorEntry);
      console.log('[PAGE ERROR]:', error.message);
    });

    // Capturar requests HTTP
    page.on('request', request => {
      const requestData = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      };
      networkRequests.push(requestData);
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    });

    // Capturar responses HTTP
    page.on('response', async response => {
      const responseData = {
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        body: null as any
      };

      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseData.body = await response.json();
        } else if (contentType.includes('text/')) {
          responseData.body = await response.text();
        }
      } catch (e) {
        // Ignorar erros ao tentar ler body
      }

      networkResponses.push(responseData);
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
    });

    console.log('\n=== PASSO 1: Abrir aplicação ===');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });

    // Esperar um pouco para carregar
    await page.waitForTimeout(2000);

    // Screenshot do estado inicial
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-dashboard-inicial.png'),
      fullPage: true
    });
    console.log('✓ Screenshot do dashboard inicial');

    console.log('\n=== PASSO 2: Verificar erros no console ===');
    if (consoleErrors.length > 0) {
      console.log(`❌ ENCONTRADOS ${consoleErrors.length} ERROS NO CONSOLE:`);
      consoleErrors.forEach((err, i) => {
        console.log(`\nErro ${i + 1}:`, JSON.stringify(err, null, 2));
      });
    } else {
      console.log('✓ Nenhum erro no console até agora');
    }

    console.log('\n=== PASSO 3: Verificar elementos da página ===');

    // Verificar se o botão "Novo Projecto" existe
    const newProjectButton = page.locator('button:has-text("Novo Projecto"), button:has-text("Novo Projeto"), button:has-text("New Project")').first();
    const buttonExists = await newProjectButton.count() > 0;
    console.log(`Botão "Novo Projecto": ${buttonExists ? '✓ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);

    if (!buttonExists) {
      // Tentar encontrar qualquer botão
      const allButtons = await page.locator('button').all();
      console.log(`\nTotal de botões na página: ${allButtons.length}`);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  Botão ${i + 1}: "${text?.trim()}"`);
      }
    }

    console.log('\n=== PASSO 4: Clicar em "Novo Projecto" ===');
    if (buttonExists) {
      await newProjectButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-modal-aberto.png'),
        fullPage: true
      });
      console.log('✓ Screenshot do modal aberto');

      console.log('\n=== PASSO 5: Preencher formulário ===');

      // Procurar campo de input/textarea
      const descriptionInput = page.locator('textarea, input[type="text"]').first();
      const inputExists = await descriptionInput.count() > 0;
      console.log(`Campo de descrição: ${inputExists ? '✓ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);

      if (inputExists) {
        await descriptionInput.fill('Sistema de gestão de inventário com alertas de stock baixo');
        console.log('✓ Descrição preenchida');

        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '03-formulario-preenchido.png'),
          fullPage: true
        });
        console.log('✓ Screenshot do formulário preenchido');

        console.log('\n=== PASSO 6: Submeter formulário ===');

        // Procurar botão de submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Criar"), button:has-text("Create")').first();
        const submitExists = await submitButton.count() > 0;
        console.log(`Botão de submit: ${submitExists ? '✓ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);

        if (submitExists) {
          // Contador de requests antes do submit
          const requestsBefore = networkRequests.length;

          await submitButton.click();
          console.log('✓ Botão submit clicado');

          // Esperar por novos requests
          await page.waitForTimeout(3000);

          const requestsAfter = networkRequests.length;
          const newRequests = requestsAfter - requestsBefore;
          console.log(`\n${newRequests} novo(s) request(s) feito(s) após submit`);

          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '04-apos-submit.png'),
            fullPage: true
          });
          console.log('✓ Screenshot após submit');

          console.log('\n=== PASSO 7: Verificar resultado ===');

          // Procurar mensagens de sucesso/erro
          await page.waitForTimeout(2000);

          const alerts = await page.locator('[role="alert"], .alert, .toast, .notification').all();
          if (alerts.length > 0) {
            console.log(`\n${alerts.length} alerta(s) encontrado(s):`);
            for (let i = 0; i < alerts.length; i++) {
              const text = await alerts[i].textContent();
              console.log(`  Alerta ${i + 1}: "${text?.trim()}"`);
            }
          } else {
            console.log('Nenhum alerta visível');
          }

          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '05-resultado-final.png'),
            fullPage: true
          });
          console.log('✓ Screenshot do resultado final');
        }
      }
    }

    console.log('\n=== PASSO 8: Análise de Network ===');

    // Filtrar requests para a API
    const apiRequests = networkRequests.filter(r =>
      r.url.includes('railway.app') || r.url.includes('/api/')
    );

    console.log(`\nTotal de requests HTTP: ${networkRequests.length}`);
    console.log(`Requests para API: ${apiRequests.length}`);

    if (apiRequests.length > 0) {
      console.log('\nRequests para API:');
      apiRequests.forEach((req, i) => {
        console.log(`\n  Request ${i + 1}:`);
        console.log(`    Method: ${req.method}`);
        console.log(`    URL: ${req.url}`);
        if (req.postData) {
          console.log(`    Body: ${req.postData.substring(0, 200)}...`);
        }
      });
    }

    // Filtrar responses da API
    const apiResponses = networkResponses.filter(r =>
      r.url.includes('railway.app') || r.url.includes('/api/')
    );

    if (apiResponses.length > 0) {
      console.log('\n\nResponses da API:');
      apiResponses.forEach((res, i) => {
        console.log(`\n  Response ${i + 1}:`);
        console.log(`    Status: ${res.status}`);
        console.log(`    URL: ${res.url}`);
        if (res.body) {
          console.log(`    Body: ${JSON.stringify(res.body, null, 2)}`);
        }
      });
    }

    console.log('\n=== RESUMO FINAL ===');
    console.log(`Total de console logs: ${consoleLogs.length}`);
    console.log(`Total de erros: ${consoleErrors.length}`);
    console.log(`Total de requests HTTP: ${networkRequests.length}`);
    console.log(`Requests para API: ${apiRequests.length}`);
    console.log(`Screenshots salvos em: ${SCREENSHOTS_DIR}`);

    // Salvar logs em ficheiro
    const reportPath = path.join(SCREENSHOTS_DIR, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      consoleLogs,
      consoleErrors,
      networkRequests: apiRequests,
      networkResponses: apiResponses,
      summary: {
        totalLogs: consoleLogs.length,
        totalErrors: consoleErrors.length,
        totalRequests: networkRequests.length,
        apiRequests: apiRequests.length
      }
    }, null, 2));
    console.log(`\nRelatório completo salvo em: ${reportPath}`);

    // O teste passa sempre - só queremos capturar info
    expect(true).toBe(true);
  });
});
