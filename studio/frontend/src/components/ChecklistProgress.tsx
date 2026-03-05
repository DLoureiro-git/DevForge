/**
 * CHECKLIST PROGRESS — Progress das checks QA
 *
 * Lista agrupada por categoria com filtros,
 * status visual e tempos de execução.
 */

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2, AlertCircle, Clock } from 'lucide-react'
import type { Check } from './types/qa'

interface ChecklistProgressProps {
  checks: Check[]
  isLoading?: boolean
}

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    label: 'Pendente'
  },
  running: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'A executar',
    animate: true
  },
  passed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Passou'
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Falhou'
  }
}

export default function ChecklistProgress({ checks, isLoading }: ChecklistProgressProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'failed' | 'critical'>('all')

  // Agrupar checks por categoria
  const checksByCategory = useMemo(() => {
    const grouped = checks.reduce(
      (acc, check) => {
        if (!acc[check.category]) {
          acc[check.category] = []
        }
        acc[check.category].push(check)
        return acc
      },
      {} as Record<string, Check[]>
    )

    // Ordenar categorias
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [checks])

  // Filtrar checks
  const filteredChecks = useMemo(() => {
    return checksByCategory.map(([category, categoryChecks]) => {
      let filtered = categoryChecks

      // Filtrar por status
      if (filterStatus === 'failed') {
        filtered = filtered.filter(c => c.status === 'failed')
      } else if (filterStatus === 'critical') {
        filtered = filtered.filter(c => c.isCritical && c.status === 'failed')
      }

      // Filtrar por busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.message?.toLowerCase().includes(query)
        )
      }

      return [category, filtered] as const
    }).filter(([, checks]) => checks.length > 0)
  }, [checksByCategory, searchQuery, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = checks.length
    const passed = checks.filter(c => c.status === 'passed').length
    const failed = checks.filter(c => c.status === 'failed').length
    const running = checks.filter(c => c.status === 'running').length
    const pending = checks.filter(c => c.status === 'pending').length
    const critical = checks.filter(c => c.isCritical && c.status === 'failed').length
    const totalDuration = checks.reduce((sum, c) => sum + c.duration, 0)

    return { total, passed, failed, running, pending, critical, totalDuration }
  }, [checks])

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Expandir primeira categoria com checks failed ou critical
  const firstFailedCategory = filteredChecks.find(([, checks]) =>
    checks.some(c => c.status === 'failed' || (c.isCritical && c.status === 'failed'))
  )?.[0]

  return (
    <div className="space-y-4">
      {/* Header com Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-[--text-primary]">Progress das Checks</h3>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-[--text-secondary]">{stats.passed} passou</span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-600">{stats.failed} falhou</span>
              </div>
            )}
            {stats.running > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-blue-600">{stats.running} a executar</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[--text-muted]">
            <span>{stats.passed}/{stats.total} checks passaram</span>
            <span>{formatDuration(stats.totalDuration)}</span>
          </div>
          <div className="w-full h-2 bg-[--bg-base] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${(stats.passed / stats.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search e Filtros */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[--text-muted] pointer-events-none" />
          <input
            type="text"
            placeholder="Procurar checks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[--bg-base] border border-[--border] rounded-lg text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--phase-build]/50 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-[--phase-build] text-white'
                : 'bg-[--bg-base] text-[--text-secondary] border border-[--border] hover:border-[--phase-build]'
            }`}
          >
            Todas ({stats.total})
          </button>

          {stats.failed > 0 && (
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              Falhadas ({stats.failed})
            </button>
          )}

          {stats.critical > 0 && (
            <button
              onClick={() => setFilterStatus('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'critical'
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              Críticas ({stats.critical})
            </button>
          )}
        </div>
      </div>

      {/* Checks Agrupadas por Categoria */}
      <div className="space-y-3">
        {filteredChecks.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-[--border] rounded-lg">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
            <p className="text-sm font-medium text-[--text-secondary]">
              {searchQuery ? 'Nenhuma check encontrada' : 'Todas as checks passaram! 🎉'}
            </p>
          </div>
        ) : (
          filteredChecks.map(([category, categoryChecks]) => {
            const isExpanded = expandedCategory === category ||
              expandedCategory === null && (category === firstFailedCategory || stats.failed === 0)

            const failedInCategory = categoryChecks.filter(c => c.status === 'failed').length
            const passedInCategory = categoryChecks.filter(c => c.status === 'passed').length

            return (
              <div key={category} className="border border-[--border] rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-[--bg-raised] hover:bg-[--bg-raised]/50 transition-colors border-b border-[--border]"
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    <span className="font-semibold text-[--text-primary]">{category}</span>

                    {/* Category Stats */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600 font-medium">{passedInCategory} ✓</span>
                      {failedInCategory > 0 && (
                        <span className="text-red-600 font-medium">{failedInCategory} ✗</span>
                      )}
                    </div>

                    {/* Category Progress Bar Mini */}
                    <div className="h-1.5 w-20 bg-[--bg-base] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400"
                        style={{ width: `${(passedInCategory / categoryChecks.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[--text-muted]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[--text-muted]" />
                  )}
                </button>

                {/* Checks Lista */}
                {isExpanded && (
                  <div className="divide-y divide-[--border] bg-[--bg-surface]">
                    {categoryChecks.map((check) => {
                      const config = statusConfig[check.status]
                      const Icon = config.icon

                      return (
                        <div
                          key={check.id}
                          className={`px-4 py-3 hover:bg-[--bg-raised]/30 transition-colors ${
                            check.status === 'failed' ? 'bg-red-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Status Icon */}
                            <Icon
                              className={`w-5 h-5 mt-0.5 shrink-0 ${config.color} ${
                                config.animate ? 'animate-spin' : ''
                              }`}
                            />

                            {/* Check Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h5 className="font-medium text-sm text-[--text-primary]">
                                  {check.name}
                                </h5>

                                {/* Badge Critical */}
                                {check.isCritical && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
                                    CRÍTICA
                                  </span>
                                )}
                              </div>

                              {/* Status e Duration */}
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                                  {config.label}
                                </span>

                                <div className="flex items-center gap-1 text-xs text-[--text-muted]">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDuration(check.duration)}
                                </div>
                              </div>

                              {/* Message (só se falhou) */}
                              {check.status === 'failed' && check.message && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono break-words">
                                  {check.message}
                                </div>
                              )}

                              {/* Details (se houver) */}
                              {check.details && Object.keys(check.details).length > 0 && (
                                <div className="mt-2 p-2 bg-[--bg-base] rounded text-xs text-[--text-muted] space-y-1">
                                  {Object.entries(check.details).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-[--text-secondary]">{key}:</span>
                                      <span className="font-mono text-[--text-primary]">
                                        {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
