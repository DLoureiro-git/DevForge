import React from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import '../../styles/design-system.css';

interface MainLayoutProps {
  activeView: 'projects' | 'sprint' | 'team' | 'settings';
  onViewChange: (view: 'projects' | 'sprint' | 'team' | 'settings') => void;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  activeView,
  onViewChange,
  children,
}) => {
  return (
    <div className="screen">
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activeView={activeView} onViewChange={onViewChange} />
        <div className="main-content">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
