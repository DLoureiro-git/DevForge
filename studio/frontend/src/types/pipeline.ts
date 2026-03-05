// Pipeline Types

export type PhaseStatus = 'idle' | 'running' | 'done' | 'error';

export interface Phase {
  id: string;
  label: string;
  short: string;
  icon: string;
  color: string;
  colorRaw: string;
  glowRaw: string;
  status: PhaseStatus;
  isLoop?: boolean;
  parallel?: boolean;
}

export interface LogEntry {
  id: number;
  timestamp?: string;
  level?: 'info' | 'warning' | 'error' | 'success';
  message: string;
}
