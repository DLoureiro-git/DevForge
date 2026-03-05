/**
 * QA Types — Definições de tipos para componentes de QA
 */

export type BugSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type BugStatus = 'open' | 'fixing' | 'fixed'
export type CheckStatus = 'pending' | 'running' | 'passed' | 'failed'

export interface Bug {
  id: string
  category: string
  description: string
  userFriendlyDescription: string
  severity: BugSeverity
  status: BugStatus
  technicalDetails?: string
  createdAt: string
  updatedAt: string
}

export interface Check {
  id: string
  name: string
  category: string
  status: CheckStatus
  duration: number // em milisegundos
  message?: string
  isCritical: boolean
  details?: Record<string, any>
}

export interface QAScore {
  overallScore: number // 0-100
  canDeliver: boolean
  totalChecks: number
  passedChecks: number
  failedChecks: number
  totalDuration: number // em milisegundos
  categoryBreakdown: Record<string, {
    score: number
    passed: number
    total: number
  }>
}

export interface QAData {
  id: string
  projectId: string
  bugs: Bug[]
  checks: Check[]
  score: QAScore
  timestamp: string
  status: 'running' | 'completed' | 'idle'
}
