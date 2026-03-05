"use strict";
/**
 * DEPLOY SERVICE — Deploy Automático
 *
 * Suporta:
 * - Vercel (frontend + API)
 * - Railway (database + backend se necessário)
 * - GitHub repo creation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployService = void 0;
exports.deployToVercel = deployToVercel;
exports.deployToRailway = deployToRailway;
exports.createGitHubRepo = createGitHubRepo;
exports.deployComplete = deployComplete;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
// ============================================================================
// DEPLOY SERVICE
// ============================================================================
class DeployService {
    logs = [];
    /**
     * Deploy para Vercel
     */
    async deployToVercel(config) {
        this.logs = [];
        try {
            this.log('🚀 Iniciando deploy para Vercel...');
            // Verificar se Vercel CLI está instalado
            try {
                (0, child_process_1.execSync)('vercel --version', { stdio: 'pipe' });
            }
            catch {
                throw new Error('Vercel CLI não instalado. Executar: npm i -g vercel');
            }
            // Criar .env.production.local com env vars
            const envPath = (0, path_1.join)(config.projectPath, '.env.production.local');
            const envContent = Object.entries(config.envVars)
                .map(([key, value]) => `${key}="${value}"`)
                .join('\n');
            (0, fs_1.writeFileSync)(envPath, envContent, 'utf-8');
            this.log('✅ Variáveis de ambiente configuradas');
            // Deploy com Vercel CLI
            this.log('📦 Executando deploy...');
            const deployCmd = config.vercelToken
                ? `vercel --prod --token=${config.vercelToken} --yes`
                : `vercel --prod --yes`;
            const output = (0, child_process_1.execSync)(deployCmd, {
                cwd: config.projectPath,
                encoding: 'utf-8'
            });
            // Extrair URL do output
            const urlMatch = output.match(/https:\/\/[^\s]+/);
            const url = urlMatch ? urlMatch[0] : undefined;
            if (!url) {
                throw new Error('Não foi possível obter URL de deployment');
            }
            this.log(`✅ Deploy completo: ${url}`);
            // Configurar env vars via Vercel API se tiver token
            if (config.vercelToken) {
                await this.configureVercelEnvVars(config, url);
            }
            return {
                success: true,
                platform: 'vercel',
                url,
                logs: this.logs
            };
        }
        catch (error) {
            this.log(`❌ Erro no deploy: ${error instanceof Error ? error.message : String(error)}`);
            return {
                success: false,
                platform: 'vercel',
                error: error instanceof Error ? error.message : String(error),
                logs: this.logs
            };
        }
    }
    /**
     * Deploy para Railway
     */
    async deployToRailway(config) {
        this.logs = [];
        try {
            this.log('🚀 Iniciando deploy para Railway...');
            // Verificar Railway CLI
            try {
                (0, child_process_1.execSync)('railway --version', { stdio: 'pipe' });
            }
            catch {
                throw new Error('Railway CLI não instalado. Executar: npm i -g @railway/cli');
            }
            // Login (se tiver token)
            if (config.railwayToken) {
                (0, child_process_1.execSync)(`railway login --token ${config.railwayToken}`, {
                    cwd: config.projectPath,
                    stdio: 'pipe'
                });
                this.log('✅ Autenticado no Railway');
            }
            // Criar projecto
            const projectName = config.projectName.toLowerCase().replace(/\s+/g, '-');
            (0, child_process_1.execSync)(`railway init -n ${projectName}`, {
                cwd: config.projectPath,
                stdio: 'pipe'
            });
            this.log(`✅ Projecto "${projectName}" criado`);
            // Adicionar PostgreSQL
            (0, child_process_1.execSync)('railway add --database postgresql', {
                cwd: config.projectPath,
                stdio: 'pipe'
            });
            this.log('✅ PostgreSQL adicionado');
            // Configurar env vars
            for (const [key, value] of Object.entries(config.envVars)) {
                (0, child_process_1.execSync)(`railway variables set ${key}="${value}"`, {
                    cwd: config.projectPath,
                    stdio: 'pipe'
                });
            }
            this.log('✅ Variáveis de ambiente configuradas');
            // Deploy
            this.log('📦 Executando deploy...');
            const output = (0, child_process_1.execSync)('railway up --detach', {
                cwd: config.projectPath,
                encoding: 'utf-8'
            });
            // Obter URL do deployment
            const urlOutput = (0, child_process_1.execSync)('railway domain', {
                cwd: config.projectPath,
                encoding: 'utf-8'
            });
            const urlMatch = urlOutput.match(/https:\/\/[^\s]+/);
            const url = urlMatch ? urlMatch[0] : undefined;
            this.log(`✅ Deploy completo${url ? `: ${url}` : ''}`);
            return {
                success: true,
                platform: 'railway',
                url,
                logs: this.logs
            };
        }
        catch (error) {
            this.log(`❌ Erro no deploy: ${error instanceof Error ? error.message : String(error)}`);
            return {
                success: false,
                platform: 'railway',
                error: error instanceof Error ? error.message : String(error),
                logs: this.logs
            };
        }
    }
    /**
     * Criar repositório GitHub
     */
    async createGitHubRepo(config) {
        this.logs = [];
        try {
            this.log('🚀 Criando repositório GitHub...');
            if (!config.githubToken) {
                throw new Error('GitHub token não fornecido');
            }
            const repoName = config.projectName.toLowerCase().replace(/\s+/g, '-');
            // Criar repo via GitHub API
            const response = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    name: repoName,
                    description: config.projectName,
                    private: false,
                    auto_init: false
                })
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`GitHub API error: ${error}`);
            }
            const data = await response.json();
            const repoUrl = data.html_url;
            const gitUrl = data.clone_url;
            this.log(`✅ Repositório criado: ${repoUrl}`);
            // Inicializar git local
            this.log('📝 Inicializando git local...');
            try {
                (0, child_process_1.execSync)('git init', { cwd: config.projectPath, stdio: 'pipe' });
                (0, child_process_1.execSync)('git add .', { cwd: config.projectPath, stdio: 'pipe' });
                (0, child_process_1.execSync)('git commit -m "Initial commit from DevForge V2"', {
                    cwd: config.projectPath,
                    stdio: 'pipe'
                });
                (0, child_process_1.execSync)(`git branch -M main`, { cwd: config.projectPath, stdio: 'pipe' });
                (0, child_process_1.execSync)(`git remote add origin ${gitUrl}`, {
                    cwd: config.projectPath,
                    stdio: 'pipe'
                });
                // Configurar credenciais para push
                const authenticatedUrl = gitUrl.replace('https://', `https://${config.githubToken}@`);
                (0, child_process_1.execSync)(`git push -u origin main`, {
                    cwd: config.projectPath,
                    stdio: 'pipe',
                    env: {
                        ...process.env,
                        GIT_ASKPASS: 'echo',
                        GIT_USERNAME: 'x-access-token',
                        GIT_PASSWORD: config.githubToken
                    }
                });
                this.log('✅ Código enviado para GitHub');
            }
            catch (gitError) {
                this.log(`⚠️  Erro ao fazer push: ${gitError instanceof Error ? gitError.message : String(gitError)}`);
            }
            return {
                success: true,
                platform: 'github',
                repoUrl,
                logs: this.logs
            };
        }
        catch (error) {
            this.log(`❌ Erro ao criar repositório: ${error instanceof Error ? error.message : String(error)}`);
            return {
                success: false,
                platform: 'github',
                error: error instanceof Error ? error.message : String(error),
                logs: this.logs
            };
        }
    }
    /**
     * Deploy completo (GitHub + Vercel + Railway)
     */
    async deployComplete(config) {
        const results = { success: true };
        // 1. Criar GitHub repo (se tiver token)
        if (config.githubToken) {
            results.github = await this.createGitHubRepo(config);
            if (!results.github.success) {
                results.success = false;
            }
        }
        // 2. Deploy Vercel (se tiver token)
        if (config.vercelToken) {
            results.vercel = await this.deployToVercel(config);
            if (!results.vercel.success) {
                results.success = false;
            }
        }
        // 3. Deploy Railway database (se tiver token)
        if (config.railwayToken) {
            results.railway = await this.deployToRailway(config);
            if (!results.railway.success) {
                results.success = false;
            }
        }
        return results;
    }
    /**
     * Configurar env vars via Vercel API
     */
    async configureVercelEnvVars(config, deployUrl) {
        if (!config.vercelToken)
            return;
        this.log('🔐 Configurando variáveis de ambiente no Vercel...');
        // Extrair project ID do deployment URL
        const projectName = config.projectName.toLowerCase().replace(/\s+/g, '-');
        for (const [key, value] of Object.entries(config.envVars)) {
            try {
                await fetch(`https://api.vercel.com/v10/projects/${projectName}/env`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.vercelToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        key,
                        value,
                        type: 'encrypted',
                        target: ['production', 'preview', 'development']
                    })
                });
            }
            catch (error) {
                this.log(`⚠️  Erro ao configurar ${key}: ${error}`);
            }
        }
        this.log('✅ Variáveis de ambiente configuradas via API');
    }
    /**
     * Logging helper
     */
    log(message) {
        this.logs.push(message);
        console.log(message);
    }
}
exports.DeployService = DeployService;
/**
 * Helpers standalone
 */
async function deployToVercel(config) {
    const service = new DeployService();
    return service.deployToVercel(config);
}
async function deployToRailway(config) {
    const service = new DeployService();
    return service.deployToRailway(config);
}
async function createGitHubRepo(config) {
    const service = new DeployService();
    return service.createGitHubRepo(config);
}
async function deployComplete(config) {
    const service = new DeployService();
    return service.deployComplete(config);
}
