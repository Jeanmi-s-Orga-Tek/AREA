import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccessibilityMode = 'default' | 'high-contrast' | 'deuteranopia' | 'protanopia' | 'tritanopia';

interface AccessibilityContextType {
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AccessibilityMode>('default');

  useEffect(() => {
    const savedMode = localStorage.getItem('accessibility-mode') as AccessibilityMode;
    if (savedMode && ['default', 'high-contrast', 'deuteranopia', 'protanopia', 'tritanopia'].includes(savedMode)) {
      setModeState(savedMode);
      document.documentElement.setAttribute('data-accessibility-mode', savedMode);
    }
  }, []);

  const setMode = (newMode: AccessibilityMode) => {
    setModeState(newMode);
    localStorage.setItem('accessibility-mode', newMode);
    document.documentElement.setAttribute('data-accessibility-mode', newMode);
  };

  return (
    <AccessibilityContext.Provider value={{ mode, setMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
