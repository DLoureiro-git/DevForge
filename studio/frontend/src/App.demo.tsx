/**
 * DevForge V2 - FASE 5 Demo
 *
 * Este ficheiro demonstra a integração completa do design system.
 * Para usar, renomear para App.tsx ou importar em main.tsx
 */

// @ts-nocheck
import React from 'react';
import DesignSystemDemo from './pages/DesignSystemDemo';
import './styles/design-system.css';

function App() {
  return <DesignSystemDemo />;
}

export default App;

/**
 * EXEMPLO DE USO INDIVIDUAL DOS COMPONENTES:
 *
 * import { MainLayout, TitleBar, Sidebar } from './components/layout';
 * import { SprintBoard, SprintHeader, FeatureCard } from './components/sprint';
 * import { PipelineTimeline, PhaseNode, LiveLogs } from './components/pipeline';
 * import { TeamPanel, ActivityFeed } from './components/team';
 * import { PMIntakeChat } from './components/chat';
 *
 * // Sprint Board standalone
 * <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
 *   <SprintHeader
 *     sprintNumber={3}
 *     goal="Sistema completo"
 *     daysLeft={3}
 *     totalDays={7}
 *     velocity={{ avg: 28, history: [22, 31, 28] }}
 *   />
 *   <SprintBoard features={featuresArray} />
 * </div>
 *
 * // Pipeline standalone
 * <div>
 *   <PipelineTimeline phases={phasesArray} />
 *   <LiveLogs logs={logsArray} isRunning={true} />
 * </div>
 *
 * // Team standalone
 * <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
 *   <TeamPanel humans={humansArray} agents={agentsArray} />
 *   <ActivityFeed activities={activitiesArray} />
 * </div>
 *
 * // PM Chat (modal overlay)
 * {showChat && (
 *   <PMIntakeChat
 *     onClose={() => setShowChat(false)}
 *     onSubmit={(answers) => console.log(answers)}
 *     questions={questionsArray}
 *   />
 * )}
 */
