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
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="uppercase tracking-wider">El Antes y el Después</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            De la improvisación manual al control profesional
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Descubre por qué cientos de barberías dejaron atrás los cuadernos y el caos para pasarse al sistema operativo definitivo.
          </p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="space-y-6">
          {comparisons.map((item, index) => {
            const ProblemIcon = item.problemIcon
            const SolutionIcon = item.solutionIcon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 bg-zinc-50/60 dark:bg-[#121215] p-3 sm:p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all group"
              >
                {/* ❌ El Problema Tradicional (Lado Rojo con color vibrante, profundo y premium) */}
                <div className="bg-rose-50/60 dark:bg-gradient-to-br dark:from-[#2e0912] dark:to-[#1a040a] rounded-2xl p-6 border border-rose-200/80 dark:border-red-900/80 dark:shadow-lg dark:shadow-red-950/50 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-red-500/25 text-rose-600 dark:text-red-400 dark:border dark:border-red-500/40 flex items-center justify-center shadow-xs">
                        <ProblemIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-red-200 bg-rose-100 dark:bg-red-950/90 px-3 py-1 rounded-full border border-rose-200 dark:border-red-500/50 flex items-center gap-1 shadow-xs">
                        <XCircle className="w-3.5 h-3.5" />
                        Sin BarberOS
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                      {item.problemTitle}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-rose-100/90 leading-relaxed font-normal">
                    {item.problemDesc}
                  </p>
                </div>

                {/* ✅ La Solución con BarberOS (Lado Verde vibrante y profesional) */}
                <div className="bg-white dark:bg-gradient-to-br dark:from-[#062013] dark:to-[#08150d] rounded-2xl p-6 border border-zinc-200/90 dark:border-emerald-800/80 dark:shadow-lg dark:shadow-emerald-950/40 shadow-sm flex flex-col justify-between space-y-3 group-hover:border-zinc-400 dark:group-hover:border-emerald-600/80 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/40 flex items-center justify-center shadow-xs">
                        <SolutionIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-500/50 flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Con BarberOS
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white tracking-tight">
                      {item.solutionTitle}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-emerald-100/90 font-normal leading-relaxed">
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
