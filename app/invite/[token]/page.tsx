'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Building2, Store } from 'lucide-react'

interface InviteData {
  valid: boolean
  type?: 'BRANCH_ADMIN' | 'BARBER'
  email?: string
  branchName?: string
  companyName?: string
  branchAddress?: string
  branchLogo?: string
}

export default function InviteAcceptPage() {
  const params = useParams()
  const token = params.token as string

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/validate-invite?token=${token}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Este enlace de invitación no es válido o ya fue utilizado')
        } else {
          setInviteData(data)
        }
      } catch {
        setError('Error al conectar con el servidor para validar la invitación')
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

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!acceptedTerms) {
      toast.error('Debes aceptar los Términos y Condiciones y la Política de Privacidad')
      return
    }

    const isBranchAdmin = inviteData?.type === 'BRANCH_ADMIN'
    if (isBranchAdmin && !name.trim()) {
      toast.error('Por favor ingresa tu nombre completo')
      return
    }

    setLoading(true)

    try {
      const endpoint = isBranchAdmin ? '/api/auth/register-branch-admin' : '/api/auth/register-barber'
      const payload = isBranchAdmin 
        ? {
            token,
            name: name.trim(),
            password,
            acceptedTerms: true
          }
        : {
            token,
            password,
            acceptedTerms: true,
            termsVersion: '1.0',
            termsAcceptedAt: new Date().toISOString()
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('¡Cuenta activada con éxito! Bienvenido a BarberOS.')
        // Redirigir según el rol
        if (isBranchAdmin) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/barber'
        }
      } else {
        toast.error(data.error || 'Error al configurar la cuenta')
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

  const isBranchAdmin = inviteData?.type === 'BRANCH_ADMIN'

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black py-10">
      <div className="max-w-md w-full p-8 sm:p-10 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
        
        {/* Encabezado */}
        <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-extrabold tracking-tighter text-black dark:text-white uppercase mb-1">
             Barber<span className="font-light text-zinc-500">OS</span>
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-zinc-500 dark:text-zinc-400 uppercase mt-2 font-black">
             {isBranchAdmin ? 'Acceso Corporativo Multisedes' : 'Acceso Profesional'}
          </p>
        </div>

        {/* Tarjeta de Sede o Barbero */}
        {isBranchAdmin && inviteData && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Store className="w-4 h-4 shrink-0" />
              <span>Invitación de Administrador de Sede</span>
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Sede: {inviteData.branchName}
            </p>
            {inviteData.companyName && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                Empresa: {inviteData.companyName}
              </p>
            )}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 font-mono">
              Correo asignado: {inviteData.email}
            </p>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Campo de Nombre solo si es Branch Admin */}
          {isBranchAdmin && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block ml-1">
                Tu Nombre Completo
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-black dark:text-white placeholder:text-zinc-400 font-medium text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block ml-1">
                {isBranchAdmin ? 'Crear Contraseña de Acceso' : 'Nueva Contraseña'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-black dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-medium pr-12 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block ml-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-black dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-medium pr-12 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Casilla explícita de aceptación */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-amber-500 focus:ring-amber-500/20 h-4 w-4 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">
                  Acepto los{' '}
                  <Link 
                    href="/terminos-y-condiciones" 
                    target="_blank" 
                    className="font-bold underline text-black dark:text-white hover:text-amber-500 transition-colors"
                  >
                    Términos y Condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link 
                    href="/politica-de-privacidad" 
                    target="_blank" 
                    className="font-bold underline text-black dark:text-white hover:text-amber-500 transition-colors"
                  >
                    Política de Privacidad
                  </Link>.
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex justify-center items-center py-3.5 px-4 rounded-xl text-[10px] font-black text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl uppercase tracking-[0.3em]"
            >
              {loading ? 'Configurando acceso...' : (isBranchAdmin ? 'Aceptar y Gestionar Sede' : 'Activar y Entrar')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
