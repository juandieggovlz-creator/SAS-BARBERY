'use client'

import React, { useState, useEffect } from 'react'
import {
  LifeBuoy,
  MessageSquare,
  Send,
  Building2,
  User,
  Clock,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  CheckCircle2,
  X,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface MessageItem {
  id: string
  senderName: string
  senderRole: string
  message: string
  createdAt: string
}

interface TicketItem {
  id: string
  ticketCode: string
  subject: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  businessId: string
  businessName: string
  businessSlug: string
  userEmail: string
  messagesCount: number
  messages: MessageItem[]
}

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  // Selected ticket for side drawer / discussion
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter)

      const res = await fetch(`/api/superadmin/support?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setTickets(json.tickets || [])
        if (selectedTicket) {
          const updatedSelected = (json.tickets || []).find((t: TicketItem) => t.id === selectedTicket.id)
          if (updatedSelected) setSelectedTicket(updatedSelected)
        }
      } else {
        toast.error('Error al cargar tickets de soporte')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [search, statusFilter, priorityFilter])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !replyMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/superadmin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          replyMessage: replyMessage.trim()
        })
      })

      if (res.ok) {
        toast.success('Respuesta enviada al negocio')
        setReplyMessage('')
        fetchTickets()
      } else {
        toast.error('No se pudo enviar la respuesta')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (ticketId: string, nextStatus: string) => {
    try {
      const res = await fetch('/api/superadmin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: nextStatus })
      })
      if (res.ok) {
        toast.success(`Ticket marcado como ${nextStatus}`)
        fetchTickets()
      }
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const formatStatus = (s: string) => {
    switch (s) {
      case 'OPEN': return 'Abierto'
      case 'IN_PROGRESS': return 'En proceso'
      case 'RESOLVED': return 'Resuelto'
      case 'CLOSED': return 'Cerrado'
      default: return s
    }
  }

  return (
    <div className="space-y-6 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <LifeBuoy className="w-3 h-3" />
              Mesa de Ayuda
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Módulo de Soporte ({tickets.length})
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Atención y seguimiento de tickets reportados por los dueños de barberías.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, asunto, usuario o negocio..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="OPEN">Abierto</option>
            <option value="IN_PROGRESS">En proceso</option>
            <option value="RESOLVED">Resuelto</option>
            <option value="CLOSED">Cerrado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      {/* ── TICKETS TABLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={selectedTicket ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
                <span className="text-xs font-semibold text-zinc-400">Cargando tickets de soporte...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <LifeBuoy className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-bold text-zinc-700">No hay tickets registrados</p>
                <p className="text-xs">Los tickets creados por barberías se mostrarán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      <th className="py-4 px-5">Negocio</th>
                      <th className="py-4 px-4">Usuario</th>
                      <th className="py-4 px-4">Fecha</th>
                      <th className="py-4 px-4">Prioridad</th>
                      <th className="py-4 px-4">Estado</th>
                      <th className="py-4 px-4 text-right">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {tickets.map(t => {
                      const isSelected = selectedTicket?.id === t.id
                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className={`hover:bg-zinc-50/80 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          {/* Negocio */}
                          <td className="py-4 px-5 font-bold text-zinc-950">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="truncate max-w-[150px]">{t.businessName}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-[150px]">
                              {t.subject}
                            </div>
                          </td>

                          {/* Usuario */}
                          <td className="py-4 px-4 text-zinc-600 font-mono text-[11px]">
                            {t.userEmail}
                          </td>

                          {/* Fecha */}
                          <td className="py-4 px-4 text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </td>

                          {/* Prioridad */}
                          <td className="py-4 px-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              t.priority === 'URGENT'
                                ? 'bg-rose-100 text-rose-800'
                                : t.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {t.priority}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              t.status === 'OPEN'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : t.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}>
                              {formatStatus(t.status)}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <ChevronRight className="w-4 h-4 text-zinc-400 inline" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Selected Ticket Drawer / Conversation */}
        {selectedTicket && (
          <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-2xl shadow-xs p-6 flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-start justify-between border-b border-zinc-100 pb-3 mb-4">
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 font-bold mb-0.5">
                    Ticket #{selectedTicket.ticketCode} • {selectedTicket.businessName}
                  </div>
                  <h3 className="text-base font-bold text-zinc-950">
                    {selectedTicket.subject}
                  </h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Switcher Buttons */}
              <div className="p-2.5 bg-zinc-50 rounded-xl flex items-center justify-between gap-2 mb-4 text-xs">
                <span className="font-semibold text-zinc-500 text-[11px]">Estado:</span>
                <div className="flex gap-1">
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedTicket.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-zinc-950 text-white'
                          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {formatStatus(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl text-xs text-zinc-700 mb-4">
                <div className="text-[10px] font-black uppercase text-zinc-400 mb-1">Descripción:</div>
                {selectedTicket.description}
              </div>

              {/* Message thread */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {selectedTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs max-w-[85%] ${
                      msg.senderRole === 'SUPER_ADMIN'
                        ? 'ml-auto bg-zinc-950 text-white'
                        : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
                    }`}
                  >
                    <div className="text-[9px] opacity-70 mb-1 font-bold">{msg.senderName}</div>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply composer */}
            <form onSubmit={handleSendReply} className="mt-4 pt-3 border-t border-zinc-100 flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Escribe una respuesta para el negocio..."
                className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:border-zinc-950"
              />
              <button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="px-4 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
