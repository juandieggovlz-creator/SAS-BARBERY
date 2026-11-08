'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'

interface PlanData {
  id: string
  name: string
  slug: string
  price: number
  billingPeriod: string
  maxBarbers: number
  maxClients: number
  maxAppointments: number
  features: string[]
  isPopular: boolean
  isActive: boolean
}

const DEFAULT_FALLBACK_PLANS: PlanData[] = [
  {
    id: '1',
    name: 'Plan Básico',
    slug: 'plan-basico',
    price: 69900,
    billingPeriod: 'MONTHLY',
    maxBarbers: 3,
    maxClients: 500,
    maxAppointments: 1000,
    features: [
      '1 sede física incluida',
      'Hasta 3 barberos activos',
      'Panel de control & Agenda interactiva',
      'Gestión de clientes e historial',
      'Página web pública de reservas en línea',
      'Control de caja y reportes básicos',
      'Soporte técnico por tickets'
    ],
    isPopular: false,
    isActive: true
  },
  {
    id: '2',
    name: 'Plan Profesional',
    slug: 'plan-profesional',
    price: 119900,
    billingPeriod: 'MONTHLY',
    maxBarbers: 8,
    maxClients: 2500,
    maxAppointments: 5000,
    features: [
      '1 sede física incluida',
      'Hasta 8 barberos con portal individual',
      'Todo lo incluido en Básico',
      'Automatización de recordatorios por WhatsApp',
      'Cálculo y liquidación automática de comisiones',
      'Cierre de caja ciego anti-fugas',
      'Reportes avanzados y análisis de demanda',
      'Notas y chat interno del equipo'
    ],
    isPopular: true,
    isActive: true
  },
  {
    id: '3',
    name: 'Plan Premium VIP',
    slug: 'plan-premium',
    price: 169900,
    billingPeriod: 'MONTHLY',
    maxBarbers: 15,
    maxClients: 15000,
    maxAppointments: 30000,
    features: [
      '2 sedes incluidas (Multisedes)',
      'Hasta 15 barberos en total entre sedes',
      'Todo lo incluido en Profesional',
      'Panel consolidado y selector de sedes',
      'Administradores independientes por sede',
      'Sedes adicionales: $50.000 COP/mes c/u',
      'Páginas web y configuraciones independientes',
      'WhatsApp independiente por sede (Cloud API)',
      'Soporte VIP prioritario'
    ],
    isPopular: false,
    isActive: true
  }
]

export default function PricingPlans() {
  const [annual, setAnnual] = useState(false)
  const [plans, setPlans] = useState<PlanData[]>(DEFAULT_FALLBACK_PLANS)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans')
        if (res.ok) {
          const data = await res.json()
          if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
            setPlans(data.plans)
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic plans:', err)
      }
    }
    fetchPlans()
  }, [])

  const formatNumber = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  const formatCOP = (amount: number) => `$${formatNumber(amount)}`

  return (
    <section
      id="precios"
      className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="pricing-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Inversión Transparente</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">1 Mes Gratis Completo</span>
          </div>

          <h2
            id="pricing-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Planes diseñados para cada etapa de tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              barbería.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Sin contratos forzosos. Prueba gratis <strong>1 mes (30 días) con todas las funciones habilitadas</strong> y elige el plan ideal para tu equipo.
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-bold ${!annual ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}>
              Pago Mensual
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-14 h-8 bg-zinc-900 dark:bg-[#1a202c] rounded-full p-1 relative transition-colors cursor-pointer border border-zinc-700/60"
              aria-label="Alternar facturación anual"
            >
              <div
                className={`w-6 h-6 rounded-full bg-amber-500 shadow-md transition-all ${annual ? 'ml-auto' : ''}`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${annual ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}>
                Pago Anual
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Ahorra 20%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => {
            const monthlyPrice = Number(plan.price) || 0
            const displayPrice = annual ? Math.round(monthlyPrice * 0.8) : monthlyPrice
            const yearlyTotal = monthlyPrice * 12 * 0.8
            const isFeatured = plan.isPopular

            return (
              <div
                key={plan.id}
                className={`p-8 sm:p-9 rounded-3xl flex flex-col justify-between space-y-6 transition-all duration-300 relative shadow-sm hover:shadow-2xl ${
                  isFeatured
                    ? 'liquid-glass-amber shadow-2xl shadow-amber-500/15 lg:-translate-y-2 relative overflow-visible'
                    : 'liquid-glass'
                }`}
              >
                {/* Badge for featured plan */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 fill-zinc-950" aria-hidden="true" />
                    MÁS ELEGIDO · RECOMENDADO
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        isFeatured
                          ? 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20'
                          : 'text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/5'
                      }`}
                    >
                      {plan.maxBarbers <= 3 ? 'Para Iniciar' : plan.maxBarbers <= 8 ? 'Operación Completa' : 'Multisedes VIP'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white mt-3">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1" suppressHydrationWarning>
                      Hasta {plan.maxBarbers} barberos y {formatNumber(plan.maxAppointments)} citas/mes.
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black font-mono text-zinc-950 dark:text-white" suppressHydrationWarning>
                        {formatCOP(displayPrice)}
                      </span>
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        COP / mes
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1" suppressHydrationWarning>
                      {annual
                        ? `Facturado anualmente (${formatCOP(yearlyTotal)} COP)`
                        : 'Sin permanencia mínima'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-5 border-t border-zinc-200/80 dark:border-white/10 text-xs">
                    {plan.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300"
                      >
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/register?plan=${plan.slug}`}
                  className={`w-full py-4 text-center rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                    isFeatured
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 active:scale-[0.97]'
                      : 'bg-white dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 active:scale-[0.97]'
                  }`}
                >
                  <span>Comenzar 1 Mes Gratis</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-12">
          Precios oficiales en pesos colombianos (COP). Sin comisiones ocultas por reserva.
        </p>

      </div>
    </section>
  )
}
