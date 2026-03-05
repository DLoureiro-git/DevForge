import { useState } from 'react'
import {
  MessageSquare,
  FileText,
  Code,
  Bug,
  Wrench,
  Rocket,
  ChevronRight,
  X
} from 'lucide-react'
import { clsx } from 'clsx'

interface PhaseNode {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  status: 'pending' | 'running' | 'done' | 'error'
  details?: any
}

interface PipelineVisualProps {
  projectId: string
  phases: PhaseNode[]
  onPhaseClick?: (phaseId: string) => void
}

const phaseIcons = {
  intake: MessageSquare,
  plan: FileText,
  build: Code,
  qa: Bug,
  fix: Wrench,
  deploy: Rocket,
}

const phaseColors = {
  intake: 'text-phase-intake',
  plan: 'text-phase-plan',
  build: 'text-phase-build',
  qa: 'text-phase-qa',
  fix: 'text-phase-fix',
  deploy: 'text-phase-deploy',
}

export function PipelineVisual({ phases, onPhaseClick }: PipelineVisualProps) {
  const [selectedPhase, setSelectedPhase] = useState<PhaseNode | null>(null)

  const handlePhaseClick = (phase: PhaseNode) => {
    setSelectedPhase(phase)
    onPhaseClick?.(phase.id)
  }

  const getStatusClasses = (status: PhaseNode['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400'
      case 'running':
        return 'bg-accent-primary/20 border-accent-primary/50 text-accent-primary animate-pulse-glow'
      case 'done':
        return 'bg-accent-success/20 border-accent-success/50 text-accent-success'
      case 'error':
        return 'bg-accent-error/20 border-accent-error/50 text-accent-error'
    }
  }

  return (
    <>
      {/* Desktop: Horizontal */}
      <div className="hidden lg:flex items-center justify-between gap-2 p-6">
        {phases.map((phase, index) => {
          const Icon = phaseIcons[phase.id as keyof typeof phaseIcons] || Code
          const colorClass = phaseColors[phase.id as keyof typeof phaseColors] || 'text-white'

          return (
            <div key={phase.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => handlePhaseClick(phase)}
                className={clsx(
                  'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 w-full',
                  getStatusClasses(phase.status)
                )}
              >
                <Icon className={clsx('w-8 h-8', colorClass)} />
                <span className="text-sm font-medium">{phase.name}</span>

                {phase.status === 'running' && (
                  <div className={clsx('absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse', colorClass.replace('text', 'bg'))} />
                )}
              </button>

              {index < phases.length - 1 && (
                <ChevronRight className="w-6 h-6 text-gray-600 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: Vertical */}
      <div className="lg:hidden flex flex-col gap-3 p-4">
        {phases.map((phase, index) => {
          const Icon = phaseIcons[phase.id as keyof typeof phaseIcons] || Code
          const colorClass = phaseColors[phase.id as keyof typeof phaseColors] || 'text-white'

          return (
            <div key={phase.id} className="flex flex-col gap-2">
              <button
                onClick={() => handlePhaseClick(phase)}
                className={clsx(
                  'relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300',
                  getStatusClasses(phase.status)
                )}
              >
                <Icon className={clsx('w-6 h-6', colorClass)} />
                <span className="text-sm font-medium flex-1 text-left">{phase.name}</span>

                {phase.status === 'running' && (
                  <div className={clsx('w-2 h-2 rounded-full animate-pulse', colorClass.replace('text', 'bg'))} />
                )}
              </button>

              {index < phases.length - 1 && (
                <div className="w-0.5 h-4 bg-gray-700 ml-7" />
              )}
            </div>
          )
        })}
      </div>

      {/* Details Drawer */}
      {selectedPhase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-auto custom-scrollbar animate-slide-up">
            <div className="sticky top-0 bg-base-light/95 backdrop-blur-xl border-b border-base-lighter p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = phaseIcons[selectedPhase.id as keyof typeof phaseIcons] || Code
                  const colorClass = phaseColors[selectedPhase.id as keyof typeof phaseColors] || 'text-white'
                  return <Icon className={clsx('w-6 h-6', colorClass)} />
                })()}
                <h3 className="text-xl font-display font-bold">{selectedPhase.name}</h3>
                <span className={clsx('badge', `badge-${selectedPhase.status}`)}>
                  {selectedPhase.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedPhase(null)}
                className="p-2 hover:bg-base-lighter rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedPhase.details ? (
                <pre className="terminal text-xs">{JSON.stringify(selectedPhase.details, null, 2)}</pre>
              ) : (
                <p className="text-gray-400">Sem detalhes disponíveis</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
