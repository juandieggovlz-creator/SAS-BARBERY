'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Users,
  Scissors,
  ExternalLink,
  Copy,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  UserPlus,
  PlusCircle,
  BarChart3,
  Repeat2,
  CalendarPlus,
  Crown
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayStats {
  revenue: number
  expenses: number
  estimatedProfit: number
  totalAppointments: number
  completed: number
  pending: number
}

interface PendingPaymentItem {
  id: string
  clientName: string
  serviceName: string
  barberName: string
  price: number
  date: string
}

interface PendingPayments {
  count: number
  total: number
  items: PendingPaymentItem[]
}

interface Alert {
  type: 'warning' | 'danger' | 'info'
  message: string
}

interface ClientStats {
  total: number
  newThisMonth: number
  recurring: number
  comingBack: number
}

interface OverviewData {
  metrics: {
    revenue: { value: number; change: number }
    expenses: { value: number; change: number }
    netProfit: { value: number; change: number }
    appointments: { value: number; change: number }
    newClients: { value: number; change: number }
    completedServices: { value: number; change: number }
  }
  statusCounts: {
    PENDING: number
    CONFIRMED: number
    COMPLETED: number
    CANCELLED: number
    NO_SHOW: number
  }
  todayAppointments: Array<{
    id: string
    reservationCode: string
    date: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
    client: { name: string; phone: string }
    barber: { name: string }
    service: { name: string; price: number }
    price: number
  }>
  barberPerformance: Array<{
    id: string
    name: string
    specialty?: string
    avatar?: string
    totalAppointments: number
    completedAppointments: number
    revenue: number
    estimatedCommission: number
    hasSchedule: boolean
  }>
  servicePerformance: Array<{
    id: string
    name: string
    category: string
    count: number
    revenue: number
  }>
  todayStats: TodayStats
  pendingPayments: PendingPayments
  alerts: Alert[]
  clientStats: ClientStats
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount)

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió'
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-zinc-100 text-zinc-600'
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ completed, confirmed, pending, cancelled }: {
  completed: number; confirmed: number; pending: number; cancelled: number
}) {
  const total = completed + confirmed + pending + cancelled
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-32 h-32 rounded-full border-[10px] border-zinc-100">
        <span className="text-xs font-bold text-zinc-400 text-center">Sin datos</span>
      </div>
    )
  }

  const segments = [
    { value: completed, color: '#10b981' },  // emerald
    { value: confirmed, color: '#3b82f6' },   // blue
    { value: pending, color: '#f59e0b' },     // amber
    { value: cancelled, color: '#ef4444' },   // red
  ]

  const r = 54
  const cx = 64
  const cy = 64
  const circumference = 2 * Math.PI * r
  const gap = 3

  let offset = 0
  const paths = segments
    .filter(s => s.value > 0)
    .map(s => {
      const pct = s.value / total
      const dash = pct * circumference - gap
      const path = (
        <circle
          key={s.color}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="14"
          strokeDasharray={`${Math.max(0, dash)} ${circumference}`}
          strokeDashoffset={-offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )
      offset += pct * circumference
      return path
    })

  return (
    <div className="relative">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f4f4f5" strokeWidth="14" />
        {paths}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-zinc-950">{total}</span>
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">citas</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OwnerDashboardPage() {
  const [preset, setPreset] = useState<DatePreset>('today')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OverviewData | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [hasWebPage, setHasWebPage] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<{
    id: string
    name: string
    slug: string
    status: string
    createdAt: string
    trialEndsAt?: string | null
    subscriptionEndsAt?: string | null
    plan?: { name: string; slug: string } | null
    daysLeft?: number | null
    isTrialActive?: boolean
  } | null>(null)

  useEffect(() => {
    const now = new Date()
    let from = new Date()
    let to = new Date()

    if (preset === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    } else if (preset === 'yesterday') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
    } else if (preset === 'week') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      from = new Date(now.setDate(diff))
      from.setHours(0, 0, 0, 0)
      to = new Date()
    } else if (preset === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    } else if (preset === 'year') {
      from = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    }

    if (preset !== 'custom') {
      setFromDate(from.toISOString().split('T')[0])
      setToDate(to.toISOString().split('T')[0])
    }
  }, [preset])

  const fetchOverview = React.useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (fromDate) queryParams.set('from', `${fromDate}T00:00:00.000Z`)
      if (toDate) queryParams.set('to', `${toDate}T23:59:59.999Z`)

      const res = await fetch(`/api/owner/overview?${queryParams.toString()}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        toast.error('Error al cargar datos del resumen')
      }
    } catch {
      toast.error('Error de red al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    if (fromDate && toDate) {
      fetchOverview()
    }
  }, [fromDate, toDate, fetchOverview])

  // Cargar perfil del negocio, slug y estado web
  useEffect(() => {
    const fetchBizInfo = async () => {
      try {
        const [resWp, resBiz] = await Promise.all([
          fetch('/api/owner/webpage'),
          fetch('/api/owner/business')
        ])

        if (resWp.ok) {
          const biz = await resWp.json()
          setBusinessSlug(biz.slug || null)
          setHasWebPage(!!(biz.slug && biz.page))
        }

        if (resBiz.ok) {
          const profile = await resBiz.json()
          setBusinessProfile(profile)
        }
      } catch { /* silencioso */ }
    }
    fetchBizInfo()
  }, [])

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Estado actualizado`)
        fetchOverview()
      } else {
        toast.error('No se pudo actualizar el estado')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const copyPublicLink = (type: 'page' | 'reserve') => {
    if (!businessSlug) return
    const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const link = type === 'page'
      ? `${origin}/b/${businessSlug}`
      : `${origin}/reserve/${businessSlug}`
    navigator.clipboard.writeText(link)
    toast.success('Enlace copiado al portapapeles 🚀')
  }

  // ── Formatted date header ──
  const todayLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).replace(/^\w/, c => c.toUpperCase())

  const todayStats = data?.todayStats
  const pendingPayments = data?.pendingPayments
  const alerts = data?.alerts || []
  const clientStats = data?.clientStats

  // ── Cálculo de periodo de prueba gratis ──
  // Use server-computed values when available, fall back to client calculation
  const isTrialActive = businessProfile?.isTrialActive ??
    (businessProfile?.status === 'TRIAL' && !!businessProfile?.trialEndsAt)
  const trialEnd = businessProfile?.trialEndsAt ? new Date(businessProfile.trialEndsAt) : null
  const trialStart = businessProfile?.createdAt ? new Date(businessProfile.createdAt) : new Date()
  // Server sends pre-computed daysLeft; fallback to client computation
  const daysLeft = businessProfile?.daysLeft != null
    ? businessProfile.daysLeft
    : trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
  // Progress 0-100 (100 = full 30 days left, 0 = expired)
  const trialProgress = daysLeft != null ? Math.min(100, Math.round((daysLeft / 30) * 100)) : null

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'yesterday', label: 'Ayer' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-6 pb-10">

      {/* ── BANNER DESTACADO DE BIENVENIDA / MES GRATIS A FULL ── */}
      {isTrialActive && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white p-6 sm:p-7 border border-amber-500/30 shadow-xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={12} className="text-amber-400" />
                  Mes Gratis Activado · Todo a Full
                </span>
                {daysLeft !== null && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    daysLeft === 0 ? 'bg-red-600/30 border border-red-500/60 text-red-300 animate-pulse' :
                    daysLeft <= 3 ? 'bg-red-500/20 border border-red-500/40 text-red-300' :
                    daysLeft <= 7 ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' :
                    'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  }`}>
                    <Clock size={11} />
                    {daysLeft === 0 ? '¡Vence HOY! Activa tu plan' : `${daysLeft} día${daysLeft === 1 ? '' : 's'} restante${daysLeft === 1 ? '' : 's'}`}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
                ¡Bienvenido a BarberOS! Has activado tu mes gratis con todo el sistema habilitado.
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                Tienes acceso ilimitado a barberos, reservas online, reportes de comisiones y tu página web personalizada.
                <span className="block text-zinc-400 text-xs mt-1">
                  📅 Inicio: <strong className="text-zinc-200">{trialStart.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                  {' · '}Finaliza: <strong className={daysLeft !== null && daysLeft <= 7 ? 'text-rose-300' : 'text-amber-300'}>{trialEnd ? trialEnd.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '30 días'}</strong>
                </span>
              </p>

              {/* Progress bar */}
              {trialProgress !== null && (
                <div className="w-full mt-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-1">
                    <span className="text-zinc-500">Progreso del periodo</span>
                    <span className={daysLeft !== null && daysLeft <= 7 ? 'text-rose-400' : 'text-amber-400'}>
                      {daysLeft === 0 ? 'Expirado' : `${daysLeft}/30 días`}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        trialProgress > 50 ? 'bg-emerald-500' :
                        trialProgress > 20 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/subscription"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
              >
                <Crown size={15} />
                <span>Ver Planes / Activar Membresía</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP BAR — Período + Refresh ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 uppercase tracking-tight">Inicio</h1>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                  preset === key ? 'bg-black text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-900 outline-none focus:border-black"
              />
              <span className="text-zinc-400 font-bold text-xs">→</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-900 outline-none focus:border-black"
              />
            </div>
          )}
          <button
            onClick={fetchOverview}
            disabled={loading}
            id="refresh-dashboard"
            className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* BLOQUE 1 — RESUMEN DEL DÍA                                             */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 text-zinc-950 dark:text-white shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Resumen del Día</span>
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white mt-0.5">HOY — {new Date().getDate()} {new Date().toLocaleDateString('es-CO', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}</h2>
          </div>
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center justify-center shadow-xs">
            <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Money row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Ingresado hoy</span>
            </div>
            <div className="text-2xl font-black text-zinc-950 dark:text-white">
              {loading ? '—' : formatCOP(todayStats?.revenue || 0)}
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingDown size={14} className="text-rose-600 dark:text-rose-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Gastos hoy</span>
            </div>
            <div className="text-2xl font-black text-zinc-950 dark:text-white">
              {loading ? '—' : formatCOP(todayStats?.expenses || 0)}
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-[#062013] border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp size={14} className="text-emerald-700 dark:text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Ganancia estimada</span>
            </div>
            <div className={`text-2xl font-black ${(todayStats?.estimatedProfit || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {loading ? '—' : formatCOP(todayStats?.estimatedProfit || 0)}
            </div>
          </div>
        </div>

        {/* Appointments row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800 rounded-xl p-3.5 text-center">
            <div className="text-3xl font-black text-zinc-950 dark:text-white">{loading ? '—' : todayStats?.totalAppointments ?? 0}</div>
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              <CalendarIcon size={10} /> Citas hoy
            </div>
          </div>
          <div className="bg-amber-50/60 dark:bg-[#1f1707] border border-amber-200/80 dark:border-amber-700/60 rounded-xl p-3.5 text-center">
            <div className="text-3xl font-black text-amber-700 dark:text-amber-300">{loading ? '—' : todayStats?.pending ?? 0}</div>
            <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              <Clock size={10} /> Por atender
            </div>
          </div>
          <div className="bg-emerald-50/60 dark:bg-[#062013] border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3.5 text-center">
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{loading ? '—' : todayStats?.completed ?? 0}</div>
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              <CheckCircle2 size={10} /> Completadas
            </div>
          </div>
        </div>
      </div>


      {/* BLOQUE 9 — ALERTAS (va arriba para visibilidad) */}
      {!loading && alerts.length > 0 && (
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-3 flex items-center gap-2">
            <AlertCircle size={12} className="text-amber-500" /> Requieren atención
          </h3>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold ${
                  a.type === 'danger' ? 'bg-red-50 text-red-800 border border-red-100' :
                  a.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                  'bg-blue-50 text-blue-800 border border-blue-100'
                }`}
              >
                {a.type === 'danger' ? <XCircle size={15} className="shrink-0" /> :
                 a.type === 'warning' ? <AlertTriangle size={15} className="shrink-0" /> :
                 <Info size={15} className="shrink-0" />}
                {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* BLOQUE 2 + 3 — FINANCIERO + POR COBRAR                                 */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Resumen Financiero — 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">Resumen Financiero</h3>
              <p className="text-base font-black text-zinc-950 dark:text-white mt-0.5">
                {preset === 'today' ? 'Hoy' : preset === 'week' ? 'Esta semana' : preset === 'month' ? 'Este mes' : preset === 'year' ? 'Este año' : 'Periodo seleccionado'}
              </p>
            </div>
            <Link href="/finances" className="text-xs font-black text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 uppercase tracking-wider">
              Ver finanzas <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-zinc-50 dark:bg-[#18181b] rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-black dark:bg-[#27272a] rounded-xl flex items-center justify-center">
                  <DollarSign size={13} className="text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Dinero recibido</span>
              </div>
              <div className="text-2xl font-black text-zinc-950 dark:text-white">{loading ? '—' : formatCOP(data?.metrics.revenue.value || 0)}</div>
              <div className="mt-2">
                {(data?.metrics.revenue.change || 0) >= 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <ArrowUpRight size={11} /> +{data?.metrics.revenue.change}% vs anterior
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 dark:text-rose-400 bg-red-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                    <ArrowDownRight size={11} /> {data?.metrics.revenue.change}% vs anterior
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-[#18181b] rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-zinc-200 dark:bg-[#27272a] rounded-xl flex items-center justify-center">
                  <TrendingDown size={13} className="text-zinc-700 dark:text-zinc-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Gastos registrados</span>
              </div>
              <div className="text-2xl font-black text-zinc-950 dark:text-white">{loading ? '—' : formatCOP(data?.metrics.expenses.value || 0)}</div>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-[#27272a] px-2 py-0.5 rounded-full">
                  {data?.metrics.expenses.change}% comparativo
                </span>
              </div>
            </div>
          </div>

          {/* Ganancia estimada — destacada */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            (data?.metrics.netProfit.value || 0) >= 0
              ? 'bg-emerald-50 dark:bg-[#062013] border-emerald-200 dark:border-emerald-800/60'
              : 'bg-red-50 dark:bg-[#20050b] border-red-200 dark:border-rose-900/60'
          }`}>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Ganancia estimada del periodo
              </div>
              <div className={`text-3xl font-black tracking-tight ${
                (data?.metrics.netProfit.value || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-rose-400'
              }`}>
                {loading ? '—' : formatCOP(data?.metrics.netProfit.value || 0)}
              </div>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-1">
                = Ingresos − Gastos registrados
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-700 rounded-2xl flex items-center justify-center shadow-md">
              <TrendingUp size={22} className="text-white" />
            </div>
          </div>
        </div>

        {/* Por Cobrar — 1 col */}
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">Por Cobrar</h3>
              <p className="text-base font-black text-zinc-950 dark:text-white mt-0.5">Pagos pendientes</p>
            </div>
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-500/15 rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-amber-700 dark:text-amber-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs text-zinc-400 font-bold">Cargando...</span>
            </div>
          ) : (pendingPayments?.count || 0) === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <p className="text-sm font-black text-zinc-700 dark:text-white">¡Todo cobrado!</p>
              <p className="text-xs text-zinc-400 font-medium">No hay pagos pendientes</p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-center">
                <div className="text-2xl font-black text-amber-900">{formatCOP(pendingPayments?.total || 0)}</div>
                <div className="text-xs font-bold text-amber-700 mt-1">{pendingPayments?.count} cita{(pendingPayments?.count || 0) > 1 ? 's' : ''} sin cobrar</div>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-40">
                {pendingPayments?.items.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div>
                      <div className="text-xs font-black text-zinc-900">{item.clientName}</div>
                      <div className="text-[10px] font-medium text-zinc-400">{item.serviceName}</div>
                    </div>
                    <div className="text-xs font-black text-amber-800">{formatCOP(item.price)}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/finances"
                className="mt-4 block text-center py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Ver pagos pendientes →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* BLOQUE 4 — OPERACIÓN DEL DÍA + BLOQUE 8 — CLIENTES                     */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Operación del día (donut) */}
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
          <div className="mb-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Operación de hoy</h3>
            <p className="text-base font-black text-zinc-950 mt-0.5">Estado de citas</p>
          </div>
          <div className="flex items-center gap-8">
            <DonutChart
              completed={data?.statusCounts.COMPLETED || 0}
              confirmed={data?.statusCounts.CONFIRMED || 0}
              pending={data?.statusCounts.PENDING || 0}
              cancelled={data?.statusCounts.CANCELLED || 0}
            />
            <div className="space-y-3 flex-1">
              {[
                { label: 'Completadas', value: data?.statusCounts.COMPLETED || 0, color: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: 'Confirmadas', value: data?.statusCounts.CONFIRMED || 0, color: 'bg-blue-500', text: 'text-blue-700' },
                { label: 'Pendientes', value: data?.statusCounts.PENDING || 0, color: 'bg-amber-500', text: 'text-amber-700' },
                { label: 'Canceladas', value: data?.statusCounts.CANCELLED || 0, color: 'bg-red-500', text: 'text-red-700' },
              ].map(({ label, value, color, text }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-xs font-bold text-zinc-600">{label}</span>
                  </div>
                  <span className={`text-sm font-black ${text}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clientes */}
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Clientes</h3>
              <p className="text-base font-black text-zinc-950 mt-0.5">Base de clientes</p>
            </div>
            <Link href="/clients" className="text-xs font-black text-zinc-500 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-wider">
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-zinc-50 dark:bg-[#18181b] rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-zinc-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Total clientes</span>
              </div>
              <div className="text-3xl font-black text-zinc-950">{loading ? '—' : clientStats?.total ?? 0}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={14} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">Nuevos este mes</span>
              </div>
              <div className="text-3xl font-black text-blue-700">{loading ? '—' : clientStats?.newThisMonth ?? 0}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Repeat2 size={14} className="text-purple-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-500">Recurrentes</span>
              </div>
              <div className="text-3xl font-black text-purple-700">{loading ? '—' : clientStats?.recurring ?? 0}</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <CalendarPlus size={14} className="text-amber-600" />
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">Por regresar</span>
              </div>
              <div className="text-3xl font-black text-amber-700">{loading ? '—' : clientStats?.comingBack ?? 0}</div>
              <div className="text-[9px] text-amber-500 font-medium mt-0.5">Últ. cita: 15-30 días</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* BLOQUE 5 — PRÓXIMAS CITAS                                               */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/60 dark:bg-[#18181b]">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Próximas Citas</h3>
            <p className="text-base font-black text-zinc-950 mt-0.5">¿Qué viene ahora?</p>
          </div>
          <Link
            href="/appointments"
            className="text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-900 flex items-center gap-1"
          >
            Ver todas <ChevronRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-[#18181b]">
                <th className="px-5 py-3 font-black">Hora</th>
                <th className="px-5 py-3 font-black">Cliente</th>
                <th className="px-5 py-3 font-black">Servicio</th>
                <th className="px-5 py-3 font-black">Barbero</th>
                <th className="px-5 py-3 font-black">Valor</th>
                <th className="px-5 py-3 font-black">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-400 text-xs font-bold uppercase">
                    Cargando agenda...
                  </td>
                </tr>
              ) : data?.todayAppointments && data.todayAppointments.length > 0 ? (
                data.todayAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#1f1f23] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-black text-sm text-zinc-950 dark:text-white">
                        {new Date(appt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="font-mono text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded mt-0.5 inline-block uppercase">
                        {appt.reservationCode?.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-black text-zinc-950 dark:text-white">{appt.client?.name || 'Cliente'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">{appt.service?.name}</td>
                    <td className="px-5 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">{appt.barber?.name}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-zinc-950 dark:text-white">{formatCOP(appt.price || 0)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={appt.status}
                        onChange={(e) => updateAppointmentStatus(appt.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-none outline-none cursor-pointer transition-all ${STATUS_COLORS[appt.status]}`}
                      >
                        <option value="PENDING">Pendiente</option>
                        <option value="CONFIRMED">Confirmada</option>
                        <option value="COMPLETED">Completada</option>
                        <option value="CANCELLED">Cancelada</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-400 text-xs font-bold uppercase">
                    No hay citas para este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* BLOQUE 6 — RENDIMIENTO + BLOQUE 7 — SERVICIOS                           */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Rendimiento de Barberos */}
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Rendimiento</h3>
              <p className="text-base font-black text-zinc-950 mt-0.5">¿Quién genera más?</p>
            </div>
            <Link href="/barbers" className="text-xs font-black text-zinc-500 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-wider">
              Equipo <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.barberPerformance && data.barberPerformance.length > 0 ? (
              data.barberPerformance.map((b, idx) => (
                <div key={b.id} className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-[#18181b] rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-zinc-700 text-white' :
                    'bg-zinc-200 text-zinc-700'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-zinc-950 dark:text-white uppercase truncate">{b.name}</div>
                    <div className="text-[10px] font-medium text-zinc-400">{b.completedAppointments} servicios realizados</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-zinc-950 dark:text-white">{formatCOP(b.revenue)}</div>
                    <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Comisión: {formatCOP(b.estimatedCommission)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BarChart3 size={28} className="text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-bold uppercase">Sin datos de barberos</p>
              </div>
            )}
          </div>
        </div>

        {/* Servicios Más Vendidos */}
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Servicios Top</h3>
              <p className="text-base font-black text-zinc-950 mt-0.5">¿Qué vendo más?</p>
            </div>
            <Link href="/services" className="text-xs font-black text-zinc-500 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-wider">
              Servicios <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.servicePerformance && data.servicePerformance.length > 0 ? (
              data.servicePerformance.slice(0, 5).map((s, idx) => {
                const maxRevenue = Math.max(...data.servicePerformance.slice(0, 5).map(x => x.revenue), 1)
                const pct = Math.min(100, (s.revenue / maxRevenue) * 100)
                return (
                  <div key={s.id} className="p-3.5 bg-zinc-50 dark:bg-[#18181b] rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-black text-zinc-900 dark:text-white uppercase">{s.name}</div>
                        <div className="text-[10px] font-medium text-zinc-400">{s.count} reservas</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-zinc-950 dark:text-white">{formatCOP(s.revenue)}</div>
                        <div className="text-[9px] text-zinc-400 font-medium">generados</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          idx === 0 ? 'bg-black' : idx === 1 ? 'bg-zinc-600' : 'bg-zinc-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Scissors size={28} className="text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-bold uppercase">Sin datos de servicios</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* BLOQUE 10 — ACCIONES RÁPIDAS + ENLACE PÚBLICO                           */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Acciones rápidas */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4">Acciones rápidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: '/appointments?new=1', icon: CalendarPlus, label: 'Nueva cita', color: 'bg-black text-white' },
              { href: '/clients?new=1', icon: UserPlus, label: 'Nuevo cliente', color: 'bg-zinc-800 text-white' },
              { href: '/services?new=1', icon: Scissors, label: 'Nuevo servicio', color: 'bg-zinc-700 text-white' },
              { href: '/barbers?new=1', icon: Users, label: 'Nuevo barbero', color: 'bg-zinc-600 text-white' },
              { href: '/finances?tab=expenses&new=1', icon: TrendingDown, label: 'Registrar gasto', color: 'bg-red-600 text-white' },
              { href: '/finances?tab=payments&new=1', icon: CreditCard, label: 'Registrar pago', color: 'bg-emerald-600 text-white' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-100 shadow-sm hover:shadow-md ${color}`}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Enlace público — dinámico según el estado de la página */}
        <div className="bg-[#0e0e10] border border-zinc-800/80 text-white p-7 rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300 mb-2">
              <Sparkles size={14} className="text-amber-400 fill-amber-400/20" />
              PÁGINA DE RESERVAS 24/7
            </div>

            {!businessSlug || !hasWebPage ? (
              /* CTA — si aún no tiene página creada */
              <div className="mt-2 space-y-3">
                <h4 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
                  CREA TU PÁGINA PÚBLICA
                </h4>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Aún no has configurado tu sitio de reservas. Personalízalo y empieza a recibir citas 24/7.
                </p>
                <Link
                  href="/webpage"
                  className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-black py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all w-full shadow-lg shadow-amber-400/20 mt-2"
                >
                  <Sparkles size={14} />
                  CREAR MI PÁGINA
                </Link>
              </div>
            ) : (
              /* Ya tiene página — IDÉNTICO a la imagen de referencia */
              <div className="mt-2">
                <h4 className="text-xl font-black uppercase tracking-tight text-white leading-tight mb-5">
                  COMPARTE TU ENLACE PÚBLICO
                </h4>
                <div className="flex items-center gap-3">
                  <button
                    id="copy-booking-link"
                    onClick={() => copyPublicLink('page')}
                    className="flex-1 bg-white hover:bg-zinc-100 active:scale-[0.98] text-black py-3.5 px-6 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Copy size={14} strokeWidth={2.5} />
                    COPIAR
                  </button>
                  <Link
                    href={`/b/${businessSlug}`}
                    target="_blank"
                    id="open-booking-link"
                    className="w-12 h-12 bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white rounded-2xl border border-white/5 transition-all flex items-center justify-center shrink-0"
                    title="Abrir página pública"
                  >
                    <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Círculos decorativos en esquina inferior derecha (idénticos a la imagen) */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-zinc-800/40 rounded-full pointer-events-none" />
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-[#7d531a]/40 rounded-full blur-[1px] pointer-events-none" />
        </div>
      </div>

    </div>
  )
}
