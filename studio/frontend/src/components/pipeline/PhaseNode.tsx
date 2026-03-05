import React from 'react';
import '../../styles/design-system.css';

interface PhaseNodeProps {
  label: string;
  short: string;
  icon: string;
  color: string;
  colorRaw: string;
  glowRaw: string;
  status: 'idle' | 'running' | 'done' | 'error';
  isLoop?: boolean;
}

const PhaseNode: React.FC<PhaseNodeProps> = ({
  label,
  short,
  icon,
  colorRaw,
  glowRaw,
  status,
  isLoop = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
      }}
    >
      {/* Node Circle */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: status === 'running' ? glowRaw : 'var(--surface)',
          border: `2px solid ${status === 'idle' ? 'var(--border)' : colorRaw}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s',
        }}
      >
        {/* Ripple Effect when Running */}
        {status === 'running' && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: -8,
                border: `2px solid ${colorRaw}`,
                borderRadius: '50%',
                animation: 'ripple 1.5s ease-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -8,
                border: `2px solid ${colorRaw}`,
                borderRadius: '50%',
                animation: 'ripple 1.5s 0.75s ease-out infinite',
              }}
            />
          </>
        )}

        {/* Icon/Emoji */}
        <div style={{ fontSize: 28 }}>{icon}</div>

        {/* Loop Indicator */}
        {isLoop && status === 'running' && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: colorRaw,
              border: '2px solid var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              animation: 'spin 2s linear infinite',
            }}
          >
            🔄
          </div>
        )}
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: status === 'idle' ? 'var(--text-faint)' : colorRaw,
            marginBottom: 2,
          }}
        >
          {short}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-dimmer)',
            maxWidth: 100,
          }}
        >
          {label}
        </div>
      </div>

      {/* Status Badge */}
      {status === 'done' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--green)',
            border: '2px solid var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
          }}
        >
          ✓
        </div>
      )}

      {status === 'error' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--red)',
            border: '2px solid var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
          }}
        >
          ✕
        </div>
      )}
    </div>
  );
};

export default PhaseNode;
