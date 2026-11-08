'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Play,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Scissors,
  DollarSign,
  Clock,
  Star,
  Users,
  Zap,
  Shield,
  Smartphone,
  ChevronRight
} from 'lucide-react'

const trustBadges = [
  { icon: Shield, label: 'Seguro y Privado', color: 'text-amber-500 dark:text-amber-400' },
  { icon: Zap, label: 'Tiempo Real', color: 'text-emerald-500 dark:text-emerald-400' },
  { icon: TrendingUp, label: 'Control Financiero', color: 'text-blue-500 dark:text-blue-400' },
  { icon: Users, label: 'Multisede VIP', color: 'text-purple-500 dark:text-purple-400' },
]

// Word-by-word blur-in entrance for the headline
const headlineWords = [
  'El',
  'sistema',
  'operativo',
  'de',
  'las',
]

export default function Hero() {
  const { scrollY } = useScroll()
  const yHeroGlow = useTransform(scrollY, [0, 800], [0, 150])
  const yCockpitParallax = useTransform(scrollY, [0, 800], [0, -30])

  return (
    <section
      id="inicio"
      className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-zinc-50/70 to-white dark:from-[#050608] dark:via-[#08090f] dark:to-[#050608] transition-colors duration-300"
    >
      {/* Precision Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      {/* Atmospheric MotionSites Dual Ambient Spotlights with Parallax */}
      <motion.div style={{ y: yHeroGlow }} className="pointer-events-none -z-10">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[550px] bg-gradient-to-b from-amber-400/20 via-amber-200/5 to-transparent rounded-full blur-3xl pointer-events-none dark:hidden"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[550px] bg-gradient-to-b from-amber-500/15 via-amber-900/10 to-transparent rounded-full blur-3xl pointer-events-none hidden dark:block"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 right-10 w-[500px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none hidden dark:block"
          aria-hidden="true"
        />
      </motion.div>

      {/* Vertical Subtle Guide Lines (MotionSites Signature) */}
      <div className="hidden 2xl:block pointer-events-none absolute inset-y-0 left-1/2 -translate-x-[calc(50%+42rem)] w-px bg-zinc-200/60 dark:bg-white/[0.04] z-0" />
      <div className="hidden 2xl:block pointer-events-none absolute inset-y-0 left-1/2 translate-x-[calc(-50%+42rem)] w-px bg-zinc-200/60 dark:bg-white/[0.04] z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(86vh-4rem)]">

          {/* ═══════════════════════════════════════════════════════
              LADO IZQUIERDO: EDITORIAL HEADLINE & CONVERSIÓN
          ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 space-y-7 pt-2 text-left">
            {/* Pill Badge - Animated Entrance */}
            <motion.div
              initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300 shadow-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="tracking-wide uppercase font-black text-[10px]">BarberOS</span>
              <span className="text-zinc-400 dark:text-zinc-600">|</span>
              <span className="tracking-tight text-xs font-medium">El estándar de las barberías de élite</span>
            </motion.div>

            {/* Powerful Word-by-Word Blur-In Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-[-0.035em] text-zinc-950 dark:text-white leading-[1.06]">
              <span className="inline-flex flex-wrap gap-x-3.5">
                {headlineWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.6,
                      delay: 0.15 + i * 0.08,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>{' '}
              <motion.span
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 dark:from-amber-300 dark:via-amber-100 dark:to-amber-400 animate-shiny"
              >
                barberías de élite.
              </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-xl"
            >
              Agenda multi-barbero en tiempo real, liquidación de comisiones al centavo, cierre de caja ciego anti-fugas y página web oficial de reservas en 3 minutos. Todo en una sola pantalla profesional.
            </motion.p>

            {/* Tactile CTAs with Emil Kowalski & MotionSites Active Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-zinc-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all text-center group cursor-pointer"
              >
                <span>Crear Mi Barbería Gratis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#sistema"
                className="liquid-glass inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-full text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] active:scale-[0.97] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all text-center group"
              >
                <Play className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Explorar Demostración</span>
              </a>
            </motion.div>

            {/* Micro-Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              className="pt-3 border-t border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-zinc-600 dark:text-zinc-400 font-medium"
            >
              {[
                'Prueba gratis 14 días',
                'Sin tarjeta de crédito',
                'Listo en 3 minutos',
                'Cancela cuando quieras'
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* Colombian Social Proof Badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
              className="flex items-center gap-3.5 pt-1"
            >
              <div className="flex -space-x-2 overflow-hidden items-center">
                {[
                  { src: '/landing/testimonial-1.png', alt: 'Carlos Ruiz - Medellín' },
                  { src: '/landing/testimonial-2.png', alt: 'Mateo Valencia - Cali' },
                  { src: '/landing/testimonial-3.png', alt: 'Julián Mendoza - Bucaramanga' },
                  { src: '/landing/testimonial-4.png', alt: 'Alejandro Morales - Bogotá' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="relative h-9 w-9 rounded-full ring-2 ring-white dark:ring-[#08090f] overflow-hidden shrink-0 shadow-sm"
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="font-extrabold text-zinc-950 dark:text-white ml-1">4.9/5</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium mt-0.5">
                  Más de 500 barberías organizadas en Colombia
                </p>
              </div>
            </motion.div>

            {/* Trust Badges Row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.05 }}
              className="hidden sm:flex flex-wrap gap-2.5 pt-2"
            >
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="liquid-glass flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  <badge.icon className={`w-3.5 h-3.5 ${badge.color}`} />
                  <span>{badge.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              LADO DERECHO: COMMAND CENTER 3D COCKPIT
          ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 relative">
            <motion.div
              style={{ y: yCockpitParallax }}
              initial={{ opacity: 0, scale: 0.94, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-2xl"
            >
              {/* Backlight halo glow */}
              <div
                className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-emerald-500/15 rounded-3xl blur-2xl transform scale-105 -z-10"
                aria-hidden="true"
              />

              {/* Main Admin Dashboard Frame */}
              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#0c0e14] border border-zinc-200/90 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)]">
                {/* Browser macOS Top Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100/90 dark:bg-[#12151e] border-b border-zinc-200/80 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-[#0c0e14] border border-zinc-200/90 dark:border-white/10 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 shadow-xs">
                    <span className="text-zinc-400">https://</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">barberos.app/dashboard</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>EN VIVO</span>
                  </div>
                </div>

                {/* Native High-DPI Dashboard Cockpit View */}
                <div className="p-4 sm:p-5 bg-[#090b10] text-zinc-100 select-none font-sans space-y-3.5">
                  {/* Top Stats Strip */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                      <p className="text-[9px] uppercase font-bold text-zinc-400">Ventas Hoy</p>
                      <p className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5">$1.840.000</p>
                      <p className="text-[9px] text-emerald-400 font-medium">↑ +24.5% vs ayer</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                      <p className="text-[9px] uppercase font-bold text-zinc-400">Citas Hoy</p>
                      <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">38 <span className="text-[10px] text-zinc-400 font-normal">/ 42</span></p>
                      <p className="text-[9px] text-emerald-400 font-medium">90.4% asistencia</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                      <p className="text-[9px] uppercase font-bold text-zinc-400">Sillones</p>
                      <p className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5">3 / 3</p>
                      <p className="text-[9px] text-emerald-400 font-medium">100% capacidad</p>
                    </div>
                  </div>

                  {/* 3 Live Barber Agenda Columns Preview */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Monitoreo de Sillones en Vivo</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Sincronizado
                      </span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Barber 1 */}
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-emerald-500/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Carlos Ruiz</span>
                          <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">En Sillón</span>
                        </div>
                        <p className="text-[11px] font-medium text-zinc-300 truncate">Andrés Gómez · Skin Fade</p>
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: '70%' }} />
                        </div>
                      </div>

                      {/* Barber 2 */}
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-emerald-500/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Mateo Valencia</span>
                          <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">En Sillón</span>
                        </div>
                        <p className="text-[11px] font-medium text-zinc-300 truncate">Luis Martínez · Combo VIP</p>
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: '85%' }} />
                        </div>
                      </div>

                      {/* Barber 3 */}
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-amber-500/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Julián Fade</span>
                          <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">Color</span>
                        </div>
                        <p className="text-[11px] font-medium text-zinc-300 truncate">Sebastián Mora · Platinado</p>
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: '45%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cockpit Bottom Micro Telemetry */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Arqueo de caja: $0 descuadre
                    </span>
                    <span className="text-amber-400 font-bold">Próxima cita en 12 min</span>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────
                  COMPANION TELEMETRY DECK: Zero collisions, 100% clean
              ─────────────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5"
              >
                {/* Card 1: Portal Barbero */}
                <div className="liquid-glass p-3.5 rounded-2xl shadow-lg border border-zinc-200/80 dark:border-white/10 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[11px] font-black">
                        CR
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-950 dark:text-white leading-tight">Carlos Ruiz</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Master Fade · 40% com.</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      En Turno
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Comisión Hoy</p>
                      <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">$232.000 COP</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Citas Hoy</p>
                      <p className="text-base font-black text-zinc-950 dark:text-white font-mono mt-0.5">14 turnos</p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Balance de Caja */}
                <div className="liquid-glass p-3.5 rounded-2xl shadow-lg border border-zinc-200/80 dark:border-white/10 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Arqueo Diario</span>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                          ✓ Cuadrada
                        </span>
                      </div>
                      <p className="text-base font-black text-zinc-950 dark:text-white font-mono mt-0.5">$1.840.000 COP</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Efectivo + Pagos Digitales + Tarjetas</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
