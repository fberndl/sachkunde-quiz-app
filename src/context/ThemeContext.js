import React, { createContext, useContext, useState, useCallback } from 'react';
import { THEMES, getThemeById } from '../data/themes';
import { getActiveTheme, setActiveTheme as persistTheme } from '../services/profileService';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => getActiveTheme());
  const theme = getThemeById(themeId);

  const switchTheme = useCallback((id) => {
    setThemeId(id);
    persistTheme(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeId, switchTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
