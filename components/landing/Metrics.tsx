'use client'

import React, { useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, CalendarCheck, ShieldCheck, Store } from 'lucide-react'

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
      className="p-7 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-center space-y-3 hover:shadow-lg transition-all"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shrink-0 ${iconBg} ${iconColor}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 dark:text-white font-mono tracking-tight">
        {prefix}{count.toLocaleString('es-CO')}{suffix}
      </div>
      <p className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{sublabel}</p>
    </div>
  )
}

export default function Metrics() {
  return (
    <section id="metricas" className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#070709] transition-colors duration-300" aria-labelledby="metrics-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 space-y-3"
        >
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            RESULTADOS COMPROBADOS
          </span>
          <h2 id="metrics-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
            Métricas de impacto en negocios reales
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
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCounter
            end={85000}
            prefix="+"
            label="Clientes Atendidos"
            sublabel="Con historial y ficha de fidelización activa"
            Icon={Users}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <StatCounter
            end={45}
            prefix="+"
            suffix="%"
            label="Aumento en Facturación"
            sublabel="Por reducción de citas no asistidas y reservas 24/7"
            Icon={TrendingUp}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCounter
            end={500}
            prefix="+"
            label="Barberías Activas"
            sublabel="En Bogotá, Medellín, Cali, Barranquilla y más"
            Icon={Store}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Disponibilidad garantizada del 99.9%
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Tu sistema y página web siempre activos, rápidos y respaldados con copias de seguridad continuas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistemas Operativos 100%</span>
          </div>
        </div>

      </div>
    </section>
  )
}
