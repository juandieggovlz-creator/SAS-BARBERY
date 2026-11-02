'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Read saved preference
    const saved = localStorage.getItem('barberos-theme') as Theme | null
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved)
      setThemeState(saved)
    } else {
      // Detect OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial: Theme = prefersDark ? 'dark' : 'light'
      applyTheme(initial)
      setThemeState(initial)
    }
  }, [])

  const applyTheme = (t: Theme) => {
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    root.setAttribute('data-theme', t)
  }

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setThemeState(t)
    localStorage.setItem('barberos-theme', t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      localStorage.setItem('barberos-theme', next)
      return next
    })
  }, [])

  // Prevent hydration mismatch — render children only after mount
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

/**
 * Inline script to inject BEFORE React hydrates — prevents flash of wrong theme.
 * Paste this as a <script> in <head> or as a dangerouslySetInnerHTML script.
 */
export const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('barberos-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`
