import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, TestTube2, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useStore } from '@/lib/store'

interface TestResult {
  service: string
  success: boolean
  message?: string
}

interface OllamaStatus {
  installed: boolean
  running: boolean
  models: string[]
  url: string
}

export function Settings() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useStore()
  const [formData, setFormData] = useState({
    anthropicKey: settings.anthropicKey || '',
    ollamaUrl: settings.ollamaUrl || 'http://localhost:11434',
    ollamaModelDev: settings.ollamaModelDev || 'qwen2.5:14b',
    ollamaModelFix: settings.ollamaModelFix || 'qwen2.5:14b',
    supabaseUrl: settings.supabaseUrl || '',
    supabaseKey: settings.supabaseKey || '',
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null)
  const [loadingOllama, setLoadingOllama] = useState(false)

  useEffect(() => {
    loadSettings()
    loadOllamaStatus()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await api.getSettings()
      setFormData({
        anthropicKey: data.anthropicKey || '',
        ollamaUrl: data.ollamaUrl || 'http://localhost:11434',
        ollamaModelDev: data.ollamaModelDev || 'qwen2.5:14b',
        ollamaModelFix: data.ollamaModelFix || 'qwen2.5:14b',
        supabaseUrl: data.supabaseUrl || '',
        supabaseKey: data.supabaseKey || '',
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadOllamaStatus = async () => {
    setLoadingOllama(true)
    try {
      const status = await api.getOllamaStatus()
      setOllamaStatus(status)
    } catch (error) {
      console.error('Failed to load Ollama status:', error)
      setOllamaStatus({ installed: false, running: false, models: [], url: '' })
    } finally {
      setLoadingOllama(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings(formData)
      updateSettings(formData)
      alert('Configurações guardadas com sucesso!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Erro ao guardar configurações.')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (service: string) => {
    setTesting(service)

    try {
      if (service === 'ollama') {
        // Use novo endpoint dedicado do Ollama
        const result = await api.testOllama(formData.ollamaModelDev)

        setTestResults((prev) => [
          ...prev.filter((r) => r.service !== service),
          {
            service,
            success: result.success,
            message: result.success
              ? `Modelo ${result.model} respondeu em ${result.duration}ms: "${result.response}"`
              : result.error,
          },
        ])

        // Recarregar status após teste
        await loadOllamaStatus()
      } else {
        const config: Record<string, any> = {}

        switch (service) {
          case 'anthropic':
            config.apiKey = formData.anthropicKey
            break
          case 'supabase':
            config.url = formData.supabaseUrl
            config.apiKey = formData.supabaseKey
            break
        }

        const result = await api.testConnection(service, config)

        setTestResults((prev) => [
          ...prev.filter((r) => r.service !== service),
          {
            service,
            success: result.success,
            message: result.message,
          },
        ])
      }
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev.filter((r) => r.service !== service),
        {
          service,
          success: false,
          message: error.message,
        },
      ])
    } finally {
      setTesting(null)
    }
  }

  const getTestResult = (service: string) => {
    return testResults.find((r) => r.service === service)
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-base-lighter rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold">Configurações</h1>
            <p className="text-gray-400">Configura as integrações e serviços</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>

        {/* Anthropic */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Anthropic Claude</h2>
              <p className="text-sm text-gray-400">API key para modelos Claude</p>
            </div>

            {getTestResult('anthropic') && (
              <div className="flex items-center gap-2">
                {getTestResult('anthropic')!.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-accent-success" />
                    <span className="text-sm text-accent-success">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-accent-error" />
                    <span className="text-sm text-accent-error">Erro</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <input
              type="password"
              value={formData.anthropicKey}
              onChange={(e) => setFormData({ ...formData, anthropicKey: e.target.value })}
              placeholder="sk-ant-..."
              className="input"
            />
          </div>

          <button
            onClick={() => handleTest('anthropic')}
            disabled={!formData.anthropicKey || testing === 'anthropic'}
            className="btn-secondary"
          >
            <TestTube2 className="w-4 h-4" />
            {testing === 'anthropic' ? 'A testar...' : 'Testar Conexão'}
          </button>

          {getTestResult('anthropic')?.message && (
            <div className="text-sm text-gray-400">
              {getTestResult('anthropic')!.message}
            </div>
          )}
        </div>

        {/* Ollama */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Ollama</h2>
              <p className="text-sm text-gray-400">IA local para geração de código</p>
            </div>

            <div className="flex items-center gap-2">
              {loadingOllama ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <span className="text-sm text-gray-400">A verificar...</span>
                </>
              ) : ollamaStatus?.running ? (
                <>
                  <CheckCircle className="w-5 h-5 text-accent-success" />
                  <span className="text-sm text-accent-success">Online</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-accent-error" />
                  <span className="text-sm text-accent-error">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Status e Instruções */}
          {!ollamaStatus?.running && (
            <div className="bg-accent-warning/10 border border-accent-warning/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-accent-warning mb-1">Ollama não está a correr</p>
                  <p className="text-gray-400">
                    Inicia o Ollama para gerar código localmente. Instala com:
                  </p>
                  <code className="block mt-2 bg-base-darker p-2 rounded text-xs">
                    brew install ollama && ollama pull qwen2.5:14b
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-2">URL do Servidor</label>
            <input
              type="text"
              value={formData.ollamaUrl}
              onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
              placeholder="http://localhost:11434"
              className="input"
            />
          </div>

          {/* Modelos disponíveis */}
          {ollamaStatus?.running && ollamaStatus.models.length > 0 && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Modelo para Desenvolvimento
                </label>
                <select
                  value={formData.ollamaModelDev}
                  onChange={(e) => setFormData({ ...formData, ollamaModelDev: e.target.value })}
                  className="input"
                >
                  {ollamaStatus.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Usado para gerar código novo e features
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Modelo para Correções
                </label>
                <select
                  value={formData.ollamaModelFix}
                  onChange={(e) => setFormData({ ...formData, ollamaModelFix: e.target.value })}
                  className="input"
                >
                  {ollamaStatus.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Usado para corrigir erros e bugs
                </p>
              </div>
            </div>
          )}

          {/* Lista de modelos disponíveis */}
          {ollamaStatus?.running && ollamaStatus.models.length > 0 && (
            <div className="text-sm text-gray-400">
              <span className="font-medium">{ollamaStatus.models.length} modelo(s) disponível(eis):</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {ollamaStatus.models.map((model) => (
                  <span
                    key={model}
                    className="px-2 py-1 bg-base-lighter rounded text-xs"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Botão de teste */}
          <button
            onClick={() => handleTest('ollama')}
            disabled={!formData.ollamaUrl || testing === 'ollama' || !ollamaStatus?.running}
            className="btn-secondary"
          >
            <TestTube2 className="w-4 h-4" />
            {testing === 'ollama' ? 'A testar...' : 'Testar Conexão'}
          </button>

          {/* Resultado do teste */}
          {getTestResult('ollama') && (
            <div className={`text-sm p-3 rounded-lg ${
              getTestResult('ollama')!.success
                ? 'bg-accent-success/10 text-accent-success'
                : 'bg-accent-error/10 text-accent-error'
            }`}>
              {getTestResult('ollama')!.message}
            </div>
          )}
        </div>

        {/* Supabase */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Supabase</h2>
              <p className="text-sm text-gray-400">URL e API key do projeto Supabase</p>
            </div>

            {getTestResult('supabase') && (
              <div className="flex items-center gap-2">
                {getTestResult('supabase')!.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-accent-success" />
                    <span className="text-sm text-accent-success">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-accent-error" />
                    <span className="text-sm text-accent-error">Erro</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={formData.supabaseUrl}
              onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
              placeholder="https://xxx.supabase.co"
              className="input"
            />

            <input
              type="password"
              value={formData.supabaseKey}
              onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
              placeholder="eyJh..."
              className="input"
            />
          </div>

          <button
            onClick={() => handleTest('supabase')}
            disabled={!formData.supabaseUrl || !formData.supabaseKey || testing === 'supabase'}
            className="btn-secondary"
          >
            <TestTube2 className="w-4 h-4" />
            {testing === 'supabase' ? 'A testar...' : 'Testar Conexão'}
          </button>

          {getTestResult('supabase')?.message && (
            <div className="text-sm text-gray-400">
              {getTestResult('supabase')!.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
