import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import '../../styles/design-system.css';

interface Message {
  id: string;
  role: 'agent' | 'user';
  text: string;
  opts?: string[] | null;
}

interface Question {
  id: string;
  text: string;
  type: 'open' | 'choice';
  opts?: string[];
  ph?: string;
}

interface PMIntakeChatProps {
  onClose: () => void;
  onSubmit: (answers: Record<string, string>) => void;
  questions: Question[];
}

const PMIntakeChat: React.FC<PMIntakeChatProps> = ({ onClose, onSubmit, questions }) => {
  const [qIdx, setQIdx] = useState(0);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inp, setInp] = useState('');
  const [typing, setTyping] = useState(false);
  const [waitInput, setWaitInput] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addAgent = (text: string, opts: string[] | null = null) =>
    setMsgs((m) => [...m, { role: 'agent', text, opts, id: Date.now() + Math.random() + '' }]);

  useEffect(() => {
    if (msgs.length > 0) return;
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addAgent(questions[0].text, questions[0].opts || null);
      setWaitInput(true);
    }, 700);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const answer = (ans: string) => {
    if (!ans.trim()) return;
    setMsgs((m) => [...m, { role: 'user', text: ans, id: Date.now() + '' }]);
    setAnswers((a) => ({ ...a, [questions[qIdx].id]: ans }));
    setInp('');
    setWaitInput(false);
    const next = qIdx + 1;
    if (next >= questions.length) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addAgent('Perfeito! Aqui está o resumo:');
        setTimeout(() => {
          addAgent(
            `📋 Feature identificada\n✅ Prioridade: Alta\n✅ Estimativa: 5 story points\n✅ Sprint sugerido: Sprint 4\n✅ Branch: feat/nova-feature\n\nPosso adicionar ao backlog?`
          );
          setConfirmed(true);
          setWaitInput(true);
        }, 1100);
      }, 800);
      setQIdx(99);
    } else {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addAgent(questions[next].text, questions[next].opts || null);
        setWaitInput(true);
        setQIdx(next);
      }, 800);
    }
  };

  const curQ = qIdx < questions.length ? questions[qIdx] : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
        }}
        onClick={onClose}
      />
      <div
        className="slide-right"
        style={{
          width: 420,
          position: 'relative',
          zIndex: 1,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            background: 'var(--raised)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accent-glow)',
              border: '1px solid rgba(124,106,250,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="var(--accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              PM Agent — Novo Pedido
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-faint)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--green)',
                  animation: 'pulse 1s infinite',
                }}
              />
              Scrum Master ativo
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === qIdx ? 16 : 6,
                  height: 3,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                  background:
                    i < qIdx
                      ? 'var(--accent)'
                      : i === qIdx
                      ? 'rgba(124,106,250,0.5)'
                      : 'rgba(255,255,255,0.07)',
                }}
              />
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 5 }}>
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {msgs.map((msg) => (
            <div
              key={msg.id}
              className="msg-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 6,
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius:
                    msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--raised)',
                  border: `1px solid ${msg.role === 'user' ? 'transparent' : 'var(--border)'}`,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {msg.text}
              </div>
              {msg.opts && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  {msg.opts.map((opt, i) => (
                    <button
                      key={i}
                      className="btn btn-secondary btn-sm"
                      onClick={() => answer(opt)}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="fade-in" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px 12px 12px 4px',
                  background: 'var(--raised)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--text-faint)',
                        animation: 'pulse 1.5s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {waitInput && curQ && curQ.type === 'open' && (
          <div
            style={{
              padding: 12,
              borderTop: '1px solid var(--border)',
              background: 'var(--raised)',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                type="text"
                placeholder={curQ.ph || 'Escreve aqui...'}
                value={inp}
                onChange={(e) => setInp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && answer(inp)}
                autoFocus
              />
              <button
                className="btn btn-primary"
                onClick={() => answer(inp)}
                disabled={!inp.trim()}
                style={{ opacity: inp.trim() ? 1 : 0.5 }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Confirm Buttons */}
        {confirmed && (
          <div
            className="fade-up"
            style={{
              padding: 12,
              borderTop: '1px solid var(--border)',
              background: 'var(--raised)',
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => onSubmit(answers)}
            >
              Sim, adicionar
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PMIntakeChat;
