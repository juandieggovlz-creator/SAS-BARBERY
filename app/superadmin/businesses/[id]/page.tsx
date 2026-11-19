'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  Scissors,
  Calendar,
  ShieldCheck,
  AlertOctagon,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  Loader2,
  Sparkles,
  Save,
  X,
  Edit2,
  ExternalLink,
  Activity,
  Flame,
  CreditCard,
  Sliders,
  Check,
  Lock,
  MessageCircle,
  BarChart3,
  DollarSign,
  Globe,
  Bot,
  Infinity
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BusinessDetail {
  id: string
  name: string
  slug: string
  phone?: string | null
  email?: string | null
  address?: string | null
  logo?: string | null
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'
  planId?: string | null
  plan?: { id: string; name: string; slug: string; price: number; maxBarbers: number; maxClients: number; maxAppointments: number } | null
  maxBarbers?: number | null
  maxClients?: number | null
  maxAppointments?: number | null
  trialEndsAt?: string | null
  subscriptionEndsAt?: string | null
  subscriptionStatus?: string | null
  createdAt: string
  updatedAt: string
  users: Array<{
    id: string
    name?: string | null
    email: string
    role: string
    isActive?: boolean
    lastLoginAt?: string | null
  }>
  barbers: Array<{
    id: string
    name: string
    phone?: string | null
    specialty?: string | null
    status: string
    user?: { id: string; email: string; isActive: boolean } | null
    _count?: { appointments: number }
  }>
  saasSubscriptions?: Array<{
    id: string
    amount: number
    status: string
    paymentMethod?: string | null
    currentPeriodStart: string
    currentPeriodEnd: string
    notes?: string | null
    createdAt: string
    plan?: { id: string; name: string; slug: string } | null
  }>
  supportTickets?: Array<{
    id: string
    ticketCode: string
    subject: string
    status: string
    priority: string
    createdAt: string
  }>
  auditLogs?: Array<{
    id: string
    action: string
    entity: string
    userName?: string | null
    userRole?: string | null
    details?: any
    createdAt: string
  }>
  _count: {
    clients: number
    appointments: number
  }
  company?: {
    id: string
    name: string
    maxBranches: number
    additionalBranchPrice: number
    branches: Array<{
      id: string
      name: string
      slug: string
      status: string
      isMainBranch: boolean
      createdAt: string
      _count: { barbers: number; appointments: number }
    }>
  } | null
}

