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
  Bot
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
  trialEndsAt?: string | null
  subscriptionEndsAt?: string | null
  subscriptionStatus?: string | null
  createdAt: string
  updatedAt: string
  users: Array<{
    id: string
    email: string
    role: string
    lastLoginAt?: string | null
  }>
  barbers: Array<{
    id: string
    name: string
    status: string
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

  // Multisedes state
  const [maxBranchesInput, setMaxBranchesInput] = useState<number>(1)
  const [additionalPriceInput, setAdditionalPriceInput] = useState<number>(50000)
  const [savingMultiBranch, setSavingMultiBranch] = useState(false)

  // Subscription action modals
  const [customDaysModal, setCustomDaysModal] = useState(false)
  const [customDays, setCustomDays] = useState(30)
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('Falta de pago')
  const [suspendNotes, setSuspendNotes] = useState('')

  const fetchBusiness = async () => {
    try {
      const [bRes, pRes, permRes] = await Promise.all([
        fetch(`/api/superadmin/businesses/${businessId}`),
        fetch('/api/superadmin/plans'),
        fetch(`/api/superadmin/businesses/${businessId}/permissions`)
      ])

      if (bRes.ok) {
        const bJson = await bRes.json()
        setBusiness(bJson.business)
        setEditName(bJson.business.name || '')
        setEditPhone(bJson.business.phone || '')
        setEditEmail(bJson.business.email || '')
        setEditAddress(bJson.business.address || '')
        setEditPlanId(bJson.business.planId || '')
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
    } catch {
      toast.error('Error al cargar la información del negocio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (businessId) fetchBusiness()
  }, [businessId])

  // Impersonation (Login as owner with audit)
  const handleImpersonate = async () => {
    if (!business) return
    setImpersonating(true)
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
        toast.error(json.error || 'Error al iniciar sesión como propietario')
        setImpersonating(false)
      }
    } catch {
      toast.error('Error de conexión')
      setImpersonating(false)
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

          {/* 9. INGRESAR COMO PROPIETARIO */}
          <button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            title="Ingresa al panel del negocio para soporte técnico (se guarda auditoría de la sesión)"
          >
            {impersonating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Ingresar como Propietario</span>
          </button>
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
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    business.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : business.status === 'TRIAL'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : business.status === 'SUSPENDED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
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

                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Plan: {business.plan?.name || (isTrial ? 'Prueba Gratuita' : 'Sin Plan')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono flex-wrap">
                <span>slug: /{business.slug}</span>
                <span>•</span>
                <span>Registrado el {new Date(business.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span>•</span>
                <a
                  href={`/barberia/${business.slug}`}
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

          {/* Sub-bloque B: Activar Plan */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Activar Plan</h4>
              </div>
              <p className="text-[11px] text-zinc-500">
                Pasa la barbería a plan de pago según la vigencia comercial acordada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { label: 'Mensual', period: 'monthly' },
                { label: 'Trimestral', period: 'quarterly' },
                { label: 'Semestral', period: 'biannual' },
                { label: 'Anual', period: 'yearly' }
              ].map(item => (
                <button
                  key={item.period}
                  onClick={() => handleSubscriptionAction({
                    action: 'ACTIVATE_PLAN',
                    period: item.period,
                    planId: business.planId || (plans[0]?.id)
                  })}
                  disabled={submittingAction}
                  className="px-3 py-2 bg-white hover:bg-emerald-600 hover:text-white border border-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-2xs text-center"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-bloque C: Extender Plan */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Extender Plan</h4>
              </div>
              <p className="text-[11px] text-zinc-500">
                Suma días de gracia o vigencia adicional a la fecha fin actual.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {[30, 60, 90].map(addDays => (
                <button
                  key={addDays}
                  onClick={() => handleSubscriptionAction({ action: 'EXTEND_PLAN', days: addDays })}
                  disabled={submittingAction}
                  className="w-full px-3 py-2 bg-white hover:bg-blue-600 hover:text-white border border-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-between"
                >
                  <span>Extensión</span>
                  <span className="font-mono font-bold">+{addDays} días</span>
                </button>
              ))}
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
                          <span className="ml-2 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            Principal
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-zinc-500 text-[11px]">/{br.slug}</td>
                      <td className="px-3 py-3 text-center text-zinc-700">{br._count.barbers}</td>
                      <td className="px-3 py-3 text-center text-zinc-700">{br._count.appointments}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          br.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {br.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleBranchStatus(br.id, br.status)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              br.status === 'ACTIVE'
                                ? 'bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
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
