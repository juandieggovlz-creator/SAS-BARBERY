'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  Smartphone
} from 'lucide-react'

const trustBadges = [
  { icon: Shield, label: 'Seguro y Privado', color: 'text-blue-500' },
  { icon: Zap, label: 'Tiempo Real', color: 'text-amber-500' },
  { icon: TrendingUp, label: 'Control Financiero', color: 'text-emerald-500' },
  { icon: Users, label: 'Multisedes VIP', color: 'text-purple-500' },
]

const features = [
  { icon: Calendar, label: 'Reservas 24/7', desc: 'Tu agenda siempre llena' },
  { icon: DollarSign, label: 'Caja Automática', desc: 'Cierre diario en 1 clic' },
  { icon: Scissors, label: 'Comisiones Auto', desc: 'Paga a barberos sin errores' },
  { icon: ShieldCheck, label: 'Clientes VIP', desc: 'Historial y fidelización' },
]

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-zinc-50/50 to-white dark:from-[#070709] dark:via-zinc-950/60 dark:to-[#070709] transition-colors duration-300" id="inicio">
      {/* Subtle Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Decorative ambient radial glows - Light mode */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-b from-amber-400/20 via-amber-200/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10 dark:hidden"
        aria-hidden="true"
      />

      {/* Decorative ambient radial glows - Dark mode */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-b from-amber-500/15 via-amber-900/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10 hidden dark:block"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(85vh-4rem)]">

          {/* ═══════════════════════════════════════════════════════
              LADO IZQUIERDO: TEXTO & CONVERSIÓN
          ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 space-y-7 pt-4 text-left">
            {/* Pill Badge - Animated Entrance */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-wide">Plataforma Todo-en-Uno para Barberías</span>
            </motion.div>

            {/* Powerful Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.08]"
            >
              La forma profesional de gestionar tu{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-400 dark:to-amber-200">
                barbería.
              </span>
            </motion.h1>

            {/* Subtitle - High readability */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-xl"
            >
              Reservas online 24/7, finanzas en tiempo real, comisiones automáticas para tus barberos, control de clientes y página web oficial en un solo lugar.
            </motion.p>

            {/* CTAs - Tactile Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-zinc-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all text-center group cursor-pointer"
              >
                <span>Crear Mi Barbería Gratis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#sistema"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] text-zinc-800 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-800 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all text-center group"
              >
                <Play className="w-4 h-4 text-amber-500" />
                <span>Ver Demostración</span>
              </a>
            </motion.div>

            {/* Trust Points */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.48 }}
              className="pt-3 border-t border-zinc-200/70 dark:border-zinc-800/80 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-zinc-600 dark:text-zinc-400 font-medium"
            >
              {[
                'Prueba gratis 14 días',
                'Sin tarjeta de crédito',
                'Configuración en 3 minutos',
                'Cancelas cuando quieras'
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex items-center gap-3.5 pt-1"
            >
              <div className="flex -space-x-2 overflow-hidden items-center">
                {[
                  { src: '/landing/testimonial-1.png', alt: 'Carlos Ruiz' },
                  { src: '/landing/testimonial-2.png', alt: 'Mateo Silva' },
                  { src: '/landing/testimonial-3.png', alt: 'Julián Ortiz' },
                  { src: '/landing/testimonial-4.png', alt: 'Alejandro Mora' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="relative h-9 w-9 rounded-full ring-2 ring-white dark:ring-zinc-900 overflow-hidden shrink-0 shadow-sm"
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
                  <span className="font-extrabold text-zinc-900 dark:text-white ml-1">4.9/5</span>
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
              transition={{ duration: 0.5, delay: 0.65 }}
              className="hidden sm:flex flex-wrap gap-2.5 pt-2"
            >
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  <badge.icon className={`w-3.5 h-3.5 ${badge.color}`} />
                  <span>{badge.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              LADO DERECHO: MOCKUP MULTICAPA CON PROFUNDIDAD REAL
          ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-2xl"
            >
              {/* Ambient glow behind main mockup */}
              <div
                className="absolute inset-0 bg-gradient-to-tr from-amber-500/15 via-transparent to-emerald-500/10 rounded-3xl blur-2xl transform scale-105 -z-10"
                aria-hidden="true"
              />

              {/* Main Window Frame: Admin Dashboard */}
              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl">
                {/* Browser Header Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 shadow-xs">
                    <span className="text-zinc-400">https://</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">barberos.app/dashboard</span>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Dashboard Image View */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {/* Light Mode Mockup */}
                  <Image
                    src="/landing/dashboard-admin.jpg"
                    alt="BarberOS Dashboard Administrador"
                    fill
                    className="object-cover object-top dark:hidden"
                    priority
                    sizes="(max-width: 1024px) 100vw, 600px"
                  />
                  {/* Dark Mode Mockup */}
                  <Image
                    src="/landing/dashboard-admin-dark.jpg"
                    alt="BarberOS Dashboard Administrador Modo Oscuro"
                    fill
                    className="object-cover object-top hidden dark:block"
                    priority
                    sizes="(max-width: 1024px) 100vw, 600px"
                  />
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────
                  FLOATING LAYER 1: Portal del Barbero (Tarjeta en perspectiva)
              ─────────────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: 25, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="hidden xl:block absolute -top-6 -right-6 w-72 z-20"
              >
                <div className="p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">
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

                  <div className="pt-3 grid grid-cols-2 gap-2">
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Comisión Hoy</p>
                      <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">$220.000</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-2.5 text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Citas Hoy</p>
                      <p className="text-lg font-black text-zinc-950 dark:text-white mt-0.5">10 turnos</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ───────────────────────────────────────────────────────────
                  FLOATING LAYER 2: Balance de Caja en Tiempo Real
              ─────────────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: -25, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="hidden xl:block absolute -bottom-6 -left-6 z-20"
              >
                <div className="p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 shadow-xl max-w-[260px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Caja Diaria</span>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">✓ Cuadrada</span>
                      </div>
                      <p className="text-xl font-black text-zinc-950 dark:text-white mt-0.5">$1.480.000</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Efectivo + Transferencias</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature Pills for Mobile */}
              <div className="lg:hidden mt-6 grid grid-cols-2 gap-2.5">
                {features.map((feature) => (
                  <div
                    key={feature.label}
                    className="p-3.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 text-center shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-zinc-950 dark:text-white">{feature.label}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
