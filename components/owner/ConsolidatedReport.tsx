'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Building2, TrendingUp, DollarSign, Calendar,
  Users, CheckCircle2, RefreshCw, ArrowUpRight,
  Loader2, Store, Ban
} from 'lucide-react'

interface BranchStat {
  branchId: string
  branchName: string
  branchSlug: string
  isMainBranch: boolean
  status: string
  revenue: number
  expenses: number
  commissions: number
  profit: number
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  completionRate: number
  revenueShare: number
  clients: number
}

interface ConsolidatedSummary {
  totalRevenue: number
  totalExpenses: number
  totalCommissions: number
  netProfit: number
  grossMargin: number
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  completionRate: number
  totalClients: number
  branchCount: number
}

interface ConsolidatedData {
  range: { from: string; to: string }
  summary: ConsolidatedSummary
  branchStats: BranchStat[]
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

type Preset = 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'

function getRange(preset: Preset, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date()
  if (preset === 'THIS_MONTH') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }
  }
  if (preset === 'LAST_MONTH') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    }
  }
  if (preset === 'THIS_YEAR') {
    return {
      from: new Date(now.getFullYear(), 0, 1, 0, 0, 0),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    }
  }
  // CUSTOM
  const f = customFrom ? new Date(customFrom + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1)
  const t = customTo ? new Date(customTo + 'T23:59:59') : new Date()
  return { from: f, to: t }
}

export default function ConsolidatedReport() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConsolidatedData | null>(null)
  const [preset, setPreset] = useState<Preset>('THIS_MONTH')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const fetchReport = useCallback(async () => {
    const { from, to } = getRange(preset, customFrom, customTo)
    try {
      setLoading(true)
      const url = `/api/owner/reports/consolidated?from=${from.toISOString()}&to=${to.toISOString()}`
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Error al cargar reporte consolidado')
        return
      }
      setData(await res.json())
    } catch {
      toast.error('Error de conexión al cargar reporte consolidado')
    } finally {
      setLoading(false)
    }
  }, [preset, customFrom, customTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const summary = data?.summary
  const branchStats = data?.branchStats || []

  return (
    <div className="space-y-6">
      {/* Controles de fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {(['THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'CUSTOM'] as Preset[]).map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                preset === p
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {p === 'THIS_MONTH' ? 'Este mes' : p === 'LAST_MONTH' ? 'Mes anterior' : p === 'THIS_YEAR' ? 'Este año' : 'Personalizado'}
            </button>
          ))}
        </div>

        {preset === 'CUSTOM' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white"
            />
            <span className="text-xs text-zinc-400">—</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none text-zinc-900 dark:text-white"
            />
            <button
              onClick={fetchReport}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold"
            >
              Aplicar
            </button>
          </div>
        )}

        <button
          onClick={fetchReport}
          disabled={loading}
          className="ml-auto p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors disabled:opacity-50"
          title="Refrescar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
        </div>
      )}

      {!loading && summary && (
        <>
          {/* KPIs consolidados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Ingresos Totales',
                value: formatCOP(summary.totalRevenue),
                icon: DollarSign,
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-950/40'
              },
              {
                label: 'Rentabilidad Neta',
                value: formatCOP(summary.netProfit),
                icon: TrendingUp,
                color: summary.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400',
                bg: summary.netProfit >= 0 ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-rose-50 dark:bg-rose-950/40'
              },
              {
                label: 'Citas Completadas',
                value: `${summary.completedAppointments} / ${summary.totalAppointments}`,
                icon: CheckCircle2,
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-950/40',
                sub: `${summary.completionRate}% tasa de completado`
              },
              {
                label: 'Clientes Totales',
                value: summary.totalClients.toLocaleString('es-CO'),
                icon: Users,
                color: 'text-violet-600 dark:text-violet-400',
                bg: 'bg-violet-50 dark:bg-violet-950/40',
                sub: `${summary.branchCount} sedes activas`
              }
            ].map(kpi => (
              <div key={kpi.label} className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{kpi.label}</span>
                  <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                  </div>
                </div>
                <div className="text-xl font-black text-zinc-900 dark:text-white">{kpi.value}</div>
                {kpi.sub && <div className="text-[11px] text-zinc-400 mt-0.5">{kpi.sub}</div>}
              </div>
            ))}
          </div>

          {/* Tabla breakdown por sede */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Desglose por Sede</h3>
            </div>

            {branchStats.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-400">No hay datos en el período seleccionado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40">
                      <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-wider text-zinc-400">Sede</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-zinc-400">Ingresos</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-zinc-400">Gastos</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-zinc-400">Rentabilidad</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-zinc-400">Citas</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-zinc-400">% Completado</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-zinc-400">% Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchStats.map((stat, i) => (
                      <tr
                        key={stat.branchId}
                        className={`border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${
                          i === branchStats.length - 1 ? 'border-0' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Store className={`w-3.5 h-3.5 shrink-0 ${stat.status === 'ACTIVE' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-white">{stat.branchName}</span>
                              {stat.isMainBranch && (
                                <span className="ml-1.5 text-[9px] font-black uppercase text-amber-500">Principal</span>
                              )}
                              {stat.status !== 'ACTIVE' && (
                                <span className="ml-1.5 text-[9px] font-black uppercase text-zinc-400 flex items-center gap-0.5">
                                  <Ban className="w-2.5 h-2.5" /> {stat.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCOP(stat.revenue)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-600 dark:text-zinc-400">
                          {formatCOP(stat.expenses)}
                        </td>
                        <td className={`px-4 py-3.5 text-right font-bold ${stat.profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCOP(stat.profit)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-700 dark:text-zinc-300">
                          {stat.completedAppointments}/{stat.totalAppointments}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-bold ${stat.completionRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : stat.completionRate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {stat.completionRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${stat.revenueShare}%` }}
                              />
                            </div>
                            <span className="font-bold text-zinc-700 dark:text-zinc-300 w-8 text-right">{stat.revenueShare}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Fila de totales */}
                  <tfoot className="bg-zinc-50 dark:bg-zinc-900/60 border-t-2 border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="font-black text-zinc-900 dark:text-white text-[11px] uppercase tracking-wider">
                            Total Corporativo
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatCOP(summary.totalRevenue)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-zinc-700 dark:text-zinc-300">
                        {formatCOP(summary.totalExpenses)}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-black ${summary.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCOP(summary.netProfit)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-zinc-700 dark:text-zinc-300">
                        {summary.completedAppointments}/{summary.totalAppointments}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-black text-zinc-700 dark:text-zinc-300">{summary.completionRate}%</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-black text-zinc-700 dark:text-zinc-300">100%</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Métricas secundarias */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Margen Bruto</div>
              <div className="text-xl font-black text-zinc-900 dark:text-white">{summary.grossMargin}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Total Gastos</div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400">{formatCOP(summary.totalExpenses)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Comisiones Equipo</div>
              <div className="text-xl font-black text-zinc-700 dark:text-zinc-300">{formatCOP(summary.totalCommissions)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Citas Canceladas</div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">{summary.cancelledAppointments}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

