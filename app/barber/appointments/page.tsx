'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Clock, Phone, Calendar } from 'lucide-react'

interface BarberAppointment {
  id: string
  date: string
  status: string
  client?: { name: string; phone: string }
  service?: { name: string; duration: number }
}

export default function MisCitasPage() {
  const [appointments, setAppointments] = useState<BarberAppointment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppointmentsSilently = async () => {
    try {
      const res = await fetch('/api/appointments')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setAppointments(data)
      }
    } catch {
      // silent background refresh
    }
  }

  useEffect(() => {
    fetchAppointments()

    const handleNewReservation = () => {
      fetchAppointmentsSilently()
    }
    window.addEventListener('new-appointment-registered', handleNewReservation)

    const interval = setInterval(fetchAppointmentsSilently, 4000)

    return () => {
      window.removeEventListener('new-appointment-registered', handleNewReservation)
      clearInterval(interval)
    }
  }, [])

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setAppointments(data)
        }
      }
    } catch {
      toast.error('Error al cargar citas')
    } finally {
      setLoading(false)
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
        fetchAppointments()
      } else {
        toast.error('Error al actualizar estado')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  if (loading) return <div className="p-10 text-zinc-500 font-bold uppercase text-xs">Cargando citas...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h2 className="text-5xl font-black text-black uppercase tracking-tighter">Mis Citas</h2>
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2 ml-1">Listado Completo de Agenda Asignada</p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Servicio / Hora</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Calendar className="mx-auto text-zinc-200 mb-4" size={48} />
                    <p className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">No tienes citas registradas</p>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-black text-lg">
                          {appt.client?.name ? appt.client.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="text-sm font-black text-black uppercase">{appt.client?.name || 'Cliente sin nombre'}</div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                            <Phone size={10} /> {appt.client?.phone || 'Sin teléfono'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <div className="text-sm font-black text-black uppercase">{appt.service?.name || 'Servicio'}</div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 mt-1 uppercase">
                          <Clock size={12} /> {new Date(appt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • {appt.service?.duration || 30} min
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <select
                        data-status-badge="true"
                        value={appt.status}
                        onChange={(e) => updateStatus(appt.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all shadow-2xs ${
                          appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60' :
                          appt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/60' :
                          appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/60' :
                          appt.status === 'NO_SHOW' ? 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' :
                          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60'
                        }`}
                      >
                        <option value="PENDING" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">PENDIENTE</option>
                        <option value="CONFIRMED" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">CONFIRMADA</option>
                        <option value="COMPLETED" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">COMPLETADA</option>
                        <option value="CANCELLED" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">CANCELADA</option>
                        <option value="NO_SHOW" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">NO ASISTIÓ</option>
                      </select>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {appt.status !== 'CONFIRMED' && appt.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                            className="p-2 bg-black text-white rounded-xl hover:bg-zinc-800 transition-all text-xs font-bold"
                            title="Confirmar Cita"
                          >
                            Confirmar
                          </button>
                        )}
                        {appt.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => updateStatus(appt.id, 'COMPLETED')}
                            className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all text-xs font-bold"
                            title="Marcar Completada"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
