import React from 'react';
import KanbanColumn from './KanbanColumn';
import FeatureCard from './FeatureCard';
import '../../styles/design-system.css';

interface Feature {
  id: string;
  title: string;
  type: 'FEATURE' | 'FIX';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  pts: number;
  status: 'BACKLOG' | 'READY' | 'IN_PROGRESS' | 'IN_REVIEW' | 'IN_QA' | 'DONE';
  branch?: string | null;
  progress?: number | null;
  qa?: number | null;
  bugs?: Array<{ sev: 'HIGH' | 'MEDIUM' | 'LOW'; msg: string }>;
  agentId?: string;
  mergedAt?: string;
  desc?: string;
}

interface SprintBoardProps {
  features: Feature[];
}

const KANBAN_COLS = [
  { id: 'BACKLOG', label: 'Backlog', color: 'var(--text-faint)', wip: null },
  { id: 'READY', label: 'Pronto', color: 'var(--blue)', wip: null },
  { id: 'IN_PROGRESS', label: 'Em Progresso', color: 'var(--orange)', wip: 3 },
  { id: 'IN_REVIEW', label: 'Em Review', color: 'var(--amber)', wip: 2 },
  { id: 'IN_QA', label: 'Em QA', color: 'var(--pink)', wip: 2 },
  { id: 'DONE', label: 'Concluído', color: 'var(--green)', wip: null },
];

const SprintBoard: React.FC<SprintBoardProps> = ({ features }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 16,
        overflow: 'auto',
        height: '100%',
      }}
    >
      {KANBAN_COLS.map((col) => {
        const colFeatures = features.filter((f) => f.status === col.id);
        return (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            wip={col.wip}
            count={colFeatures.length}
          >
            {colFeatures.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-faint)',
                  fontSize: 12,
                }}
              >
                Nenhuma feature
              </div>
            ) : (
              colFeatures.map((feature) => (
                <FeatureCard key={feature.id} {...feature} />
              ))
            )}
          </KanbanColumn>
        );
      })}
    </div>
  );
};

export default SprintBoard;
