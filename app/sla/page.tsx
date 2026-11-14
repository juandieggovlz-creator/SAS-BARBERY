'use client'

import React from 'react'
import LegalLayout from '@/components/legal/LegalLayout'
import { getLegalDocBySlug } from '@/lib/legal-documents'
import {
  Clock,
  AlertCircle,
  Headphones,
  Server
} from 'lucide-react'

export default function SLAPage() {
  const meta = getLegalDocBySlug('sla')

  return (
    <LegalLayout currentSlug="sla" docMeta={meta}>
      {/* Disclaimer Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          <strong>Nota informativa y alcance operativo:</strong> Este documento establece las metas operativas y de soporte técnico que BarberOS procura cumplir diligentemente. No constituye una cláusula penal automática ni compromiso indemnizatorio frente a fallas atribuibles a proveedores globales de internet, energía o infraestructura de terceros. Sujeto a revisión y validación legal según los términos de servicio suscritos.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Section 1: Disponibilidad de la Plataforma */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              1. Disponibilidad de la Plataforma (Uptime Objetivo)
            </h2>
          </div>
          <p>
            BarberOS opera sobre infraestructura distribuida en la nube con un objetivo de disponibilidad anual del <strong>99.5%</strong> para el motor central de reservas online y consulta de agendas, disponible las 24 horas del día, los 7 días de la semana.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            *Se excluyen de la métrica las ventanas de mantenimiento preventivo previamente notificadas o las interrupciones ajenas a BarberOS (cortes de conectividad móvil del usuario, bloqueos de proveedores locales de telecomunicaciones, etc.).
          </p>
        </section>

        {/* Section 2: Ventanas de Mantenimiento */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              2. Ventanas de Mantenimiento y Actualizaciones
            </h2>
          </div>
          <p>
            Para garantizar la estabilidad y aplicar mejoras de rendimiento o seguridad, se programan actualizaciones preferentemente en horarios de bajo impacto comercial (entre las 11:00 PM y las 5:00 AM hora de Colombia UTC-5).
          </p>
        </section>

        {/* Section 3: Tiempos de Respuesta de Soporte */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Headphones className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              3. Horarios y Tiempos Estimados de Respuesta de Soporte
            </h2>
          </div>
          <p>
            El equipo de soporte humano atiende consultas operativas a través de nuestro canal oficial de WhatsApp y correo electrónico:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-950 dark:text-white">Horario de Atención:</p>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Lunes a Sábado: 8:00 AM – 7:00 PM</p>
              <p className="text-zinc-500 dark:text-zinc-400">Domingos y Festivos: Monitoreo crítico</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-950 dark:text-white">Tiempos de Respuesta Estimados:</p>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Incidencias críticas: Menos de 2 horas</p>
              <p className="text-zinc-500 dark:text-zinc-400">Consultas generales: Mismo día hábil</p>
            </div>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}
