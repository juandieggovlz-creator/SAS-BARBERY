'use client'

import { useEffect } from 'react'
import { DEFAULT_ACCENT, getAccentByHex, buildAccentCSS } from '@/lib/accent-colors'

/* ─────────────────────────────────────────────────────────
   applyAccent: aplica el color de acento en el DOM encapsulado
───────────────────────────────────────────────────────── */
export function applyAccent(hex: string, businessId?: string | null) {
  const accent = getAccentByHex(hex) ?? DEFAULT_ACCENT
  let el = document.getElementById('accent-override') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'accent-override'
    document.head.appendChild(el)
  }
  el.textContent = buildAccentCSS(accent)

  // Aislamiento estricto: almacenar en caché por tenant/negocio, nunca en una clave global compartida
  if (businessId && typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`barberos_panel_accent_${businessId}`, hex)
      localStorage.setItem(`barberos_panel_accent_${businessId}`, hex)
      // Purgar clave global antigua para evitar contaminación
      localStorage.removeItem('accent-color')
    } catch {
      /* noop */
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('accent-color-changed', {
        detail: { hex: accent.hex, accent, businessId: businessId || null }
      })
    )
  }
}

/* ─────────────────────────────────────────────────────────
   AccentColorProvider — Componente cliente de panel
   Sincroniza el color con la API y asegura aislamiento total.
───────────────────────────────────────────────────────── */
export default function AccentColorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Purgar cualquier residuo global que pudiera afectar la landing o login
    const root = document.documentElement
    const residualVars = [
      '--accent',
      '--accent-dark',
      '--accent-darker',
      '--accent-light',
      '--accent-lighter',
      '--accent-op15',
      '--accent-op30',
      '--accent-op60',
      '--accent-contrast',
      '--accent-hover',
      '--sidebar-active-bg',
      '--sidebar-active-text'
    ]
    residualVars.forEach((v) => root.style.removeProperty(v))
    try {
      localStorage.removeItem('accent-color')
    } catch {
      /* noop */
    }

    let isMounted = true

    // 2. Consultar el tema del negocio autenticado en el servidor
    fetch('/api/user/accent')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted || !data?.accentColor) return
        applyAccent(data.accentColor, data.businessId)
      })
      .catch((err) => {
        console.warn('[AccentColorProvider] Error loading accent:', err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return <>{children}</>
}
