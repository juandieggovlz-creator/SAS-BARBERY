'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Building2,
  Plus,
  Store,
  MapPin,
  Phone,
  Users,
  Scissors,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  Crown,
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  RefreshCw,
  Power,
  UserCheck,
  X,
  Loader2,
  CheckCircle2,
  Mail,
  Send,
  Clock
} from 'lucide-react'
import { getPublicPageUrl, getBookingUrl } from '@/lib/url'

interface BranchCounts {
  barbers: number
  appointments: number
  services: number
  clients: number
}

interface BranchItem {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  mapsUrl: string | null
  description: string | null
  logo: string | null
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'
  isMainBranch: boolean
  createdAt: string
  manager: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    isActive: boolean
  } | null
  pendingInvitations: {
    id: string
    email: string
    status: string
    expiresAt: string
    createdAt: string
  }[]
  counts: BranchCounts
}

interface CompanyInfo {
  id: string
  name: string
  nit: string | null
  status: string
  maxBranches: number
  additionalBranchPrice: number
  plan: {
    id: string
    name: string
    slug: string
    price: number
    allowsMultiBranch: boolean
    includedBranches: number
    defaultAdditionalBranchPrice: number
  } | null
}

export default function BranchesPage() {
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [isMultiBranchAllowed, setIsMultiBranchAllowed] = useState(false)
  const [canCreateMore, setCanCreateMore] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modal Crear Sede
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    mapsUrl: '',
    description: ''
  })

  // Modal Editar Sede
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: '',
    mapsUrl: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED'
  })

  // Modal Eliminar Sede
  const [deletingBranch, setDeletingBranch] = useState<BranchItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Modal Invitar Administrador de Sede
  const [invitingBranch, setInvitingBranch] = useState<BranchItem | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null)
  const [copiedInvite, setCopiedInvite] = useState(false)

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/owner/branches')
      if (res.ok) {
        const data = await res.json()
        setCompany(data.company)
        setBranches(data.branches || [])
        setIsMultiBranchAllowed(data.stats?.isMultiBranchAllowed || false)
        setCanCreateMore(data.stats?.canCreateMore || false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al cargar las sedes')
      }
    } catch {
      toast.error('Error de conexión al cargar sedes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Enlace copiado al portapapeles 🚀')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('El nombre de la sede es obligatorio')
      return
    }

    try {
      setCreateLoading(true)
      const res = await fetch('/api/owner/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Sede creada exitosamente 💈')
        setShowCreateModal(false)
        setFormData({ name: '', phone: '', address: '', mapsUrl: '', description: '' })
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al crear la sede')
      }
    } catch {
      toast.error('Error de red al registrar la nueva sede')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleOpenEdit = (branch: BranchItem) => {
    setEditingBranch(branch)
    setEditFormData({
      name: branch.name,
      phone: branch.phone || '',
      address: branch.address || '',
      mapsUrl: branch.mapsUrl || '',
      description: branch.description || '',
      status: branch.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE'
    })
  }

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBranch) return

    try {
      setEditLoading(true)
      const res = await fetch(`/api/owner/branches/${editingBranch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Sede actualizada correctamente')
        setEditingBranch(null)
        fetchBranches()
      } else {
        toast.error(data.error || 'No se pudo actualizar la sede')
      }
    } catch {
      toast.error('Error de conexión al actualizar la sede')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteBranch = async () => {
    if (!deletingBranch) return

    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/owner/branches/${deletingBranch.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Sede eliminada correctamente')
        setDeletingBranch(null)
        fetchBranches()
      } else {
        toast.error(data.error || 'No se pudo eliminar la sede')
      }
    } catch {
      toast.error('Error al procesar la solicitud de eliminación')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleOpenInvite = (branch: BranchItem) => {
    setInvitingBranch(branch)
    setInviteEmail('')
    setGeneratedInviteUrl(null)
    setCopiedInvite(false)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitingBranch) return
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Por favor ingresa un correo electrónico válido')
      return
    }

    try {
      setInviteLoading(true)
      const res = await fetch(`/api/owner/branches/${invitingBranch.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGeneratedInviteUrl(data.inviteUrl)
        toast.success('Invitación generada. Comparte el enlace con el administrador de sede.')
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al generar la invitación')
      }
    } catch {
      toast.error('Error de conexión al crear la invitación')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCopyInviteUrl = () => {
    if (!generatedInviteUrl) return
    navigator.clipboard.writeText(generatedInviteUrl)
    setCopiedInvite(true)
    toast.success('Enlace de invitación copiado 🎉')
    setTimeout(() => setCopiedInvite(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          Cargando sedes y configuración empresarial...
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn font-sans selection:bg-black selection:text-white dark:selection:bg-amber-400 dark:selection:text-zinc-950">

      {/* ── HEADER SUPERIOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Sedes & Sucursales
            </h1>
            <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-500">
              Corporativo
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Administra y monitorea de forma aislada cada ubicación física de tu empresa
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBranches}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Refrescar lista de sedes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isMultiBranchAllowed ? (
            <button
              onClick={() => {
                if (!canCreateMore) {
                  toast.error(`Has alcanzado el límite de ${company?.maxBranches} sedes de tu plan. Amplía tus cupos en Membresía & Plan.`)
                  return
                }
                setShowCreateModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Sede</span>
            </button>
          ) : (
            <Link
              href="/subscription"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              <Crown className="w-4 h-4" />
              <span>Habilitar Multisedes</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── BANNER EXCLUSIVO VIP SI EL PLAN NO LO PERMITE ── */}
      {!isMultiBranchAllowed && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border border-amber-400/30 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Crown className="w-56 h-56 text-amber-400" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Característica Empresarial VIP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Expande tu marca a múltiples sucursales con el Plan Premium VIP
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Actualmente tu barbería opera con el plan <strong>{company?.plan?.name || 'Estándar'}</strong> de una sola sede. Al actualizar a <strong>Premium VIP ($169.900 COP/mes)</strong>, podrás registrar múltiples sedes con sucursales independientes, asignar administradores por sede, tener páginas públicas separadas y consultar finanzas consolidadas.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/subscription"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                <span>Ver Plan Premium VIP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-zinc-400">
                Sedes adicionales: $50.000 COP/mes cada una
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── RESUMEN DE CUPOS Y ESTADO ── */}
      {isMultiBranchAllowed && company && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sedes Registradas</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{branches.length}</span>
              <span className="text-xs text-zinc-400 font-bold">/ {company.maxBranches} contratadas</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {branches.length < company.maxBranches 
                ? `Puedes agregar ${company.maxBranches - branches.length} sede(s) más en tu plan actual.`
                : 'Límite de sedes alcanzado. Puedes ampliar tu cupo cuando lo desees.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Estado de Operación</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {branches.filter(b => b.status === 'ACTIVE').length}
              </span>
              <span className="text-xs text-zinc-400 font-bold">sedes en línea</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Todas las sedes activas reciben citas y atienden clientes</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tarifa Sede Extra</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-white">
                ${company.additionalBranchPrice.toLocaleString('es-CO')}
              </span>
              <span className="text-xs text-zinc-400 font-bold">COP / mes</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Facturado en tu ciclo de suscripción corporativo</p>
          </div>
        </div>
      )}

      {/* ── LISTADO DE SEDES ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Ubicaciones de la Empresa ({branches.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map(branch => {
            const publicUrl = getPublicPageUrl(branch.slug)
            const bookingUrl = getBookingUrl(branch.slug)

            return (
              <div
                key={branch.id}
                className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200 dark:border-zinc-800/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all space-y-6"
              >
                <div>
                  {/* Fila superior: Nombre & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                          {branch.name}
                        </h3>
                        {branch.isMainBranch && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                        slug: /{branch.slug}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        branch.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {branch.status === 'ACTIVE' ? 'Activa' : branch.status === 'SUSPENDED' ? 'Suspendida' : branch.status}
                    </span>
                  </div>

                  {/* Datos de contacto y ubicación */}
                  <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{branch.address || 'Sin dirección física registrada'}</span>
                    </div>

                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    )}

                    {/* Administrador de la sede */}
                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Admin Sede:</span>
                      {branch.manager ? (
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {branch.manager.name || branch.manager.email}
                        </span>
                      ) : branch.pendingInvitations.length > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          Invitación enviada ({branch.pendingInvitations[0].email})
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Sin administrador asignado</span>
                      )}
                    </div>
                  </div>

                  {/* Métricas rápidas */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-xs font-black text-zinc-900 dark:text-white">{branch.counts.barbers}</div>
                      <div className="text-[10px] text-zinc-400">Barberos</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-xs font-black text-zinc-900 dark:text-white">{branch.counts.services}</div>
                      <div className="text-[10px] text-zinc-400">Servicios</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-xs font-black text-zinc-900 dark:text-white">{branch.counts.appointments}</div>
                      <div className="text-[10px] text-zinc-400">Citas Hist.</div>
                    </div>
                  </div>

                  {/* Enlace público de la sede */}
                  <div className="mt-4 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate mr-2">
                      {publicUrl}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(publicUrl, branch.id)}
                        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors"
                        title="Copiar enlace público"
                      >
                        {copiedId === branch.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors"
                        title="Abrir página pública"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Botones de acción inferiores */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenEdit(branch)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleOpenInvite(branch)}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 transition-all"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Invitar Admin</span>
                    </button>

                    <Link
                      href="/webpage"
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-all"
                    >
                      <span>Web</span>
                    </Link>
                  </div>

                  {!branch.isMainBranch && (
                    <button
                      onClick={() => setDeletingBranch(branch)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar / archivar sede"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MODAL: CREAR NUEVA SEDE ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 sm:p-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  Agregar Nueva Sede
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Registra una nueva sucursal vinculada a tu cuenta corporativa
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Nombre Comercial de la Sede *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sede Poblado, Sede Norte, Sede Centro"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Dirección Física
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cra 43A # 7-50, Medellín"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: +57 300 123 4567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Enlace de Google Maps
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.mapsUrl}
                    onChange={e => setFormData({ ...formData, mapsUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Descripción Corta (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre parqueadero, comodidades o puntos de referencia..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Crear Sede</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR SEDE ── */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 sm:p-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  Editar Sede: {editingBranch.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Actualiza los datos informativos y estado operativo
                </p>
              </div>
              <button
                onClick={() => setEditingBranch(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Dirección Física
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Estado Operativo
                  </label>
                  <select
                    disabled={editingBranch.isMainBranch}
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400 disabled:opacity-50"
                  >
                    <option value="ACTIVE">Activa (En línea)</option>
                    <option value="SUSPENDED">Suspendida</option>
                  </select>
                  {editingBranch.isMainBranch && (
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      La sede principal siempre permanece activa.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Enlace de Google Maps
                </label>
                <input
                  type="url"
                  value={editFormData.mapsUrl}
                  onChange={e => setEditFormData({ ...editFormData, mapsUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
                >
                  {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMACIÓN SEGURA DE ELIMINACIÓN ── */}
      {deletingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 animate-scaleUp space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                ¿Eliminar sede "{deletingBranch.name}"?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Si esta sede contiene citas pasadas, cierres de caja o transacciones financieras, el sistema la <strong>archivará de forma segura</strong> para garantizar que tus balances contables no se alteren. Si no tiene datos históricos, se eliminará limpiamente.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingBranch(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteBranch}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: INVITAR ADMINISTRADOR DE SEDE ── */}
      {invitingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 animate-scaleUp space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Invitar Administrador</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Sede: <strong className="text-zinc-700 dark:text-zinc-200">{invitingBranch.name}</strong>
                </p>
              </div>
              <button
                onClick={() => { setInvitingBranch(null); setGeneratedInviteUrl(null) }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedInviteUrl ? (
              <>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  <strong>¿Cómo funciona?</strong> Ingresa el correo del futuro administrador de esta sede. Se generará un enlace seguro con validez de 7 días que él/ella usará para configurar su contraseña y activar su acceso.
                </div>

                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                      Correo del Administrador de Sede
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@tusede.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-amber-400 text-zinc-900 dark:text-white"
                      autoFocus
                    />
                  </div>

                  {/* Invitaciones pendientes existentes */}
                  {invitingBranch.pendingInvitations.length > 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                      <span className="font-bold">Invitaciones pendientes:</span>
                      {invitingBranch.pendingInvitations.map(inv => (
                        <div key={inv.id} className="flex items-center gap-2 pl-2">
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="font-mono">{inv.email}</span>
                          <span className="text-zinc-400">(expira {new Date(inv.expiresAt).toLocaleDateString('es-CO')})</span>
                        </div>
                      ))}
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 pl-2">
                        Si invitas al mismo correo, la invitación anterior se cancelará automáticamente.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setInvitingBranch(null)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
                    >
                      {inviteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <Send className="w-3.5 h-3.5" />
                      <span>Generar Enlace</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">¡Invitación generada exitosamente!</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Enlace de acceso para <span className="font-mono text-amber-600 dark:text-amber-400">{inviteEmail}</span>
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex-1">
                      {generatedInviteUrl}
                    </span>
                    <button
                      onClick={handleCopyInviteUrl}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors shrink-0"
                      title="Copiar enlace"
                    >
                      {copiedInvite ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
                  <p>✅ Envía este enlace al administrador por WhatsApp, correo o cualquier medio seguro.</p>
                  <p>⏱️ El enlace es válido por <strong>7 días</strong> desde su generación.</p>
                  <p>🔒 Al aceptar, el administrador configurará su propia contraseña y tendrá acceso exclusivo a esta sede.</p>
                </div>

                <button
                  onClick={() => { setInvitingBranch(null); setGeneratedInviteUrl(null) }}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-md"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
