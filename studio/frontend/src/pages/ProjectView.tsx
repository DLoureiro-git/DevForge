import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { PipelineVisual } from '@/components/PipelineVisual'
import { IntakeChat } from '@/components/IntakeChat'
import { Logs } from '@/components/Logs'
import { ProgressNarrative } from '@/components/ProgressNarrative'
import { DeliveryCard } from '@/components/DeliveryCard'

interface Project {
  id: string
  name: string
  status: 'active' | 'completed' | 'failed'
  currentPhase?: string
  progress?: number
  narrative?: string
  phases?: any[]
  stats?: {
    duration: string
    features: number
    qaScore: number
  }
  projectUrl?: string
}

export function ProjectView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadProject()
  }, [id])

  const loadProject = async () => {
    if (!id) return

    try {
      const data = await api.getProject(id)
      setProject(data)
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenProject = async () => {
    if (!id) return
    try {
      const { url } = await api.getProjectUrl(id)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Failed to get project URL:', error)
    }
  }

  const handleDownloadZip = async () => {
    if (!id) return
    try {
      const blob = await api.getProjectCode(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project?.name || 'project'}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download project:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-400">A carregar projeto...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-gray-400">Projeto não encontrado</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-base-lighter bg-base-light/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[2000px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-base-lighter rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold">{project.name}</h1>
              <p className="text-sm text-gray-400">
                {project.status === 'completed' ? 'Projeto concluído' : 'Em desenvolvimento'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      {project.phases && project.phases.length > 0 && (
        <div className="border-b border-base-lighter bg-base-light/30">
          <div className="max-w-[2000px] mx-auto">
            <PipelineVisual projectId={project.id} phases={project.phases} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[2000px] mx-auto p-6">
          {project.status === 'completed' && project.stats ? (
            /* Delivery Card */
            <div className="max-w-3xl mx-auto">
              <DeliveryCard
                projectId={project.id}
                projectName={project.name}
                projectUrl={project.projectUrl}
                stats={project.stats}
                onOpenProject={handleOpenProject}
                onViewCode={() => {}}
                onDownloadZip={handleDownloadZip}
              />
            </div>
          ) : (
            /* Active project layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left: Chat */}
              <div className="lg:col-span-4 flex flex-col min-h-[600px] lg:h-full">
                <IntakeChat projectId={project.id} />
              </div>

              {/* Middle: Progress */}
              <div className="lg:col-span-4 space-y-6">
                {project.narrative && (
                  <ProgressNarrative
                    message={project.narrative}
                    progress={project.progress || 0}
                  />
                )}
              </div>

              {/* Right: Logs */}
              <div className="lg:col-span-4 flex flex-col min-h-[600px] lg:h-full">
                <Logs projectId={project.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
