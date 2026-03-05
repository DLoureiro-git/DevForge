import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { ExternalLink, Code, Download, Clock, CheckCircle, Award } from 'lucide-react'

interface DeliveryCardProps {
  projectId: string
  projectName: string
  projectUrl?: string
  stats: {
    duration: string
    features: number
    qaScore: number
  }
  onOpenProject?: () => void
  onViewCode?: () => void
  onDownloadZip?: () => void
}

export function DeliveryCard({
  projectName,
  projectUrl,
  stats,
  onOpenProject,
  onViewCode,
  onDownloadZip,
}: DeliveryCardProps) {
  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass-card p-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-success/20 text-accent-success mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-display font-bold text-gradient-primary">
          O teu projeto está pronto! 🎉
        </h2>

        <p className="text-xl text-gray-300">{projectName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-base-lighter/50 rounded-lg p-4 text-center">
          <Clock className="w-5 h-5 mx-auto mb-2 text-accent-primary" />
          <div className="text-2xl font-bold text-white">{stats.duration}</div>
          <div className="text-sm text-gray-400">Tempo total</div>
        </div>

        <div className="bg-base-lighter/50 rounded-lg p-4 text-center">
          <Code className="w-5 h-5 mx-auto mb-2 text-accent-secondary" />
          <div className="text-2xl font-bold text-white">{stats.features}</div>
          <div className="text-sm text-gray-400">Features implementadas</div>
        </div>

        <div className="bg-base-lighter/50 rounded-lg p-4 text-center">
          <Award className="w-5 h-5 mx-auto mb-2 text-accent-success" />
          <div className="text-2xl font-bold text-white">{stats.qaScore}%</div>
          <div className="text-sm text-gray-400">QA Score</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {projectUrl && (
          <button
            onClick={onOpenProject}
            className="btn-primary w-full justify-center text-lg py-3"
          >
            <ExternalLink className="w-5 h-5" />
            Abrir Projeto
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={onViewCode}
            className="btn-secondary justify-center"
          >
            <Code className="w-4 h-4" />
            Ver Código
          </button>

          <button
            onClick={onDownloadZip}
            className="btn-secondary justify-center"
          >
            <Download className="w-4 h-4" />
            Download ZIP
          </button>
        </div>
      </div>
    </div>
  )
}
