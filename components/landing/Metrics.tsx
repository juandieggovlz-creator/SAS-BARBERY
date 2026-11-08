'use client'

import React, { useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react'

interface StatCounterProps {
  end: number
  prefix?: string
  suffix?: string
  label: string
  sublabel: string
  Icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}

function StatCounter({ end, prefix = '', suffix = '', label, sublabel, Icon, iconBg, iconColor }: StatCounterProps) {
  const [count, setCount] = useState(0)
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const duration = 2000
    const stepTime = 30
    const totalSteps = duration / stepTime
    const stepValue = end / totalSteps

    const timer = setInterval(() => {
      start += stepValue
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [isInView, end])

  return (
    <div
      ref={ref}
      className="liquid-glass p-7 sm:p-8 rounded-3xl shadow-sm text-center space-y-3 hover:shadow-xl transition-all"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shrink-0 ${iconBg} ${iconColor}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 dark:text-white font-mono tracking-tight" suppressHydrationWarning>
        {prefix}{count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}{suffix}
      </div>
      <p className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{sublabel}</p>
    </div>
  )
}

export default function Metrics() {
  return (
    <section
      id="metricas"
      className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="metrics-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Impacto Real</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Cifras Consolidadas</span>
          </div>

          <h2
            id="metrics-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Métricas de impacto en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              negocios reales.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            Cifras consolidadas de barberías que migraron de libretas y WhatsApp a BarberOS.
          </p>
        </motion.div>

        {/* Counter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCounter
            end={180000}
            prefix="+"
            label="Reservas Gestionadas"
            sublabel="Procesadas en tiempo real sin solapamientos"
            Icon={CalendarCheck}
            iconBg="bg-blue-500/15"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCounter
            end={85000}
            prefix="+"
            label="Clientes Atendidos"
            sublabel="Con historial digital y fidelización recurrente"
            Icon={Users}
            iconBg="bg-purple-500/15"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <StatCounter
            end={0}
            prefix="$"
            suffix=" COP"
            label="Descuadres de Caja"
            sublabel="Gracias al sistema de arqueo ciego diario"
            Icon={ShieldCheck}
            iconBg="bg-emerald-500/15"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCounter
            end={500}
            prefix="+"
            label="Barberías Afiliadas"
            sublabel="En todo Colombia · Sincelejo, Bogotá, Medellín y más"
            Icon={TrendingUp}
            iconBg="bg-amber-500/15"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </div>

      </div>
    </section>
  )
}
