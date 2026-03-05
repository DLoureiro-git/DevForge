/**
 * QA SCORE CARD — Card com visualização do score QA
 *
 * Score geral 0-100 com progress ring animado,
 * breakdown por categoria e status de produção.
 */

import { CheckCircle, AlertCircle } from 'lucide-react'
import type { QAScore } from './types/qa'

interface QAScoreCardProps {
  score: QAScore
  isLoading?: boolean
}

export default function QAScoreCard({ score, isLoading }: QAScoreCardProps) {
  // Determinar cor base do score
  const getScoreColor = (score: number) => {
    if (score >= 90) return { ring: 'stroke-green-500', bg: 'bg-green-50', text: 'text-green-700', light: 'text-green-600' }
    if (score >= 75) return { ring: 'stroke-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', light: 'text-blue-600' }
    if (score >= 60) return { ring: 'stroke-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', light: 'text-yellow-600' }
    return { ring: 'stroke-red-500', bg: 'bg-red-50', text: 'text-red-700', light: 'text-red-600' }
  }

  const scoreColors = getScoreColor(score.overallScore)
  const circumference = 2 * Math.PI * 45 // raio 45
  const strokeDashoffset = circumference - (score.overallScore / 100) * circumference

  // Formatar duração
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Categorias ordenadas por relevância
  const categoryOrder = ['Deploy', 'DB', 'Responsive', 'Performance', 'Segurança', 'Acessibilidade']
  const sortedCategories = Object.entries(score.categoryBreakdown)
    .sort(([keyA], [keyB]) => {
      const indexA = categoryOrder.indexOf(keyA)
      const indexB = categoryOrder.indexOf(keyB)
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
    .slice(0, 6)

  return (
    <div className={`rounded-2xl border ${scoreColors.bg} border-[--border] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`}>
      <div className="p-6 space-y-6">
        {/* Score Ring Animado */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-40 h-40">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-[--bg-raised] opacity-30"
              />

              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={isLoading ? 0 : strokeDashoffset}
                strokeLinecap="round"
                className={`${scoreColors.ring} transition-all duration-1000 ease-out`}
                style={{
                  filter: `drop-shadow(0 0 8px ${
                    score.overallScore >= 90 ? 'rgb(34, 197, 94)' :
                    score.overallScore >= 75 ? 'rgb(59, 130, 246)' :
                    score.overallScore >= 60 ? 'rgb(234, 179, 8)' :
                    'rgb(239, 68, 68)'
                  })`
                }}
              />
            </svg>

            {/* Score Text no Centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-display font-bold text-[--text-primary]">
                {isLoading ? '...' : Math.round(score.overallScore)}
              </div>
              <div className="text-xs text-[--text-muted] font-medium">SCORE QA</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${
            score.canDeliver
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {score.canDeliver ? (
              <>
                <CheckCircle className="w-5 h-5" />
                ✅ Pronto para produção
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                ⚠️ Precisa revisão
              </>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-[--text-primary]">
              {score.passedChecks}/{score.totalChecks}
            </p>
            <p className="text-xs text-[--text-muted] mt-1">Checks Passados</p>
          </div>

          <div className="bg-white/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-[--text-primary]">
              {formatDuration(score.totalDuration)}
            </p>
            <p className="text-xs text-[--text-muted] mt-1">Tempo Total QA</p>
          </div>
        </div>

        {/* Breakdown por Categoria */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider">
            Breakdown por Categoria
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {sortedCategories.map(([category, data]) => (
              <div key={category} className="bg-white/40 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-[--text-primary]">{category}</p>
                  <span className="text-xs font-bold text-[--text-primary]">
                    {Math.round(data.score)}
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="w-full h-1.5 bg-[--bg-base] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      data.score >= 90 ? 'bg-green-500' :
                      data.score >= 75 ? 'bg-blue-500' :
                      data.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>

                <p className="text-xs text-[--text-muted] mt-1.5">
                  {data.passed}/{data.total}
                </p>
              </div>
            ))}
          </div>

          {/* Nota: Se faltam categorias, mostrar mensagem */}
          {Object.keys(score.categoryBreakdown).length > sortedCategories.length && (
            <p className="text-xs text-[--text-muted] text-center py-2 border-t border-[--border]">
              +{Object.keys(score.categoryBreakdown).length - sortedCategories.length} mais categorias
            </p>
          )}
        </div>

        {/* Failed Checks Alert (se houver) */}
        {score.failedChecks > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-700">
              ⚠️ {score.failedChecks} check{score.failedChecks !== 1 ? 's' : ''} falhado{score.failedChecks !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Resolve os problemas antes de fazer deploy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
