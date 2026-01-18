import React, { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import AccessibilitySelector from './AccessibilitySelector';
import './AccessibilityPanel.css';

const AccessibilityPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accessibility-panel">
      <button
        className="accessibility-panel-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close accessibility panel' : 'Open accessibility panel'}
        title="Accessibility & Language"
      >
        {isOpen ? '✕' : '⚙️'}
      </button>
      
      {isOpen && (
        <div className="accessibility-panel-content">
          <LanguageSelector />
          <AccessibilitySelector />
        </div>
      )}
    </div>
  );
};

export default AccessibilityPanel;
