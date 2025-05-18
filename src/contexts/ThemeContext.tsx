
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeColor = 'red' | 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextProps {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_COLOR_KEY = 'app-theme-color';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColorState] = useState<ThemeColor>('red');
  
  // Load saved theme on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_COLOR_KEY) as ThemeColor;
    if (savedTheme) {
      setThemeColorState(savedTheme);
      applyThemeColor(savedTheme);
    }
  }, []);

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem(THEME_COLOR_KEY, color);
    applyThemeColor(color);
  };

  // Helper functions to get color values
  const getColorValue = (color: ThemeColor): string => {
    switch (color) {
      case 'red': return '#ea384c';
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'purple': return '#8b5cf6';
      case 'orange': return '#f97316';
      default: return '#ea384c';
    }
  };

  const getColorHoverValue = (color: ThemeColor): string => {
    switch (color) {
      case 'red': return '#d11d32';
      case 'blue': return '#2563eb';
      case 'green': return '#059669';
      case 'purple': return '#7c3aed';
      case 'orange': return '#ea580c';
      default: return '#d11d32';
    }
  };

  const applyThemeColor = (color: ThemeColor) => {
    document.documentElement.style.setProperty('--theme-color', getColorValue(color));
    document.documentElement.style.setProperty('--theme-color-hover', getColorHoverValue(color));
  };

  // Set initial theme on first render
  useEffect(() => {
    applyThemeColor(themeColor);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
