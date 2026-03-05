import React from 'react';
import { User, Cpu, Circle } from 'lucide-react';
import '../../styles/design-system.css';

interface HumanMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  online: boolean;
}

interface AIAgent {
  id: string;
  name: string;
  model: string;
  icon: string;
  color: string;
  active: boolean;
}

interface TeamPanelProps {
  humans: HumanMember[];
  agents: AIAgent[];
}

const TeamPanel: React.FC<TeamPanelProps> = ({ humans, agents }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Humans Section */}
      <div className="fade-up">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <User size={16} color="var(--text-dim)" />
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
            Equipa Humana
          </h3>
          <span className="badge badge-dim">{humans.length}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {humans.map((human) => (
            <div
              key={human.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `${human.color}22`,
                    border: `2px solid ${human.color}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: human.color,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {human.initials}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: human.online ? 'var(--green)' : 'rgba(255,255,255,0.2)',
                    border: '2px solid var(--surface)',
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {human.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  {human.role}
                </div>
              </div>

              {/* Status */}
              <span
                className={`badge ${human.online ? 'badge-green' : 'badge-dim'}`}
              >
                {human.online ? 'Online' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Agents Section */}
      <div className="fade-up-2">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Cpu size={16} color="var(--accent)" />
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
            AI Agents
          </h3>
          <span className="badge badge-purple">{agents.length}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderColor: agent.active
                  ? `${agent.color}40`
                  : 'var(--border)',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: agent.active ? `${agent.color}22` : 'var(--raised)',
                  border: `1px solid ${agent.active ? `${agent.color}55` : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                {agent.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 2,
                    color: agent.active ? 'var(--text)' : 'var(--text-dim)',
                  }}
                >
                  {agent.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-faint)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {agent.model}
                </div>
              </div>

              {/* Status */}
              {agent.active ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Circle
                    size={6}
                    fill={agent.color}
                    color={agent.color}
                    style={{ animation: 'pulse 2s infinite' }}
                  />
                  <span style={{ fontSize: 10, color: agent.color, fontWeight: 600 }}>
                    ATIVO
                  </span>
                </div>
              ) : (
                <span className="badge badge-dim">Idle</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;
