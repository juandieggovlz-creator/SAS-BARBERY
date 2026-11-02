'use client'

import React, { useState, useEffect } from 'react'
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Sparkles,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Building2,
  Clock,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface AnnouncementItem {
  id: string
  title: string
  content: string
  type: 'ANNOUNCEMENT' | 'UPDATE' | 'MAINTENANCE'
  targetType: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export default function SuperAdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'ANNOUNCEMENT' | 'UPDATE' | 'MAINTENANCE'>('ANNOUNCEMENT')
  const [targetType, setTargetType] = useState('ALL')
  const [isPublished, setIsPublished] = useState(true)

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/announcements')
      if (res.ok) {
        const json = await res.json()
        setAnnouncements(json.announcements || [])
      } else {
        toast.error('Error al cargar comunicados')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Título y contenido son obligatorios')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          type,
          targetType,
          isPublished
        })
      })

      if (res.ok) {
        toast.success('Comunicado publicado exitosamente')
        setModalOpen(false)
        setTitle('')
        setContent('')
        fetchAnnouncements()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error al conectar')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublished = async (ann: AnnouncementItem) => {
    try {
      const res = await fetch('/api/superadmin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ann.id, isPublished: !ann.isPublished })
      })

      if (res.ok) {
        toast.success(`Comunicado ${!ann.isPublished ? 'publicado' : 'ocultado'}`)
        fetchAnnouncements()
      } else {
        toast.error('No se pudo actualizar el estado')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleDelete = async (ann: AnnouncementItem) => {
    if (!window.confirm(`¿Eliminar el comunicado "${ann.title}"?`)) return

    try {
      const res = await fetch(`/api/superadmin/announcements?id=${ann.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Comunicado eliminado')
        fetchAnnouncements()
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  return (
    <div className="space-y-6 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <Megaphone className="w-3 h-3" />
              Canal de Comunicación Oficial
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Comunicados y Novedades SaaS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Emite avisos globales, notificaciones de mantenimiento y lanzamientos de nuevas funciones a todas las barberías.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
            className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nuevo Comunicado</span>
          </button>
        </div>
      </div>

      {/* ── ANNOUNCEMENTS LIST ── */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-zinc-200">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
          <span className="text-xs font-semibold text-zinc-400">Cargando avisos...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-16 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-200">
          <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-base font-bold text-zinc-800">No hay comunicados publicados</p>
          <p className="text-xs mt-1">Crea un aviso para informar a las barberías sobre actualizaciones o novedades.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    ann.type === 'MAINTENANCE'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : ann.type === 'UPDATE'
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}
                >
                  {ann.type === 'MAINTENANCE' && <Wrench className="w-6 h-6" />}
                  {ann.type === 'UPDATE' && <Sparkles className="w-6 h-6" />}
                  {ann.type === 'ANNOUNCEMENT' && <Megaphone className="w-6 h-6" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        ann.type === 'MAINTENANCE'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : ann.type === 'UPDATE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {ann.type === 'MAINTENANCE' ? 'Mantenimiento' : ann.type === 'UPDATE' ? 'Actualización' : 'Anuncio'}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                      Audiencia: {ann.targetType === 'ALL' ? 'Todas las Barberías' : 'Segmentado'}
                    </span>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        ann.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      {ann.isPublished ? '● Visible para Dueños' : 'Oculto'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-950">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-zinc-600 mt-2 whitespace-pre-wrap">
                    {ann.content}
                  </p>

                  <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 mt-3">
                    <Clock className="w-3 h-3" />
                    <span>
                      Publicado el{' '}
                      {new Date(ann.createdAt).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                <button
                  onClick={() => handleTogglePublished(ann)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    ann.isPublished
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-amber-600'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={ann.isPublished ? 'Ocultar comunicado' : 'Publicar comunicado'}
                >
                  {ann.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleDelete(ann)}
                  className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Eliminar comunicado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL CREATE ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  Nuevo Comunicado Oficial
                </h3>
                <p className="text-xs text-zinc-500">
                  Transmite información a los paneles de control de todas las barberías.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Tipo de Comunicado
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as typeof type)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none cursor-pointer focus:border-zinc-950"
                >
                  <option value="ANNOUNCEMENT">📢 Anuncio General</option>
                  <option value="UPDATE">✨ Novedad / Nueva Función</option>
                  <option value="MAINTENANCE">🛠️ Aviso de Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Título del Comunicado
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Mantenimiento programado de servidores este domingo"
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-950"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Mensaje / Contenido Detallado
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escribe el mensaje que verán los dueños de barberías en sus paneles..."
                  className="w-full mt-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none resize-none focus:border-zinc-950"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-0 accent-zinc-950"
                />
                <label htmlFor="pubCheck" className="text-xs font-medium text-zinc-800 cursor-pointer">
                  Publicar y hacer visible de inmediato
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Emitir Comunicado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
