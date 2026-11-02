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
  Users
} from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-zinc-50/60 to-white">
      {/* Subtle Grid Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#000000 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Decorative ambient radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-amber-200/20 via-blue-200/20 to-emerald-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(85vh-5rem)]">
          
          {/* ═══════════════════════════════════════════════════════
              LADO IZQUIERDO: TEXTO & CONVERSIÓN
          ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-wide">Plataforma Todo-en-Uno para Barberías</span>
            </motion.div>

            {/* Powerful Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 leading-[1.08]"
            >
              La forma profesional de gestionar tu{' '}
              <span className="relative inline-block text-zinc-950">
                barbería.
                <span className="absolute left-0 bottom-1.5 w-full h-2.5 bg-amber-300/40 -z-10 rounded-sm" />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-xl"
            >
              Reservas online, finanzas en tiempo real, comisiones automáticas para tus barberos, control de clientes y página web oficial en un solo lugar.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-black uppercase tracking-wider px-7 py-4 rounded-2xl shadow-xl shadow-zinc-950/20 transition-all active:scale-95 group text-center"
              >
                <span>Crear Barbería Gratis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#sistema"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200/90 text-sm font-bold uppercase tracking-wider px-6 py-4 rounded-2xl shadow-2xs transition-all text-center"
              >
                <Play className="w-4 h-4 fill-zinc-900" />
                <span>Ver Demostración</span>
              </a>
            </motion.div>

            {/* Trust points */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4 border-t border-zinc-200/60 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-500 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Prueba gratis 14 días</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Configuración en 3 min</span>
              </div>
            </motion.div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2 overflow-hidden items-center">
                {[
                  { src: '/landing/testimonial-1.png', alt: 'Barbero Carlos' },
                  { src: '/landing/testimonial-2.png', alt: 'Barbero Mateo' },
                  { src: '/landing/testimonial-3.png', alt: 'Barbero Julián' },
                  { src: '/landing/testimonial-4.png', alt: 'Barbero Alejandro' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="relative h-9 w-9 rounded-full ring-2 ring-white overflow-hidden bg-zinc-900 shadow-sm shrink-0"
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="font-black text-zinc-900 ml-1">4.9/5</span>
                </div>
                <p className="text-zinc-500 text-[11px] font-medium">+500 barberías organizadas con BarberOS</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              LADO DERECHO: MOCKUP MULTICAPA CON PROFUNDIDAD REAL
          ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto w-full max-w-2xl lg:max-w-none"
            >
              {/* Backglow glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-zinc-500/5 to-emerald-500/10 rounded-3xl blur-2xl transform scale-105 -z-10" />

              {/* Main Window Frame: Admin Dashboard */}
              <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xl shadow-zinc-950/10 dark:shadow-black/50 overflow-hidden relative">
                {/* Browser Header Bar */}
                <div className="bg-zinc-100/90 dark:bg-[#18181d] px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 shadow-2xs">
                    <span className="text-zinc-400">https://</span>
                    <span className="font-bold text-zinc-900 dark:text-white">barberos.app/dashboard</span>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Dashboard Image View */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-50 dark:bg-[#0c0c0e]">
                  {/* Light Mode Mockup */}
                  <Image
                    src="/landing/dashboard-admin.jpg"
                    alt="BarberOS Dashboard Administrador"
                    fill
                    className="object-cover object-top dark:hidden"
                    priority
                    loading="eager"
                    unoptimized
                  />
                  {/* Dark Mode Mockup */}
                  <Image
                    src="/landing/dashboard-admin-dark.jpg"
                    alt="BarberOS Dashboard Administrador Modo Oscuro"
                    fill
                    className="object-cover object-top hidden dark:block"
                    priority
                    loading="eager"
                    unoptimized
                  />
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────
                  FLOATING LAYER 1: Portal del Barbero (Tarjeta en perspectiva)
              ─────────────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: 30, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="animate-float hidden sm:block absolute -top-8 -right-6 lg:-right-8 w-72 bg-zinc-950 text-white rounded-2xl p-4 border border-zinc-800 shadow-2xl shadow-black/40 z-20 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black text-white">
                      CR
                    </div>
                    <div>
                      <p className="text-xs font-black leading-tight text-white">Carlos Ruiz</p>
                      <p className="text-[10px] text-zinc-400">Master Fade · 40% com.</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    🟢 En Turno
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Comisión Hoy</p>
                    <p className="text-lg font-black text-amber-400">$220,000</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Citas Hoy</p>
                    <p className="text-lg font-black text-white">10 turnos</p>
                  </div>
                </div>
              </motion.div>

              {/* ───────────────────────────────────────────────────────────
                  FLOATING LAYER 2: Balance de Caja en Tiempo Real
              ─────────────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: -30, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="animate-float-delayed absolute -bottom-6 -left-4 sm:-left-8 bg-white/95 dark:bg-[#151518]/95 backdrop-blur-md rounded-2xl p-4 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl shadow-zinc-950/15 dark:shadow-black/60 z-20 max-w-[260px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30 flex items-center justify-center font-black">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Caja Diaria</span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded-md">✓ Cuadrada</span>
                    </div>
                    <p className="text-xl font-black text-zinc-950 dark:text-white mt-0.5">$1,480,000</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Efectivo + Transferencias</p>
                  </div>
                </div>
              </motion.div>

              {/* ───────────────────────────────────────────────────────────
                  FLOATING LAYER 3: Notificación de Nueva Reserva Online
              ─────────────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="hidden md:flex absolute -bottom-8 right-8 bg-zinc-900 text-white rounded-2xl px-4 py-3 border border-zinc-800 shadow-2xl shadow-black/30 z-20 items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reserva Web 24/7</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-white">Juan Pérez · Combo Elite (15:30)</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
