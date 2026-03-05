import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

// ── ICONS ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  chevronRight: "M9 18l6-6-6-6",
  terminal: "M4 17l6-6-6-6M12 19h8",
  cpu: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  folder: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  play: "M5 3l14 9-14 9V3z",
  loader: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  bug: "M8 2l1.5 1.5M15.5 3.5L17 2M9 9H5a2 2 0 00-2 2v1M19 9h-4M3 13h4M17 13h4M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M12 3a4 4 0 00-4 4v2h8V7a4 4 0 00-4-4z",
  rocket: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  plus: "M12 5v14M5 12h14",
  sparkles: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17zM19 2l.75 2.25L22 5l-2.25.75L19 8l-.75-2.25L16 5l2.25-.75L19 2z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
};

// Status mapeamento entre DB e UI
const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  DELIVERED: { label: "Entregue",     badge: "badge-green",  dot: "#3DFFA0" },
  BUILDING:  { label: "A Construir",  badge: "badge-blue",   dot: "#5BB8FF" },
  QA:        { label: "Em Testes",    badge: "badge-amber",  dot: "#FFB547" },
  FAILED:    { label: "Com Erros",    badge: "badge-red",    dot: "#FF6B6B" },
  INTAKE:    { label: "Intake",       badge: "badge-purple", dot: "#7C6AFA" },
  PLANNING:  { label: "A Planear",    badge: "badge-blue",   dot: "#5BB8FF" },
  FIXING:    { label: "A Corrigir",   badge: "badge-amber",  dot: "#FFB547" },
  DEPLOYING: { label: "A Fazer Deploy",badge:"badge-green",  dot: "#3DFFA0" },
  PAUSED:    { label: "Pausado",      badge: "badge-dim",    dot: "#888" },
};

// ── TITLE BAR ──────────────────────────────────────────────────────────────
function TitleBar({ screen }: { screen: string }) {
  return (
    <div className="titlebar">
      <div className="titlebar-dot" style={{ background: "#FF5F57" }} />
      <div className="titlebar-dot" style={{ background: "#FEBC2E" }} />
      <div className="titlebar-dot" style={{ background: "#28C840" }} />
      <div className="titlebar-logo">DevForge</div>
      <div className="titlebar-version">v2.0.0 · {screen}</div>
    </div>
  );
}

