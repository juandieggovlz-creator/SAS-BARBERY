'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Phone,
  Mail,
  FileText,
  Save,
  ArrowLeft
} from 'lucide-react'

interface ClientDetailData {
  client: {
    id: string
    name: string
    phone: string
    email?: string | null
    internalNotes?: string | null
    createdAt: string
    appointments: Array<{
      id: string
      reservationCode: string
      date: string
      status: string
      service?: { name: string; price: number }
      barber?: { name: string }
    }>
  }
  stats: {
    totalVisits: number
    totalSpent: number
    lastVisit?: string | null
    nextVisit?: string | null
  }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ClientDetailData | null>(null)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const fetchClientDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setNotes(json.client.internalNotes || '')
      } else {
        toast.error('Cliente no encontrado')
        router.push('/clients')
      }
    } catch {
      toast.error('Error al cargar datos del cliente')
    } finally {
      setLoading(false)
    }
  }, [clientId, router])

  useEffect(() => {
    if (clientId) {
      fetchClientDetail()
    }
  }, [clientId, fetchClientDetail])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes })
      })

      if (res.ok) {
        toast.success('Notas del cliente guardadas')
      } else {
        toast.error('Error al guardar notas')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingNotes(false)
    }
  }

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return <div className="p-10 text-center text-xs font-bold uppercase tracking-wider text-zinc-400">Cargando expediente de cliente...</div>
  }

  if (!data) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header / Back link */}
      <div>
        <Link href="/clients" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-black mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a Clientes
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
              {data.client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tight">{data.client.name}</h2>
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 mt-1">
                <span className="flex items-center gap-1"><Phone size={14} /> {data.client.phone}</span>
                {data.client.email && <span className="flex items-center gap-1"><Mail size={14} /> {data.client.email}</span>}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full">
            Cliente desde {new Date(data.client.createdAt).toLocaleDateString('es-CO')}
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-1">Visitas Totales</span>
          <div className="text-2xl font-black text-zinc-950">{data.stats.totalVisits} visitas</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-1">Total Gastado</span>
          <div className="text-2xl font-black text-green-700">{formatCOP(data.stats.totalSpent)}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-1">Última Visita</span>
          <div className="text-sm font-black text-zinc-950 mt-1">
            {data.stats.lastVisit ? new Date(data.stats.lastVisit).toLocaleDateString('es-CO') : 'Sin visitas aún'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-1">Próxima Cita</span>
          <div className="text-sm font-black text-zinc-950 mt-1">
            {data.stats.nextVisit ? new Date(data.stats.nextVisit).toLocaleDateString('es-CO') : 'Sin cita agendada'}
          </div>
        </div>
      </div>

      {/* Two Column Section: Internal Notes + Appointment History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Private Internal Notes */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-zinc-900" />
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950">Notas Internas Privadas</h3>
          </div>
          <p className="text-[11px] text-zinc-400 font-bold leading-relaxed">
            Escribe preferencias del cliente (ej. degradado bajo, café sin azúcar, alergias, estilo favorito). Solo visibles para tu equipo.
          </p>
          <textarea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escribe notas sobre las preferencias del cliente..."
            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-900 outline-none focus:border-black transition-all"
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="w-full bg-black text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {savingNotes ? 'Guardando...' : 'Guardar Notas'}
          </button>
        </div>

        {/* Right 2 Cols: Appointment History */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950">Historial de Citas</h3>
            <span className="text-xs font-bold text-zinc-400">{data.client.appointments.length} citas registradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-100 text-[10px] text-zinc-400 uppercase tracking-wider">
                  <th className="px-5 py-3 font-extrabold">Fecha / Hora</th>
                  <th className="px-5 py-3 font-extrabold">Servicio</th>
                  <th className="px-5 py-3 font-extrabold">Barbero</th>
                  <th className="px-5 py-3 font-extrabold">Estado</th>
                  <th className="px-5 py-3 font-extrabold text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs font-bold">
                {data.client.appointments && data.client.appointments.length > 0 ? (
                  data.client.appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-4 text-zinc-950 font-black">
                        {new Date(appt.date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-4 text-zinc-700">{appt.service?.name}</td>
                      <td className="px-5 py-4 text-zinc-700">{appt.barber?.name}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-zinc-950">
                        {formatCOP(Number(appt.service?.price || 0))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 uppercase text-xs">Sin historial de citas registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
