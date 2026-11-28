'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import BrandLogo from '@/components/ui/BrandLogo'
import { CheckCircle2, AlertCircle, Loader2, Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const initialError = searchParams.get('error')

  const [loading, setLoading] = useState(Boolean(token))
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(initialError || (token ? null : 'Falta el token de verificación'))
  const [resending, setResending] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (!token) return

    let isMounted = true

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!isMounted) return

        if (res.ok && data.success) {
          setSuccess(true)
          setError(null)
          toast.success('¡Correo verificado con éxito!')
        } else {
          setError(data.error || 'El enlace de verificación no es válido o ha expirado.')
          setSuccess(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Error de conexión al verificar el correo. Intenta de nuevo.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail || !resendEmail.includes('@')) {
      toast.error('Ingresa un correo electrónico válido')
      return
    }

    setResending(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail })
      })

      const data = await res.json()
      if (res.ok) {
        setResendSuccess(true)
        toast.success(data.message || 'Enlace de verificación enviado')
      } else {
        toast.error(data.error || 'No se pudo enviar el correo de verificación')
      }
    } catch {
      toast.error('Error de red al solicitar el reenvío')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex items-center justify-center p-1">
          <BrandLogo width={44} height={44} className="w-full h-full" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
          BarberOS · Verificación de Cuenta
        </span>
      </div>

      {/* State 1: Loading */}
      {loading && (
        <div className="py-8 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-zinc-900 dark:text-white">Verificando tu dirección de correo...</h2>
          <p className="text-xs text-zinc-500">Estamos validando tu enlace seguro en la base de datos.</p>
        </div>
      )}

      {/* State 2: Success */}
      {!loading && success && (
        <div className="py-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              ¡Correo Verificado con Éxito!
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Tu identidad ha sido confirmada. Ya tienes habilitadas todas las funciones de BarberOS, incluyendo alertas automáticas, multisedes y gestión de reservas.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black text-xs uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md shadow-zinc-950/10 cursor-pointer"
            >
              <span>Ir a Mi Dashboard</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </Link>
          </div>
        </div>
      )}

      {/* State 3: Error */}
      {!loading && !success && (
        <div className="py-4 space-y-5 animate-in fade-in duration-200 text-left">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-6 h-6 shrink-0 text-rose-500" />
            <div className="text-xs font-semibold">
              <p className="font-bold">No se pudo verificar el correo</p>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/90 mt-0.5">{error}</p>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              Solicitar nuevo enlace de verificación
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ingresa el correo con el que te registraste para enviarte un nuevo enlace de activación (vigencia de 24 horas).
            </p>

            {resendSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                ✓ Te hemos enviado un nuevo correo. Revisa tu bandeja de entrada o carpeta de spam.
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-3 pt-1">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="ejemplo@tudominio.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition-all font-mono"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{resending ? 'Enviando enlace...' : 'Reenviar Verificación'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              ← Volver al Inicio de Sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Suspense fallback={
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
