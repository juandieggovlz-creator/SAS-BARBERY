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
  HelpCircle,
  X,
  Send,
  MessageCircle,
  FileText,
  BadgeAlert,
  Layers,
  Info
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

interface PendingRequestInfo {
  id: string
  status: string
  planName: string
  planSlug: string
  amount: number
  billingCycle: string
  createdAt: string
  notes?: string | null
  adminNotes?: string | null
}

interface RecentSubscriptionInfo {
  id: string
  planName: string
  amount: number
  status: string
  paymentMethod?: string | null
  paymentReference?: string | null
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
}

interface EffectiveSubscriptionData {
  tier: string
  isTrial: boolean
  isSandbox: boolean
  isPaidActive: boolean
  isInGracePeriod: boolean
  graceDaysRemaining: number | null
  isSuspended: boolean
  daysRemaining: number | null
  statusLabel: string
  expiresAt: string | null
  plan: {
    id?: string
    name: string
    slug: string
    price: number
    maxBarbers: number
    maxBranches: number
  }
  permissions: {
    canUsePublicBooking: boolean
    canUseWebEditor: boolean
    canUseWhatsApp: boolean
    canUseCommissions: boolean
    canUseAdvancedReports: boolean
    canUseDeposits: boolean
    canUseMultiBranch: boolean
  }
  limits: {
    maxBarbers: number
    maxBranches: number
    maxClients: number
    maxAppointments: number
  }
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
  effectiveSub?: EffectiveSubscriptionData
  daysRemaining: number | null
  isInGracePeriod?: boolean
  graceDaysRemaining?: number | null
  isExpired: boolean
  isTrial: boolean
  isSandbox: boolean
  pendingRequest: PendingRequestInfo | null
  plans: PlanInfo[]
  allPlans?: PlanInfo[]
  recentSubscriptions: RecentSubscriptionInfo[]
}

