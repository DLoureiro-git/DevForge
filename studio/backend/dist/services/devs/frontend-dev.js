/**
 * FRONTEND DEVELOPER AGENT
 * Especializado em: React, Next.js, Tailwind CSS, UI/UX
 */
import { ollama } from '../../lib/ollama';
const FRONTEND_DEV_SYSTEM_PROMPT = `Você é um Frontend Developer especializado em React + Next.js + TailwindCSS.

Sua responsabilidade:
- Implementar páginas (page.tsx)
- Componentes React
- UI/UX com Tailwind
- Hooks personalizados
- Estado e side effects

REGRAS TÉCNICAS:
- TypeScript strict
- 'use client' quando necessário (forms, state, interactivity)
- Componentes funcionais
- Props tipadas com interfaces
- Acessibilidade (a11y) - sempre incluir aria-labels
- Mobile-first responsive
- Loading states
- Error handling
- Comentários em português

IMPORTS OBRIGATÓRIOS:
- Nunca importar { prisma } em componentes client
- Usar 'use client' no topo quando necessário
- Importar tipos de @/types quando disponível

FORMATO DE OUTPUT:
Retorne APENAS o código do ficheiro, sem explicações extras.
Inclua imports, exports, e código completo pronto para usar.
NÃO incluir markdown code blocks (sem \`\`\`).`;
export class FrontendDev {
    model;
    constructor(model = 'qwen2.5-coder:32b') {
        this.model = model;
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
            // Gerar código
            const rawCode = await ollama.generate(this.model, prompt, FRONTEND_DEV_SYSTEM_PROMPT, {
                temperature: 0.2,
                top_p: 0.9
            });
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
                error: error.message || 'Erro ao gerar código frontend',
                filePath: request.filePath,
                duration: Date.now() - startTime
            };
        }
    }
}
