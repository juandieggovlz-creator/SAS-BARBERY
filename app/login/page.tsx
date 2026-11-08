'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
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
import Image from 'next/image'
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
        } else if (data.user.role === 'OWNER' || data.user.role === 'BRANCH_ADMIN') {
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
    <div className="auth-page min-h-screen flex flex-col justify-between">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl"
          style={{ filter: 'blur(120px)' }}
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl"
          style={{ filter: 'blur(120px)' }}
        />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.a
            href="/"
            whileHover={{ x: -2 }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary hover:text-text-primary transition-colors duration-200 group"
          >
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </motion.span>
            <span>Volver al inicio</span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center gap-3 text-xs text-text-tertiary"
        >
          <ThemeToggle variant="navbar" />
          <span>¿No tienes una cuenta?</span>
          <motion.a
            href="/register"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="font-black text-text-primary hover:underline transition-colors"
          >
            Crear barbería
          </motion.a>
        </motion.div>
      </header>

      {/* Main Split Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 card-elevated overflow-hidden"
        >
          {/* ══════════════════════════════════════════════════════
              COLUMNA IZQUIERDA: FORMULARIO DE ACCESO
          ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Logo BarberOS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center gap-2.5 mb-8"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0"
                >
                  <Image
                    src="/logo.png"
                    alt="BarberOS"
                    width={40}
                    height={40}
                    priority
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-text-primary uppercase">
                  Barber<span className="font-light text-text-tertiary">OS</span>
                </span>
                <span className="ml-2 text-[10px] font-black uppercase tracking-wider bg-bg-subtle text-text-tertiary px-2 py-0.5 rounded-full border border-border-subtle">
                  Acceso
                </span>
              </motion.div>

              {/* Title & Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="space-y-2 mb-8"
              >
                <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm text-text-secondary">
                  Inicia sesión para administrar tu barbería, citas y finanzas.
                </p>
              </motion.div>

              {/* Error Alert */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-6 p-4 bg-error-bg border border-error-border rounded-2xl flex items-start gap-3 text-error-text text-xs"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-8 h-8 rounded-full bg-error-bg/50 flex items-center justify-center shrink-0"
                    >
                      <ShieldAlert className="w-4 h-4 text-error-text" aria-hidden="true" />
                    </motion.div>
                    <div>
                      <p className="font-bold">Error de autenticación</p>
                      <p className="mt-0.5 text-text-tertiary">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                >
                  <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <motion.div
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Mail className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@barberia.com"
                      className="input-base !pl-11 !pr-4"
                      autoComplete="email"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <motion.div
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Lock className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-base !pl-11 !pr-12"
                      autoComplete="current-password"
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-200 cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Remember & Forgot options */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="flex items-center justify-between pt-1 text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border-default bg-bg-subtle text-accent focus:ring-2 focus:ring-accent/20 accent-accent cursor-pointer"
                    />
                    <span>Recordarme</span>
                  </label>

                  <motion.button
                    type="button"
                    onClick={() => toast.info('Comunícate con soporte o tu administrador para restablecer tu clave.')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="font-bold text-text-tertiary hover:text-text-primary transition-colors duration-200 cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </motion.button>
                </motion.div>

                {/* Primary Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-2 btn-primary text-sm py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <span>Iniciar sesión</span>
                      <motion.span
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <ArrowRight className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.span>
                    </>
                  )}
                </motion.button>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className="relative my-4 flex items-center justify-center"
                >
                  <div className="w-full border-t border-border-default" />
                  <span className="bg-bg-canvas px-3 text-[11px] font-black uppercase tracking-wider text-text-muted absolute">
                    o continuar con
                  </span>
                </motion.div>

                {/* Google Sign-In Button */}
                <motion.a
                  href="/api/auth/google"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  whileHover={{ scale: 1.02, y: -2, boxShadow: '0 8px 30px -8px var(--shadow-color)' }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden w-full bg-surface-2 hover:bg-surface-3 border border-border-default hover:border-border-strong text-text-primary font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-2xs transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {/* Sweep light effect on hover */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent pointer-events-none"
                  />

                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="w-5 h-5 shrink-0 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </motion.div>
                  <motion.span
                    whileHover={{ color: 'var(--accent)' }}
                    transition={{ duration: 0.2 }}
                    className="group-hover:text-accent transition-colors duration-200"
                  >
                    Google
                  </motion.span>
                </motion.a>

                {/* Secondary Button: Crear barbería */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                >
                  <Link
                    href="/register"
                    className="w-full mt-2 btn-secondary text-sm py-4 flex items-center justify-center gap-2"
                  >
                    <motion.span whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                    <span>¿No tienes cuenta? Crear mi barbería</span>
                  </Link>
                </motion.div>
              </form>
            </motion.div>

            {/* Quick Demo Credentials (solo visible en entorno local de desarrollo) */}
            {process.env.NODE_ENV !== 'production' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 pt-6 border-t border-border-subtle"
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-3">
                  Accesos Rápidos de Prueba (Dev Only):
                </p>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    onClick={() => fillCredentials('admin@barberos.co', 'superadmin123')}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-accent/10 dark:bg-accent/15 hover:bg-accent/20 dark:hover:bg-accent/25 text-accent border border-accent/30 transition-all duration-200 cursor-pointer flex items-center gap-2"
                  >
                    <motion.span className="w-2 h-2 rounded-full bg-accent" />
                    <span>Super Admin</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => fillCredentials('admin@admin.com', 'admin123')}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-surface-3 hover:bg-surface-4 text-text-secondary border border-border-subtle transition-all duration-200 cursor-pointer flex items-center gap-2"
                  >
                    <motion.span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Dueño Demo</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => fillCredentials('julian@barber.com', 'barber123')}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-surface-3 hover:bg-surface-4 text-text-secondary border border-border-subtle transition-all duration-200 cursor-pointer flex items-center gap-2"
                  >
                    <motion.span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Barbero Demo</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              COLUMNA DERECHA: ILUSTRACIÓN & MOCKUP DEL SISTEMA
          ══════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:col-span-6 login-showcase-panel bg-gradient-to-br from-surface-1 via-bg-subtle to-surface-1 dark:from-bg-canvas dark:via-bg-subtle dark:to-bg-canvas border-l border-border-subtle p-10 flex-col justify-between relative overflow-hidden"
          >
            {/* Background subtle radial glow */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 right-0 w-80 h-80 bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
              className="absolute bottom-10 left-10 w-72 h-72 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl pointer-events-none"
            />

            <div className="relative z-10 space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass border-border-subtle text-[10px] font-black uppercase tracking-wider text-text-primary shadow-2xs"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                </motion.span>
                <span>Panel de Control BarberOS</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="text-xl sm:text-2xl font-black text-text-primary tracking-tight"
              >
                Todo tu negocio en una sola pantalla inteligente
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-sm text-text-secondary leading-relaxed"
              >
                Visualiza tus ingresos diarios, controla comisiones y confirma reservas en segundos sin perder ninguna cita.
              </motion.p>
            </div>

            {/* Mockup Card Floating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              whileHover={{ y: -4 }}
              className="relative z-10 my-6 glass card-elevated p-5 rounded-2xl space-y-4 backdrop-blur-sm"
            >
              {/* Header card preview */}
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="relative w-9 h-9 rounded-lg overflow-hidden border border-border-subtle shrink-0"
                  >
                    <Image
                      src="/logo.png"
                      alt="BarberOS"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-black text-text-primary">Barbería Elite SAS</h3>
                    <p className="text-[10px] text-text-tertiary">Panel Principal · En Línea</p>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-[10px] font-bold text-success"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span>Abierto Hoy</span>
                </motion.div>
              </div>

              {/* 3 Metrics Pills */}
              <div className="grid grid-cols-3 gap-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="p-3 rounded-xl bg-surface-2 border border-border-subtle"
                >
                  <div className="flex items-center justify-between text-text-tertiary mb-1">
                    <DollarSign className="w-4 h-4 text-success" aria-hidden="true" />
                    <span className="text-[9px] font-black text-success">+18%</span>
                  </div>
                  <div className="text-xs font-black text-text-primary">$540.000</div>
                  <div className="text-[9px] text-text-tertiary font-medium">Facturado hoy</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.44 }}
                  className="p-3 rounded-xl bg-surface-2 border border-border-subtle"
                >
                  <div className="flex items-center justify-between text-text-tertiary mb-1">
                    <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="text-[9px] font-black text-primary">14 citas</span>
                  </div>
                  <div className="text-xs font-black text-text-primary">92%</div>
                  <div className="text-[9px] text-text-tertiary font-medium">Ocupación</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.48 }}
                  className="p-3 rounded-xl bg-surface-2 border border-border-subtle"
                >
                  <div className="flex items-center justify-between text-text-tertiary mb-1">
                    <Users className="w-4 h-4 text-accent" aria-hidden="true" />
                    <span className="text-[9px] font-black text-accent">3 activos</span>
                  </div>
                  <div className="text-xs font-black text-text-primary">Equipo</div>
                  <div className="text-[9px] text-text-tertiary font-medium">Barberos</div>
                </motion.div>
              </div>

              {/* Upcoming Appointment Row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.52 }}
                whileHover={{ x: 4 }}
                className="p-3 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-text-primary border border-border-subtle text-text-inverse flex items-center justify-center text-[10px] font-black">
                    10:30
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary">Santiago Vélez</p>
                    <p className="text-[10px] text-text-tertiary">Corte + Barba · Barbero Carlos</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-md">
                  Confirmada
                </span>
              </motion.div>
            </motion.div>

            {/* Testimonial highlight pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="relative z-10 flex items-center gap-3 pt-3 border-t border-border-subtle"
            >
              <motion.div
                className="flex -space-x-1.5 overflow-hidden shrink-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <motion.img
                  src="/landing/testimonial-1.png"
                  alt="Barbero"
                  className="w-8 h-8 rounded-full ring-2 ring-bg-canvas dark:ring-bg-canvas object-cover"
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                />
                <motion.img
                  src="/landing/testimonial-2.png"
                  alt="Barbero"
                  className="w-8 h-8 rounded-full ring-2 ring-bg-canvas dark:ring-bg-canvas object-cover"
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                />
                <motion.img
                  src="/landing/testimonial-3.png"
                  alt="Barbero"
                  className="w-8 h-8 rounded-full ring-2 ring-bg-canvas dark:ring-bg-canvas object-cover"
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.65 }}
                className="text-xs text-text-secondary font-medium"
              >
                Más de <span className="font-black text-text-primary">500 barberías</span> confían en BarberOS diariamente.
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>

      {/* Bottom Footer Note */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-text-tertiary"
      >
        <p>© {new Date().getFullYear()} BarberOS. Plataforma de Gestión Integral para Barberías.</p>
      </motion.footer>
    </div>
  )
}