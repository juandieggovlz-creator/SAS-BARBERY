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
  Bot,
  ArrowRight
} from 'lucide-react'

const comparisons = [
  {
    problemIcon: CalendarX,
    problemTitle: 'Reservas en libretas y citas que se solapan',
    problemDesc: 'Cuadernos rayados, dos clientes agendados a la misma hora, personas esperando de pie en la sala y cancelaciones de último minuto que dejan las sillas vacías.',
    solutionIcon: CalendarCheck,
    solutionTitle: 'Agenda inteligente anti-solapamiento 24/7',
    solutionDesc: 'Horarios sincronizados al segundo con duración exacta por barbero y servicio. Cero citas duplicadas, sin llamadas y puntualidad garantizada.'
  },
  {
    problemIcon: Calculator,
    problemTitle: 'Discusiones de fin de semana por comisiones',
    problemDesc: 'Horas perdidas sumando porcentajes a mano en cuadernos, dudas sobre si un corte se cobró o no, y tensión constante entre barberos y administración.',
    solutionIcon: PieChart,
    solutionTitle: 'Liquidación matemática en tiempo real en 1 clic',
    solutionDesc: 'Cada barbero consulta desde su propio celular el dinero que lleva acumulado en el día. Al cerrar turno, se liquida con transparencia absoluta.'
  },
  {
    problemIcon: BadgeDollarSign,
    problemTitle: 'Caja sin control y descuadres misteriosos',
    problemDesc: 'Efectivo mezclado en cajones, transferencias bancarias sin verificar, salidas de dinero no registradas y arqueos que nunca cuadran al final del día.',
    solutionIcon: Receipt,
    solutionTitle: 'Cierre de caja ciego con auditoría anti-fugas',
    solutionDesc: 'El cajero cuenta el dinero sin ver el sistema. Conciliación estricta de efectivo físico, transferencias y datáfono con alerta inmediata al dueño.'
  },
  {
    problemIcon: MessageSquareOff,
    problemTitle: 'Esclavitud y clientes perdidos por WhatsApp',
    problemDesc: 'Horas respondiendo "¿A qué hora tienes turno?" a las 11 PM, demoras en contestar y clientes desesperados que terminan yéndose a otra barbería.',
    solutionIcon: Bot,
    solutionTitle: 'Autoservicio web de reservas autogenerado',
    solutionDesc: 'Tu enlace oficial listo para Instagram y TikTok. Tus clientes escogen barbero, servicio y hora en 3 clics con confirmación instantánea.'
  },
  {
    problemIcon: UserX,
    problemTitle: 'Cero seguimiento a clientes ni historial',
    problemDesc: 'No sabes cuándo fue el último corte de un cliente, cuál estilo prefiere ni tienes cómo avisarle cuando lleva semanas sin visitar tu negocio.',
    solutionIcon: UserCheck,
    solutionTitle: 'Ficha digital VIP y fidelización automatizada',
    solutionDesc: 'Directorio completo con historial de visitas, fotos del corte, teléfono con acceso directo a WhatsApp y recordatorios automáticos de retorno.'
  }
]

export default function ProblemSolution() {
  return (
    <section
      id="problema-solucion"
      className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="problem-solution-title"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">El Antes y el Después</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Transformación Operativa</span>
          </div>

          <h2
            id="problem-solution-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            De la improvisación manual al{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              control profesional.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Descubre por qué más de 500 barberías en Colombia dejaron atrás las libretas y el desorden para operar como franquicias de élite con BarberOS.
          </p>
        </motion.div>

        {/* Comparison Cards Grid */}
        <div className="space-y-6">
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
                <div className="p-6 sm:p-7 rounded-3xl bg-rose-50/60 dark:bg-[#150d11] border border-rose-200/80 dark:border-rose-950/60 relative overflow-hidden transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                      <ProblemIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-900/30 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800/60 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Sin BarberOS
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-100 mb-2">
                    {item.problemTitle}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.problemDesc}
                  </p>
                </div>

                {/* ✅ La Solución con BarberOS */}
                <div className="liquid-glass-emerald p-6 sm:p-7 rounded-3xl relative overflow-hidden transition-all duration-200 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                      <SolutionIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Con BarberOS
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-100 mb-2">
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
