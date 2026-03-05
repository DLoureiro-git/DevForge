/**
 * QA DEMO — Exemplo de uso e dados mock para os componentes QA
 *
 * Importa e combina BugTracker, QAScoreCard e ChecklistProgress
 */

import BugTracker from '../BugTracker'
import QAScoreCard from '../QAScoreCard'
import ChecklistProgress from '../ChecklistProgress'
import type { Bug, Check } from '../types/qa'

// DADOS MOCK — Bugs
export const mockBugs: Bug[] = [
  {
    id: '1',
    category: 'Validação de Formulário',
    description: 'Email não valida corretamente domínios com subdomain',
    userFriendlyDescription: 'Alguns emails com subdomínios não são aceitos',
    severity: 'CRITICAL',
    status: 'open',
    technicalDetails: 'Regex padrão não capture emails tipo user@mail.company.co.uk\nSolução: Usar biblioteca de validação (email-validator)',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    category: 'Responsive Design',
    description: 'Cards quebram em tablets em landscape',
    userFriendlyDescription: 'A página fica mal formatada em tablets horizontal',
    severity: 'HIGH',
    status: 'fixing',
    technicalDetails: 'Media query para 768px-1024px com landscape não coberta\nFix: Adicionar @media (orientation: landscape)',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    category: 'Performance',
    description: 'Lighthouse score 68 (precisa >90)',
    userFriendlyDescription: 'A página é lenta para carregar em ligações 3G',
    severity: 'HIGH',
    status: 'open',
    technicalDetails: 'Main thread work: 3.2s\nLargest Contentful Paint: 3.8s\nSolução: Code splitting + lazy loading de imagens',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    category: 'Acessibilidade',
    description: 'Botões sem labels ARIA acessíveis',
    userFriendlyDescription: 'Leitores de ecrã não conseguem identificar alguns botões',
    severity: 'MEDIUM',
    status: 'open',
    technicalDetails: 'Buttons com apenas icons faltam aria-label\nSolução: Adicionar aria-label em todos os icon-only buttons',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    category: 'XSS Protection',
    description: 'Input user-generated não é sanitizado',
    userFriendlyDescription: 'Vulnerabilidade de segurança com conteúdo de utilizadores',
    severity: 'CRITICAL',
    status: 'fixing',
    technicalDetails: 'User comments permitem <script> tags\nSolução: Usar DOMPurify ou sanitizar no backend',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
]

// DADOS MOCK — Checks
export const mockChecks: Check[] = [
  // Deploy
  {
    id: 'check-1',
    name: 'Build sem erros',
    category: 'Deploy',
    status: 'passed',
    duration: 45000,
    isCritical: true
  },
  {
    id: 'check-2',
    name: 'Dependências vulneráveis',
    category: 'Deploy',
    status: 'failed',
    duration: 8000,
    message: 'npm audit found 2 high vulnerability: lodash@4.17.19',
    isCritical: true
  },
  {
    id: 'check-3',
    name: 'Bundle size',
    category: 'Deploy',
    status: 'passed',
    duration: 5000,
    details: { size: '245KB', limit: '300KB', status: 'OK' },
    isCritical: false
  },

  // Database
  {
    id: 'check-4',
    name: 'Migrations aplicadas',
    category: 'Database',
    status: 'passed',
    duration: 3200,
    isCritical: true
  },
  {
    id: 'check-5',
    name: 'Schema validação',
    category: 'Database',
    status: 'passed',
    duration: 1500,
    details: { tables: 12, indexes: 23, constraints: 15 },
    isCritical: false
  },

  // Responsive
  {
    id: 'check-6',
    name: 'Mobile (375px)',
    category: 'Responsive',
    status: 'failed',
    duration: 12000,
    message: 'Cards overflow em breakpoint mobile, margin overflow detectado',
    isCritical: true
  },
  {
    id: 'check-7',
    name: 'Tablet (768px)',
    category: 'Responsive',
    status: 'passed',
    duration: 8000,
    isCritical: false
  },
  {
    id: 'check-8',
    name: 'Desktop (1920px)',
    category: 'Responsive',
    status: 'passed',
    duration: 6000,
    isCritical: false
  },

  // Performance
  {
    id: 'check-9',
    name: 'Lighthouse Score',
    category: 'Performance',
    status: 'passed',
    duration: 28000,
    details: { performance: 92, accessibility: 88, best_practices: 95, seo: 90 },
    isCritical: true
  },
  {
    id: 'check-10',
    name: 'Core Web Vitals',
    category: 'Performance',
    status: 'passed',
    duration: 15000,
    details: { lcp: '2.1s', fid: '45ms', cls: '0.05' },
    isCritical: false
  },

  // Segurança
  {
    id: 'check-11',
    name: 'OWASP A03:2021',
    category: 'Segurança',
    status: 'failed',
    duration: 5000,
    message: 'XSS vulnerability detected in comment input field (line 245)',
    isCritical: true
  },
  {
    id: 'check-12',
    name: 'HTTPS/TLS',
    category: 'Segurança',
    status: 'passed',
    duration: 2000,
    details: { ssl_grade: 'A+', certificate_valid: true },
    isCritical: true
  },

  // Acessibilidade
  {
    id: 'check-13',
    name: 'WCAG 2.1 AA',
    category: 'Acessibilidade',
    status: 'passed',
    duration: 18000,
    details: { violations: 0, warnings: 3 },
    isCritical: false
  },
  {
    id: 'check-14',
    name: 'Keyboard Navigation',
    category: 'Acessibilidade',
    status: 'passed',
    duration: 12000,
    isCritical: false
  }
]

// Score calculado
export const mockQAScore = {
  overallScore: 72,
  canDeliver: false,
  totalChecks: mockChecks.length,
  passedChecks: mockChecks.filter(c => c.status === 'passed').length,
  failedChecks: mockChecks.filter(c => c.status === 'failed').length,
  totalDuration: mockChecks.reduce((sum, c) => sum + c.duration, 0),
  categoryBreakdown: {
    'Deploy': {
      score: 66,
      passed: 2,
      total: 3
    },
    'Database': {
      score: 100,
      passed: 2,
      total: 2
    },
    'Responsive': {
      score: 66,
      passed: 2,
      total: 3
    },
    'Performance': {
      score: 100,
      passed: 2,
      total: 2
    },
    'Segurança': {
      score: 50,
      passed: 1,
      total: 2
    },
    'Acessibilidade': {
      score: 100,
      passed: 2,
      total: 2
    }
  }
}

// Componente Demo completo
export default function QADemo() {
  return (
    <div className="min-h-screen bg-[--bg-base] p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-[--text-primary]">
            DevForge QA Dashboard
          </h1>
          <p className="text-[--text-muted]">
            Visualização completa do status QA do projecto
          </p>
        </div>

        {/* Grid: Score Card + Bug Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Card — Coluna direita (ocupar 1 coluna) */}
          <div className="lg:col-span-1">
            <QAScoreCard score={mockQAScore} />
          </div>

          {/* Bug Tracker — Coluna esquerda (ocupar 2 colunas) */}
          <div className="lg:col-span-2">
            <BugTracker bugs={mockBugs} onToggleDetail={(id) => console.log('Bug toggled:', id)} />
          </div>
        </div>

        {/* Checklist Progress — Full width */}
        <div>
          <ChecklistProgress checks={mockChecks} />
        </div>
      </div>
    </div>
  )
}

/**
 * INSTRUÇÕES DE INTEGRAÇÃO:
 *
 * 1. Importar dados reais das tuas APIs:
 *    - GET /api/projects/:id/qa/bugs
 *    - GET /api/projects/:id/qa/checks
 *    - GET /api/projects/:id/qa/score
 *
 * 2. Usar em páginas:
 *    import BugTracker from '@/components/BugTracker'
 *    import QAScoreCard from '@/components/QAScoreCard'
 *    import ChecklistProgress from '@/components/ChecklistProgress'
 *
 *    export default function ProjectQAPage() {
 *      const [bugs, setBugs] = useState<Bug[]>([])
 *      const [checks, setChecks] = useState<Check[]>([])
 *      const [score, setScore] = useState<QAScore | null>(null)
 *
 *      useEffect(() => {
 *        // Fetch dados
 *      }, [])
 *
 *      return (
 *        <div className="space-y-6">
 *          <QAScoreCard score={score} />
 *          <BugTracker bugs={bugs} />
 *          <ChecklistProgress checks={checks} />
 *        </div>
 *      )
 *    }
 *
 * 3. Atualizar em tempo real com WebSocket:
 *    const ws = new WebSocket('ws://...')
 *    ws.onmessage = (event) => {
 *      const { type, data } = JSON.parse(event.data)
 *      if (type === 'bug-update') setBugs(data)
 *      if (type === 'check-update') setChecks(data)
 *      if (type === 'score-update') setScore(data)
 *    }
 */
