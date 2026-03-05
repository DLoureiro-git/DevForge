"use strict";
/**
 * PROJECT GENERATOR — Cria Estrutura de Projecto Independente
 *
 * Gera projecto completo pronto para deploy:
 * - Estrutura de pastas
 * - package.json
 * - .env.example
 * - README.md
 * - Dockerfile (opcional)
 * - .gitignore
 * - Zip do projecto
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectGenerator = void 0;
exports.generateCompleteProject = generateCompleteProject;
const fs_1 = require("fs");
const path_1 = require("path");
const archiver_1 = __importDefault(require("archiver"));
// ============================================================================
// PROJECT GENERATOR
// ============================================================================
class ProjectGenerator {
    /**
     * Criar estrutura completa do projecto
     */
    createProjectStructure(config) {
        const { outputPath, architecture } = config;
        console.log(`📁 Criando estrutura do projecto em ${outputPath}`);
        // Criar pastas baseadas em architecture.fileStructure
        const folders = Object.keys(architecture.fileStructure || {});
        for (const folder of folders) {
            const folderPath = (0, path_1.join)(outputPath, folder);
            if (!(0, fs_1.existsSync)(folderPath)) {
                (0, fs_1.mkdirSync)(folderPath, { recursive: true });
                console.log(`  ✅ ${folder}`);
            }
        }
        // Criar pastas essenciais se não existirem
        const essentialFolders = [
            'src/app',
            'src/components',
            'src/lib',
            'prisma',
            'public'
        ];
        for (const folder of essentialFolders) {
            const folderPath = (0, path_1.join)(outputPath, folder);
            if (!(0, fs_1.existsSync)(folderPath)) {
                (0, fs_1.mkdirSync)(folderPath, { recursive: true });
            }
        }
        console.log('✅ Estrutura de pastas criada');
    }
    /**
     * Gerar package.json
     */
    generatePackageJson(prd, outputPath) {
        const dependencies = {
            'next': '^15.0.0',
            'react': '^19.0.0',
            'react-dom': '^19.0.0',
            '@prisma/client': '^5.10.0',
            'next-auth': '^5.0.0',
            'bcryptjs': '^2.4.3',
            'zod': '^3.22.4'
        };
        const devDependencies = {
            'typescript': '^5.3.3',
            '@types/node': '^20.11.0',
            '@types/react': '^19.0.0',
            '@types/react-dom': '^19.0.0',
            '@types/bcryptjs': '^2.4.6',
            'prisma': '^5.10.0',
            'tailwindcss': '^3.4.1',
            'autoprefixer': '^10.4.17',
            'postcss': '^8.4.33',
            'eslint': '^8.56.0',
            'eslint-config-next': '^15.0.0'
        };
        // Adicionar dependencies condicionais
        if (prd.technical?.hasPayments) {
            dependencies['stripe'] = '^14.15.0';
        }
        if (prd.technical?.hasEmail) {
            dependencies['resend'] = '^3.2.0';
        }
        if (prd.technical?.hasFileUpload) {
            dependencies['@vercel/blob'] = '^0.19.0';
        }
        if (prd.technical?.hasRealtime) {
            dependencies['pusher'] = '^5.2.0';
            dependencies['pusher-js'] = '^8.4.0-rc2';
        }
        const scripts = {
            'dev': 'next dev',
            'build': 'prisma generate && next build',
            'start': 'next start',
            'lint': 'next lint',
            'db:push': 'prisma db push',
            'db:migrate': 'prisma migrate dev',
            'db:studio': 'prisma studio'
        };
        const packageJson = {
            name: prd.projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: prd.tagline || prd.userSummary,
            private: true,
            scripts,
            dependencies,
            devDependencies,
            engines: {
                node: '>=20.0.0',
                npm: '>=10.0.0'
            }
        };
        const filePath = (0, path_1.join)(outputPath, 'package.json');
        (0, fs_1.writeFileSync)(filePath, JSON.stringify(packageJson, null, 2), 'utf-8');
        console.log('✅ package.json criado');
    }
    /**
     * Gerar .env.example
     */
    generateEnvExample(architecture, outputPath) {
        const envVars = [
            '# Database',
            'DATABASE_URL="postgresql://user:password@localhost:5432/dbname"',
            '',
            '# NextAuth',
            'NEXTAUTH_SECRET="your-secret-here-min-32-chars"',
            'NEXTAUTH_URL="http://localhost:3000"',
            ''
        ];
        // Auth providers
        if (architecture.stack?.auth?.includes('Google') || architecture.stack?.auth?.includes('OAuth')) {
            envVars.push('# Google OAuth');
            envVars.push('GOOGLE_CLIENT_ID="your-google-client-id"');
            envVars.push('GOOGLE_CLIENT_SECRET="your-google-client-secret"');
            envVars.push('');
        }
        // Payments
        if (architecture.stack?.payments) {
            envVars.push('# Stripe');
            envVars.push('STRIPE_SECRET_KEY="sk_test_..."');
            envVars.push('STRIPE_PUBLISHABLE_KEY="pk_test_..."');
            envVars.push('STRIPE_WEBHOOK_SECRET="whsec_..."');
            envVars.push('');
        }
        // Email
        if (architecture.stack?.storage) {
            envVars.push('# Resend Email');
            envVars.push('RESEND_API_KEY="re_..."');
            envVars.push('');
        }
        // File upload
        if (architecture.stack?.storage?.includes('Blob')) {
            envVars.push('# Vercel Blob');
            envVars.push('BLOB_READ_WRITE_TOKEN="vercel_blob_..."');
            envVars.push('');
        }
        const filePath = (0, path_1.join)(outputPath, '.env.example');
        (0, fs_1.writeFileSync)(filePath, envVars.join('\n'), 'utf-8');
        console.log('✅ .env.example criado');
    }
    /**
     * Gerar README.md
     */
    generateReadme(config) {
        const { projectName, prd, architecture, deliveryDoc, outputPath } = config;
        const readme = `# ${projectName}

${prd.tagline || prd.userSummary}

---

## 🚀 Quick Start

### 1. Instalar dependências
\`\`\`bash
npm install
\`\`\`

### 2. Configurar ambiente
Copiar \`.env.example\` para \`.env\` e preencher variáveis:
\`\`\`bash
cp .env.example .env
\`\`\`

### 3. Setup da base de dados
\`\`\`bash
npm run db:push
\`\`\`

### 4. Executar em desenvolvimento
\`\`\`bash
npm run dev
\`\`\`

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📦 Stack Técnica

- **Frontend:** ${architecture.stack.frontend}
- **Backend:** ${architecture.stack.backend}
- **Database:** ${architecture.stack.database}
- **Auth:** ${architecture.stack.auth}
${architecture.stack.payments ? `- **Payments:** ${architecture.stack.payments}` : ''}
${architecture.stack.storage ? `- **Storage:** ${architecture.stack.storage}` : ''}
- **Deployment:** ${architecture.stack.deployment}

---

## 📚 Documentação

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura técnica completa
${deliveryDoc ? '- [DELIVERY.md](./DELIVERY.md) - Guia de deployment e entrega' : ''}

---

## 🗄️ Database Schema

${this.formatDatabaseSchemaForReadme(architecture.databaseSchema)}

---

## 🔐 Environment Variables

Ver \`.env.example\` para lista completa de variáveis necessárias.

**Variáveis obrigatórias:**
- \`DATABASE_URL\` - Connection string PostgreSQL
- \`NEXTAUTH_SECRET\` - Secret para NextAuth (mínimo 32 caracteres)
- \`NEXTAUTH_URL\` - URL da aplicação

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Push para GitHub
2. Importar projecto no Vercel
3. Configurar env vars no dashboard
4. Deploy automático

### Railway

1. Criar projecto Railway
2. Conectar GitHub repo
3. Adicionar PostgreSQL database
4. Configurar env vars
5. Deploy

---

## 📝 Scripts Disponíveis

- \`npm run dev\` - Servidor de desenvolvimento
- \`npm run build\` - Build de produção
- \`npm run start\` - Servidor de produção
- \`npm run lint\` - Linter
- \`npm run db:push\` - Sync schema com DB (desenvolvimento)
- \`npm run db:migrate\` - Criar migration
- \`npm run db:studio\` - Prisma Studio (GUI para DB)

---

## 🐛 Troubleshooting

### Erro de conexão à base de dados
Verificar \`DATABASE_URL\` em \`.env\`

### NextAuth error
Verificar \`NEXTAUTH_SECRET\` tem pelo menos 32 caracteres

### Build error
Executar \`npm run db:push\` antes de \`npm run build\`

---

**Gerado por DevForge V2**
`;
        const filePath = (0, path_1.join)(outputPath, 'README.md');
        (0, fs_1.writeFileSync)(filePath, readme, 'utf-8');
        console.log('✅ README.md criado');
    }
    /**
     * Gerar Dockerfile (opcional)
     */
    generateDockerfile(outputPath) {
        const dockerfile = `FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
`;
        const filePath = (0, path_1.join)(outputPath, 'Dockerfile');
        (0, fs_1.writeFileSync)(filePath, dockerfile, 'utf-8');
        console.log('✅ Dockerfile criado');
    }
    /**
     * Gerar .gitignore
     */
    generateGitignore(outputPath) {
        const gitignore = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
prisma/migrations/
`;
        const filePath = (0, path_1.join)(outputPath, '.gitignore');
        (0, fs_1.writeFileSync)(filePath, gitignore, 'utf-8');
        console.log('✅ .gitignore criado');
    }
    /**
     * Criar zip do projecto
     */
    async zipProject(projectPath) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', reject);
            // Adicionar todos os ficheiros (exceto node_modules, .next, etc.)
            const excludePatterns = ['node_modules', '.next', '.git', 'dist', 'build', 'out'];
            const addDirectory = (dirPath, zipPath = '') => {
                const files = (0, fs_1.readdirSync)(dirPath);
                for (const file of files) {
                    const fullPath = (0, path_1.join)(dirPath, file);
                    const relPath = zipPath ? (0, path_1.join)(zipPath, file) : file;
                    if (excludePatterns.includes(file)) {
                        continue;
                    }
                    const stat = (0, fs_1.statSync)(fullPath);
                    if (stat.isDirectory()) {
                        addDirectory(fullPath, relPath);
                    }
                    else {
                        archive.file(fullPath, { name: relPath });
                    }
                }
            };
            addDirectory(projectPath);
            archive.finalize();
        });
    }
    /**
     * Formatar database schema para README
     */
    formatDatabaseSchemaForReadme(schema) {
        if (!schema?.tables || schema.tables.length === 0) {
            return 'Ver `prisma/schema.prisma` para schema completo.';
        }
        const tables = schema.tables.slice(0, 5); // Primeiras 5 tabelas
        let output = '```\n';
        for (const table of tables) {
            output += `${table.name}\n`;
            for (const field of table.fields.slice(0, 5)) {
                output += `  - ${field.name}: ${field.type}\n`;
            }
            if (table.fields.length > 5) {
                output += `  ... e mais ${table.fields.length - 5} campos\n`;
            }
            output += '\n';
        }
        if (schema.tables.length > 5) {
            output += `... e mais ${schema.tables.length - 5} tabelas\n`;
        }
        output += '```\n\nVer `ARCHITECTURE.md` para schema completo.';
        return output;
    }
}
exports.ProjectGenerator = ProjectGenerator;
/**
 * Helper standalone
 */
async function generateCompleteProject(config) {
    const generator = new ProjectGenerator();
    generator.createProjectStructure(config);
    generator.generatePackageJson(config.prd, config.outputPath);
    generator.generateEnvExample(config.architecture, config.outputPath);
    generator.generateReadme(config);
    generator.generateDockerfile(config.outputPath);
    generator.generateGitignore(config.outputPath);
    console.log('✅ Projecto completo gerado!');
}
