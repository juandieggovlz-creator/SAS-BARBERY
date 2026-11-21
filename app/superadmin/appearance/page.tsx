'use client'

import React, { useState } from 'react'
import {
  Palette,
  Sun,
  Moon,
  Check,
  ShieldCheck,
  Sparkles,
  Save,
  Loader2,
  LayoutDashboard,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { ACCENT_COLORS, getAccentByHex } from '@/lib/accent-colors'
import { useSuperAdminTheme, SuperAdminTheme } from '@/components/superadmin/SuperAdminThemeManager'

export default function SuperAdminAppearancePage() {
  const { theme, setTheme, accentColor, setAccentColor } = useSuperAdminTheme()
  const [selectedTheme, setSelectedTheme] = useState<SuperAdminTheme>(theme)
  const [selectedAccent, setSelectedAccent] = useState<string>(accentColor)
  const [saving, setSaving] = useState(false)

  // Sincronizar estado local si cambia el contexto
  React.useEffect(() => {
    setSelectedTheme(theme)
  }, [theme])

  React.useEffect(() => {
    setSelectedAccent(accentColor)
  }, [accentColor])

  const handleThemeChange = (newTheme: SuperAdminTheme) => {
    setSelectedTheme(newTheme)
    setTheme(newTheme) // Aplicar de inmediato para feedback instantáneo dentro de SuperAdmin
  }

  const handleAccentChange = (hex: string) => {
    setSelectedAccent(hex)
    setAccentColor(hex) // Aplicar de inmediato dentro de SuperAdmin
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          accentColor: selectedAccent
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Apariencia del Super Admin guardada y persistida exitosamente')
      } else {
        toast.error(data.error || 'Error al persistir preferencias')
      }
    } catch {
      toast.error('Error de conexión al guardar preferencias')
    } finally {
      setSaving(false)
    }
  }

  const activeAccentObj = getAccentByHex(selectedAccent)

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <Palette className="w-3 h-3" />
              Preferencia Personal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.03em' }}>
            Mi Apariencia Super Admin
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Personaliza el tema oscuro/claro y el color de acento de tu consola de control administrativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Aislamiento Estricto Activo
          </span>
        </div>
      </div>

      {/* ── BANNER DE AISLAMIENTO ESTRICTO ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Garantía de Aislamiento Visual:
        </p>
        <p className="leading-relaxed">
          Cualquier cambio realizado en esta pantalla afecta <strong>únicamente tu consola de Super Admin</strong>.
          Nunca alterará la landing pública, el portal de reservas, la página de inicio de sesión ni la identidad visual de los negocios y barberos registrados.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECCIÓN 1: MODO CLARO / MODO OSCURO */}
        <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                Modo de Visualización de la Consola
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Selecciona entre la experiencia oscura inmersiva o la vista clara de alta luminancia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Opción 1: Modo Oscuro */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                selectedTheme === 'dark'
                  ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900 shadow-md ring-2 ring-zinc-950/10 dark:ring-white/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#0c0c0e]'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                <Moon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-zinc-900 dark:text-white">Modo Oscuro</span>
                  {selectedTheme === 'dark' && (
                    <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Recomendado para centros de control e inspección nocturna.
                </p>
              </div>
            </button>

            {/* Opción 2: Modo Claro */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                selectedTheme === 'light'
                  ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900 shadow-md ring-2 ring-zinc-950/10 dark:ring-white/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#0c0c0e]'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                <Sun className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-zinc-900 dark:text-white">Modo Claro</span>
                  {selectedTheme === 'light' && (
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Alta legibilidad para auditoría documental y entornos iluminados.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* SECCIÓN 2: COLOR DE ACENTO DE LA CONSOLA */}
        <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                Color de Acento de la Consola
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Selecciona la tonalidad corporativa para métricas, badges y botones principales de tu panel.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
              {activeAccentObj.name} ({activeAccentObj.hex})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {ACCENT_COLORS.map((c) => {
              const isActive = selectedAccent.toLowerCase() === c.hex.toLowerCase()
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleAccentChange(c.hex)}
                  className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-zinc-950 dark:border-white shadow-md ring-2 ring-zinc-950/20 dark:ring-white/20 bg-zinc-50 dark:bg-zinc-900'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#0c0c0e]'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && (
                      <Check className="w-4 h-4 stroke-[3]" style={{ color: c.contrastText }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {c.name}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                      {c.hex}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SECCIÓN 3: VISTA PREVIA EN VIVO */}
        <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-amber-500" />
              Vista Previa en Vivo (Simulación de Tarjeta Super Admin)
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Así es como se verán los elementos y métricas en tu centro de comando.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              selectedTheme === 'dark'
                ? 'bg-[#09090b] border-zinc-800 text-white'
                : 'bg-[#f8fafc] border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: activeAccentObj.hex, color: activeAccentObj.contrastText }}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Ingresos Globales Plataforma
                  </h4>
                  <div className="text-xl font-black tracking-tight">
                    $14,850,000 <span className="text-xs font-semibold text-zinc-400">COP</span>
                  </div>
                </div>
              </div>

              <span
                className="px-3 py-1 rounded-full text-xs font-black self-start sm:self-center"
                style={{
                  backgroundColor: `${activeAccentObj.hex}20`,
                  color: activeAccentObj.hex,
                  border: `1px solid ${activeAccentObj.hex}40`
                }}
              >
                +24.8% Este Mes
              </span>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Estado de Aislamiento: Protegido</span>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all"
                style={{ backgroundColor: activeAccentObj.hex, color: activeAccentObj.contrastText }}
              >
                Botón Principal de Consola
              </button>
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR DE GUARDADO */}
        <div className="p-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Las preferencias se persisten en base de datos para tu cuenta Super Admin.
          </span>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-zinc-950/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-500" />}
            <span>{saving ? 'Guardando...' : 'Guardar Mi Apariencia'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
