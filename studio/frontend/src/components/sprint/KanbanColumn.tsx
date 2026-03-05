import React from 'react';
import '../../styles/design-system.css';

interface KanbanColumnProps {
  id: string;
  label: string;
  color: string;
  wip: number | null;
  count: number;
  children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  label,
  color,
  wip,
  count,
  children,
}) => {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--raised)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}40`,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              flex: 1,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-faint)',
            }}
          >
            {count}
          </span>
          {wip !== null && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-faint)',
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 4,
              }}
            >
              WIP: {wip}
            </span>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default KanbanColumn;
