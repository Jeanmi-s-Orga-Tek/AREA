import React from 'react';
import { useAccessibility, AccessibilityMode } from '../contexts/AccessibilityContext';
import './AccessibilitySelector.css';

const AccessibilitySelector: React.FC = () => {
  const { mode, setMode } = useAccessibility();

  const modes: { value: AccessibilityMode; label: string; icon: string; description: string }[] = [
    { value: 'default', label: 'Default', icon: '🎨', description: 'Standard colors' },
    { value: 'high-contrast', label: 'High Contrast', icon: '⚫', description: 'Enhanced visibility' },
    { value: 'deuteranopia', label: 'Deuter.', icon: '🔵', description: 'Red-green colorblind' },
    { value: 'protanopia', label: 'Protan.', icon: '🟠', description: 'Red colorblind' },
    { value: 'tritanopia', label: 'Tritan.', icon: '🔴', description: 'Blue-yellow colorblind' },
  ];

  return (
    <div className="accessibility-selector">
      <label className="accessibility-label">Accessibility</label>
      <div className="accessibility-grid">
        {modes.map((m) => (
          <button
            key={m.value}
            className={`accessibility-option ${mode === m.value ? 'active' : ''}`}
            onClick={() => setMode(m.value)}
            aria-label={`Switch to ${m.label} mode: ${m.description}`}
            title={m.description}
          >
            <span className="accessibility-icon">{m.icon}</span>
            <span className="accessibility-text">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccessibilitySelector;
