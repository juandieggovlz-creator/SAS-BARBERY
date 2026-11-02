'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle,
  Plus, Trash2, CheckCircle2, X, ChevronDown,
  DollarSign, BarChart3, Receipt, Users, RefreshCw, Calendar,
  Percent, Sliders, Calculator, Sparkles, Search, Filter,
  ArrowUpRight, ArrowDownRight, CreditCard, Building2
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PeriodStats { revenue: number; expenses: number; profit: number }

interface BarberPerf {
  id: string; name: string; servicesCount: number; clientsCount: number
  revenue: number; commission: number; commissionRate: number; avgTicket: number
}

interface PendingAppt {
  id: string; paymentId?: string; paymentCode?: string; reservationCode?: string; date: string; status: string; paymentStatus?: string
  clientName: string; serviceName: string; servicePrice: number; barberName: string
}

interface Payment {
  id: string; paymentCode?: string; amount: number; method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER'
  status?: string; paidAt?: string; createdAt: string; notes?: string
  appointment?: { reservationCode?: string; client?: { name: string }; service?: { name: string }; barber?: { name: string } }
}

interface Expense {
  id: string; concept: string; category: string; amount: number
  date: string; paymentMethod: string; description?: string
}

interface FinanceData {
  summary: {
    totalRevenue: number; totalExpenses: number; grossMargin: number
    totalCommissions: number; netProfit: number; totalPending: number; availableToday: number
  }
  periods: { today: PeriodStats; week: PeriodStats; month: PeriodStats }
  byMethod: { CASH: number; TRANSFER: number; CARD: number; OTHER: number }
  expensesByMethod?: { CASH: number; TRANSFER: number; CARD: number; OTHER: number }
  payments: Payment[]
  expenses: Expense[]
  pendingAppointments: PendingAppt[]
  barberPerformance: BarberPerf[]
}

type DatePreset = 'TODAY' | 'YESTERDAY' | 'EXACT_DAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'
type Tab = 'control' | 'pending' | 'movements' | 'expenses' | 'commissions' | 'closure'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

const CATEGORY_LABELS: Record<string, string> = {
  RENT: 'Arriendo', UTILITIES: 'Servicios Públicos', SUPPLIES: 'Productos & Insumos',
  SALARIES: 'Salarios & Nómina', COMMISSIONS: 'Comisiones', MARKETING: 'Publicidad & Marketing',
  MAINTENANCE: 'Mantenimiento', EQUIPMENT: 'Equipos & Herramientas', OTHER: 'Otros Gastos'
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia / Nequi', CARD: 'Tarjeta', OTHER: 'Otro'
}

