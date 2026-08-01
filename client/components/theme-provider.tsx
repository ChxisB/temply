'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * The palette Clerk needs as concrete values. Clerk renders its own DOM and
 * cannot read our CSS variables, so the two must be kept in step here — these
 * are the same hexes declared in app/globals.css.
 */
const PALETTE: Record<Theme, Record<string, string>> = {
  light: {
    surface: '#f6f7f9',
    raised: '#ffffff',
    ink: '#12141a',
    muted: '#5b6170',
    accent: '#346fe4',
    danger: '#c0304a',
  },
  dark: {
    surface: '#16181d',
    raised: '#1d2026',
    ink: '#f2f3f5',
    muted: '#a2a9b8',
    accent: '#5b8cf0',
    danger: '#ff7a8a',
  },
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggle: () => void;
  /** Feed straight into a Clerk component's `appearance` prop. */
  clerkAppearance: Record<string, unknown>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(next: Theme) {
  document.documentElement.classList.toggle('dark', next === 'dark');
  try {
    localStorage.setItem('theme', next);
  } catch {
    // Private browsing and similar — the class is already applied, which is
    // what matters for this page view.
  }
}

function preferredTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Private browsing — fall through to the OS preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  // Re-assert the class rather than reading it back. The blocking script in
  // app/layout.tsx sets it before paint, but React owns <html> and clears its
  // className during hydration, so by the time this runs the class is gone —
  // and reading it would conclude "light" for someone who chose dark.
  useEffect(() => {
    const next = preferredTheme();
    document.documentElement.classList.toggle('dark', next === 'dark');
    setThemeState(next);
  }, []);

  // Follow the OS while the user has not expressed a preference of their own.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem('theme');
      } catch {
        stored = null;
      }
      if (stored) return;
      const next: Theme = event.matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      setThemeState(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const p = PALETTE[theme];
    return {
      theme,
      setTheme,
      toggle,
      clerkAppearance: {
        variables: {
          colorPrimary: p.accent,
          colorBackground: p.raised,
          colorText: p.ink,
          colorTextSecondary: p.muted,
          colorInputBackground: p.raised,
          colorInputText: p.ink,
          colorDanger: p.danger,
          borderRadius: '6px',
          fontFamily: 'var(--font-plex-sans)',
        },
        elements: {
          card: 'shadow-none border border-line',
          footer: 'hidden',
        },
      },
    };
  }, [theme, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
