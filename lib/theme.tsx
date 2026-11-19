'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
})

/**
 * Resuelve el tema inicial en el cliente.
 * Regla de negocio: 'dark' es el tema predeterminado del sistema a menos que
 * el usuario haya seleccionado explícitamente 'light'.
 */
export function getInitialTheme(defaultFallback: Theme = 'dark'): Theme {
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('dark')) return 'dark'
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'dark' || attr === 'light') return attr
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('barberos-theme')
      if (saved === 'dark' || saved === 'light') return saved
      const cookieMatch = document.cookie.match(/(?:^|;\s*)barberos-theme=([^;]*)/)
      if (cookieMatch && (cookieMatch[1] === 'dark' || cookieMatch[1] === 'light')) {
        return cookieMatch[1] as Theme
      }
    } catch {
      /* noop */
    }
  }
  return defaultFallback
}

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: Theme
}

export function ThemeProvider({ children, initialTheme = 'dark' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return initialTheme
    return getInitialTheme(initialTheme)
  })

  const applyTheme = useCallback((t: Theme, withTransitionGuard = false) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    if (withTransitionGuard) {
      root.classList.add('theme-switching')
    }

    if (t === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    root.setAttribute('data-theme', t)
    root.style.colorScheme = t

    if (withTransitionGuard) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('theme-switching')
        })
      })
    }
  }, [])

  const persistTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem('barberos-theme', t)
    } catch {
      /* noop */
    }
    try {
      document.cookie = `barberos-theme=${t}; path=/; max-age=31536000; SameSite=Lax`
    } catch {
      /* noop */
    }
  }, [])

  useEffect(() => {
    const current = getInitialTheme(initialTheme)
    applyTheme(current, false)
    setThemeState(current)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'barberos-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        applyTheme(e.newValue, true)
        setThemeState(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [applyTheme, initialTheme])

  const setTheme = useCallback(
    (t: Theme) => {
      applyTheme(t, true)
      setThemeState(t)
      persistTheme(t)
    },
    [applyTheme, persistTheme]
  )

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      applyTheme(next, true)
      persistTheme(next)
      return next
    })
  }, [applyTheme, persistTheme])

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
 * Script bloqueante inyectado en <head> ANTES de que el navegador pinte el primer frame.
 * Resuelve el tema activo (dark/light) sin parpadeos ni flashes de color blanco.
 * Para nuevos visitantes o usuarios sin selección previa, aplica inmediatamente 'dark'.
 */
export const themeInitScript = `
(function() {
  try {
    var root = document.documentElement;
    var saved = null;
    try {
      saved = localStorage.getItem('barberos-theme');
    } catch(e) {}
    if (!saved) {
      try {
        var m = document.cookie.match(/(?:^|;\\s*)barberos-theme=([^;]*)/);
        if (m) saved = m[1];
      } catch(e) {}
    }
    var theme = (saved === 'light') ? 'light' : 'dark';
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  } catch(e) {}
})();
`
