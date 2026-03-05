/**
 * Deploy Validators - Categoria A: Deploy & Infraestrutura
 */

import type { Browser } from 'playwright';
import type { Bug, ValidationResult } from '../qa-engine';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// A1: DEPLOY PRODUÇÃO
// ============================================================================

export async function validateDeploy(
  browser: Browser,
  projectPath: string,
  deployUrl?: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const bugs: Bug[] = [];
  const checkId = 'deploy-001';

  if (!deployUrl) {
    bugs.push({
      id: `${checkId}-no-url`,
      checkId,
      severity: 'CRITICAL',
      title: 'URL de deploy não fornecida',
      description: 'Não foi possível verificar o deploy sem URL',
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
    const response = await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });

    if (!response) {
      bugs.push({
        id: `${checkId}-no-response`,
        checkId,
        severity: 'CRITICAL',
        title: 'Deploy não responde',
        description: `URL ${deployUrl} não retornou resposta`,
        location: deployUrl,
        reproducible: true,
        foundAt: new Date(),
      });
    } else if (response.status() >= 500) {
      bugs.push({
        id: `${checkId}-5xx`,
        checkId,
        severity: 'CRITICAL',
        title: `Deploy retorna ${response.status()}`,
        description: `Erro de servidor ao acessar ${deployUrl}`,
        location: deployUrl,
        screenshot: (await page.screenshot({ fullPage: false })).toString("base64"),
        reproducible: true,
        foundAt: new Date(),
      });
    } else if (response.status() === 404) {
      bugs.push({
        id: `${checkId}-404`,
        checkId,
        severity: 'CRITICAL',
        title: 'Deploy retorna 404',
        description: `Página não encontrada em ${deployUrl}`,
        location: deployUrl,
        reproducible: true,
        foundAt: new Date(),
      });
    }

    // Verificar se carregou conteúdo
    const bodyText = await page.textContent('body');
    if (!bodyText || bodyText.trim().length === 0) {
      bugs.push({
        id: `${checkId}-empty`,
        checkId,
        severity: 'CRITICAL',
        title: 'Deploy retorna página vazia',
        description: 'O body da página está vazio',
        location: deployUrl,
        screenshot: (await page.screenshot({ fullPage: false })).toString("base64"),
        reproducible: true,
        foundAt: new Date(),
      });
    }

    // Verificar erros de console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      bugs.push({
        id: `${checkId}-console-errors`,
        checkId,
        severity: 'HIGH',
        title: `${consoleErrors.length} erros de console detectados`,
        description: consoleErrors.slice(0, 5).join('\n'),
        location: deployUrl,
        reproducible: true,
        foundAt: new Date(),
      });
    }

  } catch (error) {
    bugs.push({
      id: `${checkId}-exception`,
      checkId,
      severity: 'CRITICAL',
      title: 'Exceção ao acessar deploy',
      description: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      location: deployUrl,
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
// A2: VARIÁVEIS DE AMBIENTE
// ============================================================================

export async function validateEnvVars(
  browser: Browser,
  projectPath: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const bugs: Bug[] = [];
  const checkId = 'deploy-002';

  const envExamplePath = join(projectPath, '.env.example');
  const envPath = join(projectPath, '.env');

  if (!existsSync(envExamplePath)) {
    bugs.push({
      id: `${checkId}-no-example`,
      checkId,
      severity: 'MEDIUM',
      title: 'Ficheiro .env.example não existe',
      description: 'Recomendado para documentar variáveis necessárias',
      location: envExamplePath,
      reproducible: true,
      foundAt: new Date(),
    });
  }

  if (!existsSync(envPath)) {
    bugs.push({
      id: `${checkId}-no-env`,
      checkId,
      severity: 'CRITICAL',
      title: 'Ficheiro .env não existe',
      description: 'Variáveis de ambiente não configuradas',
      location: envPath,
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

  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));

  // Verificar se há variáveis vazias
  const emptyVars = envLines.filter(line => {
    const [key, value] = line.split('=');
    return key && (!value || value.trim() === '' || value.trim() === '""' || value.trim() === "''");
  });

  if (emptyVars.length > 0) {
    bugs.push({
      id: `${checkId}-empty-vars`,
      checkId,
      severity: 'HIGH',
      title: `${emptyVars.length} variáveis de ambiente vazias`,
      description: emptyVars.join('\n'),
      location: envPath,
      reproducible: true,
      foundAt: new Date(),
    });
  }

  // Verificar variáveis críticas comuns
  const criticalVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingCritical = criticalVars.filter(varName => {
    return !envLines.some(line => line.startsWith(`${varName}=`));
  });

  if (missingCritical.length > 0) {
    bugs.push({
      id: `${checkId}-missing-critical`,
      checkId,
      severity: 'HIGH',
      title: `${missingCritical.length} variáveis críticas em falta`,
      description: `Variáveis em falta: ${missingCritical.join(', ')}`,
      location: envPath,
      reproducible: true,
      foundAt: new Date(),
    });
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
// A3: BUILD PRODUÇÃO
// ============================================================================

export async function validateBuildSuccess(
  browser: Browser,
  projectPath: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const bugs: Bug[] = [];
  const checkId = 'deploy-003';

  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      bugs.push({
        id: `${checkId}-no-package-json`,
        checkId,
        severity: 'CRITICAL',
        title: 'package.json não encontrado',
        description: 'Projeto não tem package.json',
        location: packageJsonPath,
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

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const buildCommand = packageJson.scripts?.build;

    if (!buildCommand) {
      bugs.push({
        id: `${checkId}-no-build-script`,
        checkId,
        severity: 'CRITICAL',
        title: 'Script de build não existe',
        description: 'package.json não tem script "build"',
        location: packageJsonPath,
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

    // Tentar executar build (timeout 5min)
    try {
      execSync('npm run build', {
        cwd: projectPath,
        timeout: 300000,
        stdio: 'pipe',
      });
    } catch (error: any) {
      bugs.push({
        id: `${checkId}-build-failed`,
        checkId,
        severity: 'CRITICAL',
        title: 'Build de produção falhou',
        description: error.stderr?.toString() || error.message,
        stackTrace: error.stack,
        location: projectPath,
        reproducible: true,
        foundAt: new Date(),
      });
    }

  } catch (error) {
    bugs.push({
      id: `${checkId}-exception`,
      checkId,
      severity: 'CRITICAL',
      title: 'Exceção ao validar build',
      description: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      reproducible: true,
      foundAt: new Date(),
    });
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
// A4: FULL-STACK INTEGRATION
// ============================================================================

export async function validateFullStack(
  browser: Browser,
  projectPath: string,
  deployUrl?: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const bugs: Bug[] = [];
  const checkId = 'deploy-004';

  if (!deployUrl) {
    bugs.push({
      id: `${checkId}-no-url`,
      checkId,
      severity: 'CRITICAL',
      title: 'URL de deploy não fornecida',
      description: 'Impossível testar integração full-stack',
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
    // Interceptar requests para detectar falhas de API
    const failedRequests: { url: string; status: number }[] = [];

    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Filtrar apenas requests de API (não assets)
    const apiFailures = failedRequests.filter(req =>
      req.url.includes('/api/') || req.url.includes('/trpc/')
    );

    if (apiFailures.length > 0) {
      bugs.push({
        id: `${checkId}-api-failures`,
        checkId,
        severity: 'CRITICAL',
        title: `${apiFailures.length} requests de API falharam`,
        description: apiFailures.map(r => `${r.status} - ${r.url}`).join('\n'),
        location: deployUrl,
        reproducible: true,
        foundAt: new Date(),
      });
    }

    // Verificar se há erros de rede
    const networkErrors: string[] = [];
    page.on('requestfailed', request => {
      networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.waitForTimeout(1000);

    if (networkErrors.length > 0) {
      bugs.push({
        id: `${checkId}-network-errors`,
        checkId,
        severity: 'HIGH',
        title: `${networkErrors.length} erros de rede`,
        description: networkErrors.slice(0, 5).join('\n'),
        location: deployUrl,
        reproducible: true,
        foundAt: new Date(),
      });
    }

  } catch (error) {
    bugs.push({
      id: `${checkId}-exception`,
      checkId,
      severity: 'CRITICAL',
      title: 'Exceção ao validar full-stack',
      description: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      location: deployUrl,
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
