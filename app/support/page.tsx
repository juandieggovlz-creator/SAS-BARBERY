'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  LifeBuoy,
  MessageSquare,
  Send,
  Plus,
  X,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Inbox,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TicketMessage {
  id: string
  senderName: string
  senderRole: string
  message: string
  createdAt: string
}

interface Ticket {
  id: string
  ticketCode: string
  subject: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  OPEN: {
    label: 'Abierto',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500'
  },
  IN_PROGRESS: {
    label: 'En proceso',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500'
  },
  RESOLVED: {
    label: 'Resuelto',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500'
  },
  CLOSED: {
    label: 'Cerrado',
    className: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    dot: 'bg-zinc-400'
  }
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Baja', className: 'bg-zinc-100 text-zinc-600' },
  MEDIUM: { label: 'Media', className: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'Alta', className: 'bg-amber-100 text-amber-700' },
  URGENT: { label: 'Urgente', className: 'bg-rose-100 text-rose-700' }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return `Hace ${d}d`
}

// ─── New Ticket Modal ──────────────────────────────────────────────────────────

function NewTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error('El asunto y la descripción son obligatorios')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), priority })
      })

      if (res.ok) {
        toast.success('¡Ticket creado! Te responderemos pronto.')
        onCreated()
        onClose()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al crear el ticket')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-zinc-950 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-white">Nuevo Ticket</h2>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Soporte BarberOS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
              Asunto *
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ej: No puedo acceder al módulo de pagos"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white transition-all"
              maxLength={120}
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
              Prioridad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${
                    priority === p
                      ? p === 'URGENT' ? 'bg-rose-600 text-white border-rose-600'
                        : p === 'HIGH' ? 'bg-amber-500 text-white border-amber-500'
                        : p === 'MEDIUM' ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-zinc-800 text-white border-zinc-800'
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
              Descripción detallada *
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe el problema con el mayor detalle posible: qué ocurrió, cuándo, qué pasos seguiste..."
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none h-28 leading-relaxed"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !subject.trim() || !description.trim()}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
            ) : (
              <><Send className="w-4 h-4" />Enviar Ticket</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      if (res.ok) {
        const json = await res.json()
        const list: Ticket[] = json.tickets || []
        setTickets(list)
        // Update selected if it was open
        if (selected) {
          const updated = list.find(t => t.id === selected.id)
          if (updated) setSelected(updated)
        }
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !reply.trim()) return

    setSending(true)
    try {
      const res = await fetch(`/api/support/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() })
      })
      if (res.ok) {
        toast.success('Mensaje enviado')
        setReply('')
        fetchTickets()
      } else {
        toast.error('No se pudo enviar el mensaje')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  // Filter
  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.ticketCode.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  // Stats
  const openCount = tickets.filter(t => t.status === 'OPEN').length
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-900 text-white">
              Centro de Ayuda
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-amber-500" />
            Soporte BarberOS
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Reporta problemas o consultas. Nuestro equipo te responderá pronto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowNew(true)}
            id="new-support-ticket"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 text-white rounded-2xl text-xs font-black uppercase tracking-wide hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Abiertos', value: openCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
          { label: 'En proceso', value: inProgressCount, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: MessageSquare },
          { label: 'Resueltos', value: resolvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 }
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className={`p-4 rounded-2xl border ${bg} flex items-center gap-3`}
          >
            <Icon className={`w-5 h-5 ${color} shrink-0`} />
            <div>
              <div className={`text-xl font-black ${color}`}>{value}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Ticket List ── */}
        <div className={selected ? 'lg:col-span-5' : 'lg:col-span-12'}>
          {/* Search + Filter */}
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar ticket..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-400 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 outline-none cursor-pointer focus:border-zinc-400"
            >
              <option value="ALL">Todos</option>
              <option value="OPEN">Abiertos</option>
              <option value="IN_PROGRESS">En proceso</option>
              <option value="RESOLVED">Resueltos</option>
              <option value="CLOSED">Cerrados</option>
            </select>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                <span className="text-xs font-bold text-zinc-400">Cargando tickets...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-1">
                  <Inbox className="w-7 h-7 text-zinc-300" />
                </div>
                <p className="text-sm font-black text-zinc-700 uppercase tracking-tight">Sin tickets</p>
                <p className="text-xs text-zinc-400 max-w-[200px]">
                  {tickets.length === 0
                    ? '¡Todo bien! No has reportado ningún problema todavía.'
                    : 'No hay tickets que coincidan con tu búsqueda.'}
                </p>
                {tickets.length === 0 && (
                  <button
                    onClick={() => setShowNew(true)}
                    className="mt-2 px-4 py-2 bg-zinc-950 text-white rounded-xl text-[11px] font-black uppercase tracking-wide hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear primer ticket
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filtered.map(ticket => {
                  const statusCfg = STATUS_CONFIG[ticket.status]
                  const isActive = selected?.id === ticket.id

                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelected(ticket)}
                      className={`w-full text-left p-4 transition-all hover:bg-zinc-50/80 ${
                        isActive ? 'bg-amber-50/60 border-l-2 border-l-amber-400' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${PRIORITY_CONFIG[ticket.priority].className}`}>
                              {PRIORITY_CONFIG[ticket.priority].label}
                            </span>
                          </div>
                          <p className="text-xs font-black text-zinc-900 truncate">{ticket.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-400 font-mono">#{ticket.ticketCode.slice(-6).toUpperCase()}</span>
                            <span className="text-[10px] text-zinc-400">·</span>
                            <span className="text-[10px] text-zinc-400">{timeAgo(ticket.updatedAt)}</span>
                            {ticket.messages.length > 0 && (
                              <>
                                <span className="text-[10px] text-zinc-400">·</span>
                                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  {ticket.messages.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0 mt-1" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Ticket Detail / Chat ── */}
        {selected && (
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col" style={{ height: '600px' }}>

            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-100 flex items-start gap-3 bg-zinc-50/60">
              <button
                onClick={() => setSelected(null)}
                className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    #{selected.ticketCode.slice(-6).toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${STATUS_CONFIG[selected.status].className}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status].dot}`} />
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${PRIORITY_CONFIG[selected.priority].className}`}>
                    {PRIORITY_CONFIG[selected.priority].label}
                  </span>
                </div>
                <h3 className="text-sm font-black text-zinc-950 mt-1 truncate">
                  {selected.subject}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Creado {timeAgo(selected.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="hidden lg:flex p-1.5 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Description bubble (first message) */}
              <div className="flex flex-col items-start max-w-[85%]">
                <span className="text-[9px] font-bold text-zinc-400 mb-1 ml-1">
                  Descripción inicial
                </span>
                <div className="bg-zinc-100 rounded-2xl rounded-tl-sm p-3.5 text-xs text-zinc-800 leading-relaxed font-medium">
                  {selected.description}
                </div>
              </div>

              {/* Thread messages */}
              {selected.messages.map(msg => {
                const isAdmin = msg.senderRole === 'SUPER_ADMIN'
                const isOwn = !isAdmin

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'} max-w-[85%] ${isAdmin ? 'ml-0' : 'ml-auto'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span className="text-[9px] font-bold text-amber-600">BarberOS Support</span>
                        </div>
                      )}
                      {!isAdmin && (
                        <span className="text-[9px] font-bold text-zinc-400">{msg.senderName}</span>
                      )}
                      <span className="text-[9px] text-zinc-300">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed font-medium ${
                      isAdmin
                        ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-tl-sm'
                        : 'bg-zinc-100 text-zinc-800 rounded-tr-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                )
              })}

              {selected.messages.length === 0 && (
                <div className="text-center py-6 text-zinc-400">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-20 mb-2" />
                  <p className="text-xs font-bold">En espera de respuesta del equipo BarberOS</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            {selected.status !== 'CLOSED' && (
              <div className="p-4 border-t border-zinc-100">
                {selected.status === 'RESOLVED' && (
                  <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-700">
                      Este ticket está marcado como resuelto. Puedes responder si aún tienes preguntas.
                    </p>
                  </div>
                )}
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="px-4 py-2.5 bg-zinc-950 text-white rounded-2xl text-xs font-black uppercase tracking-wide hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span className="hidden sm:block">Enviar</span>
                  </button>
                </form>
              </div>
            )}

            {selected.status === 'CLOSED' && (
              <div className="p-4 border-t border-zinc-100 text-center">
                <p className="text-[11px] font-bold text-zinc-400">
                  Este ticket está cerrado. Crea un nuevo ticket si necesitas ayuda adicional.
                </p>
                <button
                  onClick={() => { setSelected(null); setShowNew(true) }}
                  className="mt-2 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all"
                >
                  Nuevo Ticket
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Help Banner ── */}
      {!selected && (
        <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 rounded-3xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white">¿Necesitas ayuda?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Nuestro equipo de soporte responde en menos de 24 horas hábiles. Cuéntanos tu problema con el mayor detalle posible.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-lg shadow-amber-400/20"
            >
              Abrir Ticket
            </button>
          </div>
        </div>
      )}

      {/* ── New Ticket Modal ── */}
      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={fetchTickets}
        />
      )}
    </div>
  )
}
