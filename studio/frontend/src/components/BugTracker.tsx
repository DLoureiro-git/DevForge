/**
 * BUG TRACKER — Visualização em tempo real de bugs
 *
 * Mostra bugs agrupados por severidade com animações,
 * contador regressivo e toggle entre visualização simples/técnica.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react'
import type { Bug, BugSeverity } from './types/qa'

interface BugTrackerProps {
  bugs: Bug[]
  onToggleDetail?: (bugId: string) => void
}

const severityConfig: Record<BugSeverity, { color: string; bgColor: string; icon: any; label: string }> = {
  CRITICAL: {
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: AlertOctagon,
    label: 'Crítico'
  },
  HIGH: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: AlertTriangle,
    label: 'Alto'
  },
  MEDIUM: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: AlertCircle,
    label: 'Médio'
  },
  LOW: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: Info,
    label: 'Baixo'
  }
}

const statusConfig = {
  open: { label: 'Aberto', badgeColor: 'bg-red-100 text-red-700' },
  fixing: { label: 'Em Correcção', badgeColor: 'bg-yellow-100 text-yellow-700' },
  fixed: { label: 'Corrigido', badgeColor: 'bg-green-100 text-green-700' }
}

export default function BugTracker({ bugs, onToggleDetail }: BugTrackerProps) {
  const [expandedBugId, setExpandedBugId] = useState<string | null>(null)
  const [showTechnical, setShowTechnical] = useState(false)
  const [expandedSeverity, setExpandedSeverity] = useState<BugSeverity | null>('CRITICAL')

  // Agrupar bugs por severidade
  const bugsBySeverity = (Object.keys(severityConfig) as BugSeverity[]).reduce(
    (acc, severity) => {
      acc[severity] = bugs.filter(b => b.severity === severity)
      return acc
    },
    {} as Record<BugSeverity, Bug[]>
  )

  const totalBugs = bugs.length
  const openBugs = bugs.filter(b => b.status === 'open').length
  const fixingBugs = bugs.filter(b => b.status === 'fixing').length

  const toggleBugDetail = (bugId: string) => {
    setExpandedBugId(expandedBugId === bugId ? null : bugId)
    onToggleDetail?.(bugId)
  }

  const toggleSeverityExpand = (severity: BugSeverity) => {
    setExpandedSeverity(expandedSeverity === severity ? null : severity)
  }

  return (
    <div className="space-y-4">
      {/* Header com Counter Animado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-display font-semibold text-[--text-primary]">Rastreio de Bugs</h3>

          {/* Counter Badge Animado */}
          <div className="relative inline-block">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100 border border-red-200">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="font-semibold text-red-700 text-sm">
                {totalBugs > 0 ? totalBugs : 0} {totalBugs === 1 ? 'bug' : 'bugs'}
              </span>
            </div>
          </div>

          {/* Status rápidos */}
          {openBugs > 0 && (
            <div className="text-xs text-[--text-muted]">
              <span className="font-medium text-red-600">{openBugs} aberto</span>
            </div>
          )}
          {fixingBugs > 0 && (
            <div className="text-xs text-[--text-muted]">
              <span className="font-medium text-yellow-600">{fixingBugs} em correcção</span>
            </div>
          )}
        </div>

        {/* Toggle Técnico/Simples */}
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
            showTechnical
              ? 'bg-[--phase-build] text-white border-[--phase-build]/50'
              : 'bg-[--bg-raised] text-[--text-secondary] border-[--border]'
          }`}
        >
          {showTechnical ? 'Vista Técnica' : 'Vista Simples'}
        </button>
      </div>

      {/* Grupos por Severidade */}
      <div className="space-y-3">
        {(Object.keys(severityConfig) as BugSeverity[]).map(severity => {
          const severityBugs = bugsBySeverity[severity]
          const config = severityConfig[severity]
          const Icon = config.icon

          if (severityBugs.length === 0) return null

          const isExpanded = expandedSeverity === severity

          return (
            <div key={severity} className="border border-[--border] rounded-xl overflow-hidden">
              {/* Header Severidade */}
              <button
                onClick={() => toggleSeverityExpand(severity)}
                className={`w-full px-4 py-3 flex items-center justify-between ${config.bgColor} border-b border-[--border] hover:opacity-75 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className={`font-semibold ${config.color}`}>
                    {config.label} ({severityBugs.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`w-5 h-5 ${config.color}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${config.color}`} />
                )}
              </button>

              {/* Lista de Bugs */}
              {isExpanded && (
                <div className="divide-y divide-[--border] bg-[--bg-surface]">
                  {severityBugs.map((bug, idx) => {
                    const isExpanded = expandedBugId === bug.id
                    const statusInfo = statusConfig[bug.status]

                    return (
                      <div key={bug.id} className="p-4 hover:bg-[--bg-raised]/30 transition-colors">
                        {/* Bug Header */}
                        <button
                          onClick={() => toggleBugDetail(bug.id)}
                          className="w-full flex items-start justify-between gap-4 text-left"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[--text-muted]">#{idx + 1}</span>
                              <span className="text-sm font-semibold text-[--text-primary]">
                                {bug.category}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.badgeColor}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-[--text-secondary]">
                              {bug.userFriendlyDescription}
                            </p>
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-[--text-muted] mt-0.5 shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[--text-muted] mt-0.5 shrink-0" />
                          )}
                        </button>

                        {/* Bug Details (expandido) */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[--border] space-y-3">
                            {showTechnical && bug.technicalDetails && (
                              <div className="bg-[--bg-base] rounded-lg p-3 font-mono text-xs text-[--text-muted]">
                                <p className="font-semibold text-[--text-secondary] mb-2">Detalhes Técnicos:</p>
                                <p className="whitespace-pre-wrap break-words">
                                  {bug.technicalDetails}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-[--text-muted]">
                              <div>
                                Criado:{' '}
                                <span className="font-mono">
                                  {new Date(bug.createdAt).toLocaleString('pt-PT')}
                                </span>
                              </div>
                              {bug.updatedAt !== bug.createdAt && (
                                <div>
                                  Actualizado:{' '}
                                  <span className="font-mono">
                                    {new Date(bug.updatedAt).toLocaleString('pt-PT')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Estado vazio */}
        {totalBugs === 0 && (
          <div className="text-center py-8 px-4 border border-dashed border-[--border] rounded-lg">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-[--text-secondary]">
              Nenhum bug detectado! 🎉
            </p>
            <p className="text-xs text-[--text-muted] mt-1">
              O teu projecto está em perfeito estado.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
