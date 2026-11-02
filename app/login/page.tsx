'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Scissors, 
  Lock, 
  Mail, 
  ArrowLeft, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  Users, 
  CheckCircle2,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Check if redirected with an error parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error')
      if (err === 'barber_not_active') {
        toast.error('El dashboard de este barbero aún no ha sido activado por el administrador.')
      } else if (err === 'invalid_token') {
        toast.error('El enlace de acceso directo no es válido o fue modificado.')
      } else if (err === 'google_access_denied') {
        toast.error('Has cancelado el acceso con tu cuenta de Google.')
      } else if (err === 'account_inactive') {
        toast.error('Esta cuenta se encuentra desactivada.')
      } else if (err === 'barber_inactive') {
        toast.error('Tu cuenta de barbero ha sido desactivada por el administrador.')
      } else if (err && err.startsWith('google_')) {
        toast.error('Ocurrió un error al autenticar con Google. Intenta de nuevo.')
      }
    }
    // Purge any residual session cookie when landing on the login page
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      })

      let data
      try {
        data = await res.json()
      } catch {
        data = { error: 'Error del servidor (respuesta inválida)' }
      }

      if (res.ok) {
        toast.success(`Acceso autorizado como ${data.user.role === 'OWNER' ? 'Propietario' : data.user.role}`)
        
        if (data.user.role === 'SUPER_ADMIN') {
          window.location.href = '/superadmin/dashboard'
        } else if (data.user.role === 'OWNER') {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/barber/dashboard'
        }
      } else {
        const errorText = data.error || 'Credenciales inválidas. Verifica tu correo y contraseña.'
        setErrorMessage(errorText)
        toast.error(errorText)
      }
    } catch {
      const errNet = 'Error de conexión con el servidor. Intenta de nuevo.'
      setErrorMessage(errNet)
      toast.error(errNet)
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrorMessage(null)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-amber-400 dark:selection:text-zinc-950 transition-colors duration-200">

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <ThemeToggle variant="navbar" />
          <span>¿No tienes una cuenta?</span>
          <Link 
            href="/register" 
            className="font-bold text-zinc-950 dark:text-white hover:underline transition-colors"
          >
            Crear barbería
          </Link>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-xl overflow-hidden transition-colors">

          {/* ══════════════════════════════════════════════════════
              COLUMNA IZQUIERDA: FORMULARIO DE ACCESO
          ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white dark:bg-[#121215]">
            <div>
              {/* Logo BarberOS */}
              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center font-black shadow-md border border-transparent dark:border-zinc-700">
                  <Scissors className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white uppercase">
                  Barber<span className="font-light text-zinc-400 dark:text-zinc-500">OS</span>
                </span>
                <span className="ml-2 text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                  Acceso
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Inicia sesión para administrar tu barbería, citas y finanzas.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Error de autenticación</p>
                    <p className="mt-0.5 text-rose-600 dark:text-rose-400">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@barberia.com"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-zinc-900 dark:focus:border-amber-400/80 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-amber-400/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-zinc-900 dark:focus:border-amber-400/80 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-amber-400/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot options */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-600 dark:text-zinc-300 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-amber-500 focus:ring-zinc-900 dark:focus:ring-amber-500"
                    />
                    <span>Recordarme</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => toast.info('Comunícate con soporte o tu administrador para restablecer tu clave.')}
                    className="font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 dark:border-zinc-900/20 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Iniciar sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  <span className="bg-white dark:bg-[#121215] px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 absolute">
                    o continuar con
                  </span>
                </div>

                {/* Google Sign-In Button */}
                <a
                  href="/api/auth/google"
                  className="group relative overflow-hidden w-full bg-white dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-100 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-2xs hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
                >
                  {/* Sweep light effect on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                  <div className="w-4 h-4 shrink-0 group-hover:scale-115 transition-transform duration-300 ease-out flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <span className="group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors duration-200">
                    Google
                  </span>
                </a>

                {/* Secondary Button: Crear barbería */}
                <Link
                  href="/register"
                  className="w-full mt-2 bg-zinc-100/80 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs py-3 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>¿No tienes cuenta? Crear mi barbería</span>
                </Link>
              </form>
            </div>

            {/* Quick Demo Credentials (solo visible en entorno local de desarrollo) */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                  Accesos Rápidos de Prueba (Dev Only):
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@barberos.co', 'superadmin123')}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Super Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@admin.com', 'admin123')}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Dueño Demo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('julian@barber.com', 'barber123')}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Barbero Demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              COLUMNA DERECHA: ILUSTRACIÓN & MOCKUP DEL SISTEMA
          ══════════════════════════════════════════════════════ */}
          <div className="login-showcase-panel hidden lg:flex lg:col-span-6 bg-gradient-to-br from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0d0d10] dark:via-[#141418] dark:to-[#09090b] border-l border-zinc-200/80 dark:border-zinc-800 p-10 flex-col justify-between relative overflow-hidden transition-colors">
            {/* Background subtle radial glow */}
            <div className="absolute top-1/4 right-0 w-80 h-80 bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 shadow-2xs backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Panel de Control BarberOS</span>
              </div>
              <h2 className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                Todo tu negocio en una sola pantalla inteligente
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Visualiza tus ingresos diarios, controla comisiones y confirma reservas en segundos sin perder ninguna cita.
              </p>
            </div>

            {/* Mockup Card Floating */}
            <div className="relative z-10 my-6 bg-white dark:bg-[#18181b]/95 rounded-2xl p-5 border border-zinc-200/90 dark:border-zinc-800 shadow-xl dark:shadow-2xl dark:shadow-black/70 space-y-4 backdrop-blur-sm">
              {/* Header card preview */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center font-bold text-xs border border-transparent dark:border-zinc-700">
                    <Scissors className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-zinc-950 dark:text-white">Barbería Elite SAS</h3>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Panel Principal · En Línea</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Abierto Hoy</span>
                </div>
              </div>

              {/* 3 Metrics Pills */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">+18%</span>
                  </div>
                  <div className="text-xs font-black text-zinc-950 dark:text-white">$540.000</div>
                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">Facturado hoy</div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400">14 citas</span>
                  </div>
                  <div className="text-xs font-black text-zinc-950 dark:text-white">92%</div>
                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">Ocupación</div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-1">
                    <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400">3 activos</span>
                  </div>
                  <div className="text-xs font-black text-zinc-950 dark:text-white">Equipo</div>
                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">Barberos</div>
                </div>
              </div>

              {/* Upcoming Appointment Row */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-800 border border-transparent dark:border-zinc-700 text-white flex items-center justify-center text-[10px] font-bold">
                    10:30
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Santiago Vélez</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Corte + Barba · Barbero Carlos</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 border border-transparent dark:border-emerald-800/40 px-2 py-0.5 rounded-md">
                  Confirmada
                </span>
              </div>
            </div>

            {/* Testimonial highlight pill */}
            <div className="relative z-10 flex items-center gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                <img src="/landing/testimonial-1.png" alt="Barbero" className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover" />
                <img src="/landing/testimonial-2.png" alt="Barbero" className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover" />
                <img src="/landing/testimonial-3.png" alt="Barbero" className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover" />
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                Más de <span className="font-bold text-zinc-950 dark:text-white">500 barberías</span> confían en BarberOS diariamente.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>© {new Date().getFullYear()} BarberOS. Plataforma SaaS de Gestión para Barberías.</p>
      </footer>

    </div>
  )
}
