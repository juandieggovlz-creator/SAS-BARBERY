'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'

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
    q: '¿Cómo funciona la prueba gratuita de 1 mes (30 días)? ¿Me cobrarán automáticamente?',
    a: 'Al registrar tu barbería recibes 1 mes completo (30 días) de acceso sin ingresar tarjeta de crédito ni datos de pago. Al finalizar el periodo de prueba tú decides si deseas contratar uno de los planes; si decides no continuar, tu cuenta simplemente se pausa sin cobros sorpresa.'
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#070709] transition-colors duration-300" aria-labelledby="faq-title">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span className="uppercase tracking-wider">Preguntas Frecuentes</span>
          </div>

          <h2 id="faq-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
            Todo lo que necesitas saber antes de empezar
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Resolvemos las dudas más habituales sobre la implementación de BarberOS.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3.5">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white pr-2">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200/50 dark:border-zinc-800/60 pt-3">
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
