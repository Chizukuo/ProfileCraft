import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import themesManifest from '../config/themes.json';

export type Theme = keyof typeof themesManifest;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    const themeInfo = themesManifest[theme];
    const themePath = themeInfo?.path; // Get the path from the manifest

    let themeLink = document.getElementById('theme-link') as HTMLLinkElement | null;

    if (themePath && themePath.trim() !== '') { // If there's a valid, non-empty theme path
      if (!themeLink) {
        themeLink = document.createElement('link');
        themeLink.rel = 'stylesheet';
        themeLink.id = 'theme-link';
        document.head.appendChild(themeLink);
      }
      themeLink.href = themePath; // Set the href to the theme's CSS file
    } else { // If themePath is empty, null, or undefined (e.g., for the default theme)
      if (themeLink) {
        // Remove the href attribute to effectively unload/disable the stylesheet
        themeLink.removeAttribute('href');
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
