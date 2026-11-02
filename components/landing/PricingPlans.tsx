'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react'

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

// Fallback inicial mientras carga la API
const DEFAULT_FALLBACK_PLANS: PlanData[] = [
  {
    id: '1',
    name: 'Plan Básico',
    slug: 'plan-basico',
    price: 49000,
    billingPeriod: 'MONTHLY',
    maxBarbers: 3,
    maxClients: 500,
    maxAppointments: 1000,
    features: [
      'Hasta 3 barberos activos',
      'Hasta 1,000 citas al mes',
      'Agenda multi-barbero interactiva',
      'Control de clientes e historial básico',
      'Página web pública de reservas',
      'Soporte técnico por tickets'
    ],
    isPopular: false,
    isActive: true
  },
  {
    id: '2',
    name: 'Plan Profesional',
    slug: 'plan-profesional',
    price: 99000,
    billingPeriod: 'MONTHLY',
    maxBarbers: 10,
    maxClients: 2500,
    maxAppointments: 5000,
    features: [
      'Hasta 10 barberos con portal individual',
      'Citas y reservas ilimitadas',
      'Cálculo automático de comisiones',
      'Módulo completo de caja y cierre ciego',
      'Página web personalizada con galería',
      'Reportes avanzados y analítica de ventas',
      'Soporte prioritario para tu barbería'
    ],
    isPopular: true,
    isActive: true
  },
  {
    id: '3',
    name: 'Plan Premium VIP',
    slug: 'plan-premium',
    price: 189000,
    billingPeriod: 'MONTHLY',
    maxBarbers: 30,
    maxClients: 15000,
    maxAppointments: 30000,
    features: [
      'Hasta 30 barberos y puestos activos',
      'Multi-sucursales & escalabilidad',
      'Personalización web completa & temas VIP',
      'Reportes financieros avanzados',
      'Gestión completa de inventario',
      'Auditoría y trazabilidad total',
      'Soporte VIP dedicado 24/7'
    ],
    isPopular: false,
    isActive: true
  }
]

export default function PricingPlans() {
  const [annual, setAnnual] = useState(false)
  const [plans, setPlans] = useState<PlanData[]>(DEFAULT_FALLBACK_PLANS)
  const [loading, setLoading] = useState(true)

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
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount)

  return (
    <section id="precios" className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span className="uppercase tracking-wider">Inversión Transparente · Mes Gratis a Full</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Planes diseñados para cada etapa de tu barbería
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Sin contratos forzosos. Prueba gratis <strong>1 mes (30 días) con todo habilitado a full</strong> y elige el plan que mejor se adapte al tamaño de tu equipo.
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-bold ${!annual ? 'text-zinc-950 font-black' : 'text-zinc-400'}`}>
              Pago Mensual
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-14 h-8 bg-zinc-950 rounded-full p-1 relative transition-colors cursor-pointer"
              aria-label="Alternar facturación anual"
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-6 h-6 rounded-full bg-white shadow-md ${annual ? 'ml-auto' : ''}`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${annual ? 'text-zinc-950 font-black' : 'text-zinc-400'}`}>
                Pago Anual
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Ahorra 20%
              </span>
            </div>
          </div>
        </div>

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
                className={`rounded-3xl p-8 flex flex-col justify-between space-y-6 transition-all ${
                  isFeatured
                    ? 'bg-zinc-950 dark:bg-[#16161b] text-white border-2 border-zinc-800 dark:border-amber-500/80 shadow-2xl dark:shadow-amber-500/10 relative transform lg:-translate-y-2'
                    : 'bg-zinc-50/70 dark:bg-[#121215] text-zinc-950 dark:text-white border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Badge para el destacado */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 fill-zinc-950" />
                    MÁS POPULAR · RECOMENDADO
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        isFeatured
                          ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20'
                          : 'text-zinc-500 dark:text-zinc-300 bg-zinc-200/60 dark:bg-zinc-800 dark:border dark:border-zinc-700'
                      }`}
                    >
                      {plan.maxBarbers <= 3 ? 'Para Iniciar' : plan.maxBarbers <= 10 ? 'Operación Completa' : 'Franquicias & Sedes'}
                    </span>
                    <h3 className={`text-xl font-black mt-3 ${isFeatured ? 'text-white' : 'text-zinc-950 dark:text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mt-1 ${isFeatured ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      Hasta {plan.maxBarbers} barberos y {plan.maxAppointments.toLocaleString()} citas/mes.
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black font-mono ${isFeatured ? 'text-white' : 'text-zinc-950 dark:text-white'}`}>
                        {formatCOP(displayPrice)}
                      </span>
                      <span className={`text-xs font-bold ${isFeatured ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        COP / mes
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 ${isFeatured ? 'text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      {annual
                        ? `Facturado anualmente (${formatCOP(yearlyTotal)} COP)`
                        : 'Sin permanencia mínima'}
                    </p>
                  </div>

                  <div
                    className={`space-y-3 pt-4 border-t text-xs ${
                      isFeatured ? 'border-zinc-800' : 'border-zinc-200/60 dark:border-zinc-800'
                    }`}
                  >
                    {plan.features.map((feature, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 ${
                          isFeatured ? 'text-zinc-200' : 'text-zinc-700 dark:text-zinc-200'
                        }`}
                      >
                        <Check
                          className={`w-4 h-4 shrink-0 ${
                            isFeatured ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/register?plan=${plan.slug}`}
                  className={`w-full py-4 text-center rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                    isFeatured
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-black shadow-xl shadow-amber-500/20 active:scale-95'
                      : 'bg-white border border-zinc-300 dark:bg-[#1c1c22] dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800 text-zinc-900 hover:bg-zinc-100 shadow-2xs'
                  }`}
                >
                  <span>Comenzar 1 Mes Gratis</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-zinc-400 mt-12">
          Todos los precios están expresados en pesos colombianos (COP). Se actualizan en tiempo real y no tienen comisiones por reserva agendada.
        </p>

      </div>
    </section>
  )
}
