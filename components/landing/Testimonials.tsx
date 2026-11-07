'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react'

const testimonials = [
  {
    name: 'Carlos "The Blade" Ruiz',
    role: 'Master Barber & Administrador',
    business: 'Barbería Elite SAS',
    city: 'Medellín (El Poblado)',
    avatar: '/landing/testimonial-1.png',
    rating: 5,
    quote: 'Lo mejor es la transparencia con las comisiones. Antes teníamos discusiones quincenales porque algún corte no se había anotado en la libreta. Ahora cada barbero entra a su enlace privado y ve exactamente qué ha ganado. Cero estrés.',
    highlight: 'Cero discusiones de comisiones'
  },
  {
    name: 'Mateo Valencia',
    role: 'Dueño de 2 Sedes',
    business: 'Vintage Cuts Studio',
    city: 'Cali (Granada)',
    avatar: '/landing/testimonial-2.png',
    rating: 5,
    quote: 'El cierre de caja ciego es una genialidad. El cajero cuenta el dinero y el sistema le dice si cuadra o no sin mostrarle el número de antemano. Se acabaron los descuadres misteriosos de plata.',
    highlight: 'Cajas siempre cuadradas'
  },
  {
    name: 'Julián Mendoza',
    role: 'Fade Specialist & Socio',
    business: 'La Barbería Urbana',
    city: 'Bucaramanga',
    avatar: '/landing/testimonial-3.png',
    rating: 5,
    quote: 'Mis clientes reservan desde la bio de Instagram en segundos sin tener que esperar a que alguien les conteste por chat. La agenda se llena sola.',
    highlight: 'Reservas 100% automáticas'
  },
  {
    name: 'Alejandro Morales',
    role: 'Propietario Fundador',
    business: 'The Gentlemen Club Barbershop',
    city: 'Bogotá (Zona Rosa)',
    avatar: '/landing/testimonial-4.png',
    rating: 5,
    quote: 'Antes perdíamos al menos 5 citas al día porque tardábamos en responder el WhatsApp. Desde que activamos BarberOS con el link en Instagram, los clientes agendan solos a cualquier hora. Mi facturación subió más de un 40% en 3 meses.',
    highlight: '+40% en facturación'
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
    <section id="testimonios" className="py-20 md:py-28 relative overflow-hidden bg-zinc-50/50 dark:bg-[#070709] transition-colors duration-300" aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider">Casos de Éxito</span>
          </div>

          <h2 id="testimonials-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
            Barberos y dueños que escalaron su negocio
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Historias reales de negocios que profesionalizaron su operación y fidelizaron a sus clientes.
          </p>
        </motion.div>

        {/* Big Testimonial Feature Card */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-xl relative overflow-hidden">
          <Quote className="w-20 h-20 text-zinc-200 dark:text-zinc-800 absolute -top-4 -right-4 pointer-events-none opacity-40" aria-hidden="true" />

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 relative z-10"
            >
              {/* Star Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                  <span className="text-xs font-black text-zinc-900 dark:text-white ml-2">5.0 de 5 estrellas</span>
                </div>

                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t.highlight}
                </span>
              </div>

              {/* Quote text */}
              <p className="text-lg sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed italic">
                "{t.quote}"
              </p>

              {/* Author profile */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-zinc-200 dark:ring-zinc-700 shadow-md shrink-0 bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-950 dark:text-white">{t.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {t.role} · <span className="text-amber-600 dark:text-amber-400 font-bold">{t.business}</span> ({t.city})
                    </p>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handlePrev}
                    aria-label="Testimonio anterior"
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Siguiente testimonio"
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}
