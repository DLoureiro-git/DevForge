/**
 * DEPLOY SERVICE — Deploy Automático
 *
 * Suporta:
 * - Vercel (frontend + API)
 * - Railway (database + backend se necessário)
 * - GitHub repo creation
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// ============================================================================
// TYPES
// ============================================================================

export interface DeployConfig {
  projectPath: string
  projectName: string
  envVars: Record<string, string>
  githubToken?: string
  vercelToken?: string
  railwayToken?: string
}

export interface DeployResult {
  success: boolean
  platform: 'vercel' | 'railway' | 'github'
  url?: string
  repoUrl?: string
  error?: string
  logs: string[]
}

// ============================================================================
// DEPLOY SERVICE
// ============================================================================

export class DeployService {
  private logs: string[] = []

  /**
   * Deploy para Vercel
   */
  async deployToVercel(config: DeployConfig): Promise<DeployResult> {
    this.logs = []

    try {
      this.log('🚀 Iniciando deploy para Vercel...')

      // Verificar se Vercel CLI está instalado
      try {
        execSync('vercel --version', { stdio: 'pipe' })
      } catch {
        throw new Error('Vercel CLI não instalado. Executar: npm i -g vercel')
      }

      // Criar .env.production.local com env vars
      const envPath = join(config.projectPath, '.env.production.local')
      const envContent = Object.entries(config.envVars)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n')

      writeFileSync(envPath, envContent, 'utf-8')
      this.log('✅ Variáveis de ambiente configuradas')

      // Deploy com Vercel CLI
      this.log('📦 Executando deploy...')

      const deployCmd = config.vercelToken
        ? `vercel --prod --token=${config.vercelToken} --yes`
        : `vercel --prod --yes`

      const output = execSync(deployCmd, {
        cwd: config.projectPath,
        encoding: 'utf-8'
      })

      // Extrair URL do output
      const urlMatch = output.match(/https:\/\/[^\s]+/)
      const url = urlMatch ? urlMatch[0] : undefined

      if (!url) {
        throw new Error('Não foi possível obter URL de deployment')
      }

      this.log(`✅ Deploy completo: ${url}`)

      // Configurar env vars via Vercel API se tiver token
      if (config.vercelToken) {
        await this.configureVercelEnvVars(config, url)
      }

      return {
        success: true,
        platform: 'vercel',
        url,
        logs: this.logs
      }
    } catch (error) {
      this.log(`❌ Erro no deploy: ${error instanceof Error ? error.message : String(error)}`)

      return {
        success: false,
        platform: 'vercel',
        error: error instanceof Error ? error.message : String(error),
        logs: this.logs
      }
    }
  }

  /**
   * Deploy para Railway
   */
  async deployToRailway(config: DeployConfig): Promise<DeployResult> {
    this.logs = []

    try {
      this.log('🚀 Iniciando deploy para Railway...')

      // Verificar Railway CLI
      try {
        execSync('railway --version', { stdio: 'pipe' })
      } catch {
        throw new Error('Railway CLI não instalado. Executar: npm i -g @railway/cli')
      }

      // Login (se tiver token)
      if (config.railwayToken) {
        execSync(`railway login --token ${config.railwayToken}`, {
          cwd: config.projectPath,
          stdio: 'pipe'
        })
        this.log('✅ Autenticado no Railway')
      }

      // Criar projecto
      const projectName = config.projectName.toLowerCase().replace(/\s+/g, '-')

      execSync(`railway init -n ${projectName}`, {
        cwd: config.projectPath,
        stdio: 'pipe'
      })
      this.log(`✅ Projecto "${projectName}" criado`)

      // Adicionar PostgreSQL
      execSync('railway add --database postgresql', {
        cwd: config.projectPath,
        stdio: 'pipe'
      })
      this.log('✅ PostgreSQL adicionado')

      // Configurar env vars
      for (const [key, value] of Object.entries(config.envVars)) {
        execSync(`railway variables set ${key}="${value}"`, {
          cwd: config.projectPath,
          stdio: 'pipe'
        })
      }
      this.log('✅ Variáveis de ambiente configuradas')

      // Deploy
      this.log('📦 Executando deploy...')

      const output = execSync('railway up --detach', {
        cwd: config.projectPath,
        encoding: 'utf-8'
      })

      // Obter URL do deployment
      const urlOutput = execSync('railway domain', {
        cwd: config.projectPath,
        encoding: 'utf-8'
      })

      const urlMatch = urlOutput.match(/https:\/\/[^\s]+/)
      const url = urlMatch ? urlMatch[0] : undefined

      this.log(`✅ Deploy completo${url ? `: ${url}` : ''}`)

      return {
        success: true,
        platform: 'railway',
        url,
        logs: this.logs
      }
    } catch (error) {
      this.log(`❌ Erro no deploy: ${error instanceof Error ? error.message : String(error)}`)

      return {
        success: false,
        platform: 'railway',
        error: error instanceof Error ? error.message : String(error),
        logs: this.logs
      }
    }
  }

  /**
   * Criar repositório GitHub
   */
  async createGitHubRepo(config: DeployConfig): Promise<DeployResult> {
    this.logs = []

    try {
      this.log('🚀 Criando repositório GitHub...')

      if (!config.githubToken) {
        throw new Error('GitHub token não fornecido')
      }

      const repoName = config.projectName.toLowerCase().replace(/\s+/g, '-')

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
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`GitHub API error: ${error}`)
      }

      const data = await response.json() as any
      const repoUrl = data.html_url as string
      const gitUrl = data.clone_url as string

      this.log(`✅ Repositório criado: ${repoUrl}`)

      // Inicializar git local
      this.log('📝 Inicializando git local...')

      try {
        execSync('git init', { cwd: config.projectPath, stdio: 'pipe' })
        execSync('git add .', { cwd: config.projectPath, stdio: 'pipe' })
        execSync('git commit -m "Initial commit from DevForge V2"', {
          cwd: config.projectPath,
          stdio: 'pipe'
        })
        execSync(`git branch -M main`, { cwd: config.projectPath, stdio: 'pipe' })
        execSync(`git remote add origin ${gitUrl}`, {
          cwd: config.projectPath,
          stdio: 'pipe'
        })

        // Configurar credenciais para push
        const authenticatedUrl = gitUrl.replace(
          'https://',
          `https://${config.githubToken}@`
        )

        execSync(`git push -u origin main`, {
          cwd: config.projectPath,
          stdio: 'pipe',
          env: {
            ...process.env,
            GIT_ASKPASS: 'echo',
            GIT_USERNAME: 'x-access-token',
            GIT_PASSWORD: config.githubToken
          }
        })

        this.log('✅ Código enviado para GitHub')
      } catch (gitError) {
        this.log(`⚠️  Erro ao fazer push: ${gitError instanceof Error ? gitError.message : String(gitError)}`)
      }

      return {
        success: true,
        platform: 'github',
        repoUrl,
        logs: this.logs
      }
    } catch (error) {
      this.log(`❌ Erro ao criar repositório: ${error instanceof Error ? error.message : String(error)}`)

      return {
        success: false,
        platform: 'github',
        error: error instanceof Error ? error.message : String(error),
        logs: this.logs
      }
    }
  }

  /**
   * Deploy completo (GitHub + Vercel + Railway)
   */
  async deployComplete(config: DeployConfig): Promise<{
    github?: DeployResult
    vercel?: DeployResult
    railway?: DeployResult
    success: boolean
  }> {
    const results: any = { success: true }

    // 1. Criar GitHub repo (se tiver token)
    if (config.githubToken) {
      results.github = await this.createGitHubRepo(config)

      if (!results.github.success) {
        results.success = false
      }
    }

    // 2. Deploy Vercel (se tiver token)
    if (config.vercelToken) {
      results.vercel = await this.deployToVercel(config)

      if (!results.vercel.success) {
        results.success = false
      }
    }

    // 3. Deploy Railway database (se tiver token)
    if (config.railwayToken) {
      results.railway = await this.deployToRailway(config)

      if (!results.railway.success) {
        results.success = false
      }
    }

    return results
  }

  /**
   * Configurar env vars via Vercel API
   */
  private async configureVercelEnvVars(config: DeployConfig, deployUrl: string): Promise<void> {
    if (!config.vercelToken) return

    this.log('🔐 Configurando variáveis de ambiente no Vercel...')

    // Extrair project ID do deployment URL
    const projectName = config.projectName.toLowerCase().replace(/\s+/g, '-')

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
        })
      } catch (error) {
        this.log(`⚠️  Erro ao configurar ${key}: ${error}`)
      }
    }

    this.log('✅ Variáveis de ambiente configuradas via API')
  }

  /**
   * Logging helper
   */
  private log(message: string): void {
    this.logs.push(message)
    console.log(message)
  }
}

/**
 * Helpers standalone
 */

export async function deployToVercel(config: DeployConfig): Promise<DeployResult> {
  const service = new DeployService()
  return service.deployToVercel(config)
}

export async function deployToRailway(config: DeployConfig): Promise<DeployResult> {
  const service = new DeployService()
  return service.deployToRailway(config)
}

export async function createGitHubRepo(config: DeployConfig): Promise<DeployResult> {
  const service = new DeployService()
  return service.createGitHubRepo(config)
}

export async function deployComplete(config: DeployConfig) {
  const service = new DeployService()
  return service.deployComplete(config)
}