// ── DASHBOARD VIEW ─────────────────────────────────────────────────────────
function DashboardView({ onSelectProject, onNew }: { onSelectProject: (project: any) => void; onNew: () => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, metricsData] = await Promise.all([
        api.getProjects(),
        api.getMetrics(),
      ]);
      setProjects(projectsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-faint)" }}>
        <div className="spin"><Icon d={icons.loader} size={24} /></div>
      </div>
    );
  }

  const delivered = projects.filter(p => p.status === "DELIVERED").length;
  const avgTime = metrics?.avgDuration || "—";
  const avgQA = Math.round(projects.filter(p => p.qaScore).reduce((sum, p) => sum + (p.qaScore || 0), 0) / (projects.filter(p => p.qaScore).length || 1));

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
      <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Os teus Projectos
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
            {projects.length} projecto{projects.length !== 1 ? "s" : ""} · {delivered} entregue{delivered !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          <Icon d={icons.plus} size={15} /> Novo Projecto
        </button>
      </div>

      {/* Stats */}
      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total",          value: String(projects.length), sub: "todos os projectos",  color: "var(--text)" },
          { label: "Entregues",      value: String(delivered),        sub: `taxa ${Math.round((delivered / projects.length) * 100) || 0}%`, color: "var(--green)" },
          { label: "Tempo médio",    value: avgTime,                  sub: "do prompt ao deploy", color: "var(--accent)" },
          { label: "QA Score médio", value: String(avgQA || "—"),     sub: "pontos / 100",        color: "var(--amber)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Project list */}
      <div className="fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {projects.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 20 }}>
              Ainda não tens projectos. Cria o teu primeiro!
            </div>
            <button className="btn btn-primary" onClick={onNew}>
              <Icon d={icons.plus} size={15} /> Criar Primeiro Projecto
            </button>
          </div>
        ) : (
          projects.map((p, i) => {
            const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.BUILDING;
            const timeAgo = new Date(p.createdAt).toLocaleDateString("pt-PT");
            const progress = p.status === "BUILDING" || p.status === "QA" ? 50 : p.status === "DELIVERED" ? 100 : 0;

            return (
              <div
                key={p.id}
                className="card"
                style={{ padding: "14px 16px", cursor: "pointer", animationDelay: `${i * 0.05}s` }}
                onClick={() => onSelectProject(p)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: sc.dot,
                      flexShrink: 0,
                      boxShadow: (p.status === "BUILDING" || p.status === "QA") ? `0 0 8px ${sc.dot}` : "none",
                      animation: p.status === "BUILDING" ? "pulse 2s infinite" : "none",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                      <span className={`badge ${sc.badge}`}>{sc.label}</span>
                    </div>
                    {progress > 0 && progress < 100 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, maxWidth: 200 }}>
                          <div className="progress-fill" style={{ width: `${progress}%`, background: sc.dot }} />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{progress}%</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                        {p.deployUrl || p.description?.substring(0, 60) + "..."} · {timeAgo}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {p.qaScore && (
                      <div style={{ fontSize: 11, color: p.qaScore >= 90 ? "var(--green)" : p.qaScore >= 70 ? "var(--amber)" : "var(--red)" }}>
                        QA {Math.round(p.qaScore)}
                      </div>
                    )}
                    <Icon d={icons.chevronRight} size={14} stroke="var(--text-faint)" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── PROJECT VIEW ───────────────────────────────────────────────────────────
function ProjectView({ project, onBack }: { project: any; onBack: () => void }) {
  const [phases, setPhases] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjectDetails();
  }, [project.id]);

  const loadProjectDetails = async () => {
    try {
      // Carregar detalhes do projecto e fases
      const projectData = await api.getProject(project.id);
      setPhases(projectData.phases || []);
    } catch (error) {
      console.error("Failed to load project details:", error);
    }
  };

  const isLive = project.status === "BUILDING" || project.status === "QA" || project.status === "FIXING";

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Área principal */}
      <div style={{ flex: 1, padding: 20, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: "6px 8px" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>{project.name}</h2>
              <span className={`badge ${STATUS_CONFIG[project.status]?.badge || "badge-dim"}`}>
                {STATUS_CONFIG[project.status]?.label || project.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
              {new Date(project.createdAt).toLocaleString("pt-PT")}
            </div>
          </div>
          {project.deployUrl && (
            <a href={project.deployUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <Icon d={icons.globe} size={13} /> Abrir →
            </a>
          )}
        </div>

        {/* Pipeline */}
        <div className="card fade-up-2">
          <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: 14 }}>
            Pipeline
          </div>

          {phases.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {phases.map((ph, i) => {
                const phaseStatus = ph.status === "DONE" ? "done" : ph.status === "RUNNING" ? "running" : "pending";
                const phaseColor = { done: "var(--green)", running: "var(--accent)", pending: "rgba(255,255,255,0.15)" }[phaseStatus];
                const phaseBg = { done: "rgba(61,255,160,0.10)", running: "var(--accent-glow)", pending: "rgba(255,255,255,0.03)" }[phaseStatus];

                return (
                  <div key={ph.id} style={{ display: "flex", alignItems: "center", flex: i < phases.length - 1 ? 1 : "none" }}>
                    <div
                      className="phase-node"
                      style={{ background: phaseBg, border: `1px solid ${phaseColor}40` }}
                      onClick={() => setSelectedPhase(ph.id)}
                    >
                      <div style={{ fontSize: 10, color: phaseColor, fontWeight: 600 }}>{ph.type}</div>
                    </div>
                    {i < phases.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${phaseColor}60, transparent)`, margin: "0 2px" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status narrativo */}
        <div className="card fade-up-3" style={{ background: "var(--accent-glow)", borderColor: "rgba(124,106,250,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                animation: isLive ? "pulse 2s infinite" : "none",
              }}
            />
            <div style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>
              {project.status === "DELIVERED" && "✅ Projecto entregue com sucesso"}
              {project.status === "BUILDING" && "⚡ A gerar código..."}
              {project.status === "QA" && "🔍 A executar testes QA..."}
              {project.status === "FAILED" && "❌ Falhou — revisão manual necessária"}
              {!["DELIVERED", "BUILDING", "QA", "FAILED"].includes(project.status) && `Status: ${project.status}`}
            </div>
          </div>
        </div>
      </div>

      {/* Painel de logs */}
      <div style={{ width: 260, borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Logs
        </div>
        <div ref={logRef} style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {logs.length === 0 && (
            <div style={{ padding: "24px 14px", fontSize: 11, color: "var(--text-faint)", textAlign: "center" }}>
              Sem logs disponíveis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NEW PROJECT MODAL ──────────────────────────────────────────────────────
function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!prompt.trim()) return;

    setCreating(true);
    try {
      await api.createProject({
        name: prompt.substring(0, 50),
        description: prompt,
      });
      onCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Erro ao criar projecto. Tenta novamente.");
    } finally {
      setCreating(false);
    }
  };

  const examples = [
    "Landing page para o meu restaurante com menu e reservas",
    "App de gestão de tarefas para a minha equipa",
    "Dashboard de analytics com gráficos",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div className="card fade-up" style={{ width: 520, borderColor: "rgba(124,106,250,0.3)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>Novo Projecto</h3>
            <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
              Descreve a tua ideia — sem tecnicismos, em português
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <Icon d={icons.x} size={14} />
          </button>
        </div>

        <textarea
          className="input"
          placeholder="Ex: Quero uma app para gerir as reservas do meu restaurante..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{ minHeight: 100, resize: "none", lineHeight: 1.6 }}
        />

        <div style={{ marginTop: 14, marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8 }}>Exemplos:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "7px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 11,
                  color: "var(--text-dim)",
                  transition: "all 0.15s",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={creating}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!prompt.trim() || creating} onClick={handleCreate}>
            {creating ? (
              <>
                <div className="spin"><Icon d={icons.loader} size={14} /></div>
                A criar...
              </>
            ) : (
              <>
                <Icon d={icons.sparkles} size={14} /> Criar Projecto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function DevForgeNew() {
  const [tab, setTab] = useState<"dashboard" | "project" | "settings">("dashboard");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const { user } = useStore();

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
    setTab("project");
  };

  const handleProjectCreated = () => {
    setTab("dashboard");
    // Recarregar dashboard
    window.location.reload();
  };

  return (
    <div className="screen">
      <TitleBar screen={tab === "project" ? selectedProject?.name : "Dashboard"} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div className="sidebar">
          {[
            { id: "dashboard" as const, icon: icons.layers },
            { id: "project" as const, icon: icons.terminal, disabled: !selectedProject },
            { id: "settings" as const, icon: icons.settings },
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-btn ${tab === item.id ? "active" : ""}`}
              onClick={() => !item.disabled && setTab(item.id)}
              style={{ opacity: item.disabled ? 0.3 : 1, cursor: item.disabled ? "not-allowed" : "pointer" }}
            >
              <Icon d={item.icon} size={18} />
            </button>
          ))}
          <div className="sidebar-spacer" />
          <button className="sidebar-btn" style={{ background: "rgba(124,106,250,0.15)", color: "var(--accent)" }}>
            <Icon d={icons.user} size={16} />
          </button>
        </div>

        {/* Main content */}
        <div className="main-content">
          {tab === "dashboard" && (
            <DashboardView
              onSelectProject={handleSelectProject}
              onNew={() => setShowNewModal(true)}
            />
          )}
          {tab === "project" && selectedProject && (
            <ProjectView project={selectedProject} onBack={() => setTab("dashboard")} />
          )}
          {tab === "settings" && (
            <div style={{ padding: 24 }}>
              <h2>Configurações</h2>
              <p style={{ color: "var(--text-dim)" }}>Em desenvolvimento...</p>
            </div>
          )}
        </div>
      </div>

      {showNewModal && <NewProjectModal onClose={() => setShowNewModal(false)} onCreated={handleProjectCreated} />}
    </div>
  );
}
