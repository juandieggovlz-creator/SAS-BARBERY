'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Clock, Check, X, Calendar as CalendarIcon, Send, AlertCircle, Loader2 } from 'lucide-react'

const DAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
]

interface ScheduleItem {
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorking: boolean
  id?: string
}

interface LeaveRequest {
  id: string
  date: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  // Leave requests state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/barber/schedule')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setSchedules(data)
        } else {
          // Show empty state — no schedule assigned yet
          setSchedules([])
        }
      } else {
        setSchedules([])
      }
    } catch {
      toast.error('Error al cargar horario')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveDate || !leaveReason) {
      toast.error('Por favor completa todos los campos')
      return
    }

    const newReq: LeaveRequest = {
      id: Date.now().toString(),
      date: leaveDate,
      reason: leaveReason,
      status: 'PENDING'
    }

    setLeaveRequests([newReq, ...leaveRequests])
    toast.success('Solicitud enviada al dueño')
    setLeaveDate('')
    setLeaveReason('')
    setLeaveModalOpen(false)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cargando tu horario...</span>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-950 text-white">
              Horario del Negocio
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter mt-1">Mi Horario de Trabajo</h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Horario asignado por la administración de la barbería. Para solicitar días libres o cambios, utiliza el botón de solicitud.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLeaveModalOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-md active:scale-95"
          >
            <CalendarIcon size={16} />
            <span>Solicitar Día Libre</span>
          </button>
        </div>
      </header>

      {/* BANNER INFORMATIVO */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900 font-medium">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          <strong>Nota:</strong> Los turnos y días laborales son establecidos exclusivamente por el administrador de la barbería. Aquí solo puedes consultar tu horario vigente.
        </span>
      </div>

      {/* HORARIO SEMANAL (SOLO LECTURA) */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Jornada Semanal Asignada</h3>

        {schedules.length === 0 ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-10 text-center space-y-3">
            <Clock className="w-10 h-10 text-zinc-300 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-700">Sin horario asignado aún</h4>
            <p className="text-xs text-zinc-400">El administrador aún no ha configurado tu horario. Contáctalo para que lo defina.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {schedules.map((s) => (
              <div
                key={s.dayOfWeek}
                className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                  s.isWorking ? 'bg-white border-zinc-200 shadow-2xs' : 'bg-zinc-50 border-zinc-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4 w-full md:w-56">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    s.isWorking ? 'bg-zinc-950 text-white' : 'bg-zinc-200 text-zinc-500'
                  }`}>
                    {s.isWorking ? <Check size={18} /> : <X size={18} />}
                  </div>
                  <div>
                    <div className="text-base font-black text-black uppercase">{DAYS[s.dayOfWeek]}</div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      s.isWorking ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      {s.isWorking ? 'Jornada Laboral' : 'Día Libre'}
                    </span>
                  </div>
                </div>

                {s.isWorking ? (
                  <div className="flex items-center gap-2 text-sm font-black text-zinc-900 bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl">
                    <Clock size={16} className="text-zinc-500" />
                    <span>{s.startTime} hrs</span>
                    <span className="text-zinc-400 font-normal">a</span>
                    <span>{s.endTime} hrs</span>
                  </div>
                ) : (
                  <div className="text-right text-zinc-400 font-black text-xs uppercase tracking-widest">
                    Descanso Programado
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* VACACIONES Y AUSENCIAS */}
      <section className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-black uppercase tracking-tight">Solicitudes de Días Libres</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Historial de tus solicitudes enviadas al dueño</p>
          </div>
        </div>

        {leaveRequests.length === 0 ? (
          <p className="text-xs font-bold text-zinc-400 uppercase py-4">No tienes solicitudes pendientes ni pasadas</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {leaveRequests.map((req) => (
              <div key={req.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-black">{req.date}</div>
                  <div className="text-xs text-zinc-500 font-medium">{req.reason}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                  req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {req.status === 'APPROVED' ? 'Aprobado' : req.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL SOLICITAR DIA LIBRE */}
      {leaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-zinc-200 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Solicitar Día Libre</h3>
              <button onClick={() => setLeaveModalOpen(false)} className="text-zinc-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestLeave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 ml-1">Fecha solicitada</label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-black focus:border-black outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 ml-1">Motivo / Observación</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Ej. Cita médica, asunto personal..."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-black focus:border-black outline-none resize-none"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
