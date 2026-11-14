import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemePreference } from '../types';
import {
  publishEcosystemBroadcast,
  subscribeEcosystemBroadcast,
  updateEcosystemState,
} from '../lib/ecosystem';

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
  language: string;
  setLanguage: (lang: string) => void;
  compactDensity: boolean;
  setCompactDensity: (compact: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'astra_vesper_theme';
const LANG_STORAGE_KEY = 'astra_vesper_language';
const DENSITY_STORAGE_KEY = 'astra_vesper_density';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [language, setLanguageState] = useState<string>(
    () => localStorage.getItem(LANG_STORAGE_KEY) || 'English'
  );

  const [compactDensity, setCompactDensityState] = useState<boolean>(
    () => localStorage.getItem(DENSITY_STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    return subscribeEcosystemBroadcast((msg) => {
      if (msg.type === 'THEME_SYNC') {
        setThemeState(msg.theme);
        localStorage.setItem(THEME_STORAGE_KEY, msg.theme);
      } else if (msg.type === 'LANGUAGE_SYNC') {
        setLanguageState(msg.language);
        localStorage.setItem(LANG_STORAGE_KEY, msg.language);
      } else if (msg.type === 'DENSITY_SYNC') {
        setCompactDensityState(msg.compactDensity);
        localStorage.setItem(DENSITY_STORAGE_KEY, String(msg.compactDensity));
      }
    });
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    updateEcosystemState({ theme: next });
    publishEcosystemBroadcast({ type: 'THEME_SYNC', theme: next });
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    updateEcosystemState({ language: lang });
    publishEcosystemBroadcast({ type: 'LANGUAGE_SYNC', language: lang });
  };

  const setCompactDensity = (compact: boolean) => {
    setCompactDensityState(compact);
    localStorage.setItem(DENSITY_STORAGE_KEY, String(compact));
    updateEcosystemState({ compactDensity: compact });
    publishEcosystemBroadcast({ type: 'DENSITY_SYNC', compactDensity: compact });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        language,
        setLanguage,
        compactDensity,
        setCompactDensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