interface FeaturePermissions {
  webpage: boolean
  reports: boolean
  finances: boolean
  chat: boolean
  analytics: boolean
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [plans, setPlans] = useState<Array<{ id: string; name: string; slug: string; price: number }>>([])
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)

  // Permissions state
  const [permissions, setPermissions] = useState<FeaturePermissions>({
    webpage: true,
    reports: true,
    finances: true,
    chat: true,
    analytics: true
  })
  const [savingPermissions, setSavingPermissions] = useState(false)

  // Edit general info modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editPlanId, setEditPlanId] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Multisedes & Limits state
  const [maxBranchesInput, setMaxBranchesInput] = useState<number>(1)
  const [additionalPriceInput, setAdditionalPriceInput] = useState<number>(50000)
  const [savingMultiBranch, setSavingMultiBranch] = useState(false)
  const [maxBarbersInput, setMaxBarbersInput] = useState<number>(3)
  const [maxClientsInput, setMaxClientsInput] = useState<number>(500)
  const [maxAppointmentsInput, setMaxAppointmentsInput] = useState<number>(1000)
  const [savingLimits, setSavingLimits] = useState(false)
  const [selectedPlanForActivation, setSelectedPlanForActivation] = useState<string>('')
  const [customExpirationDate, setCustomExpirationDate] = useState<string>('')
  const [supportReason, setSupportReason] = useState<string>('Soporte técnico, inspección y resolución de incidencias')

  // Branch exception state
  const [branchException, setBranchException] = useState<{ hasException: boolean; grantedAt?: string; notes?: string } | null>(null)
  const [loadingBranchException, setLoadingBranchException] = useState(false)
  const [branchExceptionNotes, setBranchExceptionNotes] = useState('')

  // Subscription action modals
  const [customDaysModal, setCustomDaysModal] = useState(false)
  const [customDays, setCustomDays] = useState(30)
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('Falta de pago')
  const [suspendNotes, setSuspendNotes] = useState('')

  const fetchBusiness = async () => {
    try {
      const [bRes, pRes, permRes, branchExRes] = await Promise.all([
        fetch(`/api/superadmin/businesses/${businessId}`),
        fetch('/api/superadmin/plans'),
        fetch(`/api/superadmin/businesses/${businessId}/permissions`),
        fetch(`/api/superadmin/businesses/${businessId}/branch-exception`)
      ])

      if (bRes.ok) {
        const bJson = await bRes.json()
        setBusiness(bJson.business)
        setEditName(bJson.business.name || '')
        setEditPhone(bJson.business.phone || '')
        setEditEmail(bJson.business.email || '')
        setEditAddress(bJson.business.address || '')
        setEditPlanId(bJson.business.planId || '')
        setSelectedPlanForActivation(bJson.business.planId || '')
        setMaxBarbersInput(bJson.business.maxBarbers || bJson.business.plan?.maxBarbers || 3)
        setMaxClientsInput(bJson.business.maxClients || bJson.business.plan?.maxClients || 500)
        setMaxAppointmentsInput(bJson.business.maxAppointments || bJson.business.plan?.maxAppointments || 1000)
        if (bJson.business.subscriptionEndsAt) {
          setCustomExpirationDate(new Date(bJson.business.subscriptionEndsAt).toISOString().slice(0, 10))
        }
        if (bJson.business?.company) {
          setMaxBranchesInput(bJson.business.company.maxBranches || 1)
          setAdditionalPriceInput(Number(bJson.business.company.additionalBranchPrice) || 50000)
        }
      } else {
        toast.error('Barbería no encontrada')
        router.push('/superadmin/businesses')
      }

      if (pRes.ok) {
        const pJson = await pRes.json()
        setPlans(pJson.plans || [])
      }

      if (permRes.ok) {
        const permJson = await permRes.json()
        if (permJson.permissions) {
          setPermissions(permJson.permissions)
        }
      }

      if (branchExRes.ok) {
        const branchExJson = await branchExRes.json()
        setBranchException(branchExJson)
        setBranchExceptionNotes(branchExJson.notes || '')
      }
    } catch {
      toast.error('Error al cargar la información del negocio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (businessId) fetchBusiness()
  }, [businessId])

  // Impersonation (Support access to Owner, Branch Admin or Barber panel with audit)
  const handleImpersonate = async (
    targetPanel: 'OWNER' | 'BRANCH_ADMIN' | 'BARBER' = 'OWNER',
    barberId?: string,
    branchId?: string
  ) => {
    if (!business) return
    setImpersonating(true)
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          targetPanel,
          barberId,
          branchId,
          reason: supportReason || 'Soporte técnico y supervisión desde Super Admin'
        })
      })

      const json = await res.json()
      if (res.ok && json.redirect) {
        toast.success(json.message || `Ingresando en modo soporte a ${business.name}`)
        window.location.href = json.redirect
      } else {
        toast.error(json.error || 'Error al iniciar sesión de soporte')
        setImpersonating(false)
      }
    } catch {
      toast.error('Error de conexión')
      setImpersonating(false)
    }
  }

  const handleSaveCustomLimits = async () => {
    if (!business) return
    setSavingLimits(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxBarbers: maxBarbersInput,
          maxClients: maxClientsInput,
          maxAppointments: maxAppointmentsInput,
          maxBranches: maxBranchesInput
        })
      })
      if (res.ok) {
        toast.success('Límites permitidos actualizados para esta barbería')
        await fetchBusiness()
      } else {
        toast.error('Error al actualizar límites')
      }
    } catch {
      toast.error('Error de conexión al guardar límites')
    } finally {
      setSavingLimits(false)
    }
  }

  // Execute subscription action
  const handleSubscriptionAction = async (payload: any) => {
    if (!business) return
    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (res.ok) {
        toast.success(json.message || 'Suscripción actualizada')
        setSuspendModalOpen(false)
        setCustomDaysModal(false)
        await fetchBusiness()
      } else {
        toast.error(json.error || 'Error al actualizar suscripción')
      }
    } catch {
      toast.error('Error de red al actualizar suscripción')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Toggle permission
  const handleTogglePermission = async (key: keyof FeaturePermissions) => {
    const updated = { ...permissions, [key]: !permissions[key] }
    setPermissions(updated)
    setSavingPermissions(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${businessId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updated })
      })
      if (res.ok) {
        toast.success(`Módulo ${key.toUpperCase()} actualizado a ${updated[key] ? 'ON' : 'OFF'}`)
      } else {
        toast.error('No se pudo guardar el permiso')
        setPermissions(permissions) // rollback
      }
    } catch {
      toast.error('Error al actualizar permisos')
      setPermissions(permissions)
    } finally {
      setSavingPermissions(false)
    }
  }

  // Save General Info Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
          planId: editPlanId || null
        })
      })

      if (res.ok) {
        toast.success('Información general actualizada')
        setEditModalOpen(false)
        fetchBusiness()
      } else {
        toast.error('Error al guardar cambios')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSaveMultiBranchSettings = async () => {
    if (!business) return
    setSavingMultiBranch(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxBranches: maxBranchesInput,
          additionalBranchPrice: additionalPriceInput
        })
      })
      if (res.ok) {
        toast.success('Configuración corporativa multisedes actualizada')
        fetchBusiness()
      } else {
        toast.error('Error al actualizar configuración multisedes')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingMultiBranch(false)
    }
  }

  const handleGrantBranchException = async () => {
    if (!business) return
    setLoadingBranchException(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}/branch-exception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: branchExceptionNotes || 'Excepción temporal para pruebas' })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(json.message || 'Excepción de Sedes concedida')
        setBranchException({ hasException: true, grantedAt: new Date().toISOString(), notes: branchExceptionNotes })
      } else {
        toast.error(json.error || 'Error al conceder la excepción')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoadingBranchException(false)
    }
  }

  const handleRevokeBranchException = async () => {
    if (!business) return
    setLoadingBranchException(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}/branch-exception`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(json.message || 'Excepción revocada')
        setBranchException({ hasException: false })
      } else {
        toast.error(json.error || 'Error al revocar la excepción')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoadingBranchException(false)
    }
  }

  const handleToggleBranchStatus = async (branchId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
      const res = await fetch(`/api/superadmin/businesses/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Sede ${newStatus === 'ACTIVE' ? 'reactivada' : 'suspendida'} correctamente`)
        fetchBusiness()
      } else {
        toast.error('Error al modificar estado de la sede')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)

  if (loading || !business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        <span className="text-xs font-bold text-zinc-400">Consultando ficha técnica del negocio...</span>
      </div>
    )
  }

  // Commercial date calculations
  const owner = business.users.find(u => u.role === 'OWNER') || business.users[0]
  const isTrial = business.status === 'TRIAL' || business.subscriptionStatus === 'TRIALING'
  const isSuspended = business.status === 'SUSPENDED'
  const isCancelled = business.status === 'CANCELLED'

  const startDate = new Date(business.createdAt)
  const endDate = isTrial
    ? (business.trialEndsAt ? new Date(business.trialEndsAt) : null)
    : (business.subscriptionEndsAt ? new Date(business.subscriptionEndsAt) : null)

  let daysRemaining = 0
  let isExpired = false
  if (endDate) {
    const diff = endDate.getTime() - Date.now()
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (daysRemaining < 0) {
      isExpired = true
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── TOP NAV BAR ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/superadmin/businesses"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a lista de Negocios</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Datos</span>
          </button>

          {isSuspended ? (
            <button
              onClick={() => handleSubscriptionAction({ action: 'REACTIVATE' })}
              disabled={submittingAction}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reactivar Acceso</span>
            </button>
          ) : (
            <button
              onClick={() => setSuspendModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-xs"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Suspender Acceso</span>
            </button>
          )}

          {/* 9. ACCESO ADMINISTRATIVO TEMPORAL (SOPORTE) */}
          <button
            onClick={() => handleImpersonate('OWNER')}
            disabled={impersonating}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            title="Ingresa al panel del propietario en modo soporte temporal (2h máx, auditado)"
          >
            {impersonating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Panel Propietario</span>
          </button>

          <button
            onClick={() => handleImpersonate('BRANCH_ADMIN')}
            disabled={impersonating}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            title="Ingresa al panel de administración de sedes en modo soporte temporal"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Panel Sedes</span>
          </button>

          {business.barbers.length > 0 && (
            <button
              onClick={() => handleImpersonate('BARBER', business.barbers[0].id)}
              disabled={impersonating}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              title="Ingresa al panel de barberos en modo soporte temporal"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-600" />
              <span>Panel Barbero</span>
            </button>
          )}
        </div>
      </div>

      {/* ── BUSINESS HERO CARD ── */}
      <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center font-black text-2xl uppercase text-zinc-900 border border-zinc-200 shrink-0 overflow-hidden">
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                business.name.charAt(0)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950">
                  {business.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    business.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-bold'
                      : business.status === 'TRIAL'
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 font-bold'
                      : business.status === 'SUSPENDED'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold'
                      : 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border-zinc-400 dark:border-zinc-700 font-bold'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      business.status === 'ACTIVE'
                        ? 'bg-emerald-500'
                        : business.status === 'TRIAL'
                        ? 'bg-amber-500'
                        : business.status === 'SUSPENDED'
                        ? 'bg-rose-500'
                        : 'bg-zinc-500'
                    }`}
                  />
                  {business.status === 'ACTIVE'
                    ? '🟢 Activo'
                    : business.status === 'TRIAL'
                    ? '🟡 Prueba'
                    : business.status === 'SUSPENDED'
                    ? '🔴 Suspendido'
                    : '⚫ Cancelado'}
                </span>

                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700">
                  Plan: {business.plan?.name || (isTrial ? 'Prueba Gratuita' : 'Sin Plan')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono flex-wrap">
                <span>slug: /{business.slug}</span>
                <span>•</span>
                <span>Registrado el {new Date(business.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span>•</span>
                <a
                  href={`/b/${business.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1"
                >
                  Ver landing pública <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. DETALLE DEL NEGOCIO: INFORMACIÓN GENERAL & ESTADO COMERCIAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información General */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" /> Información General
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Ficha Maestro</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Nombre Oficial:</span>
              <strong className="text-zinc-900">{business.name}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Propietario:</span>
              <strong className="text-zinc-900">{owner?.email || 'Sin Asignar'}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Teléfono:</span>
              <strong className="text-zinc-900">{business.phone || 'No registrado'}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Correo del Negocio:</span>
              <strong className="text-zinc-900">{business.email || owner?.email || 'No registrado'}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Dirección:</span>
              <strong className="text-zinc-900 text-right max-w-[220px] truncate">{business.address || 'No registrada'}</strong>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Fecha de Creación:</span>
              <strong className="text-zinc-900">
                {new Date(business.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
              </strong>
            </div>
          </div>
        </div>

        {/* Estado Comercial */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Estado Comercial
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Suscripción SaaS</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Plan Activo</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                  {business.plan?.name || (isTrial ? 'Prueba gratuita' : 'Profesional')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Fecha Inicio</div>
                  <div className="font-bold text-zinc-800">
                    {startDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Fecha Fin</div>
                  <div className="font-bold text-zinc-800">
                    {endDate ? endDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Indefinido'}
                  </div>
                </div>
              </div>
            </div>

            {/* Días Restantes Card */}
            <div className={`p-4 rounded-2xl border ${
              isExpired
                ? 'bg-rose-50 border-rose-200'
                : daysRemaining <= 2
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Días Restantes
                  </div>
                  <div className={`text-2xl font-black mt-0.5 ${
                    isExpired
                      ? 'text-rose-700'
                      : daysRemaining <= 2
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}>
                    {isExpired ? 'Vencido' : `${daysRemaining} días`}
                  </div>
                </div>
                <Clock className={`w-8 h-8 opacity-40 ${
                  isExpired ? 'text-rose-500' : daysRemaining <= 2 ? 'text-amber-500' : 'text-emerald-500'
                }`} />
              </div>
              <p className="text-[11px] text-zinc-600 mt-2">
                {isExpired
                  ? 'El plan o período de prueba de este negocio ya expiró. Suscríbelo o extiéndelo.'
                  : daysRemaining <= 5
                  ? `Atención comercial: restan ${daysRemaining} días para el vencimiento.`
                  : 'Suscripción al día y con acceso habilitado a todas las funciones correspondientes.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. GESTIÓN DE SUSCRIPCIÓN ── */}
      <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
        <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" /> Gestión de Suscripción
            </h3>
            <p className="text-xs text-zinc-400">
              Controla los ciclos de prueba, activaciones de planes comerciales, extensiones o bloqueos.
            </p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">Operación de Cobro</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sub-bloque A: Activar Prueba */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Activar Prueba</h4>
              </div>
              <p className="text-[11px] text-zinc-500">
                Otorga o renueva un periodo de prueba gratis para evaluación del cliente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {[7, 15, 30, 60].map(days => (
                <button
                  key={days}
                  onClick={() => handleSubscriptionAction({ action: 'ACTIVATE_TRIAL', days })}
                  disabled={submittingAction}
                  className="px-3 py-2 bg-white hover:bg-amber-500 hover:text-white border border-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-2xs text-center"
                >
                  {days} días
                </button>
              ))}
              <button
                onClick={() => setCustomDaysModal(true)}
                disabled={submittingAction}
                className="col-span-2 px-3 py-2 bg-white hover:bg-zinc-900 hover:text-white border border-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-2xs text-center"
              >
                Personalizado...
              </button>
            </div>
          </div>

          {/* Sub-bloque B: Cambiar y Activar Plan */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Cambiar / Activar Plan</h4>
              </div>
              <p className="text-[11px] text-zinc-500">
                Selecciona el plan comercial y asígnalo de inmediato o actívalo por período.
              </p>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                  Plan Objetivo
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={selectedPlanForActivation || business.planId || ''}
                    onChange={e => setSelectedPlanForActivation(e.target.value)}
                    className="flex-1 px-2.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none"
                  >
                    <option value="">Seleccionar plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCOP(p.price)})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      handleSubscriptionAction({
                        action: 'CHANGE_PLAN',
                        planId: selectedPlanForActivation || business.planId || plans[0]?.id
                      })
                    }
                    disabled={submittingAction || (!selectedPlanForActivation && !business.planId)}
                    className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black uppercase rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Asignar
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { label: 'Mensual (1m)', period: 'MONTHLY' },
                { label: 'Trimestral (3m)', period: 'QUARTERLY' },
                { label: 'Semestral (6m)', period: 'BIANNUAL' },
                { label: 'Anual (12m)', period: 'YEARLY' }
              ].map(item => (
                <button
                  key={item.period}
                  onClick={() => handleSubscriptionAction({
                    action: 'ACTIVATE_PLAN',
                    period: item.period,
                    planId: selectedPlanForActivation || business.planId || (plans[0]?.id)
                  })}
                  disabled={submittingAction}
                  className="px-3 py-2 bg-white hover:bg-emerald-600 hover:text-white border border-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-2xs text-center"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-2.5 border-t border-zinc-200/80 space-y-2">
              <button
                onClick={() => handleSubscriptionAction({
                  action: business.subscriptionEndsAt === null && business.status === 'ACTIVE' ? 'REVOKE_INDEFINITE' : 'SET_INDEFINITE',
                  planId: selectedPlanForActivation || business.planId || (plans[0]?.id)
                })}
                disabled={submittingAction}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 ${
                  business.subscriptionEndsAt === null && business.status === 'ACTIVE'
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Infinity className="w-4 h-4" />
                <span>{business.subscriptionEndsAt === null && business.status === 'ACTIVE' ? 'Retirar Vigencia Indefinida' : 'Vigencia Indefinida (Sin Vencimiento)'}</span>
              </button>

              <button
                onClick={() => handleSubscriptionAction({
                  action: business.maxBarbers === null ? 'REVOKE_UNLIMITED_TEST_MODE' : 'ASSIGN_UNLIMITED_TEST_MODE'
                })}
                disabled={submittingAction}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 ${
                  business.maxBarbers === null
                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{business.maxBarbers === null ? 'Revocar Modo Pruebas Ilimitado' : '🚀 Activar Acceso Pruebas Ilimitado'}</span>
              </button>
            </div>
          </div>

          {/* Sub-bloque C: Extender Vigencia (Días, Meses o Fecha Exacta) */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Extender Suscripción</h4>
              </div>
              <p className="text-[11px] text-zinc-500">
                Añade días, meses calendario o define una nueva fecha de vencimiento sin perder vigencia actual.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1.5">
                  Añadir Días
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[15, 30, 60].map(addDaysVal => (
                    <button
                      key={addDaysVal}
                      onClick={() => handleSubscriptionAction({ action: 'EXTEND_PLAN', days: addDaysVal })}
                      disabled={submittingAction}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-600 hover:text-white border border-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-2xs text-center font-mono"
                    >
                      +{addDaysVal}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1.5">
                  Añadir Meses Calendario
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 3, 6].map(addMonthsVal => (
                    <button
                      key={addMonthsVal}
                      onClick={() => handleSubscriptionAction({ action: 'EXTEND_MONTHS', months: addMonthsVal })}
                      disabled={submittingAction}
                      className="px-2.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-2xs text-center font-mono"
                    >
                      +{addMonthsVal} {addMonthsVal === 1 ? 'mes' : 'meses'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
                  Nueva Fecha de Vencimiento Exacta
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={customExpirationDate}
                    onChange={e => setCustomExpirationDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none"
                  />
                  <button
                    onClick={() =>
                      customExpirationDate &&
                      handleSubscriptionAction({
                        action: 'SET_EXPIRATION_DATE',
                        expirationDate: customExpirationDate
                      })
                    }
                    disabled={submittingAction || !customExpirationDate}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Fijar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. CONTROL DE PERMISOS (FEATURE TOGGLES) ── */}
      <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
        <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" /> Control de Permisos por Negocio
            </h3>
            <p className="text-xs text-zinc-400">
              Habilita o desactiva módulos individualmente para esta barbería.
            </p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">Feature Toggles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Página Web */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-black uppercase text-zinc-900">Página Web</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Landing pública y sistema de reservas online.
              </p>
            </div>
            <button
              onClick={() => handleTogglePermission('webpage')}
              disabled={savingPermissions}
              className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                permissions.webpage
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
              }`}
            >
              {permissions.webpage ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 2. Reportes */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase text-zinc-900">Reportes</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Métricas de clientes, citas y rendimiento de equipo.
              </p>
            </div>
            <button
              onClick={() => handleTogglePermission('reports')}
              disabled={savingPermissions}
              className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                permissions.reports
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
              }`}
            >
              {permissions.reports ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 3. Finanzas */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase text-zinc-900">Finanzas</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Caja diaria, gastos, comisiones y баланс.
              </p>
            </div>
            <button
              onClick={() => handleTogglePermission('finances')}
              disabled={savingPermissions}
              className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                permissions.finances
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
              }`}
            >
              {permissions.finances ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 4. Chat */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black uppercase text-zinc-900">Chat</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Comunicación interna de equipo y recordatorios.
              </p>
            </div>
            <button
              onClick={() => handleTogglePermission('chat')}
              disabled={savingPermissions}
              className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                permissions.chat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
              }`}
            >
              {permissions.chat ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 5. Inteligencia de Negocio */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black uppercase text-zinc-900">Inteligencia</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Predicciones y recomendaciones de retención.
              </p>
            </div>
            <button
              onClick={() => handleTogglePermission('analytics')}
              disabled={savingPermissions}
              className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                permissions.analytics
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
              }`}
            >
              {permissions.analytics ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 5.5. EXCEPCIÓN MÓDULO SEDES ── */}
      <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
        <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" /> Excepción Módulo Sedes
            </h3>
            <p className="text-xs text-zinc-400">
              Permite acceso al módulo Sedes independientemente del plan contratado. Máx. 5 sedes.
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${
            branchException?.hasException
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/40'
              : 'text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
          }`}>
            {branchException?.hasException ? '✓ Activa' : 'Sin excepción'}
          </span>
        </div>

        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
          {branchException?.hasException && branchException.grantedAt && (
            <div className="text-[11px] text-zinc-500 space-y-1">
              <div>Concedida el: <strong className="text-zinc-800">{new Date(branchException.grantedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>
              {branchException.notes && <div>Nota: <strong className="text-zinc-800">{branchException.notes}</strong></div>}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
              Notas de la excepción
            </label>
            <input
              type="text"
              value={branchExceptionNotes}
              onChange={e => setBranchExceptionNotes(e.target.value)}
              placeholder="Ej: Cliente en prueba piloto multisedes"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-black"
            />
          </div>

          <div className="flex gap-2 pt-1">
            {!branchException?.hasException ? (
              <button
                onClick={handleGrantBranchException}
                disabled={loadingBranchException}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingBranchException ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Conceder Excepción Temporal
              </button>
            ) : (
              <button
                onClick={handleRevokeBranchException}
                disabled={loadingBranchException}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingBranchException ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Revocar Excepción
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 6. ESTRUCTURA CORPORATIVA MULTISEDES ── */}
      {business.company && (
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" /> Multisedes Corporativo
              </h3>
              <p className="text-xs text-zinc-400">
                Empresa matriz: <strong className="text-zinc-900">{business.company.name}</strong> • Control de cupos y sucursales
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase">
              {business.company.branches.length} sedes registradas
            </span>
          </div>

          {/* Formulario de cupos y tarifas */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">Parámetros Comerciales Corporativos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
                  Cupo Máximo de Sedes (maxBranches)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxBranchesInput}
                  onChange={e => setMaxBranchesInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
                  Precio por Sede Adicional (COP / mes)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={additionalPriceInput}
                  onChange={e => setAdditionalPriceInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-black"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSaveMultiBranchSettings}
                  disabled={savingMultiBranch}
                  className="w-full py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingMultiBranch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar Cupos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de sucursales */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-700">
              Listado de Sedes de la Empresa
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <th className="px-4 py-2.5 text-left">Sede</th>
                    <th className="px-3 py-2.5 text-left">Slug</th>
                    <th className="px-3 py-2.5 text-center">Barberos</th>
                    <th className="px-3 py-2.5 text-center">Citas</th>
                    <th className="px-3 py-2.5 text-center">Estado</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {business.company.branches.map(br => (
                    <tr key={br.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-zinc-900">
                        {br.name}
                        {br.isMainBranch && (
                          <span className="ml-2 text-[9px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                            Principal
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-zinc-500 text-[11px]">/{br.slug}</td>
                      <td className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300">{br._count.barbers}</td>
                      <td className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300">{br._count.appointments}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          br.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/40'
                        }`}>
                          {br.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleBranchStatus(br.id, br.status)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              br.status === 'ACTIVE'
                                ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/20 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {br.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                          </button>
                          <Link
                            href={`/superadmin/businesses/${br.id}`}
                            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                            title="Ver ficha de sede"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. LÍMITES Y CUPOS OPERATIVOS DEL NEGOCIO ── */}
      <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
        <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" /> Límites Permitidos por Negocio
            </h3>
            <p className="text-xs text-zinc-400">
              Ajusta manualmente los cupos máximos de barberos, sedes, clientes y citas para esta barbería.
            </p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">Control de Cupos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
              Máx. Barberos Activos
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={maxBarbersInput}
              onChange={e => setMaxBarbersInput(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
              Máx. Sedes Permitidas
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxBranchesInput}
              onChange={e => setMaxBranchesInput(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
              Máx. Clientes CRM
            </label>
            <input
              type="number"
              min={50}
              max={100000}
              value={maxClientsInput}
              onChange={e => setMaxClientsInput(parseInt(e.target.value, 10) || 100)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
              Máx. Citas Mensuales
            </label>
            <input
              type="number"
              min={100}
              max={200000}
              value={maxAppointmentsInput}
              onChange={e => setMaxAppointmentsInput(parseInt(e.target.value, 10) || 200)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-black"
            />
          </div>

          <div>
            <button
              onClick={handleSaveCustomLimits}
              disabled={savingLimits}
              className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingLimits ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Guardar Límites</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 8. EQUIPO DE BARBEROS & USUARIOS DEL NEGOCIO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barberos Asociados */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-500" /> Barberos Asociados ({business.barbers.length})
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              Cupo: {business.barbers.filter(b => b.status !== 'INACTIVE').length} / {business.maxBarbers || business.plan?.maxBarbers || 3}
            </span>
          </div>

          {business.barbers.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-100">
              No hay barberos registrados en esta barbería.
            </div>
          ) : (
            <div className="space-y-2.5">
              {business.barbers.map(b => (
                <div
                  key={b.id}
                  className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-900 truncate">{b.name}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          b.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/40'
                            : b.status === 'PENDING'
                            ? 'bg-amber-500/15 text-amber-800 border-amber-500/40'
                            : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {b.user?.email || b.phone || b.specialty || 'Barbero Profesional'} • {b._count?.appointments ?? 0} citas
                    </div>
                  </div>

                  <button
                    onClick={() => handleImpersonate('BARBER', b.id)}
                    disabled={impersonating}
                    className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Panel Barbero</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usuarios y Cuentas del Negocio */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Cuentas y Roles ({business.users.length})
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Accesos Vinculados</span>
          </div>

          {business.users.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-100">
              No hay cuentas de usuario asociadas.
            </div>
          ) : (
            <div className="space-y-2.5">
              {business.users.map(u => (
                <div
                  key={u.id}
                  className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-900 truncate">{u.email}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800">
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {u.lastLoginAt
                        ? `Último acceso: ${new Date(u.lastLoginAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : 'Sin inicios de sesión recientes'}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      u.isActive !== false
                        ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/40'
                        : 'bg-rose-500/15 text-rose-700 border-rose-500/40'
                    }`}
                  >
                    {u.isActive !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 9. HISTORIAL DE SUSCRIPCIONES Y AUDITORÍA ADMINISTRATIVA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historial de Suscripciones SaaS */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Historial de Suscripciones ({business.saasSubscriptions?.length || 0})
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Renovaciones y Extensiones</span>
          </div>

          {!business.saasSubscriptions || business.saasSubscriptions.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-100">
              Aún no hay registros de suscripciones comerciales en el historial.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {business.saasSubscriptions.map(sub => (
                <div
                  key={sub.id}
                  className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-zinc-900">{sub.plan?.name || 'Suscripción'}</strong>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCOP(Number(sub.amount || 0))}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Vigencia: {new Date(sub.currentPeriodStart).toLocaleDateString('es-CO')} →{' '}
                    <strong>{new Date(sub.currentPeriodEnd).toLocaleDateString('es-CO')}</strong>
                  </div>
                  {sub.notes && <div className="text-[11px] text-zinc-600 italic">{sub.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registro de Auditoría Administrativa del Negocio */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" /> Historial de Modificaciones ({business.auditLogs?.length || 0})
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Trazabilidad AuditLog</span>
          </div>

          {!business.auditLogs || business.auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-100">
              No hay eventos administrativos registrados para este negocio.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {business.auditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-[11px] text-zinc-900">{log.action}</span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(log.createdAt).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Entidad: <strong>{log.entity}</strong> • Rol: <strong>{log.userRole || 'SUPER_ADMIN'}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL SUSPENDER ACCESO CON MOTIVOS ── */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-rose-600 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5" /> Suspender Acceso
                </h3>
                <p className="text-xs text-zinc-400">
                  El negocio no podrá acceder al sistema hasta su reactivación.
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
                  Motivo de la Suspensión
                </label>
                <select
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none cursor-pointer"
                >
                  <option value="Falta de pago">Falta de pago</option>
                  <option value="Solicitud cliente">Solicitud cliente</option>
                  <option value="Incumplimiento">Incumplimiento de términos</option>
                  <option value="Otro">Otro motivo</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={suspendNotes}
                  onChange={e => setSuspendNotes(e.target.value)}
                  rows={3}
                  placeholder="Detalles del caso para el registro de auditoría..."
                  className="w-full mt-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none placeholder:text-zinc-400"
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
                  onClick={() => handleSubscriptionAction({
                    action: 'SUSPEND',
                    reason: suspendReason,
                    notes: suspendNotes
                  })}
                  disabled={submittingAction}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {submittingAction ? 'Suspendiendo...' : 'Confirmar Suspensión'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DIAS PERSONALIZADOS ── */}
      {customDaysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">
              Días de Prueba Personalizados
            </h3>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                Cantidad de días
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={e => setCustomDays(parseInt(e.target.value) || 1)}
                className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCustomDaysModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSubscriptionAction({ action: 'ACTIVATE_TRIAL', days: customDays })}
                disabled={submittingAction}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT GENERAL INFO ── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">
                  Editar Información General
                </h3>
                <p className="text-xs text-zinc-400">
                  Modifica los datos maestros de la barbería.
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
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
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
                    <option key={p.id} value={p.id}>{p.name} ({formatCOP(p.price)})</option>
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
    </div>
  )
}
