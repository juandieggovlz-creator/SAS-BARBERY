'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  RefreshCw,
  Crown,
  DollarSign,
  Check,
  Building2,
  X
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PlanItem {
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
  businessesCount: number
}

interface SubscriptionItem {
  id: string
  businessId: string
  businessName: string
  businessSlug: string
  planName: string
  amount: number
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
  paymentMethod: string
}

export default function SuperAdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'PLANS' | 'HISTORY'>('PLANS')
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modal Create / Edit Plan
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('49000')
  const [billingPeriod, setBillingPeriod] = useState('MONTHLY')
  const [maxBarbers, setMaxBarbers] = useState('3')
  const [maxClients, setMaxClients] = useState('500')
  const [maxAppointments, setMaxAppointments] = useState('1000')
  const [featuresText, setFeaturesText] = useState('')
  const [isPopular, setIsPopular] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pRes, bRes] = await Promise.all([
        fetch('/api/superadmin/plans'),
        fetch('/api/superadmin/billing')
      ])

      if (pRes.ok) {
        const pJson = await pRes.json()
        setPlans(pJson.plans || [])
      }

      if (bRes.ok) {
        const bJson = await bRes.json()
        setSubscriptions(bJson.subscriptions || [])
      }
    } catch {
      toast.error('Error al cargar datos de suscripciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateModal = () => {
    setEditingPlan(null)
    setName('')
    setSlug('')
    setPrice('49000')
    setBillingPeriod('MONTHLY')
    setMaxBarbers('3')
    setMaxClients('500')
    setMaxAppointments('1000')
    setFeaturesText('Gestión de citas\nRecordatorios automáticos\nSoporte por WhatsApp')
    setIsPopular(false)
    setIsActive(true)
    setModalOpen(true)
  }

  const openEditModal = (plan: PlanItem) => {
    setEditingPlan(plan)
    setName(plan.name)
    setSlug(plan.slug)
    setPrice(String(plan.price))
    setBillingPeriod(plan.billingPeriod)
    setMaxBarbers(String(plan.maxBarbers))
    setMaxClients(String(plan.maxClients))
    setMaxAppointments(String(plan.maxAppointments))
    setFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '')
    setIsPopular(plan.isPopular)
    setIsActive(plan.isActive)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error('Nombre y slug son requeridos')
      return
    }

    setSaving(true)
    try {
      const featuresArray = featuresText.split('\n').map(f => f.trim()).filter(Boolean)
      const payload = {
        name,
        slug,
        price: Number(price),
        billingPeriod,
        maxBarbers: Number(maxBarbers),
        maxClients: Number(maxClients),
        maxAppointments: Number(maxAppointments),
        features: featuresArray,
        isPopular,
        isActive
      }

      const res = await fetch('/api/superadmin/plans', {
        method: editingPlan ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan ? { ...payload, id: editingPlan.id } : payload)
      })

      if (res.ok) {
        toast.success(editingPlan ? 'Plan actualizado' : 'Plan creado')
        setModalOpen(false)
        fetchData()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setSaving(false)
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
              <CreditCard className="w-3 h-3" />
              Monetización & Suscripciones
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Módulo de Suscripciones
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Administra los planes (Básico, Profesional, Premium), fechas de vencimiento, renovaciones e historial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeTab === 'PLANS' && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Nuevo Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TABS SELECTOR ── */}
      <div className="inline-flex p-1 bg-zinc-100 rounded-xl">
        <button
          onClick={() => setActiveTab('PLANS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PLANS'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Planes SaaS (Básico, Pro, Premium)
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Estado de Renovaciones e Historial ({subscriptions.length})
        </button>
      </div>

      {/* ── TAB 1: PLANES (BÁSICO, PROFESIONAL, PREMIUM) ── */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(p => (
            <div
              key={p.id}
              className={`p-6 bg-white border rounded-2xl shadow-xs relative flex flex-col justify-between ${
                p.isPopular ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-zinc-200'
              }`}
            >
              {p.isPopular && (
                <div className="absolute -top-3 right-6 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-200" /> Recomendado
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}>
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 font-bold">/{p.slug}</span>
                </div>

                <h3 className="text-xl font-black text-zinc-950 tracking-tight">
                  {p.name}
                </h3>

                <div className="mt-3 mb-5">
                  <span className="text-3xl font-black text-zinc-950">
                    {formatCOP(p.price)}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold uppercase"> / mes</span>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {p.businessesCount} barberías suscritas
                  </div>
                </div>

                {/* Quotas */}
                <div className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Barberos permitidos:</span>
                    <strong className="text-zinc-900">{p.maxBarbers}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Clientes máximos:</span>
                    <strong className="text-zinc-900">{p.maxClients.toLocaleString('es-CO')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Citas mensuales:</span>
                    <strong className="text-zinc-900">{p.maxAppointments.toLocaleString('es-CO')}</strong>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {Array.isArray(p.features) && p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-700">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end">
                <button
                  onClick={() => openEditModal(p)}
                  className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 cursor-pointer"
                  title="Editar Plan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: ESTADO DE RENOVACIONES E HISTORIAL ── */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
          {subscriptions.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 space-y-2">
              <CreditCard className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-bold text-zinc-700">No hay renovaciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <th className="py-4 px-6">Negocio</th>
                    <th className="py-4 px-4">Plan</th>
                    <th className="py-4 px-4">Estado</th>
                    <th className="py-4 px-4">Monto Cobrado</th>
                    <th className="py-4 px-4">Próxima Renovación</th>
                    <th className="py-4 px-4">Fecha Vencimiento</th>
                    <th className="py-4 px-6 text-right">Método</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {subscriptions.map(s => (
                    <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-zinc-950">
                        <Link href={`/superadmin/businesses/${s.businessId}`} className="hover:text-amber-600">
                          {s.businessName}
                        </Link>
                      </td>

                      <td className="py-4 px-4 font-semibold text-zinc-900">
                        {s.planName}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {s.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-zinc-900 font-mono">
                        {formatCOP(s.amount)}
                      </td>

                      <td className="py-4 px-4 text-[11px] text-zinc-500 font-mono">
                        {new Date(s.currentPeriodEnd).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-4 px-4 text-[11px] text-zinc-500 font-mono">
                        {new Date(s.currentPeriodEnd).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-4 px-6 text-right font-mono text-[10px] text-zinc-500">
                        {s.paymentMethod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL EDIT/CREATE PLAN ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  {editingPlan ? 'Editar Plan' : 'Nuevo Plan SaaS'}
                </h3>
                <p className="text-xs text-zinc-500">Configura tarifa, cuotas y características.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Plan Básico"
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Slug</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="plan-basico"
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-semibold text-zinc-900 disabled:opacity-50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Precio COP</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Barberos</label>
                  <input
                    type="number"
                    required
                    value={maxBarbers}
                    onChange={e => setMaxBarbers(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Clientes</label>
                  <input
                    type="number"
                    required
                    value={maxClients}
                    onChange={e => setMaxClients(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Citas/mes</label>
                  <input
                    type="number"
                    required
                    value={maxAppointments}
                    onChange={e => setMaxAppointments(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Características (una por línea)</label>
                <textarea
                  rows={3}
                  value={featuresText}
                  onChange={e => setFeaturesText(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 resize-none outline-none focus:border-zinc-950"
                />
              </div>

              <div className="flex items-center gap-4 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={e => setIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                  <span>Destacado (Recomendado)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                  <span>Activo para venta</span>
                </label>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
