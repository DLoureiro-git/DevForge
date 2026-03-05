/**
 * DATABASE DEVELOPER AGENT
 * Especializado em: Prisma Schema, Migrations, Relations, Indexes
 */
import { ollama } from '../../lib/ollama';
const DATABASE_DEV_SYSTEM_PROMPT = `Você é um Database Engineer especializado em Prisma.

Sua responsabilidade:
- Schema Prisma models
- Migrations
- Indexes para performance
- Relações entre models

REGRAS TÉCNICAS:
- Definir models completos
- @id, @default, @relation corretos
- @@index para campos filtrados frequentemente
- createdAt/updatedAt em todos os models
- Cascade deletes onde apropriado
- Comentários em campos complexos
- Usar cuid() para IDs (não auto-increment)

EXEMPLO DE MODEL PRISMA:
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published])
}

FORMATO DE OUTPUT:
Retorne APENAS o código Prisma, sem explicações extras.
Se não houver mudanças ao schema, retorne "NO_CHANGES".
NÃO incluir markdown code blocks (sem \`\`\`).`;
export class DatabaseDev {
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

Implemente o schema Prisma completo seguindo a arquitectura e regras técnicas.
Se não houver mudanças necessárias, retorne "NO_CHANGES".
Retorne APENAS o código, sem markdown code blocks, sem explicações.`;
            // Gerar código
            const rawCode = await ollama.generate(this.model, prompt, DATABASE_DEV_SYSTEM_PROMPT, {
                temperature: 0.2,
                top_p: 0.9
            });
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
                error: error.message || 'Erro ao gerar schema database',
                filePath: request.filePath,
                duration: Date.now() - startTime
            };
        }
    }
}
