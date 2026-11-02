'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Download, Calendar, TrendingUp, TrendingDown,
  DollarSign, Users, Scissors, CheckCircle2,
  Receipt, RefreshCw, Search, Clock, BarChart3,
  PieChart, UserCheck, UserPlus, AlertTriangle,
  FileSpreadsheet, Sparkles, Ban
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyMetric {
  date: string
  dayLabel: string
  appointmentsCount: number
  completedCount: number
  revenue: number
  expenses: number
  profit: number
  cashRevenue: number
  digitalRevenue: number
}

interface BarberStat {
  id: string
  name: string
  commissionRate: number
  totalAppointments: number
  completedAppointments: number
  clientsCount: number
  revenue: number
  commission: number
  shopShare: number
  avgTicket: number
}

interface ServiceStat {
  id: string
  name: string
  category: string
  price: number
  count: number
  revenue: number
}

interface HourlyMetric {
  hourLabel: string
  count: number
  completedCount: number
}

interface DayOfWeekMetric {
  dayName: string
  count: number
  completedCount: number
  revenue: number
}

interface ReportsData {
  range: { from: string; to: string }
  summary: {
    totalRevenue: number
    totalExpenses: number
    totalCommissions: number
    netProfit: number
    grossMargin: number
    totalAppointments: number
    completedAppointments: number
    uniqueClients: number
    avgTicket: number
  }
  dailyMetrics: DailyMetric[]
  barberStats: BarberStat[]
  serviceStats: ServiceStat[]
  hourlyDistribution: HourlyMetric[]
  dayOfWeekDistribution: DayOfWeekMetric[]
  cancellationStats: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    cancellationRate: number
  }
  clientAnalytics: {
    totalUnique: number
    newClients: number
    recurringClients: number
  }
  byMethod: { CASH: number; TRANSFER: number; CARD: number; OTHER: number }
}

type DatePreset = 'TODAY' | 'YESTERDAY' | 'EXACT_DAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'
type ReportTab = 'barbers' | 'services' | 'peak_hours' | 'clients' | 'payments' | 'cancellations' | 'trends'

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia / Nequi', CARD: 'Tarjeta', OTHER: 'Otro'
}

