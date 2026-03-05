import React from 'react';
import PhaseNode from './PhaseNode';
import { ChevronRight } from 'lucide-react';
import '../../styles/design-system.css';

interface Phase {
  id: string;
  label: string;
  short: string;
  icon: string;
  color: string;
  colorRaw: string;
  glowRaw: string;
  status: 'idle' | 'running' | 'done' | 'error';
  isLoop?: boolean;
  parallel?: boolean;
}

interface PipelineTimelineProps {
  phases: Phase[];
}

const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ phases }) => {
  return (
    <div
      className="fade-up"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '40px 20px',
        overflow: 'auto',
      }}
    >
      {phases.map((phase, idx) => (
        <React.Fragment key={phase.id}>
          <PhaseNode {...phase} />
          {idx < phases.length - 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color:
                  phase.status === 'done'
                    ? 'var(--green)'
                    : phase.status === 'running'
                    ? 'var(--accent)'
                    : 'var(--border)',
                transition: 'color 0.3s',
              }}
            >
              {phase.parallel ? (
                // Parallel indicator
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div
                    style={{
                      width: 20,
                      height: 2,
                      background: 'currentColor',
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 2,
                      background: 'currentColor',
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 2,
                      background: 'currentColor',
                      borderRadius: 2,
                    }}
                  />
                </div>
              ) : (
                // Simple arrow
                <ChevronRight size={20} />
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default PipelineTimeline;
