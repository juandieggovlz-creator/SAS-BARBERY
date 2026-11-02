'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Shield, Power, AlertTriangle, SunMoon, Palette } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import AccentColorPicker from '@/components/ui/AccentColorPicker'

interface BarberSettings {
  id: string
  name: string
  status: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<BarberSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/barber/profile')
      const data = await res.json()
      setProfile(data)
    } catch {
       toast.error('Error al cargar ajustes')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async () => {
    if (!profile) return
    const newStatus = profile.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await fetch(`/api/barbers/${profile.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Ahora estás ${newStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}`)
        fetchProfile()
      }
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  if (loading || !profile) return <div className="p-10 text-[var(--text-muted)] font-bold uppercase text-xs">Cargando ajustes...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h2 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Configuración</h2>
        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.3em] mt-2 ml-1">Preferencias del Sistema</p>
      </header>

      <div className="space-y-6">
        {/* APARIENCIA / TEMA CLARO Y OSCURO */}
        <div className="bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--surface-3)] shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <SunMoon size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Tema del Sistema</span>
            </div>
            <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Apariencia Visual</h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Elige si prefieres trabajar con tema Claro u Oscuro en tu panel.</p>
          </div>
          <ThemeToggle variant="settings" />
        </div>

        {/* COLOR DE ACENTO */}
        <div className="bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--surface-3)] shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Palette size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Color Principal</span>
            </div>
            <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Personalización de Color</h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Elige el color de acento de tu panel. El cambio aplica de inmediato.</p>
          </div>
          <AccentColorPicker card={false} />
        </div>

        <div className="bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--surface-3)] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                profile.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                <Power size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Estado de Disponibilidad</h4>
                <p className="text-xs text-[var(--text-muted)] font-medium">Determina si los clientes pueden verte en el sistema</p>
              </div>
            </div>
            <button
              onClick={toggleStatus}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                profile.status === 'ACTIVE' 
                  ? 'bg-black text-white hover:bg-zinc-800' 
                  : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {profile.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>

        <div className="bg-zinc-950 p-8 rounded-3xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield size={64} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-amber-500 mb-4">
              <AlertTriangle size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Seguridad</span>
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">Contraseña y Acceso</h4>
            <p className="text-sm text-zinc-400 font-medium mb-6">Si necesitas cambiar tu contraseña, contacta con tu administrador para un reinicio de acceso seguro.</p>
            <button
              disabled
              className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 cursor-not-allowed border border-white/5"
            >
              Cambiar Contraseña (Contactar Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
