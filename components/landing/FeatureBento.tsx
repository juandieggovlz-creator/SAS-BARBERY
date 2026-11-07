'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  UserCheck,
  DollarSign,
  Receipt,
  Users,
  Scissors,
  BarChart3,
  BrainCircuit,
  Globe,
  Clock,
  Percent,
  Sparkles,
  CheckCircle2
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Gestión de Citas en Vivo',
    desc: 'Agenda interactiva con estados en tiempo real: Pendiente, Llegó, En Servicio, Completada y Cancelada.',
    tag: 'Core',
    colSpan: 'lg:col-span-4',
    accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  },
  {
    icon: UserCheck,
    title: 'Portal Autónomo para Barberos',
    desc: 'Cada barbero gestiona sus citas desde su smartphone sin tener acceso a la facturación global del dueño.',
    tag: 'Privacidad',
    colSpan: 'lg:col-span-4',
    accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  },
  {
    icon: DollarSign,
    title: 'Control Financiero & Balance',
    desc: 'Monitorea ingresos diarios, gastos de insumos y servicios públicos para calcular tu margen neto real.',
    tag: 'Finanzas',
    colSpan: 'lg:col-span-4',
    accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    icon: Receipt,
    title: 'Cierre de Caja Ciego con Arqueo',
    desc: 'Auditoría precisa entre efectivo contado en caja y pagos electrónicos (Nequi, Bancolombia, Datáfono).',
    tag: 'Anti-Fugas',
    colSpan: 'lg:col-span-6',
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  {
    icon: Globe,
    title: 'Página Web Oficial Autogenerada',
    desc: 'Tu propia página web personalizada con tu marca, fotos de cortes, horarios y botón directo de reserva.',
    tag: 'Presencia Web',
    colSpan: 'lg:col-span-6',
    accent: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20'
  },
  {
    icon: Clock,
    title: 'Reservas Online 24/7 sin Registro',
    desc: 'Tus clientes eligen barbero y horario en 3 clics desde su navegador web, sin descargar aplicaciones.',
    tag: 'Automatización',
    colSpan: 'lg:col-span-4',
    accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  },
  {
    icon: Percent,
    title: 'Cálculo Automático de Comisiones',
    desc: 'Porcentajes configurables por barbero (ej. 40%, 45%, 50%). Liquidaciones transparentes en segundos.',
    tag: 'Equipo',
    colSpan: 'lg:col-span-4',
    accent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  },
  {
    icon: Users,
    title: 'Directorio Inteligente de Clientes',
    desc: 'Ficha digital con historial de cortes, frecuencia de visita, teléfono directo a WhatsApp y notas especiales.',
    tag: 'CRM',
    colSpan: 'lg:col-span-4',
    accent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
  },
  {
    icon: Scissors,
    title: 'Catálogo de Servicios & Combos',
    desc: 'Configura precios, duraciones exactas y categorías personalizadas (Cortes, Barba, Combos, Tratamientos).',
    tag: 'Catálogo',
    colSpan: 'lg:col-span-4',
    accent: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
  },
  {
    icon: BarChart3,
    title: 'Reportes & Analítica de Rendimiento',
    desc: 'Gráficos de facturación mensual, ticket promedio, horas pico y ranking de barberos más productivos.',
    tag: 'Analítica',
    colSpan: 'lg:col-span-4',
    accent: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
  },
  {
    icon: BrainCircuit,
    title: 'Inteligencia de Retención & Alertas',
    desc: 'Detecta clientes inactivos para reactivarlos y recibe notificaciones en vivo de cancelaciones o citas.',
    tag: 'Crecimiento',
    colSpan: 'lg:col-span-4',
    accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
  }
]

export default function FeatureBento() {
  return (
    <section id="caracteristicas" className="py-20 md:py-28 relative overflow-hidden bg-zinc-50/50 dark:bg-[#070709] transition-colors duration-300" aria-labelledby="features-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider">Módulos Especializados</span>
          </div>

          <h2 id="features-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
            Cada herramienta que tu barbería necesita para operar al máximo nivel
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Diseñado en conjunto con dueños de barberías reales para resolver las fricciones operativas del día a día.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className={`${item.colSpan} p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${item.accent}`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Incluido en la plataforma</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">100% Activo</span>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
