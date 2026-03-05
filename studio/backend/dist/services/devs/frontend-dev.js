"use strict";
/**
 * FRONTEND DEVELOPER AGENT
 * Especializado em: React, Next.js, Tailwind CSS, UI/UX
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendDev = void 0;
const ollama_1 = require("../../lib/ollama");
const dev_config_1 = require("./dev-config");
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
class FrontendDev {
    model;
    constructor(model) {
        this.model = model || (0, dev_config_1.getModelForDev)('frontend');
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
            (0, dev_config_1.devLog)(`[Frontend] Gerando ${request.filePath}...`);
            // Gerar código
            const rawCode = await ollama_1.ollama.generate(this.model, prompt, FRONTEND_DEV_SYSTEM_PROMPT, (0, dev_config_1.getOllamaOptions)());
            // Limpar markdown code blocks se existirem
            const code = ollama_1.ollama.removeMarkdownCodeBlocks(rawCode).trim();
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
exports.FrontendDev = FrontendDev;
