import React from 'react';
import '../../styles/design-system.css';

interface TitleBarProps {
  version?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ version = 'v2.0' }) => {
  return (
    <div className="titlebar">
      <div
        className="titlebar-dot"
        style={{ background: '#FF6058' }}
      />
      <div
        className="titlebar-dot"
        style={{ background: '#FFBD2E' }}
      />
      <div
        className="titlebar-dot"
        style={{ background: '#27C93F' }}
      />
      <div className="titlebar-logo">DEVFORGE</div>
      <div className="titlebar-version">{version}</div>
    </div>
  );
};

export default TitleBar;
