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
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    step: '02',
    icon: Scissors,
    title: 'Configura servicios y barberos',
    desc: 'Ingresa los cortes y combos con sus precios, y añade a tu equipo de barberos con sus porcentajes de comisión acordados.',
    badge: 'Personalizable',
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  {
    step: '03',
    icon: Share2,
    title: 'Comparte tu link de reservas',
    desc: 'Copia tu enlace web oficial y colócalo en tu bio de Instagram, estados de WhatsApp y Google Maps para que tus clientes agenden solos.',
    badge: '24/7 Autónomo',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'Gestiona y haz crecer tu negocio',
    desc: 'Monitorea las citas en vivo, haz el cierre de caja diario sin descuadres y liquida comisiones transparentes con un solo clic.',
    badge: 'Control Total',
    color: 'bg-amber-50 text-amber-600 border-amber-200'
  }
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-zinc-50/70 border-t border-zinc-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="uppercase tracking-wider">Implementación Inmediata</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Comienza a operar como una franquicia moderna en 4 pasos
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Sin instalaciones complejas ni capacitaciones interminables. BarberOS está listo para usar desde el primer día.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-7 border border-zinc-200/90 shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all flex flex-col justify-between space-y-6 relative group"
              >
                <div className="space-y-4">
                  {/* Step Number & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-zinc-300 font-mono group-hover:text-zinc-950 transition-colors">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                      {item.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-black text-zinc-950 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Configuración guiada</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Quick CTA Banner */}
        <div className="mt-14 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider px-8 py-4 rounded-2xl shadow-xl shadow-zinc-950/15 transition-all active:scale-95 group"
          >
            <span>Crear mi Barbería en 2 Minutos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  )
}
