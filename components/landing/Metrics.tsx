'use client'

import React, { useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, CalendarCheck, ShieldCheck, Store, Clock } from 'lucide-react'

interface StatCounterProps {
  end: number
  prefix?: string
  suffix?: string
  label: string
  sublabel: string
}

function StatCounter({ end, prefix = '', suffix = '', label, sublabel }: StatCounterProps) {
  const [count, setCount] = useState(0)
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const duration = 2000 // 2 seconds
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
    <div ref={ref} className="bg-white p-7 rounded-3xl border border-zinc-200/90 shadow-sm text-center space-y-2">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 font-mono tracking-tight">
        {prefix}{count.toLocaleString('es-CO')}{suffix}
      </div>
      <p className="text-sm font-black text-zinc-900 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-zinc-500 font-medium">{sublabel}</p>
    </div>
  )
}

export default function Metrics() {
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
            RESULTADOS COMPROBADOS
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-950 tracking-tight">
            Métricas de impacto en negocios reales
          </h2>
          <p className="text-sm text-zinc-600">
            Cifras consolidadas de barberías que migraron de libretas y WhatsApp a BarberOS.
          </p>
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCounter
            end={180000}
            prefix="+"
            label="Reservas Gestionadas"
            sublabel="Procesadas en tiempo real sin solapamientos"
          />
          <StatCounter
            end={85000}
            prefix="+"
            label="Clientes Atendidos"
            sublabel="Con historial y ficha de fidelización activa"
          />
          <StatCounter
            end={45}
            prefix="+"
            suffix="%"
            label="Aumento en Facturación"
            sublabel="Por reducción de citas no asistidas y reservas 24/7"
          />
          <StatCounter
            end={500}
            prefix="+"
            label="Barberías Activas"
            sublabel="En Bogotá, Medellín, Cali, Barranquilla y más"
          />
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Disponibilidad garantizada del 99.9%
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Tu sistema y página web siempre activos, rápidos y respaldados con copias de seguridad continuas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-zinc-300 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistemas Operativos 100%
            </span>
          </div>
        </div>

      </div>
    </section>
  )
}
