import React, { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { theme, type Theme } from '../styles/theme';

type ColorMode = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  mode: ColorMode;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ColorMode>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  );
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem('producer-tools-theme', mode); } catch { /* Storage may be unavailable. */ }
  }, [mode]);
  return <ThemeContext.Provider value={{ theme, mode, toggleTheme: () => setMode(current => current === 'light' ? 'dark' : 'light') }}>
    {children}
  </ThemeContext.Provider>;
};
