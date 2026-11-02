'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Crown,
  Sparkles,
  Check,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Loader2,
  Users,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Building2,
  HelpCircle
} from 'lucide-react'

interface PlanInfo {
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
}

interface BusinessSubscriptionData {
  business: {
    id: string
    name: string
    slug: string
    status: string
    createdAt: string
    trialEndsAt?: string | null
    subscriptionEndsAt?: string | null
    maxBarbers: number
    maxClients: number
    maxAppointments: number
    plan: PlanInfo | null
  }
  daysRemaining: number | null
  isExpired: boolean
  isTrial: boolean
  plans: PlanInfo[]
}

export default function SubscriptionPage() {
  const [data, setData] = useState<BusinessSubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/owner/subscription')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error('Error al cargar información de suscripción')
      }
    } catch {
      toast.error('Error de red al consultar suscripción')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChangePlan = async (targetPlan: PlanInfo) => {
    if (data?.business.plan?.id === targetPlan.id) return

    const confirmMsg = `¿Deseas cambiar tu suscripción al "${targetPlan.name}"? Los límites y beneficios se aplicarán inmediatamente.`
    if (!confirm(confirmMsg)) return

    setChangingPlanId(targetPlan.id)
    try {
      const res = await fetch('/api/owner/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetPlan.id })
      })

      const json = await res.json()
      if (res.ok) {
        toast.success(json.message || `Plan cambiado a "${targetPlan.name}" exitosamente ✨`)
        await fetchData()
      } else {
        toast.error(json.error || 'No se pudo cambiar el plan')
      }
    } catch {
      toast.error('Error de conexión al procesar el cambio de plan')
    } finally {
      setChangingPlanId(null)
    }
  }

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Cargando detalles de tu membresía...
        </p>
      </div>
    )
  }

  if (!data) return null

  const { business, daysRemaining, isExpired, isTrial, plans } = data
  const currentPlan = business.plan

  const startDate = new Date(business.createdAt)
  const endDate = isTrial
    ? (business.trialEndsAt ? new Date(business.trialEndsAt) : null)
    : (business.subscriptionEndsAt ? new Date(business.subscriptionEndsAt) : null)

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* ── HEADER DE SECCIÓN ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
            <Crown className="w-3 h-3 text-amber-600" />
            Membresía &amp; Planes BarberOS
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 uppercase">
          Estado de tu Suscripción
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
          Gestiona el plan de tu barbería, verifica tus días de vigencia y amplía tus límites cuando lo necesites.
        </p>
      </div>

      {/* ── TARJETA PRINCIPAL DE ESTADO ACTUAL ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white p-6 sm:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                isTrial
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : business.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                <Sparkles size={11} className={isTrial ? 'text-amber-400' : 'text-emerald-400'} />
                {isTrial ? 'Mes de Prueba Gratis (30 Días)' : business.status === 'ACTIVE' ? 'Suscripción Activa' : 'Membresía Inactiva'}
              </span>

              {daysRemaining !== null && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isExpired
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : daysRemaining <= 7
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}>
                  <Clock size={11} />
                  {isExpired ? 'Periodo Vencido' : `${daysRemaining} días restantes`}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentPlan ? currentPlan.name : 'Prueba Gratuita Full'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {isTrial
                  ? 'Tienes habilitadas absolutamente todas las funciones de BarberOS a full sin restricciones.'
                  : 'Tu barbería está operando con su plan comercial asignado.'}
              </p>
            </div>

            {/* Fechas calculadas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Fecha de Inicio</span>
                <span className="font-mono font-bold text-zinc-200">
                  {startDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Fecha de Vencimiento</span>
                <span className={`font-mono font-bold ${isExpired ? 'text-rose-400' : 'text-amber-300'}`}>
                  {endDate ? endDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Indefinido'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Capacidad Barberos</span>
                <span className="font-mono font-bold text-zinc-200">
                  Hasta {business.maxBarbers || 10} barberos
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-3 shrink-0 lg:w-72">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Resumen Comercial</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {currentPlan ? formatCOP(currentPlan.price) : '$0 COP'}
                <span className="text-xs font-normal text-zinc-400 font-sans"> / mes</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              {isTrial
                ? 'Aprovecha este periodo para configurar tu catálogo, registrar a tus barberos y compartir tu enlace público.'
                : 'Facturación directa sin comisiones ocultas.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── GRID DE PLANES DISPONIBLES (CONECTADO EN TIEMPO REAL CON SUPER ADMIN) ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
              Planes Disponibles para tu Barbería
            </h3>
            <p className="text-xs text-zinc-500">
              Precios y características sincronizados directamente con la plataforma SaaS. Puedes cambiar de plan en cualquier momento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id
            const isPopular = plan.isPopular
            const isChanging = changingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all ${
                  isCurrent
                    ? 'bg-zinc-950 text-white border-2 border-amber-500 shadow-xl relative'
                    : isPopular
                    ? 'bg-white text-zinc-950 border-2 border-zinc-900 shadow-md hover:shadow-lg'
                    : 'bg-white text-zinc-950 border border-zinc-200/80 shadow-xs hover:border-zinc-300'
                }`}
              >
                {/* Badge de Plan Actual o Recomendado */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 font-black text-[9px] uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    TU PLAN ACTUAL
                  </div>
                )}
                {!isCurrent && isPopular && (
                  <div className="inline-flex items-center gap-1 w-fit bg-zinc-100 text-zinc-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    <Sparkles size={10} />
                    RECOMENDADO
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className={`text-lg font-black uppercase ${isCurrent ? 'text-white' : 'text-zinc-950'}`}>
                      {plan.name}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isCurrent ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Hasta {plan.maxBarbers} barberos y {plan.maxAppointments.toLocaleString()} citas/mes.
                    </p>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black font-mono ${isCurrent ? 'text-white' : 'text-zinc-950'}`}>
                        {formatCOP(plan.price)}
                      </span>
                      <span className={`text-xs font-bold ${isCurrent ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        COP / mes
                      </span>
                    </div>
                  </div>

                  {/* Lista de características */}
                  <div className={`space-y-2.5 pt-4 border-t text-xs ${isCurrent ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    {plan.features.map((feat, i) => (
                      <div key={i} className={`flex items-start gap-2 ${isCurrent ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón de acción */}
                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-wider cursor-default flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Plan en Uso
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChangePlan(plan)}
                      disabled={isChanging}
                      className="w-full py-3 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isChanging ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Actualizando...</span>
                        </>
                      ) : (
                        <>
                          <span>Elegir {plan.name}</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
