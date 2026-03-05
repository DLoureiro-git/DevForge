import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface ProgressNarrativeProps {
  message: string
  progress: number // 0-100
}

export function ProgressNarrative({ message, progress }: ProgressNarrativeProps) {
  const [displayedMessage, setDisplayedMessage] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (message !== displayedMessage) {
      setIsAnimating(true)

      // Fade out
      setTimeout(() => {
        setDisplayedMessage(message)
        setIsAnimating(false)
      }, 300)
    }
  }, [message, displayedMessage])

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5 animate-pulse" />
        <p
          className={`text-base text-white font-medium transition-opacity duration-300 ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {displayedMessage || 'A inicializar...'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progresso</span>
          <span className="text-accent-primary font-mono font-bold">{Math.round(progress)}%</span>
        </div>

        <div className="relative h-2 bg-base-lighter rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
