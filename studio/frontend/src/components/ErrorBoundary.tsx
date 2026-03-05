import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card p-8 max-w-lg text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-error/20 text-accent-error mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-display font-bold">Algo correu mal</h1>

            <p className="text-gray-400">
              Ocorreu um erro inesperado. Por favor, recarrega a página.
            </p>

            {this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                  Detalhes técnicos
                </summary>
                <pre className="terminal mt-2 text-xs">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
