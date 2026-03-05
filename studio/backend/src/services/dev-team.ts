/**
 * DEV TEAM ORCHESTRATOR
 *
 * Coordena 4 developers especializados em paralelo:
 * - Frontend Dev (pages, components)
 * - Backend Dev (API routes)
 * - Database Dev (Prisma schema)
 * - Utils Dev (contexts, hooks, utils)
 */

import { FrontendDev } from './devs/frontend-dev'
import { BackendDev } from './devs/backend-dev'
import { DatabaseDev } from './devs/database-dev'
import { UtilsDev } from './devs/utils-dev'

export interface FileAssignment {
  devRole: 'frontend' | 'backend' | 'database' | 'utils'
  filePath: string
  description: string
}

export interface DevTeamRequest {
  architecture: string
  technicalRules?: string[]
}

export interface GeneratedFile {
  success: boolean
  devRole: string
  filePath: string
  code?: string
  duration: number
  error?: string
  noChanges?: boolean
}

export interface DevTeamResponse {
  success: boolean
  files: GeneratedFile[]
  totalDuration: number
  stats: {
    total: number
    successful: number
    failed: number
    noChanges: number
  }
}

export class DevTeam {
  private frontendDev: FrontendDev
  private backendDev: BackendDev
  private databaseDev: DatabaseDev
  private utilsDev: UtilsDev

  constructor() {
    this.frontendDev = new FrontendDev()
    this.backendDev = new BackendDev()
    this.databaseDev = new DatabaseDev()
    this.utilsDev = new UtilsDev()
  }

  /**
   * Parse ARCHITECTURE.md e atribuir ficheiros aos devs corretos
   */
  assignFilesToDevs(architecture: string): FileAssignment[] {
    const assignments: FileAssignment[] = []
    const lines = architecture.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()

      // Ignorar linhas vazias, headers, código
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```')) {
        continue
      }

      // Backend: API routes
      if (trimmed.includes('route.ts')) {
        const filePath = this.extractFilePath(trimmed)
        if (filePath) {
          assignments.push({
            devRole: 'backend',
            filePath,
            description: 'API route handler'
          })
        }
      }
      // Frontend: Pages
      else if (trimmed.includes('page.tsx')) {
        const filePath = this.extractFilePath(trimmed)
        if (filePath) {
          assignments.push({
            devRole: 'frontend',
            filePath,
            description: 'React page component'
          })
        }
      }
      // Frontend: Components
      else if (trimmed.includes('.tsx') && trimmed.toLowerCase().includes('component')) {
        const filePath = this.extractFilePath(trimmed)
        if (filePath) {
          assignments.push({
            devRole: 'frontend',
            filePath,
            description: 'React component'
          })
        }
      }
      // Database: Prisma schema
      else if (trimmed.includes('schema.prisma')) {
        assignments.push({
          devRole: 'database',
          filePath: 'prisma/schema.prisma',
          description: 'Prisma schema changes'
        })
      }
      // Utils: Contexts
      else if (trimmed.includes('Context.tsx')) {
        const filePath = this.extractFilePath(trimmed)
        if (filePath) {
          assignments.push({
            devRole: 'utils',
            filePath,
            description: 'React context'
          })
        }
      }
      // Utils: Hooks
      else if (trimmed.includes('Hook') || trimmed.includes('use')) {
        const filePath = this.extractFilePath(trimmed)
        if (filePath && filePath.includes('.ts')) {
          assignments.push({
            devRole: 'utils',
            filePath,
            description: 'Custom React hook'
          })
        }
      }
    }

    // Se não encontrou nenhum assignment, criar genérico
    if (assignments.length === 0) {
      assignments.push({
        devRole: 'frontend',
        filePath: 'src/app/(app)/nova-feature/page.tsx',
        description: 'Nova página baseada na architecture'
      })
    }

    return assignments
  }

  /**
   * Extrair file path de uma linha (remove comentários, bullets, etc)
   */
  private extractFilePath(line: string): string | null {
    // Remover bullets, asteriscos, traços
    let cleaned = line.replace(/^[-*•]\s*/, '').trim()

    // Remover comentários (# ...)
    cleaned = cleaned.split('#')[0].trim()

    // Remover backticks
    cleaned = cleaned.replace(/`/g, '')

    // Se tem extensão de ficheiro, é válido
    if (cleaned.match(/\.(tsx?|jsx?|prisma|css|json)$/)) {
      return cleaned
    }

    return null
  }

  /**
   * Gerar código para todos os ficheiros em paralelo
   */
  async generateAllCode(
    request: DevTeamRequest,
    assignments: FileAssignment[]
  ): Promise<DevTeamResponse> {
    const startTime = Date.now()

    // Criar promises para cada assignment
    const promises = assignments.map(async (assignment) => {
      const baseRequest = {
        architecture: request.architecture,
        filePath: assignment.filePath,
        fileDescription: assignment.description,
        technicalRules: request.technicalRules
      }

      let result: GeneratedFile

      try {
        switch (assignment.devRole) {
          case 'frontend':
            const frontendResult = await this.frontendDev.generateCode(baseRequest)
            result = {
              ...frontendResult,
              devRole: 'frontend'
            }
            break

          case 'backend':
            const backendResult = await this.backendDev.generateCode(baseRequest)
            result = {
              ...backendResult,
              devRole: 'backend'
            }
            break

          case 'database':
            const dbResult = await this.databaseDev.generateCode(baseRequest)
            result = {
              ...dbResult,
              devRole: 'database'
            }
            break

          case 'utils':
            const utilsResult = await this.utilsDev.generateCode(baseRequest)
            result = {
              ...utilsResult,
              devRole: 'utils'
            }
            break

          default:
            result = {
              success: false,
              devRole: assignment.devRole,
              filePath: assignment.filePath,
              error: `Dev role desconhecido: ${assignment.devRole}`,
              duration: 0
            }
        }
      } catch (error: any) {
        result = {
          success: false,
          devRole: assignment.devRole,
          filePath: assignment.filePath,
          error: error.message || 'Erro ao gerar código',
          duration: 0
        }
      }

      return result
    })

    // Executar todos em paralelo
    const files = await Promise.all(promises)

    // Calcular stats
    const stats = {
      total: files.length,
      successful: files.filter(f => f.success && !f.noChanges).length,
      failed: files.filter(f => !f.success).length,
      noChanges: files.filter(f => f.noChanges).length
    }

    return {
      success: stats.failed === 0,
      files,
      totalDuration: Date.now() - startTime,
      stats
    }
  }

  /**
   * Pipeline completo: assign + generate
   */
  async execute(request: DevTeamRequest): Promise<DevTeamResponse> {
    // 1. Parse architecture e atribuir ficheiros
    const assignments = this.assignFilesToDevs(request.architecture)

    console.log(`[DevTeam] Atribuídos ${assignments.length} ficheiros:`)
    assignments.forEach(a => {
      console.log(`  - ${a.devRole}: ${a.filePath}`)
    })

    // 2. Gerar código em paralelo
    const result = await this.generateAllCode(request, assignments)

    console.log(`[DevTeam] Concluído em ${(result.totalDuration / 1000).toFixed(2)}s`)
    console.log(`  - Sucessos: ${result.stats.successful}`)
    console.log(`  - Falhas: ${result.stats.failed}`)
    console.log(`  - Sem mudanças: ${result.stats.noChanges}`)

    return result
  }
}

// Singleton instance
export const devTeam = new DevTeam()
