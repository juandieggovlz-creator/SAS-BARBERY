'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Crown,
  Scissors,
  UserCheck,
  AlertCircle,
  Phone,
  MessageSquare,
  ShieldAlert,
  Server,
  Zap,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface DashboardData {
  metrics: {
    totalBusinesses: number
    activeBusinesses: number
    trialBusinesses: number
    suspendedBusinesses: number
    ownerUsers: number
    barberUsers: number
    clientsCount: number
    totalAppointments: number
    monthAppointments: number
    mrr: number
    activeSubscriptionsCount: number
    expiredSubscriptionsCount: number
    pendingTicketsCount: number
  }
  alerts: {
    trialsExpiringSoon: Array<{
      id: string
      name: string
      phone?: string | null
      ownerEmail: string
      daysLeft: number
      trialEndsAt: string
    }>
    plansExpired: Array<{
      id: string
      name: string
      phone?: string | null
      ownerEmail: string
      planName: string
      expiredAt: string
    }>
    inactiveBusinessesList: Array<{
      id: string
      name: string
      phone?: string | null
      ownerEmail: string
      daysInactive: number
    }>
    openTickets: Array<{
      id: string
      ticketCode: string
      subject: string
      priority: string
      business: { name: string; slug: string }
    }>
  }
  businessesHealth: Array<{
    id: string
    name: string
    slug: string
    status: string
    planName: string
    lastLoginAt: string
    timeAgo: string
    healthStatus: 'HEALTHY' | 'WARNING' | 'INACTIVE'
    healthLabel: string
    barbersCount: number
    clientsCount: number
    appointmentsCount: number
  }>
  recentAuditLogs: Array<{
    id: string
    action: string
    entity: string
    userName?: string | null
    createdAt: string
  }>
}

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else if (res.status === 403 || res.status === 401) {
        toast.error('Sesión no autorizada o expirada. Redirigiendo a login...')
        window.location.href = '/login'
      } else {
        toast.error('No se pudieron cargar las métricas de BarberOS')
      }
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleImpersonate = async (businessId: string, businessName: string) => {
    setImpersonatingId(businessId)
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })
      const json = await res.json()
      if (res.ok && json.redirect) {
        toast.success(`Ingresando a ${businessName} en modo soporte`)
        window.location.href = json.redirect
      } else {
        toast.error(json.error || 'Error al iniciar sesión como propietario')
        setImpersonatingId(null)
      }
    } catch {
      toast.error('Error de red al intentar acceder')
      setImpersonatingId(null)
    }
  }

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-[var(--background)] text-[var(--foreground)] rounded-2xl p-8">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
          Cargando Centro de Control BarberOS...
        </span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[var(--surface-1)] text-[var(--foreground)] rounded-2xl p-8 text-center border border-[var(--surface-3)]">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No se pudo cargar el panel de control</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Verifica tu sesión de Super Admin o intenta recargar la página.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-zinc-950 dark:bg-amber-500 dark:text-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--surface-3)] text-[var(--text-primary)] text-xs font-bold rounded-xl hover:bg-[var(--surface-3)] transition-all cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    )
  }

  const { metrics, alerts, businessesHealth, recentAuditLogs } = data

  return (
    <div className="space-y-8 pb-12 bg-[#f8fafc] dark:bg-[#09090b] text-zinc-950 dark:text-zinc-100 min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER SUPER ADMIN ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <Crown className="w-3 h-3" />
              Centro de Operaciones SaaS
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              En Línea
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Panel de Control Global
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Métricas de negocio, retención comercial, suscripciones y salud del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
          <Link
            href="/superadmin/commercial"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Seguimiento Comercial</span>
          </Link>
        </div>
      </div>

      {/* ── 1. ALERTAS IMPORTANTES Y ACCIONABLES ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Alertas Operativas y Comerciales Clave</span>
          </h2>
          <span className="text-[11px] font-bold text-zinc-400">
            Atención prioritaria del día
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Alerta 1: Pruebas por vencer */}
          <div className={`p-4 rounded-2xl border transition-all ${
            alerts.trialsExpiringSoon.length > 0 
              ? 'bg-amber-50/70 border-amber-200 text-amber-950' 
              : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800">
                Pruebas por Vencer
              </span>
              <span className="text-lg font-black">{alerts.trialsExpiringSoon.length}</span>
            </div>
            <p className="text-xs font-bold mb-1">
              {alerts.trialsExpiringSoon.length > 0 
                ? `${alerts.trialsExpiringSoon.length} barberías terminan prueba en ≤ 5 días`
                : 'Cero pruebas críticas por vencer'}
            </p>
            <p className="text-[11px] text-zinc-500 mb-3">
              Momento óptimo para contactar y cerrar el plan pago.
            </p>
            {alerts.trialsExpiringSoon.length > 0 && (
              <Link 
                href="/superadmin/commercial"
                className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 hover:text-amber-950 underline"
              >
                <span>Gestionar ({alerts.trialsExpiringSoon.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Alerta 2: Planes vencidos */}
          <div className={`p-4 rounded-2xl border transition-all ${
            alerts.plansExpired.length > 0 
              ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
              : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100/80 text-rose-800">
                Planes Vencidos
              </span>
              <span className="text-lg font-black">{alerts.plansExpired.length}</span>
            </div>
            <p className="text-xs font-bold mb-1">
              {alerts.plansExpired.length > 0 
                ? `${alerts.plansExpired.length} barberías tienen suscripción vencida`
                : 'Todas las suscripciones al día'}
            </p>
            <p className="text-[11px] text-zinc-500 mb-3">
              Requieren renovación o suspensión por falta de pago.
            </p>
            {alerts.plansExpired.length > 0 && (
              <Link 
                href="/superadmin/businesses?status=SUSPENDED"
                className="inline-flex items-center gap-1.5 text-xs font-black text-rose-800 hover:text-rose-950 underline"
              >
                <span>Revisar ({alerts.plansExpired.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Alerta 3: Sin actividad en 30 días */}
          <div className={`p-4 rounded-2xl border transition-all ${
            alerts.inactiveBusinessesList.length > 0 
              ? 'bg-zinc-50 border-zinc-300 text-zinc-950' 
              : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700">
                Inactividad
              </span>
              <span className="text-lg font-black">{alerts.inactiveBusinessesList.length}</span>
            </div>
            <p className="text-xs font-bold mb-1">
              {alerts.inactiveBusinessesList.length > 0
                ? `${alerts.inactiveBusinessesList.length} barberías sin acceso hace 30+ días`
                : 'Red activa y con uso recurrente'}
            </p>
            <p className="text-[11px] text-zinc-500 mb-3">
              Riesgo de abandono (Churn). Enviar campaña de activación.
            </p>
            {alerts.inactiveBusinessesList.length > 0 && (
              <Link 
                href="/superadmin/commercial"
                className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-800 hover:text-black underline"
              >
                <span>Ver inactivas</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Alerta 4: Soporte Pendiente */}
          <div className={`p-4 rounded-2xl border transition-all ${
            metrics.pendingTicketsCount > 0 
              ? 'bg-blue-50/70 border-blue-200 text-blue-950' 
              : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800">
                Mesa de Ayuda
              </span>
              <span className="text-lg font-black">{metrics.pendingTicketsCount}</span>
            </div>
            <p className="text-xs font-bold mb-1">
              {metrics.pendingTicketsCount > 0 
                ? `${metrics.pendingTicketsCount} tickets de soporte por responder`
                : 'Bandeja de soporte al 100% resuelta'}
            </p>
            <p className="text-[11px] text-zinc-500 mb-3">
              Atención ágil para mantener alta retención.
            </p>
            <Link 
              href="/superadmin/support"
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-800 hover:text-blue-950 underline"
            >
              <span>Ir a Soporte</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. MÉTRICAS PRINCIPALES DE PLATAFORMA SAAS ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">
          Métricas Clave de la Plataforma
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Barberías Registradas */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <Building2 className="w-4 h-4 text-zinc-950" />
              <span className="text-[10px] font-bold text-zinc-500">Total</span>
            </div>
            <div className="text-2xl font-black text-zinc-950">{metrics.totalBusinesses}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Barberías registradas</p>
          </div>

          {/* Barberías Activas */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600">En uso</span>
            </div>
            <div className="text-2xl font-black text-emerald-600">{metrics.activeBusinesses}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Barberías activas</p>
          </div>

          {/* Barberías en Prueba */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600">Trial</span>
            </div>
            <div className="text-2xl font-black text-amber-600">{metrics.trialBusinesses}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Barberías en prueba</p>
          </div>

          {/* Barberías Suspendidas */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-bold text-rose-600">Pausa</span>
            </div>
            <div className="text-2xl font-black text-rose-600">{metrics.suspendedBusinesses}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Suspendidas / Churn</p>
          </div>

          {/* MRR */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600">Recurrente</span>
            </div>
            <div className="text-xl font-black text-zinc-950 truncate">{formatCOP(metrics.mrr)}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">MRR proyectado</p>
          </div>

          {/* Reservas Totales */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600">Histórico</span>
            </div>
            <div className="text-2xl font-black text-zinc-950">{metrics.totalAppointments}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Reservas procesadas</p>
          </div>
        </div>
      </div>

      {/* ── 3. DETALLE DE USUARIOS & SUSCRIPCIONES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card: Usuarios de la Red */}
        <div className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <span>Usuarios de la Red</span>
            </h3>
            <span className="text-[11px] font-bold text-zinc-400">Total: {metrics.ownerUsers + metrics.barberUsers}</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Dueños / Administradores</span>
              </div>
              <span className="text-xs font-black text-zinc-950">{metrics.ownerUsers}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                <Scissors className="w-4 h-4 text-zinc-700" />
                <span>Barberos / Estilistas</span>
              </div>
              <span className="text-xs font-black text-zinc-950">{metrics.barberUsers}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Clientes Registrados en CRM</span>
              </div>
              <span className="text-xs font-black text-emerald-700">{metrics.clientsCount}</span>
            </div>
          </div>
        </div>

        {/* Card: Reservas & Tráfico */}
        <div className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Volumen de Reservas</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 font-mono">En vivo</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-xs font-bold text-zinc-700">Citas este mes</span>
              <span className="text-xs font-black text-zinc-950">{metrics.monthAppointments}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-xs font-bold text-zinc-700">Suscripciones Activas</span>
              <span className="text-xs font-black text-emerald-600">{metrics.activeSubscriptionsCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-xs font-bold text-zinc-700">Suscripciones Vencidas / Pausadas</span>
              <span className="text-xs font-black text-rose-600">{metrics.expiredSubscriptionsCount}</span>
            </div>
          </div>
        </div>

        {/* Card: Acciones Rápidas del SaaS */}
        <div className="p-5 rounded-3xl bg-zinc-950 text-white shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
              Centro de Mando
            </span>
            <h3 className="text-base font-black tracking-tight">Acciones Rápidas</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Herramientas de supervisión inmediata para soporte y control de la infraestructura.
            </p>
          </div>

          <div className="space-y-2">
            <Link
              href="/superadmin/businesses"
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-xs font-bold"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Ver Directorio de Negocios</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>

            <Link
              href="/superadmin/system"
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-xs font-bold"
            >
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Estado de Servidores & API</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>

            <Link
              href="/superadmin/audit"
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-xs font-bold"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Bitácora de Auditoría</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. ESTADO DE SALUD DE CADA BARBERÍA & ACCIONES ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-zinc-950 uppercase tracking-tight">
              Directorio Operativo de Barberías
            </h3>
            <p className="text-xs text-zinc-500">
              Estado de actividad reciente y acceso directo de soporte técnico en 1 clic.
            </p>
          </div>
          <Link
            href="/superadmin/businesses"
            className="text-xs font-black text-zinc-900 hover:underline flex items-center gap-1"
          >
            <span>Ver todas las barberías</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/70 text-zinc-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Barbería</th>
                  <th className="py-3.5 px-4">Plan Actual</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Salud / Uso</th>
                  <th className="py-3.5 px-4">Equipo / Clientes</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {businessesHealth.slice(0, 8).map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                    {/* Barbería */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-black text-zinc-950 text-xs">{b.name}</p>
                        <p className="text-[10px] font-mono text-zinc-400">barberos.app/b/{b.slug}</p>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg text-[11px] border border-zinc-200/60">
                        {b.planName}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.status === 'TRIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          b.status === 'ACTIVE' ? 'bg-emerald-500' : b.status === 'TRIAL' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span>{b.status === 'ACTIVE' ? 'Activo' : b.status === 'TRIAL' ? 'Prueba' : 'Suspendido'}</span>
                      </span>
                    </td>

                    {/* Salud / Uso */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-zinc-600 block">{b.healthLabel}</span>
                      <span className="text-[10px] text-zinc-400">{b.timeAgo}</span>
                    </td>

                    {/* Equipo / Clientes */}
                    <td className="py-3.5 px-4 text-zinc-600">
                      <span className="font-bold">{b.barbersCount}</span> barberos · <span className="font-bold">{b.clientsCount}</span> clientes
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Ingresar como propietario (Impersonation) */}
                        <button
                          type="button"
                          onClick={() => handleImpersonate(b.id, b.name)}
                          disabled={impersonatingId === b.id}
                          className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Ingresar como propietario para soporte"
                        >
                          {impersonatingId === b.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                          )}
                          <span>Entrar</span>
                        </button>

                        <Link
                          href={`/superadmin/businesses/${b.id}`}
                          className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
                          title="Ver detalle del negocio"
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

    </div>
  )
}
