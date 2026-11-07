'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Building2, Scissors, Share2, TrendingUp, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    step: '01',
    icon: Building2,
    title: 'Registra tu barbería',
    desc: 'Crea tu cuenta en menos de 2 minutos con el nombre de tu barbería, ciudad y contacto. No requieres tarjeta de crédito para iniciar.',
    badge: '2 minutos',
    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
  },
  {
    step: '02',
    icon: Scissors,
    title: 'Configura servicios y barberos',
    desc: 'Ingresa los cortes y combos con sus precios, y añade a tu equipo de barberos con sus porcentajes de comisión acordados.',
    badge: 'Personalizable',
    color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20'
  },
  {
    step: '03',
    icon: Share2,
    title: 'Comparte tu link de reservas',
    desc: 'Copia tu enlace web oficial y colócalo en tu bio de Instagram, estados de WhatsApp y Google Maps para que tus clientes agenden solos.',
    badge: '24/7 Autónomo',
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'Gestiona y escala tu negocio',
    desc: 'Monitorea las citas en vivo, haz el cierre de caja diario sin descuadres y liquida comisiones transparentes con un solo clic.',
    badge: 'Control Total',
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20'
  }
]

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="py-20 md:py-28 relative overflow-hidden bg-zinc-50/50 dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="how-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Implementación Inmediata</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Sin Complicaciones</span>
          </div>

          <h2
            id="how-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Comienza a operar como una franquicia moderna en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              4 sencillos pasos.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Sin instalaciones complejas ni capacitaciones interminables. BarberOS está listo para operar desde tu celular o computador en minutos.
          </p>
        </motion.div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="liquid-glass p-7 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-amber-500/80 font-mono">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/5">
                      {item.badge}
                    </span>
                  </div>

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
