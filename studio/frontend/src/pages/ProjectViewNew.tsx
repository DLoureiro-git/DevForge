import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import SprintHeader from '../components/sprint/SprintHeader';
import SprintBoard from '../components/sprint/SprintBoard';
import PipelineTimeline from '../components/pipeline/PipelineTimeline';
import LiveLogs from '../components/pipeline/LiveLogs';
import TeamPanel from '../components/team/TeamPanel';
import ActivityFeed from '../components/team/ActivityFeed';
import PMIntakeChat from '../components/chat/PMIntakeChat';
import '../styles/design-system.css';

// Mock data
const SPRINT_DATA = {
  number: 3,
  sprintNumber: 3, // Added for compatibility
  goal: 'Sistema de reservas completo + painel admin',
  daysLeft: 3,
  totalDays: 7,
  velocity: { avg: 28, history: [22, 31, 28] },
};

const MOCK_FEATURES = [
  {
    id: 'f1',
    title: 'Sistema de notificações push',
    type: 'FEATURE' as const,
    priority: 'LOW' as const,
    pts: 5,
    status: 'BACKLOG' as const,
    desc: 'Notificações em tempo real',
  },
  {
    id: 'f2',
    title: 'Exportar reservas para CSV',
    type: 'FEATURE' as const,
    priority: 'MEDIUM' as const,
    pts: 3,
    status: 'BACKLOG' as const,
    desc: 'Botão export na tabela',
  },
  {
    id: 'f3',
    title: 'Filtros avançados no painel',
    type: 'FEATURE' as const,
    priority: 'HIGH' as const,
    pts: 5,
    status: 'READY' as const,
    desc: 'Filtrar por data, estado, nº pessoas',
  },
  {
    id: 'f4',
    title: 'Google OAuth',
    type: 'FEATURE' as const,
    priority: 'HIGH' as const,
    pts: 8,
    status: 'IN_PROGRESS' as const,
    branch: 'feat/google-oauth',
    progress: 72,
    agentId: 'a2',
    desc: 'Login com conta Google',
  },
  {
    id: 'f5',
    title: 'Email de confirmação automático',
    type: 'FEATURE' as const,
    priority: 'HIGH' as const,
    pts: 3,
    status: 'IN_PROGRESS' as const,
    branch: 'feat/email-confirm',
    progress: 45,
    agentId: 'a3',
    desc: 'Email após reserva confirmada',
  },
  {
    id: 'f6',
    title: 'Calendário de disponibilidade',
    type: 'FEATURE' as const,
    priority: 'CRITICAL' as const,
    pts: 8,
    status: 'IN_REVIEW' as const,
    branch: 'feat/calendar',
    progress: 100,
    agentId: 'a4',
    desc: 'Vista de calendário com slots',
  },
  {
    id: 'f7',
    title: 'Formulário mobile de reserva',
    type: 'FEATURE' as const,
    priority: 'CRITICAL' as const,
    pts: 5,
    status: 'IN_QA' as const,
    branch: 'feat/booking-mobile',
    qa: 82,
    progress: 100,
    agentId: 'a5',
    desc: 'Formulário responsivo para mobile',
    bugs: [
      { sev: 'HIGH' as const, msg: 'Overflow em 375px no campo de data' },
      { sev: 'MEDIUM' as const, msg: 'Botão sem loading state' },
    ],
  },
  {
    id: 'f8',
    title: 'Painel admin — lista de reservas',
    type: 'FEATURE' as const,
    priority: 'HIGH' as const,
    pts: 5,
    status: 'DONE' as const,
    branch: 'feat/admin-panel',
    qa: 98,
    progress: 100,
    mergedAt: 'Hoje, 09:12',
    desc: 'Tabela com todas as reservas',
  },
];

const MOCK_PHASES = [
  {
    id: 'pm',
    label: 'PM Agent',
    short: 'PM',
    icon: '🧠',
    color: 'var(--accent)',
    colorRaw: '#7C6AFA',
    glowRaw: 'rgba(124,106,250,0.18)',
    status: 'done' as const,
  },
  {
    id: 'arch',
    label: 'Arquitectura',
    short: 'ARCH',
    icon: '🏗️',
    color: 'var(--blue)',
    colorRaw: '#5BB8FF',
    glowRaw: 'rgba(91,184,255,0.15)',
    status: 'done' as const,
  },
  {
    id: 'dev',
    label: 'Dev Team',
    short: 'DEV',
    icon: '⚡',
    color: 'var(--orange)',
    colorRaw: '#FB923C',
    glowRaw: 'rgba(251,146,60,0.15)',
    status: 'running' as const,
    parallel: true,
  },
  {
    id: 'qa',
    label: 'QA & Testes',
    short: 'QA',
    icon: '🔍',
    color: 'var(--amber)',
    colorRaw: '#FFB547',
    glowRaw: 'rgba(255,181,71,0.15)',
    status: 'idle' as const,
  },
  {
    id: 'fix',
    label: 'Bug Fix',
    short: 'FIX',
    icon: '🔄',
    color: 'var(--pink)',
    colorRaw: '#F472B6',
    glowRaw: 'rgba(244,114,182,0.15)',
    status: 'idle' as const,
    isLoop: true,
  },
  {
    id: 'deploy',
    label: 'Deploy',
    short: '🚀',
    icon: '🚀',
    color: 'var(--green)',
    colorRaw: '#3DFFA0',
    glowRaw: 'rgba(61,255,160,0.15)',
    status: 'idle' as const,
  },
];

