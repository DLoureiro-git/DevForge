/**
 * DELIVERY AGENT — Claude Opus 4.6
 *
 * Gera documentação final de entrega completa:
 * - DELIVERY.md (changelog, checklist, testing guide, rollback)
 * - Métricas de sucesso
 * - Aprovação para produção
 */

import Anthropic from '@anthropic-ai/sdk'
import { createAnthropicClient } from '../lib/anthropic'

// ============================================================================
// TYPES
// ============================================================================

export interface DeliveryDocumentation {
  changelog: ChangelogEntry[]
  deployChecklist: ChecklistItem[]
  testingGuide: TestingStep[]
  rollbackPlan: RollbackStep[]
  successMetrics: SuccessMetric[]
  environmentVariables: EnvVariable[]
  postDeployVerification: VerificationStep[]
  markdown: string // DELIVERY.md completo
}

export interface ChangelogEntry {
  category: 'feature' | 'enhancement' | 'fix' | 'security' | 'performance'
  description: string
  impact: 'high' | 'medium' | 'low'
  userFacing: boolean
}

export interface ChecklistItem {
  step: string
  critical: boolean
  automated: boolean
  verified: boolean
}

export interface TestingStep {
  feature: string
  scenario: string
  expectedResult: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface RollbackStep {
  step: number
  action: string
  command?: string
  timeEstimate: string
}

export interface SuccessMetric {
  metric: string
  target: string
  measurement: string
  criticalThreshold: string
}

export interface EnvVariable {
  name: string
  required: boolean
  description: string
  example?: string
  sensitive: boolean
}

export interface VerificationStep {
  check: string
  method: 'manual' | 'automated'
  endpoint?: string
  expectedResponse?: string
}

export interface ApprovalResult {
  approved: boolean
  readyForProduction: boolean
  blockers: string[]
  warnings: string[]
  recommendations: string[]
  qaScoreThreshold: number
  actualQaScore: number
  criticalBugsFound: number
  timestamp: Date
}

// ============================================================================
// DELIVERY AGENT
// ============================================================================

const DELIVERY_SYSTEM_PROMPT = `És o Delivery Agent do DevForge — um Senior Release Manager com 15 anos de experiência.

A tua missão é preparar documentação completa e checklist de entrega para produção.

**RESPONSABILIDADES:**

1. **Changelog Completo:**
   - Categorizar todas as mudanças (features, enhancements, fixes, security, performance)
   - Identificar impacto em utilizadores finais
   - Destacar breaking changes (se existirem)
   - Linguagem não-técnica para features user-facing

2. **Deploy Checklist:**
   - Steps críticos (DB migrations, env vars, seeds)
   - Steps automatizados vs manuais
   - Ordem correcta de execução
   - Rollback points

3. **Testing Guide:**
   - Cenários de teste críticos
   - Fluxos end-to-end principais
   - Edge cases importantes
   - Testes de regressão necessários

4. **Rollback Plan:**
   - Steps sequenciais para reverter deploy
   - Comandos exactos
   - Tempo estimado por step
   - Data backup/restore procedures

5. **Success Metrics:**
   - KPIs a monitorizar
   - Thresholds críticos
   - Alertas automáticos
   - Health checks

6. **Environment Variables:**
   - Lista completa com descrições
   - Valores de exemplo (não sensíveis)
   - Indicar obrigatórias vs opcionais
   - Notas de segurança

7. **Post-Deploy Verification:**
   - Checks automáticos (health endpoints)
   - Verificações manuais críticas
   - Smoke tests
   - Monitoring dashboards

**REGRAS:**

- Assume deploy em Vercel + Railway (conforme arquitectura)
- Inclui comandos shell exactos quando aplicável
- Marca items críticos vs nice-to-have
- Linguagem clara e accionável
- Zero ambiguidade em passos críticos
- Se multi-tenant, enforçar verificação de data isolation
- Se auth, enforçar teste de todos os flows (signup, login, logout, password reset)
- Se payments, enforçar validação de webhooks Stripe em staging

**OUTPUT:**

Gera JSON estruturado com todas as secções.
Depois converte para DELIVERY.md em Markdown.`

export class DeliveryAgent {
  private client: Anthropic

