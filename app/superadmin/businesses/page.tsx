'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Search,
  Filter,
  Eye,
  Edit2,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Crown,
  Scissors,
  Users,
  Calendar,
  Clock,
  Save,
  X,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BusinessItem {
  id: string
  name: string
  slug: string
  phone?: string | null
  email?: string | null
  address?: string | null
  logo?: string | null
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'
  plan?: { id: string; name: string; slug: string; price: number } | null
  trialEndsAt?: string | null
  subscriptionEndsAt?: string | null
  subscriptionStatus: string
  createdAt: string
  ownerEmail: string
  lastLoginAt?: string | null
  activeBarbersCount: number
  clientsCount: number
  reservationsLast30Days: number
  totalAppointments: number
}

export default function SuperAdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([])
  const [plans, setPlans] = useState<Array<{ id: string; name: string; slug: string; price: number }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<BusinessItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editPlanId, setEditPlanId] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Suspend Modal
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [suspendingBusiness, setSuspendingBusiness] = useState<BusinessItem | null>(null)
  const [suspendReason, setSuspendReason] = useState('Falta de pago')
  const [suspendNotes, setSuspendNotes] = useState('')

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchBusinesses = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (statusFilter !== 'ALL') query.set('status', statusFilter)
      if (planFilter !== 'ALL') query.set('plan', planFilter)

      const res = await fetch(`/api/superadmin/businesses?${query.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setBusinesses(json.businesses || [])
        setPlans(json.plans || [])
      } else {
        toast.error('Error al cargar la lista de barberías')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses()
    }, 200)
    return () => clearTimeout(timer)
  }, [search, statusFilter, planFilter])

  // Impersonate (Ingresar como propietario)
  const handleImpersonate = async (business: BusinessItem) => {
    setActionLoadingId(business.id)
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id })
      })

      const json = await res.json()
      if (res.ok && json.redirect) {
        toast.success(`Ingresando a ${business.name} como propietario`)
        window.location.href = json.redirect
      } else {
        toast.error(json.error || 'Error al ingresar como propietario')
        setActionLoadingId(null)
      }
    } catch {
      toast.error('Error de conexión')
      setActionLoadingId(null)
    }
  }

  // Reactivate
  const handleReactivate = async (business: BusinessItem) => {
    setActionLoadingId(business.id)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REACTIVATE' })
      })

      if (res.ok) {
        toast.success(`Barbería "${business.name}" reactivada con éxito`)
        fetchBusinesses()
      } else {
        toast.error('Error al reactivar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Confirm Suspend
  const handleConfirmSuspend = async () => {
    if (!suspendingBusiness) return
    setActionLoadingId(suspendingBusiness.id)
    try {
      const res = await fetch(`/api/superadmin/businesses/${suspendingBusiness.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUSPEND',
          reason: suspendReason,
          notes: suspendNotes
        })
      })

      if (res.ok) {
        toast.success(`Acceso a "${suspendingBusiness.name}" suspendido`)
        setSuspendModalOpen(false)
        fetchBusinesses()
      } else {
        toast.error('No se pudo suspender la barbería')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingBusiness) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${deletingBusiness.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success(`Barbería "${deletingBusiness.name}" eliminada de la plataforma`)
        setDeleteModalOpen(false)
        fetchBusinesses()
      } else {
        toast.error('Error al eliminar negocio')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setIsDeleting(false)
    }
  }

  // Open Edit
  const openEditModal = (b: BusinessItem) => {
    setEditingBusiness(b)
    setEditName(b.name)
    setEditPhone(b.phone || '')
    setEditAddress(b.address || '')
    setEditPlanId(b.plan?.id || '')
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBusiness) return

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${editingBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          address: editAddress,
          planId: editPlanId || null
        })
      })

      if (res.ok) {
        toast.success('Datos de la barbería actualizados')
        setEditModalOpen(false)
        fetchBusinesses()
      } else {
        toast.error('Error al actualizar datos')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingEdit(false)
    }
  }

  // Helper for expiration date & trial calculation
  const getExpirationInfo = (b: BusinessItem) => {
    const isTrial = b.status === 'TRIAL' || b.subscriptionStatus === 'TRIALING'
    const targetDate = isTrial
      ? (b.trialEndsAt ? new Date(b.trialEndsAt) : null)
      : (b.subscriptionEndsAt ? new Date(b.subscriptionEndsAt) : null)

    if (!targetDate) {
      return { text: 'Indefinido', days: null, isExpired: false }
    }

    const diffMs = targetDate.getTime() - Date.now()
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const formatted = targetDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return {
      text: formatted,
      days,
      isExpired: days < 0
    }
  }

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <Building2 className="w-3 h-3" />
              Centro Maestro
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Directorio de Negocios
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Administra suscripciones, accesos directos de soporte, estados comerciales y ciclo de vida de los clientes SaaS.
          </p>
        </div>

        <button
          onClick={fetchBusinesses}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── FILTERS & SEARCH TOOLBAR ── */}
      <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, slug, propietario, correo o teléfono..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">🟢 Activo</option>
            <option value="TRIAL">🟡 Prueba</option>
            <option value="SUSPENDED">🔴 Suspendido</option>
            <option value="CANCELLED">⚫ Cancelado</option>
          </select>

          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-800 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Planes</option>
            {plans.map(p => (
              <option key={p.id} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── BUSINESSES TABLE ── */}
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
            <span className="text-xs font-bold text-zinc-400">Consultando base de datos SaaS...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <Building2 className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-bold text-zinc-700">No se encontraron barberías</p>
            <p className="text-xs">Prueba cambiando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-4">Nombre del Negocio</th>
                  <th className="py-4 px-3">Plan Actual</th>
                  <th className="py-4 px-3">Fecha de Inicio</th>
                  <th className="py-4 px-3">Fecha de Finalización</th>
                  <th className="py-4 px-3">Estado</th>
                  <th className="py-4 px-4">Propietario / Contacto</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {businesses.map((b) => {
                  const expInfo = getExpirationInfo(b)
                  const isTrial = b.status === 'TRIAL' || b.subscriptionStatus === 'TRIALING'
                  const isExpired = expInfo.isExpired

                  // Estado visual unificado: Vencida, En Prueba, Activa, Suspendida
                  const statusLabel = isExpired
                    ? 'Vencida'
                    : b.status === 'TRIAL'
                    ? 'En Prueba'
                    : b.status === 'ACTIVE'
                    ? 'Activa'
                    : b.status === 'SUSPENDED'
                    ? 'Suspendida'
                    : 'Cancelada'

                  const statusClass = isExpired
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : b.status === 'TRIAL'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : b.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-300'

                  const dotColor = isExpired
                    ? 'bg-rose-500'
                    : b.status === 'TRIAL'
                    ? 'bg-amber-500'
                    : b.status === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : 'bg-zinc-500'

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
                      {/* 1. Nombre del Negocio (con Logo y slug) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-black text-xs uppercase text-zinc-800 shrink-0 overflow-hidden">
                            {b.logo ? (
                              <img src={b.logo} alt={b.name} className="w-full h-full object-cover" />
                            ) : (
                              b.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/superadmin/businesses/${b.id}`}
                              className="font-black text-zinc-950 hover:text-amber-600 transition-colors block truncate max-w-[200px]"
                            >
                              {b.name}
                            </Link>
                            <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px]">
                              /{b.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Plan Actual */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-xl">
                          <Crown size={12} className={b.plan ? 'text-amber-600' : 'text-zinc-400'} />
                          {b.plan?.name || (isTrial ? 'Plan Prueba Full' : 'Sin Plan')}
                        </span>
                      </td>

                      {/* 3. Fecha de Inicio */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-xs text-zinc-700">
                          {new Date(b.createdAt).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <span className="text-[10px] text-zinc-400">Día de registro</span>
                      </td>

                      {/* 4. Fecha de Finalización (calculada sola) */}
                      <td className="py-3.5 px-3">
                        <div className={`font-mono font-bold text-xs ${isExpired ? 'text-rose-600' : 'text-zinc-900'}`}>
                          {expInfo.text}
                        </div>
                        {expInfo.days !== null && (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${
                            isExpired
                              ? 'bg-rose-100 text-rose-800'
                              : expInfo.days <= 7
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isExpired ? 'Finalizó' : `${expInfo.days}d restantes`}
                          </span>
                        )}
                      </td>

                      {/* 5. Estado */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {statusLabel}
                        </span>
                      </td>

                      {/* 6. Propietario / Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-800 font-semibold truncate max-w-[170px]" title={b.ownerEmail}>
                          {b.ownerEmail}
                        </div>
                        {b.phone && (
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {b.phone}
                          </div>
                        )}
                      </td>

                      {/* 9. ACCIONES */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ingresar como propietario */}
                          <button
                            onClick={() => handleImpersonate(b)}
                            disabled={actionLoadingId === b.id}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Ingresar como propietario (Soporte directo con auditoría)"
                          >
                            {actionLoadingId === b.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span className="hidden sm:inline">Entrar</span>
                          </button>

                          {/* Ver Detalle */}
                          <Link
                            href={`/superadmin/businesses/${b.id}`}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                            title="Ver detalle del negocio"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Editar */}
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                            title="Editar información"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspender / Reactivar */}
                          {b.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleReactivate(b)}
                              disabled={actionLoadingId === b.id}
                              className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                              title="Reactivar negocio"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSuspendingBusiness(b)
                                setSuspendModalOpen(true)
                              }}
                              disabled={actionLoadingId === b.id}
                              className="p-1.5 rounded-xl bg-zinc-100 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Suspender negocio"
                            >
                              <AlertOctagon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Eliminar */}
                          <button
                            onClick={() => {
                              setDeletingBusiness(b)
                              setDeleteModalOpen(true)
                            }}
                            className="p-1.5 rounded-xl bg-zinc-100 text-zinc-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar de la plataforma"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL EDIT BUSINESS ── */}
      {editModalOpen && editingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">
                  Editar: {editingBusiness.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Modifica los datos principales en BarberOS.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Nombre de la Barbería
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Plan Asignado
                </label>
                <select
                  value={editPlanId}
                  onChange={e => setEditPlanId(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none cursor-pointer"
                >
                  <option value="">Sin Plan Asignado</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL SUSPENDER CON MOTIVO ── */}
      {suspendModalOpen && suspendingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-rose-600 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5" /> Suspender: {suspendingBusiness.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Selecciona el motivo oficial de la suspensión.
                </p>
              </div>
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Motivo de Suspensión
                </label>
                <select
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none cursor-pointer"
                >
                  <option value="Falta de pago">Falta de pago</option>
                  <option value="Solicitud cliente">Solicitud cliente</option>
                  <option value="Incumplimiento">Incumplimiento de términos</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Notas de Auditoría
                </label>
                <textarea
                  value={suspendNotes}
                  onChange={e => setSuspendNotes(e.target.value)}
                  rows={2}
                  placeholder="Observaciones adicionales..."
                  className="w-full mt-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Suspender Acceso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRM DELETE ── */}
      {deleteModalOpen && deletingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">
                  ¿Eliminar Barbería?
                </h3>
                <p className="text-xs text-zinc-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Estás a punto de borrar definitivamente la barbería <strong>{deletingBusiness.name}</strong> y todos sus datos vinculados. Quedará registrado en la bitácora de auditoría.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
