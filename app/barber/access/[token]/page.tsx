'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Lock,
  Eye,
  EyeOff,
  Scissors,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface BarberInfo {
  barberName: string
  avatar?: string | null
  specialty?: string | null
  businessName: string
  hasPassword: boolean
}

export default function BarberAccessPage() {
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [barberInfo, setBarberInfo] = useState<BarberInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Enlace no válido')
      setLoading(false)
      return
    }

    // Load barber public invite details
    fetch('/api/auth/barber-access?token=' + encodeURIComponent(token), { cache: 'no-store' })
      .then(r => r.json().then(data => {
        if (r.ok) {
          setBarberInfo(data)
        } else {
          setError(data.error || 'Enlace inválido o expirado')
        }
      }))
      .catch(() => setError('Error de conexión con el servidor'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barberInfo) return

    if (!barberInfo.hasPassword) {
      if (password.length < 4) {
        toast.error('La contraseña debe tener al menos 4 caracteres')
        return
      }
      if (password !== confirm) {
        toast.error('Las contraseñas no coinciden')
        return
      }
    } else {
      if (!password) {
        toast.error('Ingresa tu contraseña')
        return
      }
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/barber-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          action: barberInfo.hasPassword ? 'LOGIN' : 'SET_PASSWORD'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al autenticar')
        setSubmitting(false)
        return
      }

      toast.success(data.message || 'Acceso concedido')
      window.location.href = data.redirect || '/barber/dashboard'
    } catch {
      toast.error('Error de red. Intenta nuevamente.')
      setSubmitting(false)
    }
  }

  // ── Loading state (Light elegant aesthetic) ──
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
          <div>
            <p className="text-zinc-900 font-black text-sm">Validando enlace...</p>
            <p className="text-zinc-500 text-xs mt-0.5">Conectando con BarberOS</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state (Light elegant aesthetic) ──
  if (error || !barberInfo) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-between font-sans">
        <header className="p-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir al inicio de sesión general</span>
          </Link>
        </header>

        <div className="flex items-center justify-center p-4 flex-1">
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 text-center shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-zinc-950 tracking-tight">
              Acceso No Disponible
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {error || 'El enlace de acceso no es válido o ha expirado.'}
            </p>
            <p className="text-xs text-zinc-400 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              Solicita al administrador o dueño de la barbería que verifique tu enlace o te genere uno nuevo desde la sección de Equipo.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-sm transition-all"
            >
              <span>Volver al Inicio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <footer className="p-6 text-center text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} BarberOS. Plataforma de Gestión para Barberías.</p>
        </footer>
      </div>
    )
  }

  const initials = barberInfo.barberName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between font-sans selection:bg-zinc-900 selection:text-white relative overflow-hidden">

      {/* Subtle Background Glow Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-100/40 via-amber-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>¿Eres el dueño?</span>
          <Link href="/login" className="font-bold text-zinc-950 hover:underline">
            Acceso administrativo
          </Link>
        </div>
      </header>

      {/* Main Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-md w-full">

          {/* Top Brand & Business Pill */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 text-zinc-800 text-xs font-bold uppercase tracking-widest shadow-2xs">
              <Scissors className="w-3.5 h-3.5 text-zinc-900" />
              <span>{barberInfo.businessName}</span>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Scissors className="w-3.5 h-3.5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950 uppercase">
                Barber<span className="font-light text-zinc-400">OS</span>
              </h1>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-7 sm:p-9 shadow-xl relative">

            {/* Barber Avatar & Details */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-zinc-950 text-white border-4 border-zinc-100 flex items-center justify-center text-2xl font-black overflow-hidden relative mb-3 shadow-md">
                {barberInfo.avatar ? (
                  <Image
                    src={barberInfo.avatar}
                    alt={barberInfo.barberName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Status Badge */}
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2.5 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Barbero Activo
              </span>

              {/* Name & Specialty */}
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                {barberInfo.barberName}
              </h2>
              {barberInfo.specialty && (
                <p className="text-xs font-semibold text-zinc-500 mt-0.5">{barberInfo.specialty}</p>
              )}

              {/* Instructional message */}
              <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                {!barberInfo.hasPassword
                  ? 'Es tu primera vez. Crea tu clave personal para acceder a tu panel de barbero.'
                  : 'Digita tu contraseña personal para acceder a tus citas, comisiones y agenda.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  {!barberInfo.hasPassword ? 'Crea tu Contraseña *' : 'Tu Contraseña *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={!barberInfo.hasPassword ? 'Mínimo 4 caracteres' : '••••••••'}
                    required
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm font-medium placeholder:text-zinc-400 outline-none focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!barberInfo.hasPassword && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Confirma tu Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm font-medium placeholder:text-zinc-400 outline-none focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 shadow-md cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{!barberInfo.hasPassword ? 'Crear clave y entrar' : 'Acceder al panel'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Note */}
            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Acceso encriptado · {barberInfo.businessName} · BarberOS</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-zinc-400 relative z-10">
        <p>© {new Date().getFullYear()} BarberOS. Portal del Barbero.</p>
      </footer>

    </div>
  )
}
