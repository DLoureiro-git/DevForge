/**
 * ORCHESTRATOR — Pipeline Principal DevForge V2
 *
 * Executa 6 etapas em sequência:
 * 1. PM Agent (já executado, usa PRD)
 * 2. Architect Agent
 * 3. Dev Team (4 devs paralelo)
 * 4. QA Pipeline
 * 5. Bug Fix Loop (se necessário)
 * 6. Delivery Agent
 *
 * Logging via SSE broadcast
 * Update Project status na DB
 * Save artifacts
 * Error handling com rollback
 */

import { PrismaClient, ProjectStatus, PhaseType, PhaseStatus } from '@prisma/client'
import { PMAgent } from './pm-agent'
import { ArchitectAgent } from './architect'
import { DevTeam } from './dev-team'
import { executeQA, type QAExecutionResult } from './qa-executor'
import { runBatchBugFix } from './bug-fix-loop'
import { DeliveryAgent, type ApprovalResult } from './delivery'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineConfig {
  projectId: string
  outputDirectory?: string
  ollamaEndpoint?: string
  ollamaModel?: string
  claudeApiKey?: string
  autoFix?: boolean
  autoDeploy?: boolean
}

export interface PipelineResult {
  success: boolean
  projectId: string
  status: ProjectStatus
  phases: PhaseResult[]
  artifacts: {
    prd?: any
    architecture?: any
    code?: any
    qaReport?: QAExecutionResult
    bugFixResults?: any
    deliveryDoc?: any
    approval?: ApprovalResult
  }
  totalTime: number
  estimatedTime: number
  deployUrl?: string
  repoUrl?: string
  error?: string
}

export interface PhaseResult {
  type: PhaseType
  status: PhaseStatus
  startTime: Date
  endTime?: Date
  duration?: number
  output?: any
  error?: string
  logs: LogEntry[]
}

export interface LogEntry {
  timestamp: Date
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  message: string
  userMessage?: string
}

// ============================================================================
// PIPELINE CLASS
// ============================================================================

export class Pipeline {
  private config: PipelineConfig
  private phases: PhaseResult[] = []
  private currentPhase: PhaseResult | null = null
  private startTime: number = 0
  private logCallback?: (log: LogEntry) => void

  constructor(config: PipelineConfig) {
    this.config = {
      outputDirectory: config.outputDirectory || './generated-projects',
      ollamaEndpoint: config.ollamaEndpoint || 'http://localhost:11434',
      ollamaModel: config.ollamaModel || 'qwen2.5-coder:32b',
      autoFix: config.autoFix ?? true,
      autoDeploy: config.autoDeploy ?? false,
      ...config
    }
  }

  /**
   * Registar callback para logs (SSE broadcast)
   */
  onLog(callback: (log: LogEntry) => void) {
    this.logCallback = callback
  }