const MOCK_LOGS = [
  'Dev Team — 4 agentes paralelos',
  '[Frontend] Componentes React...',
  '[Backend] 11 endpoints REST criados',
  '[DB] Migrations Prisma geradas',
  '[Integration] ENV vars ✓',
  '2.847 linhas de código ✓',
];

const MOCK_HUMANS = [
  {
    id: 'u1',
    name: 'DLoureiro',
    role: 'Product Owner',
    initials: 'DL',
    color: '#7C6AFA',
    online: true,
  },
  {
    id: 'u2',
    name: 'Ana Silva',
    role: 'Developer',
    initials: 'AS',
    color: '#5BB8FF',
    online: true,
  },
  {
    id: 'u3',
    name: 'Carlos M.',
    role: 'Stakeholder',
    initials: 'CM',
    color: '#3DFFA0',
    online: false,
  },
];

const MOCK_AGENTS = [
  {
    id: 'a1',
    name: 'Scrum Master',
    model: 'Claude Sonnet',
    icon: '🧠',
    color: '#7C6AFA',
    active: true,
  },
  {
    id: 'a2',
    name: 'Frontend Dev',
    model: 'qwen2.5:14b',
    icon: '⚡',
    color: '#FB923C',
    active: true,
  },
  {
    id: 'a3',
    name: 'Backend Dev',
    model: 'qwen2.5:14b',
    icon: '⚙️',
    color: '#5BB8FF',
    active: false,
  },
  {
    id: 'a4',
    name: 'Architect',
    model: 'DeepSeek-R1',
    icon: '🏗️',
    color: '#FFB547',
    active: false,
  },
  {
    id: 'a5',
    name: 'QA Agent',
    model: 'Playwright',
    icon: '🔍',
    color: '#F472B6',
    active: false,
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    time: '14:32',
    actor: 'QA Agent',
    ai: true,
    icon: '🔍',
    msg: 'f7 entrou em QA — 40 testes a correr',
    badge: 'badge-pink',
  },
  {
    id: 2,
    time: '14:28',
    actor: 'DLoureiro',
    ai: false,
    icon: '💬',
    msg: "Comentou em 'Calendário de disponibilidade'",
    badge: 'badge-purple',
  },
  {
    id: 3,
    time: '14:15',
    actor: 'Architect',
    ai: true,
    icon: '🏗️',
    msg: 'Code review aprovado — feat/calendar ✓',
    badge: 'badge-amber',
  },
  {
    id: 4,
    time: '13:50',
    actor: 'Frontend Dev',
    ai: true,
    icon: '⚡',
    msg: 'Commit: feat/google-oauth — 72% concluído',
    badge: 'badge-orange',
  },
];

const PM_QUESTIONS = [
  {
    id: 'q1',
    text: 'Olá! Qual é a funcionalidade ou melhoria que queres adicionar?',
    type: 'open' as const,
    ph: 'Descreve em linguagem natural...',
  },
  {
    id: 'q2',
    text: 'É algo novo ou uma melhoria do existente?',
    type: 'choice' as const,
    opts: [
      'Nova funcionalidade',
      'Melhoria do existente',
      'Correcção de bug',
      'Mudança de design',
      'Optimização',
    ],
  },
  {
    id: 'q3',
    text: 'Qual é a urgência?',
    type: 'choice' as const,
    opts: ['🚨 Crítico (produção)', '🔴 Alta (próximo sprint)', '🟡 Normal (backlog)', '🔵 Baixa'],
  },
  {
    id: 'q4',
    text: 'Que parte do produto afecta?',
    type: 'choice' as const,
    opts: [
      'Página específica',
      'Funcionalidade existente',
      'Toda a app',
      'Só o servidor',
      'Design global',
    ],
  },
  {
    id: 'q5',
    text: 'Como saberemos que está feito? Qual o resultado esperado?',
    type: 'open' as const,
    ph: 'Ex: O utilizador consegue fazer login com Google...',
  },
];

type Tab = 'sprint' | 'pipeline' | 'team';

const ProjectViewNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sprint');
  const [showIntake, setShowIntake] = useState(false);

  const handleIntakeSubmit = (answers: Record<string, string>) => {
    console.log('Answers:', answers);
    setShowIntake(false);
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[
            { id: 'sprint' as Tab, label: 'Sprint Board' },
            { id: 'pipeline' as Tab, label: 'Pipeline' },
            { id: 'team' as Tab, label: 'Team' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`sub-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'sprint' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowIntake(true)}>
            <Plus size={14} />
            Nova Feature
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'sprint' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SprintHeader {...SPRINT_DATA} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SprintBoard features={MOCK_FEATURES} />
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div
            style={{
              height: '100%',
              overflow: 'auto',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <PipelineTimeline phases={MOCK_PHASES} />
            <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <LiveLogs logs={MOCK_LOGS} isRunning={true} />
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div
            style={{
              height: '100%',
              overflow: 'auto',
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                maxWidth: 1200,
                margin: '0 auto',
              }}
            >
              <TeamPanel humans={MOCK_HUMANS} agents={MOCK_AGENTS} />
              <ActivityFeed activities={MOCK_ACTIVITY} />
            </div>
          </div>
        )}
      </div>

      {/* PM Intake Chat */}
      {showIntake && (
        <PMIntakeChat
          onClose={() => setShowIntake(false)}
          onSubmit={handleIntakeSubmit}
          questions={PM_QUESTIONS}
        />
      )}
    </div>
  );
};

export default ProjectViewNew;
