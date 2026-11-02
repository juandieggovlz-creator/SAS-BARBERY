'use client'

import React, { useState, useEffect } from 'react'
import {
  LifeBuoy,
  MessageSquare,
  Plus,
  Send,
  Loader2,
  RefreshCw,
  X,
  HelpCircle,
  Sparkles
} from 'lucide-react'
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
  messages: MessageItem[]
}

export default function BarberSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [creating, setCreating] = useState(false)

  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      if (res.ok) {
        const json = await res.json()
        setTickets(json.tickets || [])
        if (selectedTicket) {
          const updated = (json.tickets || []).find((t: TicketItem) => t.id === selectedTicket.id)
          if (updated) setSelectedTicket(updated)
        }
      }
    } catch {
      toast.error('Error al cargar tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), priority })
      })

      const json = await res.json()
      if (res.ok) {
        toast.success('Ticket enviado al equipo de soporte de BarberOS')
        setModalOpen(false)
        setSubject('')
        setDescription('')
        fetchTickets()
        if (json.ticket) setSelectedTicket(json.ticket)
      } else {
        toast.error(json.error || 'Error al enviar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !replyMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() })
      })

      if (res.ok) {
        toast.success('Mensaje enviado')
        setReplyMessage('')
        fetchTickets()
      } else {
        toast.error('No se pudo enviar el mensaje')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setSending(false)
    }
  }

  const formatStatus = (st: string) => {
    switch (st) {
      case 'OPEN': return { label: 'Abierto', class: 'bg-amber-50 text-amber-800' }
      case 'IN_PROGRESS': return { label: 'En proceso', class: 'bg-blue-50 text-blue-800' }
      case 'RESOLVED': return { label: 'Resuelto', class: 'bg-emerald-50 text-emerald-800' }
      case 'CLOSED': return { label: 'Cerrado', class: 'bg-zinc-100 text-zinc-700' }
      default: return { label: st, class: 'bg-zinc-100 text-zinc-700' }
    }
  }

  return (
    <div className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black text-white">
              Centro de Ayuda BarberOS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-amber-500" />
            Soporte Técnico
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Comunícate directamente con la administración de BarberOS para asistencia técnica con tu panel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            className="p-2.5 bg-white border border-zinc-200 rounded-2xl text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ticket</span>
          </button>
        </div>
      </div>

      {/* ── TICKETS CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'}>
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-zinc-200">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
              <span className="text-xs font-bold text-zinc-400">Cargando tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 bg-white rounded-3xl border border-zinc-200 space-y-3">
              <HelpCircle className="w-12 h-12 mx-auto opacity-30 text-zinc-400" />
              <p className="text-base font-bold text-zinc-800">No tienes tickets abiertos</p>
              <p className="text-xs text-zinc-500">¿Tienes dudas o necesitas ayuda? Crea un ticket y te responderemos de inmediato.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-wider"
              >
                Crear Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => {
                const isSelected = selectedTicket?.id === t.id
                const statusInfo = formatStatus(t.status)

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                      isSelected ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        #{t.ticketCode}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1 mb-1">
                      {t.subject}
                    </h3>
                    <p className={`text-xs line-clamp-2 mb-3 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {t.description}
                    </p>

                    <div className={`pt-3 border-t flex items-center justify-between text-[11px] ${
                      isSelected ? 'border-zinc-800 text-zinc-400' : 'border-zinc-100 text-zinc-400'
                    }`}>
                      <span>{new Date(t.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
                      <span className="flex items-center gap-1 font-bold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {t.messages.length} mensajes
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selectedTicket && (
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-start justify-between border-b border-zinc-100 pb-3 mb-4">
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 font-bold mb-0.5">
                    Ticket #{selectedTicket.ticketCode}
                  </div>
                  <h2 className="text-base font-black uppercase tracking-tight text-zinc-950">
                    {selectedTicket.subject}
                  </h2>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {selectedTicket.messages.map(msg => {
                  const isStaff = msg.senderRole === 'SUPER_ADMIN'
                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${
                        isStaff
                          ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-bl-none'
                          : 'ml-auto bg-black text-white rounded-br-none'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 font-bold">
                        <span>{isStaff ? '👑 Soporte BarberOS' : 'Tú'}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSendReply} className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2.5 bg-zinc-50 border rounded-2xl text-xs font-semibold outline-none"
              />
              <button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── MODAL CREATE ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
                  Nuevo Ticket de Soporte
                </h3>
                <p className="text-xs text-zinc-400">Describe tu problema o solicitud para el soporte de BarberOS.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400">Asunto</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ej: Inquietud con el reporte de comisiones"
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400">Prioridad</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as typeof priority)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="LOW">Baja (Duda general)</option>
                  <option value="MEDIUM">Media (Consulta normal)</option>
                  <option value="HIGH">Alta (Incidencia importante)</option>
                  <option value="URGENT">Urgente (Bloqueo)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400">Descripción Detallada</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explica detalladamente qué sucede..."
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-xs font-semibold outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold text-zinc-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-black uppercase hover:opacity-90"
                >
                  {creating ? 'Enviando...' : 'Enviar Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
