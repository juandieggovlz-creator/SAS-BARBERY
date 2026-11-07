'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  UserCheck,
  DollarSign,
  Receipt,
  Users,
  Scissors,
  BarChart3,
  Globe,
  Clock,
  Percent,
  Sparkles,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  MessageSquare,
  QrCode,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react'
import Link from 'next/link'

export default function FeatureBento() {
  return (
    <section
      id="caracteristicas"
      className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="bento-title"
    >
      {/* Background radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Arsenal Tecnológico</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Diseñado para Barberías</span>
          </div>

          <h2
            id="bento-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Las herramientas que hacen crecer a las{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              barberías líderes.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Cada módulo fue diseñado resolviendo los problemas reales de caja, comisiones, citas y fidelización en el día a día.
          </p>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════
            BENTO GRID (LINEAR / APPLE STYLE)
        ═════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ───────────────────────────────────────────────────────────
              BENTO 1: CIERRE DE CAJA CIEGO (Span 8)
          ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass lg:col-span-8 p-7 sm:p-9 rounded-3xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Blindaje Anti-Fugas
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                  Cierre de Caja Ciego con Arqueo Automático
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl leading-relaxed">
                  El cajero o recepcionista ingresa el dinero físico contado sin ver el balance del sistema. Si falta o sobra dinero, el sistema lo audita y alerta al dueño inmediatamente.
                </p>
              </div>
            </div>

            {/* Simulated Receipt Component */}
            <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-white/[0.04] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Efectivo en Caja</p>
                <p className="text-base font-black text-zinc-950 dark:text-white mt-1">$720.000 COP</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓ Cuadre exacto</p>
              </div>

              <div className="bg-white dark:bg-white/[0.04] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Nequi & Daviplata</p>
                <p className="text-base font-black text-zinc-950 dark:text-white mt-1">$560.000 COP</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">14 comprobantes</p>
              </div>

              <div className="bg-white dark:bg-white/[0.04] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Datáfono / Tarjetas</p>
                <p className="text-base font-black text-zinc-950 dark:text-white mt-1">$200.000 COP</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Voucher auditado</p>
              </div>
            </div>
          </motion.div>

          {/* ───────────────────────────────────────────────────────────
              BENTO 2: PORTAL MÓVIL BARBERO (Span 4)
          ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass lg:col-span-4 p-7 sm:p-9 rounded-3xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-black">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Acceso Privado PIN
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                  Portal en el Celular de Cada Barbero
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Cada profesional consulta su agenda, clientes del día y dinero ganado en tiempo real sin ver las finanzas privadas de la barbería.
                </p>
              </div>
            </div>

            {/* Barbero Live Pocket Card */}
            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-950 dark:text-white">Carlos Ruiz · Barbero</span>
                <span className="text-emerald-500 font-bold">● En sillón</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-[11px] text-zinc-400">Comisión Acumulada</span>
                <span className="text-lg font-black text-amber-500">$220.000</span>
              </div>
            </div>
          </motion.div>

          {/* ───────────────────────────────────────────────────────────
              BENTO 3: WHATSAPP BOT AUTÓNOMO (Span 4)
          ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass lg:col-span-4 p-7 sm:p-9 rounded-3xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Cero Ausencias
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                  Recordatorios Automáticos por WhatsApp
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  El sistema envía la confirmación con fecha, hora y enlace de cancelación con anticipación. Reduce las inasistencias hasta en un 85%.
                </p>
              </div>
            </div>

            {/* Simulated WhatsApp Notification Bubble */}
            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/10">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  <span>BarberOS WhatsApp Bot</span>
                  <span>10:45 AM</span>
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 text-xs font-medium">
                  💈 ¡Hola Juan! Tu cita de Fade + Barba quedó confirmada hoy a las 4:30 PM.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ───────────────────────────────────────────────────────────
              BENTO 4: AGENDA MULTI-BARBERO (Span 8)
          ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass lg:col-span-8 p-7 sm:p-9 rounded-3xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-black">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Columnas en Tiempo Real
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                  Agenda Inteligente Multi-Sillón Sincronizada
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl leading-relaxed">
                  Visualiza a todo tu equipo en columnas dinámicas. Configura duración de cada servicio, pausas de almuerzo y bloqueos de emergencia en segundos.
                </p>
              </div>
            </div>

            {/* Multi-Chair Visual Mockup */}
            <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-white/[0.04] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Sillón 1 · Carlos</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">En corte</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Low Fade + Barba (45 min)</p>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[70%]" />
                </div>
              </div>

              <div className="bg-white dark:bg-white/[0.04] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Sillón 2 · Mateo</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">Terminado</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Corte Clásico (30 min)</p>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>
              </div>

              <div className="bg-white dark:bg-white/[0.04] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Sillón 3 · Julián</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500">Disponible</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Próxima cita a las 5:00 PM</p>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-0" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ───────────────────────────────────────────────────────────
              BENTO 5: WEB OFICIAL DE RESERVAS (Span 4)
          ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass lg:col-span-4 p-7 sm:p-9 rounded-3xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Enlace de Instagram
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                  Página Web Oficial en 3 Minutos
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Comparte tu enlace oficial en redes sociales y Google Maps. Tus clientes reservan en 3 clics sin descargar aplicaciones.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between text-xs bg-white dark:bg-white/[0.04] p-3 rounded-xl border border-zinc-200/80 dark:border-white/5 font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">barberos.app/tu-barberia</span>
              <span className="text-amber-500 font-bold">24/7 ACTIVO</span>
            </div>
          </motion.div>

          {/* ───────────────────────────────────────────────────────────
              BENTO 6: LIQUIDACIÓN DE COMISIONES (Span 4)
          ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass lg:col-span-4 p-7 sm:p-9 rounded-3xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-black">
                  <Percent className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Transparencia Total
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                  Cálculo Automático de Comisiones
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Configura porcentajes individuales por barbero (ej. 40%, 45%, 50%). Liquidaciones quincenales exactas en 1 solo clic.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/10 bg-white dark:bg-white/[0.04] p-3 rounded-xl border border-zinc-200/80 dark:border-white/5 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-zinc-600 dark:text-zinc-300">Corte + Barba ($50.000)</span>
                <span className="text-emerald-500">45% / 55%</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Barbero: $22.500 COP · Barbería: $27.500 COP
              </p>
            </div>
          </motion.div>

          {/* ───────────────────────────────────────────────────────────
              BENTO 7: CRM & HISTORIAL VIP DE CLIENTES (Span 4)
          ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass lg:col-span-4 p-7 sm:p-9 rounded-3xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-black">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Fidelización VIP
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                  Directorio & Ficha de Clientes
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Historial de visitas, fotos del corte preferido, teléfono con acceso directo a WhatsApp y notas personalizadas.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/10 bg-white dark:bg-white/[0.04] p-3 rounded-xl border border-zinc-200/80 dark:border-white/5 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-950 dark:text-white">Andrés Silva</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">12 visitas · Low Fade Navaja</p>
              </div>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Cliente VIP
              </span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  )
}
