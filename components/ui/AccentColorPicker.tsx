'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Check, Palette } from 'lucide-react'
import { ACCENT_COLORS, getAccentByHex, DEFAULT_ACCENT } from '@/lib/accent-colors'
import { applyAccent } from '@/components/ui/AccentColorProvider'

interface AccentColorPickerProps {
  /** Si true muestra como tarjeta completa con título; false = solo los círculos */
  card?: boolean
}

export default function AccentColorPicker({ card = true }: AccentColorPickerProps) {
  const [current, setCurrent] = useState<string>(DEFAULT_ACCENT.hex)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Consultar el color de acento autorizado del servidor
    fetch('/api/user/accent')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.accentColor) {
          setCurrent(d.accentColor)
        }
        if (d?.businessId) {
          setBusinessId(d.businessId)
        }
      })
      .catch(() => {})
  }, [])

  const handleSelect = async (hex: string) => {
    if (saving) return

    // Aplicar de inmediato para feedback instantáneo visual encapsulado
    setCurrent(hex)
    applyAccent(hex, businessId)
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
        toast.success(`Color del negocio cambiado a ${accent.name}`)
      } else {
        const data = await res.json().catch(() => null)
        console.error('API /api/user/accent error:', res.status, data)
        toast.error(data?.error || `Error (${res.status}) al guardar el color`)
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
            className={`
              relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200
              ${
                isActive
                  ? 'border-zinc-950 dark:border-white shadow-md ring-2 ring-zinc-950/20 dark:ring-white/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-xs'
              }
              bg-white dark:bg-[#121215]
            `}
          >
            {/* Color swatch circle */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs border border-black/10"
              style={{ backgroundColor: c.hex }}
            >
              {isActive && (
                <Check
                  className="w-4 h-4 stroke-[3]"
                  style={{ color: c.contrastText }}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {c.name}
              </div>
              <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                {c.hex}
              </div>
            </div>

            {isActive && (
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: c.hex }}
              />
            )}
          </button>
        )
      })}
    </div>
  )

  if (!card) return grid

  return (
    <div className="bg-white dark:bg-[#101014] rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Color de Acento del Panel
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Define la identidad visual que verán tú y tu equipo en botones, badges y selección activa.
          </p>
        </div>
      </div>

      {grid}

      <p className="mt-3 text-[11px] text-zinc-600 dark:text-zinc-300">
        ⚡ El cambio aplica exclusivamente a tu negocio y sedes. La landing principal de BarberOS siempre conserva su diseño corporativo independiente.
      </p>
    </div>
  )
}
