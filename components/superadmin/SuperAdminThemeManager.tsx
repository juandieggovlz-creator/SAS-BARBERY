'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { getAccentByHex, buildSuperAdminAccentCSS, DEFAULT_ACCENT } from '@/lib/accent-colors'

export type SuperAdminTheme = 'light' | 'dark'

interface SuperAdminThemeContextValue {
  theme: SuperAdminTheme
  setTheme: (t: SuperAdminTheme) => void
  toggleTheme: () => void
  accentColor: string
  setAccentColor: (hex: string) => void
}

const SuperAdminThemeContext = React.createContext<SuperAdminThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  accentColor: DEFAULT_ACCENT.hex,
  setAccentColor: () => {}
})

export function useSuperAdminTheme() {
  return React.useContext(SuperAdminThemeContext)
}

export function SuperAdminThemeManager({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SuperAdminTheme>('dark')
  const [accentColor, setAccentState] = useState<string>(DEFAULT_ACCENT.hex)

  const applyAccentStyle = useCallback((hex: string) => {
    if (typeof document === 'undefined') return
    const accent = getAccentByHex(hex)
    let el = document.getElementById('superadmin-accent-override') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'superadmin-accent-override'
      document.head.appendChild(el)
    }
    el.textContent = buildSuperAdminAccentCSS(accent)
  }, [])

  const applyThemeClasses = useCallback((t: SuperAdminTheme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    root.setAttribute('data-theme', t)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Snapshot del tema público antes de entrar a SuperAdmin
    const previousPublicTheme = localStorage.getItem('barberos-theme') || 'dark'
    document.documentElement.setAttribute('data-superadmin-active', 'true')

    // 2. Resolver preferencias de SuperAdmin guardadas
    let savedTheme: SuperAdminTheme = 'dark'
    try {
      const stored = localStorage.getItem('barberos_superadmin_theme')
      if (stored === 'light' || stored === 'dark') savedTheme = stored
    } catch {}

    let savedAccent = DEFAULT_ACCENT.hex
    try {
      const storedAccent = localStorage.getItem('barberos_superadmin_accent')
      if (storedAccent) savedAccent = storedAccent
    } catch {}

    setThemeState(savedTheme)
    setAccentState(savedAccent)
    applyThemeClasses(savedTheme)
    applyAccentStyle(savedAccent)

    // 3. Sincronizar con backend
    fetch('/api/superadmin/appearance')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        if (data.theme && (data.theme === 'light' || data.theme === 'dark')) {
          setThemeState(data.theme)
          applyThemeClasses(data.theme)
          try { localStorage.setItem('barberos_superadmin_theme', data.theme) } catch {}
        }
        if (data.accentColor) {
          setAccentState(data.accentColor)
          applyAccentStyle(data.accentColor)
          try { localStorage.setItem('barberos_superadmin_accent', data.accentColor) } catch {}
        }
      })
      .catch(() => {})

    // 4. Restauración al salir de SuperAdmin (limpieza y restauración del tema público)
    return () => {
      document.documentElement.removeAttribute('data-superadmin-active')
      const styleEl = document.getElementById('superadmin-accent-override')
      if (styleEl) styleEl.remove()

      // Restaurar tema original de la plataforma para no alterar la landing ni dashboards de otros roles
      const restored = localStorage.getItem('barberos-theme') || previousPublicTheme
      if (restored === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      document.documentElement.setAttribute('data-theme', restored)
    }
  }, [applyAccentStyle, applyThemeClasses])

  const setTheme = useCallback((t: SuperAdminTheme) => {
    setThemeState(t)
    applyThemeClasses(t)
    try {
      localStorage.setItem('barberos_superadmin_theme', t)
      document.cookie = `barberos-superadmin-theme=${t}; path=/superadmin; max-age=31536000; SameSite=Lax`
    } catch {}
  }, [applyThemeClasses])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      applyThemeClasses(next)
      try {
        localStorage.setItem('barberos_superadmin_theme', next)
        document.cookie = `barberos-superadmin-theme=${next}; path=/superadmin; max-age=31536000; SameSite=Lax`
      } catch {}
      return next
    })
  }, [applyThemeClasses])

  const setAccentColor = useCallback((hex: string) => {
    setAccentState(hex)
    applyAccentStyle(hex)
    try {
      localStorage.setItem('barberos_superadmin_accent', hex)
      document.cookie = `barberos-superadmin-accent=${hex}; path=/superadmin; max-age=31536000; SameSite=Lax`
    } catch {}
  }, [applyAccentStyle])

  return (
    <SuperAdminThemeContext.Provider value={{ theme, setTheme, toggleTheme, accentColor, setAccentColor }}>
      <div data-panel="superadmin" className="w-full min-h-screen">
        {children}
      </div>
    </SuperAdminThemeContext.Provider>
  )
}
