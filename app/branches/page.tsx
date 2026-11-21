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
  managerId?: string | null
  manager: {
    id: string
    name: string | null
    email: string
    avatar?: string | null
    isActive?: boolean
    role?: string
    isOwner?: boolean
  } | null
  adminStatus?: 'MAIN_BRANCH_OWNER' | 'ACTIVE_MANAGER' | 'PENDING_INVITATION' | 'EXPIRED_INVITATION' | 'NO_MANAGER'
  pendingInvitations: {
    id: string
    email: string
    status: string
    token?: string
    expiresAt: string
    createdAt: string
    isExpired?: boolean
  }[]
  recentInvitations?: {
    id: string
    email: string
    status: string
    token?: string
    expiresAt: string
    createdAt: string
    isExpired?: boolean
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

  // Switch de Sede Activa
  const [switchingBranchId, setSwitchingBranchId] = useState<string | null>(null)

  // Modal de Días de Cierre y Bloqueos de Sede
  const [closuresBranch, setClosuresBranch] = useState<BranchItem | null>(null)
  const [closuresList, setClosuresList] = useState<any[]>([])
  const [closuresLoading, setClosuresLoading] = useState(false)
  const [newClosureDate, setNewClosureDate] = useState('')
  const [newClosureEndDate, setNewClosureEndDate] = useState('')
  const [newClosureReason, setNewClosureReason] = useState('')
  const [addingClosure, setAddingClosure] = useState(false)
  const [closureConflictWarning, setClosureConflictWarning] = useState<any | null>(null)

  // Modal de Gestión Completa de Administrador de Sede
  const [managerBranch, setManagerBranch] = useState<BranchItem | null>(null)
  const [managerData, setManagerData] = useState<any | null>(null)
  const [managerLoading, setManagerLoading] = useState(false)
  const [managerActionLoading, setManagerActionLoading] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [isChangingAdmin, setIsChangingAdmin] = useState(false)
  const [confirmRevokeModal, setConfirmRevokeModal] = useState(false)
  const [copiedManagerInvite, setCopiedManagerInvite] = useState(false)

  // Modal de Oferta de Invitación Inmediata tras crear sede
  const [createdBranchForInvite, setCreatedBranchForInvite] = useState<BranchItem | null>(null)

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
        // Ofrecer inmediatamente invitar administrador de sede
        if (data.branch) {
          setCreatedBranchForInvite(data.branch)
        }
      } else {
        toast.error(data.error || 'Error al crear la sede')
      }
    } catch {
      toast.error('Error de red al registrar la nueva sede')
    } finally {
      setCreateLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GESTIÓN DEL ADMINISTRADOR DE SEDE (FASE 1, 2 Y 6)
  // ─────────────────────────────────────────────────────────────
  const handleOpenManagerModal = async (branch: BranchItem) => {
    setManagerBranch(branch)
    setManagerLoading(true)
    setIsChangingAdmin(false)
    setConfirmRevokeModal(false)
    setNewAdminEmail('')
    setCopiedManagerInvite(false)
    try {
      const res = await fetch(`/api/owner/branches/${branch.id}/manager`)
      if (res.ok) {
        const data = await res.json()
        setManagerData(data)
      } else {
        toast.error('Error al cargar datos del administrador')
      }
    } catch {
      toast.error('Error de red al consultar administrador')
    } finally {
      setManagerLoading(false)
    }
  }

  const handleRevokeManager = async () => {
    if (!managerBranch) return
    try {
      setManagerActionLoading(true)
      const res = await fetch(`/api/owner/branches/${managerBranch.id}/manager`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Acceso de administrador revocado')
        setConfirmRevokeModal(false)
        handleOpenManagerModal(managerBranch)
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al revocar administrador')
      }
    } catch {
      toast.error('Error de red al revocar administrador')
    } finally {
      setManagerActionLoading(false)
    }
  }

  const handleSendOrReplaceManager = async (action: 'INVITE' | 'REPLACE') => {
    if (!managerBranch) return
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      toast.error('Ingresa un correo electrónico válido')
      return
    }

    try {
      setManagerActionLoading(true)
      const res = await fetch(`/api/owner/branches/${managerBranch.id}/manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail.trim(), action })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Invitación enviada')
        setNewAdminEmail('')
        setIsChangingAdmin(false)
        handleOpenManagerModal(managerBranch)
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al procesar la invitación')
      }
    } catch {
      toast.error('Error de red al enviar invitación')
    } finally {
      setManagerActionLoading(false)
    }
  }

  const handleResendManagerInvite = async (invitationId?: string) => {
    if (!managerBranch) return
    try {
      setManagerActionLoading(true)
      const res = await fetch(`/api/owner/branches/${managerBranch.id}/manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESEND', invitationId })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Invitación renovada y reenviada')
        handleOpenManagerModal(managerBranch)
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al reenviar invitación')
      }
    } catch {
      toast.error('Error de red al reenviar')
    } finally {
      setManagerActionLoading(false)
    }
  }

  const handleDiscardExpiredInvite = async () => {
    if (!managerBranch) return
    try {
      setManagerActionLoading(true)
      const res = await fetch(`/api/owner/branches/${managerBranch.id}/manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DISCARD_EXPIRED' })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Invitación vencida descartada')
        handleOpenManagerModal(managerBranch)
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al descartar invitación')
      }
    } catch {
      toast.error('Error de red al descartar')
    } finally {
      setManagerActionLoading(false)
    }
  }

  const handleCancelPendingInvite = async (invitationId: string) => {
    if (!managerBranch) return
    try {
      setManagerActionLoading(true)
      const res = await fetch(`/api/owner/branches/${managerBranch.id}/invite?invitationId=${invitationId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Invitación cancelada correctamente')
        handleOpenManagerModal(managerBranch)
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al cancelar invitación')
      }
    } catch {
      toast.error('Error de red al cancelar')
    } finally {
      setManagerActionLoading(false)
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

  const handleCancelInvite = async (invitationId: string) => {
    if (!invitingBranch) return
    try {
      const res = await fetch(`/api/owner/branches/${invitingBranch.id}/invite?invitationId=${invitationId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Invitación revocada correctamente')
        fetchBranches()
        setInvitingBranch(prev => prev ? {
          ...prev,
          pendingInvitations: prev.pendingInvitations.filter(i => i.id !== invitationId)
        } : null)
      } else {
        const d = await res.json()
        toast.error(d.error || 'Error al revocar invitación')
      }
    } catch {
      toast.error('Error de red al revocar')
    }
  }

  const handleSwitchBranch = async (branchId: string) => {
    try {
      setSwitchingBranchId(branchId)
      const res = await fetch(`/api/owner/branches/${branchId}/switch`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Sede activa: ${data.branch?.name}`)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('active_branch_id', branchId)
        }
        window.location.href = '/dashboard'
      } else {
        toast.error(data.error || 'Error al cambiar a esta sede')
      }
    } catch {
      toast.error('Error de red al cambiar de sede')
    } finally {
      setSwitchingBranchId(null)
    }
  }

  const handleOpenClosures = async (branch: BranchItem) => {
    setClosuresBranch(branch)
    setClosureConflictWarning(null)
    setNewClosureDate('')
    setNewClosureEndDate('')
    setNewClosureReason('')
    try {
      setClosuresLoading(true)
      const res = await fetch(`/api/owner/branches/${branch.id}/closures`)
      if (res.ok) {
        const data = await res.json()
        setClosuresList(data.closures || [])
      }
    } catch {
      toast.error('Error al cargar bloqueos de la sede')
    } finally {
      setClosuresLoading(false)
    }
  }

  const handleCreateClosure = async (confirm = false) => {
    if (!closuresBranch || !newClosureDate) {
      toast.error('Selecciona una fecha')
      return
    }
    try {
      setAddingClosure(true)
      const res = await fetch(`/api/owner/branches/${closuresBranch.id}/closures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: newClosureDate,
          endDate: newClosureEndDate || newClosureDate,
          reason: newClosureReason,
          confirmWithConflicts: confirm,
        })
      })
      const data = await res.json()
      if (data.warning && !confirm) {
        setClosureConflictWarning(data)
        return
      }
      if (res.ok && data.success) {
        toast.success('Día de cierre / bloqueo registrado con éxito')
        setClosureConflictWarning(null)
        setNewClosureDate('')
        setNewClosureEndDate('')
        setNewClosureReason('')
        const resCl = await fetch(`/api/owner/branches/${closuresBranch.id}/closures`)
        if (resCl.ok) {
          const dCl = await resCl.json()
          setClosuresList(dCl.closures || [])
        }
      } else {
        toast.error(data.error || 'Error al guardar bloqueo')
      }
    } catch {
      toast.error('Error de red al guardar bloqueo')
    } finally {
      setAddingClosure(false)
    }
  }

  const handleDeleteClosure = async (closureId: string) => {
    if (!closuresBranch) return
    try {
      const res = await fetch(`/api/owner/branches/${closuresBranch.id}/closures/${closureId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Bloqueo eliminado correctamente')
        setClosuresList(prev => prev.filter(c => c.id !== closureId))
      } else {
        const d = await res.json()
        toast.error(d.error || 'Error al eliminar bloqueo')
      }
    } catch {
      toast.error('Error de red al eliminar bloqueo')
    }
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
              className="panel-btn-accent flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
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
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {branch.isMainBranch ? (
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : branch.manager ? (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : branch.pendingInvitations.length > 0 ? (
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          )}

                          <div className="min-w-0">
                            {branch.isMainBranch ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-zinc-900 dark:text-white text-xs truncate">
                                  {branch.manager?.name || 'Propietario Principal'}
                                </span>
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                                  Propietario
                                </span>
                              </div>
                            ) : branch.manager ? (
                              <div>
                                <span className="font-bold text-zinc-900 dark:text-white text-xs truncate block">
                                  {branch.manager.name || branch.manager.email}
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                  Administrador Activo
                                </span>
                              </div>
                            ) : branch.pendingInvitations.length > 0 ? (
                              <div>
                                <span className="font-bold text-amber-900 dark:text-amber-200 text-xs truncate block font-mono">
                                  {branch.pendingInvitations[0].email}
                                </span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                                  {branch.pendingInvitations[0].isExpired ? 'Invitación Vencida' : 'Invitación Pendiente'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic text-xs">Sin administrador asignado</span>
                            )}
                          </div>
                        </div>

                        {!branch.isMainBranch && (
                          <button
                            type="button"
                            onClick={() => handleOpenManagerModal(branch)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
                            title="Gestionar administrador e invitaciones"
                          >
                            {branch.manager ? 'Gestionar' : branch.pendingInvitations.length > 0 ? 'Ver Inv.' : 'Invitar'}
                          </button>
                        )}
                      </div>
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

                  {/* Enlace público de la sede o Alerta de configuración */}
                  {branch.counts.services === 0 || branch.counts.barbers === 0 ? (
                    <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 truncate">
                          Configuración pendiente ({branch.counts.services} serv. · {branch.counts.barbers} barb.)
                        </span>
                      </div>
                      <button
                        onClick={() => handleSwitchBranch(branch.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-2xs"
                        title="Ir al panel operativo para agregar servicios y barberos"
                      >
                        Ir al Panel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate mr-2">
                        {publicUrl}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(publicUrl, branch.id)}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
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
                  )}
                </div>

                {/* Botones de acción inferiores con separación clara */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/80 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleSwitchBranch(branch.id)}
                      disabled={switchingBranchId === branch.id}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Activar sesión y abrir el panel operativo de esta sede"
                    >
                      {switchingBranchId === branch.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                      )}
                      <span>Administrar Sede</span>
                    </button>

                    {!branch.isMainBranch && (
                      <button
                        onClick={() => handleOpenManagerModal(branch)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Gestionar administrador e invitaciones de esta sede"
                      >
                        <UserCheck className="w-3 h-3 text-amber-500" />
                        <span>Gestionar Admin</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenClosures(branch)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Configurar horarios y días de cierre"
                    >
                      <Calendar className="w-3 h-3 text-amber-500" />
                      <span>Días de Cierre</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(branch)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Modificar nombre, teléfono o dirección de la sede"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar Sede</span>
                    </button>

                    <Link
                      href="/webpage"
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-all"
                      title="Configurar página pública de la sede"
                    >
                      <span>Página Web</span>
                    </Link>
                  </div>

                  {!branch.isMainBranch && (
                    <button
                      onClick={() => setDeletingBranch(branch)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent, #F59E0B)',
                    color: 'var(--accent-contrast, #000)',
                    boxShadow: '0 4px 14px var(--accent-op30, rgba(245,158,11,0.3))'
                  }}
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
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as 'ACTIVE' | 'SUSPENDED' })}
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent, #F59E0B)',
                    color: 'var(--accent-contrast, #000)',
                    boxShadow: '0 4px 14px var(--accent-op30, rgba(245,158,11,0.3))'
                  }}
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
                ¿Eliminar sede &ldquo;{deletingBranch.name}&rdquo;?
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
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
                      <span className="font-bold text-[11px] uppercase tracking-wider block">Invitaciones pendientes:</span>
                      {invitingBranch.pendingInvitations.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200 truncate">{inv.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelInvite(inv.id)}
                            className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Revocar invitación y anular token de acceso"
                          >
                            Revocar
                          </button>
                        </div>
                      ))}
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
                      className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent, #F59E0B)',
                        color: 'var(--accent-contrast, #000)',
                        boxShadow: '0 4px 14px var(--accent-op30, rgba(245,158,11,0.3))'
                      }}
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

      {/* ── MODAL: GESTIÓN DE DÍAS DE CIERRE Y BLOQUEOS DE SEDE ── */}
      {closuresBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 animate-scaleUp space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" /> Días de Cierre & Bloqueos
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Sede: <strong className="text-zinc-700 dark:text-zinc-200">{closuresBranch.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClosuresBranch(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Advertencia de conflicto si hay citas agendadas */}
            {closureConflictWarning && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Citas previas detectadas ({closureConflictWarning.conflictCount})
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                      {closureConflictWarning.message}
                    </p>
                  </div>
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {closureConflictWarning.conflicts?.map((c: any) => (
                    <div key={c.id} className="p-1.5 rounded-lg bg-white/70 dark:bg-black/30 border border-amber-200/60 dark:border-amber-900/40 flex justify-between">
                      <span className="font-bold">{c.clientName}</span>
                      <span className="text-zinc-500">{new Date(c.date).toLocaleDateString('es-CO')} {new Date(c.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setClosureConflictWarning(null)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateClosure(true)}
                    disabled={addingClosure}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black shadow-xs cursor-pointer"
                  >
                    Confirmar y Bloquear Sede
                  </button>
                </div>
              </div>
            )}

            {/* Formulario nuevo bloqueo */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Programar Nuevo Cierre / Bloqueo
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">Fecha Inicio *</label>
                  <input
                    type="date"
                    value={newClosureDate}
                    onChange={e => setNewClosureDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">Fecha Fin (opcional)</label>
                  <input
                    type="date"
                    value={newClosureEndDate}
                    onChange={e => setNewClosureEndDate(e.target.value)}
                    placeholder="Mismo día si está vacío"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Feriado nacional, Mantenimiento locativo, Vacaciones colectivas"
                  value={newClosureReason}
                  onChange={e => setNewClosureReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleCreateClosure(false)}
                  disabled={addingClosure || !newClosureDate}
                  className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {addingClosure && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Aplicar Bloqueo</span>
                </button>
              </div>
            </div>

            {/* Lista de bloqueos activos */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Bloqueos Activos ({closuresList.length})
              </span>

              {closuresLoading ? (
                <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>
              ) : closuresList.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-2 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  No hay bloqueos programados. La sede atiende en sus horarios regulares.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {closuresList.map(c => {
                    const startStr = new Date(c.startDate).toLocaleDateString('es-CO')
                    const endStr = new Date(c.endDate).toLocaleDateString('es-CO')
                    const dateDisplay = startStr === endStr ? startStr : `${startStr} – ${endStr}`
                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-black text-zinc-900 dark:text-white block">{dateDisplay}</span>
                          {c.reason && <span className="text-zinc-400 text-[11px] truncate block">{c.reason}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClosure(c.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Eliminar bloqueo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setClosuresBranch(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: GESTIÓN COMPLETA DEL ADMINISTRADOR DE SEDE (FASE 1, 2, 6) ── */}
      {managerBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 animate-scaleUp space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Encabezado */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" /> Gestión de Administrador
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Sede: <strong className="text-zinc-800 dark:text-zinc-200">{managerBranch.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManagerBranch(null)
                  setManagerData(null)
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {managerLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs text-zinc-400">Consultando estado del administrador...</span>
              </div>
            ) : managerBranch.isMainBranch ? (
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                  <Crown className="w-4 h-4 text-amber-500" /> Sede Principal
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Esta es la sede matriz de la empresa y está bajo la administración directa del <strong>Propietario de la cuenta</strong>. No requiere invitación de administrador independiente.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Caso 1: Administrador Activo */}
                {managerData?.status === 'ACTIVE_MANAGER' && managerData?.manager && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {managerData.manager.name?.slice(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                              {managerData.manager.name || 'Administrador de Sede'}
                            </h4>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                              Activo
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                            {managerData.manager.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isChangingAdmin && !confirmRevokeModal && (
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsChangingAdmin(true)}
                          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
                        >
                          Cambiar Administrador
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRevokeModal(true)}
                          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold transition-all cursor-pointer"
                        >
                          Revocar Acceso
                        </button>
                      </div>
                    )}

                    {/* Confirmación de Revocación */}
                    {confirmRevokeModal && (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-3 animate-fadeIn">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                              ¿Confirmas revocar el acceso a este administrador?
                            </h5>
                            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                              Sus sesiones activas serán invalidadas inmediatamente. Ya no podrá ingresar al dashboard de esta sede.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeModal(false)}
                            disabled={managerActionLoading}
                            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleRevokeManager}
                            disabled={managerActionLoading}
                            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            {managerActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Sí, Revocar Acceso Inmediatamente</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Formulario de Cambio de Administrador */}
                    {isChangingAdmin && (
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 animate-fadeIn">
                        <h5 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                          Asignar nuevo administrador
                        </h5>
                        <p className="text-xs text-zinc-500">
                          Se revocará el acceso al administrador actual y se enviará una invitación al nuevo correo.
                        </p>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={e => setNewAdminEmail(e.target.value)}
                          placeholder="nuevo.admin@ejemplo.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingAdmin(false)
                              setNewAdminEmail('')
                            }}
                            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendOrReplaceManager('REPLACE')}
                            disabled={managerActionLoading || !newAdminEmail.trim()}
                            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            {managerActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Enviar Nueva Invitación</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Caso 2: Invitación Pendiente */}
                {managerData?.status === 'PENDING_INVITATION' && managerData?.activeInvitation && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-200 tracking-wider">
                            Invitación Pendiente
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          Vence en {Math.max(0, Math.round((new Date(managerData.activeInvitation.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Enviada a:</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white font-mono mt-0.5">
                          {managerData.activeInvitation.email}
                        </p>
                      </div>

                      {/* Enlace de invitación con botón de copiar */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-black/50 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                          {managerData.activeInvitation.inviteUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(managerData.activeInvitation.inviteUrl)
                            setCopiedManagerInvite(true)
                            toast.success('Enlace de invitación copiado')
                            setTimeout(() => setCopiedManagerInvite(false), 2500)
                          }}
                          className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 shrink-0 cursor-pointer"
                          title="Copiar enlace"
                        >
                          {copiedManagerInvite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                        <button
                          type="button"
                          onClick={() => handleCancelPendingInvite(managerData.activeInvitation.id)}
                          disabled={managerActionLoading}
                          className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          Cancelar Invitación
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendManagerInvite(managerData.activeInvitation.id)}
                          disabled={managerActionLoading}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          {managerActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Reenviar Invitación</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Caso 3: Invitación Vencida */}
                {managerData?.status === 'EXPIRED_INVITATION' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                          Invitación Vencida
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        El enlace enviado a <strong>{managerData.activeInvitation?.email}</strong> expiró tras 72 horas.
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleDiscardExpiredInvite}
                          disabled={managerActionLoading}
                          className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                        >
                          Descartar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendManagerInvite(managerData.activeInvitation?.id)}
                          disabled={managerActionLoading}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          {managerActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Renovar y Reenviar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Caso 4: Sin Administrador Asignado */}
                {managerData?.status === 'NO_MANAGER' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                          Esta sede todavía no tiene un administrador asignado
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                          Envía una invitación para que el encargado configure su cuenta y administre las operaciones diarias de esta sede.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                        Correo electrónico del nuevo administrador:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={e => setNewAdminEmail(e.target.value)}
                          placeholder="encargado.sede@ejemplo.com"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendOrReplaceManager('INVITE')}
                          disabled={managerActionLoading || !newAdminEmail.trim()}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                        >
                          {managerActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <Send className="w-3.5 h-3.5" />
                          <span>Invitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pie de modal */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setManagerBranch(null)
                  setManagerData(null)
                }}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CONFIRMACIÓN Y OFERTA INMEDIATA TRAS CREAR SEDE (FASE 3) ── */}
      {createdBranchForInvite && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 animate-scaleUp space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                ¡Sede Creada Exitosamente!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                La sede <strong>{createdBranchForInvite.name}</strong> ha sido registrada y vinculada a tu empresa.
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-1">
                ¿Deseas invitar a su administrador ahora?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const b = createdBranchForInvite
                  setCreatedBranchForInvite(null)
                  handleOpenManagerModal(b)
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                Invitar Administrador
              </button>
              <button
                type="button"
                onClick={() => setCreatedBranchForInvite(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Omitir por ahora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
