'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Cookie, Shield, Check, X, Settings, Sliders, CheckCircle2 } from 'lucide-react'

export interface CookieConsentState {
  necessary: true
  preferences: boolean
  analytics: boolean
  marketing: boolean
  timestamp: string
  version: string
}

const STORAGE_KEY = 'barberos_cookie_consent'
const CONSENT_VERSION = '1.0'

function getStoredCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const raw = parts.pop()?.split(';').shift()
      return raw ? decodeURIComponent(raw) : null
    }
  } catch {
    // Entornos con cookies deshabilitadas
  }
  return null
}

function setStoredCookie(name: string, val: string, days = 365) {
  if (typeof document === 'undefined') return
  try {
    const maxAge = days * 24 * 60 * 60
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=${maxAge}; SameSite=Lax${isHttps ? '; Secure' : ''}`
  } catch {
    // Entornos con cookies restringidas
  }
}

export default function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  
  // Opcionales por defecto desmarcadas antes de otorgar consentimiento expreso
  const [preferences, setPreferences] = useState({
    preferences: false,
    analytics: false,
    marketing: false,
  })

  // Obtener consentimiento de cualquiera de los dos almacenes (localStorage o Cookie)
  const getExistingConsent = useCallback((): CookieConsentState | null => {
    try {
      // 1. Intentar localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const localRaw = localStorage.getItem(STORAGE_KEY)
        if (localRaw) {
          const parsed = JSON.parse(localRaw)
          if (parsed && parsed.version === CONSENT_VERSION) return parsed
        }
      }
    } catch {}

    try {
      // 2. Intentar Cookie HTTP / Document
      const cookieRaw = getStoredCookie(STORAGE_KEY)
      if (cookieRaw) {
        const parsed = JSON.parse(cookieRaw)
        if (parsed && parsed.version === CONSENT_VERSION) return parsed
      }
    } catch {}

    return null
  }, [])

  // Cargar estado guardado o preparar banner inicial
  useEffect(() => {
    const existing = getExistingConsent()
    if (existing) {
      setPreferences({
        preferences: Boolean(existing.preferences),
        analytics: Boolean(existing.analytics),
        marketing: Boolean(existing.marketing),
      })
      // Asegurar sincronización en ambos almacenes por redundancia
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
        }
        setStoredCookie(STORAGE_KEY, JSON.stringify(existing))
      } catch {}
      return
    }
    
    // Primera visita real: pequeña pausa estética para no interferir con la carga inicial
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [getExistingConsent])

  // Guardar consentimiento en localStorage Y Cookie persistente (365 días)
  const saveConsent = useCallback((state: CookieConsentState) => {
    const serialized = JSON.stringify(state)

    // 1. Guardar en localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, serialized)
      }
    } catch {}

    // 2. Guardar en Cookie de 1 año con path=/ para persistencia total entre sesiones y pestañas
    try {
      setStoredCookie(STORAGE_KEY, serialized, 365)
    } catch {}

    setIsOpen(false)
    setShowConfig(false)
  }, [])

  // Aceptar todas
  const handleAcceptAll = () => {
    const consent: CookieConsentState = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    }
    setPreferences({ preferences: true, analytics: true, marketing: true })
    saveConsent(consent)
  }

  // Rechazar todas las opcionales (Un solo clic)
  const handleRejectOptional = () => {
    const consent: CookieConsentState = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    }
    setPreferences({ preferences: false, analytics: false, marketing: false })
    saveConsent(consent)
  }

  // Guardar configuración personalizada
  const handleSaveCustom = () => {
    const consent: CookieConsentState = {
      necessary: true,
      preferences: preferences.preferences,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    }
    saveConsent(consent)
  }

  // Listener para reabrir el configurador desde cualquier enlace del footer
  useEffect(() => {
    const handleOpenModal = () => {
      const existing = getExistingConsent()
      if (existing) {
        setPreferences({
          preferences: Boolean(existing.preferences),
          analytics: Boolean(existing.analytics),
          marketing: Boolean(existing.marketing),
        })
      }
      setShowConfig(true)
      setIsOpen(true)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('open-cookie-preferences', handleOpenModal)
      ;(window as any).openCookiePreferences = handleOpenModal
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-cookie-preferences', handleOpenModal)
        delete (window as any).openCookiePreferences
      }
    }
  }, [getExistingConsent])

  if (!isOpen) return null

  return (
    <div 
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl p-5 text-zinc-200">
        {!showConfig ? (
          /* Vista Principal del Banner */
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 id="cookie-consent-title" className="font-bold text-white text-sm">
                    Privacidad y Cookies en BarberOS
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    Transparencia
                  </span>
                </div>
                <p id="cookie-consent-desc" className="text-xs text-zinc-400 leading-relaxed">
                  Utilizamos cookies técnicas necesarias para autenticar sesiones seguras y almacenamiento local para recordar tu tema y acento. Puedes aceptar todas, rechazar las opcionales o configurar tus preferencias. Más detalles en nuestra{' '}
                  <Link 
                    href="/politica-de-cookies" 
                    className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
                  >
                    Política de Cookies
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/10 cursor-pointer"
              >
                Aceptar todas
              </button>
              <button
                type="button"
                onClick={handleRejectOptional}
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-semibold text-xs border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                Rechazar opcionales
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 transition-colors flex items-center justify-center cursor-pointer"
                title="Configurar preferencias de cookies"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Vista de Configuración Detallada */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Preferencias de Cookies</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConfig(false)
                  // Si ya había consentimiento guardado, cerramos; si no, volvemos a la vista previa
                  const existing = getExistingConsent()
                  if (existing) setIsOpen(false)
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
              {/* 1. Técnicas y Necesarias */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-white">Técnicas y Esenciales</p>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Autenticación segura (JWT HttpOnly), protección anti-CSRF y funcionamiento del panel.
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  Siempre activas
                </span>
              </div>

              {/* 2. Preferencias / Personalización */}
              <label className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-900 transition-colors">
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Preferencias Visuales</p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Almacena tu tema preferido (oscuro/claro) y paleta de acento del sistema.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-400 h-4 w-4 shrink-0 cursor-pointer"
                />
              </label>

              {/* 3. Analíticas y Rendimiento */}
              <label className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-900 transition-colors">
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Rendimiento y Telemetría</p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Monitoreo anónimo de tiempos de carga y diagnóstico de errores en la plataforma.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-400 h-4 w-4 shrink-0 cursor-pointer"
                />
              </label>

              {/* 4. Marketing */}
              <label className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-900 transition-colors">
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Marketing y Publicidad</p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Píxeles y campañas publicitarias externas. Desactivadas por defecto en BarberOS.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-400 h-4 w-4 shrink-0 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Guardar selección
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="py-2 px-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-white font-medium text-xs border border-zinc-750 transition-colors cursor-pointer"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
