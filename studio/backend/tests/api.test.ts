/**
 * DevForge V2 — FASE 8: Testes Backend API
 *
 * Testes automatizados para todos os endpoints principais:
 * - Multi-tenant isolation
 * - CRUD de projetos
 * - Sprints e Features
 * - Pipeline lifecycle
 * - Settings e Ollama status
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { prisma } from '../src/lib/prisma.js';
import authRoutes from '../src/routes/auth.js';
import projectsRoutes from '../src/routes/projects.js';
import settingsRoutes from '../src/routes/settings.js';
import ollamaRoutes from '../src/routes/ollama.js';
import { errorHandler, notFound } from '../src/middleware/error.js';

// Setup Express app for tests
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ollama', ollamaRoutes);
app.use(notFound);
app.use(errorHandler);

// Test user IDs
let userA: string;
let userB: string;
let projectA: string;
let projectB: string;
let sprintA: string;
let featureA: string;

// Cleanup DB before tests
beforeAll(async () => {
  // Clean up test data
  await prisma.activityLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.dailyReport.deleteMany({});
  await prisma.feature.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.bug.deleteMany({});
  await prisma.log.deleteMany({});
  await prisma.phase.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: { in: ['testA@devforge.test', 'testB@devforge.test'] },
    },
  });

  // Create test users
  const userAData = await prisma.user.create({
    data: {
      email: 'testA@devforge.test',
      name: 'Test User A',
      plan: 'FREE',
    },
  });
  userA = userAData.id;

  const userBData = await prisma.user.create({
    data: {
      email: 'testB@devforge.test',
      name: 'Test User B',
      plan: 'FREE',
    },
  });
  userB = userBData.id;
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.activityLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.dailyReport.deleteMany({});
  await prisma.feature.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.bug.deleteMany({});
  await prisma.log.deleteMany({});
  await prisma.phase.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: { in: ['testA@devforge.test', 'testB@devforge.test'] },
    },
  });
  await prisma.$disconnect();
});

describe('Backend API Tests', () => {
  describe('POST /api/projects — Create Project', () => {
    it('deve criar projeto com dados válidos', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('X-User-ID', userA)
        .send({
          name: 'Test Project A',
          description: 'A simple booking app',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Project A');
      expect(res.body.status).toBe('INTAKE');
      expect(res.body.userId).toBe(userA);

      projectA = res.body.id;
    });

    it('deve criar projeto para User B', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('X-User-ID', userB)
        .send({
          name: 'Test Project B',
          description: 'Another app for User B',
        });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userB);
      projectB = res.body.id;
    });

    it('deve falhar sem name', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('X-User-ID', userA)
        .send({ description: 'Missing name' });

      expect(res.status).toBe(400);
    });

    it('deve falhar sem description', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('X-User-ID', userA)
        .send({ name: 'Missing Description' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/projects — Multi-tenant Isolation', () => {
    it('User A só deve ver os seus projetos', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('X-User-ID', userA);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Deve conter apenas projeto de User A
      const hasProjectA = res.body.some((p: any) => p.id === projectA);
      const hasProjectB = res.body.some((p: any) => p.id === projectB);

      expect(hasProjectA).toBe(true);
      expect(hasProjectB).toBe(false);
    });

    it('User B só deve ver os seus projetos', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('X-User-ID', userB);

      expect(res.status).toBe(200);

      const hasProjectA = res.body.some((p: any) => p.id === projectA);
      const hasProjectB = res.body.some((p: any) => p.id === projectB);

      expect(hasProjectA).toBe(false);
      expect(hasProjectB).toBe(true);
    });
  });

  describe('GET /api/projects/:id — Get Project Details', () => {
    it('User A pode ver seu projeto', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectA}`)
        .set('X-User-ID', userA);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(projectA);
      expect(res.body).toHaveProperty('phases');
    });

    it('User A NÃO pode ver projeto de User B', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectB}`)
        .set('X-User-ID', userA);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/projects/:id/chat — PM Agent Chat', () => {
    it('deve guardar mensagem do utilizador', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectA}/chat`)
        .set('X-User-ID', userA)
        .send({
          content: 'I want a restaurant booking system',
        });

      // API Key pode não estar configurada no ambiente de teste
      if (res.status === 400 && res.body.message?.includes('API Key')) {
        // Skip - API Key não configurada
        console.log('[Test Skip] API Key não configurada');
        return;
      }

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('userMessage');
      expect(res.body.userMessage.content).toBe('I want a restaurant booking system');
    });
  });

  describe('Sprints', () => {
    it('deve criar sprint no projeto', async () => {
      // Create team member first
      const member = await prisma.teamMember.create({
        data: {
          projectId: projectA,
          userId: userA,
          role: 'OWNER',
          displayName: 'Test User A',
          email: 'testA@devforge.test',
        },
      });

      const sprint = await prisma.sprint.create({
        data: {
          projectId: projectA,
          number: 1,
          goal: 'MVP Core Features',
          status: 'PLANNING',
        },
      });

      expect(sprint).toHaveProperty('id');
      expect(sprint.number).toBe(1);
      expect(sprint.projectId).toBe(projectA);

      sprintA = sprint.id;
    });

    it('deve listar sprints do projeto', async () => {
      const sprints = await prisma.sprint.findMany({
        where: { projectId: projectA },
      });

      expect(sprints.length).toBeGreaterThan(0);
      expect(sprints[0].id).toBe(sprintA);
    });
  });

  describe('Features', () => {
    it('deve criar feature no sprint', async () => {
      const member = await prisma.teamMember.findFirst({
        where: { projectId: projectA },
      });

      const feature = await prisma.feature.create({
        data: {
          projectId: projectA,
          sprintId: sprintA,
          title: 'User Authentication',
          description: 'Login and signup forms',
          type: 'FEATURE',
          status: 'BACKLOG',
          priority: 'HIGH',
          requestedById: member!.id,
        },
      });

      expect(feature).toHaveProperty('id');
      expect(feature.status).toBe('BACKLOG');

      featureA = feature.id;
    });

    it('deve actualizar feature para IN_PROGRESS', async () => {
      const updated = await prisma.feature.update({
        where: { id: featureA },
        data: { status: 'IN_PROGRESS' },
      });

      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('deve actualizar feature para DONE', async () => {
      const updated = await prisma.feature.update({
        where: { id: featureA },
        data: { status: 'DONE', mergedAt: new Date() },
      });

      expect(updated.status).toBe('DONE');
      expect(updated.mergedAt).not.toBeNull();
    });

    it('deve adicionar bug à feature', async () => {
      const featureWithBugs = await prisma.feature.update({
        where: { id: featureA },
        data: {
          bugs: JSON.stringify([
            {
              id: '1',
              description: 'Button not working',
              severity: 'HIGH',
            },
          ]),
        },
      });

      const bugs = JSON.parse(featureWithBugs.bugs);
      expect(bugs.length).toBe(1);
      expect(bugs[0].description).toBe('Button not working');
    });
  });

  describe('POST /api/projects/:id/confirm — Start Build Pipeline', () => {
    it('deve falhar se PRD não foi gerado', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectA}/confirm`)
        .set('X-User-ID', userA);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('PRD not generated');
    });

    it('deve iniciar pipeline com PRD válido', async () => {
      // Adicionar PRD ao projeto
      await prisma.project.update({
        where: { id: projectA },
        data: {
          prd: {
            title: 'Restaurant Booking',
            pages: ['Login', 'Dashboard'],
            models: ['User', 'Booking'],
          },
          status: 'PLANNING',
        },
      });

      const res = await request(app)
        .post(`/api/projects/${projectA}/confirm`)
        .set('X-User-ID', userA);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('BUILDING');
    });
  });

  describe('GET /api/settings — User Settings', () => {
    it('deve criar settings para novo utilizador', async () => {
      const settings = await prisma.settings.upsert({
        where: { userId: userA },
        create: {
          userId: userA,
          anthropicKey: 'sk-test-key',
          ollamaUrl: 'http://localhost:11434',
          ollamaModelDev: 'qwen2.5-coder:32b',
        },
        update: {},
      });

      expect(settings).toHaveProperty('id');
      expect(settings.userId).toBe(userA);
    });

    it('deve obter settings do utilizador', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('X-User-ID', userA);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(userA);
    });

    it('deve actualizar settings', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('X-User-ID', userA)
        .send({
          ollamaModelDev: 'qwen2.5-coder:14b',
          outputDirectory: './my-projects',
        });

      expect(res.status).toBe(200);
      expect(res.body.ollamaModelDev).toBe('qwen2.5-coder:14b');
      expect(res.body.outputDirectory).toBe('./my-projects');
    });
  });

  describe('GET /api/ollama/status — Ollama Health Check', () => {
    it('deve verificar status do Ollama', async () => {
      const res = await request(app).get('/api/ollama/status');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('connected');
      expect(typeof res.body.connected).toBe('boolean');
    });

    it('deve listar modelos disponíveis se Ollama estiver online', async () => {
      const res = await request(app).get('/api/ollama/status');

      if (res.body.connected) {
        expect(res.body).toHaveProperty('models');
        expect(Array.isArray(res.body.models)).toBe(true);
      }
    });
  });

  describe('Project Lifecycle — Full Flow', () => {
    it('deve completar ciclo: INTAKE → PLANNING → BUILDING → DONE', async () => {
      // 1. Criar projeto (INTAKE)
      const createRes = await request(app)
        .post('/api/projects')
        .set('X-User-ID', userA)
        .send({
          name: 'Full Lifecycle Test',
          description: 'Test complete flow',
        });

      expect(createRes.body.status).toBe('INTAKE');
      const projectId = createRes.body.id;

      // 2. Adicionar PRD (PLANNING)
      await prisma.project.update({
        where: { id: projectId },
        data: {
          prd: { title: 'Test PRD' },
          status: 'PLANNING',
        },
      });

      const planning = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(planning?.status).toBe('PLANNING');

      // 3. Confirmar e iniciar build (BUILDING)
      const confirmRes = await request(app)
        .post(`/api/projects/${projectId}/confirm`)
        .set('X-User-ID', userA);

      expect(confirmRes.body.status).toBe('BUILDING');

      // 4. Simular conclusão (DELIVERED)
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'DELIVERED',
          outputPath: '/tmp/test-output',
        },
      });

      const delivered = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(delivered?.status).toBe('DELIVERED');
      expect(delivered?.outputPath).toBeTruthy();
    });
  });

  describe('Pause/Resume Project', () => {
    it('deve pausar projeto activo', async () => {
      // Criar projeto em BUILDING
      const project = await prisma.project.create({
        data: {
          userId: userA,
          name: 'Pause Test',
          description: 'Test pause',
          status: 'BUILDING',
          prd: { title: 'Test' },
        },
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/pause`)
        .set('X-User-ID', userA);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PAUSED');
    });

    it('deve retomar projeto pausado', async () => {
      // Criar projeto pausado
      const project = await prisma.project.create({
        data: {
          userId: userA,
          name: 'Resume Test',
          description: 'Test resume',
          status: 'PAUSED',
          prd: { title: 'Test' },
        },
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/resume`)
        .set('X-User-ID', userA);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('BUILDING');
    });
  });

  describe('Bug Tracking', () => {
    it('deve criar bug associado ao projeto', async () => {
      const bug = await prisma.bug.create({
        data: {
          projectId: projectA,
          severity: 'HIGH',
          category: 'BUTTON',
          description: 'Submit button não funciona',
          userMessage: 'O botão não está a responder',
        },
      });

      expect(bug).toHaveProperty('id');
      expect(bug.severity).toBe('HIGH');
      expect(bug.fixed).toBe(false);
    });

    it('deve listar bugs do projeto', async () => {
      const bugs = await prisma.bug.findMany({
        where: { projectId: projectA },
      });

      expect(bugs.length).toBeGreaterThan(0);
    });

    it('deve marcar bug como resolvido', async () => {
      const bug = await prisma.bug.findFirst({
        where: { projectId: projectA },
      });

      const fixed = await prisma.bug.update({
        where: { id: bug!.id },
        data: {
          fixed: true,
          fixedAt: new Date(),
        },
      });

      expect(fixed.fixed).toBe(true);
      expect(fixed.fixedAt).not.toBeNull();
    });
  });

  describe('Activity Logs', () => {
    it('deve registar actividade no projeto', async () => {
      const log = await prisma.activityLog.create({
        data: {
          projectId: projectA,
          actorName: 'PM Agent',
          actorType: 'AI',
          action: 'PRD_GENERATED',
          metadata: JSON.stringify({ pagesCount: 5 }),
        },
      });

      expect(log).toHaveProperty('id');
      expect(log.actorType).toBe('AI');
    });

    it('deve listar actividades do projeto', async () => {
      const logs = await prisma.activityLog.findMany({
        where: { projectId: projectA },
        orderBy: { createdAt: 'desc' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
