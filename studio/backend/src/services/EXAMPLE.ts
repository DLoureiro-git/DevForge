/**
 * EXEMPLO DE USO DO PIPELINE COMPLETO
 *
 * Este ficheiro demonstra como usar o DevForge V2 Pipeline
 * para gerar uma aplicação completa do zero.
 */

import { Pipeline } from './orchestrator'
import { PMAgent } from './pm-agent'
import { DeployService } from './deploy-service'
import { ProjectGenerator } from './project-generator'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// EXEMPLO 1: Pipeline Completo (PM → Delivery)
// ============================================================================

async function exemploCompleto() {
  console.log('='.repeat(60))
  console.log('EXEMPLO 1: Pipeline Completo')
  console.log('='.repeat(60))

  // 1. CRIAR PROJECT NA DB
  const user = await prisma.user.findFirst() // Assumindo que existe utilizador

  if (!user) {
    console.error('❌ Nenhum utilizador encontrado na DB')
    return
  }

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: 'Task Manager App',
      description: 'Quero uma app para gerir as minhas tarefas diárias',
      status: 'INTAKE'
    }
  })

  console.log(`✅ Project criado: ${project.id}`)

  // 2. EXECUTAR PM AGENT (Intake conversacional)
  const pmAgent = new PMAgent()

  // Simular conversa (na realidade isto seria interactivo)
  const mensagens = [
    'Quero uma app para gerir as minhas tarefas diárias',
    'Só eu vou usar',
    'Preciso organizar tarefas por projecto e prioridade',
    'Não tenho referência específica',
    'Não preciso de conta',
    'Não vou cobrar',
    'Eu crio as tarefas',
    'Seria bom ter estatísticas',
    'Mais importante no computador',
    'Não preciso de integrações',
    'Azul e branco',
    'Simples e limpo',
    'Não tenho referência visual'
  ]

  let prd = null

  for (const msg of mensagens) {
    const result = await pmAgent.processMessage(msg, [])

    if (result.isComplete && result.prd) {
      prd = result.prd
      break
    }
  }

  if (!prd) {
    console.error('❌ PM Agent não gerou PRD')
    return
  }

  // Gravar PRD na DB
  await prisma.project.update({
    where: { id: project.id },
    data: { prd: prd as any }
  })

  console.log('✅ PRD gerado pelo PM Agent')

  // 3. EXECUTAR PIPELINE COMPLETO
  const pipeline = new Pipeline({
    projectId: project.id,
    outputDirectory: './generated-projects',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'qwen2.5-coder:32b',
    claudeApiKey: process.env.ANTHROPIC_API_KEY,
    autoFix: true,
    autoDeploy: false
  })

  // Registar callback para logs (SSE em produção)
  pipeline.onLog((log) => {
    const icon = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      SUCCESS: '✅'
    }[log.level]

    console.log(`${icon} ${log.userMessage || log.message}`)
  })

  console.log('\n🚀 Iniciando pipeline...\n')

  const result = await pipeline.run()

  console.log('\n' + '='.repeat(60))

  if (result.success) {
    console.log('✅ PIPELINE COMPLETO!')
    console.log(`   Ficheiros gerados: ${result.artifacts.code?.stats.successful}`)
    console.log(`   QA Score: ${result.artifacts.qaReport?.score.percentage}%`)
    console.log(`   Bugs corrigidos: ${result.artifacts.bugFixResults?.filter((r: any) => r.fixed).length || 0}`)
    console.log(`   Tempo total: ${(result.totalTime / 1000 / 60).toFixed(1)} min`)

    if (result.artifacts.approval?.approved) {
      console.log('   Status: ✅ APROVADO PARA PRODUÇÃO')
    } else {
      console.log('   Status: ⚠️  NECESSITA REVISÃO')
      console.log(`   Blockers: ${result.artifacts.approval?.blockers.join(', ')}`)
    }
  } else {
    console.log('❌ PIPELINE FALHOU')
    console.log(`   Erro: ${result.error}`)
  }

  console.log('='.repeat(60))
}

// ============================================================================
// EXEMPLO 2: Deploy Automático
// ============================================================================

