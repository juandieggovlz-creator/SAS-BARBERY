'use client'

import { useEffect } from 'react'
import { DEFAULT_ACCENT, getAccentByHex, buildAccentCSS } from '@/lib/accent-colors'

/* ─────────────────────────────────────────────────────────
   applyAccent: aplica el color de acento en el DOM
───────────────────────────────────────────────────────── */
export function applyAccent(hex: string) {
  const accent = getAccentByHex(hex) ?? DEFAULT_ACCENT
  let el = document.getElementById('accent-override') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'accent-override'
    document.head.appendChild(el)
  }
  el.textContent = buildAccentCSS(accent)

  // Inyección directa de custom properties en documentElement para reactividad inmediata
  if (typeof document !== 'undefined' && document.documentElement) {
    const { r, g, b, contrastText } = accent
    const main = `rgb(${r},${g},${b})`
    const dark1 = `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(b * 0.82)})`
    document.documentElement.style.setProperty('--accent', main)
    document.documentElement.style.setProperty('--accent-contrast', contrastText)
    document.documentElement.style.setProperty('--accent-dark', dark1)
    document.documentElement.style.setProperty('--accent-light', `rgba(${r},${g},${b},0.10)`)
    document.documentElement.style.setProperty('--accent-lighter', `rgba(${r},${g},${b},0.20)`)
    document.documentElement.style.setProperty('--accent-op15', `rgba(${r},${g},${b},0.15)`)
    document.documentElement.style.setProperty('--accent-op30', `rgba(${r},${g},${b},0.30)`)
    document.documentElement.style.setProperty('--accent-op60', `rgba(${r},${g},${b},0.60)`)
  }

  // localStorage para persistir de inmediato
  try {
    localStorage.setItem('accent-color', hex)
  } catch {
    /* noop */
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('accent-color-changed', { detail: { hex, accent } }))
  }
}

/* ─────────────────────────────────────────────────────────
   AccentColorProvider — Componente cliente raíz
   Sincroniza el color entre localStorage y la API
───────────────────────────────────────────────────────── */
export default function AccentColorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Aplicación inmediata desde localStorage
    const cached = (typeof window !== 'undefined' && localStorage.getItem('accent-color')) || DEFAULT_ACCENT.hex
    applyAccent(cached)

    // 2. Sincronizar con el backend
    fetch('/api/user/accent')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.accentColor && data.accentColor !== cached) {
          applyAccent(data.accentColor)
        }
      })
      .catch(() => {
        /* mantiene el valor de localStorage */
      })
  }, [])

  return <>{children}</>
}
