'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function BarberInvitePage() {
  const params = useParams()
  const token = params.token as string

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/validate-invite?token=${token}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Este enlace de invitación no es válido')
        }
      } catch {
        setError('Error al validar la invitación')
      } finally {
        setValidating(false)
      }
    }
    validateToken()
  }, [token])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register-barber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Cuenta configurada con éxito. ¡Bienvenido!')
        // El API ya crea la sesión, así que redirigimos directamente
        window.location.href = '/barber'
      } else {
        toast.error(data.error || 'Error al configurar cuenta')
      }
    } catch {
      toast.error('Error de red al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border-t-4 border-red-500 border border-zinc-200 dark:border-zinc-800 text-center">
          <h2 className="text-2xl font-black text-black dark:text-white mb-4 tracking-tighter uppercase">Invitación No Disponible</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
          <a href="/login" className="text-[10px] uppercase font-black tracking-widest text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">Volver al Inicio</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <div className="max-w-md w-full p-12 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
        
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl font-extrabold tracking-tighter text-black dark:text-white uppercase mb-1">
             Barber<span className="font-light text-zinc-500">OS</span>
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-zinc-500 dark:text-zinc-400 uppercase mt-4 font-black">
             Acceso Profesional
          </p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3 block ml-1">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-black dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-medium pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3 block ml-1">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-black dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-medium pr-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex justify-center items-center py-4 px-4 rounded-xl text-[10px] font-black text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl uppercase tracking-[0.3em]"
            >
              {loading ? 'Activando...' : 'Activar y Entrar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
