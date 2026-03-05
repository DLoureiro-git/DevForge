/**
 * Testes Unitários — Code Validator
 *
 * Valida que o sistema de regras técnicas funciona correctamente
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CodeValidator } from '../code-validator';
describe('CodeValidator', () => {
    let mockArchitecture;
    beforeEach(() => {
        mockArchitecture = {
            stack: {
                frontend: 'Next.js 15',
                backend: 'Next.js API Routes',
                database: 'PostgreSQL via Prisma',
                auth: 'NextAuth.js v5',
                deployment: 'Vercel'
            },
            databaseSchema: {
                tables: []
            },
            fileStructure: {},
            technicalRules: [
                'Usar UUIDs (cuid) como IDs, NUNCA auto-increment integers',
                'TODAS as queries devem filtrar por businessId (multi-tenant)',
                'Passwords SEMPRE com bcrypt (12 rounds minimum)',
                'Env vars NUNCA hardcoded, sempre process.env',
                'TypeScript strict: sem "any", sem "@ts-ignore"',
                'API routes: validar auth ANTES de queries DB',
                'Formulários: validação client + server side',
                'Migrations: NUNCA editar existentes, sempre criar nova',
                'Relations: SEMPRE definir onDelete/onUpdate behavior',
                'NUNCA fazer deploy sem .env.example actualizado'
            ],
            architectureMarkdown: ''
        };
    });
    describe('Validação de IDs', () => {
        it('deve detectar autoincrement em vez de cuid', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const violatingCode = `
model Business {
  id Int @id @default(autoincrement())
  name String
}
      `;
            const result = await validator.validateFile('prisma/schema.prisma', violatingCode);
            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.rule.includes('Regra #1') &&
                v.severity === 'ERROR')).toBe(true);
        });
        it('deve aceitar cuid correctamente', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const validCode = `
model Business {
  id String @id @default(cuid())
  name String
}
      `;
            const result = await validator.validateFile('prisma/schema.prisma', validCode);
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
        });
    });
    describe('Validação de Multi-Tenancy', () => {
        it('deve detectar query sem businessId', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const violatingCode = `
export async function GET() {
  const deals = await prisma.deal.findMany()
  return NextResponse.json(deals)
}
      `;
            const result = await validator.validateFile('app/api/deals/route.ts', violatingCode);
            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.rule.includes('Regra #2') &&
                v.description.toLowerCase().includes('businessid'))).toBe(true);
        });
        it('deve aceitar query com businessId', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const validCode = `
export async function GET() {
  const session = await getServerSession()
  const deals = await prisma.deal.findMany({
    where: { businessId: session.user.businessId }
  })
  return NextResponse.json(deals)
}
      `;
            const result = await validator.validateFile('app/api/deals/route.ts', validCode);
            expect(result.passed).toBe(true);
        });
    });
    describe('Validação de Autenticação', () => {
        it('deve detectar bcrypt com rounds insuficientes', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const violatingCode = `
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)  // Deveria ser 12
}
      `;
            const result = await validator.validateFile('lib/auth.ts', violatingCode);
            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.rule.includes('Regra #3') &&
                v.description.toLowerCase().includes('12 rounds'))).toBe(true);
        });
        it('deve detectar API route sem validação de auth', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const violatingCode = `
export async function POST(req: Request) {
  const data = await req.json()
  const user = await prisma.user.create({ data })
  return NextResponse.json(user)
}
      `;
            const result = await validator.validateFile('app/api/users/route.ts', violatingCode);
            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.rule.includes('Regra #6') &&
                v.description.toLowerCase().includes('auth'))).toBe(true);
        });
    });
    describe('Validação de Segurança', () => {
        it('deve detectar hardcoded secrets', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const violatingCode = `
const STRIPE_KEY = 'sk_live_123456789'

export function processPayment() {
  stripe.charges.create({ ... })
}
      `;
            const result = await validator.validateFile('lib/payments.ts', violatingCode);
            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.rule.includes('Regra #4') &&
                v.severity === 'ERROR')).toBe(true);
        });
        it('deve aceitar env vars correctamente', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const validCode = `
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_KEY) throw new Error('STRIPE_SECRET_KEY not configured')

export function processPayment() {
  stripe.charges.create({ ... })
}
      `;
            const result = await validator.validateFile('lib/payments.ts', validCode);
            expect(result.passed).toBe(true);
        });
    });
    describe('Validação de TypeScript', () => {
        it('deve detectar uso de any', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const violatingCode = `
export function processData(data: any) {
  return data.map((item: any) => item.value)
}
      `;
            const result = await validator.validateFile('lib/utils.ts', violatingCode);
            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.rule.includes('Regra #5') &&
                v.description.toLowerCase().includes('any'))).toBe(true);
        });
        it('deve detectar @ts-ignore', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const violatingCode = `
export function getUser() {
  // @ts-ignore
  return prisma.user.findUnique({ where: { id: 123 } })
}
      `;
            const result = await validator.validateFile('lib/users.ts', violatingCode);
            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.rule.includes('Regra #5') &&
                v.description.toLowerCase().includes('@ts-ignore'))).toBe(true);
        });
    });
    describe('Validação em Batch', () => {
        it('deve validar múltiplos ficheiros e agregar violations', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const files = [
                {
                    path: 'prisma/schema.prisma',
                    content: `model Business { id Int @id @default(autoincrement()) }`
                },
                {
                    path: 'lib/auth.ts',
                    content: `const SECRET = 'hardcoded-secret'`
                },
                {
                    path: 'app/api/route.ts',
                    content: `export async function GET() { return prisma.user.findMany() }`
                }
            ];
            const result = await validator.validateBatch(files);
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(2);
            expect(result.summary).toContain('erro');
        });
    });
    describe('Geração de Relatório', () => {
        it('deve gerar relatório formatado para violations', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const mockResult = {
                passed: false,
                violations: [
                    {
                        rule: 'Regra #1',
                        file: 'schema.prisma',
                        line: 12,
                        description: 'Usa autoincrement em vez de cuid',
                        severity: 'ERROR'
                    },
                    {
                        rule: 'Regra #4',
                        file: 'auth.ts',
                        line: 5,
                        description: 'Secret hardcoded',
                        severity: 'ERROR'
                    }
                ],
                summary: '2 erros críticos encontrados'
            };
            const report = validator.generateReport(mockResult);
            expect(report).toContain('❌');
            expect(report).toContain('schema.prisma:12');
            expect(report).toContain('auth.ts:5');
            expect(report).toContain('Regra #1');
            expect(report).toContain('CORRIGIR ERROS');
        });
        it('deve gerar relatório de sucesso quando sem violations', () => {
            const validator = new CodeValidator(mockArchitecture);
            const mockResult = {
                passed: true,
                violations: [],
                summary: 'Código conforme às regras técnicas'
            };
            const report = validator.generateReport(mockResult);
            expect(report).toContain('✅');
            expect(report).toContain('Validação Aprovada');
            expect(report).not.toContain('❌');
        });
    });
    describe('Edge Cases', () => {
        it('deve handle resposta inválida do Ollama gracefully', async () => {
            const validator = new CodeValidator(mockArchitecture);
            // Simular falha de comunicação com Ollama
            const result = await validator.validateFile('invalid.ts', 'invalid code that crashes ollama');
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
            expect(result.summary).toContain('erro');
        });
        it('deve classificar severidades correctamente', async () => {
            const validator = new CodeValidator(mockArchitecture);
            const result = {
                passed: false,
                violations: [
                    { rule: 'R1', file: 'a.ts', description: 'X', severity: 'ERROR' },
                    { rule: 'R2', file: 'b.ts', description: 'Y', severity: 'ERROR' },
                    { rule: 'R3', file: 'c.ts', description: 'Z', severity: 'WARNING' }
                ],
                summary: '2 erros, 1 warning'
            };
            const report = validator.generateReport(result);
            expect(report).toContain('Erros (2)');
            expect(report).toContain('Warnings (1)');
        });
    });
});
/**
 * COMANDOS PARA EXECUTAR TESTES:
 *
 * # Todos os testes
 * npm test
 *
 * # Apenas code-validator
 * npm test code-validator
 *
 * # Com coverage
 * npm test -- --coverage
 *
 * # Watch mode
 * npm test -- --watch
 */
