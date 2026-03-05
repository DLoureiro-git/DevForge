import { useEffect, useRef, useState } from 'react'
import { Terminal, AlertCircle, AlertTriangle, Info, Filter } from 'lucide-react'
import { useSSE } from '@/hooks/useSSE'
import { clsx } from 'clsx'

interface LogEntry {
  timestamp: string
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
  message: string
  phase?: string
}

interface LogsProps {
  projectId: string
}

const levelIcons = {
  ERROR: AlertCircle,
  WARN: AlertTriangle,
  INFO: Info,
  DEBUG: Terminal,
}

const levelColors = {
  ERROR: 'text-accent-error',
  WARN: 'text-accent-warning',
  INFO: 'text-accent-primary',
  DEBUG: 'text-gray-400',
}

export function Logs({ projectId }: LogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<LogEntry['level'] | 'ALL'>('ALL')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // SSE connection for real-time logs
  useSSE(`/api/projects/${projectId}/logs/stream`, {
    onMessage: (data) => {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        ...data,
      }
      setLogs((prev) => [...prev, logEntry])
    },
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Detect manual scroll
  const handleScroll = () => {
    if (!containerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50

    setAutoScroll(isAtBottom)
  }

  const filteredLogs = logs.filter(
    (log) => filter === 'ALL' || log.level === filter
  )

  const levels: Array<LogEntry['level'] | 'ALL'> = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG']

  return (
    <div className="flex flex-col h-full bg-base-lighter rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-lighter bg-base-light">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold">Logs</h3>
          <span className="badge bg-base-lighter text-gray-400">
            {filteredLogs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-base-lighter border border-base-lighter rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 font-mono text-sm"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Sem logs disponíveis
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const Icon = levelIcons[log.level]
            const colorClass = levelColors[log.level]

            return (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded hover:bg-base-light/50 transition-colors"
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0 mt-0.5', colorClass)} />

                <span className="text-gray-500 text-xs flex-shrink-0 w-20">
                  {new Date(log.timestamp).toLocaleTimeString('pt-PT')}
                </span>

                {log.phase && (
                  <span className="badge badge-pending text-xs flex-shrink-0">
                    {log.phase}
                  </span>
                )}

                <span className="text-gray-300 flex-1 break-words">
                  {log.message}
                </span>
              </div>
            )
          })
        )}

        <div ref={logsEndRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true)
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="absolute bottom-4 right-4 btn-primary text-xs shadow-lg"
        >
          Scroll to bottom
        </button>
      )}
    </div>
  )
}
