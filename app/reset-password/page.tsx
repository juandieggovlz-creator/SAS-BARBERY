'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error('Token de restablecimiento no encontrado o inválido.')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'No se pudo restablecer la contraseña.')
        return
      }

      setSuccess(true)
      toast.success('¡Contraseña actualizada exitosamente!')
      setTimeout(() => {
        router.push('/login')
      }, 2500)
    } catch {
      toast.error('Error de red al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="bg-bg-card p-8 rounded-3xl border border-border-default shadow-xl max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-black text-text-primary">Enlace Inválido</h2>
        <p className="text-sm text-text-secondary">
          El enlace de restablecimiento no contiene un token válido o ha expirado.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent hover:underline pt-2"
        >
          Volver al Inicio de Sesión <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-bg-card p-8 rounded-3xl border border-border-default shadow-xl max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-xl font-black text-text-primary">¡Contraseña Actualizada!</h2>
        <p className="text-sm text-text-secondary">
          Tu nueva contraseña ha sido configurada correctamente. Redirigiéndote al inicio de sesión...
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-accent text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:opacity-90 transition-all mt-4"
        >
          Iniciar Sesión Ahora <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-bg-card p-8 sm:p-10 rounded-3xl border border-border-default shadow-xl max-w-md w-full space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
          <KeyRound size={22} />
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Nueva Contraseña</h1>
        <p className="text-xs text-text-secondary">
          Ingresa una nueva contraseña segura para tu cuenta en BarberOS.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
            Nueva Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl bg-bg-subtle border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
            Confirmar Contraseña
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-2xl bg-bg-subtle border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:opacity-90 text-black font-black uppercase tracking-wider py-3.5 rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
        >
          {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
        </button>
      </form>

      <div className="pt-2 text-center border-t border-border-default">
        <Link
          href="/login"
          className="text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors"
        >
          ← Regresar al inicio de sesión
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-text-secondary text-xs font-bold uppercase tracking-wider">Cargando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

