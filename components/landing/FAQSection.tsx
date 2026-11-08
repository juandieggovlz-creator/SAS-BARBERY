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
    a: 'No. Cada barbero cuenta con un portal independiente y restringido con PIN. Solo pueden consultar sus citas asignadas, sus clientes y sus comisiones acumuladas. El dueño o administrador es el único con acceso a las finanzas globales, gastos y reportes de la barbería.'
  },
  {
    q: '¿Cómo funciona el cierre de caja ciego y por qué evita fugas de dinero?',
    a: 'En el cierre ciego, el recepcionista o encargado digita la cantidad de dinero físico que contó en la caja sin que el sistema le revele el total esperado. Una vez enviado, BarberOS cruza el conteo con las citas pagadas en efectivo, tarjetas y transferencias bancarias o códigos QR y genera el arqueo oficial con la diferencia exacta en segundos.'
  },
  {
    q: '¿Qué pasa si ya tengo clientes y servicios? ¿Es difícil configurarlo?',
    a: 'Para nada. La configuración inicial toma menos de 3 minutos. Puedes dar de alta tus servicios, precios, tiempos y barberos de forma rápida y sencilla. Además, nuestro equipo de soporte está disponible para acompañarte y resolver cualquier duda.'
  },
  {
    q: '¿Puedo colocar el enlace de reservas en mi Instagram y WhatsApp Business?',
    a: '¡Por supuesto! De hecho, es lo más recomendado. Colocas el enlace en tu perfil de Instagram, en tu ficha de Google Maps y en el mensaje de respuesta automática de WhatsApp Business. De esa manera, tus clientes agendan solos 24/7 sin que tengas que atender el chat manualmente.'
  },
  {
    q: '¿Cómo funciona la prueba gratuita de 1 mes (30 días)? ¿Me cobrarán automáticamente?',
    a: 'Al registrar tu barbería recibes 1 mes completo (30 días) de acceso gratuito a todas las herramientas. Al finalizar el periodo de prueba tú decides si deseas contratar uno de los planes; si decides no continuar, tu cuenta simplemente se pausa sin cobros sorpresa.'
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section
      id="faq"
      className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="faq-title"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Preguntas Frecuentes</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Claridad Total</span>
          </div>

          <h2
            id="faq-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Todo lo que necesitas saber antes de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              empezar.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Resolvemos las dudas más habituales sobre la implementación y funcionamiento de BarberOS.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="liquid-glass rounded-3xl overflow-hidden transition-all duration-200 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-base sm:text-lg text-zinc-950 dark:text-white pr-2">
                    {faq.q}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isOpen
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 rotate-180'
                        : 'bg-zinc-200/60 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-6 pb-6 sm:px-7 sm:pb-7 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200/60 dark:border-white/5 pt-4">
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
