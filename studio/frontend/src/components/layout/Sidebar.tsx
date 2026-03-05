import React from 'react';
import { Zap, Layers, Users, Settings } from 'lucide-react';
import '../../styles/design-system.css';

interface SidebarProps {
  activeView: 'projects' | 'sprint' | 'team' | 'settings';
  onViewChange: (view: 'projects' | 'sprint' | 'team' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'projects', icon: Layers, label: 'Projects' },
    { id: 'sprint', icon: Zap, label: 'Sprint' },
    { id: 'team', icon: Users, label: 'Team' },
  ];

  return (
    <div className="sidebar">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`sidebar-btn ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id as any)}
            title={item.label}
          >
            <Icon size={20} />
          </button>
        );
      })}

      <div className="sidebar-spacer" />

      <button
        className={`sidebar-btn ${activeView === 'settings' ? 'active' : ''}`}
        onClick={() => onViewChange('settings')}
        title="Settings"
      >
        <Settings size={20} />
      </button>
    </div>
  );
};

export default Sidebar;
