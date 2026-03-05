import React from 'react';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import '../../styles/design-system.css';

interface SprintHeaderProps {
  sprintNumber: number;
  goal: string;
  daysLeft: number;
  totalDays: number;
  velocity: {
    avg: number;
    history: number[];
  };
}

const SprintHeader: React.FC<SprintHeaderProps> = ({
  sprintNumber,
  goal,
  daysLeft,
  totalDays,
  velocity,
}) => {
  const progress = ((totalDays - daysLeft) / totalDays) * 100;

  return (
    <div
      className="fade-up"
      style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Sprint {sprintNumber}
            </h1>
            <span className="badge badge-purple">ATIVO</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-dim)',
              margin: '4px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Target size={14} />
            {goal}
          </p>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              Dias Restantes
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} color="var(--blue)" />
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                {daysLeft} / {totalDays}
              </span>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              Velocity Média
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color="var(--green)" />
              <span style={{ fontSize: 18, fontWeight: 700 }}>{velocity.avg}</span>
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>pts/sprint</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            background: 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
};

export default SprintHeader;
