/**
 * QA DASHBOARD — Página completa de QA
 *
 * Integra os 3 componentes (BugTracker, QAScoreCard, ChecklistProgress)
 * com layout responsivo e real-time updates.
 */

import { useState, useEffect } from 'react'
import { RefreshCw, Activity } from 'lucide-react'
import BugTracker from '../BugTracker'
import QAScoreCard from '../QAScoreCard'
import ChecklistProgress from '../ChecklistProgress'
import type { Bug, Check, QAScore } from '../types/qa'

interface QADashboardProps {
  projectId: string
  // Opcional: fornecer dados iniciais
  initialBugs?: Bug[]
  initialChecks?: Check[]
  initialScore?: QAScore
}

export default function QADashboard({
  projectId,
  initialBugs = [],
  initialChecks = [],
  initialScore
}: QADashboardProps) {
  const [bugs, setBugs] = useState<Bug[]>(initialBugs)
  const [checks, setChecks] = useState<Check[]>(initialChecks)
  const [score, setScore] = useState<QAScore | null>(initialScore || null)
  const [isLoading, setIsLoading] = useState(!initialScore)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch QA data
  const fetchQAData = async () => {
    try {
      setIsRefreshing(true)
      const [bugsRes, checksRes, scoreRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/qa/bugs`),
        fetch(`/api/projects/${projectId}/qa/checks`),
        fetch(`/api/projects/${projectId}/qa/score`)
      ])

      if (!bugsRes.ok || !checksRes.ok || !scoreRes.ok) {
        throw new Error('Failed to fetch QA data')
      }

      const [bugsData, checksData, scoreData] = await Promise.all([
        bugsRes.json(),
        checksRes.json(),
        scoreRes.json()
      ])

      setBugs(bugsData)
      setChecks(checksData)
      setScore(scoreData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching QA data:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch inicial
  useEffect(() => {
    if (initialScore === undefined) {
      fetchQAData()
    } else {
      setIsLoading(false)
    }
  }, [projectId])

  // WebSocket para real-time updates (opcional)
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        ws = new WebSocket(`${protocol}//${window.location.host}/api/projects/${projectId}/qa/ws`)

        ws.onopen = () => {
          console.log('[QA] WebSocket conectado')
        }

        ws.onmessage = (event) => {
          try {
            const { type, data } = JSON.parse(event.data)

            switch (type) {
              case 'bug-update':
                setBugs(data)
                break
              case 'check-update':
                setChecks(data)
                break
              case 'score-update':
                setScore(data)
                setLastUpdate(new Date())
                break
              case 'qa-complete':
                // QA rodou, refresh completo
                fetchQAData()
                break
            }
          } catch (err) {
            console.error('[QA] Error parsing WebSocket message:', err)
          }
        }

        ws.onerror = () => {
          console.error('[QA] WebSocket error')
        }

        ws.onclose = () => {
          console.log('[QA] WebSocket desconectado, tentando reconectar em 5s...')
          reconnectTimeout = setTimeout(connectWebSocket, 5000)
        }
      } catch (err) {
        console.error('[QA] Error connecting to WebSocket:', err)
        reconnectTimeout = setTimeout(connectWebSocket, 5000)
      }
    }

    // Conectar apenas em client-side (não em SSR)
    if (typeof window !== 'undefined') {
      connectWebSocket()
    }

    return () => {
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [projectId])

  const handleRefresh = () => {
    fetchQAData()
  }

  const handleToggleBugDetail = (bugId: string) => {
    // Implementar lógica customizada se necessário
    console.log('Bug detail toggled:', bugId)
  }

  return (
    <div className="min-h-screen bg-[--bg-base] space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-[--text-primary]">
              QA Dashboard
            </h1>
            <p className="text-[--text-muted] mt-1">
              Status QA completo do projecto
            </p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[--phase-build] text-white font-medium hover:shadow-lg hover:shadow-[--phase-build]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'A actualizar...' : 'Actualizar'}
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[--bg-raised] border border-[--border] rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-700">
              Sistema activo
            </span>
          </div>

          {lastUpdate && (
            <div className="text-xs text-[--text-muted]">
              Última actualização: {lastUpdate.toLocaleTimeString('pt-PT')}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-[--border] border-t-[--phase-build] animate-spin mx-auto" />
            <p className="text-[--text-muted] font-medium">
              A carregar dados QA...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Grid: Score Card + Bug Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Score Card — 1 coluna */}
            <div className="lg:col-span-1">
              {score ? (
                <QAScoreCard score={score} isLoading={isRefreshing} />
              ) : (
                <div className="bg-[--bg-raised] border border-[--border] rounded-2xl p-6 text-center">
                  <p className="text-[--text-muted]">Nenhum score disponível</p>
                </div>
              )}
            </div>

            {/* Bug Tracker — 3 colunas */}
            <div className="lg:col-span-3 bg-[--bg-raised] border border-[--border] rounded-2xl p-6">
              {bugs.length > 0 || !isLoading ? (
                <BugTracker
                  bugs={bugs}
                  onToggleDetail={handleToggleBugDetail}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-[--text-muted]">Nenhum bug a carregar</p>
                </div>
              )}
            </div>
          </div>

          {/* Checklist Progress — Full width */}
          <div className="bg-[--bg-raised] border border-[--border] rounded-2xl p-6">
            {checks.length > 0 || !isLoading ? (
              <ChecklistProgress
                checks={checks}
                isLoading={isRefreshing}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-[--text-muted]">Nenhuma check a carregar</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[--text-muted]">
            <div className="px-4 py-2 bg-[--bg-raised] rounded-lg border border-[--border]">
              <span className="font-medium text-[--text-secondary]">Total Bugs:</span>
              <span className="ml-2">{bugs.length}</span>
            </div>

            <div className="px-4 py-2 bg-[--bg-raised] rounded-lg border border-[--border]">
              <span className="font-medium text-[--text-secondary]">Total Checks:</span>
              <span className="ml-2">{checks.length}</span>
            </div>

            <div className="px-4 py-2 bg-[--bg-raised] rounded-lg border border-[--border]">
              <span className="font-medium text-[--text-secondary]">Score Geral:</span>
              <span className="ml-2">
                {score ? `${Math.round(score.overallScore)}/100` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