async function exemploDeployAutomatico() {
  console.log('='.repeat(60))
  console.log('EXEMPLO 2: Deploy Automático')
  console.log('='.repeat(60))

  const projectId = 'abc123' // ID de um projecto já gerado

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project || !project.outputPath) {
    console.error('❌ Project não encontrado ou sem código gerado')
    return
  }

  // 1. GERAR FICHEIROS DE PROJECTO (package.json, README, etc.)
  const generator = new ProjectGenerator()

  generator.generatePackageJson(project.prd as any, project.outputPath)
  generator.generateEnvExample(project.architecture as any, project.outputPath)
  generator.generateReadme({
    projectId: project.id,
    projectName: project.name,
    outputPath: project.outputPath,
    prd: project.prd as any,
    architecture: project.architecture as any
  })
  generator.generateGitignore(project.outputPath)

  console.log('✅ Ficheiros de projecto gerados')

  // 2. DEPLOY COMPLETO (GitHub + Vercel + Railway)
  const deployService = new DeployService()

  const deployResult = await deployService.deployComplete({
    projectPath: project.outputPath,
    projectName: project.name,
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL!,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
      NEXTAUTH_URL: 'https://my-app.vercel.app'
    },
    githubToken: process.env.GITHUB_TOKEN,
    vercelToken: process.env.VERCEL_TOKEN,
    railwayToken: process.env.RAILWAY_TOKEN
  })

  console.log('\n📊 Deploy Results:\n')

  if (deployResult.github?.success) {
    console.log(`✅ GitHub: ${deployResult.github.repoUrl}`)
  } else {
    console.log(`❌ GitHub: ${deployResult.github?.error}`)
  }

  if (deployResult.vercel?.success) {
    console.log(`✅ Vercel: ${deployResult.vercel.url}`)

    // Gravar URL na DB
    await prisma.project.update({
      where: { id: project.id },
      data: {
        deployUrl: deployResult.vercel.url,
        repoUrl: deployResult.github?.repoUrl
      }
    })
  } else {
    console.log(`❌ Vercel: ${deployResult.vercel?.error}`)
  }

  if (deployResult.railway?.success) {
    console.log(`✅ Railway: ${deployResult.railway.url}`)
  } else {
    console.log(`❌ Railway: ${deployResult.railway?.error}`)
  }

  console.log('='.repeat(60))
}

// ============================================================================
// EXEMPLO 3: Gerar ZIP do Projecto
// ============================================================================

async function exemploGerarZip() {
  console.log('='.repeat(60))
  console.log('EXEMPLO 3: Gerar ZIP do Projecto')
  console.log('='.repeat(60))

  const projectId = 'abc123'

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project || !project.outputPath) {
    console.error('❌ Project não encontrado ou sem código gerado')
    return
  }

  const generator = new ProjectGenerator()

  console.log('📦 Criando ZIP...')

  const zipBuffer = await generator.zipProject(project.outputPath)

  console.log(`✅ ZIP criado (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`)

  // Gravar ZIP no disco (opcional)
  const fs = await import('fs')
  fs.writeFileSync(`./downloads/${project.name}.zip`, zipBuffer)

  console.log(`💾 ZIP gravado em ./downloads/${project.name}.zip`)

  console.log('='.repeat(60))
}

// ============================================================================
// EXEMPLO 4: Monitoring em Tempo Real (SSE)
// ============================================================================

async function exemploMonitoringSSE() {
  console.log('='.repeat(60))
  console.log('EXEMPLO 4: Monitoring em Tempo Real (SSE)')
  console.log('='.repeat(60))

  const projectId = 'abc123'

  const pipeline = new Pipeline({
    projectId,
    claudeApiKey: process.env.ANTHROPIC_API_KEY
  })

  // Simular SSE broadcast
  const sseClients: any[] = [] // Na realidade seria array de Response streams

  pipeline.onLog((log) => {
    const sseMessage = {
      timestamp: log.timestamp,
      level: log.level,
      message: log.userMessage || log.message,
      technical: log.message
    }

    // Broadcast para todos os clientes SSE conectados
    for (const client of sseClients) {
      client.write(`data: ${JSON.stringify(sseMessage)}\n\n`)
    }

    // Console log para debug
    console.log(`[${log.level}] ${log.message}`)
  })

  await pipeline.run()

  console.log('='.repeat(60))
}

// ============================================================================
// EXECUTAR EXEMPLOS
// ============================================================================

async function main() {
  const exemplo = process.argv[2] || '1'

  switch (exemplo) {
    case '1':
      await exemploCompleto()
      break
    case '2':
      await exemploDeployAutomatico()
      break
    case '3':
      await exemploGerarZip()
      break
    case '4':
      await exemploMonitoringSSE()
      break
    default:
      console.log('Uso: tsx EXAMPLE.ts [1|2|3|4]')
      console.log('  1 - Pipeline Completo')
      console.log('  2 - Deploy Automático')
      console.log('  3 - Gerar ZIP')
      console.log('  4 - Monitoring SSE')
  }

  await prisma.$disconnect()
}

// Executar se for chamado directamente
// Comentado para compatibilidade CommonJS
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main().catch(console.error)
// }

export {
  exemploCompleto,
  exemploDeployAutomatico,
  exemploGerarZip,
  exemploMonitoringSSE
}
