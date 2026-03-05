/**
 * CODE VALIDATOR — Validação de Código Contra Regras Técnicas
 *
 * Valida código gerado contra TECHNICAL RULES da arquitectura
 * para prevenir "context drift" entre Claude e Ollama.
 */

import { Ollama } from 'ollama'
import type { ArchitectureOutput } from './architect'

const ollama = new Ollama({ host: 'http://localhost:11434' })

export interface ValidationResult {
  passed: boolean
  violations: Array<{
    rule: string
    file: string
    line?: number
    description: string
    severity: 'ERROR' | 'WARNING'
  }>
  summary: string
}

export class CodeValidator {
  private technicalRules: string[]

  constructor(architecture: ArchitectureOutput) {
    this.technicalRules = architecture.technicalRules
  }

  /**
   * Validar ficheiro de código contra regras técnicas
   */
  async validateFile(
    filePath: string,
    fileContent: string
  ): Promise<ValidationResult> {
    const prompt = this.buildValidationPrompt(filePath, fileContent)

    try {
      const response = await ollama.chat({
        model: 'qwen2.5-coder:7b',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: 0.1 // Baixa temperatura para validação rigorosa
        }
      })

      const result = this.parseValidationResponse(response.message.content, filePath)
      return result
    } catch (error) {
      console.error('Code Validator error:', error)
      return {
        passed: false,
        violations: [{
          rule: 'SYSTEM',
          file: filePath,
          description: 'Falha na validação automática',
          severity: 'ERROR'
        }],
        summary: 'Erro no sistema de validação'
      }
    }
  }

  /**
   * Validar múltiplos ficheiros em batch
   */
  async validateBatch(
    files: Array<{ path: string; content: string }>
  ): Promise<ValidationResult> {
    const results = await Promise.all(
      files.map(f => this.validateFile(f.path, f.content))
    )

    const allViolations = results.flatMap(r => r.violations)
    const passed = allViolations.filter(v => v.severity === 'ERROR').length === 0

    return {
      passed,
      violations: allViolations,
      summary: this.buildBatchSummary(results)
    }
  }

  /**
   * Build system prompt com regras técnicas
   */
  private buildSystemPrompt(): string {
    return `És um Code Reviewer rigoroso que valida código contra regras técnicas absolutas.

A tua missão é identificar VIOLAÇÕES das regras técnicas definidas para este projecto.

REGRAS TÉCNICAS OBRIGATÓRIAS:
${this.technicalRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

INSTRUÇÕES:
- Analisa o código linha por linha
- Identifica TODAS as violações das regras acima
- Para cada violação, indica:
  * Qual regra foi violada (número)
  * Descrição clara do problema
  * Linha aproximada (se aplicável)
  * Severidade: ERROR (bloqueia deploy) ou WARNING (deve ser corrigido)

FORMATO DE RESPOSTA (JSON):
{
  "violations": [
    {
      "rule": "Regra #X",
      "line": 42,
      "description": "Descrição clara do problema",
      "severity": "ERROR"
    }
  ],
  "summary": "Resumo geral (1 frase)"
}

Se NÃO houver violações, responde:
{
  "violations": [],
  "summary": "Código conforme às regras técnicas"
}

IMPORTANTE:
- Sê rigoroso mas justo
- Se algo está correcto, NÃO inventes problemas
- Foca nas regras definidas, não em preferências pessoais
- ERROR: viola regra crítica (security, data integrity)
- WARNING: viola boa prática mas não quebra nada`
  }

  /**
   * Build validation prompt para ficheiro específico
   */
  private buildValidationPrompt(filePath: string, content: string): string {
    return `Valida este ficheiro contra as regras técnicas:

**Ficheiro:** ${filePath}

**Código:**
\`\`\`
${content}
\`\`\`

Analisa e reporta TODAS as violações encontradas em formato JSON.`
  }

  /**
   * Parse resposta de validação do Ollama
   */
  private parseValidationResponse(response: string, filePath: string): ValidationResult {
    try {
      // Extrair JSON da resposta (pode vir com markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Resposta inválida do Code Validator')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        passed: parsed.violations.length === 0 ||
                parsed.violations.every((v: any) => v.severity !== 'ERROR'),
        violations: parsed.violations.map((v: any) => ({
          rule: v.rule,
          file: filePath,
          line: v.line,
          description: v.description,
          severity: v.severity as 'ERROR' | 'WARNING'
        })),
        summary: parsed.summary
      }
    } catch (error) {
      console.error('Erro ao parse response:', error)
      return {
        passed: false,
        violations: [{
          rule: 'PARSE_ERROR',
          file: filePath,
          description: 'Falha ao interpretar resposta de validação',
          severity: 'ERROR'
        }],
        summary: 'Erro no parse da validação'
      }
    }
  }

  /**
   * Build summary para validação em batch
   */
  private buildBatchSummary(results: ValidationResult[]): string {
    const totalFiles = results.length
    const totalErrors = results.reduce(
      (sum, r) => sum + r.violations.filter(v => v.severity === 'ERROR').length,
      0
    )
    const totalWarnings = results.reduce(
      (sum, r) => sum + r.violations.filter(v => v.severity === 'WARNING').length,
      0
    )

    if (totalErrors === 0 && totalWarnings === 0) {
      return `✅ ${totalFiles} ficheiros validados com sucesso`
    }

    return `❌ ${totalErrors} erros, ⚠️ ${totalWarnings} warnings em ${totalFiles} ficheiros`
  }

  /**
   * Gerar relatório de validação em markdown
   */
  generateReport(result: ValidationResult): string {
    if (result.passed && result.violations.length === 0) {
      return `# ✅ Validação Aprovada

${result.summary}

Todos os ficheiros estão conformes às regras técnicas definidas.`
    }

    const errors = result.violations.filter(v => v.severity === 'ERROR')
    const warnings = result.violations.filter(v => v.severity === 'WARNING')

    return `# ${result.passed ? '⚠️' : '❌'} Validação ${result.passed ? 'Com Avisos' : 'Reprovada'}

${result.summary}

${errors.length > 0 ? `## ❌ Erros (${errors.length})\n\n${this.formatViolations(errors)}` : ''}

${warnings.length > 0 ? `## ⚠️ Warnings (${warnings.length})\n\n${this.formatViolations(warnings)}` : ''}

---

**Acção Necessária:**
${result.passed ? 'Corrigir warnings antes de deploy' : 'CORRIGIR ERROS antes de continuar'}
`
  }

  /**
   * Formatar lista de violações
   */
  private formatViolations(violations: ValidationResult['violations']): string {
    return violations.map(v => {
      const location = v.line ? `:${v.line}` : ''
      return `### ${v.file}${location}\n**Regra:** ${v.rule}\n**Problema:** ${v.description}\n`
    }).join('\n')
  }
}

/**
 * EXEMPLO DE USO NO PIPELINE:
 *
 * // 1. PM Agent gera PRD
 * const prd = await pmAgent.generatePRD()
 *
 * // 2. Architect Agent gera arquitectura + regras técnicas
 * const architecture = await architectAgent.generateArchitecture(prd)
 *
 * // 3. Coder Agent gera código (Claude/Ollama)
 * const generatedFiles = await coderAgent.generateCode(architecture)
 *
 * // 4. Code Validator valida contra regras técnicas
 * const validator = new CodeValidator(architecture)
 * const validationResult = await validator.validateBatch(generatedFiles)
 *
 * if (!validationResult.passed) {
 *   console.log(validator.generateReport(validationResult))
 *
 *   // Enviar violations de volta ao Coder Agent para corrigir
 *   const fixedFiles = await coderAgent.fixViolations(validationResult.violations)
 *
 *   // Re-validar
 *   const revalidation = await validator.validateBatch(fixedFiles)
 * }
 *
 * // 5. Se passou validação, avançar para QA Engine (testes funcionais)
 * const qaChecklist = generateAdaptiveChecklist(prd)
 * // ... executar testes
 */
