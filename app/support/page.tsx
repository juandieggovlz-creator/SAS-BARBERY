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
  ArrowLeft,
  Mail,
  RotateCcw,
  Tag,
  Copy,
  Check,
  ExternalLink
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
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-500'
  },
  IN_PROGRESS: {
    label: 'En proceso',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    dot: 'bg-blue-500'
  },
  RESOLVED: {
    label: 'Resuelto',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-500'
  },
  CLOSED: {
    label: 'Cerrado',
    className: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20',
    dot: 'bg-zinc-400'
  }
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Baja', className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' },
  MEDIUM: { label: 'Media', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
  HIGH: { label: 'Alta', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
  URGENT: { label: 'Urgente', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' }
}

const CATEGORIES = [
  { id: 'GENERAL', label: 'General / Plataforma' },
  { id: 'RESERVAS', label: 'Reservas & Agenda' },
  { id: 'PAGOS', label: 'Facturación & Planes' },
  { id: 'WHATSAPP', label: 'WhatsApp & Meta API' },
  { id: 'PERSONAL', label: 'Barberos & Equipo' }
]

function formatTicketCode(code: string): string {
  if (!code) return '#SUP-000000'
  if (code.startsWith('SUP-')) return `#${code}`
  return `#SUP-${code.slice(-6).toUpperCase()}`
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
  const [category, setCategory] = useState('GENERAL')
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
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          description: description.trim(),
          priority
        })
      })

      if (res.ok) {
        toast.success('¡Ticket creado! Nuestro equipo te responderá pronto.')
        onCreated()
        onClose()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al crear el ticket')
      }
    } catch {
      toast.error('Error de conexión al enviar el ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-zinc-950 p-6 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-white">Nuevo Ticket de Soporte</h2>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Atención directa del equipo BarberOS Master</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-amber-500" />
              Categoría
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-1.5">
              Asunto del Ticket *
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ej: Inconveniente con las confirmaciones de WhatsApp"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all placeholder:text-zinc-400"
              maxLength={120}
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-1.5">
              Nivel de Prioridad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border cursor-pointer ${
                    priority === p
                      ? p === 'URGENT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30'
                        : p === 'HIGH'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30'
                        : p === 'MEDIUM'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30'
                        : 'bg-zinc-800 text-white border-zinc-800'
                      : 'bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-1.5">
              Descripción del Problema *
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe lo ocurrido detallando los pasos que seguiste, qué mensaje apareció y cómo podemos ayudarte..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all resize-none h-28 leading-relaxed placeholder:text-zinc-400"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !subject.trim() || !description.trim()}
            className="w-full py-3.5 panel-btn-accent disabled:opacity-50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creando Ticket...</>
            ) : (
              <><Send className="w-4 h-4" /> Enviar Ticket</>
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
  const [reopening, setReopening] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('barberos.contacto@gmail.com')
    setCopiedEmail(true)
    toast.success('Correo copiado al portapapeles', {
      description: 'barberos.contacto@gmail.com'
    })
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      if (res.ok) {
        const json = await res.json()
        const list: Ticket[] = json.tickets || []
        setTickets(list)
        // Actualizar seleccionado si está abierto
        if (selected) {
          const updated = list.find(t => t.id === selected.id)
          if (updated) setSelected(updated)
        }
      }
    } catch {
      toast.error('Error de conexión al cargar tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // Auto-scroll del chat al fondo
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
        toast.success('Mensaje enviado al equipo de soporte')
        setReply('')
        fetchTickets()
      } else {
        const err = await res.json()
        toast.error(err.error || 'No se pudo enviar el mensaje')
      }
    } catch {
      toast.error('Error de conexión al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleReopenTicket = async () => {
    if (!selected) return
    setReopening(true)
    try {
      const res = await fetch(`/api/support/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REOPEN',
          message: 'He reabierto este ticket porque el inconveniente aún persiste.'
        })
      })
      if (res.ok) {
        toast.success('Ticket reabierto exitosamente')
        fetchTickets()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al reabrir ticket')
      }
    } catch {
      toast.error('Error de conexión al reabrir ticket')
    } finally {
      setReopening(false)
    }
  }

  // Filtrado reactivo
  const filtered = tickets.filter(t => {
    const matchSearch =
      !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketCode.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  // Contadores
  const openCount = tickets.filter(t => t.status === 'OPEN').length
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-950 dark:bg-zinc-800 text-white border border-zinc-800 dark:border-zinc-700">
              Centro de Ayuda Oficial
            </span>
            <span className="text-[10px] font-bold text-zinc-400">
              Soporte 24/7
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-amber-500 shrink-0" />
            Soporte BarberOS
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
            Reporta inconvenientes técnicos o consultas operativas. Nuestro equipo central te responderá y dará seguimiento en este panel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowNew(true)}
            id="new-support-ticket"
            className="panel-btn-accent flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* ── Official Contact Pill ── */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="font-black text-zinc-950 dark:text-white uppercase tracking-tight text-xs block">
              Canal Oficial de Correo
            </span>
            <span className="text-zinc-600 dark:text-zinc-400 text-xs">
              Para consultas institucionales, acuerdos o adjuntos formales:{' '}
            </span>
            <button
              onClick={handleCopyEmail}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              title="Clic para copiar correo"
            >
              barberos.contacto@gmail.com
              {copiedEmail ? <Check className="w-3 h-3 text-emerald-500 inline" /> : <Copy className="w-3 h-3 inline opacity-70" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyEmail}
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Copiar dirección de correo"
          >
            {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEmail ? 'Copiado' : 'Copiar Correo'}</span>
          </button>
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=barberos.contacto@gmail.com&su=Consulta%20Soporte%20BarberOS"
            target="_blank"
            rel="noopener noreferrer"
            className="panel-btn-accent px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            title="Abrir redacción en Gmail Web"
          >
            <span>Abrir en Gmail</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Abiertos', value: openCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
          { label: 'En proceso', value: inProgressCount, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: MessageSquare },
          { label: 'Resueltos', value: resolvedCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 }
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className={`p-4 rounded-3xl border ${bg} flex items-center gap-3.5 shadow-xs`}
          >
            <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
            </div>
            <div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</div>
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
                placeholder="Buscar por asunto, código o descripción..."
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all placeholder:text-zinc-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer focus:border-amber-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="OPEN">Abiertos</option>
              <option value="IN_PROGRESS">En proceso</option>
              <option value="RESOLVED">Resueltos</option>
              <option value="CLOSED">Cerrados</option>
            </select>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs font-bold text-zinc-400">Consultando tickets de tu barbería...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-1">
                  <Inbox className="w-7 h-7 text-zinc-400" />
                </div>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">Sin tickets</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] leading-relaxed">
                  {tickets.length === 0
                    ? '¡Todo en orden! No tienes solicitudes de soporte abiertas actualmente.'
                    : 'No hay tickets que coincidan con los filtros aplicados.'}
                </p>
                {tickets.length === 0 && (
                  <button
                    onClick={() => setShowNew(true)}
                    className="panel-btn-accent mt-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear primer ticket
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filtered.map(ticket => {
                  const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN
                  const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM
                  const isActive = selected?.id === ticket.id

                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelected(ticket)}
                      className={`w-full text-left p-4.5 transition-all hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 cursor-pointer ${
                        isActive ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${priorityCfg.className}`}>
                              {priorityCfg.label}
                            </span>
                          </div>
                          <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{ticket.subject}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-zinc-500 dark:text-zinc-400">
                            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                              {formatTicketCode(ticket.ticketCode)}
                            </span>
                            <span className="text-[10px]">·</span>
                            <span className="text-[10px]">{timeAgo(ticket.updatedAt)}</span>
                            {ticket.messages && ticket.messages.length > 0 && (
                              <>
                                <span className="text-[10px]">·</span>
                                <span className="text-[10px] flex items-center gap-1 font-semibold">
                                  <MessageSquare className="w-2.5 h-2.5 text-zinc-400" />
                                  {ticket.messages.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 mt-2" />
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
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden flex flex-col" style={{ minHeight: '620px', height: '620px' }}>
            {/* Chat Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start gap-3 bg-zinc-50/80 dark:bg-zinc-950/40">
              <button
                onClick={() => setSelected(null)}
                className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatTicketCode(selected.ticketCode)}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${STATUS_CONFIG[selected.status]?.className || ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status]?.dot || ''}`} />
                    {STATUS_CONFIG[selected.status]?.label || selected.status}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${PRIORITY_CONFIG[selected.priority]?.className || ''}`}>
                    {PRIORITY_CONFIG[selected.priority]?.label || selected.priority}
                  </span>
                </div>
                <h3 className="text-sm font-black text-zinc-950 dark:text-white mt-1 truncate">
                  {selected.subject}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Reportado {timeAgo(selected.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="hidden lg:flex p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Description bubble (Initial problem report) */}
              <div className="flex flex-col items-start max-w-[85%]">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-1">
                  Descripción Inicial del Problema
                </span>
                <div className="bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl rounded-tl-sm p-3.5 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium border border-zinc-200/50 dark:border-zinc-700/50">
                  {selected.description}
                </div>
              </div>

              {/* Thread messages */}
              {selected.messages && selected.messages.map(msg => {
                const isAdmin = msg.senderRole === 'SUPER_ADMIN'

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'} max-w-[85%] ${isAdmin ? 'ml-0' : 'ml-auto'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {isAdmin ? (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">BarberOS Support</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">{msg.senderName}</span>
                      )}
                      <span className="text-[9px] text-zinc-400">· {timeAgo(msg.createdAt)}</span>
                    </div>
                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed font-medium ${
                      isAdmin
                        ? 'bg-zinc-950 dark:bg-zinc-800 text-white border border-zinc-800 dark:border-zinc-700 rounded-tl-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-tr-sm border border-zinc-200/50 dark:border-zinc-700/50'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                )
              })}

              {(!selected.messages || selected.messages.length === 0) && (
                <div className="text-center py-8 text-zinc-400">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p className="text-xs font-bold">En espera de respuesta del equipo BarberOS Master</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Composer & Status Actions */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40">
              {/* Banner de ticket resuelto */}
              {selected.status === 'RESOLVED' && (
                <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate">
                      Este ticket fue marcado como resuelto. Si el problema persiste puedes reabrirlo.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={reopening}
                    onClick={handleReopenTicket}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    {reopening ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Reabrir Caso
                  </button>
                </div>
              )}

              {/* Banner de ticket cerrado */}
              {selected.status === 'CLOSED' && (
                <div className="mb-3 p-3 bg-zinc-500/10 border border-zinc-500/25 rounded-2xl flex items-center justify-between gap-3 text-center">
                  <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Este ticket está archivado y cerrado.
                  </p>
                  <button
                    type="button"
                    disabled={reopening}
                    onClick={handleReopenTicket}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    {reopening ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Solicitar Reapertura
                  </button>
                </div>
              )}

              {/* Formulario de respuesta */}
              <form onSubmit={handleReply} className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Escribe tu mensaje para soporte..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 transition-all placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="px-4 py-2.5 panel-btn-accent rounded-2xl text-xs font-black uppercase tracking-wide disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Help Banner ── */}
      {!selected && (
        <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 rounded-3xl p-6 sm:p-8 text-white border border-zinc-800 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-white">¿Tienes dudas con tu barbería?</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  Nuestro equipo de soporte técnico responde directamente en menos de 24 horas hábiles. Describe tu caso para que podamos darte solución inmediata.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="panel-btn-accent px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-lg cursor-pointer shrink-0 active:scale-95"
            >
              Abrir Nuevo Ticket
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
