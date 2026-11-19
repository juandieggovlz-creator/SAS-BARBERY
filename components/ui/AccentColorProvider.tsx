'use client'

import { useEffect, useLayoutEffect } from 'react'
import { DEFAULT_ACCENT, getAccentByHex, buildAccentCSS } from '@/lib/accent-colors'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

let memoryAccentHex: string | null = null
let memoryBusinessId: string | null = null
let hasFetchedSessionAccent = false

/* ─────────────────────────────────────────────────────────
   applyAccent: aplica el color de acento en el DOM encapsulado
───────────────────────────────────────────────────────── */
export function applyAccent(hex: string, businessId?: string | null) {
  const accent = getAccentByHex(hex) ?? DEFAULT_ACCENT
  memoryAccentHex = accent.hex
  if (businessId) memoryBusinessId = businessId

  let el = document.getElementById('accent-override') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'accent-override'
    document.head.appendChild(el)
  }
  const nextCSS = buildAccentCSS(accent)
  if (el.textContent !== nextCSS) {
    el.textContent = nextCSS
  }

  // Aislamiento estricto: almacenar en caché de sesión activa y por tenant/negocio
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('barberos_active_panel_accent', accent.hex)
      localStorage.setItem('barberos_last_panel_accent', accent.hex)
      if (businessId) {
        sessionStorage.setItem(`barberos_panel_accent_${businessId}`, accent.hex)
        localStorage.setItem(`barberos_panel_accent_${businessId}`, accent.hex)
      }
      document.cookie = `barberos-panel-accent=${encodeURIComponent(accent.hex)}; path=/; max-age=31536000; SameSite=Lax`
    } catch {
      /* noop */
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('accent-color-changed', {
        detail: { hex: accent.hex, accent, businessId: businessId || memoryBusinessId || null }
      })
    )
  }
}

/* ─────────────────────────────────────────────────────────
   AccentColorProvider — Componente cliente de panel
   Sincroniza el color con la API y asegura cero parpadeo entre rutas.
───────────────────────────────────────────────────────── */
export default function AccentColorProvider({ children }: { children: React.ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    if (typeof document === 'undefined') return
    // Aplicar inmediatamente desde memoria o sessionStorage antes del primer pintado de la ruta
    const cachedHex =
      memoryAccentHex ||
      (() => {
        try {
          return sessionStorage.getItem('barberos_active_panel_accent')
        } catch {
          return null
        }
      })()

    if (cachedHex) {
      applyAccent(cachedHex, memoryBusinessId)
    } else if (!document.getElementById('accent-override')) {
      applyAccent(DEFAULT_ACCENT.hex, null)
    }
  }, [])

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
        hasFetchedSessionAccent = true
        applyAccent(data.accentColor, data.businessId)
      })
      .catch((err) => {
        if (!hasFetchedSessionAccent) {
          console.warn('[AccentColorProvider] Error loading accent:', err)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return <>{children}</>
}
