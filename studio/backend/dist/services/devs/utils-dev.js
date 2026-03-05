/**
 * UTILS DEVELOPER AGENT
 * Especializado em: Contexts, Hooks, Utility Functions, Types
 */
import { ollama } from '../../lib/ollama';
import { getModelForDev, getOllamaOptions, devLog } from './dev-config';
const UTILS_DEV_SYSTEM_PROMPT = `Você é um Developer especializado em Contexts, Utils e Shared Logic.

Sua responsabilidade:
- Contexts React
- Hooks personalizados
- Utility functions
- Types/Interfaces compartilhadas

REGRAS TÉCNICAS:
- TypeScript strict
- Hooks seguem convenções React (use*)
- Contexts com Provider/Consumer
- Utils puros (sem side effects)
- Documentação clara
- Comentários em português

EXEMPLO DE CONTEXT:
'use client'
import { createContext, useContext, ReactNode } from 'react'

interface MyContextType {
  value: string
  setValue: (v: string) => void
}

const MyContext = createContext<MyContextType | undefined>(undefined)

export function MyProvider({ children }: { children: ReactNode }) {
  // ... implementation
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>
}

export function useMyContext() {
  const context = useContext(MyContext)
  if (!context) throw new Error('useMyContext must be used within MyProvider')
  return context
}

EXEMPLO DE HOOK:
'use client'
import { useState, useEffect } from 'react'

export function useMyHook() {
  const [state, setState] = useState(null)

  useEffect(() => {
    // ... logic
  }, [])

  return { state, setState }
}

EXEMPLO DE UTIL:
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

FORMATO DE OUTPUT:
Retorne APENAS o código do ficheiro, sem explicações extras.
Se não houver mudanças necessárias, retorne "NO_CHANGES".
NÃO incluir markdown code blocks (sem \`\`\`).`;
export class UtilsDev {
    model;
    constructor(model) {
        this.model = model || getModelForDev('utils');
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

Implemente o código completo seguindo a arquitectura e regras técnicas.
Se não houver mudanças necessárias, retorne "NO_CHANGES".
Retorne APENAS o código, sem markdown code blocks, sem explicações.`;
            devLog(`[Utils] Gerando ${request.filePath}...`);
            // Gerar código
            const rawCode = await ollama.generate(this.model, prompt, UTILS_DEV_SYSTEM_PROMPT, getOllamaOptions());
            // Limpar markdown code blocks se existirem
            const code = ollama.removeMarkdownCodeBlocks(rawCode).trim();
            // Verificar se é NO_CHANGES
            if (code === 'NO_CHANGES' || code.includes('NO_CHANGES')) {
                return {
                    success: true,
                    noChanges: true,
                    filePath: request.filePath,
                    duration: Date.now() - startTime
                };
            }
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
                error: error.message || 'Erro ao gerar utils/contexts',
                filePath: request.filePath,
                duration: Date.now() - startTime
            };
        }
    }
}