export default function SubscriptionPage() {
  const [data, setData] = useState<BusinessSubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal para solicitar plan
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [selectedPlanForRequest, setSelectedPlanForRequest] = useState<PlanInfo | null>(null)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'YEARLY'>('MONTHLY')
  const [contactPhone, setContactPhone] = useState('')
  const [contactName, setContactName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER')
  const [paymentReference, setPaymentReference] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false)

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

  const openRequestModal = (plan: PlanInfo) => {
    setSelectedPlanForRequest(plan)
    setBillingCycle('MONTHLY')
    setPaymentReference('')
    setRequestNotes('')
    setRequestModalOpen(true)
  }

  const handleSendPlanRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanForRequest) return

    setSubmittingRequest(true)
    try {
      const res = await fetch('/api/owner/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanForRequest.id,
          billingCycle,
          contactName: contactName || undefined,
          contactPhone: contactPhone || undefined,
          paymentMethod,
          paymentReference: paymentReference || undefined,
          notes: requestNotes || undefined
        })
      })

      const json = await res.json()
      if (res.ok) {
        toast.success(json.message || 'Solicitud enviada exitosamente ✨')
        setRequestModalOpen(false)
        await fetchData()
      } else {
        toast.error(json.error || 'No se pudo enviar la solicitud')
      }
    } catch {
      toast.error('Error de conexión al enviar la solicitud')
    } finally {
      setSubmittingRequest(false)
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

  const { business, daysRemaining, isExpired, isTrial, isSandbox, pendingRequest, plans, recentSubscriptions } = data
  const effective = data.effectiveSub
  const currentPlan = business.plan

  const startDate = new Date(business.createdAt)
  const endDate = isTrial
    ? (business.trialEndsAt ? new Date(business.trialEndsAt) : null)
    : (business.subscriptionEndsAt ? new Date(business.subscriptionEndsAt) : null)

  // Cálculo del precio según el ciclo en modal
  const getCycleMultiplier = () => {
    if (billingCycle === 'QUARTERLY') return 3
    if (billingCycle === 'BIANNUAL') return 6
    if (billingCycle === 'YEARLY') return 12
    return 1
  }

  const getCycleDiscount = () => {
    if (billingCycle === 'QUARTERLY') return 0.05
    if (billingCycle === 'BIANNUAL') return 0.10
    if (billingCycle === 'YEARLY') return 0.15
    return 0
  }

  const calculateTotal = (basePrice: number) => {
    const mult = getCycleMultiplier()
    const disc = getCycleDiscount()
    const raw = basePrice * mult
    return Math.round(raw * (1 - disc))
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HEADER DE SECCIÓN ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
            <Crown className="w-3.5 h-3.5" />
            Membresía & Planes Comerciales BarberOS
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white uppercase" style={{ letterSpacing: '-0.03em' }}>
          Estado de tu Suscripción
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
          Gestiona el plan de tu barbería, verifica tus días de vigencia y contrata o renueva tu plan cuando lo necesites.
        </p>
      </div>

      {/* ── ALERTA DE PERÍODO DE GRACIA (SI APLICA) ── */}
      {data.isInGracePeriod && (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/40 text-zinc-900 dark:text-zinc-100 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-black uppercase tracking-wider border border-orange-500/30">
                  Período de Gracia Activo
                </span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  {data.graceDaysRemaining === 1 ? 'Último día de gracia' : `${data.graceDaysRemaining} días de gracia restantes`}
                </span>
              </div>
              <h3 className="font-black text-base tracking-tight text-orange-950 dark:text-orange-100">
                Tu período comercial ha finalizado
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                Tus servicios se mantienen activos temporalmente durante este período de gracia de cortesía. <strong>Renueva tu plan ahora</strong> para evitar que las reservas públicas online pasen a pausa y se apliquen los límites de Modo Sandbox.
              </p>
            </div>
          </div>
          {plans.length > 0 && (
            <button
              onClick={() => openRequestModal(currentPlan || plans[0])}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
            >
              Renovar Plan Ahora
            </button>
          )}
        </div>
      )}

      {/* ── ALERTA DE MODO SANDBOX (SI APLICA) ── */}
      {isSandbox && (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-zinc-900 dark:text-zinc-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <BadgeAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-base tracking-tight">
                Operando en Modo Sandbox (Operación Manual Gratuita)
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                Tu periodo comercial o prueba ha finalizado. <strong>Tus datos, citas, clientes e historial siguen 100% protegidos.</strong> Puedes seguir gestionando tu agenda interna manualmente con 1 barbero activo. Para reactivar reservas públicas online, WhatsApp y reportes avanzados, solicita un plan oficial.
              </p>
            </div>
          </div>
          {plans.length > 0 && (
            <button
              onClick={() => openRequestModal(plans[0])}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
            >
              Activar Plan Comercial
            </button>
          )}
        </div>
      )}

      {/* ── TARJETA PRINCIPAL DE ESTADO ACTUAL ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-6 sm:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                data.isInGracePeriod
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : isTrial
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : isSandbox
                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  : business.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                <Sparkles size={11} className={data.isInGracePeriod ? 'text-orange-400' : isTrial ? 'text-amber-400' : isSandbox ? 'text-zinc-400' : 'text-emerald-400'} />
                {data.isInGracePeriod
                  ? `En Período de Gracia (${data.graceDaysRemaining} días)`
                  : isTrial
                  ? 'Mes de Prueba Gratis (30 Días)'
                  : isSandbox
                  ? 'Modo Sandbox Activo'
                  : business.status === 'ACTIVE'
                  ? 'Suscripción Activa'
                  : 'Membresía Suspendida'}
              </span>

              {daysRemaining !== null && !isSandbox && !data.isInGracePeriod && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  daysRemaining <= 3
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : daysRemaining <= 7
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}>
                  <Clock size={11} />
                  {daysRemaining === 0 ? 'Expira hoy' : `${daysRemaining} días restantes`}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isSandbox ? 'Modo Sandbox' : currentPlan ? currentPlan.name : 'Prueba Gratuita Premium (30 Días)'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {isTrial
                  ? 'Tienes habilitadas absolutamente todas las funciones avanzadas de BarberOS a full sin restricciones.'
                  : isSandbox
                  ? 'Operación interna manual activa. Reservas públicas online pausadas.'
                  : 'Tu barbería está operando con su plan comercial asignado.'}
              </p>
            </div>

            {/* Fechas calculadas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Fecha de Registro</span>
                <span className="font-mono font-bold text-zinc-200">
                  {startDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Fecha de Vencimiento</span>
                <span className={`font-mono font-bold ${isSandbox ? 'text-zinc-500' : 'text-amber-300'}`}>
                  {endDate && !isSandbox
                    ? endDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : isSandbox
                    ? 'Sin vencimiento (Gratuito)'
                    : 'Indefinido'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Capacidad Barberos</span>
                <span className="font-mono font-bold text-zinc-200">
                  Hasta {effective?.limits.maxBarbers || business.maxBarbers || 1} barbero(s)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-3 shrink-0 lg:w-72">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Inversión Actual</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {isSandbox ? '$0 COP' : currentPlan ? formatCOP(currentPlan.price) : '$0 COP'}
                <span className="text-xs font-normal text-zinc-400 font-sans"> / mes</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              {isTrial
                ? 'Prueba 30 días con reservas públicas online, página web y catálogo completo.'
                : isSandbox
                ? 'Sin cobros mensuales. Puedes solicitar un plan oficial en cualquier momento.'
                : 'Facturación directa sin contratos forzosos.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── ESTADO DE SOLICITUD PENDIENTE (SI EXISTE) ── */}
      {pendingRequest && (
        <div className="rounded-3xl p-6 bg-blue-500/10 border border-blue-500/30 text-zinc-900 dark:text-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                {pendingRequest.status === 'PENDING' ? 'Solicitud Recibida' :
                 pendingRequest.status === 'CONTACTED' ? 'Contactado por Soporte' :
                 pendingRequest.status === 'WAITING_PAYMENT' ? 'Esperando Pago' :
                 pendingRequest.status === 'PAYMENT_UNDER_REVIEW' ? 'Comprobante en Revisión' : pendingRequest.status}
              </span>
              <span className="text-xs text-zinc-500">
                {new Date(pendingRequest.createdAt).toLocaleDateString('es-CO')}
              </span>
            </div>
            <h4 className="font-bold text-sm">
              Solicitud para {pendingRequest.planName} ({formatCOP(pendingRequest.amount)})
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Nuestro equipo administrativo o Super Admin ha recibido tu orden. Si realizaste una transferencia, puedes enviar tu comprobante a <span className="font-semibold text-blue-600 dark:text-blue-400">soporte@barberos.co</span> o coordinarlo por WhatsApp.
            </p>
            {pendingRequest.adminNotes && (
              <p className="text-xs text-blue-800 dark:text-blue-300 bg-blue-500/15 p-2 rounded-xl mt-2 border border-blue-500/20">
                <strong>Nota de Administración:</strong> {pendingRequest.adminNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── GRID DE PLANES DISPONIBLES (CON BOTÓN "SOLICITAR PLAN") ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">
              Planes Comerciales Disponibles
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Selecciona el plan ideal para tu barbería y genera tu orden de contratación o renovación.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Layers size={14} className="text-amber-500" />
            <span>{showComparison ? 'Ocultar Comparativa' : 'Comparar los 4 Planes'}</span>
          </button>
        </div>

        {/* ── MATRIZ COMPARATIVA DE LOS 4 PLANES (INCLUYENDO SANDBOX) ── */}
        {showComparison && (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm animate-fadeIn">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" />
                  Matriz Comparativa Oficial BarberOS
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Límites y capacidades reales respaldados en el backend para cada membresía.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                    <th className="py-3 px-4 font-bold">Característica</th>
                    <th className="py-3 px-4 font-bold text-center">
                      <span className="block text-zinc-900 dark:text-white font-black">Sandbox</span>
                      <span className="text-[10px] text-zinc-500 font-mono">$0 COP</span>
                    </th>
                    <th className="py-3 px-4 font-bold text-center">
                      <span className="block text-zinc-900 dark:text-white font-black">Básico</span>
                      <span className="text-[10px] text-zinc-500 font-mono">$69.900/mes</span>
                    </th>
                    <th className="py-3 px-4 font-bold text-center bg-amber-500/5 border-x border-amber-500/20">
                      <span className="block text-amber-600 dark:text-amber-400 font-black">Profesional</span>
                      <span className="text-[10px] text-zinc-500 font-mono">$119.900/mes</span>
                    </th>
                    <th className="py-3 px-4 font-bold text-center">
                      <span className="block text-zinc-900 dark:text-white font-black">Premium VIP</span>
                      <span className="text-[10px] text-zinc-500 font-mono">$169.900/mes</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <tr>
                    <td className="py-3 px-4 font-semibold">Sedes Físicas Incluidas</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">1 sede</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">1 sede</td>
                    <td className="py-3 px-4 text-center font-mono font-bold bg-amber-500/5 border-x border-amber-500/20">1 sede</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-500">2 sedes (Multisede)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Barberos Activos Permitidos</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">1 barbero</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">Hasta 3</td>
                    <td className="py-3 px-4 text-center font-mono font-bold bg-amber-500/5 border-x border-amber-500/20">Hasta 10</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-500">Hasta 30</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Agenda Interna y Clientes</td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center bg-amber-500/5 border-x border-amber-500/20"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Página Web y Reservas Públicas 24/7</td>
                    <td className="py-3 px-4 text-center text-zinc-400"><X size={14} className="text-zinc-400 mx-auto" /> (Pausada)</td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center bg-amber-500/5 border-x border-amber-500/20"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">WhatsApp Cloud API Automatizado</td>
                    <td className="py-3 px-4 text-center text-zinc-400"><X size={14} className="text-zinc-400 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-zinc-400"><X size={14} className="text-zinc-400 mx-auto" /></td>
                    <td className="py-3 px-4 text-center bg-amber-500/5 border-x border-amber-500/20"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Comisiones y Cierres de Caja Ciegos</td>
                    <td className="py-3 px-4 text-center text-zinc-400"><X size={14} className="text-zinc-400 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-zinc-400"><X size={14} className="text-zinc-400 mx-auto" /></td>
                    <td className="py-3 px-4 text-center bg-amber-500/5 border-x border-amber-500/20"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Reportes Avanzados & Métricas</td>
                    <td className="py-3 px-4 text-center text-zinc-400">Básicos</td>
                    <td className="py-3 px-4 text-center text-zinc-400">Básicos</td>
                    <td className="py-3 px-4 text-center bg-amber-500/5 border-x border-amber-500/20"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Protección y Retención Histórica de Datos</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">100% Intacto</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">100% Intacto</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">100% Intacto</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">100% Intacto</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isCurrent = !isSandbox && currentPlan?.id === plan.id
            const isPopular = plan.isPopular

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all ${
                  isCurrent
                    ? 'bg-zinc-950 text-white border-2 border-amber-500 shadow-xl relative'
                    : isPopular
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white border-2 border-amber-500/80 shadow-md hover:shadow-lg'
                    : 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300'
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
                  <div className="inline-flex items-center gap-1 w-fit bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    <Sparkles size={10} />
                    MÁS ELEGIDO
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className={`text-lg font-black uppercase ${isCurrent ? 'text-white' : 'text-zinc-950 dark:text-white'}`}>
                      {plan.name}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isCurrent ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      Hasta {plan.maxBarbers} barberos y {plan.maxAppointments.toLocaleString()} citas/mes.
                    </p>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black font-mono ${isCurrent ? 'text-white' : 'text-zinc-950 dark:text-white'}`}>
                        {formatCOP(plan.price)}
                      </span>
                      <span className={`text-xs font-bold ${isCurrent ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        COP / mes
                      </span>
                    </div>
                  </div>

                  {/* Lista de características */}
                  <div className={`space-y-2.5 pt-4 border-t text-xs ${isCurrent ? 'border-zinc-800' : 'border-zinc-100 dark:border-zinc-800'}`}>
                    {plan.features.map((feat, i) => (
                      <div key={i} className={`flex items-start gap-2 ${isCurrent ? 'text-zinc-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        <Check size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón de acción */}
                <div>
                  <button
                    onClick={() => openRequestModal(plan)}
                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                        : isPopular
                        ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>{isCurrent ? 'Renovar Este Plan' : `Solicitar ${plan.name}`}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── HISTORIAL DE PAGOS & SUSCRIPCIONES SAAS ── */}
      {recentSubscriptions && recentSubscriptions.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            Historial de Facturación y Activaciones
          </h3>
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Monto</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4">Vigencia</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                  {recentSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-bold text-zinc-950 dark:text-white">{sub.planName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatCOP(sub.amount)}</td>
                      <td className="py-3 px-4 uppercase text-zinc-500">{sub.paymentMethod || 'MANUAL'}</td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{sub.paymentReference || '—'}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {new Date(sub.currentPeriodStart).toLocaleDateString('es-CO')} → {new Date(sub.currentPeriodEnd).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: SOLICITAR O RENOVAR PLAN COMERCIAL
      ══════════════════════════════════════════════════════════ */}
      {requestModalOpen && selectedPlanForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                  Orden de Activación
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
                Solicitar {selectedPlanForRequest.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Completa tus datos de contacto para coordinar la activación de tu plan por Super Admin.
              </p>
            </div>

            {/* Aviso de Política de Pago Manual */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>Pagos 100% transparentes:</strong> El sistema no realiza cobros automáticos a tarjetas de crédito. Esta solicitud registra tu orden para que el Super Admin confirme la recepción de tu transferencia y active tu vigencia de inmediato.
              </div>
            </div>

            <form onSubmit={handleSendPlanRequest} className="space-y-4">
              {/* Ciclo de Facturación */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300">
                  Ciclo de Facturación
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'MONTHLY', label: '1 Mes', desc: 'Tarifa mensual' },
                    { id: 'QUARTERLY', label: '3 Meses', desc: '5% Descuento' },
                    { id: 'BIANNUAL', label: '6 Meses', desc: '10% Descuento' },
                    { id: 'YEARLY', label: '1 Año', desc: '15% Descuento' }
                  ].map((cycle) => (
                    <button
                      key={cycle.id}
                      type="button"
                      onClick={() => setBillingCycle(cycle.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        billingCycle === cycle.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">{cycle.label}</span>
                      <span className="text-[9px] opacity-70 block">{cycle.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Total a Pagar Calculado */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Inversión</span>
                  <span className="text-xl font-black font-mono text-zinc-950 dark:text-white">
                    {formatCOP(calculateTotal(selectedPlanForRequest.price))} COP
                  </span>
                </div>
                <div className="text-right text-[11px] text-zinc-500">
                  Hasta {selectedPlanForRequest.maxBarbers} barberos
                </div>
              </div>

              {/* Teléfono de contacto / WhatsApp */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Teléfono de Contacto o WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Ej: 300 123 4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Método de Pago Preferido */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Método de Pago Preferido
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                >
                  <option value="TRANSFER">Transferencia Bancolombia / Banco</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                  <option value="PSE">PSE / Enlace de Pago</option>
                  <option value="CASH">Efectivo en Punto Oficial</option>
                </select>
              </div>

              {/* Referencia o Comprobante Opcional */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Número de Aprobación / Referencia de Pago (Opcional si ya transferiste)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 987456123 o Nro. Transacción"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Notas opcionales */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Notas o Solicitudes Especiales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="¿Deseas sedes adicionales o soporte para migración de datos?"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="w-1/2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirmar Orden</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
