'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SupportModeBanner() {
  const [isSupportMode, setIsSupportMode] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.session?.isSupportMode) {
          setIsSupportMode(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!isSupportMode) return null

  const handleExit = async () => {
    setExiting(true)
    try {
      const res = await fetch('/api/superadmin/switch-back', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.redirect) {
        toast.success('Retornando a panel Super Admin')
        window.location.href = data.redirect
      } else {
        toast.error(data.error || 'Error al salir del modo soporte')
        setExiting(false)
      }
    } catch {
      toast.error('Error de conexión')
      setExiting(false)
    }
  }

  return (
    <aside aria-label="Modo Soporte Activo" className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-2 truncate">
        <ShieldCheck className="w-4 h-4 shrink-0 animate-pulse" />
        <span className="uppercase tracking-wider">
          Modo Soporte Super Admin Activo
        </span>
        <span className="hidden sm:inline text-amber-100 font-normal">
          · Estás viendo el panel de esta barbería con fines de supervisión y soporte.
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="bg-black hover:bg-zinc-900 text-white px-3 py-1.5 rounded-xl uppercase tracking-wider text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
      >
        {exiting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowLeft className="w-3.5 h-3.5" />
        )}
        <span>Salir y Volver a Super Admin</span>
      </button>
    </aside>
  )
}
