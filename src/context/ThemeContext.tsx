import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useProfile } from './ProfileContext';
import type { ResolvedTheme, ThemeOption } from '../types/theme';
import { getThemeCssPath, getThemeOptions, isKnownTheme, resolveTheme, type ThemeKey } from '../utils/themeUtils';

const THEME_STORAGE_KEY = 'profilecraft-theme';

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: string) => void;
  resolvedTheme: ResolvedTheme;
  themeOptions: ThemeOption[];
  themeAppliedVersion: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getStoredTheme = (): ThemeKey => {
  if (typeof window === 'undefined') {
    return 'default';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored && isKnownTheme(stored) ? stored : 'default';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { profileData, updateProfileData } = useProfile();
  const [theme, setThemeState] = useState<ThemeKey>(getStoredTheme);
  const [themeAppliedVersion, setThemeAppliedVersion] = useState(0);

  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);
  const themeOptions = useMemo(() => getThemeOptions(), []);

  const setTheme = useCallback((nextTheme: string) => {
    const resolvedKey = resolveTheme(nextTheme).key as ThemeKey;
    setThemeState(resolvedKey);

    updateProfileData((prev) => {
      if (prev.userSettings.theme === resolvedKey) {
        return prev;
      }

      return {
        ...prev,
        userSettings: {
          ...prev.userSettings,
          theme: resolvedKey
        }
      };
    });
  }, [updateProfileData]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme.key);
  }, [resolvedTheme.key]);

  useEffect(() => {
    const profileTheme = profileData?.userSettings.theme;
    if (profileTheme && isKnownTheme(profileTheme) && profileTheme !== theme) {
      setThemeState(profileTheme);
    }
  }, [profileData?.userSettings.theme, theme]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const themePath = getThemeCssPath(resolvedTheme.key);
    let frameId = 0;

    html.dataset.theme = resolvedTheme.key;
    html.dataset.themeScheme = resolvedTheme.colorScheme;
    body.dataset.theme = resolvedTheme.key;
    body.dataset.themeScheme = resolvedTheme.colorScheme;
    html.style.colorScheme = resolvedTheme.colorScheme;

    let themeLink = document.getElementById('theme-link') as HTMLLinkElement | null;

    if (themePath) {
      if (!themeLink) {
        themeLink = document.createElement('link');
        themeLink.rel = 'stylesheet';
        themeLink.id = 'theme-link';
        document.head.appendChild(themeLink);
      }

      const markThemeApplied = () => {
        frameId = window.requestAnimationFrame(() => {
          setThemeAppliedVersion((prev) => prev + 1);
        });
      };

      themeLink.onload = markThemeApplied;
      themeLink.onerror = markThemeApplied;
      themeLink.href = themePath;
    } else if (themeLink) {
      themeLink.onload = null;
      themeLink.onerror = null;
      themeLink.removeAttribute('href');
      frameId = window.requestAnimationFrame(() => {
        setThemeAppliedVersion((prev) => prev + 1);
      });
    } else {
      frameId = window.requestAnimationFrame(() => {
        setThemeAppliedVersion((prev) => prev + 1);
      });
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      if (themeLink) {
        themeLink.onload = null;
        themeLink.onerror = null;
      }
    };
  }, [resolvedTheme.key, resolvedTheme.colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, themeOptions, themeAppliedVersion }}>
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