  constructor(apiKey?: string) {
    this.client = apiKey
      ? createAnthropicClient(apiKey)
      : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  /**
   * Gerar documentação de delivery completa
   */
  async generateDeliveryDoc(
    prd: any,
    architecture: any,
    code: any,
    qaResults: any,
    bugFixResults?: any
  ): Promise<DeliveryDocumentation> {
    const response = await this.client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 32768,
      system: DELIVERY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Gera documentação de delivery completa para este projecto:

**PRD:**
${JSON.stringify(prd, null, 2)}

**ARCHITECTURE:**
${JSON.stringify(architecture, null, 2)}

**QA RESULTS:**
${JSON.stringify(qaResults, null, 2)}

${bugFixResults ? `**BUG FIX RESULTS:**\n${JSON.stringify(bugFixResults, null, 2)}` : ''}

Gera JSON estruturado com:
- changelog (array de entries)
- deployChecklist (array de items)
- testingGuide (array de steps)
- rollbackPlan (array de steps)
- successMetrics (array de metrics)
- environmentVariables (array de vars)
- postDeployVerification (array de checks)

Retorna APENAS JSON puro (sem markdown wrapper).`
        }
      ]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const deliveryData = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))

    // Gerar DELIVERY.md
    const markdown = this.generateDeliveryMarkdown(deliveryData, prd, qaResults)

    return {
      ...deliveryData,
      markdown
    }
  }

  /**
   * Aprovar projecto para produção
   */
  async approveForProduction(
    deliveryDoc: DeliveryDocumentation,
    qaResults: any
  ): Promise<ApprovalResult> {
    const qaScore = qaResults.score?.percentage || 0
    const criticalBugs = qaResults.allBugs?.filter((b: any) => b.severity === 'CRITICAL').length || 0
    const blockers = qaResults.score?.blockers || []

    // Critérios de aprovação
    const qaScoreThreshold = 85
    const approved = qaScore >= qaScoreThreshold && criticalBugs === 0 && blockers.length === 0

    const warnings: string[] = []
    const recommendations: string[] = []
    const blockersArray: string[] = []

    // Avaliar blockers
    if (criticalBugs > 0) {
      blockersArray.push(`${criticalBugs} bug(s) CRITICAL não resolvidos`)
    }

    if (blockers.length > 0) {
      blockersArray.push(...blockers.map((b: any) => b.title))
    }

    if (qaScore < qaScoreThreshold) {
      blockersArray.push(`QA Score abaixo do threshold: ${qaScore}% < ${qaScoreThreshold}%`)
    }

    // Avaliar warnings
    const highBugs = qaResults.allBugs?.filter((b: any) => b.severity === 'HIGH').length || 0
    if (highBugs > 0) {
      warnings.push(`${highBugs} bug(s) HIGH encontrados (não bloqueiam mas devem ser corrigidos)`)
    }

    // Recommendations
    if (qaScore < 95) {
      recommendations.push('Melhorar QA score para 95%+ antes de produção')
    }

    if (!deliveryDoc.rollbackPlan || deliveryDoc.rollbackPlan.length === 0) {
      recommendations.push('Definir rollback plan detalhado')
    }

    if (!deliveryDoc.successMetrics || deliveryDoc.successMetrics.length === 0) {
      recommendations.push('Definir success metrics e monitoring')
    }

    return {
      approved,
      readyForProduction: approved && warnings.length === 0,
      blockers: blockersArray,
      warnings,
      recommendations,
      qaScoreThreshold,
      actualQaScore: qaScore,
      criticalBugsFound: criticalBugs,
      timestamp: new Date()
    }
  }

  /**
   * Gerar DELIVERY.md completo
   */
  private generateDeliveryMarkdown(
    delivery: DeliveryDocumentation,
    prd: any,
    qaResults: any
  ): string {
    const date = new Date().toISOString().split('T')[0]

    return `# DELIVERY.md — ${prd.projectName}

> Documentação de entrega gerada automaticamente pelo DevForge V2
> Data: ${date}

---

## 📋 Informação do Projecto

**Nome:** ${prd.projectName}
**Tagline:** ${prd.tagline}
**Versão:** 1.0.0
**Data de Entrega:** ${date}
**QA Score:** ${qaResults.score?.percentage || 0}%

---

## 📝 Changelog

${this.formatChangelog(delivery.changelog)}

---

## ✅ Deploy Checklist

${this.formatDeployChecklist(delivery.deployChecklist)}

---

## 🧪 Testing Guide

${this.formatTestingGuide(delivery.testingGuide)}

---

## 🔄 Rollback Plan

${this.formatRollbackPlan(delivery.rollbackPlan)}

---

## 📊 Success Metrics

${this.formatSuccessMetrics(delivery.successMetrics)}

---

## 🔐 Environment Variables

${this.formatEnvVariables(delivery.environmentVariables)}

---

## ✓ Post-Deploy Verification

${this.formatPostDeployVerification(delivery.postDeployVerification)}

---

## 🚀 Deploy Commands

### Vercel (Frontend + API)
\`\`\`bash
# 1. Verificar env vars em Vercel Dashboard
vercel env pull .env.local

# 2. Deploy para produção
vercel --prod

# 3. Verificar deploy
curl https://[PROJECT_URL]/api/health
\`\`\`

### Railway (Database)
\`\`\`bash
# 1. Verificar conexão DB
railway run npx prisma db push

# 2. Run migrations
railway run npx prisma migrate deploy

# 3. Seed data (se necessário)
railway run npx prisma db seed
\`\`\`

---

## 🐛 Bugs Conhecidos

${this.formatKnownBugs(qaResults.allBugs)}

---

## 📞 Contactos & Support

**Equipa DevForge:**
- Deploy Issues: ver logs em Vercel/Railway dashboards
- Database Issues: verificar connection strings em env vars
- Auth Issues: verificar NEXTAUTH_SECRET e NEXTAUTH_URL

**Monitoring:**
- Vercel Analytics: https://vercel.com/[PROJECT]/analytics
- Railway Logs: https://railway.app/project/[PROJECT_ID]

---

## 📚 Documentação Adicional

- [PRD.md](./PRD.md) - Product Requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Architecture
- [QA_REPORT.md](./QA_REPORT.md) - Quality Assurance Report

---

**Gerado por DevForge V2 — Delivery Agent (Claude Opus 4.6)**
`
  }

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  private formatChangelog(entries: ChangelogEntry[]): string {
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.category]) acc[entry.category] = []
      acc[entry.category].push(entry)
      return acc
    }, {} as Record<string, ChangelogEntry[]>)

    let output = ''

    const categories: Array<'feature' | 'enhancement' | 'fix' | 'security' | 'performance'> = ['feature', 'enhancement', 'fix', 'security', 'performance']
    const icons: Record<'feature' | 'enhancement' | 'fix' | 'security' | 'performance', string> = { feature: '✨', enhancement: '⚡', fix: '🐛', security: '🔒', performance: '🚀' }

    for (const category of categories) {
      const items = grouped[category] || []
      if (items.length === 0) continue

      output += `\n### ${icons[category]} ${category.toUpperCase()}\n\n`

      for (const item of items) {
        const badge = item.userFacing ? ' 👤' : ''
        const impact = item.impact === 'high' ? ' **[HIGH IMPACT]**' : ''
        output += `- ${item.description}${badge}${impact}\n`
      }
    }

    return output || '- Initial release\n'
  }

  private formatDeployChecklist(items: ChecklistItem[]): string {
    let output = '\n'

    const critical = items.filter(i => i.critical)
    const normal = items.filter(i => !i.critical)

    if (critical.length > 0) {
      output += '### 🔴 CRITICAL (obrigatório)\n\n'
      for (const item of critical) {
        const auto = item.automated ? '🤖' : '👤'
        const check = item.verified ? '✅' : '⬜'
        output += `${check} ${auto} ${item.step}\n`
      }
      output += '\n'
    }

    if (normal.length > 0) {
      output += '### 🟡 STANDARD\n\n'
      for (const item of normal) {
        const auto = item.automated ? '🤖' : '👤'
        const check = item.verified ? '✅' : '⬜'
        output += `${check} ${auto} ${item.step}\n`
      }
    }

    return output
  }

  private formatTestingGuide(steps: TestingStep[]): string {
    const grouped = steps.reduce((acc, step) => {
      if (!acc[step.priority]) acc[step.priority] = []
      acc[step.priority].push(step)
      return acc
    }, {} as Record<string, TestingStep[]>)

    let output = ''

    for (const priority of ['critical', 'high', 'medium', 'low']) {
      const items = grouped[priority] || []
      if (items.length === 0) continue

      output += `\n### ${priority.toUpperCase()} PRIORITY\n\n`

      for (const item of items) {
        output += `**${item.feature}**\n`
        output += `- Cenário: ${item.scenario}\n`
        output += `- Resultado Esperado: ${item.expectedResult}\n\n`
      }
    }

    return output || '- Executar smoke tests básicos\n'
  }

  private formatRollbackPlan(steps: RollbackStep[]): string {
    if (!steps || steps.length === 0) {
      return '\n1. Reverter deploy no Vercel Dashboard\n2. Restaurar DB snapshot se necessário\n'
    }

    let output = '\n'

    for (const step of steps) {
      output += `**${step.step}. ${step.action}** (⏱️ ${step.timeEstimate})\n`
      if (step.command) {
        output += `\`\`\`bash\n${step.command}\n\`\`\`\n`
      }
      output += '\n'
    }

    return output
  }

  private formatSuccessMetrics(metrics: SuccessMetric[]): string {
    if (!metrics || metrics.length === 0) {
      return '\n- Response time < 500ms\n- Error rate < 1%\n- Uptime > 99.9%\n'
    }

    let output = '\n| Métrica | Target | Medição | Critical Threshold |\n'
    output += '|---------|--------|---------|--------------------|\n'

    for (const metric of metrics) {
      output += `| ${metric.metric} | ${metric.target} | ${metric.measurement} | ${metric.criticalThreshold} |\n`
    }

    return output
  }

  private formatEnvVariables(vars: EnvVariable[]): string {
    if (!vars || vars.length === 0) {
      return '\nVer `.env.example` para lista completa.\n'
    }

    let output = '\n| Variable | Required | Description | Sensitive |\n'
    output += '|----------|----------|-------------|----------|\n'

    for (const v of vars) {
      const req = v.required ? '✅' : '⬜'
      const sens = v.sensitive ? '🔒' : '🔓'
      output += `| \`${v.name}\` | ${req} | ${v.description} | ${sens} |\n`
    }

    output += '\n**Exemplo (.env.example):**\n```bash\n'
    for (const v of vars.filter(x => x.example)) {
      output += `${v.name}=${v.example}\n`
    }
    output += '```\n'

    return output
  }

  private formatPostDeployVerification(checks: VerificationStep[]): string {
    if (!checks || checks.length === 0) {
      return '\n- Verificar homepage carrega\n- Verificar API health endpoint\n- Verificar login flow\n'
    }

    let output = '\n'

    for (const check of checks) {
      const icon = check.method === 'automated' ? '🤖' : '👤'
      output += `${icon} **${check.check}**\n`

      if (check.endpoint) {
        output += `   - Endpoint: \`${check.endpoint}\`\n`
      }

      if (check.expectedResponse) {
        output += `   - Expected: \`${check.expectedResponse}\`\n`
      }

      output += '\n'
    }

    return output
  }

  private formatKnownBugs(bugs: any[]): string {
    if (!bugs || bugs.length === 0) {
      return '\n✅ Nenhum bug conhecido.\n'
    }

    const nonCritical = bugs.filter(b => b.severity !== 'CRITICAL')

    if (nonCritical.length === 0) {
      return '\n✅ Todos os bugs críticos foram resolvidos.\n'
    }

    let output = '\n'

    for (const bug of nonCritical.slice(0, 10)) {
      output += `- **[${bug.severity}]** ${bug.title}\n`
      output += `  ${bug.description}\n\n`
    }

    if (nonCritical.length > 10) {
      output += `\n... e mais ${nonCritical.length - 10} bugs não-críticos.\n`
    }

    return output
  }
}
