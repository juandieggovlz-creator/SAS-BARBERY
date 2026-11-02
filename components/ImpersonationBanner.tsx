'use client'

import React, { useEffect, useState } from 'react'
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ImpersonationBanner() {
  const [isImpersonated, setIsImpersonated] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/superadmin/check-impersonation')
      .then(res => res.json())
      .then(data => {
        if (data.isImpersonated) setIsImpersonated(true)
      })
      .catch(() => {})
  }, [])

  if (!isImpersonated) return null

  const handleExit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/switch-back', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Retornando al panel Super Admin')
        window.location.href = data.redirect || '/superadmin/businesses'
      } else {
        toast.error(data.error || 'Error al salir del modo de soporte')
        setLoading(false)
      }
    } catch {
      toast.error('Error de red al salir del modo soporte')
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-zinc-950" />
        <span>
          <strong className="uppercase">Modo Soporte / Impersonación Activo:</strong> Estás operando la barbería en nombre del Propietario.
        </span>
      </div>

      <button
        onClick={handleExit}
        disabled={loading}
        className="bg-zinc-950 hover:bg-zinc-800 text-white px-3.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        <span>Volver a Super Admin</span>
      </button>
    </div>
  )
}
