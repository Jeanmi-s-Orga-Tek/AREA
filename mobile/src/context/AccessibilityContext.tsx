import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AccessibilityMode, getColorsForMode, colors as defaultColors} from '../theme/colors';

interface AccessibilityContextType {
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => Promise<void>;
  colors: typeof defaultColors;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const ACCESSIBILITY_MODE_KEY = '@accessibility_mode';

export const AccessibilityProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [mode, setModeState] = useState<AccessibilityMode>('default');
  const [colors, setColors] = useState(defaultColors);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(ACCESSIBILITY_MODE_KEY);
      if (savedMode && ['default', 'high-contrast', 'deuteranopia', 'protanopia', 'tritanopia'].includes(savedMode)) {
        const typedMode = savedMode as AccessibilityMode;
        setModeState(typedMode);
        setColors(getColorsForMode(typedMode));
      }
    } catch (error) {
      console.error('Failed to load accessibility mode:', error);
    }
  };

  const setMode = async (newMode: AccessibilityMode) => {
    try {
      await AsyncStorage.setItem(ACCESSIBILITY_MODE_KEY, newMode);
      setModeState(newMode);
      setColors(getColorsForMode(newMode));
    } catch (error) {
      console.error('Failed to save accessibility mode:', error);
    }
  };

  return (
    <AccessibilityContext.Provider value={{mode, setMode, colors}}>
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
