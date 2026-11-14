'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react'

const testimonials = [
  {
    name: 'Carlos Ruiz',
    role: 'Demostración de Rol: Administrador',
    business: 'Caso Práctico: Barbería Urbana',
    city: 'Control de Comisiones',
    avatar: '/landing/testimonial-1.png',
    rating: 5,
    quote: 'La transparencia con las comisiones es fundamental: cada barbero entra a su enlace privado y consulta al instante sus servicios prestados y el saldo acumulado en el día sin necesidad de cuadernos manuales.',
    highlight: 'Liquidación Transparente de Comisiones'
  },
  {
    name: 'Mateo Valencia',
    role: 'Demostración de Rol: Propietario',
    business: 'Caso Práctico: Gestión Multisede',
    city: 'Arqueo de Caja',
    avatar: '/landing/testimonial-2.png',
    rating: 5,
    quote: 'El arqueo de caja ciego obliga a realizar el conteo físico del efectivo antes de comparar con el sistema, protegiendo las finanzas del negocio y evitando inconsistencias entre turnos.',
    highlight: 'Caja Ciega y Cuadre Diario'
  },
  {
    name: 'Julián Mendoza',
    role: 'Demostración de Rol: Barbero',
    business: 'Caso Práctico: Agenda Digital',
    city: 'Autogestión de Horarios',
    avatar: '/landing/testimonial-3.png',
    rating: 5,
    quote: 'Los clientes pueden ingresar al enlace público del negocio y agendar sus citas en tiempo real según la disponibilidad de cada profesional, sin llamadas ni demoras de respuesta.',
    highlight: 'Reservas en Línea 24/7'
  },
  {
    name: 'Alejandro Morales',
    role: 'Demostración de Rol: Dueño de Barbería',
    business: 'Caso Práctico: Integración WhatsApp',
    city: 'Recordatorios Automatizados',
    avatar: '/landing/testimonial-4.png',
    rating: 5,
    quote: 'Las confirmaciones y recordatorios automáticos por WhatsApp reducen de manera drástica las inasistencias y permiten reprogramar turnos con anticipación.',
    highlight: 'Menos Inasistencias con WhatsApp'
  },
]

export default function Testimonials() {
  const [index, setIndex] = useState(0)

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % testimonials.length)
  }

  const t = testimonials[index]

  return (
    <section
      id="testimonios"
      className="py-20 md:py-28 relative overflow-hidden bg-zinc-50/50 dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="testimonials-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Demostración de Casos Prácticos</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Escenarios de Gestión</span>
          </div>

          <h2
            id="testimonials-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Cómo BarberOS resuelve los retos diarios de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              tu barbería.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Ejemplos y flujos típicos diseñados para garantizar orden administrativo, control financiero y puntualidad operativa.
          </p>
        </motion.div>

        {/* Big Testimonial Feature Card */}
        <div className="liquid-glass max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
          <Quote className="w-24 h-24 text-zinc-200 dark:text-white/[0.04] absolute -top-4 -right-4 pointer-events-none" aria-hidden="true" />

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 relative z-10"
            >
              {/* Highlight Tag & Rating */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 rounded-full">
                  {t.highlight}
                </span>

                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Quote Text */}
              <blockquote className="text-lg sm:text-xl lg:text-2xl font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed italic">
                "{t.quote}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center justify-between pt-6 border-t border-zinc-200/80 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-500/30 shadow-md">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-zinc-950 dark:text-white leading-tight">
                      {t.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                      {t.role} · <strong className="text-zinc-700 dark:text-zinc-300">{t.business}</strong> ({t.city})
                    </p>
                  </div>
                </div>

                {/* Navigation arrows */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    aria-label="Testimonio anterior"
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] active:scale-[0.95] text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer border border-zinc-200 dark:border-white/10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Siguiente testimonio"
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] active:scale-[0.95] text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer border border-zinc-200 dark:border-white/10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir al testimonio ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  index === i ? 'w-8 bg-amber-500' : 'w-2 bg-zinc-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