function getReportDateRange(preset: DatePreset, exactDay: string, customFrom: string, customTo: string): { from: string; to: string; label: string } {
  const now = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()

  switch (preset) {
    case 'TODAY': {
      const start = new Date(todayY, todayM, todayD, 0, 0, 0)
      const end = new Date(todayY, todayM, todayD, 23, 59, 59)
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Hoy (${start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })})`
      }
    }
    case 'YESTERDAY': {
      const start = new Date(todayY, todayM, todayD - 1, 0, 0, 0)
      const end = new Date(todayY, todayM, todayD - 1, 23, 59, 59)
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Ayer (${start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })})`
      }
    }
    case 'EXACT_DAY': {
      const parts = exactDay.split('-')
      const y = parseInt(parts[0], 10) || todayY
      const m = (parseInt(parts[1], 10) || (todayM + 1)) - 1
      const d = parseInt(parts[2], 10) || todayD
      const start = new Date(y, m, d, 0, 0, 0)
      const end = new Date(y, m, d, 23, 59, 59)
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Día: ${start.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
      }
    }
    case 'THIS_WEEK': {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Esta Semana (${start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })})`
      }
    }
    case 'THIS_MONTH': {
      const start = new Date(todayY, todayM, 1, 0, 0, 0)
      const end = new Date(todayY, todayM + 1, 0, 23, 59, 59)
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Este Mes (${start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })})`
      }
    }
    case 'LAST_MONTH': {
      const start = new Date(todayY, todayM - 1, 1, 0, 0, 0)
      const end = new Date(todayY, todayM, 0, 23, 59, 59)
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Mes Anterior (${start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })})`
      }
    }
    case 'THIS_YEAR': {
      const start = new Date(todayY, 0, 1, 0, 0, 0)
      const end = new Date(todayY, 11, 31, 23, 59, 59)
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Año ${todayY}`
      }
    }
    case 'CUSTOM': {
      const start = customFrom ? new Date(`${customFrom}T00:00:00`) : new Date(todayY, todayM, 1)
      const end = customTo ? new Date(`${customTo}T23:59:59`) : new Date()
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `${start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`
      }
    }
  }
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportsData | null>(null)

  // Active Tab
  const [tab, setTab] = useState<ReportTab>('barbers')

  // Date selection states
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAY')
  const [exactDay, setExactDay] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [customTo, setCustomTo] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  // Table filters
  const [searchQuery, setSearchQuery] = useState('')

  const activeRange = useMemo(() => getReportDateRange(datePreset, exactDay, customFrom, customTo), [datePreset, exactDay, customFrom, customTo])

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/reports?from=${encodeURIComponent(activeRange.from)}&to=${encodeURIComponent(activeRange.to)}`
      const res = await fetch(url)
      if (res.ok) {
        setData(await res.json())
      } else {
        toast.error('Error al cargar inteligencia de negocios')
      }
    } catch {
      toast.error('Error de conexión al consultar reportes')
    } finally {
      setLoading(false)
    }
  }, [activeRange])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  // CSV Exporter Helper
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Reporte ${filename}.csv generado con éxito`)
  }

  const exportBarbersCSV = () => {
    if (!data?.barberStats) return
    const headers = ['Barbero', 'Citas Totales', 'Citas Completadas', 'Clientes Atendidos', 'Facturacion Total', 'Comision %', 'Monto Comision', 'Margen Barberia', 'Ticket Promedio']
    const rows = data.barberStats.map(b => [
      b.name, b.totalAppointments, b.completedAppointments, b.clientsCount,
      b.revenue, `${b.commissionRate}%`, b.commission, b.shopShare, Math.round(b.avgTicket)
    ])
    downloadCSV('Reporte_Rendimiento_Barberos', headers, rows)
  }

  const exportServicesCSV = () => {
    if (!data?.serviceStats) return
    const headers = ['Servicio', 'Categoria', 'Precio Unitario', 'Servicios Realizados', 'Facturacion Generada']
    const rows = data.serviceStats.map(s => [
      s.name, s.category, s.price, s.count, s.revenue
    ])
    downloadCSV('Reporte_Analisis_Servicios', headers, rows)
  }

  const exportTrendsCSV = () => {
    if (!data?.dailyMetrics) return
    const headers = ['Fecha', 'Dia', 'Citas Agendadas', 'Citas Completadas', 'Ingresos Cobrados', 'Gastos Operativos', 'Utilidad Diaria']
    const rows = data.dailyMetrics.map(d => [
      d.date, d.dayLabel, d.appointmentsCount, d.completedCount, d.revenue, d.expenses, d.profit
    ])
    downloadCSV('Reporte_Tendencia_Diaria', headers, rows)
  }

  // Calculated totals & Max values for visual charts
  const maxHourlyCount = useMemo(() => {
    if (!data?.hourlyDistribution) return 1
    return Math.max(...data.hourlyDistribution.map(h => h.count), 1)
  }, [data?.hourlyDistribution])

  const maxDayOfWeekCount = useMemo(() => {
    if (!data?.dayOfWeekDistribution) return 1
    return Math.max(...data.dayOfWeekDistribution.map(d => d.count), 1)
  }, [data?.dayOfWeekDistribution])

  const totalRevenueAll = data?.summary.totalRevenue || 0

  const filteredBarbers = useMemo(() => {
    if (!data?.barberStats) return []
    return data.barberStats.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [data?.barberStats, searchQuery])

  const filteredServices = useMemo(() => {
    if (!data?.serviceStats) return []
    return data.serviceStats.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [data?.serviceStats, searchQuery])

  const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'barbers',       label: 'Rendimiento Barberos', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'services',      label: 'Análisis Servicios',    icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'peak_hours',    label: 'Horas Pico & Días',     icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'clients',       label: 'Clientes & Retención',  icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'payments',      label: 'Métodos de Pago',       icon: <PieChart className="w-3.5 h-3.5" /> },
    { id: 'cancellations', label: 'Cancelaciones & Loss',  icon: <Ban className="w-3.5 h-3.5" /> },
    { id: 'trends',        label: 'Tendencia Diaria',      icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* ════════════════════════════════════════
          HEADER & STRATEGIC TOOLBAR
      ════════════════════════════════════════ */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-black text-white rounded-2xl">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-zinc-950 uppercase tracking-tight">Centro de Inteligencia de Negocio</h1>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Análisis analítico estratégico para toma de decisiones — Período: <strong className="text-zinc-900">{activeRange.label}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportBarbersCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={fetchReportsData}
              title="Refrescar datos"
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Date Presets */}
        <div className="pt-3 border-t border-zinc-100 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase text-zinc-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Período:
          </span>
          {[
            { id: 'TODAY', label: 'Hoy' },
            { id: 'YESTERDAY', label: 'Ayer' },
            { id: 'THIS_WEEK', label: 'Esta Semana' },
            { id: 'THIS_MONTH', label: 'Este Mes' },
            { id: 'LAST_MONTH', label: 'Mes Pasado' },
            { id: 'THIS_YEAR', label: 'Año' },
            { id: 'CUSTOM', label: 'Personalizado' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDatePreset(p.id as DatePreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === p.id
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {datePreset === 'CUSTOM' && (
          <div className="pt-2 flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl text-xs border border-zinc-200/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-600">Desde:</span>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="px-2.5 py-1 border border-zinc-200 rounded-lg font-bold text-zinc-950 bg-white outline-none focus:border-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-600">Hasta:</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="px-2.5 py-1 border border-zinc-200 rounded-lg font-bold text-zinc-950 bg-white outline-none focus:border-black"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── TABS DE ANÁLISIS ESTRATÉGICO ────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-white shadow-xs text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
          <span className="text-sm text-zinc-400 font-medium">Analizando datos estratégicos para {activeRange.label}...</span>
        </div>
      ) : (

      <>
      {/* ════════════════════════════════════════
          TAB 1 — BARBEROS (PRODUCCIÓN & COMISIONES)
      ════════════════════════════════════════ */}
      {tab === 'barbers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs">
            <div>
              <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight">Ranking de Producción por Barbero</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Calculado estrictamente sobre servicios cobrados (`PAID`)</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar barbero..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <th className="px-5 py-4">Barbero</th>
                    <th className="px-5 py-4">Citas Atendidas</th>
                    <th className="px-5 py-4">Clientes Únicos</th>
                    <th className="px-5 py-4">Facturación Total</th>
                    <th className="px-5 py-4">Participación</th>
                    <th className="px-5 py-4">Comisión Barbero</th>
                    <th className="px-5 py-4">Margen Barbería</th>
                    <th className="px-5 py-4">Ticket Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-bold">
                  {filteredBarbers.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-zinc-400">Sin datos de barberos en este período.</td></tr>
                  ) : filteredBarbers.map((b, idx) => {
                    const sharePct = totalRevenueAll > 0 ? Math.round((b.revenue / totalRevenueAll) * 100) : 0
                    return (
                      <tr key={b.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-4 flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                            idx === 0 ? 'bg-amber-500 text-zinc-950 shadow-sm' :
                            idx === 1 ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' :
                            idx === 2 ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                            'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-black text-zinc-950 uppercase">{b.name}</span>
                        </td>
                        <td className="px-5 py-4 text-zinc-700">{b.completedAppointments} servicios</td>
                        <td className="px-5 py-4 text-zinc-600">{b.clientsCount} clientes</td>
                        <td className="px-5 py-4 text-sm font-black text-emerald-600">{formatCOP(b.revenue)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-zinc-100 rounded-full h-1.5">
                              <div className="bg-zinc-950 h-1.5 rounded-full" style={{ width: `${sharePct}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500">{sharePct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-amber-700 font-black">
                          {formatCOP(b.commission)} <span className="text-[10px] text-zinc-400 font-normal">({b.commissionRate}%)</span>
                        </td>
                        <td className="px-5 py-4 text-zinc-900 font-black">{formatCOP(b.shopShare)}</td>
                        <td className="px-5 py-4 text-zinc-600 font-bold">{formatCOP(b.avgTicket)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 2 — SERVICIOS (DEMANDA Y RECAUDACIÓN)
      ════════════════════════════════════════ */}
      {tab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs">
            <div>
              <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight">Análisis de Servicios Vendidos</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Servicios con mayor rotación e ingresos generados</p>
            </div>
            <button
              onClick={exportServicesCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <th className="px-5 py-4">Servicio</th>
                    <th className="px-5 py-4">Categoría</th>
                    <th className="px-5 py-4">Precio Unitario</th>
                    <th className="px-5 py-4">Cantidad Realizada</th>
                    <th className="px-5 py-4">Total Recaudado</th>
                    <th className="px-5 py-4">Participación %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-bold">
                  {filteredServices.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-400">Sin datos de servicios en este período.</td></tr>
                  ) : filteredServices.map(s => {
                    const pct = totalRevenueAll > 0 ? Math.round((s.revenue / totalRevenueAll) * 100) : 0
                    return (
                      <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-4 text-zinc-950 font-black uppercase flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-zinc-400" />
                          {s.name}
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                            {s.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-600">{formatCOP(s.price)}</td>
                        <td className="px-5 py-4 text-zinc-950 font-black">{s.count} reservas</td>
                        <td className="px-5 py-4 text-emerald-600 font-black text-sm">{formatCOP(s.revenue)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-zinc-100 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 3 — HORAS PICO & DÍAS FUERTES
      ════════════════════════════════════════ */}
      {tab === 'peak_hours' && (
        <div className="space-y-6">
          {/* Horas Pico Chart */}
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-700" /> Ocupación por Franja Horaria (Horas Pico)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Identifica las horas de mayor demanda para optimizar la agenda de tu equipo</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
              {data?.hourlyDistribution.map(h => {
                const heightPct = Math.round((h.count / maxHourlyCount) * 100)
                return (
                  <div key={h.hourLabel} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 flex flex-col items-center justify-between text-center min-h-[140px]">
                    <span className="text-[10px] font-black text-zinc-400 uppercase">{h.hourLabel}</span>
                    <div className="w-full flex-1 flex items-end justify-center my-2">
                      <div
                        className="w-full bg-zinc-900 rounded-t-lg transition-all duration-300 min-h-[4px]"
                        style={{ height: `${Math.max(heightPct, 5)}%` }}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-black text-zinc-950">{h.count}</span>
                      <span className="text-[9px] text-zinc-400 block font-medium">citas</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Días Fuertes Chart */}
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-700" /> Demanda por Día de la Semana (Días Fuertes)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Identifica cuáles días generan el mayor flujo de clientes y facturación</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-2">
              {data?.dayOfWeekDistribution.map(d => {
                const heightPct = Math.round((d.count / maxDayOfWeekCount) * 100)
                return (
                  <div key={d.dayName} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-zinc-950 uppercase">{d.dayName}</span>
                      <span className="text-xs font-black text-zinc-500">{d.count} citas</span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${Math.max(heightPct, 5)}%` }} />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 uppercase block font-bold">Recaudado</span>
                      <span className="text-sm font-black text-emerald-600">{formatCOP(d.revenue)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 4 — CLIENTES & RETENCIÓN
      ════════════════════════════════════════ */}
      {tab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-2">
              <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-700 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Clientes Únicos Atendidos</span>
              <p className="text-3xl font-black text-zinc-950">{data?.clientAnalytics.totalUnique}</p>
              <p className="text-xs text-zinc-400">Clientes atendidos en {activeRange.label}</p>
            </div>

            <div className="bg-white border border-emerald-200/80 bg-emerald-50/20 rounded-3xl p-6 shadow-xs space-y-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 mb-3">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Nuevos Clientes</span>
              <p className="text-3xl font-black text-emerald-800">{data?.clientAnalytics.newClients}</p>
              <p className="text-xs text-emerald-700 font-medium">Registrados durante el período seleccionado</p>
            </div>

            <div className="bg-white border border-blue-200/80 bg-blue-50/20 rounded-3xl p-6 shadow-xs space-y-2">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 mb-3">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Clientes Recurrentes</span>
              <p className="text-3xl font-black text-blue-900">{data?.clientAnalytics.recurringClients}</p>
              <p className="text-xs text-blue-700 font-medium">Clientes con 2 o más citas completadas</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 5 — MÉTODOS DE PAGO
      ════════════════════════════════════════ */}
      {tab === 'payments' && (
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight flex items-center gap-2">
              <PieChart className="w-4 h-4 text-zinc-700" /> Distribución de Ingresos por Método de Pago
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Desglose porcentual entre efectivo y medios digitales</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['CASH', 'TRANSFER', 'CARD', 'OTHER'] as const).map(m => {
              const amount = data?.byMethod[m] || 0
              const pct = totalRevenueAll > 0 ? Math.round((amount / totalRevenueAll) * 100) : 0
              return (
                <div key={m} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">{METHOD_LABELS[m]}</span>
                  <p className="text-2xl font-black text-zinc-950">{formatCOP(amount)}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-200 rounded-full h-2">
                      <div className="bg-zinc-900 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-black text-zinc-600">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 6 — CANCELACIONES & LOSS
      ════════════════════════════════════════ */}
      {tab === 'cancellations' && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Tasa de Pérdida / Cancelación</p>
                <p className="text-3xl font-black text-red-900">{data?.cancellationStats.cancellationRate}%</p>
              </div>
            </div>
            <div className="text-xs text-red-800 font-bold bg-white/70 px-4 py-2 rounded-xl border border-red-200">
              {data?.cancellationStats.cancelled} canceladas · {data?.cancellationStats.noShow} no asistieron
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs">
              <span className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Citas Completadas</span>
              <p className="text-2xl font-black text-emerald-600">{data?.cancellationStats.completed}</p>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs">
              <span className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Citas Canceladas</span>
              <p className="text-2xl font-black text-red-600">{data?.cancellationStats.cancelled}</p>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs">
              <span className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Clientes No Asistieron (No-Show)</span>
              <p className="text-2xl font-black text-amber-600">{data?.cancellationStats.noShow}</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 7 — TENDENCIA DIARIA
      ════════════════════════════════════════ */}
      {tab === 'trends' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs">
            <div>
              <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight">Tendencia y Desglose Diarios</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Producción día a día en {activeRange.label}</p>
            </div>
            <button
              onClick={exportTrendsCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-5 py-4">Día</th>
                    <th className="px-5 py-4">Citas Agendadas</th>
                    <th className="px-5 py-4">Citas Completadas</th>
                    <th className="px-5 py-4">Ingresos Cobrados</th>
                    <th className="px-5 py-4">Gastos</th>
                    <th className="px-5 py-4">Utilidad Diaria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-bold">
                  {data?.dailyMetrics.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-zinc-400">Sin datos de tendencia en este período.</td></tr>
                  ) : data?.dailyMetrics.map(d => (
                    <tr key={d.date} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-4 text-zinc-500 font-mono text-xs">{d.date}</td>
                      <td className="px-5 py-4 text-zinc-950 font-black uppercase">{d.dayLabel}</td>
                      <td className="px-5 py-4 text-zinc-700">{d.appointmentsCount} citas</td>
                      <td className="px-5 py-4 text-zinc-700">{d.completedCount} completadas</td>
                      <td className="px-5 py-4 text-emerald-600 font-black">{formatCOP(d.revenue)}</td>
                      <td className="px-5 py-4 text-red-500 font-black">{formatCOP(d.expenses)}</td>
                      <td className={`px-5 py-4 font-black ${d.profit >= 0 ? 'text-zinc-950' : 'text-red-600'}`}>
                        {formatCOP(d.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      </>
      )}
    </div>
  )
}
