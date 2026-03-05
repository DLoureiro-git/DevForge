import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

interface Project {
  id: string
  name: string
  status: 'active' | 'completed' | 'failed'
  currentPhase?: string
  createdAt: string
  updatedAt: string
}

interface Metrics {
  total: number
  successful: number
  failed: number
  avgDuration: string
}

export function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsData, metricsData] = await Promise.all([
        api.getProjects(),
        api.getMetrics(),
      ])
      setProjects(projectsData)
      setMetrics(metricsData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newProjectName.trim()) return

    try {
      const project = await api.createProject({
        name: newProjectName,
        description: newProjectDesc,
      })

      navigate(`/projects/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Erro ao criar projeto. Tenta novamente.')
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tens a certeza que queres eliminar este projeto?')) return

    try {
      await api.deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Erro ao eliminar projeto.')
    }
  }

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-running">A processar</span>
      case 'completed':
        return <span className="badge badge-done">Concluído</span>
      case 'failed':
        return <span className="badge badge-error">Erro</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-400">A carregar...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-gradient-primary mb-2">
              DevForge V2
            </h1>
            <p className="text-gray-400">
              Plataforma de desenvolvimento automatizado com IA
            </p>
          </div>

          <button
            onClick={() => setShowNewProject(true)}
            className="btn-primary text-lg"
          >
            <Plus className="w-5 h-5" />
            Novo Projeto
          </button>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{metrics.total}</div>
                  <div className="text-sm text-gray-400">Total de Projetos</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent-success/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{metrics.successful}</div>
                  <div className="text-sm text-gray-400">Bem-sucedidos</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent-error/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-accent-error" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{metrics.failed}</div>
                  <div className="text-sm text-gray-400">Com Erros</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent-secondary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{metrics.avgDuration}</div>
                  <div className="text-sm text-gray-400">Tempo Médio</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects list */}
        <div>
          <h2 className="text-2xl font-display font-bold mb-4">Projetos Recentes</h2>

          {projects.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-gray-400 mb-4">Ainda não tens projetos</p>
              <button onClick={() => setShowNewProject(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                Criar Primeiro Projeto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="glass-card p-6 hover:border-accent-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-accent-primary transition-colors">
                        {project.name}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                      className="p-2 hover:bg-accent-error/20 rounded-lg transition-colors text-gray-400 hover:text-accent-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {project.currentPhase && (
                    <div className="text-sm text-gray-400 mb-3">
                      Fase actual: <span className="text-white">{project.currentPhase}</span>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Criado: {new Date(project.createdAt).toLocaleDateString('pt-PT')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg animate-slide-up">
            <div className="border-b border-base-lighter p-6">
              <h2 className="text-2xl font-display font-bold">Novo Projeto</h2>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Projeto</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex: Site da empresa..."
                  className="input"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Descreve o que queres criar..."
                  className="input min-h-[100px] resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Criar Projeto
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
