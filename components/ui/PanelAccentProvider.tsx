'use client'

/**
 * PanelAccentProvider
 *
 * Wraps every owner/barber/admin panel layout with:
 *   1. The `data-panel="owner"` attribute so accent CSS rules (scoped to
 *      [data-panel="owner"] in buildAccentCSS) only fire inside the panel.
 *   2. AccentColorProvider which synchronizes the tenant-isolated theme from the server.
 *
 * This keeps the marketing landing, login, and public booking pages completely isolated:
 * they never carry data-panel="owner" so panel accent overrides never match.
 * On unmount (leaving the panel), the style element is cleanly removed.
 */

import React, { useEffect } from 'react'
import AccentColorProvider from '@/components/ui/AccentColorProvider'

interface PanelAccentProviderProps {
  children: React.ReactNode
  className?: string
}

export default function PanelAccentProvider({ children, className }: PanelAccentProviderProps) {
  useEffect(() => {
    return () => {
      // Limpieza exhaustiva al desmontar el panel (ej: logout o navegación a landing)
      if (typeof document !== 'undefined') {
        const el = document.getElementById('accent-override')
        if (el) el.remove()

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
      }
    }
  }, [])

  return (
    <AccentColorProvider>
      <div data-panel="owner" className={className} style={{ display: 'contents' }}>
        {children}
      </div>
    </AccentColorProvider>
  )
}
