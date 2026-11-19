'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-styles.css'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Scissors, 
  Grid, 
  CalendarDays, 
  Calendar as CalendarIcon,
  X,
  CheckCircle2,
  Phone,
  Tag
} from 'lucide-react'
import { toast } from 'sonner'
import AppointmentDetailModal from '@/components/appointments/AppointmentDetailModal'

moment.locale('es')
const localizer = momentLocalizer(moment)

interface Barber {
  id: string
  name: string
  color: string
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Appointment {
  id: string
  clientId: string
  barberId: string
  serviceId: string
  date: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  reservationCode?: string
  client: { name: string; phone: string }
  barber: Barber
  service: Service
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No Asistió'
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800'
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & State
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null)

  // Day Detail Modal State (When clicking a day or "+X más")
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)

  // New Appointment Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newBarberId, setNewBarberId] = useState('')
  const [newServiceId, setNewServiceId] = useState('')
  const [newDate, setNewDate] = useState(moment().format('YYYY-MM-DDTHH:mm'))
  const [submittingBooking, setSubmittingBooking] = useState(false)

  const fetchData = async () => {
    try {
      const [apptsRes, barbersRes, servicesRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/barbers'),
        fetch('/api/services')
      ])
      if (apptsRes.ok) setAppointments(await apptsRes.json())
      if (barbersRes.ok) setBarbers(await barbersRes.json())
      if (servicesRes.ok) setServices(await servicesRes.json())
    } catch (e) {
      console.error('Error fetching calendar data', e)
      toast.error('Error al cargar la agenda')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter appointments by barber and status
  const filteredAppointments = appointments.filter((appt) => {
    const matchesBarber = !selectedBarberId || appt.barberId === selectedBarberId
    const matchesStatus = selectedStatus === 'ALL' || appt.status === selectedStatus
    return matchesBarber && matchesStatus
  })

  // Map to react-big-calendar events
  const events = filteredAppointments.map((appt) => {
    const start = new Date(appt.date)
    const duration = appt.service?.duration || 30
    const end = new Date(start.getTime() + duration * 60000)
    return {
      id: appt.id,
      title: `${appt.client?.name || 'Cliente'} - ${appt.service?.name || 'Corte'}`,
      start,
      end,
      resource: appt
    }
  })

  // Custom event styles for light & dark themes
  const eventStyleGetter = (event: { resource: Appointment }) => {
    const appt = event.resource
    const isCancelled = appt.status === 'CANCELLED'
    const isCompleted = appt.status === 'COMPLETED'
    const isPending = appt.status === 'PENDING'
    const barberColor = appt.barber?.color || '#3b82f6'

    let borderLeftColor = barberColor
    if (isCancelled) borderLeftColor = '#ef4444'
    if (isCompleted) borderLeftColor = '#10b981'
    if (isPending) borderLeftColor = '#f59e0b'

    return {
      style: {
        backgroundColor: isCancelled
          ? 'var(--error-bg)'
          : isCompleted
            ? 'var(--success-bg)'
            : isPending
              ? 'rgba(245, 158, 11, 0.08)'
              : 'var(--surface-3)',
        color: isCancelled
          ? 'var(--error-text)'
          : isCompleted
            ? 'var(--success-text)'
            : 'var(--text-primary)',
        border: isPending ? '1px dashed rgba(245, 158, 11, 0.5)' : undefined,
        borderLeft: `4px solid ${borderLeftColor}`,
        borderRadius: '10px',
        fontSize: '0.75rem',
        padding: '4px 8px',
        fontWeight: '700',
        boxShadow: 'var(--shadow-xs)'
      }
    }
  }

  // Custom Event view inside cell
  const CustomEvent = ({ event }: { event: { start: Date; resource: Appointment } }) => {
    const appt = event.resource
    const startTime = moment(event.start).format('HH:mm')
    const barberColor = appt.barber?.color || '#3b82f6'
    const isPending = appt.status === 'PENDING'

    return (
      <div className="flex flex-col gap-0.5 h-full overflow-hidden text-xs">
        <div className="flex items-center justify-between opacity-85 text-[10px] font-mono">
          <span className="font-bold">{startTime}</span>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: barberColor }} />
        </div>
        <div className="font-black truncate text-zinc-950 dark:text-zinc-100 flex items-center gap-1">
          <span className="truncate">{appt.client?.name || 'Cliente'}</span>
          {isPending && (
            <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-1 py-0.2 rounded shrink-0">
              Hold
            </span>
          )}
        </div>
        <div className="text-[10px] font-semibold truncate text-zinc-500 dark:text-zinc-400">
          {appt.service?.name}
        </div>
      </div>
    )
  }

  // Handle status update
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Estado actualizado a: ${STATUS_LABELS[newStatus] || newStatus}`)
        setSelectedEvent(null)
        fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  // Handle appointment deletion
  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita de la agenda?')) return
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Cita eliminada de la agenda')
        setSelectedEvent(null)
        fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Error al eliminar cita')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  // Handle quick booking submit
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientName || !newBarberId || !newServiceId || !newDate) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    setSubmittingBooking(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newClientName,
          clientPhone: newClientPhone || '0000000000',
          barberId: newBarberId,
          serviceId: newServiceId,
          date: newDate
        })
      })
      if (res.ok) {
        toast.success('Cita agendada correctamente')
        setIsBookingOpen(false)
        setNewClientName('')
        setNewClientPhone('')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al agendar la cita')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setSubmittingBooking(false)
    }
  }

  // Appointments for the selected day modal
  const dayAppointments = selectedDayDate
    ? filteredAppointments.filter((appt) =>
        moment(appt.date).isSame(selectedDayDate, 'day')
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : []

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Main Controls Card: Navigation, Views, Barber Filter & Action Button */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Navigation Controls & Current Month */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1">
              <button
                onClick={() => setDate(moment(date).subtract(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all"
                title="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setDate(new Date())}
                className="px-3.5 py-1.5 text-xs font-black uppercase text-zinc-950 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                Hoy
              </button>
              <button
                onClick={() => setDate(moment(date).add(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all"
                title="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <h2 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-tight capitalize">
              {moment(date).format('MMMM YYYY')}
            </h2>
          </div>

          {/* View Switchers & Action Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Buttons: Mes, Semana, Día */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 text-xs font-black uppercase">
              <button
                onClick={() => setView('month')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  view === 'month' ? 'panel-pill-active font-black' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Grid size={14} />
                <span>Mes</span>
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  view === 'week' ? 'panel-pill-active font-black' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <CalendarDays size={14} />
                <span>Semana</span>
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  view === 'day' ? 'panel-pill-active font-black' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Clock size={14} />
                <span>Día</span>
              </button>
            </div>

            {/* Quick Action Button: + Agendar Cita */}
            <button
              onClick={() => setIsBookingOpen(true)}
              className="panel-btn-accent px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 active:scale-95 shrink-0"
            >
              <Plus size={16} />
              <span>+ Agendar Cita</span>
            </button>
          </div>
        </div>

        {/* Filters Row: Barbers & Status */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          {/* Barber Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-zinc-400 uppercase text-[10px] font-black tracking-widest shrink-0 flex items-center gap-1">
              <User size={12} /> Barbero:
            </span>
            <button
              onClick={() => setSelectedBarberId(null)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase transition-all border ${
                selectedBarberId === null
                  ? 'panel-pill-active'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            {barbers.map((barber) => {
              const isSelected = selectedBarberId === barber.id
              const color = barber.color || '#3b82f6'
              return (
                <button
                  key={barber.id}
                  onClick={() => setSelectedBarberId(barber.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'panel-pill-active'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span>{barber.name}</span>
                </button>
              )
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 text-[11px]">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1 rounded-xl uppercase transition-all ${
                selectedStatus === 'ALL' ? 'panel-pill-active font-extrabold' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedStatus('CONFIRMED')}
              className={`px-2.5 py-1 rounded-xl uppercase transition-all ${
                selectedStatus === 'CONFIRMED' ? 'bg-emerald-600 text-white font-extrabold shadow-xs' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setSelectedStatus('PENDING')}
              className={`px-2.5 py-1 rounded-xl uppercase transition-all ${
                selectedStatus === 'PENDING' ? 'bg-amber-600 text-white font-extrabold shadow-xs' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Calendar View Area */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-3xl shadow-xs min-h-[750px] flex flex-col flex-1 w-full">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 font-bold py-24 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-200 dark:border-zinc-800" style={{ borderTopColor: 'var(--accent)' }} />
            <span>Cargando agenda operativa...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-[700px]">
            <Calendar
              toolbar={false}
              popup={true}
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={(v) => setView(v)}
              date={date}
              onNavigate={(d) => setDate(d)}
              views={['day', 'week', 'month']}
              step={15}
              timeslots={4}
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 21, 0, 0)}
              selectable={true}
              onSelectSlot={(slotInfo) => {
                // Open Day Overview Modal on clicking any day cell slot!
                setSelectedDayDate(slotInfo.start)
              }}
              onDrillDown={(drillDate) => {
                setSelectedDayDate(drillDate)
              }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event: { resource: Appointment }) => setSelectedEvent(event.resource)}
              components={{
                event: CustomEvent
              }}
              messages={{
                next: ">",
                previous: "<",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                showMore: (count) => `+ ${count} más`
              }}
              className="font-sans flex-1 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Day Overview Modal (When clicking a day cell to see all appointments with full precision) */}
      {selectedDayDate && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in"
          onClick={() => setSelectedDayDate(null)}
        >
          <div 
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-950 dark:text-white my-auto panel-modal-enter max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarIcon size={14} className="text-amber-500 dark:text-amber-400" />
                  Agenda del Día
                </span>
                <h3 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-tight capitalize mt-0.5">
                  {moment(selectedDayDate).format('dddd, D [de] MMMM YYYY')}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const formatted = moment(selectedDayDate).format('YYYY-MM-DDTHH:mm')
                    setNewDate(formatted)
                    setSelectedDayDate(null)
                    setIsBookingOpen(true)
                  }}
                  className="panel-btn-accent text-xs font-black uppercase px-3.5 py-2 rounded-xl transition-all flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Agendar Cita</span>
                </button>

                <button
                  onClick={() => setSelectedDayDate(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List of Appointments for the Selected Day */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {dayAppointments.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 font-bold">
                  No hay citas registradas para este día.
                </div>
              ) : (
                dayAppointments.map((appt) => {
                  const startTime = moment(appt.date).format('HH:mm')
                  const barberColor = appt.barber?.color || '#3b82f6'

                  return (
                    <div
                      key={appt.id}
                      onClick={() => {
                        setSelectedDayDate(null)
                        setSelectedEvent(appt)
                      }}
                      className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 group"
                    >
                      {/* Left: Time & Client info */}
                      <div className="flex items-start gap-3">
                        <div className="bg-zinc-950 dark:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-black font-mono shrink-0 text-center">
                          <div>{startTime}</div>
                          <div className="text-[9px] text-zinc-400 font-normal">{appt.service?.duration} min</div>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-zinc-950 dark:text-white uppercase">
                            {appt.client?.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <Scissors size={13} className="text-zinc-400 shrink-0" />
                            <span>{appt.service?.name}</span>
                            <span className="text-zinc-300 dark:text-zinc-600">•</span>
                            <span className="font-black text-zinc-900 dark:text-zinc-200">${Number(appt.service?.price || 0).toLocaleString('es-CO')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Barber info & status badge */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barberColor }} />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">{appt.barber?.name}</span>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          STATUS_COLORS[appt.status] || 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs font-bold text-zinc-400 shrink-0">
              Total {dayAppointments.length} citas programadas el {moment(selectedDayDate).format('D [de] MMMM')}
            </div>
          </div>
        </div>
      )}

      {/* Single Appointment Details Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-950 dark:text-white my-auto panel-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Reserva #{selectedEvent.reservationCode ? selectedEvent.reservationCode.slice(-6).toUpperCase() : 'CITA'}
                </span>
                <h3 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-tight mt-0.5">
                  Detalle de la Cita
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-black">Estado</div>
                  <div className="font-black text-sm uppercase mt-0.5 text-zinc-900 dark:text-white">{STATUS_LABELS[selectedEvent.status] || selectedEvent.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 uppercase font-black">Precio</div>
                  <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">${Number(selectedEvent.service?.price || 0).toLocaleString('es-CO')}</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <span className="font-black text-zinc-950 dark:text-white text-sm">{selectedEvent.client?.name}</span>
                  {selectedEvent.client?.phone && (
                    <span className="text-zinc-400 font-bold text-[11px]">({selectedEvent.client.phone})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Scissors size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedEvent.service?.name}</span>
                  <span className="text-zinc-400">({selectedEvent.service?.duration} min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Barbero: {selectedEvent.barber?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">
                    {moment(selectedEvent.date).format('dddd D [de] MMMM YYYY, HH:mm')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions for Status Update */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleUpdateStatus(selectedEvent.id, 'CONFIRMED')}
                className="panel-btn-accent font-black py-3 rounded-xl uppercase tracking-wider transition-all"
              >
                Confirmar
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedEvent.id, 'COMPLETED')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl uppercase tracking-wider transition-all"
              >
                Completar
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedEvent.id, 'CANCELLED')}
                className="border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-black py-3 rounded-xl uppercase tracking-wider transition-all"
              >
                Cancelar Cita
              </button>
              <button
                onClick={() => handleDeleteAppointment(selectedEvent.id)}
                className="border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white font-black py-3 rounded-xl uppercase tracking-wider transition-all"
              >
                Eliminar Cita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking Modal */}
      {isBookingOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in"
          onClick={() => setIsBookingOpen(false)}
        >
          <form 
            onSubmit={handleCreateAppointment}
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-950 dark:text-white my-auto panel-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-black uppercase text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <Plus size={18} className="text-amber-500 dark:text-amber-400" />
                Agendar Nueva Cita
              </h3>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Ej. 3001234567"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                    Barbero *
                  </label>
                  <select
                    required
                    value={newBarberId}
                    onChange={(e) => setNewBarberId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-amber-400 font-semibold"
                  >
                    <option value="">Seleccionar</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                    Servicio *
                  </label>
                  <select
                    required
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-amber-400 font-semibold"
                  >
                    <option value="">Seleccionar</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${Number(s.price).toLocaleString('es-CO')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-amber-400 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="w-1/2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingBooking}
                className="w-1/2 panel-btn-accent py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                {submittingBooking ? 'Agendando...' : 'Confirmar Cita'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
