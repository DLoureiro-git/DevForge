import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ProjectViewNew from './ProjectViewNew';
import '../styles/design-system.css';

const DesignSystemDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<'projects' | 'sprint' | 'team' | 'settings'>(
    'sprint'
  );

  return (
    <MainLayout activeView={activeView} onViewChange={setActiveView}>
      {activeView === 'projects' && (
        <div style={{ padding: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-dim)' }}>Lista de projectos vai aqui</p>
        </div>
      )}

      {activeView === 'sprint' && <ProjectViewNew />}

      {activeView === 'team' && (
        <div style={{ padding: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Team</h1>
          <p style={{ color: 'var(--text-dim)' }}>Vista de equipa</p>
        </div>
      )}

      {activeView === 'settings' && (
        <div style={{ padding: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Settings</h1>
          <p style={{ color: 'var(--text-dim)' }}>Configurações</p>
        </div>
      )}
    </MainLayout>
  );
};

export default DesignSystemDemo;
