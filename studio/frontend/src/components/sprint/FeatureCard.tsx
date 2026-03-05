// @ts-nocheck
import React from 'react';
import { GitBranch, AlertCircle } from 'lucide-react';
import '../../styles/design-system.css';

interface Bug {
  sev: 'HIGH' | 'MEDIUM' | 'LOW';
  msg: string;
}

interface FeatureCardProps {
  id: string;
  title: string;
  type: 'FEATURE' | 'FIX';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  pts: number;
  status: 'BACKLOG' | 'READY' | 'IN_PROGRESS' | 'IN_REVIEW' | 'IN_QA' | 'DONE';
  branch?: string | null;
  progress?: number | null;
  qa?: number | null;
  bugs?: Bug[];
  agentId?: string;
  mergedAt?: string;
  desc?: string;
}

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', color: '#FF6B6B', badge: 'badge-red' },
  HIGH: { label: 'High', color: '#FB923C', badge: 'badge-orange' },
  MEDIUM: { label: 'Medium', color: '#FFB547', badge: 'badge-amber' },
  LOW: { label: 'Low', color: '#5BB8FF', badge: 'badge-blue' },
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  id,
  title,
  type,
  priority,
  pts,
  branch,
  progress,
  qa,
  bugs,
  mergedAt,
  desc,
}) => {
  const priorityCfg = PRIORITY_CONFIG[priority];

  return (
    <div
      className="card fade-in"
      style={{
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-faint)',
                letterSpacing: '0.05em',
              }}
            >
              {id}
            </span>
            <span className={priorityCfg.badge}>{priorityCfg.label}</span>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          {desc && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5 }}>
              {desc}
            </div>
          )}
        </div>
        <div
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-dim)',
          }}
        >
          {pts} pts
        </div>
      </div>

      {/* Progress Bar */}
      {progress !== null && progress !== undefined && (
        <div style={{ marginBottom: 10 }}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background:
                  progress === 100
                    ? 'var(--green)'
                    : progress > 50
                    ? 'var(--orange)'
                    : 'var(--blue)',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-faint)',
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {progress}%
          </div>
        </div>
      )}

      {/* QA Score */}
      {qa !== null && qa !== undefined && (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: qa >= 90 ? 'var(--green-dim)' : qa >= 70 ? 'var(--amber-dim)' : 'var(--red-dim)',
            border: `1px solid ${qa >= 90 ? 'rgba(61,255,160,0.2)' : qa >= 70 ? 'rgba(255,181,71,0.2)' : 'rgba(255,107,107,0.2)'}`,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          <span style={{ color: qa >= 90 ? 'var(--green)' : qa >= 70 ? 'var(--amber)' : 'var(--red)' }}>
            QA Score: {qa}/100
          </span>
        </div>
      )}

      {/* Bugs */}
      {bugs && bugs.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {bugs.map((bug, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                background: 'var(--red-dim)',
                border: '1px solid rgba(255,107,107,0.2)',
                borderRadius: 6,
                fontSize: 11,
                color: 'var(--red)',
                marginTop: idx > 0 ? 4 : 0,
              }}
            >
              <AlertCircle size={12} />
              <span style={{ flex: 1 }}>{bug.msg}</span>
              <span className="badge badge-red" style={{ fontSize: 9 }}>
                {bug.sev}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Branch */}
      {branch && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-dimmer)',
          }}
        >
          <GitBranch size={12} />
          {branch}
        </div>
      )}

      {/* Merged */}
      {mergedAt && (
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: 'var(--text-faint)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--green)',
            }}
          />
          Merged: {mergedAt}
        </div>
      )}
    </div>
  );
};

export default FeatureCard;
