'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/app/calendar/calendar-styles.css'
import { toast } from 'sonner'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Scissors, 
  Grid, 
  CalendarDays,
  Calendar as CalendarIcon,
  X
} from 'lucide-react'

moment.locale('es')
const localizer = momentLocalizer(moment)

interface Appointment {
  id: string
  date: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  reservationCode?: string
  client: { name: string; phone: string }
  service: { name: string; duration: number; price: number }
}

export default function BarberCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  const fetchData = async () => {
    try {
      const res = await fetch('/api/appointments')
      if (!res.ok) throw new Error('No autorizado')
      const data = await res.json()
      setAppointments(data)
    } catch {
      toast.error('Error al cargar tu agenda')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredAppointments = appointments.filter((appt) => {
    const matchesStatus = selectedStatus === 'ALL' || appt.status === selectedStatus
    return matchesStatus
  })

  const events = filteredAppointments.map((appt) => {
    const start = new Date(appt.date)
    const duration = appt.service?.duration || 30
    const end = new Date(start.getTime() + duration * 60000)
    return {
      id: appt.id,
      title: `${appt.client?.name || 'Cliente'} - ${appt.service?.name}`,
      start,
      end,
      resource: appt
    }
  })

  const eventStyleGetter = (event: { resource: Appointment }) => {
    const appt = event.resource
    const isCancelled = appt.status === 'CANCELLED'
    const isCompleted = appt.status === 'COMPLETED'

    let borderLeftColor = '#000000'
    if (isCancelled) borderLeftColor = '#ef4444'
    if (isCompleted) borderLeftColor = '#10b981'

    return {
      style: {
        backgroundColor: isCancelled ? '#fef2f2' : isCompleted ? '#ecfdf5' : '#f4f4f5',
        color: isCancelled ? '#dc2626' : isCompleted ? '#065f46' : '#09090b',
        borderLeft: `4px solid ${borderLeftColor}`,
        borderRadius: '8px',
        fontSize: '0.75rem',
        padding: '4px 8px',
        fontWeight: '700',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/barber/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Cita actualizada a ${newStatus}`)
        setSelectedEvent(null)
        fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  const todayAppointments = appointments.filter((a) => moment(a.date).isSame(moment(), 'day'))
  const totalCount = todayAppointments.length
  const confirmedCount = todayAppointments.filter((a) => a.status === 'CONFIRMED').length
  const pendingCount = todayAppointments.filter((a) => a.status === 'PENDING').length

  const dayAppointments = selectedDayDate
    ? filteredAppointments.filter((appt) =>
        moment(appt.date).isSame(selectedDayDate, 'day')
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : []

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-950 dark:text-white">Mi Agenda Personal</h1>
          <p className="text-xs font-bold text-zinc-400 mt-1 capitalize tracking-widest">
            {moment(date).format('MMMM YYYY')} • Control de disponibilidad
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-center">
            <div className="text-[9px] font-black text-zinc-400 uppercase">Citas Hoy</div>
            <div className="text-lg font-black text-zinc-950 dark:text-white">{totalCount}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 p-3 rounded-2xl text-center">
            <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Confirmadas</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{confirmedCount}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 p-3 rounded-2xl text-center">
            <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase">Pendientes</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1">
              <button
                onClick={() => setDate(moment(date).subtract(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all"
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
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <h2 className="text-lg font-black text-zinc-950 dark:text-white uppercase tracking-tight capitalize">
              {moment(date).format('MMMM YYYY')}
            </h2>
          </div>

          {/* View Buttons */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 text-xs font-black uppercase">
            <button
              onClick={() => setView('month')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                view === 'month' ? 'bg-black dark:bg-amber-400 text-white dark:text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Grid size={14} />
              <span>Mes</span>
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                view === 'week' ? 'bg-black dark:bg-amber-400 text-white dark:text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <CalendarDays size={14} />
              <span>Semana</span>
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                view === 'day' ? 'bg-black dark:bg-amber-400 text-white dark:text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Clock size={14} />
              <span>Día</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View Area */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-3xl shadow-xs min-h-[700px] flex flex-col flex-1 w-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400 font-bold py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-3" />
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
                setSelectedDayDate(slotInfo.start)
              }}
              onDrillDown={(drillDate) => {
                setSelectedDayDate(drillDate)
              }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event: { resource: Appointment }) => setSelectedEvent(event.resource)}
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

      {/* Day Overview Modal */}
      {selectedDayDate && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedDayDate(null)}
        >
          <div 
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-950 dark:text-white my-auto animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div>
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarIcon size={14} className="text-zinc-600 dark:text-zinc-400" />
                  Citas del Día
                </span>
                <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight capitalize mt-0.5">
                  {moment(selectedDayDate).format('dddd, D [de] MMMM YYYY')}
                </h3>
              </div>

              <button
                onClick={() => setSelectedDayDate(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {dayAppointments.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 font-bold">
                  No tienes citas agendadas para este día.
                </div>
              ) : (
                dayAppointments.map((appt) => {
                  const startTime = moment(appt.date).format('HH:mm')

                  return (
                    <div
                      key={appt.id}
                      onClick={() => {
                        setSelectedDayDate(null)
                        setSelectedEvent(appt)
                      }}
                      className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-zinc-950 dark:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-black font-mono shrink-0 text-center">
                          <div>{startTime}</div>
                          <div className="text-[9px] text-zinc-400 font-normal">{appt.service?.duration} min</div>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-zinc-950 dark:text-white group-hover:text-black dark:group-hover:text-amber-400 uppercase">
                            {appt.client?.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <Scissors size={13} className="text-zinc-400 shrink-0" />
                            <span>{appt.service?.name}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        appt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        appt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barber Detail Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-950 dark:text-white my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">
                  Gestión de Cita
                </span>
                <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-tight mt-0.5">
                  {selectedEvent.client?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-black uppercase">Estado actual</span>
                  <span className="font-black uppercase text-zinc-900 dark:text-white">{selectedEvent.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scissors size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <span className="font-bold text-zinc-900 dark:text-white">{selectedEvent.service?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">
                    {moment(selectedEvent.date).format('dddd D MMMM, HH:mm')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {selectedEvent.status === 'PENDING' && (
                  <button
                    onClick={() => updateStatus(selectedEvent.id, 'CONFIRMED')}
                    className="col-span-2 bg-black dark:bg-amber-400 hover:bg-zinc-800 dark:hover:bg-amber-300 text-white dark:text-zinc-950 font-black py-3 rounded-xl uppercase tracking-wider transition-all"
                  >
                    Confirmar Cita
                  </button>
                )}
                {['CONFIRMED', 'PENDING'].includes(selectedEvent.status) && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedEvent.id, 'COMPLETED')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl uppercase tracking-wider transition-all"
                    >
                      Completada
                    </button>
                    <button
                      onClick={() => updateStatus(selectedEvent.id, 'NO_SHOW')}
                      className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-black py-2.5 rounded-xl uppercase tracking-wider transition-all"
                    >
                      No Asistió
                    </button>
                    <button
                      onClick={() => updateStatus(selectedEvent.id, 'CANCELLED')}
                      className="col-span-2 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-black py-2.5 rounded-xl uppercase tracking-wider transition-all"
                    >
                      Cancelar Cita
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
