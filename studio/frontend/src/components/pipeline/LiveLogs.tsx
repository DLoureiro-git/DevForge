import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import '../../styles/design-system.css';

interface LiveLogsProps {
  logs: string[];
  isRunning?: boolean;
}

const LiveLogs: React.FC<LiveLogsProps> = ({ logs, isRunning = false }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      className="card"
      style={{
        background: 'var(--bg)',
        borderColor: 'rgba(124,106,250,0.2)',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 300,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface)',
        }}
      >
        <Terminal size={14} color="var(--accent)" />
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
          Live Logs
        </span>
        {isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--green)',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
              RUNNING
            </span>
          </div>
        )}
      </div>

      {/* Logs */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-faint)',
            }}
          >
            Aguardando logs...
          </div>
        ) : (
          <>
            {logs.map((log, idx) => {
              const isError = log.includes('⚠') || log.includes('Error');
              const isSuccess = log.includes('✓') || log.includes('✅');
              const isWarning = log.includes('⚠');

              return (
                <div
                  key={idx}
                  className="fade-in"
                  style={{
                    color: isError
                      ? 'var(--red)'
                      : isWarning
                      ? 'var(--amber)'
                      : isSuccess
                      ? 'var(--green)'
                      : 'var(--text-dimmer)',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: 'var(--text-faint)', marginRight: 8 }}>
                    {String(idx + 1).padStart(3, '0')}
                  </span>
                  {log}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Cursor */}
      {isRunning && logs.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
          }}
        >
          <span style={{ animation: 'blink 1s infinite' }}>▋</span>
        </div>
      )}
    </div>
  );
};

export default LiveLogs;
