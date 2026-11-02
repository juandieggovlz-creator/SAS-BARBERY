'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, Shield, Check, X, Settings, ChevronRight } from 'lucide-react'

interface CookiePreferences {
  essential: boolean
  preferences: boolean
  analytics: boolean
  timestamp: string
}

const STORAGE_KEY = 'barberos_cookie_consent'

export default function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [preferences, setPreferences] = useState({
    preferences: true,
    analytics: true,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        // Small delay to prevent layout jump on immediate load
        const timer = setTimeout(() => setIsOpen(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, [])

  const handleAcceptAll = () => {
    const consent: CookiePreferences = {
      essential: true,
      preferences: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    }
    saveConsent(consent)
  }

  const handleRejectOptional = () => {
    const consent: CookiePreferences = {
      essential: true,
      preferences: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    }
    saveConsent(consent)
  }

  const handleSaveCustom = () => {
    const consent: CookiePreferences = {
      essential: true,
      preferences: preferences.preferences,
      analytics: preferences.analytics,
      timestamp: new Date().toISOString(),
    }
    saveConsent(consent)
  }

  const saveConsent = (consent: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    } catch {
      // Ignore
    }
    setIsOpen(false)
    setShowConfig(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl p-5 text-zinc-200">
        {!showConfig ? (
          /* Normal View */
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">Privacidad y Cookies</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    Control
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Utilizamos cookies esenciales para el funcionamiento seguro de sesiones y autenticación, y cookies opcionales para recordar tus preferencias de tema y mejorar tu experiencia. Consulta nuestra{' '}
                  <Link href="/privacidad" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">
                    Política de Privacidad
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/10"
              >
                Aceptar todas
              </button>
              <button
                onClick={handleRejectOptional}
                className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs border border-zinc-800 transition-colors"
              >
                Solo esenciales
              </button>
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors flex items-center justify-center"
                title="Configurar preferencias"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Config View */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Preferencias de Cookies</h3>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
              {/* Essential */}
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Técnicas y Esenciales</p>
                  <p className="text-[11px] text-zinc-400">Tokens de autenticación (JWT) y seguridad de sesión.</p>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Siempre activas
                </span>
              </div>

              {/* Preferences */}
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Preferencias Visuales</p>
                  <p className="text-[11px] text-zinc-400">Paleta de acento, tema oscuro/claro y personalización.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
              </div>

              {/* Analytics */}
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Rendimiento y Telemetría</p>
                  <p className="text-[11px] text-zinc-400">Tiempos de carga y rendimiento de la plataforma.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={handleSaveCustom}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors"
              >
                Guardar selección
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800"
              >
                Atrás
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
