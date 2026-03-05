// FASE 5 Types - Export all
export * from './sprint'
export * from './pipeline'
export * from './team'
export * from './chat'

// Original types (backend)
export interface Message {
  id: string
  role: 'USER' | 'AGENT' | 'SYSTEM'
  content: string
  quickReplies?: string[]
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'failed'
  currentPhase?: string
  progress?: number
  narrative?: string
  messages?: Message[]
  createdAt: string
  updatedAt: string
}

export interface PhaseNode {
  id: string
  name: string
  icon: string
  color: string
  status: 'pending' | 'running' | 'done' | 'error'
  details?: any
  startedAt?: string
  completedAt?: string
}

export interface LogEntry {
  timestamp: string
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
  message: string
  phase?: string
}

export interface Metrics {
  total: number
  successful: number
  failed: number
  avgDuration: string
}

export interface Settings {
  anthropicKey?: string
  ollamaUrl?: string
  supabaseUrl?: string
  supabaseKey?: string
}

export interface User {
  id: string
  email: string
  name?: string
}

// Layout types
export type ViewType = 'projects' | 'sprint' | 'team' | 'settings'
