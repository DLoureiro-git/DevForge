"use strict";
/**
 * EXEMPLO COMPLETO — Fluxo de Regras Técnicas no DevForge
 *
 * Demonstra como as regras técnicas são geradas pelo Architect
 * e enforçadas pelo Code Validator durante o desenvolvimento.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleFlow = exampleFlow;
const pm_agent_1 = require("../services/pm-agent");
const architect_1 = require("../services/architect");
const code_validator_1 = require("../services/code-validator");
/**
 * CENÁRIO: User quer criar um CRM multi-tenant com autenticação
 */
async function exampleFlow() {
    console.log('🚀 DevForge V2 — Fluxo Completo com Regras Técnicas\n');
    // ============================================================================
    // FASE 1: PM AGENT — Intake & PRD Generation
    // ============================================================================
    console.log('📋 FASE 1: PM Agent a gerar PRD...\n');
    const pmAgent = new pm_agent_1.PMAgent();
    // Simulação de respostas do utilizador (normalmente via chat)
    const mockPRD = {
        projectName: 'SalesPro CRM',
        tagline: 'CRM simples para pequenas equipas de vendas',
        userSummary: 'Plataforma para gerir contactos, negócios e pipeline de vendas',
        targetUsers: ['Equipas de vendas (2-10 pessoas)'],
        mainProblem: 'Gestão caótica de contactos e negócios em spreadsheets',
        pages: [
            { name: 'Dashboard', purpose: 'Visão geral de pipeline', accessLevel: 'authenticated' },
            { name: 'Contactos', purpose: 'Lista e gestão de contactos', accessLevel: 'authenticated' },
            { name: 'Negócios', purpose: 'Pipeline de vendas', accessLevel: 'authenticated' },
            { name: 'Login', purpose: 'Autenticação', accessLevel: 'public' }
        ],
        features: [
            { name: 'Multi-Tenant', description: 'Cada empresa tem dados isolados', priority: 'HIGH' },
            { name: 'Auth Email', description: 'Login com email/password', priority: 'HIGH' },
            { name: 'Gestão Contactos', description: 'CRUD completo de contactos', priority: 'HIGH' },
            { name: 'Pipeline Visual', description: 'Drag & drop de negócios', priority: 'MEDIUM' }
        ],
        userFlows: [
            { name: 'Signup', steps: ['Criar conta', 'Criar empresa', 'Convidar equipa'] },
            { name: 'Criar Negócio', steps: ['Selecionar contacto', 'Definir valor', 'Atribuir fase'] }
        ],
        designPreferences: {
            style: 'Moderno e limpo',
            colors: 'Azul profissional',
            platform: 'Desktop primeiro, mobile secundário',
            reference: 'Pipedrive'
        },
        technical: {
            hasAuth: true,
            authMethod: 'Email',
            hasPayments: false,
            hasFileUpload: false,
            hasRealtime: false,
            hasEmail: true,
            hasDashboard: true,
            hasMultiTenant: true
        },
        estimatedMinutes: 45,
        complexity: 'MEDIUM'
    };
    console.log('✅ PRD gerado:\n', JSON.stringify(mockPRD, null, 2), '\n\n');
    // ============================================================================
    // FASE 2: ARCHITECT AGENT — Architecture + Technical Rules
    // ============================================================================
    console.log('🏗️ FASE 2: Architect Agent a gerar arquitectura + regras técnicas...\n');
    const architectAgent = new architect_1.ArchitectAgent();
    const architecture = await architectAgent.generateArchitecture(mockPRD);
    console.log('✅ Stack Técnica:', architecture.stack, '\n');
    console.log('✅ Database Schema:', architecture.databaseSchema.tables.length, 'tabelas\n');
    console.log('✅ File Structure:', Object.keys(architecture.fileStructure).length, 'directories\n');
    console.log('⚠️ REGRAS TÉCNICAS GERADAS (' + architecture.technicalRules.length + '):\n');
    architecture.technicalRules.forEach((rule, i) => {
        console.log(`   ${i + 1}. ${rule}`);
    });
    console.log('\n');
    // ============================================================================
    // FASE 3: CODER AGENT — Code Generation (simulado)
    // ============================================================================
    console.log('💻 FASE 3: Coder Agent a gerar código...\n');
    // Simulação de código gerado (normalmente viria do Claude/Ollama)
    const generatedFiles = [
        {
            path: 'prisma/schema.prisma',
            content: `// Schema gerado pelo Coder Agent
model User {
  id        String   @id @default(uuid())  // ❌ ERRO: Devia ser cuid()
  email     String   @unique
  password  String   // ⚠️ WARNING: Falta comentário sobre bcrypt
  businessId String
  business  Business @relation(fields: [businessId], references: [id])
  createdAt DateTime @default(now())
}

model Business {
  id    Int      @id @default(autoincrement())  // ❌ ERRO CRÍTICO: Devia ser String @default(cuid())
  name  String
  users User[]
  deals Deal[]
}

model Deal {
  id     String   @id @default(cuid())  // ✅ CORRECTO
  title  String
  value  Float
  // ❌ ERRO: Falta businessId (multi-tenant)
  userId String
  user   User     @relation(fields: [userId], references: [id])
}`
        },
        {
            path: 'app/api/deals/route.ts',
            content: `// API Route gerado pelo Coder Agent
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // ❌ ERRO CRÍTICO: Sem validação de auth
  // ❌ ERRO CRÍTICO: Sem filtro por businessId (multi-tenant)
  const deals = await prisma.deal.findMany()
  return NextResponse.json(deals)
}

export async function POST(req: Request) {
  const { title, value, userId } = await req.json()

  // ⚠️ WARNING: Sem validação de input (zod)
  // ❌ ERRO: Sem businessId
  const deal = await prisma.deal.create({
    data: { title, value, userId }
  })

  return NextResponse.json(deal)
}`
        },
        {
            path: 'lib/auth.ts',
            content: `// Auth helper gerado pelo Coder Agent
import bcrypt from 'bcrypt'

const API_KEY = 'sk_live_123456'  // ❌ ERRO CRÍTICO: Hardcoded secret

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)  // ⚠️ WARNING: Devia ser 12 rounds
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)  // ✅ CORRECTO
}`
        }
    ];
    console.log('✅ Código gerado:', generatedFiles.length, 'ficheiros\n\n');
    // ============================================================================
    // FASE 4: CODE VALIDATOR — Enforce Technical Rules
    // ============================================================================
    console.log('🔍 FASE 4: Code Validator a validar contra regras técnicas...\n');
    const validator = new code_validator_1.CodeValidator(architecture);
    const validationResult = await validator.validateBatch(generatedFiles);
    console.log('📊 RESULTADO DA VALIDAÇÃO:\n');
    console.log('   Passou:', validationResult.passed ? '❌ NÃO' : '❌ NÃO');
    console.log('   Erros:', validationResult.violations.filter(v => v.severity === 'ERROR').length);
    console.log('   Warnings:', validationResult.violations.filter(v => v.severity === 'WARNING').length);
    console.log('\n');
    // Gerar relatório detalhado
    const report = validator.generateReport(validationResult);
    console.log(report);
    console.log('\n');
    // ============================================================================
    // FASE 5: AUTO-FIX (opcional)
    // ============================================================================
    if (!validationResult.passed) {
        console.log('🔧 FASE 5: Enviar violations ao Coder Agent para correcção automática...\n');
        // Aqui o sistema enviaria as violations de volta ao Coder Agent
        // para gerar código corrigido automaticamente
        console.log('📝 Violations a corrigir:');
        validationResult.violations
            .filter(v => v.severity === 'ERROR')
            .forEach(v => {
            console.log(`   - ${v.file}: ${v.description}`);
        });
        console.log('\n🔄 Iteração de correcção seria executada aqui...\n');
    }
    // ============================================================================
    // FASE 6: ARCHITECTURE.md (output final)
    // ============================================================================
    console.log('📄 FASE 6: Gerar ARCHITECTURE.md...\n');
    console.log('✅ ARCHITECTURE.md gerado com', architecture.architectureMarkdown.length, 'caracteres');
    console.log('\nConteúdo inclui:');
    console.log('   - Stack técnica');
    console.log('   - Database schema');
    console.log('   - File structure');
    console.log('   - ⚠️ REGRAS TÉCNICAS OBRIGATÓRIAS (enforçadas)');
    console.log('   - Features principais');
    console.log('   - Notas de segurança');
    console.log('   - Env vars necessárias\n');
    // Exemplo de ARCHITECTURE.md snippet
    console.log('--- PREVIEW DO ARCHITECTURE.MD ---\n');
    console.log(architecture.architectureMarkdown.substring(0, 800) + '...\n');
}
/**
 * BENEFÍCIOS DO SISTEMA DE REGRAS TÉCNICAS:
 *
 * 1. **Previne Context Drift:**
 *    - Claude e Ollama seguem as mesmas regras exactas
 *    - Reduz inconsistências entre modelos diferentes
 *
 * 2. **Enforcement Automático:**
 *    - Validação automática antes de deploy
 *    - Feedback imediato para Coder Agent
 *
 * 3. **Rastreabilidade:**
 *    - Todas as regras documentadas em ARCHITECTURE.md
 *    - Audit trail de violations
 *
 * 4. **Adaptativo ao PRD:**
 *    - Regras específicas para features do projecto
 *    - Multi-tenant → businessId obrigatório
 *    - Auth → bcrypt + session validation
 *
 * 5. **Iteração Rápida:**
 *    - Auto-fix de violations comuns
 *    - Reduz ciclos de correcção manual
 */
// Executar exemplo se rodado directamente
if (require.main === module) {
    exampleFlow()
        .then(() => {
        console.log('✅ Exemplo completo executado com sucesso!');
        process.exit(0);
    })
        .catch(error => {
        console.error('❌ Erro:', error);
        process.exit(1);
    });
}
