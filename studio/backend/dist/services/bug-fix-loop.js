"use strict";
/**
 * DevForge V2 - Bug Fix Loop com Escalonamento Inteligente
 *
 * Iterações 1-3: Ollama (local, rápido, grátis)
 * Iterações 4-6: Claude Haiku (rápido, barato)
 * Iterações 7-10: Claude Sonnet (poderoso, caro)
 *
 * Re-run inteligente: apenas checks relevantes aos ficheiros alterados
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBugFixLoop = runBugFixLoop;
exports.runBatchBugFix = runBatchBugFix;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_CONFIG = {
    maxIterations: 10,
    ollamaModel: 'qwen2.5-coder:14b',
    ollamaEndpoint: 'http://localhost:11434',
};
// Mapeamento de checks para ficheiros afetados
const CHECK_TO_FILES_MAP = {
    'deploy-001': ['package.json', 'vercel.json', 'railway.json'],
    'deploy-002': ['.env', '.env.example'],
    'deploy-003': ['package.json', 'next.config.js', 'tsconfig.json'],
    'responsive-001': ['**/*.tsx', '**/*.css', 'tailwind.config.js'],
    'responsive-002': ['**/*.tsx', '**/*.css'],
    'db-001': ['prisma/schema.prisma', 'src/lib/db.ts', 'src/app/api/**/*.ts'],
    'auth-001': ['src/middleware.ts', 'src/app/api/auth/**/*.ts'],
    'forms-001': ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
    'buttons-001': ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
    'code-001': ['**/*.ts', '**/*.tsx'],
};
// ============================================================================
// BUG FIX LOOP
// ============================================================================
async function runBugFixLoop(bug, checks, config) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const attempts = [];
    let currentBug = bug;
    let fixed = false;
    for (let iteration = 1; iteration <= fullConfig.maxIterations; iteration++) {
        const model = selectModel(iteration);
        console.log(`\n[Iteration ${iteration}/${fullConfig.maxIterations}] Using ${model.toUpperCase()}...`);
        // Gerar fix
        const fixResult = await generateFix(currentBug, model, fullConfig);
        if (!fixResult) {
            console.log(`❌ ${model} falhou em gerar fix`);
            continue;
        }
        // Aplicar fix
        const filesChanged = await applyFix(fixResult, fullConfig.projectPath);
        console.log(`📝 Alterados ${filesChanged.length} ficheiros`);
        // Re-run apenas checks relevantes
        const relevantChecks = getRelevantChecks(filesChanged, checks);
        const validationResults = await rerunChecks(relevantChecks, fullConfig);
        // Verificar se bug foi corrigido
        const bugStillExists = validationResults.some(r => r.bugs.some(b => b.checkId === currentBug.checkId && b.severity === currentBug.severity));
        const attempt = {
            iteration,
            model,
            bug: currentBug,
            fixApplied: fixResult.diff,
            filesChanged,
            success: !bugStillExists,
            validationResults,
            timestamp: new Date(),
        };
        attempts.push(attempt);
        if (!bugStillExists) {
            console.log(`✅ Bug corrigido em ${iteration} iterações!`);
            fixed = true;
            break;
        }
        // Verificar se introduziu novos bugs
        const newBugs = validationResults.flatMap(r => r.bugs).filter(b => b.id !== currentBug.id);
        if (newBugs.length > 0) {
            console.log(`⚠️  Fix introduziu ${newBugs.length} novos bugs`);
            // Se introduziu bugs críticos, reverter
            const criticalNewBugs = newBugs.filter(b => b.severity === 'CRITICAL');
            if (criticalNewBugs.length > 0) {
                console.log(`🔄 Revertendo fix (introduziu bugs CRITICAL)`);
                revertChanges(filesChanged, fullConfig.projectPath);
                continue;
            }
        }
        console.log(`🔄 Bug ainda existe, tentando novamente...`);
    }
    const finalStatus = fixed ? 'fixed' :
        attempts.length >= fullConfig.maxIterations ? 'abandoned' :
            'escalated';
    return {
        bug,
        attempts,
        fixed,
        totalIterations: attempts.length,
        finalStatus,
    };
}
// ============================================================================
// MODEL SELECTION
// ============================================================================
function selectModel(iteration) {
    if (iteration <= 3)
        return 'ollama';
    if (iteration <= 6)
        return 'haiku';
    return 'sonnet';
}
async function generateFix(bug, model, config) {
    const prompt = buildFixPrompt(bug, config.projectPath);
    try {
        if (model === 'ollama') {
            return await generateFixOllama(prompt, config);
        }
        else {
            return await generateFixClaude(prompt, model, config);
        }
    }
    catch (error) {
        console.error(`Erro ao gerar fix com ${model}:`, error);
        return null;
    }
}
async function generateFixOllama(prompt, config) {
    try {
        const response = await fetch(`${config.ollamaEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollamaModel,
                prompt,
                stream: false,
            }),
        });
        if (!response.ok) {
            throw new Error(`Ollama retornou ${response.status}`);
        }
        const data = await response.json();
        const text = data.response;
        // Parsear resposta
        const diffMatch = text.match(/```diff\n([\s\S]*?)\n```/);
        const diff = diffMatch ? diffMatch[1] : text;
        return {
            diff,
            explanation: text,
            confidence: 0.7,
        };
    }
    catch (error) {
        console.error('Ollama error:', error);
        return null;
    }
}
async function generateFixClaude(prompt, model, config) {
    if (!config.claudeApiKey) {
        console.error('Claude API key não configurada');
        return null;
    }
    const anthropic = new sdk_1.default({ apiKey: config.claudeApiKey });
    const modelName = model === 'haiku' ? 'claude-3-5-haiku-20241022' : 'claude-3-5-sonnet-20241022';
    try {
        const message = await anthropic.messages.create({
            model: modelName,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const diffMatch = text.match(/```diff\n([\s\S]*?)\n```/);
        const diff = diffMatch ? diffMatch[1] : text;
        return {
            diff,
            explanation: text,
            confidence: model === 'sonnet' ? 0.95 : 0.85,
        };
    }
    catch (error) {
        console.error(`Claude ${model} error:`, error);
        return null;
    }
}
// ============================================================================
// FIX APPLICATION
// ============================================================================
async function applyFix(fix, projectPath) {
    const filesChanged = [];
    // Parsear diff e aplicar mudanças
    const diffLines = fix.diff.split('\n');
    let currentFile = null;
    let fileContent = [];
    let inDeletion = false;
    for (const line of diffLines) {
        // Detectar cabeçalho de ficheiro
        if (line.startsWith('--- ') || line.startsWith('+++ ')) {
            const match = line.match(/[ab]\/(.*)/);
            if (match) {
                const filePath = (0, path_1.join)(projectPath, match[1]);
                // Gravar ficheiro anterior se existir
                if (currentFile && fileContent.length > 0) {
                    (0, fs_1.writeFileSync)(currentFile, fileContent.join('\n'));
                    filesChanged.push(currentFile);
                }
                currentFile = filePath;
                if ((0, fs_1.existsSync)(filePath)) {
                    fileContent = (0, fs_1.readFileSync)(filePath, 'utf-8').split('\n');
                }
                else {
                    fileContent = [];
                }
            }
        }
        else if (line.startsWith('-') && !line.startsWith('---')) {
            // Linha removida
            const content = line.substring(1);
            const index = fileContent.indexOf(content);
            if (index !== -1) {
                fileContent.splice(index, 1);
            }
        }
        else if (line.startsWith('+') && !line.startsWith('+++')) {
            // Linha adicionada
            fileContent.push(line.substring(1));
        }
    }
    // Gravar último ficheiro
    if (currentFile && fileContent.length > 0) {
        (0, fs_1.writeFileSync)(currentFile, fileContent.join('\n'));
        filesChanged.push(currentFile);
    }
    return filesChanged;
}
// ============================================================================
// REVERT CHANGES
// ============================================================================
function revertChanges(files, projectPath) {
    try {
        (0, child_process_1.execSync)('git checkout HEAD -- ' + files.join(' '), {
            cwd: projectPath,
            stdio: 'pipe',
        });
    }
    catch (error) {
        console.error('Erro ao reverter mudanças:', error);
    }
}
// ============================================================================
// RELEVANT CHECKS
// ============================================================================
function getRelevantChecks(filesChanged, allChecks) {
    const relevantCheckIds = new Set();
    for (const file of filesChanged) {
        for (const [checkId, patterns] of Object.entries(CHECK_TO_FILES_MAP)) {
            if (patterns.some(pattern => fileMatchesPattern(file, pattern))) {
                relevantCheckIds.add(checkId);
            }
        }
    }
    return allChecks.filter(c => relevantCheckIds.has(c.id));
}
function fileMatchesPattern(file, pattern) {
    if (pattern.includes('**')) {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(file);
    }
    return file.includes(pattern);
}
// ============================================================================
// RE-RUN CHECKS
// ============================================================================
async function rerunChecks(checks, config) {
    const results = [];
    // Import validators dinamicamente
    const validators = await loadValidators();
    for (const check of checks) {
        const validator = validators[check.validator];
        if (!validator) {
            console.warn(`Validator ${check.validator} não encontrado`);
            continue;
        }
        try {
            const result = await validator(config.browser, config.projectPath, config.deployUrl);
            results.push(result);
        }
        catch (error) {
            console.error(`Erro ao executar ${check.validator}:`, error);
        }
    }
    return results;
}
async function loadValidators() {
    const modules = await Promise.all([
        Promise.resolve().then(() => __importStar(require('./validators/deploy-validators'))),
        Promise.resolve().then(() => __importStar(require('./validators/responsive-validators'))),
        Promise.resolve().then(() => __importStar(require('./validators/db-validators'))),
        Promise.resolve().then(() => __importStar(require('./validators/auth-validators'))),
        Promise.resolve().then(() => __importStar(require('./validators/form-validators'))),
        Promise.resolve().then(() => __importStar(require('./validators/button-validators'))),
        Promise.resolve().then(() => __importStar(require('./validators/code-validators'))),
    ]);
    const validators = {};
    for (const module of modules) {
        Object.assign(validators, module);
    }
    return validators;
}
// ============================================================================
// BUILD FIX PROMPT
// ============================================================================
function buildFixPrompt(bug, projectPath) {
    let prompt = `Você é um desenvolvedor expert. Corrija o seguinte bug:

**BUG ID:** ${bug.id}
**SEVERIDADE:** ${bug.severity}
**TÍTULO:** ${bug.title}
**DESCRIÇÃO:** ${bug.description}
**LOCALIZAÇÃO:** ${bug.location || 'N/A'}

`;
    if (bug.affectedFiles && bug.affectedFiles.length > 0) {
        prompt += `\n**FICHEIROS AFETADOS:**\n`;
        for (const file of bug.affectedFiles.slice(0, 3)) {
            if ((0, fs_1.existsSync)(file)) {
                const content = (0, fs_1.readFileSync)(file, 'utf-8');
                const lines = content.split('\n').slice(0, 100).join('\n');
                prompt += `\n### ${file}\n\`\`\`typescript\n${lines}\n\`\`\`\n`;
            }
        }
    }
    if (bug.stackTrace) {
        prompt += `\n**STACK TRACE:**\n\`\`\`\n${bug.stackTrace}\n\`\`\`\n`;
    }
    prompt += `\n**INSTRUÇÕES:**
1. Analise o bug e identifique a causa raiz
2. Gere um fix mínimo e preciso
3. Retorne o fix em formato diff
4. NÃO introduza novos bugs
5. Mantenha o estilo de código existente

Retorne APENAS o diff no formato:

\`\`\`diff
--- a/caminho/ficheiro.ts
+++ b/caminho/ficheiro.ts
@@ -10,3 +10,3 @@
-código antigo
+código novo
\`\`\`
`;
    return prompt;
}
// ============================================================================
// BATCH FIX
// ============================================================================
async function runBatchBugFix(bugs, checks, config) {
    const results = [];
    // Ordenar por severidade
    const sortedBugs = [...bugs].sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
    for (const bug of sortedBugs) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Corrigindo: ${bug.title}`);
        console.log(`${'='.repeat(60)}`);
        const result = await runBugFixLoop(bug, checks, config);
        results.push(result);
        if (result.fixed) {
            console.log(`✅ ${bug.title} foi corrigido`);
        }
        else {
            console.log(`❌ ${bug.title} não foi corrigido após ${result.totalIterations} tentativas`);
        }
    }
    return results;
}
