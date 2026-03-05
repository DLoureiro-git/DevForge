"use strict";
/**
 * Database Validators - Categoria C: Database & Persistência
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDataPersistence = validateDataPersistence;
exports.validateConcurrentWrites = validateConcurrentWrites;
exports.validateMigrations = validateMigrations;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
// ============================================================================
// C1: DATA PERSISTENCE
// ============================================================================
async function validateDataPersistence(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'db-001';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'CRITICAL',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar persistência',
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
        // Procurar por formulários para testar persistência
        const forms = await page.$$('form');
        if (forms.length === 0) {
            // Se não há formulários, testar pelo menos localStorage/cookies
            const hasStorage = await page.evaluate(() => {
                try {
                    localStorage.setItem('__qa_test__', 'test');
                    const value = localStorage.getItem('__qa_test__');
                    localStorage.removeItem('__qa_test__');
                    return value === 'test';
                }
                catch {
                    return false;
                }
            });
            if (!hasStorage) {
                bugs.push({
                    id: `${checkId}-no-storage`,
                    checkId,
                    severity: 'MEDIUM',
                    title: 'localStorage não funciona',
                    description: 'Impossível testar persistência de dados',
                    location: deployUrl,
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
        // Testar primeiro formulário encontrado
        const firstForm = forms[0];
        // Encontrar inputs
        const inputs = await firstForm.$$('input[type="text"], input[type="email"], input[type="number"], textarea');
        if (inputs.length === 0) {
            bugs.push({
                id: `${checkId}-no-inputs`,
                checkId,
                severity: 'MEDIUM',
                title: 'Formulário sem inputs testáveis',
                description: 'Impossível testar persistência via formulário',
                location: deployUrl,
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
        // Preencher primeiro input
        const testValue = `QA_Test_${Date.now()}`;
        await inputs[0].fill(testValue);
        // Procurar botão de submit
        const submitButton = await firstForm.$('button[type="submit"], input[type="submit"]');
        if (!submitButton) {
            bugs.push({
                id: `${checkId}-no-submit`,
                checkId,
                severity: 'MEDIUM',
                title: 'Formulário sem botão de submit',
                description: 'Impossível testar persistência',
                location: deployUrl,
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
        // Interceptar requests
        const apiCalls = [];
        page.on('response', response => {
            const url = response.url();
            if (url.includes('/api/') || url.includes('/trpc/')) {
                apiCalls.push({
                    url,
                    method: response.request().method(),
                    status: response.status(),
                });
            }
        });
        // Submeter formulário
        await submitButton.click();
        await page.waitForTimeout(3000);
        // Verificar se houve chamada de API
        if (apiCalls.length === 0) {
            bugs.push({
                id: `${checkId}-no-api-call`,
                checkId,
                severity: 'HIGH',
                title: 'Submit de formulário não fez chamada de API',
                description: 'Dados podem não estar a ser persistidos',
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
        }
        else {
            // Verificar se alguma falhou
            const failedCalls = apiCalls.filter(c => c.status >= 400);
            if (failedCalls.length > 0) {
                bugs.push({
                    id: `${checkId}-api-failed`,
                    checkId,
                    severity: 'CRITICAL',
                    title: `${failedCalls.length} chamadas de API falharam`,
                    description: JSON.stringify(failedCalls, null, 2),
                    location: deployUrl,
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'CRITICAL',
            title: 'Exceção ao testar persistência',
            description: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack : undefined,
            reproducible: true,
            foundAt: new Date(),
        });
    }
    finally {
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
// C2: CONCURRENT WRITES
// ============================================================================
async function validateConcurrentWrites(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'db-002';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'HIGH',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar concurrent writes',
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
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    try {
        await page1.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
        await page2.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
        // Procurar formulários em ambas as páginas
        const forms1 = await page1.$$('form');
        const forms2 = await page2.$$('form');
        if (forms1.length === 0 || forms2.length === 0) {
            bugs.push({
                id: `${checkId}-no-forms`,
                checkId,
                severity: 'MEDIUM',
                title: 'Sem formulários para testar concurrent writes',
                description: 'Teste não aplicável a este projeto',
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: true, // não é falha crítica se não há formulários
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        // Simular submissões simultâneas
        const inputs1 = await forms1[0].$$('input[type="text"], input[type="email"], textarea');
        const inputs2 = await forms2[0].$$('input[type="text"], input[type="email"], textarea');
        if (inputs1.length > 0 && inputs2.length > 0) {
            const testValue1 = `QA_Concurrent_A_${Date.now()}`;
            const testValue2 = `QA_Concurrent_B_${Date.now()}`;
            await inputs1[0].fill(testValue1);
            await inputs2[0].fill(testValue2);
            const submit1 = await forms1[0].$('button[type="submit"], input[type="submit"]');
            const submit2 = await forms2[0].$('button[type="submit"], input[type="submit"]');
            if (submit1 && submit2) {
                // Track API calls
                const apiCalls = [];
                page1.on('response', response => {
                    const url = response.url();
                    if (url.includes('/api/') || url.includes('/trpc/')) {
                        apiCalls.push({ page: 'page1', url, status: response.status() });
                    }
                });
                page2.on('response', response => {
                    const url = response.url();
                    if (url.includes('/api/') || url.includes('/trpc/')) {
                        apiCalls.push({ page: 'page2', url, status: response.status() });
                    }
                });
                // Submit simultaneamente
                await Promise.all([submit1.click(), submit2.click()]);
                await page1.waitForTimeout(3000);
                // Verificar se ambos sucederam
                const page1Calls = apiCalls.filter(c => c.page === 'page1');
                const page2Calls = apiCalls.filter(c => c.page === 'page2');
                const page1Failed = page1Calls.some(c => c.status >= 400);
                const page2Failed = page2Calls.some(c => c.status >= 400);
                if (page1Failed || page2Failed) {
                    bugs.push({
                        id: `${checkId}-concurrent-failed`,
                        checkId,
                        severity: 'HIGH',
                        title: 'Writes concorrentes falharam',
                        description: 'Uma ou ambas as submissões simultâneas falharam',
                        location: deployUrl,
                        reproducible: true,
                        foundAt: new Date(),
                    });
                }
            }
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'HIGH',
            title: 'Exceção ao testar concurrent writes',
            description: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack : undefined,
            reproducible: true,
            foundAt: new Date(),
        });
    }
    finally {
        await page1.close();
        await page2.close();
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
// C3: MIGRATIONS
// ============================================================================
async function validateMigrations(browser, projectPath) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'db-003';
    try {
        // Verificar se Prisma existe
        const schemaPath = (0, path_1.join)(projectPath, 'prisma', 'schema.prisma');
        const migrationsPath = (0, path_1.join)(projectPath, 'prisma', 'migrations');
        if (!(0, fs_1.existsSync)(schemaPath)) {
            bugs.push({
                id: `${checkId}-no-schema`,
                checkId,
                severity: 'MEDIUM',
                title: 'Ficheiro schema.prisma não existe',
                description: 'Projeto pode não usar Prisma',
                location: schemaPath,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: true, // não é erro se não usa Prisma
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        // Verificar se há migrations
        if (!(0, fs_1.existsSync)(migrationsPath)) {
            bugs.push({
                id: `${checkId}-no-migrations`,
                checkId,
                severity: 'HIGH',
                title: 'Pasta de migrations não existe',
                description: 'Schema pode não estar sincronizado com DB',
                location: migrationsPath,
                reproducible: true,
                foundAt: new Date(),
            });
        }
        // Tentar executar prisma migrate status
        try {
            (0, child_process_1.execSync)('npx prisma migrate status', {
                cwd: projectPath,
                timeout: 30000,
                stdio: 'pipe',
            });
        }
        catch (error) {
            const stderr = error.stderr?.toString() || '';
            if (stderr.includes('pending') || stderr.includes('not applied')) {
                bugs.push({
                    id: `${checkId}-pending-migrations`,
                    checkId,
                    severity: 'CRITICAL',
                    title: 'Migrations pendentes não aplicadas',
                    description: stderr,
                    location: projectPath,
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
            else if (stderr.includes('error') || stderr.includes('failed')) {
                bugs.push({
                    id: `${checkId}-migration-error`,
                    checkId,
                    severity: 'CRITICAL',
                    title: 'Erro ao verificar migrations',
                    description: stderr,
                    location: projectPath,
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
        }
        // Verificar schema.prisma para problemas comuns
        const schemaContent = (0, fs_1.readFileSync)(schemaPath, 'utf-8');
        if (!schemaContent.includes('provider')) {
            bugs.push({
                id: `${checkId}-no-provider`,
                checkId,
                severity: 'CRITICAL',
                title: 'Schema sem provider de database',
                description: 'schema.prisma não define provider',
                location: schemaPath,
                affectedFiles: [schemaPath],
                reproducible: true,
                foundAt: new Date(),
            });
        }
        if (!schemaContent.includes('model ')) {
            bugs.push({
                id: `${checkId}-no-models`,
                checkId,
                severity: 'HIGH',
                title: 'Schema sem models',
                description: 'schema.prisma não define nenhum model',
                location: schemaPath,
                affectedFiles: [schemaPath],
                reproducible: true,
                foundAt: new Date(),
            });
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'CRITICAL',
            title: 'Exceção ao validar migrations',
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
