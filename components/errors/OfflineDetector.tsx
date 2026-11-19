'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Comprobar estado inicial
    setIsOffline(!navigator.onLine)

    const handleOffline = () => {
      setIsOffline(true)
      toast.error('Se perdió la conexión a internet. Las operaciones en la nube están pausadas.')
    }

    const handleOnline = () => {
      setIsOffline(false)
      toast.success('Conexión a internet restablecida.')
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      if (!navigator.onLine) {
        toast.error('Tu navegador sigue reportando estar sin conexión.')
        setIsChecking(false)
        return
      }
      const res = await fetch('/api/platform/settings', { cache: 'no-store' })
      if (res.ok) {
        setIsOffline(false)
        toast.success('¡Conexión verificada con éxito!')
      } else {
        toast.error('Sin respuesta del servidor aún.')
      }
    } catch {
      toast.error('No se pudo conectar con BarberOS.')
    } finally {
      setIsChecking(false)
    }
  }

  if (!isOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-zinc-950/95 border border-rose-500/30 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-md select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">Se perdió la conexión</p>
          <p className="text-[11px] text-zinc-400 truncate">No intentes emitir pagos ni guardar cambios</p>
        </div>
      </div>

      <button
        type="button"
        onClick={checkConnection}
        disabled={isChecking}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-[0.97] transition-all text-white shrink-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
        <span>Reintentar</span>
      </button>
    </div>
  )
}
