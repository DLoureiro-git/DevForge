// Sprint Types

export type FeatureStatus =
  | 'BACKLOG'
  | 'READY'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'IN_QA'
  | 'DONE';

export type FeatureType = 'FEATURE' | 'FIX';

export type FeaturePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type BugSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Bug {
  sev: BugSeverity;
  msg: string;
}

export interface Feature {
  id: string;
  title: string;
  type: FeatureType;
  priority: FeaturePriority;
  pts: number;
  status: FeatureStatus;
  branch?: string | null;
  progress?: number | null;
  qa?: number | null;
  bugs?: Bug[];
  agentId?: string;
  mergedAt?: string;
  desc?: string;
  sprint?: number | null;
  reqBy?: string;
}

export interface Sprint {
  number: number;
  goal: string;
  daysLeft: number;
  totalDays: number;
  velocity: {
    avg: number;
    history: number[];
  };
}

export interface KanbanColumn {
  id: FeatureStatus;
  label: string;
  color: string;
  wip: number | null;
}
