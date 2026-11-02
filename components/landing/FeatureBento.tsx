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
  BellRing,
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
    accent: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    icon: UserCheck,
    title: 'Portal Autónomo para Barberos',
    desc: 'Cada barbero gestiona sus citas desde su smartphone sin tener acceso a la facturación global del dueño.',
    tag: 'Privacidad',
    colSpan: 'lg:col-span-4',
    accent: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  {
    icon: DollarSign,
    title: 'Control Financiero & Balance',
    desc: 'Monitorea ingresos diarios, gastos de insumos y servicios públicos para calcular tu margen neto real.',
    tag: 'Finanzas',
    colSpan: 'lg:col-span-4',
    accent: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  {
    icon: Receipt,
    title: 'Cierre de Caja Ciego con Arqueo',
    desc: 'Auditoría precisa entre efectivo contado en caja y pagos electrónicos (Nequi, Bancolombia, Datáfono).',
    tag: 'Anti-Fugas',
    colSpan: 'lg:col-span-6',
    accent: 'bg-amber-50 text-amber-600 border-amber-200'
  },
  {
    icon: Globe,
    title: 'Página Web Oficial Autogenerada',
    desc: 'Tu propia página web personalizada con tu marca, fotos de cortes, horarios y botón directo de reserva.',
    tag: 'Presencia Web',
    colSpan: 'lg:col-span-6',
    accent: 'bg-zinc-100 text-zinc-900 border-zinc-300'
  },
  {
    icon: Clock,
    title: 'Reservas Online 24/7 sin Registro',
    desc: 'Tus clientes eligen barbero y horario en 3 clics desde su navegador web, sin descargar aplicaciones.',
    tag: 'Automatización',
    colSpan: 'lg:col-span-4',
    accent: 'bg-sky-50 text-sky-600 border-sky-200'
  },
  {
    icon: Percent,
    title: 'Cálculo Automático de Comisiones',
    desc: 'Porcentajes configurables por barbero (ej. 40%, 45%, 50%). Liquidaciones transparentes en segundos.',
    tag: 'Equipo',
    colSpan: 'lg:col-span-4',
    accent: 'bg-rose-50 text-rose-600 border-rose-200'
  },
  {
    icon: Users,
    title: 'Directorio Inteligente de Clientes',
    desc: 'Ficha digital con historial de cortes, frecuencia de visita, teléfono directo a WhatsApp y notas especiales.',
    tag: 'CRM',
    colSpan: 'lg:col-span-4',
    accent: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  {
    icon: Scissors,
    title: 'Catálogo de Servicios & Combos',
    desc: 'Configura precios, duraciones exactas y categorías personalizadas (Cortes, Barba, Combos, Tratamientos).',
    tag: 'Catálogo',
    colSpan: 'lg:col-span-4',
    accent: 'bg-orange-50 text-orange-600 border-orange-200'
  },
  {
    icon: BarChart3,
    title: 'Reportes & Analítica de Rendimiento',
    desc: 'Gráficos de facturación mensual, ticket promedio, horas pico y ranking de barberos más productivos.',
    tag: 'Analítica',
    colSpan: 'lg:col-span-4',
    accent: 'bg-teal-50 text-teal-600 border-teal-200'
  },
  {
    icon: BrainCircuit,
    title: 'Inteligencia de Retención & Alertas',
    desc: 'Detecta clientes inactivos para reactivarlos y recibe notificaciones en vivo de cancelaciones o citas.',
    tag: 'Crecimiento',
    colSpan: 'lg:col-span-4',
    accent: 'bg-violet-50 text-violet-600 border-violet-200'
  }
]

export default function FeatureBento() {
  return (
    <section id="caracteristicas" className="py-24 md:py-32 bg-zinc-50/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span className="uppercase tracking-wider">Módulos Especializados</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Cada herramienta que tu barbería necesita para operar al máximo nivel
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Diseñado en conjunto con dueños de barberías reales para resolver las fricciones operativas del día a día.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className={`${item.colSpan} bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 shadow-xs hover:shadow-xl hover:border-zinc-300 transition-all flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${item.accent} transition-transform group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-zinc-950 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
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
