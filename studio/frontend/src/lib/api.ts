interface ApiError {
  message: string
  code?: string
}

class ApiClient {
  private baseUrl = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: response.statusText,
        }))
        throw new Error(error.message || 'Request failed')
      }

      return response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Projects
  async getProjects() {
    return this.request<any[]>('/projects')
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`)
  }

  async createProject(data: {
    name: string
    description: string
    requirements?: any
  }) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string) {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // Chat
  async sendMessage(projectId: string, message: string) {
    return this.request<any>(`/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }

  async getChatHistory(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/chat/history`)
  }

  // Pipeline
  async getPipelineStatus(projectId: string) {
    return this.request<any>(`/projects/${projectId}/pipeline`)
  }

  async getPhaseDetails(projectId: string, phase: string) {
    return this.request<any>(`/projects/${projectId}/pipeline/${phase}`)
  }

  // Settings
  async getSettings() {
    return this.request<any>('/settings')
  }

  async updateSettings(settings: any) {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async testConnection(service: string, config: any) {
    return this.request<{ success: boolean; message?: string }>(
      '/settings/test',
      {
        method: 'POST',
        body: JSON.stringify({ service, config }),
      }
    )
  }

  // Ollama
  async getOllamaStatus() {
    return this.request<{
      installed: boolean
      running: boolean
      models: string[]
      url: string
    }>('/ollama/status')
  }

  async getOllamaModels() {
    return this.request<{ models: string[] }>('/ollama/models')
  }

  async testOllama(model?: string) {
    return this.request<{
      success: boolean
      model: string
      response: string
      duration: number
      url: string
      error?: string
    }>('/ollama/test', {
      method: 'POST',
      body: JSON.stringify({ model }),
    })
  }

  // Metrics
  async getMetrics() {
    return this.request<any>('/metrics')
  }

  // Code
  async getProjectCode(projectId: string) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/code`)
    return response.blob()
  }

  async getProjectUrl(projectId: string) {
    return this.request<{ url: string }>(`/projects/${projectId}/url`)
  }
}

export const api = new ApiClient()
