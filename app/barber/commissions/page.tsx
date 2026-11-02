'use client'

import React, { useState, useEffect } from 'react'
import {
  Percent,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  AlertCircle,
  FileText,
  User,
  Scissors,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

interface SelectedDayStats {
  dateStr: string
  formattedDate: string
  servicesCompleted: number
  revenueEstimated: number
  commissionEarned: number
  commissionPaid: number
  appointments: Array<{
    id: string
    date: string
    clientName: string
    clientPhone: string
    serviceName: string
    serviceValue: number
    commission: number
    paymentStatus: string
    paymentMethod: string | null
    paidAt: string | null
  }>
}

interface CommissionData {
  commissionRate: number
  today?: {
    servicesCompleted: number
    revenueEstimated: number
    commissionEarned: number
    commissionPaid: number
  }
  selectedDayStats?: SelectedDayStats
  thisMonth: {
    servicesCompleted: number
    revenueEstimated: number
    revenueReal: number
    pendingRevenue: number
    commissionEstimated: number
    commissionPending: number
    commissionPaid: number
  }
  weeklyHistory: Array<{
    weekOffset: number
    start: string
    end: string
    label: string
    servicesCompleted: number
    revenueEstimated: number
    commissionEstimated: number
    commissionPaid: number
    status: 'IN_PROGRESS' | 'PAID' | 'PENDING'
  }>
  appointmentHistory: Array<{
    id: string
    date: string
    clientName: string
    clientPhone: string
    serviceName: string
    serviceValue: number
    commission: number
    paymentStatus: string
    paymentMethod: string | null
    paymentCode: string | null
    paidAt: string | null
  }>
}

export default function BarberCommissionsPage() {
  const [data, setData] = useState<CommissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })

  const fetchCommissions = async (dateVal = selectedDate) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/barber/commissions?date=${encodeURIComponent(dateVal)}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error('Error al cargar comisiones')
      }
    } catch {
      toast.error('Error de conexión al cargar comisiones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommissions(selectedDate)
  }, [selectedDate])

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cargando tus comisiones reales...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="w-10 h-10 text-zinc-400" />
        <span className="text-sm font-bold text-zinc-700">No se pudieron cargar las comisiones</span>
      </div>
    )
  }

  const { commissionRate, today, selectedDayStats, thisMonth, weeklyHistory, appointmentHistory } = data

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white">
              Liquidación Transparente
            </span>
            <span className="text-xs text-zinc-400 font-medium">Datos 100% reales en tiempo real</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 mt-1">
            Mis Comisiones ({commissionRate}%)
          </h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Resumen de servicios completados y comisiones calculadas con base en pagos auditados.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-4 rounded-2xl">
          <Percent className="w-8 h-8 text-zinc-900" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Tasa Asignada</span>
            <span className="text-xl font-black text-zinc-900">{commissionRate}% por servicio</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FILTRO POR FECHA & GANANCIAS DEL DÍA SELECCIONADO
      ═══════════════════════════════════════════════════════ */}
      <div className="bg-zinc-950 text-white border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
              Consulta de Jornada Diaria
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-0.5">
              Ganancias del Día
            </h2>
            {selectedDayStats && (
              <p className="text-xs text-zinc-400 font-medium capitalize mt-1">
                {selectedDayStats.formattedDate}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Filtrar por Fecha</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-zinc-950 text-white font-bold text-xs border border-zinc-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {selectedDayStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Servicios Realizados</span>
                <div className="text-3xl font-black text-white mt-1">{selectedDayStats.servicesCompleted}</div>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Citas completadas esta fecha</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Facturación de la Fecha</span>
                <div className="text-3xl font-black text-white mt-1">{formatCOP(selectedDayStats.revenueEstimated)}</div>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Valor total atenciones fecha</span>
              </div>

              <div className="bg-zinc-900 border border-blue-900/60 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-blue-400 block">Comisión Generada</span>
                <div className="text-3xl font-black text-blue-400 mt-1">{formatCOP(selectedDayStats.commissionEarned)}</div>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Tasa {commissionRate}% asignada</span>
              </div>

              <div className="bg-zinc-900 border border-emerald-900/60 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-emerald-400 block">Comisión Cobrada (Caja)</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{formatCOP(selectedDayStats.commissionPaid)}</div>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Pagos auditados y confirmados</span>
              </div>
            </div>

            {/* Citas de la Fecha Seleccionada */}
            {selectedDayStats.appointments.length > 0 ? (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                  Detalle de Servicios Atendidos el {selectedDate}
                </span>
                <div className="divide-y divide-zinc-800">
                  {selectedDayStats.appointments.map(appt => (
                    <div key={appt.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{appt.clientName}</span>
                          <span className="text-zinc-500 font-mono">({appt.clientPhone})</span>
                        </div>
                        <span className="text-zinc-400 text-[11px] block mt-0.5">{appt.serviceName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-400 block">{formatCOP(appt.commission)}</span>
                        <span className="text-[10px] text-zinc-500">Valor servicio: {formatCOP(appt.serviceValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-xs font-medium bg-zinc-900/50 rounded-2xl border border-zinc-800">
                No hay servicios completados registrados para la fecha seleccionada ({selectedDate}).
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tarjetas Principales del Mes */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Acumulado del Mes en Curso</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Comisión Generada (Pagada) */}
        <div className="bg-zinc-950 text-white rounded-3xl p-6 shadow-xl space-y-2 border border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            Comisión Pagada (Mes)
          </span>
          <div className="text-3xl font-black text-emerald-400">
            {formatCOP(thisMonth.commissionPaid)}
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Servicios con pago confirmado (PAID)</span>
          </div>
        </div>

        {/* Comisión Pendiente de Cobro */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            Comisión Por Cobrar
          </span>
          <div className="text-3xl font-black text-amber-500">
            {formatCOP(thisMonth.commissionPending)}
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-zinc-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Servicios completados pendientes de pago</span>
          </div>
        </div>

        {/* Total Estimado del Mes */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            Comisión Total Estimada
          </span>
          <div className="text-3xl font-black text-zinc-900">
            {formatCOP(thisMonth.commissionEstimated)}
          </div>
          <span className="text-xs text-zinc-500 font-medium block pt-1">
            {thisMonth.servicesCompleted} servicio{thisMonth.servicesCompleted !== 1 ? 's' : ''} completado{thisMonth.servicesCompleted !== 1 ? 's' : ''} en el mes
          </span>
        </div>

        {/* Total Facturado */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            Ingresos Generados
          </span>
          <div className="text-3xl font-black text-zinc-900">
            {formatCOP(thisMonth.revenueEstimated)}
          </div>
        </div>
      </div>
    </div>

      {/* Selector de Pestaña: Resumen Semanal vs Detalle de Citas */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'summary'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Historial Semanal ({weeklyHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'details'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Detalle de Citas del Mes ({appointmentHistory.length})
        </button>
      </div>

      {activeTab === 'summary' ? (
        /* Historial Semanal Real */
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Liquidación por Semanas
            </h2>
            <span className="text-xs font-bold text-zinc-300">Últimas 4 semanas</span>
          </div>

          <div className="space-y-3">
            {weeklyHistory.map((h, i) => (
              <div
                key={i}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  h.status === 'IN_PROGRESS'
                    ? 'bg-amber-950/60 border-amber-700/60'
                    : h.status === 'PAID'
                    ? 'bg-emerald-950/60 border-emerald-700/60'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{h.label}</span>
                    {h.status === 'IN_PROGRESS' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        En Curso
                      </span>
                    ) : h.status === 'PAID' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Pagado Completo
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 font-medium mt-1">
                    {h.servicesCompleted} servicio{h.servicesCompleted !== 1 ? 's' : ''} completado{h.servicesCompleted !== 1 ? 's' : ''} · Facturado: {formatCOP(h.revenueEstimated)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Comisión Estimada</span>
                  <span className="text-xl font-black text-white">{formatCOP(h.commissionEstimated)}</span>
                  {h.commissionPaid > 0 && h.commissionPaid < h.commissionEstimated && (
                    <span className="text-[11px] font-bold text-emerald-400 block">
                      {formatCOP(h.commissionPaid)} pagado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Detalle de Citas del Mes */
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <h2 className="text-lg font-black text-zinc-950 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-900" />
            Citas Completadas del Mes
          </h2>

          {appointmentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-400 font-black uppercase text-[10px]">
                    <th className="pb-3">Fecha & Hora</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Servicio</th>
                    <th className="pb-3 text-right">Valor Servicio</th>
                    <th className="pb-3 text-right">Tu Comisión</th>
                    <th className="pb-3 text-center">Estado Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {appointmentHistory.map((appt) => (
                    <tr key={appt.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 font-medium text-zinc-600 whitespace-nowrap">
                        {new Date(appt.date).toLocaleDateString('es-CO', {
                          timeZone: 'America/Bogota',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 font-black text-zinc-900">{appt.clientName}</td>
                      <td className="py-3 text-zinc-700 font-medium">{appt.serviceName}</td>
                      <td className="py-3 text-right font-semibold text-zinc-900">{formatCOP(appt.serviceValue)}</td>
                      <td className="py-3 text-right font-black text-emerald-600">{formatCOP(appt.commission)}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          appt.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {appt.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-400 text-xs">
              No tienes servicios completados registrados este mes.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
