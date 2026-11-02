'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Clock,
  CheckCircle2,
  User as UserIcon,
  DollarSign,
  Percent,
  Phone,
  MessageSquare,
  Play,
  Check,
  Sparkles,
  TrendingUp,
  Scissors,
  Loader2,
  AlertCircle,
  XCircle,
  Info,
  ExternalLink,
  Plus,
  StickyNote,
  X,
  History,
  ShieldCheck,
  Bell,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { buildSocialUrl } from '@/lib/socials'

interface AppointmentItem {
  id: string
  reservationCode: string
  date: string
  time: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  clientId: string
  serviceName: string
  serviceId: string
  price: number
  barberCommission: number
  duration: number
  status: string
  payment: {
    id: string
    status: string
    method: string
    amount: number
    paymentCode: string | null
    paidAt: string | null
  } | null
  notes?: string | null
  clientNotes?: string | null
}

interface TodayClient {
  id: string
  name: string
  phone: string
  email?: string | null
  time: string
  serviceName: string
  servicePrice: number
  status: string
  totalVisits: number
  internalNotes?: string | null
}

interface NotificationItem {
  id: string
  title: string
  message: string
  timestamp: string
  status?: string
  reservationCode?: string
}

interface DashboardData {
  barber: {
    id: string
    name: string
    specialty: string
    avatar: string | null
    status: string
    commissionRate: number
    phone: string
    email: string
    businessName: string
  }
  todayDateInfo: {
    dateStr: string
    formattedDate: string
    currentTime: string
  }
  todayStats: {
    total: number
    pending: number
    confirmed: number
    inProgress: number
    completed: number
    cancelled: number
    noShow: number
    clientsAttendedToday: number
    commissionEstimatedToday: number
    commissionEarnedToday: number
    commissionPaidToday: number
    revenueRealToday: number
  }
  nextAppt: {
    id: string
    reservationCode: string
    date: string
    time: string
    clientName: string
    clientPhone: string
    clientId: string
    serviceName: string
    price: number
    barberCommission: number
    duration: number
    status: string
    notes?: string | null
  } | null
  todayAppointments: AppointmentItem[]
  todayClients: TodayClient[]
  monthPerformance: {
    monthName: string
    completedCount: number
    uniqueClients: number
    commissionGenerated: number
    commissionPaid: number
    revenueReal: number
  }
  notifications: NotificationItem[]
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  PENDING:     { label: 'Pendiente',       bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   dot: 'bg-amber-400' },
  CONFIRMED:   { label: 'Llegó / Espera',  bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'En Servicio 💈',  bg: 'bg-purple-50',  text: 'text-purple-800',  border: 'border-purple-200',  dot: 'bg-purple-500' },
  COMPLETED:   { label: 'Completada ✅',    bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED:   { label: 'Cancelada',       bg: 'bg-rose-50',    text: 'text-rose-800',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  NO_SHOW:     { label: 'No Asistió',      bg: 'bg-zinc-100',   text: 'text-zinc-600',    border: 'border-zinc-200',    dot: 'bg-zinc-400' },
}

export default function BarberDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [dayStatus, setDayStatus] = useState<'available' | 'working' | 'break'>('available')

  // Modals
  const [selectedApptDetail, setSelectedApptDetail] = useState<AppointmentItem | null>(null)
  const [cancelModalAppt, setCancelModalAppt] = useState<AppointmentItem | null>(null)
  const [clientNoteModal, setClientNoteModal] = useState<TodayClient | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/barber/dashboard')
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Error al cargar dashboard')
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Error de conexión al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    setUpdatingId(appointmentId)
    try {
      const res = await fetch(`/api/barber/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        const labels: Record<string, string> = {
          CONFIRMED: 'Llegada del cliente marcada ✓',
          IN_PROGRESS: 'Servicio iniciado 💈',
          COMPLETED: 'Servicio completado ✅ (Pago pendiente en caja)',
          CANCELLED: 'Cita cancelada',
          NO_SHOW: 'Marcado como No Asistió'
        }
        toast.success(labels[newStatus] ?? `Estado actualizado: ${newStatus}`)
        if (selectedApptDetail?.id === appointmentId) {
          setSelectedApptDetail(null)
        }
        if (cancelModalAppt?.id === appointmentId) {
          setCancelModalAppt(null)
        }
        await fetchDashboardData()
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Error al actualizar la cita')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSaveClientNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientNoteModal || !noteContent.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Nota Cliente: ${clientNoteModal.name}`,
          content: noteContent.trim(),
          clientId: clientNoteModal.id,
          category: 'CLIENT'
        })
      })

      if (res.ok) {
        toast.success('Nota guardada correctamente')
        setClientNoteModal(null)
        setNoteContent('')
        await fetchDashboardData()
      } else {
        toast.error('Error al guardar la nota')
      }
    } catch {
      toast.error('Error de conexión al guardar nota')
    } finally {
      setSavingNote(false)
    }
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-900" />
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Cargando tu centro de trabajo...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-white rounded-3xl border border-zinc-200 p-10 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-black uppercase text-zinc-900">No se pudo cargar el Dashboard</h3>
        <p className="text-xs text-zinc-500 max-w-sm">{error ?? 'Ocurrió un error al obtener la información de tu cuenta.'}</p>
        <button
          onClick={() => { setLoading(true); fetchDashboardData() }}
          className="mt-2 px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-all shadow-lg"
        >
          Reintentar Conexión
        </button>
      </div>
    )
  }

  const { barber, todayDateInfo, todayStats, nextAppt, todayAppointments, todayClients, monthPerformance, notifications } = data

  const filteredAppts = filterStatus === 'ALL'
    ? todayAppointments
    : todayAppointments.filter(a => a.status === filterStatus)

  const hourNumber = parseInt(todayDateInfo.currentTime.split(':')[0])
  const greeting = hourNumber < 12 ? 'Buenos días' : hourNumber < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 1: HEADER DINÁMICO
      ═══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-inner border border-zinc-700 shrink-0 relative overflow-hidden">
                {barber.avatar ? (
                  <Image src={barber.avatar} alt={barber.name} fill className="object-cover" unoptimized />
                ) : (
                  barber.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {barber.businessName}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium capitalize">
                    {todayDateInfo.formattedDate} · {todayDateInfo.currentTime}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-1 text-white">
                  {greeting}, {barber.name.split(' ')[0]} 👋
                </h1>
                <p className="text-xs text-zinc-300 font-medium mt-1">
                  {barber.specialty} · <span className="text-amber-400 font-bold">Tu comisión: {barber.commissionRate}%</span>
                </p>
              </div>
            </div>

            {/* Selector de Estado del Día */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl flex items-center gap-1">
                {[
                  { id: 'available', label: 'Disponible', dot: 'bg-emerald-500' },
                  { id: 'working',   label: 'En atención', dot: 'bg-blue-500' },
                  { id: 'break',     label: 'En descanso', dot: 'bg-amber-500' },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setDayStatus(st.id as 'available' | 'working' | 'break')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      dayStatus === st.id ? 'bg-white text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${st.dot} ${dayStatus === st.id ? 'animate-pulse' : ''}`} />
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setLoading(true); fetchDashboardData(); toast.info('Actualizando datos...') }}
                className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                title="Sincronizar ahora"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensaje Contextual */}
          <div className="text-sm font-bold text-zinc-200">
            {todayStats.total === 0 ? (
              <span className="text-zinc-300">No tienes citas programadas para hoy todavía.</span>
            ) : todayStats.pending > 0 ? (
              <span>Tienes <strong className="text-white">{todayStats.total} cita{todayStats.total !== 1 ? 's' : ''}</strong> programada{todayStats.total !== 1 ? 's' : ''} para hoy, con <strong className="text-amber-400">{todayStats.pending} pendiente{todayStats.pending !== 1 ? 's' : ''}</strong> por atender.</span>
            ) : (
              <span>¡Excelente ritmo! Has gestionado todas las citas del día ({todayStats.completed} completadas).</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 2: RESUMEN DEL DÍA (FILTRABLE CON CLIC)
      ═══════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-200">Resumen del Día (Haz clic en una tarjeta para filtrar)</h2>
          {filterStatus !== 'ALL' && (
            <button
              onClick={() => setFilterStatus('ALL')}
              className="text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:underline transition-colors"
            >
              Ver todas ({todayStats.total})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { id: 'ALL',         label: 'Citas Hoy',   count: todayStats.total,      color: 'text-white',       bg: 'bg-zinc-800',         border: 'border-zinc-700',       ring: 'ring-white' },
            { id: 'PENDING',     label: 'Pendientes',  count: todayStats.pending,    color: 'text-amber-300',   bg: 'bg-amber-950/60',     border: 'border-amber-700/60',   ring: 'ring-amber-400' },
            { id: 'CONFIRMED',   label: 'Llegaron',    count: todayStats.confirmed,  color: 'text-blue-300',    bg: 'bg-blue-950/60',      border: 'border-blue-700/60',    ring: 'ring-blue-400' },
            { id: 'IN_PROGRESS', label: 'En Curso',    count: todayStats.inProgress, color: 'text-purple-300',  bg: 'bg-purple-950/60',    border: 'border-purple-700/60',  ring: 'ring-purple-400' },
            { id: 'COMPLETED',   label: 'Completadas', count: todayStats.completed,  color: 'text-emerald-300', bg: 'bg-emerald-950/60',   border: 'border-emerald-700/60', ring: 'ring-emerald-400' },
            { id: 'CANCELLED',   label: 'Canceladas',  count: todayStats.cancelled,  color: 'text-rose-300',    bg: 'bg-rose-950/60',      border: 'border-rose-700/60',    ring: 'ring-rose-400' },
            { id: 'NO_SHOW',     label: 'No Asistió',  count: todayStats.noShow,     color: 'text-zinc-300',    bg: 'bg-zinc-900',         border: 'border-zinc-700',       ring: 'ring-zinc-400' },
          ].map(card => {
            const isSelected = filterStatus === card.id
            return (
              <button
                key={card.id}
                onClick={() => setFilterStatus(card.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? `ring-2 ${card.ring} shadow-lg ${card.bg} ${card.border}`
                    : `${card.bg} ${card.border} hover:brightness-125 hover:shadow-md`
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block truncate">{card.label}</span>
                <span className={`text-2xl font-black ${card.color} block mt-1`}>{card.count}</span>
                {isSelected && <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${card.color.replace('text-', 'bg-')}`} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 3: PRÓXIMA CITA
      ═══════════════════════════════════════════════════════ */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Próxima Cita</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Atención prioritaria</p>
            </div>
          </div>
          {nextAppt && (
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${STATUS_META[nextAppt.status]?.bg} ${STATUS_META[nextAppt.status]?.text} ${STATUS_META[nextAppt.status]?.border}`}>
              {STATUS_META[nextAppt.status]?.label}
            </span>
          )}
        </div>

        {nextAppt ? (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black font-mono text-white bg-zinc-800 px-4 py-1.5 rounded-2xl border border-zinc-700">
                  {nextAppt.time}
                </span>
                <span className="text-xs font-bold text-zinc-400">
                  Duración estimada: {nextAppt.duration} min
                </span>
              </div>
              <h4 className="text-xl font-black text-white tracking-tight">{nextAppt.clientName}</h4>
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                {nextAppt.serviceName} · {formatCOP(nextAppt.price)}
                <span className="text-zinc-400 font-medium">(Tu comisión: {formatCOP(nextAppt.barberCommission)})</span>
              </p>
              {nextAppt.notes && (
                <p className="text-xs text-zinc-300 italic bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 max-w-lg">
                  "{nextAppt.notes}"
                </p>
              )}
            </div>

            {/* Botones de acción rápida */}
            <div className="flex flex-wrap items-center gap-2">
              {nextAppt.clientPhone && (
                <>
                  <a
                    href={`tel:${nextAppt.clientPhone}`}
                    className="p-3 rounded-2xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 transition-all font-bold text-xs flex items-center gap-1.5"
                    title="Llamar al cliente"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Llamar</span>
                  </a>
                  <a
                    href={buildSocialUrl('whatsapp', nextAppt.clientPhone)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl border border-emerald-700/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition-all font-bold text-xs flex items-center gap-1.5"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}

              {nextAppt.status === 'PENDING' && (
                <button
                  disabled={updatingId === nextAppt.id}
                  onClick={() => handleUpdateStatus(nextAppt.id, 'CONFIRMED')}
                  className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Marcar Llegada</span>
                </button>
              )}

              {(nextAppt.status === 'CONFIRMED' || nextAppt.status === 'PENDING') && (
                <button
                  disabled={updatingId === nextAppt.id}
                  onClick={() => handleUpdateStatus(nextAppt.id, 'IN_PROGRESS')}
                  className="px-5 py-3 rounded-2xl bg-purple-600 text-white font-black text-xs uppercase tracking-wider hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar Servicio</span>
                </button>
              )}

              {nextAppt.status === 'IN_PROGRESS' && (
                <button
                  disabled={updatingId === nextAppt.id}
                  onClick={() => handleUpdateStatus(nextAppt.id, 'COMPLETED')}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Finalizar Servicio</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-200">No tienes más citas programadas para hoy</h4>
            <p className="text-xs text-zinc-400">Las nuevas reservas públicas aparecerán aquí automáticamente en tiempo real.</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 4: AGENDA DEL DÍA (CRONOLÓGICA)
      ═══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Agenda del Día
              <span className="text-sm font-bold text-zinc-400">({filteredAppts.length} citas)</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Control en tiempo real: Llegada → Iniciar → Finalizar → Cobro
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
            {[
              { id: 'ALL',         label: `Todas (${todayAppointments.length})` },
              { id: 'PENDING',     label: `Pendientes (${todayStats.pending})` },
              { id: 'CONFIRMED',   label: `Llegaron (${todayStats.confirmed})` },
              { id: 'IN_PROGRESS', label: `En Curso (${todayStats.inProgress})` },
              { id: 'COMPLETED',   label: `Completadas (${todayStats.completed})` },
              { id: 'CANCELLED',   label: `Canceladas (${todayStats.cancelled})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === f.id
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredAppts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppts.map(appt => {
              const badge = STATUS_META[appt.status] ?? STATUS_META.PENDING
              const isUpdating = updatingId === appt.id
              const isFinal = appt.status === 'COMPLETED' || appt.status === 'CANCELLED' || appt.status === 'NO_SHOW'

              return (
                <div
                  key={appt.id}
                  className={`bg-zinc-900 border rounded-3xl p-5 shadow-sm hover:shadow-lg hover:shadow-black/30 transition-all flex flex-col justify-between space-y-4 ${
                    appt.status === 'IN_PROGRESS' ? 'border-purple-700/60 ring-2 ring-purple-500/30' :
                    appt.status === 'COMPLETED' ? 'border-emerald-800/60 bg-emerald-950/30' :
                    appt.status === 'CANCELLED' ? 'opacity-60 border-zinc-800' : 'border-zinc-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header fila */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-white bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-xl">
                          {appt.time}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {appt.duration}m
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Info Cliente y Servicio */}
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div>
                        <h4 className="text-base font-black text-white tracking-tight">{appt.clientName}</h4>
                        <p className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5" />
                          {appt.serviceName}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Ref: {appt.reservationCode}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-white">{formatCOP(appt.price)}</div>
                        <div className="text-[10px] font-bold text-emerald-400">
                          Comisión: {formatCOP(appt.barberCommission)}
                        </div>
                        {appt.payment && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                            appt.payment.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {appt.payment.status === 'PAID' ? '✓ Cobrado en Caja' : 'Pago Pendiente'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contacto */}
                    {appt.clientPhone && (
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-medium text-zinc-300">
                        <span className="text-[11px] text-zinc-400 font-mono">{appt.clientPhone}</span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${appt.clientPhone}`}
                            className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors"
                            title="Llamar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={buildSocialUrl('whatsapp', appt.clientPhone)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-emerald-700/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones principales */}
                  <div className="pt-3 border-t border-zinc-800 space-y-2">
                    {!isFinal && (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                          className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                            appt.status === 'CONFIRMED'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40'
                          }`}
                        >
                          <UserIcon className="w-3 h-3" />
                          <span>Llegó</span>
                        </button>

                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                          className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                            appt.status === 'IN_PROGRESS'
                              ? 'bg-purple-600 text-white shadow-xs animate-pulse'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40'
                          }`}
                        >
                          <Play className="w-3 h-3" />
                          <span>Iniciar</span>
                        </button>

                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                          className="px-2 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 shadow-xs"
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          <span>Finalizar</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedApptDetail(appt)}
                        className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                      >
                        Ver Detalle Completo
                      </button>

                      {!isFinal && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCancelModalAppt(appt)}
                            className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            Cancelar / No Asistió
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center space-y-3">
            <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-200">No hay citas en este filtro</h4>
            <p className="text-xs text-zinc-400">Selecciona otro filtro para visualizar otras citas de tu agenda.</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 5: CLIENTES DE HOY (ÚNICOS)
      ═══════════════════════════════════════════════════════ */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-amber-400" />
              Clientes Programados para Hoy ({todayClients.length})
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Directorio de clientes de hoy con su historial de visitas
            </p>
          </div>
          <Link
            href="/barber/clients"
            className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <span>Ver Directorio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayClients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClients.map(c => (
              <div key={c.id} className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-white text-sm">{c.name}</h4>
                    <span className="text-[10px] font-mono bg-zinc-700 px-2 py-0.5 rounded-lg text-zinc-200 font-bold">{c.time}</span>
                  </div>
                  <p className="text-xs font-semibold text-amber-400 mt-1">{c.serviceName}</p>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-2">
                    <History className="w-3 h-3 text-zinc-500" />
                    <span>{c.totalVisits} visita{c.totalVisits !== 1 ? 's' : ''} anterior{c.totalVisits !== 1 ? 'es' : ''} contigo</span>
                  </div>
                  {c.internalNotes && (
                    <p className="text-[11px] text-zinc-300 bg-zinc-900 p-2 rounded-xl border border-zinc-700 mt-2 italic">
                      "{c.internalNotes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setClientNoteModal(c)
                      setNoteContent(c.internalNotes || '')
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-700 border border-zinc-600 hover:bg-zinc-600 text-zinc-100 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nota Rápida</span>
                  </button>
                  {c.phone && (
                    <a
                      href={buildSocialUrl('whatsapp', c.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/60 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-zinc-400 italic">
            No hay clientes agendados para el día de hoy.
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 6: COMISIONES & FINANZAS DEL BARBERO
      ═══════════════════════════════════════════════════════ */}
      <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">Balance Financiero</span>
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Regla: Solo pagos PAID representan dinero recibido</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight mt-1 text-white">Comisiones del Barbero</h3>
          </div>
          <Link
            href="/barber/commissions"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider self-start sm:self-auto"
          >
            <span>Ver desglose completo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Comisión Estimada */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block flex items-center justify-between">
              <span>Comisión Estimada (Hoy)</span>
              <span title="Basada en citas pendientes y programadas de hoy">
                <Info className="w-3.5 h-3.5 text-zinc-600" />
              </span>
            </span>
            <div className="text-3xl font-black text-amber-400">
              {formatCOP(todayStats.commissionEstimatedToday)}
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              Potencial de ingresos sobre {todayStats.pending + todayStats.confirmed + todayStats.inProgress} citas activas de hoy.
            </p>
          </div>

          {/* Comisión Generada */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block flex items-center justify-between">
              <span>Comisión Generada (Hoy)</span>
              <span title="Basada en servicios completados">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              </span>
            </span>
            <div className="text-3xl font-black text-blue-400">
              {formatCOP(todayStats.commissionEarnedToday)}
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              Generada sobre {todayStats.completed} servicio{todayStats.completed !== 1 ? 's' : ''} completado{todayStats.completed !== 1 ? 's' : ''} hoy.
            </p>
          </div>

          {/* Comisión Cobrada en Caja */}
          <div className="bg-zinc-900 border border-emerald-900/40 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block flex items-center justify-between">
              <span>Comisión Cobrada en Caja</span>
              <span title="Solo pagos con estado PAID">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </span>
            </span>
            <div className="text-3xl font-black text-emerald-400">
              {formatCOP(todayStats.commissionPaidToday)}
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              Dinero efectivamente recibido en caja por tus servicios ({formatCOP(todayStats.revenueRealToday)} total).
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 7: RENDIMIENTO RÁPIDO DEL MES
      ═══════════════════════════════════════════════════════ */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Rendimiento del Mes ({monthPerformance.monthName})
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Acumulado real del mes en curso para {barber.name}
            </p>
          </div>
          <Link
            href="/barber/performance"
            className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <span>Ver Métricas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Servicios Realizados</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{monthPerformance.completedCount}</div>
            <span className="text-[11px] text-zinc-400 font-medium mt-0.5 block">completados este mes</span>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Clientes Atendidos</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{monthPerformance.uniqueClients}</div>
            <span className="text-[11px] text-zinc-400 font-medium mt-0.5 block">clientes únicos este mes</span>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Comisión Generada (Mes)</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">{formatCOP(monthPerformance.commissionGenerated)}</div>
            <span className="text-[11px] text-zinc-400 font-medium mt-0.5 block">acumulado mensual</span>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Comisión Cobrada (PAID)</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{formatCOP(monthPerformance.commissionPaid)}</div>
            <span className="text-[11px] text-zinc-400 font-medium mt-0.5 block">pagado en caja</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN 8 & 9: NOTIFICACIONES & ACCESOS RÁPIDOS
      ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notificaciones */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Notificaciones & Actividad Reciente
            </h3>
            <Link href="/barber/notifications" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors">
              Ver todas
            </Link>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-2.5">
              {notifications.map(n => (
                <div key={n.id} className="p-3 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-white">{n.title}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">{n.message}</p>
                    {n.reservationCode && (
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 inline-block">Código: {n.reservationCode}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold shrink-0">
                    {new Date(n.timestamp).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic py-4 text-center">No hay notificaciones recientes.</p>
          )}
        </div>

        {/* Accesos Rápidos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg space-y-4">
          <h3 className="text-base font-black text-white uppercase tracking-tight">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { href: '/barber/calendar',    icon: Calendar,   label: 'Mi Agenda' },
              { href: '/barber/services',    icon: Scissors,   label: 'Mis Servicios' },
              { href: '/barber/commissions', icon: Percent,    label: 'Comisiones' },
              { href: '/barber/schedule',    icon: Clock,      label: 'Mis Horarios' },
              { href: '/barber/performance', icon: TrendingUp, label: 'Rendimiento' },
              { href: '/barber/profile',     icon: Sparkles,   label: 'Mi Perfil' },
            ].map(l => {
              const Icon = l.icon
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="p-3 bg-zinc-800 border border-zinc-700 rounded-2xl hover:bg-zinc-700 hover:border-zinc-600 transition-all flex flex-col items-center justify-center text-center group"
                >
                  <Icon className="w-5 h-5 text-amber-400 group-hover:text-amber-300 mb-1.5 transition-colors" />
                  <span className="text-[11px] font-black uppercase text-zinc-200 tracking-wider">{l.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL: DETALLE DE CITA
      ═══════════════════════════════════════════════════════ */}
      {selectedApptDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Detalle de Reserva</span>
                <h3 className="text-xl font-black text-white uppercase">{selectedApptDetail.reservationCode}</h3>
              </div>
              <button
                onClick={() => setSelectedApptDetail(null)}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4 bg-zinc-800 p-4 rounded-2xl border border-zinc-700">
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-400 block">Cliente</span>
                  <span className="font-bold text-white text-sm">{selectedApptDetail.clientName}</span>
                  <span className="text-zinc-400 block font-mono mt-0.5">{selectedApptDetail.clientPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-400 block">Hora y Fecha</span>
                  <span className="font-bold text-white text-sm">{selectedApptDetail.time}</span>
                  <span className="text-zinc-400 block">{selectedApptDetail.duration} minutos</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-800 p-4 rounded-2xl border border-zinc-700">
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-400 block">Servicio</span>
                  <span className="font-bold text-white">{selectedApptDetail.serviceName}</span>
                  <span className="text-amber-400 font-black block mt-0.5">{formatCOP(selectedApptDetail.price)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-400 block">Tu Ganancia / Comisión</span>
                  <span className="font-black text-emerald-400 text-sm">{formatCOP(selectedApptDetail.barberCommission)}</span>
                  <span className="text-zinc-500 block">({barber.commissionRate}%)</span>
                </div>
              </div>

              {selectedApptDetail.notes && (
                <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-700/40">
                  <span className="text-[10px] font-black uppercase text-amber-400 block mb-1">Nota de la reserva</span>
                  <p className="text-amber-200">{selectedApptDetail.notes}</p>
                </div>
              )}

              {selectedApptDetail.payment && (
                <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-zinc-400 block">Estado del Pago</span>
                    <span className="font-bold text-white">
                      {selectedApptDetail.payment.status === 'PAID' ? '✓ Pagado en caja' : 'Pendiente por cobrar'}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-400">{selectedApptDetail.payment.paymentCode || 'N/A'}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApptDetail(null)}
                className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: CANCELAR / NO ASISTIÓ
      ═══════════════════════════════════════════════════════ */}
      {cancelModalAppt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-zinc-800 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-rose-950/50 rounded-2xl flex items-center justify-center shrink-0 text-rose-400 border border-rose-700/40">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase">Cancelar o Marcar No Asistió</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cita de <strong className="text-zinc-200">{cancelModalAppt.clientName}</strong> ({cancelModalAppt.time} - {cancelModalAppt.serviceName})
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleUpdateStatus(cancelModalAppt.id, 'CANCELLED')}
                disabled={updatingId === cancelModalAppt.id}
                className="w-full py-3.5 rounded-2xl bg-rose-950/50 border border-rose-700/60 text-rose-300 hover:bg-rose-900/60 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Marcar como Cancelada
              </button>

              <button
                onClick={() => handleUpdateStatus(cancelModalAppt.id, 'NO_SHOW')}
                disabled={updatingId === cancelModalAppt.id}
                className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Marcar como No Asistió (No Show)
              </button>

              <button
                onClick={() => setCancelModalAppt(null)}
                className="w-full py-3 rounded-2xl text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Regresar sin cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: NOTA RÁPIDA DE CLIENTE
      ═══════════════════════════════════════════════════════ */}
      {clientNoteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-zinc-800 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase">Nota Rápida</h3>
                  <p className="text-xs text-zinc-400">{clientNoteModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setClientNoteModal(null)}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClientNote} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5 ml-1">
                  Preferencias, estilo de corte o detalles del cliente
                </label>
                <textarea
                  autoFocus
                  required
                  rows={4}
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Ej. Prefiere degradado alto con navaja, poco corte arriba..."
                  className="w-full p-4 border border-zinc-700 rounded-2xl text-xs font-medium text-zinc-100 outline-none focus:border-amber-500 bg-zinc-800 transition-colors resize-none placeholder:text-zinc-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClientNoteModal(null)}
                  className="flex-1 py-3 rounded-2xl border border-zinc-700 text-xs font-black uppercase text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!noteContent.trim() || savingNote}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg"
                >
                  {savingNote ? 'Guardando...' : 'Guardar Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