// Helper to compute ISO dates from presets
function getDateRange(preset: DatePreset, exactDay?: string, customFrom?: string, customTo?: string): { from: string; to: string; label: string } {
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
      const parts = (exactDay || '').split('-')
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color = 'zinc', formula }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  color?: 'zinc' | 'green' | 'red' | 'amber' | 'blue'
  formula?: string
}) {
  const colors = {
    zinc:  'text-zinc-950',
    green: 'text-emerald-600',
    red:   'text-red-600',
    amber: 'text-amber-600',
    blue:  'text-blue-600',
  }
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500">
          {icon}
        </div>
        {formula && (
          <span className="text-[9px] text-zinc-400 font-mono bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100">
            {formula}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
        <p className={`text-2xl font-black ${colors[color]}`}>{value}</p>
        <p className="text-[11px] text-zinc-400 mt-1">{sub}</p>
      </div>
    </div>
  )
}

function PeriodCard({ label, stats }: { label: string; stats: PeriodStats }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">{label}</p>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Ingresos
          </span>
          <span className="text-sm font-black text-emerald-600">{formatCOP(stats.revenue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Gastos
          </span>
          <span className="text-sm font-black text-red-500">{formatCOP(stats.expenses)}</span>
        </div>
        <div className="h-px bg-zinc-100" />
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-zinc-700">Utilidad</span>
          <span className={`text-sm font-black ${stats.profit >= 0 ? 'text-zinc-950' : 'text-red-600'}`}>
            {formatCOP(stats.profit)}
          </span>
        </div>
        {stats.revenue > 0 && (
          <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, (stats.profit / stats.revenue) * 100))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CashCloseHistory Component ──────────────────────────────────────────────

interface CashCloseRecord {
  id: string
  closedAt: string
  periodLabel: string
  totalReceived: number
  totalCash: number
  totalTransfer: number
  totalCard: number
  cashExpected: number
  cashCounted: number
  cashDifference: number
  pendingTotal: number
  pendingCount: number
  differenceReason?: string | null
  observations?: string | null
}

function CashCloseHistory() {
  const [closures, setClosures] = useState<CashCloseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CashCloseRecord | null>(null)

  useEffect(() => {
    fetch('/api/finances/cash-close?limit=10')
      .then(r => r.json())
      .then(d => { if (d.closures) setClosures(d.closures) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
        <div className="h-4 bg-zinc-100 rounded-lg animate-pulse w-1/2 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-zinc-50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-zinc-950">Historial de Cierres</h3>
        <span className="text-[10px] text-zinc-400 font-bold bg-zinc-50 px-2 py-1 rounded-lg">Guardados en BD</span>
      </div>

      {closures.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-6">
          Aún no hay cierres registrados.<br />El primer cierre que guardes aparecerá aquí.
        </p>
      ) : (
        <div className="space-y-2">
          {closures.map(c => {
            const diff = Number(c.cashDifference)
            const diffColor = diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="w-full text-left p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-900">{c.periodLabel}</span>
                  <span className={`text-xs font-black ${diffColor}`}>
                    {diff >= 0 ? '+' : ''}{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(diff)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">
                    {new Date(c.closedAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(c.totalReceived))} recibido
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detalle modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-black text-zinc-950">Cierre: {selected.periodLabel}</h3>
                <p className="text-xs text-zinc-400">{new Date(selected.closedAt).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs font-bold">
              <div className="flex justify-between py-1.5 border-b border-zinc-50"><span className="text-zinc-500">Total Recibido</span><span className="text-emerald-700">{formatCOP(Number(selected.totalReceived))}</span></div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50"><span className="text-zinc-500">Efectivo</span><span>{formatCOP(Number(selected.totalCash))}</span></div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50"><span className="text-zinc-500">Transferencias</span><span>{formatCOP(Number(selected.totalTransfer))}</span></div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50"><span className="text-zinc-500">Tarjeta</span><span>{formatCOP(Number(selected.totalCard))}</span></div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50"><span className="text-zinc-500">Efectivo esperado en gaveta</span><span>{formatCOP(Number(selected.cashExpected))}</span></div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50"><span className="text-zinc-500">Efectivo contado</span><span>{formatCOP(Number(selected.cashCounted))}</span></div>
              <div className={`flex justify-between py-1.5 border-b border-zinc-50 ${Number(selected.cashDifference) === 0 ? 'text-emerald-600' : Number(selected.cashDifference) > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                <span>Diferencia de caja</span>
                <span>{Number(selected.cashDifference) >= 0 ? '+' : ''}{formatCOP(Number(selected.cashDifference))}</span>
              </div>
              {selected.pendingCount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-zinc-50 text-amber-700"><span>Pendiente por cobrar</span><span>{formatCOP(Number(selected.pendingTotal))} ({selected.pendingCount} servicios)</span></div>
              )}
              {selected.differenceReason && (
                <div className="flex justify-between py-1.5 border-b border-zinc-50"><span className="text-zinc-500">Motivo diferencia</span><span className="text-zinc-700 capitalize">{selected.differenceReason.replace(/_/g, ' ')}</span></div>
              )}
              {selected.observations && (
                <div className="pt-2">
                  <p className="text-zinc-500 mb-1">Observaciones:</p>
                  <p className="text-zinc-700 bg-zinc-50 rounded-xl p-3 leading-relaxed">{selected.observations}</p>
                </div>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="w-full py-3 rounded-xl bg-zinc-950 text-white text-sm font-bold hover:bg-zinc-800">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FinancesPage() {
  const [tab, setTab] = useState<Tab>('control')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FinanceData | null>(null)

  // Global Date Filters
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

  // Tab-specific filters: Gastos
  const [expenseSearch, setExpenseSearch] = useState('')
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL')
  const [expenseMethodFilter, setExpenseMethodFilter] = useState('ALL')

  // Tab-specific filters: Movimientos
  const [movementSearch, setMovementSearch] = useState('')
  const [movementMethodFilter, setMovementMethodFilter] = useState('ALL')
  const [movementBarberFilter, setMovementBarberFilter] = useState('ALL')

  // Tab-specific filters: Pendientes
  const [pendingSearch, setPendingSearch] = useState('')
  const [pendingBarberFilter, setPendingBarberFilter] = useState('ALL')

  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    concept: '', category: 'SUPPLIES', amount: '', paymentMethod: 'CASH', description: ''
  })
  const [savingExpense, setSavingExpense] = useState(false)

  // Pending payment modal
  const [payingAppt, setPayingAppt] = useState<PendingAppt | null>(null)
  const [payMethod, setPayMethod] = useState<'CASH' | 'TRANSFER' | 'CARD' | 'OTHER'>('CASH')

  // Cierre de caja
  const [cashCounted, setCashCounted] = useState('')
  const [closureObs, setClosureObs] = useState('')
  const [diffReason, setDiffReason] = useState('')
  const [showClosureConfirm, setShowClosureConfirm] = useState(false)
  const [savingClosure, setSavingClosure] = useState(false)

  // Commissions modal & live simulator state
  const [editingBarber, setEditingBarber] = useState<BarberPerf | null>(null)
  const [tempCommissionRate, setTempCommissionRate] = useState<number>(40)
  const [savingCommission, setSavingCommission] = useState(false)

  // Interactive Live Simulator in Comisiones tab
  const [simAmount, setSimAmount] = useState<number>(100000)
  const [simRate, setSimRate] = useState<number>(40)

  // Fetch summary based on active date range
  const currentRange = useMemo(() => getDateRange(datePreset, exactDay, customFrom, customTo), [datePreset, exactDay, customFrom, customTo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/finances/summary?from=${encodeURIComponent(currentRange.from)}&to=${encodeURIComponent(currentRange.to)}`
      const res = await fetch(url)
      if (res.ok) {
        setData(await res.json())
      } else {
        toast.error('Error al cargar datos financieros')
      }
    } catch {
      toast.error('Error de red al consultar finanzas')
    } finally {
      setLoading(false)
    }
  }, [currentRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseForm.concept || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast.warning('Ingresa concepto y monto válido'); return
    }
    setSavingExpense(true)
    try {
      const res = await fetch('/api/finances/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      })
      if (res.ok) {
        toast.success('Gasto registrado con éxito')
        setShowExpenseModal(false)
        setExpenseForm({ concept: '', category: 'SUPPLIES', amount: '', paymentMethod: 'CASH', description: '' })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al guardar gasto')
      }
    } catch { toast.error('Error al guardar gasto') }
    finally { setSavingExpense(false) }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    const res = await fetch(`/api/finances/expenses?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Gasto eliminado'); fetchData() }
    else toast.error('Error al eliminar')
  }

  const handleMarkPaid = async () => {
    if (!payingAppt) return
    const res = await fetch('/api/finances/pending', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: payingAppt.id, paymentMethod: payMethod })
    })
    if (res.ok) {
      toast.success(`Pago registrado — ${METHOD_LABELS[payMethod]}`)
      setPayingAppt(null)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Error al registrar pago')
    }
  }

  const handleUpdateCommission = async () => {
    if (!editingBarber) return
    setSavingCommission(true)
    try {
      const res = await fetch(`/api/barbers/${editingBarber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission: tempCommissionRate })
      })
      if (res.ok) {
        toast.success(`Comisión de ${editingBarber.name} actualizada al ${tempCommissionRate}%`)
        setEditingBarber(null)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al actualizar comisión')
      }
    } catch {
      toast.error('Error de red al actualizar comisión')
    } finally {
      setSavingCommission(false)
    }
  }

  const handleSaveClosure = async () => {
    setSavingClosure(true)
    try {
      const res = await fetch('/api/finances/cash-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodFrom: currentRange.from,
          periodTo: currentRange.to,
          periodLabel: currentRange.label,
          totalCash: cashCollected,
          totalTransfer: transferCollected,
          totalCard: cardCollected,
          totalOther: otherCollected,
          totalReceived: data?.summary.totalRevenue || 0,
          expensesCash: cashExpenses,
          expensesDigital: digitalExpenses,
          totalExpenses: data?.summary.totalExpenses || 0,
          cashExpected: netExpectedCashInDrawer,
          cashCounted: Number(cashCounted) || 0,
          cashDifference: cashDiff,
          pendingTotal: s?.totalPending || 0,
          pendingCount: data?.pendingAppointments.length || 0,
          differenceReason: diffReason || null,
          observations: closureObs || null
        })
      })
      if (res.ok) {
        toast.success('✅ Cierre de caja guardado en la base de datos')
        setShowClosureConfirm(false)
        setCashCounted('')
        setClosureObs('')
        setDiffReason('')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al guardar el cierre')
      }
    } catch {
      toast.error('Error de red al guardar el cierre')
    } finally {
      setSavingClosure(false)
    }
  }

  // Filtered lists
  const filteredExpenses = useMemo(() => {
    if (!data?.expenses) return []
    return data.expenses.filter(e => {
      const matchSearch = e.concept.toLowerCase().includes(expenseSearch.toLowerCase()) || (e.description || '').toLowerCase().includes(expenseSearch.toLowerCase())
      const matchCategory = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter
      const matchMethod = expenseMethodFilter === 'ALL' || e.paymentMethod === expenseMethodFilter
      return matchSearch && matchCategory && matchMethod
    })
  }, [data?.expenses, expenseSearch, expenseCategoryFilter, expenseMethodFilter])

  const filteredPayments = useMemo(() => {
    if (!data?.payments) return []
    return data.payments.filter(p => {
      const client = p.appointment?.client?.name || 'General'
      const service = p.appointment?.service?.name || ''
      const barber = p.appointment?.barber?.name || ''
      const matchSearch = client.toLowerCase().includes(movementSearch.toLowerCase()) || service.toLowerCase().includes(movementSearch.toLowerCase()) || barber.toLowerCase().includes(movementSearch.toLowerCase())
      const matchMethod = movementMethodFilter === 'ALL' || p.method === movementMethodFilter
      const matchBarber = movementBarberFilter === 'ALL' || barber === movementBarberFilter
      return matchSearch && matchMethod && matchBarber
    })
  }, [data?.payments, movementSearch, movementMethodFilter, movementBarberFilter])

  const filteredPending = useMemo(() => {
    if (!data?.pendingAppointments) return []
    return data.pendingAppointments.filter(a => {
      const matchSearch = a.clientName.toLowerCase().includes(pendingSearch.toLowerCase()) || a.serviceName.toLowerCase().includes(pendingSearch.toLowerCase()) || a.barberName.toLowerCase().includes(pendingSearch.toLowerCase())
      const matchBarber = pendingBarberFilter === 'ALL' || a.barberName === pendingBarberFilter
      return matchSearch && matchBarber
    })
  }, [data?.pendingAppointments, pendingSearch, pendingBarberFilter])

  // Summary variables
  const s = data?.summary
  const cashCollected = data?.byMethod.CASH || 0
  const cashExpenses = data?.expensesByMethod?.CASH || 0
  const netExpectedCashInDrawer = cashCollected - cashExpenses

  const transferCollected = data?.byMethod.TRANSFER || 0
  const cardCollected = data?.byMethod.CARD || 0
  const otherCollected = data?.byMethod.OTHER || 0
  const digitalCollected = transferCollected + cardCollected + otherCollected
  const digitalExpenses = (data?.expensesByMethod?.TRANSFER || 0) + (data?.expensesByMethod?.CARD || 0) + (data?.expensesByMethod?.OTHER || 0)
  const netDigitalInBank = digitalCollected - digitalExpenses

  const countedCashNum = Number(cashCounted) || 0
  const cashDiff = cashCounted ? (countedCashNum - netExpectedCashInDrawer) : 0
  const totalByMethod = Object.values(data?.byMethod || {}).reduce((a, b) => a + b, 0)

  // Unique barber names for dropdown filters
  const barberNames = useMemo(() => {
    return Array.from(new Set(data?.barberPerformance.map(b => b.name) || []))
  }, [data?.barberPerformance])

  // Alerts
  const alerts: string[] = []
  if ((s?.totalPending || 0) > 0) alerts.push(`Hay ${formatCOP(s!.totalPending)} pendientes por cobrar de citas no pagadas.`)
  if ((data?.pendingAppointments.length || 0) > 0) alerts.push(`${data!.pendingAppointments.length} cita(s) completada(s) sin cobro registrado.`)
  if (data?.barberPerformance.some(b => b.commission > 0)) alerts.push('Hay comisiones generadas por liquidar al equipo de barberos.')

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'control',     label: 'Centro de Control', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'pending',     label: `Pendientes ${data?.pendingAppointments.length ? `(${data.pendingAppointments.length})` : ''}`, icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'movements',   label: 'Movimientos',  icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'expenses',    label: 'Gastos',        icon: <TrendingDown className="w-3.5 h-3.5" /> },
    { id: 'commissions', label: 'Comisiones',    icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'closure',     label: 'Cierre de Caja', icon: <Wallet className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════
          DATE FILTER TOOLBAR
      ════════════════════════════════════════ */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-zinc-950 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-700" />
              {currentRange.label}
            </span>
          </div>

          {/* Quick Date Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'TODAY', label: 'Hoy' },
              { id: 'YESTERDAY', label: 'Ayer' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id as DatePreset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  datePreset === p.id
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Botón interactivo para Elegir Día Exacto */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border border-transparent ${
              datePreset === 'EXACT_DAY'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:border-zinc-300'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={exactDay}
                onChange={e => {
                  if (e.target.value) {
                    setExactDay(e.target.value)
                    setDatePreset('EXACT_DAY')
                  }
                }}
                className="bg-transparent border-none outline-none cursor-pointer"
                style={{ color: 'inherit' }}
              />
            </div>

            {[
              { id: 'THIS_WEEK', label: 'Esta Semana' },
              { id: 'THIS_MONTH', label: 'Este Mes' },
              { id: 'LAST_MONTH', label: 'Mes Pasado' },
              { id: 'THIS_YEAR', label: 'Año' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id as DatePreset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  datePreset === p.id
                    ? 'bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950 shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {p.label}
              </button>
            ))}

            <button
              onClick={fetchData}
              title="Refrescar datos"
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && !loading && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400" />
              {a}
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/80 p-1 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-[#18181b] shadow-sm text-zinc-950 dark:text-white border border-zinc-200/60 dark:border-zinc-700/80'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
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
          <span className="text-sm text-zinc-400 font-medium">Consultando registros para {currentRange.label}...</span>
        </div>
      ) : (

      <>
      {/* ════════════════════════════════════════
          TAB 1 — CENTRO DE CONTROL
      ════════════════════════════════════════ */}
      {tab === 'control' && (
        <div className="space-y-6">

          {/* KPIs Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Dinero Cobrado"
              value={formatCOP(s?.totalRevenue || 0)}
              sub="Ingresos efectivos del periodo"
              color="green"
            />
            <KpiCard
              icon={<Clock className="w-4 h-4" />}
              label="Por Cobrar"
              value={formatCOP(s?.totalPending || 0)}
              sub="Citas pendientes de pago"
              color="amber"
            />
            <KpiCard
              icon={<TrendingDown className="w-4 h-4" />}
              label="Gastos"
              value={formatCOP(s?.totalExpenses || 0)}
              sub="Salidas registradas"
              color="red"
            />
            <KpiCard
              icon={<Users className="w-4 h-4" />}
              label="Comisiones"
              value={formatCOP(s?.totalCommissions || 0)}
              sub="Por pagar al equipo"
              color="zinc"
            />
            <KpiCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Utilidad Estimada"
              value={formatCOP(s?.netProfit || 0)}
              sub="Margen libre del negocio"
              color={(s?.netProfit || 0) >= 0 ? 'green' : 'red'}
              formula="Cobrado − Gastos − Comisiones"
            />
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Disponible Hoy</p>
                <p className={`text-2xl font-black ${(s?.availableToday || 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatCOP(s?.availableToday || 0)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Cobrado hoy − gastos hoy</p>
              </div>
            </div>
          </div>

          {/* Health: Hoy / Semana / Mes */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Salud del Negocio</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <PeriodCard label="Hoy"        stats={data!.periods.today} />
              <PeriodCard label="Esta Semana" stats={data!.periods.week} />
              <PeriodCard label="Este Mes"   stats={data!.periods.month} />
            </div>
          </div>

          {/* Payment method distribution */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" />Distribución de Ingresos ({currentRange.label})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['CASH', 'TRANSFER', 'CARD', 'OTHER'] as const).map(m => {
                const amount = data?.byMethod[m] || 0
                const pct = totalByMethod > 0 ? Math.round((amount / totalByMethod) * 100) : 0
                return (
                  <div key={m} className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">{METHOD_LABELS[m]}</p>
                    <p className="text-xl font-black text-zinc-950">{formatCOP(amount)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 bg-zinc-200 rounded-full h-1.5">
                        <div className="bg-zinc-800 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-zinc-500">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 2 — PENDIENTES
      ════════════════════════════════════════ */}
      {tab === 'pending' && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="bg-amber-50 dark:bg-[#121215] border border-amber-200 dark:border-amber-400/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-400/15 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Total Pendiente por Cobrar</p>
                <p className="text-2xl font-black text-amber-800 dark:text-amber-300">{formatCOP(s?.totalPending || 0)}</p>
              </div>
            </div>
            <div className="text-sm text-amber-800 dark:text-amber-300 font-bold bg-amber-100/60 dark:bg-amber-400/15 border border-amber-200/80 dark:border-amber-400/30 px-4 py-2 rounded-xl">
              {filteredPending.length} cita(s) pendiente(s)
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, servicio o barbero..."
                value={pendingSearch}
                onChange={e => setPendingSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 bg-white transition-all text-zinc-900 placeholder:text-zinc-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pendingBarberFilter}
                onChange={e => setPendingBarberFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-900"
              >
                <option value="ALL">Todos los Barberos</option>
                {barberNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>

              {(pendingSearch || pendingBarberFilter !== 'ALL') && (
                <button
                  onClick={() => { setPendingSearch(''); setPendingBarberFilter('ALL') }}
                  className="text-xs text-red-600 font-bold hover:underline px-2"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80">
                    {['Cód. Cobro', 'Cód. Reserva', 'Fecha', 'Cliente', 'Servicio', 'Barbero', 'Valor', 'Estado', 'Acción'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-16 text-center text-zinc-400 text-sm">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      No hay citas pendientes con los filtros aplicados.
                    </td></tr>
                  ) : filteredPending.map(appt => (
                    <tr key={appt.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors group">
                      <td className="px-5 py-4 text-xs font-mono font-bold text-amber-700">
                        {appt.paymentCode || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-medium text-zinc-500">
                        {appt.reservationCode || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500 font-medium">
                        {new Date(appt.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-zinc-950">{appt.clientName}</td>
                      <td className="px-5 py-4 text-xs text-zinc-600 font-medium">{appt.serviceName}</td>
                      <td className="px-5 py-4 text-xs text-zinc-600 font-medium">{appt.barberName}</td>
                      <td className="px-5 py-4 text-sm font-black text-zinc-950">{formatCOP(appt.servicePrice)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Por cobrar
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => { setPayingAppt(appt); setPayMethod('CASH') }}
                          className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cobrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 3 — MOVIMIENTOS
      ════════════════════════════════════════ */}
      {tab === 'movements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-black text-zinc-950">Historial de Ingresos ({currentRange.label})</p>
              <p className="text-xs text-zinc-400 mt-0.5">{filteredPayments.length} transacciones registradas</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, servicio o barbero..."
                value={movementSearch}
                onChange={e => setMovementSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 bg-white transition-all text-zinc-900 placeholder:text-zinc-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={movementMethodFilter}
                onChange={e => setMovementMethodFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-900"
              >
                <option value="ALL">Todos los Métodos</option>
                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              <select
                value={movementBarberFilter}
                onChange={e => setMovementBarberFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-900"
              >
                <option value="ALL">Todos los Barberos</option>
                {barberNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>

              {(movementSearch || movementMethodFilter !== 'ALL' || movementBarberFilter !== 'ALL') && (
                <button
                  onClick={() => { setMovementSearch(''); setMovementMethodFilter('ALL'); setMovementBarberFilter('ALL') }}
                  className="text-xs text-red-600 font-bold hover:underline px-2"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80">
                    {['Cód. Pago', 'Cód. Reserva', 'Fecha / Hora', 'Cliente', 'Servicio', 'Barbero', 'Método', 'Estado', 'Monto'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-zinc-400 font-medium">No se encontraron pagos con los filtros aplicados.</td></tr>
                  ) : filteredPayments.map(p => (
                    <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono font-bold text-zinc-800">
                        {p.paymentCode || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-medium text-zinc-500">
                        {p.appointment?.reservationCode || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500 font-medium">
                        {new Date(p.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-zinc-950">{p.appointment?.client?.name || 'General'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-600 font-medium">{p.appointment?.service?.name || '—'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-600 font-medium">{p.appointment?.barber?.name || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-zinc-200/50">
                          {METHOD_LABELS[p.method]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          (p.status === 'PAID' || p.status === 'COMPLETED') 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : p.status === 'REFUNDED' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(p.status === 'PAID' || p.status === 'COMPLETED') ? 'Pagado' : p.status === 'REFUNDED' ? 'Reembolsado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-emerald-600">{formatCOP(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 4 — GASTOS
      ════════════════════════════════════════ */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-zinc-950">Gastos Registrados ({currentRange.label})</p>
              <p className="text-xs text-zinc-400 mt-0.5">{filteredExpenses.length} registros · Total filtrado: {formatCOP(filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0))}</p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Gasto
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por concepto o notas..."
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 bg-white transition-all text-zinc-900 placeholder:text-zinc-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={expenseCategoryFilter}
                onChange={e => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-900"
              >
                <option value="ALL">Todas las Categorías</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              <select
                value={expenseMethodFilter}
                onChange={e => setExpenseMethodFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-zinc-900"
              >
                <option value="ALL">Todos los Métodos</option>
                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              {(expenseSearch || expenseCategoryFilter !== 'ALL' || expenseMethodFilter !== 'ALL') && (
                <button
                  onClick={() => { setExpenseSearch(''); setExpenseCategoryFilter('ALL'); setExpenseMethodFilter('ALL') }}
                  className="text-xs text-red-600 font-bold hover:underline px-2"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80">
                    {['Fecha', 'Concepto', 'Categoría', 'Método', 'Monto', ''].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-medium">No hay gastos registrados en este periodo con estos filtros.</td></tr>
                  ) : filteredExpenses.map(e => (
                    <tr key={e.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors group">
                      <td className="px-5 py-4 text-xs text-zinc-500 font-medium">
                        {new Date(e.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-zinc-950">{e.concept}</p>
                        {e.description && <p className="text-xs text-zinc-400 mt-0.5">{e.description}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-zinc-200/50">
                          {CATEGORY_LABELS[e.category] || e.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600 font-medium">{METHOD_LABELS[e.paymentMethod] || e.paymentMethod}</td>
                      <td className="px-5 py-4 text-sm font-black text-red-600">{formatCOP(e.amount)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 5 — COMISIONES
      ════════════════════════════════════════ */}
      {tab === 'commissions' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-zinc-950 uppercase tracking-tight">Comisiones & Rendimiento de Barberos</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Monitorea la producción del equipo para el periodo: <strong className="text-zinc-700">{currentRange.label}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-zinc-100 text-zinc-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                {data?.barberPerformance.length || 0} barberos
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Row */}
          {(() => {
            const totalBarberRevenue = data?.barberPerformance.reduce((acc, b) => acc + b.revenue, 0) || 0
            const totalBarberCommissions = data?.barberPerformance.reduce((acc, b) => acc + b.commission, 0) || 0
            const totalBarberServices = data?.barberPerformance.reduce((acc, b) => acc + b.servicesCount, 0) || 0
            const totalBarbershopShare = totalBarberRevenue - totalBarberCommissions

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Comisiones a Pagar</span>
                  <p className="text-2xl font-black text-amber-600">{formatCOP(totalBarberCommissions)}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Acumulado en este periodo</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Producción Total</span>
                  <p className="text-2xl font-black text-zinc-950">{formatCOP(totalBarberRevenue)}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Ingresos generados por citas</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Retención Barbería</span>
                  <p className="text-2xl font-black text-emerald-600">{formatCOP(totalBarbershopShare)}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Margen libre para el negocio</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Servicios Realizados</span>
                  <p className="text-2xl font-black text-blue-600">{totalBarberServices} cortes</p>
                  <p className="text-[11px] text-zinc-400 mt-1">En {currentRange.label}</p>
                </div>
              </div>
            )
          })()}

          {/* Main 2-Column Full Width Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Barbers Cards Grid (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {(data?.barberPerformance.length || 0) === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400 text-sm shadow-sm">
                  No hay barberos registrados o con actividad en este periodo.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {data?.barberPerformance.map(b => {
                    const barbershopShare = b.revenue - b.commission
                    const hasProduction = b.revenue > 0

                    return (
                      <div key={b.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-5">
                        
                        {/* Header de Barbero */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-md">
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-zinc-950 uppercase tracking-tight text-base">{b.name}</h3>
                                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                  <Percent className="w-2.5 h-2.5" />
                                  {b.commissionRate}% Comisión
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                {b.servicesCount} servicio{b.servicesCount !== 1 ? 's' : ''} en este periodo
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setEditingBarber(b)
                              setTempCommissionRate(b.commissionRate)
                            }}
                            className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto"
                          >
                            <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                            Configurar %
                          </button>
                        </div>

                        {/* 4 Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Clientes</span>
                            <p className="text-xl font-black text-zinc-950 mt-0.5">{b.clientsCount}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Servicios</span>
                            <p className="text-xl font-black text-zinc-950 mt-0.5">{b.servicesCount}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Ingresos</span>
                            <p className="text-xl font-black text-emerald-600 mt-0.5">{formatCOP(b.revenue)}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Ticket Prom.</span>
                            <p className="text-xl font-black text-zinc-950 mt-0.5">{formatCOP(b.avgTicket)}</p>
                          </div>
                        </div>

                        {/* Split Bar & Distribution */}
                        <div className="bg-zinc-50/80 border border-zinc-100 rounded-xl p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <span className="font-bold text-zinc-700">Comisión del Barbero ({b.commissionRate}%):</span>
                              <span className="font-black text-amber-700">{formatCOP(b.commission)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                              <span className="font-bold text-zinc-700">Retención Barbería ({100 - b.commissionRate}%):</span>
                              <span className="font-black text-zinc-950">{formatCOP(barbershopShare)}</span>
                            </div>
                          </div>

                          {/* Dual progress bar */}
                          <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden flex">
                            <div
                              className="bg-amber-500 h-full transition-all"
                              style={{ width: `${b.commissionRate}%` }}
                              title={`Barbero: ${b.commissionRate}%`}
                            />
                            <div
                              className="bg-zinc-800 h-full transition-all"
                              style={{ width: `${100 - b.commissionRate}%` }}
                              title={`Barbería: ${100 - b.commissionRate}%`}
                            />
                          </div>

                          {!hasProduction && (
                            <p className="text-[11px] text-zinc-400 italic">
                              Sin citas completadas en este periodo. La comisión se calculará automáticamente en cuanto se completen citas.
                            </p>
                          )}
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Live Commission Simulator (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Simulador Interactivo */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-zinc-950 text-white rounded-lg flex items-center justify-center">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-zinc-950">Simulador de Comisión</h3>
                      <p className="text-[11px] text-zinc-400">Calcula ejemplos en tiempo real</p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>

                {/* Input Monto Base */}
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                    Monto de Venta / Servicio ($)
                  </label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={e => setSimAmount(Number(e.target.value) || 0)}
                    placeholder="100000"
                    className="w-full px-3.5 py-2.5 border-2 border-zinc-200 rounded-xl text-base font-black text-zinc-950 outline-none focus:border-zinc-950 bg-white transition-colors"
                  />
                </div>

                {/* Slider de Porcentaje */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-600 uppercase tracking-wider">Porcentaje de Comisión</span>
                    <span className="font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-sm">
                      {simRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={simRate}
                    onChange={e => setSimRate(Number(e.target.value))}
                    className="w-full accent-zinc-950 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                  />
                  {/* Presets rápidos */}
                  <div className="flex justify-between gap-1 pt-1">
                    {[30, 40, 50, 60, 70].map(p => (
                      <button
                        key={p}
                        onClick={() => setSimRate(p)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                          simRate === p 
                            ? 'bg-zinc-950 text-white' 
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resultado del Cálculo */}
                {(() => {
                  const barberTake = (simAmount * simRate) / 100
                  const shopTake = simAmount - barberTake

                  return (
                    <div className="bg-zinc-950 text-white rounded-xl p-4 space-y-3 shadow-md">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-2">
                        Resultado por cada {formatCOP(simAmount)}
                      </p>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">El Barbero recibe ({simRate}%):</span>
                          <span className="font-black text-amber-400 text-sm">{formatCOP(barberTake)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">La Barbería retiene ({100 - simRate}%):</span>
                          <span className="font-black text-emerald-400 text-sm">{formatCOP(shopTake)}</span>
                        </div>
                      </div>

                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden flex mt-2">
                        <div className="bg-amber-400 h-full" style={{ width: `${simRate}%` }} />
                        <div className="bg-emerald-400 h-full" style={{ width: `${100 - simRate}%` }} />
                      </div>
                    </div>
                  )
                })()}

                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-[11px] text-zinc-500 space-y-1">
                  <p className="font-bold text-zinc-700">💡 Transparencia Total</p>
                  <p>
                    Puedes acordar comisiones personalizadas con cada miembro de tu equipo. Las comisiones se recalculan automáticamente sin alterar registros contables previos.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 6 — CIERRE DE CAJA PROFESIONAL
      ════════════════════════════════════════ */}
      {tab === 'closure' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-zinc-950 uppercase tracking-tight flex items-center gap-2">
                <Wallet className="w-5 h-5 text-zinc-700" /> Cierre de Caja
              </h2>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Período auditado: <strong className="text-zinc-700">{currentRange.label}</strong>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Solo pagos PAID como ingreso real
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Columna Izquierda ── */}
            <div className="lg:col-span-7 space-y-6">

              {/* 1. Efectivo en Gaveta */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center text-lg">💵</div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-zinc-950">1. Efectivo Físico en Gaveta</h3>
                      <p className="text-xs text-zinc-400">Dinero que debería haber en la gaveta según registros</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase mb-1">
                      <ArrowUpRight className="w-3 h-3" /> Efectivo Cobrado
                    </div>
                    <p className="text-lg font-black text-zinc-950">{formatCOP(cashCollected)}</p>
                    <span className="text-[10px] text-zinc-400">Pagos PAID en efectivo</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-700 uppercase mb-1">
                      <ArrowDownRight className="w-3 h-3" /> Gastos en Efectivo
                    </div>
                    <p className="text-lg font-black text-red-600">-{formatCOP(cashExpenses)}</p>
                    <span className="text-[10px] text-zinc-400">Salidas desde gaveta</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                    <div className="text-[10px] font-black text-emerald-800 uppercase mb-1">= Esperado en Gaveta</div>
                    <p className="text-xl font-black text-emerald-800">{formatCOP(netExpectedCashInDrawer)}</p>
                    <span className="text-[10px] text-emerald-700 font-bold">Dinero que debe haber</span>
                  </div>
                </div>

                {/* Conteo físico */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-black text-zinc-800 uppercase tracking-wider block">
                    ¿Cuánto efectivo hay físicamente en la gaveta? ($)
                  </label>
                  <p className="text-[10px] text-zinc-400">Dinero físico que realmente encontraste en la gaveta.</p>
                  <input
                    type="number"
                    value={cashCounted}
                    onChange={e => setCashCounted(e.target.value)}
                    placeholder="Ingresa el valor total contado..."
                    className="w-full px-4 py-2.5 border-2 border-zinc-300 rounded-xl text-lg font-black text-zinc-950 outline-none focus:border-zinc-950 bg-white transition-colors placeholder:text-zinc-400"
                  />
                </div>

                {/* Diferencia */}
                {cashCounted ? (
                  <div className={`p-5 rounded-2xl border-2 space-y-4 shadow-sm ${
                    cashDiff === 0
                      ? 'bg-emerald-50 border-emerald-500'
                      : cashDiff > 0
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-red-50 border-red-500'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-3 border-b border-black/10">
                      {cashDiff === 0 ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : cashDiff > 0 ? (
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      )}
                      <h4 className={`text-lg font-black uppercase tracking-wide ${
                        cashDiff === 0 ? 'text-emerald-800' : cashDiff > 0 ? 'text-blue-800' : 'text-red-800'
                      }`}>
                        {cashDiff === 0 ? 'Caja Cuadrada' : cashDiff > 0 ? 'Sobrante Detectado' : 'Faltante Detectado'}
                      </h4>
                    </div>

                    {/* Main Message */}
                    <p className={`text-sm font-bold ${
                      cashDiff === 0 ? 'text-emerald-700' : cashDiff > 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {cashDiff === 0 
                        ? 'No se encontraron diferencias entre el efectivo esperado y el efectivo contado.' 
                        : cashDiff > 0
                        ? `Hay ${formatCOP(cashDiff)} adicionales en la gaveta.`
                        : `Faltan ${formatCOP(Math.abs(cashDiff))} en la gaveta.`
                      }
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-black/50 block">El sistema esperaba:</span>
                        <span className="text-sm font-bold text-black/80">{formatCOP(netExpectedCashInDrawer)}</span>
                        <p className="text-[9.5px] text-black/50 leading-tight">Dinero que debería existir según los pagos y gastos registrados.</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-black/50 block">Se contó:</span>
                        <span className="text-sm font-bold text-black/80">{formatCOP(Number(cashCounted))}</span>
                        <p className="text-[9.5px] text-black/50 leading-tight">Dinero físico encontrado al realizar el conteo.</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-black/50 block">Diferencia:</span>
                        <span className={`text-xl font-black ${
                          cashDiff === 0 ? 'text-emerald-700' : cashDiff > 0 ? 'text-blue-700' : 'text-red-700'
                        }`}>
                          {cashDiff > 0 ? '+' : ''}{formatCOP(cashDiff)}
                        </span>
                        <p className="text-[9.5px] text-black/50 leading-tight">Resultado de comparar el efectivo esperado contra el efectivo contado.</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-black/50 block">Estado:</span>
                        <span className={`inline-block px-3 py-1.5 mt-1 rounded-full text-[10px] font-black uppercase ${
                          cashDiff === 0 ? 'bg-emerald-200 text-emerald-900' : cashDiff > 0 ? 'bg-blue-200 text-blue-900' : 'bg-red-200 text-red-900'
                        }`}>
                          {cashDiff === 0 ? 'Correcto' : cashDiff > 0 ? 'Sobrante de efectivo' : 'Faltante de efectivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-center text-xs text-zinc-400">
                    Ingresa el monto de efectivo contado para ver la diferencia.
                  </div>
                )}
              </div>

              {/* 2. Canales Digitales */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-zinc-950">2. Conciliación Digital</h3>
                      <p className="text-xs text-zinc-400">Este dinero está en tu cuenta bancaria / billetera, NO en la gaveta</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Neto Digital: {formatCOP(netDigitalInBank)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Transferencia / Nequi</p>
                    <p className="text-lg font-black text-zinc-950 mt-1">{formatCOP(transferCollected)}</p>
                    <span className="text-[10px] text-zinc-400">Recibido en cuenta</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Datáfono / Tarjeta</p>
                    <p className="text-lg font-black text-zinc-950 mt-1">{formatCOP(cardCollected)}</p>
                    <span className="text-[10px] text-zinc-400">Cobros por terminal</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Gastos digitales</p>
                    <p className="text-lg font-black text-red-600 mt-1">-{formatCOP(digitalExpenses)}</p>
                    <span className="text-[10px] text-zinc-400">Salidas bancarias</span>
                  </div>
                </div>
              </div>

              {/* 3. Pendiente por Cobrar — NO es dinero recibido */}
              {(data?.pendingAppointments.length || 0) > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">⚠ Pendiente por Cobrar</h3>
                        <p className="text-xs text-amber-700 font-medium">Este dinero NO está incluido en el total recibido. Son servicios completados sin cobro.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-amber-800">{formatCOP(s?.totalPending || 0)}</p>
                      <p className="text-[10px] text-amber-600 font-bold uppercase">{data?.pendingAppointments.length} servicio(s)</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* ── Columna Derecha ── */}
            <div className="lg:col-span-5 space-y-6">

              {/* Resumen Consolidado */}
              <div className="bg-zinc-950 text-white rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Resumen del Día</span>
                  <span className="text-[10px] font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-zinc-300">{currentRange.label}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-xs">Efectivo recibido (PAID)</span>
                    <span className="font-bold text-emerald-400">{formatCOP(cashCollected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-xs">Digital recibido (Transf. + Tarjeta)</span>
                    <span className="font-bold text-blue-300">{formatCOP(digitalCollected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-xs">Gastos Operativos</span>
                    <span className="font-bold text-red-400">-{formatCOP(data?.summary.totalExpenses || 0)}</span>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-black text-white">Total Dinero Recibido</p>
                      <p className="text-[10px] text-zinc-500">Solo pagos PAID cobrados</p>
                    </div>
                    <span className="text-2xl font-black text-white">{formatCOP(data?.summary.totalRevenue || 0)}</span>
                  </div>
                  {(s?.totalPending || 0) > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 text-xs font-bold">Pendiente por cobrar</span>
                        <span className="text-amber-400 font-black">{formatCOP(s?.totalPending || 0)}</span>
                      </div>
                      <p className="text-[10px] text-amber-600/80 mt-0.5">NO sumado al total anterior</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Formulario de Cierre */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wide text-zinc-950">Registrar Cierre de Caja</h3>
                  <p className="text-xs text-zinc-400">Se guardará de forma permanente en la base de datos</p>
                </div>

                {/* Motivo de diferencia — solo si hay descuadre y conteo ingresado */}
                {cashCounted && cashDiff !== 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider">
                      ¿Por qué existe la diferencia de {formatCOP(Math.abs(cashDiff))}?
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: 'error_conteo', label: 'Error de conteo' },
                        { id: 'gasto_no_registrado', label: 'Gasto no registrado en el sistema' },
                        { id: 'retiro_efectivo', label: 'Retiro de efectivo (anticipo, urgencia)' },
                        { id: 'pago_mal_registrado', label: 'Pago registrado incorrectamente' },
                        { id: 'otro', label: 'Otro motivo' },
                      ].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setDiffReason(r.id)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                            diffReason === r.id
                              ? 'bg-zinc-950 text-white border-zinc-950'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          {diffReason === r.id ? '● ' : '○ '}{r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                    Observaciones del Cierre (opcional)
                  </label>
                  <textarea
                    value={closureObs}
                    onChange={e => setClosureObs(e.target.value)}
                    rows={3}
                    placeholder="Ej. Turno sin novedades. Gaveta cuadrada..."
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm text-zinc-950 outline-none focus:border-zinc-950 bg-white transition-colors resize-none placeholder:text-zinc-400"
                  />
                </div>

                <button
                  onClick={() => setShowClosureConfirm(true)}
                  disabled={!cashCounted}
                  className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {cashCounted ? 'Revisar y Confirmar Cierre' : 'Ingresa el efectivo contado primero'}
                </button>
                <p className="text-[10px] text-zinc-400 text-center">
                  El cierre se guardará en la base de datos y estará disponible en el historial desde cualquier dispositivo.
                </p>
              </div>

              {/* Historial de Cierres */}
              <CashCloseHistory />
            </div>
          </div>
        </div>
      )}
      {showClosureConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-zinc-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-950">¿Cerrar Caja?</h3>
              <p className="text-xs text-zinc-500">Período: <strong>{currentRange.label}</strong></p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4 text-sm">
              <div className="space-y-2.5 pb-4 border-b border-zinc-200">
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Total cobrado (PAID)</span><span className="font-bold text-emerald-600">{formatCOP(data?.summary.totalRevenue || 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Gastos registrados</span><span className="font-bold text-red-600">-{formatCOP(data?.summary.totalExpenses || 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Comisiones pendientes</span><span className="font-bold text-zinc-950">{formatCOP(data?.summary.totalCommissions || 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Pendiente por cobrar</span><span className="font-bold text-amber-600">{formatCOP(s?.totalPending || 0)}</span></div>
              </div>
              <div className="space-y-2.5 pb-4 border-b border-zinc-200">
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Efectivo esperado</span><span className="font-bold text-zinc-950">{formatCOP(netExpectedCashInDrawer)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Efectivo contado</span><span className="font-bold text-zinc-950">{formatCOP(Number(cashCounted))}</span></div>
                <div className="flex justify-between pt-1"><span className="text-zinc-900 font-bold">Diferencia</span><span className={`font-black ${cashDiff === 0 ? 'text-emerald-600' : cashDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}>{cashDiff > 0 ? '+' : ''}{formatCOP(cashDiff)}</span></div>
              </div>
              <div className="pt-2 flex flex-col items-center justify-center text-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Resultado del Cierre</span>
                <span className={`text-xl font-black flex items-center gap-2 ${
                  cashDiff === 0 ? 'text-emerald-600' : cashDiff > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {cashDiff === 0 && <><CheckCircle2 className="w-5 h-5" /> Caja Cuadrada</>}
                  {cashDiff > 0 && <><CheckCircle2 className="w-5 h-5" /> Sobran {formatCOP(cashDiff)} en caja</>}
                  {cashDiff < 0 && <><AlertTriangle className="w-5 h-5" /> Faltan {formatCOP(Math.abs(cashDiff))} en caja</>}
                </span>
                <span className="text-xs font-bold text-zinc-500 mt-1">
                  Estado final: {cashDiff === 0 ? '✓ Caja Cuadrada' : cashDiff > 0 ? '✓ Sobrante de Caja' : '⚠ Faltante de Caja'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClosureConfirm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClosure}
                disabled={savingClosure}
                className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {savingClosure ? 'Guardando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ════ MODAL: Marcar como Pagado ════ */}
      {payingAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-zinc-950">Registrar Cobro</h3>
                  <p className="text-xs text-zinc-400">{payingAppt.clientName}</p>
                </div>
              </div>
              <button onClick={() => setPayingAppt(null)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-zinc-50 rounded-xl p-4 mb-5 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Servicio</span>
                <span className="font-bold text-zinc-950">{payingAppt.serviceName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Barbero</span>
                <span className="font-bold text-zinc-950">{payingAppt.barberName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Valor</span>
                <span className="font-black text-emerald-600">{formatCOP(payingAppt.servicePrice)}</span>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Método de pago</label>
              <div className="grid grid-cols-2 gap-2">
                {(['CASH', 'TRANSFER', 'CARD', 'OTHER'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      payMethod === m
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                    }`}
                  >
                    {METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayingAppt(null)} className="flex-1 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
              <button onClick={handleMarkPaid} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">Confirmar Cobro</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Registrar Gasto ════ */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-black text-zinc-950">Registrar Gasto</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Concepto</label>
                <input
                  autoFocus type="text" value={expenseForm.concept}
                  onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                  placeholder="Ej. Arriendo local, productos..."
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Categoría</label>
                  <div className="relative">
                    <select
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors appearance-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Método</label>
                  <div className="relative">
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors appearance-none"
                    >
                      {Object.entries(METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Monto ($)</label>
                <input
                  type="number" value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
                <input
                  type="text" value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Notas adicionales..."
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={savingExpense || !expenseForm.concept || !expenseForm.amount} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors">
                  {savingExpense ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL: Configurar Comisión de Barbero ════ */}
      {editingBarber && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-zinc-950 text-white rounded-xl flex items-center justify-center font-black text-base shadow-sm">
                  {editingBarber.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-zinc-950 text-base">Ajustar Comisión</h3>
                  <p className="text-xs text-zinc-400">{editingBarber.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingBarber(null)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slider de Configuración */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  Porcentaje de Comisión
                </label>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={tempCommissionRate}
                    onChange={e => setTempCommissionRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-12 bg-transparent text-right font-black text-amber-700 outline-none text-base"
                  />
                  <span className="font-black text-amber-700 text-sm">%</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={tempCommissionRate}
                onChange={e => setTempCommissionRate(Number(e.target.value))}
                className="w-full accent-zinc-950 cursor-pointer h-2 bg-zinc-200 rounded-lg"
              />

              {/* Botones de selección rápida */}
              <div className="flex justify-between gap-1 pt-1">
                {[30, 35, 40, 45, 50, 60].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTempCommissionRate(val)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                      tempCommissionRate === val
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Simulación en tiempo real */}
            {(() => {
              const currentRev = editingBarber.revenue
              const simBarberPayout = (currentRev * tempCommissionRate) / 100
              const simShopPayout = currentRev - simBarberPayout

              const exampleBase = 50000
              const exampleBarber = (exampleBase * tempCommissionRate) / 100
              const exampleShop = exampleBase - exampleBarber

              return (
                <div className="space-y-3">
                  {/* Ejemplo de un corte */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 text-xs space-y-1.5">
                    <p className="font-bold text-zinc-700">Ejemplo: Por un corte de {formatCOP(exampleBase)}:</p>
                    <div className="flex justify-between text-zinc-600">
                      <span>• Barbero recibe ({tempCommissionRate}%):</span>
                      <strong className="text-amber-700 font-black">{formatCOP(exampleBarber)}</strong>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>• Barbería retiene ({100 - tempCommissionRate}%):</span>
                      <strong className="text-emerald-700 font-black">{formatCOP(exampleShop)}</strong>
                    </div>
                  </div>

                  {/* Impacto en la producción actual del barbero */}
                  {currentRev > 0 && (
                    <div className="bg-zinc-950 text-white rounded-xl p-3.5 text-xs space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Impacto con ventas de este periodo ({formatCOP(currentRev)})
                      </p>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Pago acumulado:</span>
                        <span className="font-black text-amber-400">{formatCOP(simBarberPayout)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Margen retenido:</span>
                        <span className="font-black text-emerald-400">{formatCOP(simShopPayout)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingBarber(null)}
                className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingCommission}
                onClick={handleUpdateCommission}
                className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                {savingCommission ? 'Guardando...' : 'Guardar Comisión'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
