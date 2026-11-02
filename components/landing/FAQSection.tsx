'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, Sparkles } from 'lucide-react'

const faqs = [
  {
    q: '¿Mis clientes necesitan descargar alguna app para reservar?',
    a: 'No. Tus clientes no tienen que descargar nada de la App Store ni Play Store ni crear contraseñas. Acceden a tu enlace oficial (ej. barberos.app/b/tu-barberia) directamente desde su celular o computador, eligen barbero y hora en 3 clics y reciben confirmación instantánea.'
  },
  {
    q: '¿Mis barberos pueden ver las ganancias de la barbería o las citas de otros?',
    a: 'No. Cada barbero cuenta con un portal independiente y restringido. Solo pueden consultar sus citas asignadas, sus clientes y sus comisiones acumuladas. El dueño o administrador es el único con acceso a las finanzas globales, gastos y reportes de la barbería.'
  },
  {
    q: '¿Cómo funciona el cierre de caja ciego y por qué evita fugas de dinero?',
    a: 'En el cierre ciego, el recepcionista o encargado digita la cantidad de dinero físico que contó en la caja sin que el sistema le revele el total esperado. Una vez enviado, BarberOS cruza el conteo con las citas pagadas en efectivo, tarjetas y transferencias (Nequi/Bancolombia) y genera el arqueo oficial con la diferencia exacta en segundos.'
  },
  {
    q: '¿Qué pasa si ya tengo clientes y servicios? ¿Es difícil configurarlo?',
    a: 'Para nada. La configuración inicial toma menos de 5 minutos. Puedes dar de alta tus servicios, precios, tiempos y barberos de forma rápida y sencilla. Además, nuestro equipo de soporte está disponible para acompañarte y resolver cualquier duda.'
  },
  {
    q: '¿Puedo colocar el enlace de reservas en mi Instagram y WhatsApp Business?',
    a: '¡Por supuesto! De hecho, es lo más recomendado. Colocas el enlace en tu perfil de Instagram, en tu ficha de Google Maps y en el mensaje de respuesta automática de WhatsApp Business. De esa manera, tus clientes agendan solos 24/7 sin que tengas que atender el chat manualmente.'
  },
  {
    q: '¿Cómo funciona la prueba gratuita de 14 días? ¿Me cobrarán automáticamente?',
    a: 'Al registrar tu barbería recibes 14 días de acceso completo a todas las funciones sin ingresar tarjeta de crédito ni datos de pago. Al finalizar el periodo de prueba tú decides si deseas contratar uno de los planes; si decides no continuar, tu cuenta simplemente se pausa sin cobros sorpresa.'
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" className="py-24 md:py-32 bg-zinc-50/70 border-t border-zinc-200/80 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-900" />
            <span className="uppercase tracking-wider">Preguntas Frecuentes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Todo lo que necesitas saber antes de empezar
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Resolvemos las dudas más habituales sobre la implementación de BarberOS.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3.5">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i

            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-black text-zinc-950 tracking-tight">
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    isOpen ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-1 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
