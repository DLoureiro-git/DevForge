"use strict";
/**
 * Code Validators - Categoria G: Qualidade de Código
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImports = validateImports;
exports.validateTypeScript = validateTypeScript;
exports.validateNoHardcodedSecrets = validateNoHardcodedSecrets;
exports.validateNoConsoleLogs = validateNoConsoleLogs;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
// ============================================================================
// G1: IMPORTS VALIDATION
// ============================================================================
async function validateImports(browser, projectPath) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'code-001';
    try {
        // Procurar ficheiros .ts, .tsx, .js, .jsx
        const codeFiles = findCodeFiles(projectPath);
        const brokenImports = [];
        for (const file of codeFiles) {
            const content = (0, fs_1.readFileSync)(file, 'utf-8');
            // Regex para imports
            const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
            let match;
            const fileImports = [];
            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                // Ignorar imports de node_modules
                if (!importPath.startsWith('.') && !importPath.startsWith('/'))
                    continue;
                // Resolver caminho relativo
                const resolvedPath = resolveImportPath(file, importPath);
                if (!(0, fs_1.existsSync)(resolvedPath)) {
                    fileImports.push(importPath);
                }
            }
            if (fileImports.length > 0) {
                brokenImports.push({
                    file: file.replace(projectPath, ''),
                    imports: fileImports,
                });
            }
        }
        if (brokenImports.length > 0) {
            bugs.push({
                id: `${checkId}-broken-imports`,
                checkId,
                severity: 'CRITICAL',
                title: `${brokenImports.length} ficheiros com imports quebrados`,
                description: JSON.stringify(brokenImports.slice(0, 10), null, 2),
                location: projectPath,
                affectedFiles: brokenImports.map(b => (0, path_1.join)(projectPath, b.file)),
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
            title: 'Exceção ao validar imports',
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
// G2: TYPESCRIPT VALIDATION
// ============================================================================
async function validateTypeScript(browser, projectPath) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'code-002';
    try {
        const tsconfigPath = (0, path_1.join)(projectPath, 'tsconfig.json');
        if (!(0, fs_1.existsSync)(tsconfigPath)) {
            bugs.push({
                id: `${checkId}-no-tsconfig`,
                checkId,
                severity: 'MEDIUM',
                title: 'tsconfig.json não existe',
                description: 'Projeto TypeScript sem configuração',
                location: tsconfigPath,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: true, // não é erro se não usa TS
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        // Executar tsc --noEmit
        try {
            (0, child_process_1.execSync)('npx tsc --noEmit', {
                cwd: projectPath,
                timeout: 60000,
                stdio: 'pipe',
            });
        }
        catch (error) {
            const stderr = error.stderr?.toString() || '';
            const stdout = error.stdout?.toString() || '';
            const output = stderr || stdout;
            if (output.includes('error TS')) {
                // Parsear erros
                const errorLines = output.split('\n').filter(l => l.includes('error TS'));
                bugs.push({
                    id: `${checkId}-tsc-errors`,
                    checkId,
                    severity: 'HIGH',
                    title: `${errorLines.length} erros de TypeScript`,
                    description: errorLines.slice(0, 20).join('\n'),
                    location: projectPath,
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
        }
        // Verificar se strict mode está ativo
        const tsconfigContent = JSON.parse((0, fs_1.readFileSync)(tsconfigPath, 'utf-8'));
        if (!tsconfigContent.compilerOptions?.strict) {
            bugs.push({
                id: `${checkId}-no-strict`,
                checkId,
                severity: 'MEDIUM',
                title: 'TypeScript strict mode não ativo',
                description: 'Recomendado ativar strict para maior segurança de tipos',
                location: tsconfigPath,
                affectedFiles: [tsconfigPath],
                reproducible: true,
                foundAt: new Date(),
            });
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'HIGH',
            title: 'Exceção ao validar TypeScript',
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
// G3: NO HARDCODED SECRETS
// ============================================================================
async function validateNoHardcodedSecrets(browser, projectPath) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'code-003';
    try {
        const codeFiles = findCodeFiles(projectPath);
        const secretPatterns = [
            /sk_live_[a-zA-Z0-9]{24,}/g, // Stripe live key
            /sk_test_[a-zA-Z0-9]{24,}/g, // Stripe test key
            /AIza[a-zA-Z0-9_-]{35}/g, // Google API key
            /[a-zA-Z0-9]{32,}@[a-zA-Z0-9]{32,}/g, // Supabase keys
            /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access token
            /postgres:\/\/[^\s]+@/g, // Database URLs with credentials
        ];
        const secretsFound = [];
        for (const file of codeFiles) {
            // Ignorar node_modules
            if (file.includes('node_modules'))
                continue;
            const content = (0, fs_1.readFileSync)(file, 'utf-8');
            const fileSecrets = [];
            for (const pattern of secretPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    fileSecrets.push(...matches.map(m => m.substring(0, 20) + '...'));
                }
            }
            // Verificar strings suspeitas
            const suspiciousPatterns = [
                /password\s*=\s*['"][^'"]{8,}['"]/gi,
                /api_key\s*=\s*['"][^'"]{20,}['"]/gi,
                /secret\s*=\s*['"][^'"]{20,}['"]/gi,
            ];
            for (const pattern of suspiciousPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    fileSecrets.push(...matches);
                }
            }
            if (fileSecrets.length > 0) {
                secretsFound.push({
                    file: file.replace(projectPath, ''),
                    secrets: fileSecrets,
                });
            }
        }
        if (secretsFound.length > 0) {
            bugs.push({
                id: `${checkId}-hardcoded-secrets`,
                checkId,
                severity: 'CRITICAL',
                title: `${secretsFound.length} ficheiros com possíveis segredos hardcoded`,
                description: JSON.stringify(secretsFound, null, 2),
                location: projectPath,
                affectedFiles: secretsFound.map(s => (0, path_1.join)(projectPath, s.file)),
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
            title: 'Exceção ao validar segredos hardcoded',
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
// G4: NO CONSOLE.LOG IN PRODUCTION
// ============================================================================
async function validateNoConsoleLogs(browser, projectPath) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'code-004';
    try {
        const codeFiles = findCodeFiles(projectPath);
        const filesWithConsole = [];
        for (const file of codeFiles) {
            // Ignorar node_modules, tests, dev files
            if (file.includes('node_modules') ||
                file.includes('.test.') ||
                file.includes('.spec.') ||
                file.includes('dev.')) {
                continue;
            }
            const content = (0, fs_1.readFileSync)(file, 'utf-8');
            const consoleMatches = content.match(/console\.(log|warn|error|debug|info)\(/g);
            if (consoleMatches && consoleMatches.length > 0) {
                filesWithConsole.push({
                    file: file.replace(projectPath, ''),
                    count: consoleMatches.length,
                });
            }
        }
        if (filesWithConsole.length > 5) {
            bugs.push({
                id: `${checkId}-console-logs`,
                checkId,
                severity: 'MEDIUM',
                title: `${filesWithConsole.length} ficheiros com console.log`,
                description: `Total: ${filesWithConsole.reduce((acc, f) => acc + f.count, 0)} console statements\n\n${JSON.stringify(filesWithConsole.slice(0, 10), null, 2)}`,
                location: projectPath,
                affectedFiles: filesWithConsole.slice(0, 20).map(f => (0, path_1.join)(projectPath, f.file)),
                reproducible: true,
                foundAt: new Date(),
            });
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'MEDIUM',
            title: 'Exceção ao validar console.logs',
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
// UTILITIES
// ============================================================================
function findCodeFiles(dir, files = []) {
    try {
        const items = (0, fs_1.readdirSync)(dir);
        for (const item of items) {
            const fullPath = (0, path_1.join)(dir, item);
            // Ignorar pastas
            if (item === 'node_modules' || item === '.next' || item === 'dist' || item === 'build' || item === '.git') {
                continue;
            }
            const stat = (0, fs_1.statSync)(fullPath);
            if (stat.isDirectory()) {
                findCodeFiles(fullPath, files);
            }
            else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
                files.push(fullPath);
            }
        }
    }
    catch {
        // Ignorar erros de permissão
    }
    return files;
}
function resolveImportPath(currentFile, importPath) {
    const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
    let resolved = (0, path_1.join)(currentDir, importPath);
    // Tentar com extensões
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    for (const ext of extensions) {
        const fullPath = resolved + ext;
        if ((0, fs_1.existsSync)(fullPath)) {
            return fullPath;
        }
    }
    return resolved;
}
