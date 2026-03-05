import React from 'react';
import { Clock } from 'lucide-react';
import '../../styles/design-system.css';

interface Activity {
  id: number;
  time: string;
  actor: string;
  ai: boolean;
  icon: string;
  msg: string;
  badge: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="card fade-up-3" style={{ maxHeight: 600, overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Clock size={16} color="var(--text-dim)" />
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            margin: 0,
          }}
        >
          Feed de Atividade
        </h3>
      </div>

      {activities.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-faint)',
            fontSize: 12,
          }}
        >
          Nenhuma atividade recente
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activities.map((activity, idx) => (
            <div
              key={activity.id}
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                background: 'var(--raised)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                transition: 'all 0.15s',
                cursor: 'pointer',
                animationDelay: `${idx * 0.05}s`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: activity.ai
                    ? 'var(--accent-glow)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activity.ai ? 'rgba(124,106,250,0.3)' : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {activity.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: activity.ai ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {activity.actor}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-faint)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {activity.time}
                  </span>
                  {activity.ai && (
                    <span className="badge badge-purple" style={{ fontSize: 9 }}>
                      AI
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-dim)',
                    lineHeight: 1.5,
                  }}
                >
                  {activity.msg}
                </div>
              </div>

              {/* Badge */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background:
                    activity.badge === 'badge-green'
                      ? 'var(--green)'
                      : activity.badge === 'badge-amber'
                      ? 'var(--amber)'
                      : activity.badge === 'badge-red'
                      ? 'var(--red)'
                      : activity.badge === 'badge-pink'
                      ? 'var(--pink)'
                      : activity.badge === 'badge-orange'
                      ? 'var(--orange)'
                      : 'var(--accent)',
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
