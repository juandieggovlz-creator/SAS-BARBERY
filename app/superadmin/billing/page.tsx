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
  X
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

export default function SuperAdminBillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal manual renewal
  const [modalOpen, setModalOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([])
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number }>>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CARD')
  const [periodDays, setPeriodDays] = useState('30')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchBillingData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/superadmin/billing?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setSummary(json.summary)
        setSubscriptions(json.subscriptions || [])
      } else {
        toast.error('Error al cargar datos de facturación')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setLoading(false)
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
        setPlans(pJson.plans || [])
        if (bJson.businesses?.[0]) setSelectedBusinessId(bJson.businesses[0].id)
        if (pJson.plans?.[0]) {
          setSelectedPlanId(pJson.plans[0].id)
          setAmount(String(pJson.plans[0].price))
        }
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchBillingData()
  }, [search, statusFilter])

  const openRenewalModal = () => {
    loadBusinessesAndPlans()
    setModalOpen(true)
  }

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId)
    const found = plans.find(p => p.id === planId)
    if (found) setAmount(String(found.price))
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBusinessId || !selectedPlanId) {
      toast.error('Selecciona barbería y plan')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/superadmin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          planId: selectedPlanId,
          amount: Number(amount),
          paymentMethod,
          periodDays: Number(periodDays),
          notes
        })
      })

      const json = await res.json()
      if (res.ok) {
        toast.success('Cobro y renovación registrados exitosamente')
        setModalOpen(false)
        fetchBillingData()
      } else {
        toast.error(json.error || 'Error al registrar suscripción')
      }
    } catch {
      toast.error('Error al contactar con el servidor')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <DollarSign className="w-3 h-3" />
              Módulo Financiero
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Facturación y MRR BarberOS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Supervisa los ingresos recurrentes mensuales del SaaS, renovaciones y flujo de cobros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBillingData}
            className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openRenewalModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Registrar Cobro</span>
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
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                ARR Anual
              </span>
            </div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">
              {formatCOP(summary.arr)}
            </div>
            <div className="text-xs font-semibold text-zinc-500 mt-1">
              Tasa de Ingreso Anualizada
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
              Proyección 12 meses basada en MRR
            </div>
          </div>

          {/* Pending renewals */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                Próximos 7 días
              </span>
            </div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">
              {summary.pendingRenewalsCount}
            </div>
            <div className="text-xs font-semibold text-zinc-500 mt-1">
              Renovaciones Próximas
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
              Periodos por vencer en la semana
            </div>
          </div>

          {/* Past Due / Vencidos */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                Atención
              </span>
            </div>
            <div className="text-3xl font-black text-rose-600 tracking-tight">
              {summary.pastDueCount}
            </div>
            <div className="text-xs font-semibold text-zinc-500 mt-1">
              Suscripciones Vencidas
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
              Requieren regularización de pago
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH & FILTER ── */}
      <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por barbería, slug o método de pago..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="ACTIVE">Activas</option>
          <option value="TRIALING">En Periodo de Prueba</option>
          <option value="PAST_DUE">Vencidas (Past Due)</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      {/* ── SUBSCRIPTIONS TABLE ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
            <span className="text-xs font-semibold text-zinc-400">Consultando historial de pagos...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <CreditCard className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-bold text-zinc-700">No hay registros de facturación</p>
            <p className="text-xs">Registra un nuevo cobro o renovación de prueba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-6">Barbería</th>
                  <th className="py-4 px-4">Plan</th>
                  <th className="py-4 px-4">Monto Cobrado</th>
                  <th className="py-4 px-4">Método</th>
                  <th className="py-4 px-4">Periodo Activo</th>
                  <th className="py-4 px-4">Estado</th>
                  <th className="py-4 px-6 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {subscriptions.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-800 shrink-0">
                          {s.businessName.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/superadmin/businesses/${s.businessId}`}
                            className="font-bold text-zinc-950 hover:text-amber-600 transition-colors"
                          >
                            {s.businessName}
                          </Link>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            /{s.businessSlug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-zinc-900">
                        {s.planName}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-zinc-950 font-mono">
                        {formatCOP(s.amount)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-zinc-600 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-[10px] font-mono">
                        {s.paymentMethod}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-[11px] text-zinc-500">
                      <div>
                        {new Date(s.currentPeriodStart).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        {' → '}
                        <strong className="text-zinc-900">
                          {new Date(s.currentPeriodEnd).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </strong>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.status === 'TRIALING'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'ACTIVE' ? 'bg-emerald-500' : s.status === 'TRIALING' ? 'bg-blue-500' : 'bg-rose-500'
                        }`} />
                        {s.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {s.notes && (
                        <span className="text-[10px] text-zinc-500 italic truncate max-w-[120px] inline-block" title={s.notes}>
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

      {/* ── MODAL MANUAL RENEWAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  Registrar Cobro y Renovación SaaS
                </h3>
                <p className="text-xs text-zinc-500">
                  Extiende el periodo de suscripción de una barbería y actualiza su plan.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Barbería a Facturar
                </label>
                <select
                  required
                  value={selectedBusinessId}
                  onChange={e => setSelectedBusinessId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none cursor-pointer focus:border-zinc-950"
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
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none cursor-pointer focus:border-zinc-950"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCOP(p.price)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Monto (COP)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-950"
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
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none cursor-pointer focus:border-zinc-950"
                  >
                    <option value="CARD">Tarjeta de Crédito / Débito</option>
                    <option value="TRANSFER">Transferencia Bancaria (PSE / Bancolombia / Nequi)</option>
                    <option value="CASH">Efectivo / Manual</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Días de Vigencia
                  </label>
                  <input
                    type="number"
                    required
                    value={periodDays}
                    onChange={e => setPeriodDays(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Notas de Pago / Comprobante (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Aprobación PSE #8912389"
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-950"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar y Renovar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
