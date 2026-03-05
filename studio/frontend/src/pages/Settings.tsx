import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, TestTube2, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useStore } from '@/lib/store'

interface TestResult {
  service: string
  success: boolean
  message?: string
}

export function Settings() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useStore()
  const [formData, setFormData] = useState({
    anthropicKey: settings.anthropicKey || '',
    ollamaUrl: settings.ollamaUrl || 'http://localhost:11434',
    supabaseUrl: settings.supabaseUrl || '',
    supabaseKey: settings.supabaseKey || '',
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await api.getSettings()
      setFormData({
        anthropicKey: data.anthropicKey || '',
        ollamaUrl: data.ollamaUrl || 'http://localhost:11434',
        supabaseUrl: data.supabaseUrl || '',
        supabaseKey: data.supabaseKey || '',
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
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

    const config: Record<string, any> = {}

    switch (service) {
      case 'anthropic':
        config.apiKey = formData.anthropicKey
        break
      case 'ollama':
        config.url = formData.ollamaUrl
        break
      case 'supabase':
        config.url = formData.supabaseUrl
        config.apiKey = formData.supabaseKey
        break
    }

    try {
      const result = await api.testConnection(service, config)

      setTestResults((prev) => [
        ...prev.filter((r) => r.service !== service),
        {
          service,
          success: result.success,
          message: result.message,
        },
      ])
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
              <p className="text-sm text-gray-400">URL do servidor Ollama local</p>
            </div>

            {getTestResult('ollama') && (
              <div className="flex items-center gap-2">
                {getTestResult('ollama')!.success ? (
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
              type="text"
              value={formData.ollamaUrl}
              onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
              placeholder="http://localhost:11434"
              className="input"
            />
          </div>

          <button
            onClick={() => handleTest('ollama')}
            disabled={!formData.ollamaUrl || testing === 'ollama'}
            className="btn-secondary"
          >
            <TestTube2 className="w-4 h-4" />
            {testing === 'ollama' ? 'A testar...' : 'Testar Conexão'}
          </button>

          {getTestResult('ollama')?.message && (
            <div className="text-sm text-gray-400">
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
