'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Scissors,
  Users,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  Percent,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

interface PerformanceData {
  period: string
  periodLabel: string
  commissionRate: number
  thisMonth: {
    servicesCompleted: number
    clientsAttended: number
    revenueEstimated: number
    revenueReal: number
    commissionEstimated: number
    commissionEarned: number
    avgTicket: number
    cancellationRate: number
    recurringClientsRate: number
    topServices: Array<{ name: string; count: number }>
  }
  prevMonth: {
    servicesCompleted: number
    revenueEstimated: number
    commissionEstimated: number
  }
}

export default function BarberPerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPerformance() {
      try {
        const res = await fetch('/api/barber/performance')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          toast.error('Error al cargar métricas de rendimiento')
        }
      } catch {
        toast.error('Error de red al cargar rendimiento')
      } finally {
        setLoading(false)
      }
    }
    fetchPerformance()
  }, [])

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cargando métricas reales...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="w-10 h-10 text-zinc-400" />
        <span className="text-sm font-bold text-zinc-700">No se pudieron cargar las métricas</span>
      </div>
    )
  }

  const { periodLabel, thisMonth, prevMonth } = data

  // Comparison with previous month
  const servicesDiff = thisMonth.servicesCompleted - prevMonth.servicesCompleted
  const revenueDiff = thisMonth.revenueEstimated - prevMonth.revenueEstimated

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-black">
              Métricas Personales
            </span>
            <span className="text-xs text-zinc-400 font-medium capitalize">{periodLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 mt-1">
            Mi Rendimiento
          </h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Métricas 100% reales calculadas directamente de tu actividad del mes en curso.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-4 rounded-2xl">
          <Award className="w-8 h-8 text-amber-500" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Ticket Promedio</span>
            <span className="text-xl font-black text-zinc-900">{formatCOP(thisMonth.avgTicket)}</span>
          </div>
        </div>
      </div>

      {/* Grid de Rendimiento Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Servicios Realizados */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Servicios Completados (Mes)
            </span>
            <div className="text-3xl font-black text-zinc-950 mt-0.5">
              {thisMonth.servicesCompleted} <span className="text-xs font-bold text-zinc-400">servicios</span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              {prevMonth.servicesCompleted > 0 ? (
                servicesDiff >= 0 ? (
                  <span className="text-emerald-600 font-bold">+{servicesDiff} vs mes anterior ({prevMonth.servicesCompleted})</span>
                ) : (
                  <span className="text-rose-600 font-bold">{servicesDiff} vs mes anterior ({prevMonth.servicesCompleted})</span>
                )
              ) : (
                <span>Atendiste a {thisMonth.clientsAttended} clientes únicos este mes.</span>
              )}
            </p>
          </div>
        </div>

        {/* Tasa de Clientes Recurrentes */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Fidelización de Clientes
            </span>
            <div className="text-3xl font-black text-emerald-600 mt-0.5">
              {thisMonth.recurringClientsRate}%
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Porcentaje de clientes que han vuelto a agendar contigo más de una vez.
            </p>
          </div>
        </div>

        {/* Tasa de Cancelación */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Tasa de Cancelación
            </span>
            <div className={`text-3xl font-black mt-0.5 ${thisMonth.cancellationRate > 15 ? 'text-rose-500' : 'text-zinc-900'}`}>
              {thisMonth.cancellationRate}%
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Citas canceladas o marcadas como no asistió este mes.
            </p>
          </div>
        </div>
      </div>

      {/* Servicios Más Realizados */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
        <h2 className="text-lg font-black text-zinc-950 tracking-tight flex items-center gap-2">
          <Scissors className="w-5 h-5 text-zinc-900" />
          Tus Servicios Más Solicitados Este Mes
        </h2>

        {thisMonth.topServices.length > 0 ? (
          <div className="space-y-3">
            {thisMonth.topServices.map((srv, i) => {
              const pct = thisMonth.servicesCompleted > 0
                ? Math.round((srv.count / thisMonth.servicesCompleted) * 100)
                : 0
              return (
                <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-zinc-900">{srv.name}</span>
                    <span className="text-xs font-bold text-zinc-700">{srv.count} realizados ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400 text-xs">
            Aún no has completado servicios este mes para generar este ranking.
          </div>
        )}
      </div>

      {/* Resumen Financiero Real */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-black text-white rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-zinc-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">Facturación del Mes</span>
          </div>
          <h3 className="text-2xl font-black text-white">Ingresos Generados por tu Trabajo</h3>
          <p className="text-xs text-zinc-400 max-w-md font-medium">
            Tus servicios han facturado un total de <strong>{formatCOP(thisMonth.revenueEstimated)}</strong> este mes. Tu comisión estimada acumulada es de <strong>{formatCOP(thisMonth.commissionEstimated)}</strong>.
          </p>
        </div>

        <div className="text-center sm:text-right shrink-0 bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Comisión Estimada</span>
          <span className="text-3xl font-black text-amber-400">{formatCOP(thisMonth.commissionEstimated)}</span>
        </div>
      </div>
    </div>
  )
}
