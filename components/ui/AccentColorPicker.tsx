'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Check, Palette } from 'lucide-react'
import { ACCENT_COLORS, getAccentByHex } from '@/lib/accent-colors'
import { applyAccent } from '@/components/ui/AccentColorProvider'

interface AccentColorPickerProps {
  /** Si true muestra como tarjeta completa con título; false = solo los círculos */
  card?: boolean
}

export default function AccentColorPicker({ card = true }: AccentColorPickerProps) {
  const [current, setCurrent] = useState<string>('#F59E0B')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Leer desde localStorage primero (instantáneo)
    const cached = localStorage.getItem('accent-color') || '#F59E0B'
    setCurrent(cached)
    // Luego confirmar con el servidor
    fetch('/api/user/accent')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.accentColor) setCurrent(d.accentColor) })
      .catch(() => {})
  }, [])

  const handleSelect = async (hex: string) => {
    if (saving) return

    // Aplicar de inmediato para feedback instantáneo visual
    setCurrent(hex)
    applyAccent(hex)
    const accent = getAccentByHex(hex)

    setSaving(true)
    try {
      const res = await fetch('/api/user/accent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accentColor: hex }),
      })

      if (res.ok) {
        toast.success(`Color cambiado a ${accent.name}`)
      } else {
        const data = await res.json().catch(() => null)
        console.error('API /api/user/accent error:', res.status, data)
        if (res.status === 401) {
          toast.info(`Color ${accent.name} aplicado localmente`)
        } else {
          toast.error(data?.error || `Error (${res.status}) al guardar el color`)
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
      toast.error('Error de conexión al sincronizar con el servidor')
    } finally {
      setSaving(false)
    }
  }

  const grid = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACCENT_COLORS.map((c) => {
        const isActive = current.toLowerCase() === c.hex.toLowerCase()
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => handleSelect(c.hex)}
            disabled={saving}
            title={c.name}
            className={`
              relative flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all duration-200
              hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 text-center
              ${isActive
                ? 'border-zinc-950 dark:border-white shadow-lg scale-105'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
              }
            `}
            style={isActive ? { backgroundColor: `rgba(${c.r},${c.g},${c.b},0.12)` } : {}}
          >
            {/* Círculo de color */}
            <div
              className="w-11 h-11 rounded-full shadow-md flex items-center justify-center transition-all shrink-0 border border-black/10"
              style={{ backgroundColor: c.hex, boxShadow: isActive ? `0 0 16px rgba(${c.r},${c.g},${c.b},0.6)` : undefined }}
            >
              {isActive && (
                <Check
                  className="w-5 h-5"
                  style={{ color: c.contrastText }}
                  strokeWidth={3}
                />
              )}
            </div>
            {/* Nombre */}
            <span
              className={`text-[10px] font-black uppercase tracking-wider leading-tight ${
                isActive ? 'font-black' : 'text-zinc-600 dark:text-zinc-400'
              }`}
              style={{ color: isActive ? c.hex : undefined }}
            >
              {c.name}
            </span>
          </button>
        )
      })}
    </div>
  )

  if (!card) return grid

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Palette className="w-4 h-4" style={{ color: current }} />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
          Personalización de Interfaz
        </span>
      </div>
      <h4 className="text-base font-black text-zinc-950 dark:text-white mb-1 tracking-tight">
        Color de Acento del Sistema
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        Personaliza el color de iconos activos, el logo de BarberOS, botones y detalles de tu panel.
        El cambio se aplica de inmediato.
      </p>
      {grid}
    </div>
  )
}
