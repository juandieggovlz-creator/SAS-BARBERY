'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react'

const testimonials = [
  {
    name: 'Carlos "The Blade" Ruiz',
    role: 'Master Barber & Administrador',
    business: 'Barbería Elite SAS',
    city: 'Medellín (El Poblado)',
    avatar: '/landing/testimonial-1.png',
    initials: 'CR',
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
    initials: 'MV',
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
    initials: 'JM',
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
    initials: 'AM',
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
    <section className="py-24 md:py-32 bg-zinc-50/70 border-t border-zinc-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="uppercase tracking-wider">Casos de Éxito</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Barberos y dueños que escalaron su negocio
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Historias reales de negocios que profesionalizaron su operación y fidelizaron a sus clientes.
          </p>
        </div>

        {/* Big Testimonial Feature Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200/90 shadow-xl relative overflow-hidden">
          <Quote className="w-20 h-20 text-zinc-100 absolute -top-4 -right-4 pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-6 relative z-10"
            >
              {/* Star Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs font-black text-zinc-900 ml-2">5.0 de 5 estrellas</span>
                </div>

                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.highlight}
                </span>
              </div>

              {/* Quote text */}
              <p className="text-lg sm:text-2xl font-bold text-zinc-900 leading-relaxed italic">
                "{t.quote}"
              </p>

              {/* Author profile */}
              <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-zinc-200/90 shadow-md shrink-0 bg-zinc-900">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-zinc-950">{t.name}</h4>
                    <p className="text-xs text-zinc-500 font-medium">
                      {t.role} · <span className="font-bold text-zinc-700">{t.business}</span> ({t.city})
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handlePrev}
                    className="p-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                    aria-label="Testimonio anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-zinc-400 px-2">
                    {index + 1} / {testimonials.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className="p-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                    aria-label="Siguiente testimonio"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Thumbnails row */}
        <div className="flex justify-center gap-2.5 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-8 bg-zinc-950' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'
              }`}
              aria-label={`Ir al testimonio ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
