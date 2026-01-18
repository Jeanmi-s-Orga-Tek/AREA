export const colors = {
  background: '#0a0e1a',
  backgroundAlt: '#0d1426',
  surface: 'rgba(17, 24, 39, 0.9)',
  surfaceMuted: 'rgba(31, 41, 55, 0.7)',
  card: 'rgba(17, 24, 39, 0.92)',
  primary: '#60a5fa',
  primaryStrong: '#3b82f6',
  accent: '#8b5cf6',
  secondary: '#a78bfa',
  text: '#e5e7eb',
  textSecondary: '#9ca3af',
  border: 'rgba(55, 65, 81, 0.6)',
  borderMuted: 'rgba(55, 65, 81, 0.4)',
  success: '#10b981',
  successStrong: '#34d399',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  shadow: 'rgba(0, 0, 0, 0.45)',
  glow: 'rgba(96, 165, 250, 0.25)',
};

export const highContrastColors = {
  background: '#000000',
  backgroundAlt: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceMuted: '#2a2a2a',
  card: '#1a1a1a',
  primary: '#00d4ff',
  primaryStrong: '#00b8e6',
  accent: '#ff00ff',
  secondary: '#d400ff',
  text: '#ffffff',
  textSecondary: '#e0e0e0',
  border: '#ffffff',
  borderMuted: '#888888',
  success: '#00ff00',
  successStrong: '#00e600',
  error: '#ff0000',
  warning: '#ffff00',
  info: '#00d4ff',
  shadow: 'rgba(0, 0, 0, 0.8)',
  glow: 'rgba(0, 212, 255, 0.4)',
};

export const deuteranopiaColors = {
  background: '#0a0e1a',
  backgroundAlt: '#0d1426',
  surface: 'rgba(17, 24, 39, 0.9)',
  surfaceMuted: 'rgba(31, 41, 55, 0.7)',
  card: 'rgba(17, 24, 39, 0.92)',
  primary: '#3b9eff',
  primaryStrong: '#1e7fe6',
  accent: '#ffa800',
  secondary: '#ffcc66',
  text: '#e5e7eb',
  textSecondary: '#9ca3af',
  border: 'rgba(55, 65, 81, 0.6)',
  borderMuted: 'rgba(55, 65, 81, 0.4)',
  success: '#3b9eff',
  successStrong: '#5db3ff',
  error: '#cc7a00',
  warning: '#ffa800',
  info: '#3b9eff',
  shadow: 'rgba(0, 0, 0, 0.45)',
  glow: 'rgba(59, 158, 255, 0.25)',
};

export const protanopiaColors = {
  background: '#0a0e1a',
  backgroundAlt: '#0d1426',
  surface: 'rgba(17, 24, 39, 0.9)',
  surfaceMuted: 'rgba(31, 41, 55, 0.7)',
  card: 'rgba(17, 24, 39, 0.92)',
  primary: '#4db8ff',
  primaryStrong: '#2da3e6',
  accent: '#b8860b',
  secondary: '#daa520',
  text: '#e5e7eb',
  textSecondary: '#9ca3af',
  border: 'rgba(55, 65, 81, 0.6)',
  borderMuted: 'rgba(55, 65, 81, 0.4)',
  success: '#4db8ff',
  successStrong: '#6dc6ff',
  error: '#997300',
  warning: '#b8860b',
  info: '#4db8ff',
  shadow: 'rgba(0, 0, 0, 0.45)',
  glow: 'rgba(77, 184, 255, 0.25)',
};

export const tritanopiaColors = {
  background: '#0a0e1a',
  backgroundAlt: '#0d1426',
  surface: 'rgba(17, 24, 39, 0.9)',
  surfaceMuted: 'rgba(31, 41, 55, 0.7)',
  card: 'rgba(17, 24, 39, 0.92)',
  primary: '#ff5c7a',
  primaryStrong: '#e6344f',
  accent: '#00d4aa',
  secondary: '#00ffcc',
  text: '#e5e7eb',
  textSecondary: '#9ca3af',
  border: 'rgba(55, 65, 81, 0.6)',
  borderMuted: 'rgba(55, 65, 81, 0.4)',
  success: '#00d4aa',
  successStrong: '#00ffcc',
  error: '#ff5c7a',
  warning: '#ff88a0',
  info: '#00d4aa',
  shadow: 'rgba(0, 0, 0, 0.45)',
  glow: 'rgba(255, 92, 122, 0.25)',
};

export type AccessibilityMode = 'default' | 'high-contrast' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export const getColorsForMode = (mode: AccessibilityMode) => {
  switch (mode) {
    case 'high-contrast':
      return highContrastColors;
    case 'deuteranopia':
      return deuteranopiaColors;
    case 'protanopia':
      return protanopiaColors;
    case 'tritanopia':
      return tritanopiaColors;
    default:
      return colors;
  }
};

