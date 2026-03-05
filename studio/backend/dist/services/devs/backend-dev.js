/**
 * BACKEND DEVELOPER AGENT
 * Especializado em: Next.js API Routes, Prisma, Validações, Security
 */
import { ollama } from '../../lib/ollama';
import { getModelForDev, getOllamaOptions, devLog } from './dev-config';
const BACKEND_DEV_SYSTEM_PROMPT = `Você é um Backend Developer especializado em Next.js API Routes + Prisma.

Sua responsabilidade:
- Implementar rotas API (route.ts)
- Queries Prisma otimizadas
- Validações de input
- Error handling
- Multi-tenant security (SEMPRE filtrar por businessId quando aplicável)

REGRAS TÉCNICAS:
- TypeScript strict
- Validar TODOS os inputs
- Retornar NextResponse com status codes corretos
- Incluir try/catch
- Comentários em português
- Importar { prisma } from '@/lib/prisma'
- NUNCA retornar dados de outro business (se multi-tenant)

ESTRUTURA PADRÃO DE API ROUTE:
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check (se protegido)
    // 2. Parse query params
    // 3. Validate inputs
    // 4. Execute Prisma query
    // 5. Return data
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Mensagem de erro' },
      { status: 500 }
    )
  }
}

FORMATO DE OUTPUT:
Retorne APENAS o código do ficheiro, sem explicações extras.
Inclua imports, exports, e código completo pronto para usar.
NÃO incluir markdown code blocks (sem \`\`\`).`;
export class BackendDev {
    model;
    constructor(model) {
        this.model = model || getModelForDev('backend');
    }
    async generateCode(request) {
        const startTime = Date.now();
        try {
            // Construir prompt
            const rulesSection = request.technicalRules?.length
                ? `\n\nREGRAS TÉCNICAS DO ARCHITECT:\n${request.technicalRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
                : '';
            const prompt = `ARCHITECTURE:
${request.architecture}
${rulesSection}

FICHEIRO A IMPLEMENTAR:
Path: ${request.filePath}
Descrição: ${request.fileDescription}

Implemente o código completo para este ficheiro seguindo a arquitectura e regras técnicas.
Retorne APENAS o código, sem markdown code blocks, sem explicações.`;
            devLog(`[Backend] Gerando ${request.filePath}...`);
            // Gerar código
            const rawCode = await ollama.generate(this.model, prompt, BACKEND_DEV_SYSTEM_PROMPT, getOllamaOptions());
            // Limpar markdown code blocks se existirem
            const code = ollama.removeMarkdownCodeBlocks(rawCode).trim();
            return {
                success: true,
                code,
                filePath: request.filePath,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Erro ao gerar código backend',
                filePath: request.filePath,
                duration: Date.now() - startTime
            };
        }
    }
}
