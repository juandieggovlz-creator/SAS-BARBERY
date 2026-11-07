'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  XCircle,
  CheckCircle2,
  CalendarX,
  UserX,
  BadgeDollarSign,
  Calculator,
  MessageSquareOff,
  Sparkles,
  CalendarCheck,
  UserCheck,
  Receipt,
  PieChart,
  Bot
} from 'lucide-react'

const comparisons = [
  {
    problemIcon: CalendarX,
    problemTitle: 'Reservas desorganizadas y citas solapadas',
    problemDesc: 'Cuadernos rayados, citas que se cruzan a la misma hora, clientes esperando de pie y cancelaciones que dejan sillas vacías.',
    solutionIcon: CalendarCheck,
    solutionTitle: 'Agenda inteligente anti-solapamiento',
    solutionDesc: 'Horarios sincronizados en tiempo real con cálculo exacto de tiempos por servicio. Cero citas duplicadas y puntualidad garantizada.'
  },
  {
    problemIcon: UserX,
    problemTitle: 'Clientes olvidados sin seguimiento ni historial',
    problemDesc: 'No sabes cuándo fue su último corte, qué estilo prefiere ni tienes cómo recordarle que vuelva a agendar.',
    solutionIcon: UserCheck,
    solutionTitle: 'Ficha única de cliente con historial completo',
    solutionDesc: 'Directorio digital con fotos, preferencias de corte, teléfono y notas personalizadas para ofrecer una experiencia VIP.'
  },
  {
    problemIcon: BadgeDollarSign,
    problemTitle: 'Caja sin control y dinero perdido entre turnos',
    problemDesc: 'Efectivo mezclado en cajones, gastos diarios sin justificar y descuadres al final del día que nadie sabe explicar.',
    solutionIcon: Receipt,
    solutionTitle: 'Cierre de caja ciego con arqueo automático',
    solutionDesc: 'Conciliación precisa entre efectivo contado, transferencias y tarjetas. Cada peso queda registrado con auditoría anti-fugas.'
  },
  {
    problemIcon: Calculator,
    problemTitle: 'Comisiones confusas y desconfianza con barberos',
    problemDesc: 'Horas perdidas calculando porcentajes a mano en libretas, disputas por turnos y tensión con el equipo de trabajo.',
    solutionIcon: PieChart,
    solutionTitle: 'Liquidación transparente en tiempo real',
    solutionDesc: 'Cada barbero consulta desde su propio portal las citas completadas y el dinero que le corresponde cobrar. Cero discusiones.'
  },
  {
    problemIcon: MessageSquareOff,
    problemTitle: 'Esclavitud y pérdida de clientes por WhatsApp',
    problemDesc: 'Horas respondiendo "¿A qué hora tienes turno?" a medianoche, demoras en contestar y clientes que se van a otra barbería.',
    solutionIcon: Bot,
    solutionTitle: 'Autoservicio web de reservas 24/7',
    solutionDesc: 'Comparte tu link web en Instagram, TikTok y Google. Tus clientes reservan en 3 clics y reciben confirmación instantánea.'
  }
]

export default function ProblemSolution() {
  return (
    <section id="problema-solucion" className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#070709] transition-colors duration-300" aria-labelledby="problem-solution-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
            <span className="uppercase tracking-wider">El Antes y el Después</span>
          </div>

          <h2 id="problem-solution-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
            De la improvisación manual al control profesional
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Descubre por qué cientos de barberías dejaron atrás los cuadernos y el caos para pasarse al sistema operativo definitivo.
          </p>
        </motion.div>

        {/* Comparison Cards Grid */}
        <div className="space-y-5">
          {comparisons.map((item, index) => {
            const ProblemIcon = item.problemIcon
            const SolutionIcon = item.solutionIcon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* ❌ El Problema Tradicional */}
                <div className="p-6 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 relative overflow-hidden transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <ProblemIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-900/30 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Sin BarberOS
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-100 mb-1.5">
                    {item.problemTitle}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.problemDesc}
                  </p>
                </div>

                {/* ✅ La Solución con BarberOS */}
                <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 relative overflow-hidden transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <SolutionIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Con BarberOS
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-100 mb-1.5">
                    {item.solutionTitle}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.solutionDesc}
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
