'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  LayoutGrid, 
  List, 
  Plus, 
  Trash2, 
  Check, 
  X,
  Phone,
  DollarSign,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Ban,
  TrendingUp,
  RefreshCw,
  FileText,
  AlertTriangle
} from 'lucide-react'
import AppointmentDetailModal from '@/components/appointments/AppointmentDetailModal'

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface PaymentData {
  id: string
  paymentCode?: string
  amount: number
  method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER'
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'REFUNDED' | 'PARTIAL'
  paidAt?: string
}

interface Appointment {
  id: string
  clientId: string
  barberId: string
  serviceId: string
  reservationCode: string
  date: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  paymentMethod?: string
  paidAt?: string
  client: { name: string; phone?: string }
  barber: { name: string; color?: string }
  service: { name: string; price: number; duration?: number }
  payment?: PaymentData | null
}

interface Client { id: string; name: string }
interface Barber { id: string; name: string; color?: string }
interface Service { id: string; name: string; price: number; duration?: number }

type DateRangePreset = 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia / Nequi', CARD: 'Tarjeta', OTHER: 'Otro'
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [loading, setLoading] = useState(true)

  // ─── Filters State ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    dateRange: 'ALL' as DateRangePreset,
    customFrom: '',
    customTo: '',
    barberId: 'ALL',
    serviceId: 'ALL',
    paymentStatus: 'ALL'
  })

  // ─── Modal State: Quick Payment ──────────────────────────────────────────────
  const [payingAppt, setPayingAppt] = useState<Appointment | null>(null)
  const [payMethod, setPayMethod] = useState<'CASH' | 'TRANSFER' | 'CARD' | 'OTHER'>('CASH')
  const [processingPay, setProcessingPay] = useState(false)

  // ─── Modal State: Delete Confirm ────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // ─── Modal State: Ficha Técnica Detalle Cita ──────────────────────────────────
  const [selectedDetailAppt, setSelectedDetailAppt] = useState<Appointment | null>(null)

  // ─── Form State: New Appointment ───────────────────────────────────────────
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    barberId: '',
    date: '',
    time: '09:00'
  })
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  // Custom dropdown state
  const [barberDropdownOpen, setBarberDropdownOpen] = useState(false)
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false)
  const [barberSearch, setBarberSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const barberDropdownRef = useRef<HTMLDivElement>(null)
  const serviceDropdownRef = useRef<HTMLDivElement>(null)

  const isNewClient = formData.clientName.trim() !== '' && 
    !clients.some(c => c.name.toLowerCase() === formData.clientName.toLowerCase())

  const filteredBarbersForForm = barbers.filter(b =>
    b.name.toLowerCase().includes(barberSearch.toLowerCase())
  )
  const filteredServicesForForm = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const selectedBarber = barbers.find(b => b.id === formData.barberId)
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id))
  const totalPrice = selectedServices.reduce((acc, s) => acc + Number(s.price), 0)
  const totalDuration = selectedServices.reduce((acc, s) => acc + (s.duration ?? 30), 0)

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [apptsRes, clientsRes, barbersRes, servicesRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/clients'),
        fetch('/api/barbers'),
        fetch('/api/services')
      ])
      
      const [appts, cls, barbs, servs] = await Promise.all([
        apptsRes.ok ? apptsRes.json() : [],
        clientsRes.ok ? clientsRes.json() : [],
        barbersRes.ok ? barbersRes.json() : [],
        servicesRes.ok ? servicesRes.json() : []
      ])
      
      setAppointments(Array.isArray(appts) ? appts : [])
      setClients(Array.isArray(cls) ? cls : [])
      setBarbers(Array.isArray(barbs) ? barbs : [])
      setServices(Array.isArray(servs) ? servs : [])
    } catch {
      toast.error('Error al cargar datos de citas')
    } finally {
      setLoading(false)
    }
  }

  const fetchDataSilently = async () => {
    try {
      const [apptsRes, clientsRes, barbersRes, servicesRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/clients'),
        fetch('/api/barbers'),
        fetch('/api/services')
      ])

      const [appts, cls, barbs, servs] = await Promise.all([
        apptsRes.ok ? apptsRes.json() : [],
        clientsRes.ok ? clientsRes.json() : [],
        barbersRes.ok ? barbersRes.json() : [],
        servicesRes.ok ? servicesRes.json() : []
      ])

      if (Array.isArray(appts)) setAppointments(appts)
      if (Array.isArray(cls)) setClients(cls)
      if (Array.isArray(barbs)) setBarbers(barbs)
      if (Array.isArray(servs)) setServices(servs)
    } catch {
      // silent background refresh
    }
  }

  useEffect(() => {
    fetchData()

    const handleNewReservation = () => {
      fetchDataSilently()
    }
    window.addEventListener('new-appointment-registered', handleNewReservation)

    const interval = setInterval(fetchDataSilently, 4000)

    return () => {
      window.removeEventListener('new-appointment-registered', handleNewReservation)
      clearInterval(interval)
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (barberDropdownRef.current && !barberDropdownRef.current.contains(event.target as Node)) {
        setBarberDropdownOpen(false)
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setServiceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── Optimistic Update for Appointment Status ──────────────────────────────
  const updateStatusOptimistic = async (id: string, newStatus: Appointment['status']) => {
    const originalAppointments = [...appointments]
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al actualizar estado')
      }

      toast.success(`Estado actualizado a ${newStatus}`)
      fetchData()
    } catch (err: unknown) {
      setAppointments(originalAppointments)
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado'
      toast.error(msg)
    }
  }

  // ─── Mark Payment Handle ────────────────────────────────────────────────────
  const handleRegisterPayment = async () => {
    if (!payingAppt) return
    setProcessingPay(true)
    try {
      const res = await fetch('/api/finances/pending', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: payingAppt.id, paymentMethod: payMethod })
      })
      if (res.ok) {
        toast.success(`Pago cobrado exitosamente (${METHOD_LABELS[payMethod]})`)
        setPayingAppt(null)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al registrar cobro')
      }
    } catch {
      toast.error('Error de conexión al registrar cobro')
    } finally {
      setProcessingPay(false)
    }
  }

  // ─── Delete Appointment Handle ──────────────────────────────────────────────
  const deleteAppointment = async (id: string) => {
    setConfirmDelete(null)
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Cita eliminada correctamente')
        fetchData()
      } else {
        toast.error('Error al eliminar la cita')
      }
    } catch {
      toast.error('Error al conectar para eliminar cita')
    }
  }

  // ─── Submit New Appointment Handle ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientName || !formData.barberId || selectedServiceIds.length === 0 || !formData.date) {
      toast.warning('Por favor completa todos los campos requeridos')
      return
    }

    if (isNewClient && !formData.clientPhone) {
      toast.warning('Por favor ingresa el teléfono del nuevo cliente')
      return
    }

    let clientId = clients.find(c => c.name.toLowerCase() === formData.clientName.toLowerCase())?.id

    const mainPromise = async () => {
      if (!clientId) {
        const clientRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.clientName,
            phone: formData.clientPhone || 'Sin teléfono'
          })
        })
        if (!clientRes.ok) throw new Error('Error al crear cliente')
        const newClient = await clientRes.json()
        clientId = newClient.id
      }

      let cursor = new Date(`${formData.date}T${formData.time}:00`)
      const codes: string[] = []

      for (const svcId of selectedServiceIds) {
        const svc = services.find(s => s.id === svcId)!
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            barberId: formData.barberId,
            serviceId: svcId,
            date: cursor.toISOString()
          })
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || `Error al agendar servicio: ${svc.name}`)
        }
        const data = await res.json()
        codes.push(data.reservationCode)
        cursor = new Date(cursor.getTime() + (svc.duration ?? 30) * 60000)
      }

      return codes
    }

    toast.promise(mainPromise(), {
      loading: `Agendando ${selectedServiceIds.length} servicio(s)...`,
      success: (codes: string[]) => {
        setFormData({ ...formData, clientName: '', clientPhone: '', barberId: '', date: '' })
        setSelectedServiceIds([])
        fetchData()
        return codes.length === 1
          ? `Cita agendada — Código: #${codes[0].slice(-6).toUpperCase()}`
          : `${codes.length} citas agendadas exitosamente`
      },
      error: (err: Error) => err.message || 'Error al agendar cita'
    })
  }

  // ─── Filter Logic ────────────────────────────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59)

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return appointments.filter(appt => {
      const q = filters.search.toLowerCase()
      const searchMatch = !filters.search ||
        (appt.client?.name || '').toLowerCase().includes(q) ||
        (appt.client?.phone || '').includes(q) ||
        (appt.service?.name || '').toLowerCase().includes(q) ||
        (appt.barber?.name || '').toLowerCase().includes(q) ||
        (appt.reservationCode || '').toLowerCase().includes(q) ||
        (appt.payment?.paymentCode || '').toLowerCase().includes(q)

      const statusMatch = filters.status === 'ALL' || appt.status === filters.status
      const barberMatch = filters.barberId === 'ALL' || appt.barberId === filters.barberId
      const serviceMatch = filters.serviceId === 'ALL' || appt.serviceId === filters.serviceId

      // Payment status filter
      let payMatch = true
      if (filters.paymentStatus !== 'ALL') {
        const pStatus = appt.payment?.status
        if (filters.paymentStatus === 'PAID') {
          payMatch = pStatus === 'PAID' || pStatus === 'COMPLETED'
        } else if (filters.paymentStatus === 'PENDING') {
          payMatch = pStatus === 'PENDING'
        } else if (filters.paymentStatus === 'REFUNDED') {
          payMatch = pStatus === 'REFUNDED'
        } else if (filters.paymentStatus === 'UNPAID') {
          payMatch = !pStatus || pStatus === 'PENDING'
        }
      }

      // Date range filter
      let dateMatch = true
      const apptDate = new Date(appt.date)

      switch (filters.dateRange) {
        case 'TODAY':
          dateMatch = apptDate >= todayStart && apptDate <= todayEnd
          break
        case 'TOMORROW':
          dateMatch = apptDate >= tomorrowStart && apptDate <= tomorrowEnd
          break
        case 'THIS_WEEK':
          dateMatch = apptDate >= weekStart && apptDate <= weekEnd
          break
        case 'THIS_MONTH':
          dateMatch = apptDate >= monthStart && apptDate <= monthEnd
          break
        case 'CUSTOM':
          if (filters.customFrom) {
            const fromD = new Date(`${filters.customFrom}T00:00:00`)
            if (apptDate < fromD) dateMatch = false
          }
          if (filters.customTo && dateMatch) {
            const toD = new Date(`${filters.customTo}T23:59:59`)
            if (apptDate > toD) dateMatch = false
          }
          break
      }

      return searchMatch && statusMatch && barberMatch && serviceMatch && payMatch && dateMatch
    })
  }, [appointments, filters])

  // ─── KPI Calculations ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalCount = filteredAppointments.length
    const totalPotentialValue = filteredAppointments.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)

    const pendingList = filteredAppointments.filter(a => a.status === 'PENDING')
    const pendingVal = pendingList.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)

    const confirmedList = filteredAppointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS')
    const confirmedVal = confirmedList.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)

    const completedList = filteredAppointments.filter(a => a.status === 'COMPLETED')
    const completedVal = completedList.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)
    const paidVal = completedList
      .filter(a => a.payment?.status === 'PAID' || a.payment?.status === 'COMPLETED')
      .reduce((sum, a) => sum + Number(a.service?.price || 0), 0)
    const uncollectedVal = completedVal - paidVal

    const cancelledList = filteredAppointments.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW')

    return {
      totalCount,
      totalPotentialValue,
      pendingCount: pendingList.length,
      pendingVal,
      confirmedCount: confirmedList.length,
      confirmedVal,
      completedCount: completedList.length,
      completedVal,
      paidVal,
      uncollectedVal,
      cancelledCount: cancelledList.length
    }
  }, [filteredAppointments])

  const hasActiveFilters = filters.search || filters.status !== 'ALL' || filters.dateRange !== 'ALL' || 
    filters.barberId !== 'ALL' || filters.serviceId !== 'ALL' || filters.paymentStatus !== 'ALL'

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      dateRange: 'ALL',
      customFrom: '',
      customTo: '',
      barberId: 'ALL',
      serviceId: 'ALL',
      paymentStatus: 'ALL'
    })
  }

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* ── Modal Confirmación Eliminación ──────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-200 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-zinc-950 uppercase">¿Eliminar Cita?</h3>
            <p className="text-xs text-zinc-500 font-medium">Esta acción no se puede deshacer y la reserva será removida.</p>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => deleteAppointment(confirmDelete)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
              <button 
                onClick={() => setConfirmDelete(null)}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Registrar Cobro Rápido ───────────────────────────────────── */}
      {payingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl border border-zinc-200 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-950 uppercase tracking-tight">Registrar Cobro de Cita</h3>
                  <p className="text-xs text-zinc-400 font-medium">Código: <span className="font-mono font-bold text-zinc-700">{payingAppt.payment?.paymentCode || payingAppt.reservationCode}</span></p>
                </div>
              </div>
              <button onClick={() => setPayingAppt(null)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-medium">Cliente:</span>
                <span className="font-black text-zinc-950">{payingAppt.client?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-medium">Servicio:</span>
                <span className="font-bold text-zinc-800">{payingAppt.service?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-medium">Barbero:</span>
                <span className="font-bold text-zinc-800">{payingAppt.barber?.name}</span>
              </div>
              <div className="pt-2 border-t border-zinc-200/60 flex justify-between items-center">
                <span className="text-xs font-black text-zinc-700 uppercase">Monto a Cobrar:</span>
                <span className="text-xl font-black text-emerald-600">{formatCOP(Number(payingAppt.service?.price || 0))}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {(['CASH', 'TRANSFER', 'CARD', 'OTHER'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                      payMethod === m 
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm ring-2 ring-zinc-950/20' 
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>{METHOD_LABELS[m]}</span>
                    {payMethod === m && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleRegisterPayment}
                disabled={processingPay}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                {processingPay ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirmar Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setPayingAppt(null)}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TARJETAS SUPERIORES KPI (Métricas Financieras y Estado) ─────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Citas</span>
            <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-700">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-950">{kpis.totalCount}</p>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Valor Total: {formatCOP(kpis.totalPotentialValue)}</p>
          </div>
        </div>

        <div className="bg-white border border-amber-200/80 bg-amber-50/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Pendientes</span>
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-800">{kpis.pendingCount}</p>
            <p className="text-[11px] text-amber-700 font-bold mt-0.5">Potencial: {formatCOP(kpis.pendingVal)}</p>
          </div>
        </div>

        <div className="bg-white border border-blue-200/80 bg-blue-50/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Confirmadas / En Progreso</span>
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-900">{kpis.confirmedCount}</p>
            <p className="text-[11px] text-blue-700 font-bold mt-0.5">Estimado: {formatCOP(kpis.confirmedVal)}</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 bg-emerald-50/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Completadas</span>
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-800">{kpis.completedCount}</p>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Cobrado: {formatCOP(kpis.paidVal)} {kpis.uncollectedVal > 0 && <span className="text-amber-700">({formatCOP(kpis.uncollectedVal)} por cobrar)</span>}</p>
          </div>
        </div>

        <div className="bg-white border border-red-200/80 bg-red-50/20 rounded-3xl p-5 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-700">Canceladas / No Asistió</span>
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-700">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-red-800">{kpis.cancelledCount}</p>
            <p className="text-[11px] text-red-600 font-medium mt-0.5">Citas no concretadas</p>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR DE BÚSQUEDA Y FILTROS MULTIDIMENSIONALES ───────────────── */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        
        {/* Fila 1: Búsqueda Global + Selector de Vista */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono, servicio, barbero o código RES-XXXXX / PAY-XXXXX..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-zinc-900 placeholder-zinc-400 outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              title="Refrescar citas"
              className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-2xl p-1 text-xs font-black uppercase">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-black text-white shadow-xs' : 'text-zinc-500 hover:text-black'
                }`}
              >
                <List size={14} />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid' ? 'bg-black text-white shadow-xs' : 'text-zinc-500 hover:text-black'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Tarjetas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fila 2: Selectores de Filtro Avanzados (Fecha, Barbero, Servicio, Estado Cita, Estado Pago) */}
        <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          
          {/* 1. Rango de Fecha */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Fecha</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as DateRangePreset })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-black"
            >
              <option value="ALL">Todas las Fechas</option>
              <option value="TODAY">Hoy</option>
              <option value="TOMORROW">Mañana</option>
              <option value="THIS_WEEK">Esta Semana</option>
              <option value="THIS_MONTH">Este Mes</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          {/* 2. Estado de Cita */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Estado Cita</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-black"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
              <option value="NO_SHOW">No Asistió</option>
            </select>
          </div>

          {/* 3. Barbero */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Barbero</label>
            <select
              value={filters.barberId}
              onChange={(e) => setFilters({ ...filters, barberId: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-black"
            >
              <option value="ALL">Todos los Barberos</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* 4. Servicio */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Servicio</label>
            <select
              value={filters.serviceId}
              onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-black"
            >
              <option value="ALL">Todos los Servicios</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 5. Estado de Pago */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Estado Cobro</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-black"
            >
              <option value="ALL">Todos los Cobros</option>
              <option value="PAID">Pagados</option>
              <option value="PENDING">Pendientes de Pago</option>
              <option value="UNPAID">Sin Cobro Registrado</option>
              <option value="REFUNDED">Reembolsados</option>
            </select>
          </div>

          {/* 6. Botón de Limpiar Filtros */}
          <div className="flex items-end">
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-red-200/60"
              >
                Limpiar Filtros
              </button>
            ) : (
              <span className="text-[10px] font-bold text-zinc-400 px-2 py-2 block">Sin filtros activos</span>
            )}
          </div>
        </div>

        {/* Fila 3: Rango de Fecha Personalizado (si dateRange == 'CUSTOM') */}
        {filters.dateRange === 'CUSTOM' && (
          <div className="pt-2 flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl text-xs border border-zinc-200/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-600">Desde:</span>
              <input
                type="date"
                value={filters.customFrom}
                onChange={e => setFilters({ ...filters, customFrom: e.target.value })}
                className="px-2.5 py-1 border border-zinc-200 rounded-lg font-bold text-zinc-950 bg-white outline-none focus:border-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-600">Hasta:</span>
              <input
                type="date"
                value={filters.customTo}
                onChange={e => setFilters({ ...filters, customTo: e.target.value })}
                className="px-2.5 py-1 border border-zinc-200 rounded-lg font-bold text-zinc-950 bg-white outline-none focus:border-black"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── LAYOUT PRINCIPAL: TABLA / GRID + SIDEBAR AGENDAR CITA ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Principal: Listado de Citas */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'table' ? (
            /* Vista de Tabla Expandida */
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-100 text-[10px] text-zinc-500 uppercase tracking-wider font-black">
                      <th className="px-4 py-4">Cód. Reserva</th>
                      <th className="px-4 py-4">Cliente</th>
                      <th className="px-4 py-4">Barbero</th>
                      <th className="px-4 py-4">Servicio</th>
                      <th className="px-4 py-4">Fecha / Hora</th>
                      <th className="px-4 py-4">Valor</th>
                      <th className="px-4 py-4">Estado Cita</th>
                      <th className="px-4 py-4">Estado Cobro</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs font-bold">
                    {loading ? (
                      <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-400">Cargando citas...</td></tr>
                    ) : filteredAppointments.length > 0 ? (
                      filteredAppointments.map(appt => {
                        const payStatus = appt.payment?.status
                        const isPaid = payStatus === 'PAID' || payStatus === 'COMPLETED'
                        const isPendingPay = payStatus === 'PENDING'

                        return (
                          <tr key={appt.id} className="hover:bg-zinc-50/80 transition-colors group">
                            <td className="px-4 py-4 font-mono text-[11px] text-zinc-500">
                              #{appt.reservationCode ? appt.reservationCode.slice(-6).toUpperCase() : appt.id.slice(0, 6)}
                            </td>
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailAppt(appt)}
                                className="text-left group/client hover:underline block"
                                title="Ver Ficha Técnica"
                              >
                                <p className="text-zinc-950 font-black uppercase text-sm group-hover/client:text-amber-600 transition-colors">{appt.client?.name}</p>
                                {appt.client?.phone && <p className="text-[10px] text-zinc-400 font-medium">{appt.client.phone}</p>}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-zinc-700">{appt.barber?.name}</td>
                            <td className="px-4 py-4 text-zinc-700">{appt.service?.name}</td>
                            <td className="px-4 py-4 text-zinc-600">
                              {new Date(appt.date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-4 py-4 font-black text-zinc-950">
                              {formatCOP(Number(appt.service?.price || 0))}
                            </td>
                            
                            {/* Selector Estado de Cita */}
                            <td className="px-4 py-4">
                              <select
                                value={appt.status}
                                onChange={(e) => updateStatusOptimistic(appt.id, e.target.value as Appointment['status'])}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase outline-none border-none cursor-pointer ${
                                  appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                  appt.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' :
                                  appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  appt.status === 'NO_SHOW' ? 'bg-zinc-200 text-zinc-700' :
                                  'bg-amber-100 text-amber-800'
                                }`}
                              >
                                <option value="PENDING">PENDIENTE</option>
                                <option value="CONFIRMED">CONFIRMADA</option>
                                <option value="IN_PROGRESS">EN PROGRESO</option>
                                <option value="COMPLETED">COMPLETADA</option>
                                <option value="CANCELLED">CANCELADA</option>
                                <option value="NO_SHOW">NO ASISTIÓ</option>
                              </select>
                            </td>

                            {/* Estado de Pago */}
                            <td className="px-4 py-4">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  Pagado ({METHOD_LABELS[appt.payment?.method || 'CASH'] || 'Efectivo'})
                                </span>
                              ) : isPendingPay ? (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Por cobrar
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                                  Sin pago
                                </span>
                              )}
                            </td>

                            {/* Acciones Rápidas */}
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {appt.status === 'PENDING' && (
                                  <button
                                    onClick={() => updateStatusOptimistic(appt.id, 'CONFIRMED')}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase transition-all"
                                    title="Confirmar Cita"
                                  >
                                    Confirmar
                                  </button>
                                )}

                                {(appt.status === 'CONFIRMED' || appt.status === 'IN_PROGRESS') && (
                                  <button
                                    onClick={() => updateStatusOptimistic(appt.id, 'COMPLETED')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-xs"
                                    title="Marcar como Completada"
                                  >
                                    Completar
                                  </button>
                                )}

                                {appt.status === 'COMPLETED' && !isPaid && (
                                  <button
                                    onClick={() => { setPayingAppt(appt); setPayMethod('CASH') }}
                                    className="px-2.5 py-1 bg-black text-white hover:bg-zinc-800 rounded-lg text-[10px] font-black uppercase transition-all shadow-xs flex items-center gap-1"
                                    title="Registrar Cobro"
                                  >
                                    <DollarSign className="w-3 h-3 text-emerald-400" />
                                    Cobrar
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailAppt(appt)}
                                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 shadow-2xs"
                                  title="Ver Ficha Técnica de la Cita"
                                >
                                  <FileText className="w-3 h-3 text-zinc-500" />
                                  <span>Ficha</span>
                                </button>

                                <button
                                  onClick={() => setConfirmDelete(appt.id)}
                                  className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                                  title="Eliminar Cita"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                              <CalendarIcon className="w-6 h-6 text-zinc-500" />
                            </div>
                            <div>
                              <h3 className="text-base font-black uppercase text-zinc-950">Aún no tienes citas registradas</h3>
                              <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto mt-1">
                                Comienza creando tu primera reserva.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('new-appointment-form')
                                el?.scrollIntoView({ behavior: 'smooth' })
                              }}
                              className="inline-flex items-center gap-2 bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                              <span>Agendar Cita</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Vista de Tarjetas (Grid View) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                <div className="py-20 col-span-2 text-center text-zinc-400 font-bold">Cargando citas...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="py-16 col-span-2 text-center bg-white border border-zinc-200/80 rounded-3xl p-8 space-y-4">
                  <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                    <CalendarIcon className="w-6 h-6 text-zinc-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-zinc-950">Aún no tienes citas registradas</h3>
                    <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto mt-1">
                      Comienza creando tu primera reserva.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('new-appointment-form')
                      el?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-2 bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Agendar Cita</span>
                  </button>
                </div>
              ) : (
                filteredAppointments.map(appt => {
                  const barberColor = appt.barber?.color || '#3b82f6'
                  const dateObj = new Date(appt.date)
                  const payStatus = appt.payment?.status
                  const isPaid = payStatus === 'PAID' || payStatus === 'COMPLETED'

                  return (
                    <div
                      key={appt.id}
                      className="bg-white border border-zinc-200/80 hover:border-zinc-300 p-5 rounded-3xl transition-all shadow-xs space-y-4 flex flex-col justify-between group"
                    >
                      {/* Header Card: Barber & Status Dropdown */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barberColor }} />
                          <span className="text-xs font-black text-zinc-700 uppercase tracking-wide">
                            {appt.barber?.name}
                          </span>
                        </div>

                        <select
                          value={appt.status}
                          onChange={(e) => updateStatusOptimistic(appt.id, e.target.value as Appointment['status'])}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider outline-none border-none cursor-pointer ${
                            appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            appt.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' :
                            appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>

                      {/* Client, Code & Service Info */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-black text-zinc-950 uppercase tracking-tight">
                            {appt.client?.name}
                          </h4>
                          {appt.reservationCode && (
                            <span className="text-[10px] font-mono font-bold text-zinc-400">
                              #{appt.reservationCode.slice(-6).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 mt-1 uppercase">
                          <Scissors size={13} className="text-zinc-400" />
                          <span>{appt.service?.name}</span>
                          <span className="text-zinc-300">•</span>
                          <span>{appt.service?.duration || 30} min</span>
                        </p>
                      </div>

                      {/* Payment Badge Status */}
                      <div className="flex items-center justify-between bg-zinc-50 p-2.5 rounded-2xl border border-zinc-100">
                        <span className="text-[10px] font-black text-zinc-400 uppercase">Estado Cobro:</span>
                        {isPaid ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            PAGADO ({METHOD_LABELS[appt.payment?.method || 'CASH']})
                          </span>
                        ) : appt.status === 'COMPLETED' ? (
                          <button
                            onClick={() => { setPayingAppt(appt); setPayMethod('CASH') }}
                            className="text-[10px] font-black text-white bg-black hover:bg-zinc-800 px-2.5 py-1 rounded-lg transition-all"
                          >
                            Cobrar {formatCOP(Number(appt.service?.price || 0))}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            PENDIENTE
                          </span>
                        )}
                      </div>

                      {/* Footer: Date & Price */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} />
                          <span>{dateObj.toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailAppt(appt)}
                            className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 shadow-2xs"
                            title="Ver Ficha Técnica"
                          >
                            <FileText className="w-3 h-3 text-zinc-500" />
                            <span>Ficha</span>
                          </button>
                          <span className="font-black text-zinc-950 text-sm">
                            {formatCOP(Number(appt.service?.price || 0))}
                          </span>
                          <button
                            onClick={() => setConfirmDelete(appt.id)}
                            className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                            title="Eliminar Cita"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Sidebar Derecha: Formulario Agendar Nueva Cita */}
        <div id="new-appointment-form" className="bg-white/95 dark:bg-[#121215] backdrop-blur-md p-7 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-xl space-y-6 flex flex-col justify-between h-full min-h-[620px] sticky top-20 transition-colors">
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-black dark:bg-amber-400 text-white dark:text-zinc-950 flex items-center justify-center shadow-lg shrink-0">
                <Plus size={20} className="text-white dark:text-zinc-950" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-950 dark:text-white uppercase tracking-tight">
                  Agendar Nueva Cita
                </h3>
                <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                  Reserva directa en la agenda
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              {/* Cliente Field */}
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <User size={12} className="text-zinc-500 dark:text-zinc-400" />
                  Nombre del Cliente *
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    list="clients-list"
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    placeholder="Escribe el nombre completo..."
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-amber-400 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-black/10 dark:focus:ring-amber-400/20 outline-none text-zinc-950 dark:text-white bg-zinc-50 dark:bg-zinc-900/90 transition-all font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    required
                  />
                  <datalist id="clients-list">
                    {clients.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
              </div>

              {/* Nuevo Cliente Alert Box */}
              {isNewClient && (
                <div className="bg-amber-500/10 dark:bg-amber-500/15 p-4 rounded-2xl border border-amber-500/30 dark:border-amber-500/40 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5 tracking-wider">
                    <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                    Nuevo Cliente Detectado
                  </p>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400" />
                    <input 
                      type="text"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                      placeholder="Teléfono / WhatsApp"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 dark:border-amber-500/50 focus:border-amber-600 dark:focus:border-amber-400 outline-none text-zinc-950 dark:text-white bg-white dark:bg-zinc-900 font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                      required={isNewClient}
                    />
                  </div>
                </div>
              )}

              {/* ── Barbero Dropdown ─────────────────────────────── */}
              <div ref={barberDropdownRef} className="relative">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <User size={12} className="text-zinc-500 dark:text-zinc-400" />
                  Barbero Asignado *
                </label>

                <button
                  type="button"
                  onClick={() => { setBarberDropdownOpen(o => !o); setServiceDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    barberDropdownOpen
                      ? 'border-black dark:border-amber-400 bg-white dark:bg-zinc-900 ring-2 ring-black/10 dark:ring-amber-400/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  {selectedBarber ? (
                    <span className="flex items-center gap-2 text-zinc-950 dark:text-white font-black uppercase">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedBarber.color || '#09090b' }} />
                      {selectedBarber.name}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-400 font-semibold">Seleccionar barbero...</span>
                  )}
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-200 ${barberDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {barberDropdownOpen && (
                  <div className="absolute z-40 left-0 right-0 top-[calc(100%+6px)] bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Buscar barbero..."
                          value={barberSearch}
                          onChange={e => setBarberSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-black dark:focus:border-amber-400 font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredBarbersForForm.length === 0 ? (
                        <p className="text-center py-5 text-xs text-zinc-400 font-semibold">Sin resultados</p>
                      ) : filteredBarbersForForm.map(b => {
                        const isSelected = formData.barberId === b.id
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, barberId: b.id})
                              setBarberDropdownOpen(false)
                              setBarberSearch('')
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
                              isSelected ? 'bg-zinc-950 dark:bg-zinc-800 text-white' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || '#09090b' }} />
                              <span className="uppercase font-black">{b.name}</span>
                            </span>
                            {isSelected && <Check size={14} className="text-emerald-400" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Servicio Dropdown — Multi-Select ─────────── */}
              <div ref={serviceDropdownRef} className="relative">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Scissors size={12} className="text-zinc-500 dark:text-zinc-400" />
                  Servicios * <span className="text-zinc-400 dark:text-zinc-400 font-semibold normal-case">(puedes elegir varios)</span>
                </label>

                <button
                  type="button"
                  onClick={() => { setServiceDropdownOpen(o => !o); setBarberDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    serviceDropdownOpen
                      ? 'border-black dark:border-amber-400 bg-white dark:bg-zinc-900 ring-2 ring-black/10 dark:ring-amber-400/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  {selectedServices.length > 0 ? (
                    <span className="flex items-center gap-2 text-zinc-950 dark:text-white font-black">
                      <Scissors size={13} className="text-amber-500" />
                      <span className="uppercase">{selectedServices.length} servicio{selectedServices.length > 1 ? 's' : ''} seleccionado{selectedServices.length > 1 ? 's' : ''}</span>
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-400 font-semibold">Seleccionar servicios...</span>
                  )}
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-200 ${serviceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedServices.map(s => (
                      <span
                        key={s.id}
                        className="flex items-center gap-1 bg-zinc-950 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-xl"
                      >
                        {s.name}
                        <button
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className="ml-0.5 text-zinc-400 hover:text-white transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {serviceDropdownOpen && (
                  <div className="absolute z-40 left-0 right-0 top-[calc(100%+6px)] bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Buscar servicio..."
                          value={serviceSearch}
                          onChange={e => setServiceSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-black dark:focus:border-amber-400 font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredServicesForForm.length === 0 ? (
                        <p className="text-center py-5 text-xs text-zinc-400 font-semibold">Sin resultados</p>
                      ) : filteredServicesForForm.map(s => {
                        const isSelected = selectedServiceIds.includes(s.id)
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleService(s.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                              isSelected ? 'bg-zinc-950 dark:bg-zinc-800 text-white' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 text-left">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-white/10 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'
                              }`}>
                                <Scissors size={13} className={isSelected ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'} />
                              </div>
                              <div>
                                <div className={`text-xs font-black uppercase ${
                                  isSelected ? 'text-white' : 'text-zinc-900 dark:text-white'
                                }`}>{s.name}</div>
                                <div className="text-[10px] font-semibold text-zinc-400">{s.duration ?? 30} min</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-black text-sm ${
                                isSelected ? 'text-emerald-400' : 'text-zinc-950 dark:text-white'
                              }`}>{formatCOP(Number(s.price))}</span>
                              {isSelected
                                ? <Check size={14} className="text-emerald-400" />
                                : <Plus size={14} className="text-zinc-300 dark:text-zinc-600" />
                              }
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {selectedServices.length > 0 && (
                      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <button
                          type="button"
                          onClick={() => setServiceDropdownOpen(false)}
                          className="w-full text-center text-xs font-black text-zinc-950 dark:text-white hover:text-black dark:hover:text-amber-400 py-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                        >
                          Confirmar selección ({selectedServices.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Fecha y Hora ─────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <CalendarIcon size={12} className="text-zinc-500 dark:text-zinc-400" />
                    Fecha *
                  </label>
                  <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:border-black dark:focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-amber-400/20 bg-zinc-50 dark:bg-zinc-900/90 overflow-hidden transition-all">
                    <div className="bg-zinc-950 dark:bg-zinc-800 px-3 py-3 flex items-center justify-center shrink-0">
                      <CalendarIcon size={14} className="text-white dark:text-amber-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="flex-1 px-3 py-2.5 outline-none text-zinc-950 dark:text-white bg-transparent font-semibold text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Clock size={12} className="text-zinc-500 dark:text-zinc-400" />
                    Hora *
                  </label>
                  <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:border-black dark:focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-amber-400/20 bg-zinc-50 dark:bg-zinc-900/90 overflow-hidden transition-all">
                    <div className="bg-zinc-950 dark:bg-zinc-800 px-3 py-3 flex items-center justify-center shrink-0">
                      <Clock size={14} className="text-white dark:text-amber-400" />
                    </div>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="flex-1 px-3 py-2.5 outline-none text-zinc-950 dark:text-white bg-transparent font-semibold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Live Summary Widget */}
              {selectedServices.length > 0 && (
                <div className="p-4 bg-zinc-950 text-white rounded-2xl border border-zinc-800 space-y-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Resumen de la Cita</div>

                  <div className="space-y-1.5">
                    {selectedServices.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                          <span className="text-zinc-500 font-mono text-[10px]">{i + 1}.</span>
                          {s.name}
                          <span className="text-zinc-500">· {s.duration ?? 30} min</span>
                        </span>
                        <span className="font-black text-white">{formatCOP(Number(s.price))}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-zinc-400 font-semibold">{totalDuration} min en total</div>
                      {formData.barberId && (
                        <div className="text-[10px] text-zinc-400 font-semibold">
                          Barbero: <span className="text-zinc-200 font-bold">{selectedBarber?.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-zinc-500 uppercase font-black">Total</div>
                      <div className="text-lg font-black text-emerald-400">{formatCOP(totalPrice)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!formData.clientName}
                className="w-full bg-black dark:bg-amber-400 hover:bg-zinc-800 dark:hover:bg-amber-300 text-white dark:text-zinc-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
              >
                <span>Confirmar Reserva</span>
                <Sparkles size={15} className="text-amber-400 dark:text-zinc-950 group-hover:rotate-12 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── MODAL: FICHA TÉCNICA DETALLE CITA ─── */}
      <AppointmentDetailModal
        appointment={selectedDetailAppt}
        isOpen={Boolean(selectedDetailAppt)}
        onClose={() => setSelectedDetailAppt(null)}
        onUpdateStatus={(id, newStatus) => {
          updateStatusOptimistic(id, newStatus as Appointment['status'])
          if (selectedDetailAppt && selectedDetailAppt.id === id) {
            setSelectedDetailAppt({
              ...selectedDetailAppt,
              status: newStatus as Appointment['status']
            })
          }
        }}
        onOpenPayment={(appt) => {
          setPayingAppt(appt as unknown as Appointment)
          setPayMethod('CASH')
        }}
      />
    </div>
  )
}
