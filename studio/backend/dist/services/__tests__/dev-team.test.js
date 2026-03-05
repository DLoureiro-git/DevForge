/**
 * TESTES UNITÁRIOS — Dev Team
 */
import { DevTeam } from '../dev-team';
describe('DevTeam', () => {
    let devTeam;
    beforeEach(() => {
        devTeam = new DevTeam();
    });
    describe('assignFilesToDevs', () => {
        it('deve atribuir API routes ao backend dev', () => {
            const architecture = `
# Architecture

## Files

- src/app/api/posts/route.ts
- src/app/api/auth/login/route.ts
      `;
            const assignments = devTeam.assignFilesToDevs(architecture);
            expect(assignments).toHaveLength(2);
            expect(assignments[0].devRole).toBe('backend');
            expect(assignments[0].filePath).toBe('src/app/api/posts/route.ts');
            expect(assignments[1].devRole).toBe('backend');
        });
        it('deve atribuir pages ao frontend dev', () => {
            const architecture = `
# Architecture

## Files

- src/app/(app)/dashboard/page.tsx
- src/app/(app)/posts/page.tsx
      `;
            const assignments = devTeam.assignFilesToDevs(architecture);
            expect(assignments).toHaveLength(2);
            expect(assignments[0].devRole).toBe('frontend');
            expect(assignments[1].devRole).toBe('frontend');
        });
        it('deve atribuir schema.prisma ao database dev', () => {
            const architecture = `
# Architecture

## Files

- prisma/schema.prisma
      `;
            const assignments = devTeam.assignFilesToDevs(architecture);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].devRole).toBe('database');
            expect(assignments[0].filePath).toBe('prisma/schema.prisma');
        });
        it('deve atribuir contexts ao utils dev', () => {
            const architecture = `
# Architecture

## Files

- src/contexts/AuthContext.tsx
- src/hooks/useAuth.ts
      `;
            const assignments = devTeam.assignFilesToDevs(architecture);
            expect(assignments.length).toBeGreaterThan(0);
            const contextAssignment = assignments.find(a => a.filePath.includes('Context'));
            expect(contextAssignment?.devRole).toBe('utils');
        });
        it('deve criar assignment genérico se não encontrar ficheiros', () => {
            const architecture = `
# Architecture

Este é um projecto simples.
      `;
            const assignments = devTeam.assignFilesToDevs(architecture);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].devRole).toBe('frontend');
        });
        it('deve ignorar linhas de comentário e headers', () => {
            const architecture = `
# Architecture

## Files to create

### API Routes
- src/app/api/users/route.ts # Endpoint para users

### Pages
- src/app/(app)/users/page.tsx # Lista de users
      `;
            const assignments = devTeam.assignFilesToDevs(architecture);
            expect(assignments).toHaveLength(2);
            expect(assignments[0].filePath).toBe('src/app/api/users/route.ts');
            expect(assignments[1].filePath).toBe('src/app/(app)/users/page.tsx');
        });
    });
    describe('extractFilePath', () => {
        it('deve extrair path de linha com bullets', () => {
            const devTeamAny = devTeam;
            const path = devTeamAny.extractFilePath('- src/app/page.tsx');
            expect(path).toBe('src/app/page.tsx');
        });
        it('deve remover comentários do path', () => {
            const devTeamAny = devTeam;
            const path = devTeamAny.extractFilePath('- src/app/page.tsx # Homepage');
            expect(path).toBe('src/app/page.tsx');
        });
        it('deve remover backticks', () => {
            const devTeamAny = devTeam;
            const path = devTeamAny.extractFilePath('`src/app/page.tsx`');
            expect(path).toBe('src/app/page.tsx');
        });
        it('deve retornar null para linhas sem extensão válida', () => {
            const devTeamAny = devTeam;
            const path = devTeamAny.extractFilePath('- alguma coisa random');
            expect(path).toBeNull();
        });
    });
    describe('generateAllCode', () => {
        it('deve processar assignments em paralelo', async () => {
            const mockArchitecture = 'Mock architecture';
            const assignments = [
                {
                    devRole: 'frontend',
                    filePath: 'src/app/page.tsx',
                    description: 'Homepage'
                },
                {
                    devRole: 'backend',
                    filePath: 'src/app/api/test/route.ts',
                    description: 'Test API'
                }
            ];
            const result = await devTeam.generateAllCode({ architecture: mockArchitecture }, assignments);
            // Verificar estrutura básica
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('files');
            expect(result).toHaveProperty('stats');
            expect(result.files).toHaveLength(2);
            expect(result.stats.total).toBe(2);
        }, 60000); // 60s timeout para chamadas Ollama
        it('deve calcular stats correctamente', async () => {
            const mockArchitecture = 'Mock architecture';
            const assignments = [
                {
                    devRole: 'frontend',
                    filePath: 'src/app/page.tsx',
                    description: 'Homepage'
                }
            ];
            const result = await devTeam.generateAllCode({ architecture: mockArchitecture }, assignments);
            expect(result.stats.total).toBe(1);
            expect(result.stats.successful + result.stats.failed + result.stats.noChanges).toBe(result.stats.total);
        }, 60000);
    });
    describe('execute', () => {
        it('deve executar pipeline completo (assign + generate)', async () => {
            const mockArchitecture = `
# Mock Architecture

## Files

- src/app/api/test/route.ts
      `;
            const result = await devTeam.execute({
                architecture: mockArchitecture
            });
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('files');
            expect(result).toHaveProperty('stats');
            expect(result.files.length).toBeGreaterThan(0);
        }, 60000);
    });
});