  /**
   * Executar pipeline completo
   */
  async run(): Promise<PipelineResult> {
    this.startTime = Date.now()

    try {
      // Carregar project da DB
      const project = await prisma.project.findUnique({
        where: { id: this.config.projectId },
        include: { messages: true }
      })

      if (!project) {
        throw new Error(`Project ${this.config.projectId} não encontrado`)
      }

      if (!project.prd) {
        throw new Error('Project não tem PRD gerado. Execute PM Agent primeiro.')
      }

      const estimatedTime = (project.prd as any).estimatedMinutes || 30

      this.log('INFO', `🚀 Pipeline iniciado para "${project.name}"`, `A construir "${project.name}"...`)
      this.log('INFO', `⏱️  Tempo estimado: ${estimatedTime} minutos`)

      // Update status inicial
      await this.updateProjectStatus(ProjectStatus.PLANNING)

      // FASE 1: PM Agent (já executado, carregar PRD)
      await this.startPhase('PM')
      this.log('SUCCESS', '✅ PRD já gerado pelo PM Agent', 'PRD pronto')
      const prd = project.prd
      await this.completePhase({ prd })

      // FASE 2: Architect Agent
      await this.startPhase('ARCHITECT')
      await this.updateProjectStatus(ProjectStatus.PLANNING)
      this.log('INFO', '🏗️  Architect Agent a gerar arquitectura técnica...', 'A planear arquitectura...')

      const architectAgent = new ArchitectAgent()
      const architecture = await architectAgent.generateArchitecture(prd)

      this.log('SUCCESS', `✅ Arquitectura gerada (${architecture.databaseSchema.tables.length} tabelas, ${architecture.technicalRules.length} regras)`, 'Arquitectura pronta')
      await this.completePhase({ architecture })

      // Gravar architecture na DB
      await prisma.project.update({
        where: { id: this.config.projectId },
        data: { architecture: architecture as any }
      })

      // FASE 3: Dev Team (4 devs paralelo)
      await this.startPhase('FRONTEND') // Usamos FRONTEND como proxy para Dev Team
      await this.updateProjectStatus(ProjectStatus.BUILDING)
      this.log('INFO', '👨‍💻 Dev Team a gerar código (4 agentes em paralelo)...', 'A escrever código...')

      const outputPath = join(this.config.outputDirectory!, project.id)
      if (!existsSync(outputPath)) {
        mkdirSync(outputPath, { recursive: true })
      }

      const devTeam = new DevTeam()
      const codeResult = await devTeam.execute({
        architecture: architecture.architectureMarkdown,
        technicalRules: architecture.technicalRules
      })

      this.log('SUCCESS', `✅ Código gerado (${codeResult.stats.successful}/${codeResult.stats.total} ficheiros)`, 'Código pronto')
      await this.completePhase({ codeResult })

      // Update outputPath na DB
      await prisma.project.update({
        where: { id: this.config.projectId },
        data: { outputPath }
      })

      // FASE 4: QA Pipeline
      await this.startPhase('QA')
      await this.updateProjectStatus(ProjectStatus.QA)
      this.log('INFO', '🔍 QA Engine a executar validações...', 'A testar código...')

      const qaResults = await executeQA({
        prd: JSON.stringify(prd),
        projectPath: outputPath,
        headless: true,
        autoFix: false, // Não auto-fix aqui, fazemos no próximo step
        claudeApiKey: this.config.claudeApiKey,
        ollamaEndpoint: this.config.ollamaEndpoint
      })

      this.log('INFO', `QA Score: ${qaResults.score.percentage}% (${qaResults.score.passed}/${qaResults.score.passed + qaResults.score.failed} checks)`)

      if (qaResults.allBugs.length > 0) {
        this.log('WARN', `⚠️  ${qaResults.allBugs.length} bug(s) encontrado(s)`, `${qaResults.allBugs.length} problemas encontrados`)
      } else {
        this.log('SUCCESS', '✅ Nenhum bug encontrado!', 'Código perfeito')
      }

      await this.completePhase({ qaResults })

      // Gravar QA report na DB
      await prisma.project.update({
        where: { id: this.config.projectId },
        data: {
          qaReport: qaResults as any,
          qaScore: qaResults.score.percentage
        }
      })

      // FASE 5: Bug Fix Loop (se necessário e autoFix ativo)
      let bugFixResults = null

      if (this.config.autoFix && qaResults.allBugs.length > 0) {
        await this.startPhase('BUGFIX')
        await this.updateProjectStatus(ProjectStatus.FIXING)
        this.log('INFO', `🔧 Bug Fix Loop a corrigir ${qaResults.allBugs.length} bug(s)...`, 'A corrigir problemas...')

        bugFixResults = await runBatchBugFix(qaResults.allBugs, qaResults.checklist, {
          maxIterations: 10,
          ollamaModel: this.config.ollamaModel!,
          ollamaEndpoint: this.config.ollamaEndpoint!,
          claudeApiKey: this.config.claudeApiKey,
          projectPath: outputPath,
          browser: await (await import('playwright')).chromium.launch({ headless: true })
        })

        const fixed = bugFixResults.filter((r: any) => r.fixed).length
        this.log('SUCCESS', `✅ ${fixed}/${qaResults.allBugs.length} bugs corrigidos`, `${fixed} problemas resolvidos`)
        await this.completePhase({ bugFixResults })

        // Atualizar loopCount
        await prisma.project.update({
          where: { id: this.config.projectId },
          data: { loopCount: { increment: 1 } }
        })
      } else {
        this.log('INFO', '⏭️  Bug Fix Loop ignorado (autoFix desativo ou sem bugs)')
      }

      // FASE 6: Delivery Agent
      await this.startPhase('DELIVERY')
      await this.updateProjectStatus(ProjectStatus.DEPLOYING)
      this.log('INFO', '📦 Delivery Agent a preparar documentação...', 'A preparar entrega...')

      const deliveryAgent = new DeliveryAgent()
      const deliveryDoc = await deliveryAgent.generateDeliveryDoc(
        prd,
        architecture,
        codeResult,
        qaResults,
        bugFixResults
      )

      this.log('SUCCESS', '✅ DELIVERY.md gerado')

      // Gravar DELIVERY.md no disco
      writeFileSync(join(outputPath, 'DELIVERY.md'), deliveryDoc.markdown, 'utf-8')

      // Aprovar para produção
      const approval = await deliveryAgent.approveForProduction(deliveryDoc, qaResults)

      if (approval.approved) {
        this.log('SUCCESS', '✅ Aprovado para produção!', 'Pronto para produção')
        await this.updateProjectStatus(ProjectStatus.DELIVERED)
      } else {
        this.log('WARN', `⚠️  Não aprovado para produção (${approval.blockers.length} blockers)`, 'Necessita revisão')

        for (const blocker of approval.blockers) {
          this.log('ERROR', `  - ${blocker}`)
        }
      }

      await this.completePhase({ deliveryDoc, approval })

      // Calcular tempo total
      const totalTime = Date.now() - this.startTime

      // Update actualMin na DB
      await prisma.project.update({
        where: { id: this.config.projectId },
        data: { actualMin: Math.ceil(totalTime / 1000 / 60) }
      })

      this.log('SUCCESS', `🎉 Pipeline completo em ${(totalTime / 1000 / 60).toFixed(1)} minutos!`, 'Concluído!')

      return {
        success: true,
        projectId: this.config.projectId,
        status: approval.approved ? ProjectStatus.DELIVERED : ProjectStatus.QA,
        phases: this.phases,
        artifacts: {
          prd,
          architecture,
          code: codeResult,
          qaReport: qaResults,
          bugFixResults,
          deliveryDoc,
          approval
        },
        totalTime,
        estimatedTime: estimatedTime * 60 * 1000
      }
    } catch (error) {
      this.log('ERROR', `💥 Pipeline falhou: ${error instanceof Error ? error.message : String(error)}`, 'Erro no pipeline')

      await this.updateProjectStatus(ProjectStatus.FAILED)

      if (this.currentPhase) {
        this.currentPhase.status = PhaseStatus.ERROR
        this.currentPhase.error = error instanceof Error ? error.message : String(error)
        this.currentPhase.endTime = new Date()
      }

      return {
        success: false,
        projectId: this.config.projectId,
        status: ProjectStatus.FAILED,
        phases: this.phases,
        artifacts: {},
        totalTime: Date.now() - this.startTime,
        estimatedTime: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Iniciar nova fase
   */
  private async startPhase(type: PhaseType) {
    // Completar fase anterior se existir
    if (this.currentPhase && !this.currentPhase.endTime) {
      await this.completePhase()
    }

    this.currentPhase = {
      type,
      status: PhaseStatus.RUNNING,
      startTime: new Date(),
      logs: []
    }

    this.phases.push(this.currentPhase)

    // Criar Phase na DB
    await prisma.phase.create({
      data: {
        projectId: this.config.projectId,
        type,
        status: PhaseStatus.RUNNING,
        startedAt: this.currentPhase.startTime
      }
    })
  }

  /**
   * Completar fase actual
   */
  private async completePhase(output?: any) {
    if (!this.currentPhase) return

    this.currentPhase.status = PhaseStatus.DONE
    this.currentPhase.endTime = new Date()
    this.currentPhase.duration = this.currentPhase.endTime.getTime() - this.currentPhase.startTime.getTime()

    if (output) {
      this.currentPhase.output = output
    }

    // Update Phase na DB
    const phases = await prisma.phase.findMany({
      where: {
        projectId: this.config.projectId,
        type: this.currentPhase.type
      },
      orderBy: { startedAt: 'desc' },
      take: 1
    })

    if (phases.length > 0) {
      await prisma.phase.update({
        where: { id: phases[0].id },
        data: {
          status: PhaseStatus.DONE,
          finishedAt: this.currentPhase.endTime,
          durationSec: Math.ceil(this.currentPhase.duration / 1000),
          technicalOutput: JSON.stringify(output)
        }
      })
    }

    this.currentPhase = null
  }

  /**
   * Update project status
   */
  private async updateProjectStatus(status: ProjectStatus) {
    await prisma.project.update({
      where: { id: this.config.projectId },
      data: { status }
    })
  }

  /**
   * Logging helper
   */
  private log(level: LogEntry['level'], message: string, userMessage?: string) {
    const log: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      userMessage
    }

    if (this.currentPhase) {
      this.currentPhase.logs.push(log)
    }

    // Chamar callback se existir (SSE broadcast)
    if (this.logCallback) {
      this.logCallback(log)
    }

    // Console log
    const icon = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      SUCCESS: '✅'
    }[level]

    console.log(`${icon} ${message}`)
  }
}

/**
 * Helper para executar pipeline standalone
 */
export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const pipeline = new Pipeline(config)
  return pipeline.run()
}
