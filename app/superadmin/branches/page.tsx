'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  Crown,
  Store,
  Users,
  Scissors,
  Calendar,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Eye,
  Edit2,
  Loader2,
  ArrowRight,
  ExternalLink,
  MapPin,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BranchItem {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'
  isMainBranch: boolean
  planName: string
  createdAt: string
  company: {
    id: string
    name: string
    ownerName: string
    ownerEmail: string
    ownerPhone: string | null
    maxBranches: number
  } | null
  manager: {
    id: string
    name: string
    email: string
    phone: string | null
  } | null
  metrics: {
    barbersCount: number
    appointmentsCount: number
    servicesCount: number
    clientsCount: number
  }
}

interface SummaryData {
  totalCount: number
  mainCount: number
  secondaryCount: number
  activeCount: number
  suspendedCount: number
}

export default function SuperAdminBranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Edit / Status modal
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'TRIAL'>('ACTIVE')
  const [saving, setSaving] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (typeFilter !== 'ALL') params.set('type', typeFilter)

      const res = await fetch(`/api/superadmin/branches?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBranches(data.branches || [])
        setSummary(data.summary || null)
      } else {
        toast.error('Error al cargar la red de sedes')
      }
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [statusFilter, typeFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBranches()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const openEditModal = (b: BranchItem) => {
    setEditingBranch(b)
    setEditName(b.name)
    setEditPhone(b.phone || '')
    setEditAddress(b.address || '')
    setEditStatus(b.status === 'ACTIVE' || b.status === 'SUSPENDED' || b.status === 'TRIAL' ? b.status : 'ACTIVE')
    setModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingBranch) return
    try {
      setSaving(true)
      const res = await fetch('/api/superadmin/branches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: editingBranch.id,
          name: editName,
          phone: editPhone,
          address: editAddress,
          status: editStatus
        })
      })

      if (res.ok) {
        toast.success(`Sede ${editName} actualizada correctamente`)
        setModalOpen(false)
        fetchBranches()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al actualizar sede')
      }
    } catch {
      toast.error('Error de conexión al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (b: BranchItem) => {
    const nextStatus = b.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const confirmMsg = nextStatus === 'SUSPENDED'
      ? `¿Estás seguro de suspender la sede "${b.name}"? Los barberos y clientes no podrán operar.`
      : `¿Reactivar la sede "${b.name}"?`

    if (!confirm(confirmMsg)) return

    try {
      setActionLoadingId(b.id)
      const res = await fetch('/api/superadmin/branches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: b.id,
          status: nextStatus
        })
      })

      if (res.ok) {
        toast.success(nextStatus === 'ACTIVE' ? 'Sede reactivada' : 'Sede suspendida')
        fetchBranches()
      } else {
        toast.error('Error al cambiar estado de la sede')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              <Store className="w-3 h-3" />
              Gestión Multisede SaaS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.03em' }}>
            Red Global de Sedes & Sucursales
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Supervisa sedes principales y sucursales secundarias vinculadas a cada empresa, administradores asignados y volumen operativo.
          </p>
        </div>

        <button
          onClick={fetchBranches}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar Red</span>
        </button>
      </div>

      {/* ── 4 KPI CARDS (Alto Contraste y Dark Mode Nativo) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sedes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-mono">
              Total Red
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-950 dark:text-white">
            {summary?.totalCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            Sedes Registradas
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Puntos de atención activos en Colombia
          </p>
        </div>

        {/* Sedes Principales */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold">
              Matriz
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-950 dark:text-white">
            {summary?.mainCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            Sedes Principales
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Cabeceras de negocio de cada cliente
          </p>
        </div>

        {/* Sucursales Secundarias */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-700 dark:text-blue-300">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/40 font-bold">
              Expansión
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-950 dark:text-white">
            {summary?.secondaryCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            Sucursales Adicionales
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Sedes creadas bajo suscripción multisede
          </p>
        </div>

        {/* Estado Operativo */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 font-bold">
              {summary ? Math.round((summary.activeCount / (summary.totalCount || 1)) * 100) : 100}% Operativas
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {summary?.activeCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            Sedes Activas
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            {summary?.suspendedCount ?? 0} suspendidas por mora o solicitud
          </p>
        </div>
      </div>

      {/* ── FILTERS & SEARCH TOOLBAR ── */}
      <div className="p-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por sede, slug, teléfono, dirección o empresa matriz..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="MAIN">⭐ Sedes Principales</option>
            <option value="SECONDARY">🏢 Sucursales</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">🟢 Activa</option>
            <option value="TRIAL">🟡 En Prueba</option>
            <option value="SUSPENDED">🔴 Suspendida</option>
            <option value="CANCELLED">⚫ Cancelada</option>
          </select>
        </div>
      </div>

      {/* ── BRANCHES TABLE (HIGH CONTRAST) ── */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
            <span className="text-xs font-bold text-zinc-400">Consultando red de sedes...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <Store className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No se encontraron sedes</p>
            <p className="text-xs">Prueba cambiando los filtros o el texto de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-4 px-4">Sede & Empresa Matriz</th>
                  <th className="py-4 px-3">Tipo</th>
                  <th className="py-4 px-3">Administrador de Sede</th>
                  <th className="py-4 px-3">Operación</th>
                  <th className="py-4 px-3">Estado</th>
                  <th className="py-4 px-3">Ubicación / Contacto</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {branches.map(b => {
                  const statusClass = b.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-bold'
                    : b.status === 'TRIAL'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 font-bold'
                    : b.status === 'SUSPENDED'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold'
                    : 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border-zinc-400 dark:border-zinc-700 font-bold'

                  const dotColor = b.status === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : b.status === 'TRIAL'
                    ? 'bg-amber-500'
                    : b.status === 'SUSPENDED'
                    ? 'bg-rose-500'
                    : 'bg-zinc-500'

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors group"
                    >
                      {/* 1. Sede & Empresa Matriz */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase shrink-0 border ${
                            b.isMainBranch
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40'
                          }`}>
                            {b.isMainBranch ? <Crown className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/superadmin/businesses/${b.id}`}
                              className="font-black text-zinc-950 dark:text-white hover:text-amber-500 transition-colors block truncate max-w-[200px]"
                            >
                              {b.name}
                            </Link>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[200px]">
                              Empresa: <strong className="text-zinc-800 dark:text-zinc-200">{b.company?.name || 'Independiente'}</strong>
                            </div>
                            <div className="text-[9px] text-zinc-400 font-mono">
                              /{b.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Tipo de Sede */}
                      <td className="py-3.5 px-3">
                        {b.isMainBranch ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                            <Crown className="w-3 h-3" />
                            Principal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/40">
                            <Building2 className="w-3 h-3" />
                            Sucursal
                          </span>
                        )}
                      </td>

                      {/* 3. Administrador de Sede */}
                      <td className="py-3.5 px-3">
                        {b.manager ? (
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[170px]">
                              {b.manager.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[170px]" title={b.manager.email}>
                              {b.manager.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 italic">
                            Gestionada por Dueño
                          </span>
                        )}
                      </td>

                      {/* 4. Operación */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200">
                          <span className="inline-flex items-center gap-1 font-bold" title="Barberos activos">
                            <Scissors className="w-3 h-3 text-amber-500" />
                            {b.metrics.barbersCount}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-bold" title="Citas registradas">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            {b.metrics.appointmentsCount}
                          </span>
                        </div>
                      </td>

                      {/* 5. Estado */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {b.status}
                        </span>
                      </td>

                      {/* 6. Ubicación / Contacto */}
                      <td className="py-3.5 px-3">
                        <div className="text-zinc-800 dark:text-zinc-200 text-xs truncate max-w-[160px]" title={b.address || 'Sin dirección'}>
                          <MapPin className="w-3 h-3 inline text-zinc-400 mr-1" />
                          {b.address || 'Sin dirección'}
                        </div>
                        {b.phone && (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                            <Phone className="w-2.5 h-2.5 inline mr-1" />
                            {b.phone}
                          </div>
                        )}
                      </td>

                      {/* 7. Acciones */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Ficha */}
                          <Link
                            href={`/superadmin/businesses/${b.id}`}
                            className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                            title="Ver ficha de sede"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Editar */}
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                            title="Editar información de sede"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(b)}
                            disabled={actionLoadingId === b.id}
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer border ${
                              b.status === 'ACTIVE'
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 border-transparent'
                                : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40'
                            }`}
                            title={b.status === 'ACTIVE' ? 'Suspender sede' : 'Activar sede'}
                          >
                            {actionLoadingId === b.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : b.status === 'ACTIVE' ? (
                              <AlertOctagon className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
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

      {/* ── MODAL EDITAR SEDE ── */}
      {modalOpen && editingBranch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-zinc-950 dark:text-white">
                  Editar Sede: {editingBranch.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Empresa: {editingBranch.company?.name || 'Independiente'} • /{editingBranch.slug}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Nombre de la Sede
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Dirección Física
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Estado Operativo
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
                >
                  <option value="ACTIVE">🟢 Activa</option>
                  <option value="TRIAL">🟡 En Prueba</option>
                  <option value="SUSPENDED">🔴 Suspendida</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

