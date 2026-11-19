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
  ChevronRight,
  ShieldAlert,
  Sparkles
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
  userName?: string
  messagesCount: number
  messages: MessageItem[]
}

function formatTicketCode(code: string): string {
  if (!code) return '#SUP-000000'
  if (code.startsWith('SUP-')) return `#${code}`
  return `#SUP-${code.slice(-6).toUpperCase()}`
}

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [counts, setCounts] = useState<{ open: number; inProgress: number; resolved: number; total: number }>({
    open: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  })
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
        if (json.counts) {
          setCounts(json.counts)
        }
        if (selectedTicket) {
          const updatedSelected = (json.tickets || []).find((t: TicketItem) => t.id === selectedTicket.id)
          if (updatedSelected) setSelectedTicket(updatedSelected)
        }
      } else {
        toast.error('Error al cargar tickets de soporte')
      }
    } catch {
      toast.error('Error de conexión al cargar tickets')
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
        toast.success('Respuesta enviada y notificada por correo al negocio ✉️')
        setReplyMessage('')
        fetchTickets()
      } else {
        const err = await res.json()
        toast.error(err.error || 'No se pudo enviar la respuesta')
      }
    } catch {
      toast.error('Error de conexión al enviar respuesta')
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
        toast.success(`Ticket actualizado a estado ${formatStatus(nextStatus)}`)
        fetchTickets()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al cambiar estado')
      }
    } catch {
      toast.error('Error de conexión al actualizar estado')
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
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <LifeBuoy className="w-3 h-3" />
              Mesa de Ayuda Master
            </span>
            <span className="text-[10px] font-bold text-zinc-400">
              Gestión Multinegocio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            Módulo de Soporte ({counts.total})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Atención centralizada y seguimiento en tiempo real de requerimientos técnicos de barberías.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── MACRO COUNTERS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{counts.open}</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5">Tickets Abiertos</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{counts.inProgress}</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5">En Proceso</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{counts.resolved}</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5">Resueltos / Cerrados</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, asunto, usuario o negocio..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-amber-500"
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
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-amber-500"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      {/* ── TICKETS TABLE & CONVERSATION DRAWER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={selectedTicket ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs font-semibold text-zinc-400">Cargando tickets de soporte...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <LifeBuoy className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No hay tickets registrados</p>
                <p className="text-xs">Los tickets creados por barberías se mostrarán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/30">
                      <th className="py-3 px-5">Negocio & Asunto</th>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Prioridad</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                    {tickets.map(t => {
                      const isSelected = selectedTicket?.id === t.id

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          {/* Negocio */}
                          <td className="py-4 px-5 font-bold text-zinc-950 dark:text-zinc-100">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="truncate max-w-[170px]">{t.businessName}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-[170px]">
                              {formatTicketCode(t.ticketCode)} · {t.subject}
                            </div>
                          </td>

                          {/* Usuario */}
                          <td className="py-4 px-4 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                            {t.userEmail}
                          </td>

                          {/* Fecha */}
                          <td className="py-4 px-4 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </td>

                          {/* Prioridad */}
                          <td className="py-4 px-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              t.priority === 'URGENT'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : t.priority === 'HIGH'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : t.priority === 'MEDIUM'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {t.priority}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              t.status === 'OPEN'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                : t.status === 'RESOLVED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20'
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
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs p-6 flex flex-col justify-between min-h-[550px]">
            <div>
              <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                <div>
                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold mb-0.5">
                    Ticket {formatTicketCode(selectedTicket.ticketCode)} • {selectedTicket.businessName}
                  </div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Cliente: <span className="font-mono text-zinc-700 dark:text-zinc-300">{selectedTicket.userEmail}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Switcher Buttons */}
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl flex items-center justify-between gap-2 mb-4 text-xs border border-zinc-200/50 dark:border-zinc-800">
                <span className="font-semibold text-zinc-500 text-[11px]">Estado del Ticket:</span>
                <div className="flex gap-1 flex-wrap">
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedTicket.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {formatStatus(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Descripción reportada por la barbería:</div>
                {selectedTicket.description}
              </div>

              {/* Message thread */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {selectedTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs max-w-[85%] ${
                      msg.senderRole === 'SUPER_ADMIN'
                        ? 'ml-auto bg-zinc-950 dark:bg-zinc-800 text-white border border-zinc-800 dark:border-zinc-700'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="text-[9px] opacity-70 mb-1 font-bold flex items-center justify-between gap-2">
                      <span>{msg.senderName} ({msg.senderRole})</span>
                      <span className="font-mono text-[9px] opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply composer */}
            <form onSubmit={handleSendReply} className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Escribe una respuesta para el propietario (se enviará por correo también)..."
                className="flex-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="px-4 py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Responder</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
