'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Calendar,
  Building2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Layers,
  X,
  FileText,
  Phone,
  MessageCircle,
  Check,
  Ban,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BillingSummary {
  mrr: number
  arr: number
  activeBusinessesCount: number
  pendingRenewalsCount: number
  pastDueCount: number
  totalSubscriptions: number
}

interface SubscriptionItem {
  id: string
  businessId: string
  businessName: string
  businessSlug: string
  businessEmail?: string | null
  planName: string
  amount: number
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  paymentMethod: string
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
  notes?: string | null
}

interface PlanRequestItem {
  id: string
  businessId: string
  businessName: string
  businessSlug: string
  businessStatus: string
  currentPlanName: string
  planId: string
  planName: string
  planSlug: string
  billingCycle: string
  amount: number
  requestType?: string | null
  status: string
  contactName: string
  contactEmail: string
  contactPhone: string
  paymentMethod?: string | null
  paymentReference?: string | null
  notes?: string | null
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
}

export default function SuperAdminBillingPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'subscriptions'>('requests')

  // Financial summary & subscriptions
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [subSearch, setSubSearch] = useState('')
  const [subStatusFilter, setSubStatusFilter] = useState('ALL')

  // Plan Requests
  const [requests, setRequests] = useState<PlanRequestItem[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({})
  const [requestStatusFilter, setRequestStatusFilter] = useState('ALL')
  const [requestSearch, setRequestSearch] = useState('')

  // Activation & Renewal Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([])
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number }>>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER')
  const [paymentReference, setPaymentReference] = useState('')
  const [periodMonths, setPeriodMonths] = useState('1')
  const [preserveRemainingDays, setPreserveRemainingDays] = useState(true)
  const [linkedPlanRequestId, setLinkedPlanRequestId] = useState<string | null>(null)
  const [activationNotes, setActivationNotes] = useState('')
  const [activationType, setActivationType] = useState<'RENEWAL_EXTENSION' | 'UPGRADE_IMMEDIATE_DIFFERENCE' | 'UPGRADE_NEW_FULL_PERIOD'>('RENEWAL_EXTENSION')
  const [submittingActivation, setSubmittingActivation] = useState(false)

  // Status update modal / inline
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null)

  const fetchSubscriptions = async () => {
    setLoadingSubs(true)
    try {
      const params = new URLSearchParams()
      if (subSearch) params.set('search', subSearch)
      if (subStatusFilter !== 'ALL') params.set('status', subStatusFilter)

      const res = await fetch(`/api/superadmin/billing?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setSummary(json.summary)
        setSubscriptions(json.subscriptions || [])
      }
    } catch {
      toast.error('Error al cargar datos de facturación')
    } finally {
      setLoadingSubs(false)
    }
  }

  const fetchRequests = async () => {
    setLoadingRequests(true)
    try {
      const params = new URLSearchParams()
      if (requestSearch) params.set('search', requestSearch)
      if (requestStatusFilter !== 'ALL') params.set('status', requestStatusFilter)

      const res = await fetch(`/api/superadmin/billing/requests?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setRequests(json.requests || [])
        setRequestCounts(json.counts || {})
      }
    } catch {
      toast.error('Error al cargar solicitudes de planes')
    } finally {
      setLoadingRequests(false)
    }
  }

  const loadBusinessesAndPlans = async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        fetch('/api/superadmin/businesses'),
        fetch('/api/superadmin/plans')
      ])
      if (bRes.ok && pRes.ok) {
        const bJson = await bRes.json()
        const pJson = await pRes.json()
        setBusinesses(bJson.businesses || [])
        // Filtramos para activación planes comerciales (excluyendo sandbox)
        const validPlans = (pJson.plans || []).filter((p: any) => p.slug !== 'sandbox')
        setPlans(validPlans)
        if (bJson.businesses?.[0] && !selectedBusinessId) setSelectedBusinessId(bJson.businesses[0].id)
        if (validPlans[0] && !selectedPlanId) {
          setSelectedPlanId(validPlans[0].id)
          setAmount(String(validPlans[0].price))
        }
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [subSearch, subStatusFilter])

  useEffect(() => {
    fetchRequests()
  }, [requestSearch, requestStatusFilter])

  const openNewActivationModal = () => {
    setLinkedPlanRequestId(null)
    setPaymentReference('')
    setActivationNotes('')
    setPreserveRemainingDays(true)
    setActivationType('RENEWAL_EXTENSION')
    loadBusinessesAndPlans()
    setModalOpen(true)
  }

  const openApproveRequestModal = (req: PlanRequestItem) => {
    loadBusinessesAndPlans()
    setSelectedBusinessId(req.businessId)
    setSelectedPlanId(req.planId)
    setAmount(String(req.amount))
    setPaymentMethod(req.paymentMethod || 'TRANSFER')
    setPaymentReference(req.paymentReference || '')
    setLinkedPlanRequestId(req.id)
    setPreserveRemainingDays(true)
    setActivationType(req.requestType === 'UPGRADE' ? 'UPGRADE_IMMEDIATE_DIFFERENCE' : 'RENEWAL_EXTENSION')
    setActivationNotes(`Aprobación de orden ${req.id} para ${req.contactName}`)
    setModalOpen(true)
  }

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId)
    const found = plans.find(p => p.id === planId)
    if (found) setAmount(String(found.price))
  }

  const handleExecuteActivation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBusinessId || !selectedPlanId) {
      toast.error('Selecciona barbería y plan')
      return
    }

    setSubmittingActivation(true)
    try {
      const res = await fetch('/api/superadmin/billing/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          planId: selectedPlanId,
          amount: Number(amount),
          paymentMethod,
          paymentReference: paymentReference || undefined,
          periodMonths: Number(periodMonths),
          preserveRemainingDays,
          activationType,
          planRequestId: linkedPlanRequestId || undefined,
          notes: activationNotes || undefined
        })
      })

      const json = await res.json()
      if (res.ok) {
        toast.success(json.message || 'Suscripción activada exitosamente ✨')
        setModalOpen(false)
        fetchSubscriptions()
        fetchRequests()
      } else {
        toast.error(json.error || 'Error al activar suscripción')
      }
    } catch {
      toast.error('Error de red al procesar activación')
    } finally {
      setSubmittingActivation(false)
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    setUpdatingRequestId(requestId)
    try {
      const res = await fetch('/api/superadmin/billing/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: newStatus })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(`Estado actualizado a ${newStatus}`)
        fetchRequests()
      } else {
        toast.error(json.error || 'Error al actualizar estado')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setUpdatingRequestId(null)
    }
  }

  const getCleanPhone = (phone?: string) => {
    if (!phone) return ''
    const cleaned = phone.replace(/[^\d+]/g, '')
    if (!cleaned.startsWith('+') && !cleaned.startsWith('57') && cleaned.length === 10) {
      return `57${cleaned}`
    }
    return cleaned.replace('+', '')
  }

  const openWhatsApp = (phone: string, text: string) => {
    const clean = getCleanPhone(phone)
    if (!clean) {
      toast.error('No hay número de teléfono válido registrado')
      return
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)

  const pendingRequestsCount = requestCounts['PENDING'] || 0

  return (
    <div className="space-y-6 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <DollarSign className="w-3 h-3" />
              Gestión Comercial & Pagos Manuales
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.03em' }}>
            Facturación, Solicitudes & Activaciones
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Administra órdenes de compra de planes, cobros manuales y suscripciones activas del SaaS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchSubscriptions(); fetchRequests(); }}
            className="p-2.5 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openNewActivationModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-zinc-950" />
            <span>Activar / Renovar Plan</span>
          </button>
        </div>
      </div>

      {/* ── FINANCIAL SUMMARY METRICS ── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR */}
          <div className="p-6 bg-zinc-950 text-white border border-zinc-900 rounded-2xl shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> MRR
              </span>
            </div>
            <div className="text-3xl font-black tracking-tight text-white relative z-10">
              {formatCOP(summary.mrr)}
            </div>
            <div className="text-xs font-semibold text-zinc-400 mt-1 relative z-10">
              Ingresos Recurrentes Mensuales
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 relative z-10">
              <span>{summary.activeBusinessesCount} barberías de pago</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> En tiempo real
              </span>
            </div>
          </div>

          {/* ARR */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                ARR Anual
              </span>
            </div>
            <div className="text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
              {formatCOP(summary.arr)}
            </div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
              Tasa de Ingreso Anualizada
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
              Proyección 12 meses basada en MRR
            </div>
          </div>

          {/* Solicitudes Pendientes */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-500/20">
                Por Atender
              </span>
            </div>
            <div className="text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
              {pendingRequestsCount}
            </div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
              Órdenes de Plan Pendientes
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
              Barberías listas para pago manual
            </div>
          </div>

          {/* Past Due / Vencidos */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-500/20">
                Atención
              </span>
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {summary.pastDueCount}
            </div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
              Suscripciones Vencidas
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
              Operando en Modo Sandbox
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTOR DE TABS ── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'border-amber-500 text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Solicitudes de Planes</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-zinc-950 font-black">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'subscriptions'
              ? 'border-amber-500 text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Suscripciones Activas & Facturación</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: SOLICITUDES DE PLANES
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="p-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={requestSearch}
                onChange={e => setRequestSearch(e.target.value)}
                placeholder="Buscar por barbería, slug, contacto, teléfono o referencia..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <select
              value={requestStatusFilter}
              onChange={e => setRequestStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PENDING">Pendientes ({requestCounts['PENDING'] || 0})</option>
              <option value="CONTACTED">Contactados</option>
              <option value="WAITING_PAYMENT">Esperando Pago</option>
              <option value="PAYMENT_UNDER_REVIEW">Pago en Revisión</option>
              <option value="APPROVED">Aprobados</option>
              <option value="REJECTED">Rechazados</option>
            </select>
          </div>

          {/* Tabla de Solicitudes */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            {loadingRequests ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs font-semibold text-zinc-400">Consultando solicitudes...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No hay solicitudes registradas</p>
                <p className="text-xs">Las solicitudes generadas por barberos aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <th className="py-4 px-6">Barbería</th>
                      <th className="py-4 px-4">Plan Solicitado</th>
                      <th className="py-4 px-4">Monto & Ciclo</th>
                      <th className="py-4 px-4">Contacto & Teléfono</th>
                      <th className="py-4 px-4">Pago / Ref</th>
                      <th className="py-4 px-4">Estado</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {requests.map(r => (
                      <tr key={r.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="py-4 px-6">
                          <Link
                            href={`/superadmin/businesses/${r.businessId}`}
                            className="font-bold text-zinc-950 dark:text-white hover:text-amber-500 transition-colors block"
                          >
                            {r.businessName}
                          </Link>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            /{r.businessSlug} · {r.currentPlanName}
                          </div>
                        </td>

                        <td className="py-4 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          {r.planName}
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-mono font-bold text-zinc-950 dark:text-white">
                            {formatCOP(r.amount)}
                          </div>
                          <span className="text-[10px] uppercase text-zinc-500 font-semibold">
                            {r.billingCycle}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{r.contactName}</div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <span>{r.contactPhone || 'Sin tel'}</span>
                            {r.contactPhone && (
                              <button
                                onClick={() => openWhatsApp(
                                  r.contactPhone,
                                  `Hola ${r.contactName}, te escribimos de BarberOS respecto a tu solicitud para el ${r.planName}. ¿En qué podemos ayudarte para completar tu activación?`
                                )}
                                className="text-emerald-600 hover:text-emerald-500 p-0.5 cursor-pointer"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400">
                            {r.paymentMethod || 'TRANSFERENCIA'}
                          </div>
                          {r.paymentReference && (
                            <div className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]" title={r.paymentReference}>
                              Ref: {r.paymentReference}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateRequestStatus(r.id, e.target.value)}
                            disabled={updatingRequestId === r.id}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer outline-none ${
                              r.status === 'PENDING'
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                                : r.status === 'CONTACTED'
                                ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/40'
                                : r.status === 'WAITING_PAYMENT'
                                ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/40'
                                : r.status === 'APPROVED'
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                            }`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="WAITING_PAYMENT">WAITING_PAYMENT</option>
                            <option value="PAYMENT_UNDER_REVIEW">PAYMENT_UNDER_REVIEW</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.status !== 'APPROVED' && (
                              <button
                                onClick={() => openApproveRequestModal(r)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Aprobar & Activar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: SUSCRIPCIONES ACTIVAS & FACTURACIÓN
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
                placeholder="Buscar por barbería, slug o método de pago..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <select
              value={subStatusFilter}
              onChange={e => setSubStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Activas</option>
              <option value="TRIALING">En Periodo de Prueba</option>
              <option value="PAST_DUE">Vencidas (Past Due)</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            {loadingSubs ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-950 dark:text-zinc-100" />
                <span className="text-xs font-semibold text-zinc-400">Consultando historial de pagos...</span>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <CreditCard className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No hay registros de facturación</p>
                <p className="text-xs">Registra un nuevo cobro o renovación de prueba.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <th className="py-4 px-6">Barbería</th>
                      <th className="py-4 px-4">Plan</th>
                      <th className="py-4 px-4">Monto Cobrado</th>
                      <th className="py-4 px-4">Método</th>
                      <th className="py-4 px-4">Periodo Activo</th>
                      <th className="py-4 px-4">Estado</th>
                      <th className="py-4 px-6 text-right">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {subscriptions.map(s => (
                      <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="py-4 px-6">
                          <Link
                            href={`/superadmin/businesses/${s.businessId}`}
                            className="font-bold text-zinc-950 dark:text-white hover:text-amber-500 transition-colors block"
                          >
                            {s.businessName}
                          </Link>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            /{s.businessSlug}
                          </div>
                        </td>

                        <td className="py-4 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          {s.planName}
                        </td>

                        <td className="py-4 px-4 font-bold text-zinc-950 dark:text-white font-mono">
                          {formatCOP(s.amount)}
                        </td>

                        <td className="py-4 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                          <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-800 dark:text-zinc-200">
                            {s.paymentMethod}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <div>
                            {new Date(s.currentPeriodStart).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                            {' → '}
                            <strong className="text-zinc-900 dark:text-zinc-100">
                              {new Date(s.currentPeriodEnd).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </strong>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-bold'
                              : s.status === 'TRIALING'
                              ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/40 font-bold'
                              : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40 font-bold'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              s.status === 'ACTIVE' ? 'bg-emerald-500' : s.status === 'TRIALING' ? 'bg-blue-500' : 'bg-rose-500'
                            }`} />
                            {s.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          {s.notes && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic truncate max-w-[120px] inline-block" title={s.notes}>
                              {s.notes}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL DE ACTIVACIÓN & RENOVACIÓN MANUAL
      ══════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  {linkedPlanRequestId ? 'Aprobar & Activar Plan Solicitado' : 'Registrar Cobro y Activación SaaS'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Registra el pago manual y extiende el período con preservación de días restantes.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteActivation} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Barbería a Activar
                </label>
                <select
                  required
                  value={selectedBusinessId}
                  onChange={e => setSelectedBusinessId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer focus:border-zinc-950"
                >
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Plan
                  </label>
                  <select
                    required
                    value={selectedPlanId}
                    onChange={e => handlePlanChange(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer focus:border-zinc-950"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCOP(p.price)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Monto Cobrado (COP)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer focus:border-zinc-950"
                  >
                    <option value="TRANSFER">Transferencia Bancaria</option>
                    <option value="NEQUI">Nequi</option>
                    <option value="DAVIPLATA">Daviplata</option>
                    <option value="PSE">PSE / Enlace</option>
                    <option value="CASH">Efectivo / Manual</option>
                    <option value="CARD">Tarjeta</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Duración (Meses Calendario)
                  </label>
                  <select
                    value={periodMonths}
                    onChange={e => setPeriodMonths(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer focus:border-zinc-950"
                  >
                    <option value="1">1 Mes Calendario</option>
                    <option value="3">3 Meses Calendario</option>
                    <option value="6">6 Meses Calendario</option>
                    <option value="12">12 Meses (1 Año Completo)</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Operación Comercial */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block mb-1.5">
                  Tipo de Operación Comercial
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActivationType('RENEWAL_EXTENSION')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activationType === 'RENEWAL_EXTENSION'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 font-bold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium'
                    }`}
                  >
                    <div className="text-[11px] font-black">Renovación / Extensión</div>
                    <div className="text-[10px] opacity-80 mt-0.5 leading-snug">Suma meses a la vigencia actual conservando días pagados.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivationType('UPGRADE_IMMEDIATE_DIFFERENCE')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activationType === 'UPGRADE_IMMEDIATE_DIFFERENCE'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 font-bold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium'
                    }`}
                  >
                    <div className="text-[11px] font-black">Mejora por Diferencia</div>
                    <div className="text-[10px] opacity-80 mt-0.5 leading-snug">Sube de plan de inmediato manteniendo la fecha de vencimiento.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivationType('UPGRADE_NEW_FULL_PERIOD')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activationType === 'UPGRADE_NEW_FULL_PERIOD'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 font-bold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium'
                    }`}
                  >
                    <div className="text-[11px] font-black">Nuevo Período Completo</div>
                    <div className="text-[10px] opacity-80 mt-0.5 leading-snug">Inicia nueva vigencia completa a partir de hoy.</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Nro. Referencia / Comprobante
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="Ej: Aprobación PSE #8912389 o Ref. Bancolombia"
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-950"
                />
              </div>

              {/* Efecto de la Operación */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-start gap-2">
                <Sparkles size={16} className="shrink-0 mt-0.5 text-blue-400" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-white">Efecto previsto: </span>
                  {activationType === 'RENEWAL_EXTENSION' && (
                    <span>Se sumarán {periodMonths} mes(es) calendario conservando los días no disfrutados si la suscripción aún está vigente.</span>
                  )}
                  {activationType === 'UPGRADE_IMMEDIATE_DIFFERENCE' && (
                    <span>Se actualizará el plan y los límites técnicos de inmediato sin alterar la fecha de vencimiento actual.</span>
                  )}
                  {activationType === 'UPGRADE_NEW_FULL_PERIOD' && (
                    <span>Se activará el plan con {periodMonths} mes(es) calendario completos iniciando desde hoy.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Notas de Auditoría
                </label>
                <input
                  type="text"
                  value={activationNotes}
                  onChange={e => setActivationNotes(e.target.value)}
                  placeholder="Ej: Activación coordinada por WhatsApp con Carlos"
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-950"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingActivation}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {submittingActivation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-zinc-950" />
                      <span>Confirmar & Activar</span>
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
