'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  FileText, Plus, Pin, Trash2, Edit3, Copy, Search, Filter,
  AlertTriangle, ShoppingBag, Users, Wrench, CheckCircle2,
  Sparkles, X, ChevronDown, LayoutGrid, List, Check, Tag, Clock
} from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  isPinned: boolean
  color?: string | null
  category?: string | null
  createdAt: string
  updatedAt?: string
}

const CATEGORIES = [
  { id: 'GENERAL', label: 'General / Avisos', icon: FileText, badgeBg: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  { id: 'URGENT', label: 'Urgente', icon: AlertTriangle, badgeBg: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'SUPPLIES', label: 'Insumos & Compras', icon: ShoppingBag, badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'TEAM', label: 'Equipo / Barberos', icon: Users, badgeBg: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'MAINTENANCE', label: 'Mantenimiento', icon: Wrench, badgeBg: 'bg-purple-100 text-purple-800 border-purple-200' },
]

const COLOR_PALETTES: Record<string, {
  name: string
  bg: string
  border: string
  text: string
  accent: string
  headerBg: string
  badge: string
}> = {
  yellow: {
    name: 'Ámbar',
    bg: 'bg-amber-50/80 dark:bg-[#141310] dark:bg-gradient-to-br dark:from-[#171510] dark:to-[#101014]',
    border: 'border-amber-200/80 hover:border-amber-400 dark:border-amber-500/30 dark:hover:border-amber-400/60',
    text: 'text-amber-950 dark:text-zinc-100',
    accent: 'bg-amber-400',
    headerBg: 'bg-amber-100/60 dark:bg-amber-950/40',
    badge: 'bg-amber-200/60 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
  },
  rose: {
    name: 'Rosa / Urgente',
    bg: 'bg-rose-50/80 dark:bg-[#161012] dark:bg-gradient-to-br dark:from-[#191114] dark:to-[#101014]',
    border: 'border-rose-200/80 hover:border-rose-400 dark:border-rose-500/30 dark:hover:border-rose-400/60',
    text: 'text-rose-950 dark:text-zinc-100',
    accent: 'bg-rose-500',
    headerBg: 'bg-rose-100/60 dark:bg-rose-950/40',
    badge: 'bg-rose-200/60 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
  },
  emerald: {
    name: 'Esmeralda',
    bg: 'bg-emerald-50/80 dark:bg-[#101612] dark:bg-gradient-to-br dark:from-[#101914] dark:to-[#101014]',
    border: 'border-emerald-200/80 hover:border-emerald-400 dark:border-emerald-500/30 dark:hover:border-emerald-400/60',
    text: 'text-emerald-950 dark:text-zinc-100',
    accent: 'bg-emerald-500',
    headerBg: 'bg-emerald-100/60 dark:bg-emerald-950/40',
    badge: 'bg-emerald-200/60 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
  },
  blue: {
    name: 'Cielo',
    bg: 'bg-sky-50/80 dark:bg-[#101418] dark:bg-gradient-to-br dark:from-[#10161b] dark:to-[#101014]',
    border: 'border-sky-200/80 hover:border-sky-400 dark:border-sky-500/30 dark:hover:border-sky-400/60',
    text: 'text-sky-950 dark:text-zinc-100',
    accent: 'bg-sky-500',
    headerBg: 'bg-sky-100/60 dark:bg-sky-950/40',
    badge: 'bg-sky-200/60 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 border-sky-300 dark:border-sky-500/40'
  },
  purple: {
    name: 'Púrpura',
    bg: 'bg-purple-50/80 dark:bg-[#141118] dark:bg-gradient-to-br dark:from-[#15111a] dark:to-[#101014]',
    border: 'border-purple-200/80 hover:border-purple-400 dark:border-purple-500/30 dark:hover:border-purple-400/60',
    text: 'text-purple-950 dark:text-zinc-100',
    accent: 'bg-purple-500',
    headerBg: 'bg-purple-100/60 dark:bg-purple-950/40',
    badge: 'bg-purple-200/60 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-500/40'
  },
  dark: {
    name: 'Oscuro Executive',
    bg: 'bg-zinc-950 dark:bg-[#121215]',
    border: 'border-zinc-800 hover:border-zinc-700 dark:border-zinc-800 dark:hover:border-zinc-700',
    text: 'text-zinc-100 dark:text-zinc-100',
    accent: 'bg-zinc-400',
    headerBg: 'bg-zinc-900 dark:bg-zinc-900',
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  }
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [form, setForm] = useState({
    title: '',
    content: '',
    isPinned: false,
    color: 'yellow',
    category: 'GENERAL'
  })
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notes')
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      } else {
        toast.error('Error al cargar las notas')
      }
    } catch {
      toast.error('Error de conexión al cargar notas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const handleOpenCreate = () => {
    setEditingNote(null)
    setForm({ title: '', content: '', isPinned: false, color: 'yellow', category: 'GENERAL' })
    setShowModal(true)
  }

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note)
    setForm({
      title: note.title,
      content: note.content,
      isPinned: note.isPinned,
      color: note.color || 'yellow',
      category: note.category || 'GENERAL'
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      toast.warning('Ingresa un título y contenido para la nota')
      return
    }

    setSaving(true)
    try {
      if (editingNote) {
        // Update existing note
        const res = await fetch('/api/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNote.id,
            title: form.title,
            content: form.content,
            isPinned: form.isPinned,
            color: form.color,
            category: form.category
          })
        })

        if (res.ok) {
          toast.success('Nota actualizada correctamente ✨')
          setShowModal(false)
          fetchNotes()
        } else {
          toast.error('Error al actualizar la nota')
        }
      } else {
        // Create new note
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })

        if (res.ok) {
          toast.success('Nota creada con éxito 📌')
          setShowModal(false)
          setForm({ title: '', content: '', isPinned: false, color: 'yellow', category: 'GENERAL' })
          fetchNotes()
        } else {
          toast.error('Error al guardar la nota')
        }
      }
    } catch {
      toast.error('Error de red al guardar la nota')
    } finally {
      setSaving(false)
    }
  }

  const togglePin = async (id: string, currentPin: boolean) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPinned: !currentPin })
      })

      if (res.ok) {
        toast.success(currentPin ? 'Nota desfijada' : 'Nota fijada al inicio 📌')
        fetchNotes()
      }
    } catch {
      toast.error('Error al cambiar fijado de la nota')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta nota?')) return
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Nota eliminada')
        fetchNotes()
      } else {
        toast.error('Error al eliminar la nota')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleCopyText = (note: Note) => {
    const textToCopy = `${note.title}\n\n${note.content}`
    navigator.clipboard.writeText(textToCopy)
    setCopiedId(note.id)
    toast.success('Texto copiado al portapapeles 📋')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'ALL' || (n.category || 'GENERAL') === selectedCategory
      return matchSearch && matchCat
    })
  }, [notes, search, selectedCategory])

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.isPinned), [filteredNotes])
  const regularNotes = useMemo(() => filteredNotes.filter(n => !n.isPinned), [filteredNotes])

  // Stats
  const urgentCount = useMemo(() => notes.filter(n => n.category === 'URGENT').length, [notes])
  const totalPinned = useMemo(() => notes.filter(n => n.isPinned).length, [notes])

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════
          HEADER & TOOLBAR
      ════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                📌
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white">
                  Tablero de Notas & Avisos
                </h1>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Organiza tareas, compras de insumos e instrucciones para tu equipo
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-950 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4 text-amber-400 dark:text-zinc-950" />
            + Nueva Nota
          </button>
        </div>

        {/* Quick Stats Badges */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
            <span className="text-xs font-black text-zinc-400 uppercase">Total:</span>
            <span className="text-sm font-black text-zinc-950 dark:text-white">{notes.length}</span>
          </div>

          <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/30 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
            <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase">Fijadas:</span>
            <span className="text-sm font-black text-amber-900 dark:text-amber-200">{totalPinned}</span>
          </div>

          {urgentCount > 0 && (
            <div className="bg-rose-50 dark:bg-rose-400/10 border border-rose-200 dark:border-rose-400/30 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase">Urgentes:</span>
              <span className="text-sm font-black text-rose-900 dark:text-rose-200">{urgentCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          SEARCH & CATEGORY FILTERS
      ════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título o contenido..."
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-amber-400 transition-colors shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills & View Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950 shadow-xs'
                : 'bg-white dark:bg-[#121215] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Todas ({notes.length})
          </button>

          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const count = notes.filter(n => (n.category || 'GENERAL') === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950 border-zinc-950 dark:border-amber-400 shadow-xs'
                    : 'bg-white dark:bg-[#121215] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                {cat.label.split('/')[0]} ({count})
              </button>
            )
          })}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 ml-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
              title="Vista cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
              title="Vista lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════
          NOTES DISPLAY
      ════════════════════════════════════════ */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Cargando tablero de notas...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-zinc-200/80 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-zinc-950">
              {search || selectedCategory !== 'ALL' ? 'No se encontraron notas con el filtro seleccionado' : 'No hay notas registradas'}
            </h3>
            <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto mt-1">
              {search || selectedCategory !== 'ALL'
                ? 'Prueba borrando el término de búsqueda o cambiando la categoría.'
                : 'Crea notas para dejar avisos al equipo, compras pendientes o recordatorios importantes.'}
            </p>
          </div>
          {search || selectedCategory !== 'ALL' ? (
            <button
              onClick={() => { setSearch(''); setSelectedCategory('ALL') }}
              className="text-xs font-bold text-zinc-950 underline hover:text-zinc-700"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Crear Primera Nota
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">

          {/* SECTION 1: PINNED NOTES */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-400/10 border border-amber-200/80 dark:border-amber-400/30 px-3.5 py-2 rounded-2xl w-fit">
                <Pin className="w-3.5 h-3.5 fill-amber-600 dark:fill-amber-400" />
                Notas Fijadas ({pinnedNotes.length})
              </div>

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPin={() => togglePin(note.id, note.isPinned)}
                    onEdit={() => handleOpenEdit(note)}
                    onDelete={() => handleDelete(note.id)}
                    onCopy={() => handleCopyText(note)}
                    isCopied={copiedId === note.id}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: OTHER NOTES */}
          {regularNotes.length > 0 && (
            <div className="space-y-4">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400 pt-2">
                  <span>Otras Notas ({regularNotes.length})</span>
                </div>
              )}

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
                {regularNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPin={() => togglePin(note.id, note.isPinned)}
                    onEdit={() => handleOpenEdit(note)}
                    onDelete={() => handleDelete(note.id)}
                    onCopy={() => handleCopyText(note)}
                    isCopied={copiedId === note.id}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL: CREAR / EDITAR NOTA
      ════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-950 text-white rounded-2xl flex items-center justify-center font-black">
                  {editingNote ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">
                    {editingNote ? 'Editar Nota' : 'Nueva Nota Interna'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {editingNote ? 'Modifica el contenido de la nota' : 'Guarda avisos o tareas para el equipo'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 mb-1.5">
                  Título de la Nota
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej. Comprar productos Wahl, Reunión de barberos..."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-950 outline-none focus:border-zinc-950 transition-colors"
                />
              </div>

              {/* Categoría & Color Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-950 outline-none focus:border-zinc-950 transition-colors appearance-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 mb-1.5">
                    Color de Tarjeta
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, color: key })}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${pal.accent} ${
                          form.color === key ? 'ring-2 ring-zinc-950 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={pal.name}
                      >
                        {form.color === key && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contenido / Descripción */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 mb-1.5">
                  Contenido / Detalles
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Escribe aquí los detalles del aviso, instrucciones o lista de tareas..."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-medium text-zinc-950 outline-none focus:border-zinc-950 transition-colors resize-none placeholder:text-zinc-400 leading-relaxed"
                />
              </div>

              {/* Checkbox Fijar */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPinnedCheck"
                  checked={form.isPinned}
                  onChange={e => setForm({ ...form, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded border-amber-300 accent-amber-600 cursor-pointer"
                />
                <label htmlFor="isPinnedCheck" className="text-xs font-black text-amber-900 cursor-pointer select-none flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                  Fijar esta nota en la parte superior del tablero
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 rounded-2xl border border-zinc-200 font-bold text-xs uppercase text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-3 rounded-2xl bg-zinc-950 text-white font-black text-xs uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {saving ? 'Guardando...' : editingNote ? 'Guardar Cambios' : 'Crear Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── NOTE CARD COMPONENT ──────────────────────────────────────────────────────

interface NoteCardProps {
  note: Note
  onPin: () => void
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  isCopied: boolean
  viewMode: 'grid' | 'list'
}

function NoteCard({ note, onPin, onEdit, onDelete, onCopy, isCopied, viewMode }: NoteCardProps) {
  const palette = COLOR_PALETTES[note.color || 'yellow'] || COLOR_PALETTES.yellow
  const categoryConfig = CATEGORIES.find(c => c.id === (note.category || 'GENERAL')) || CATEGORIES[0]
  const CategoryIcon = categoryConfig.icon

  const isDark = note.color === 'dark'

  if (viewMode === 'list') {
    return (
      <div className={`w-full p-5 md:p-6 rounded-3xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${palette.bg} ${palette.border} ${palette.text} shadow-xs hover:shadow-md group relative`}>
        
        {/* Left Side: Badges, Title & Content */}
        <div className="space-y-2 flex-1 w-full">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl border ${palette.badge} inline-flex items-center gap-1.5`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              {categoryConfig.label.split('/')[0]}
            </span>
            {note.isPinned && (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200/90 dark:bg-amber-400/20 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-400/40 inline-flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 fill-amber-700 dark:fill-amber-400 text-amber-700 dark:text-amber-400" /> Fijada
              </span>
            )}
            <span className="text-[11px] font-bold opacity-60 flex items-center gap-1 ml-auto md:ml-0 text-zinc-500 dark:text-zinc-400">
              <Clock className="w-3 h-3" />
              {new Date(note.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h3 className="text-base md:text-lg font-black uppercase tracking-tight leading-snug text-zinc-950 dark:text-white">
            {note.title}
          </h3>

          <p className={`text-xs md:text-sm font-medium leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-300`}>
            {note.content}
          </p>
        </div>

        {/* Right Side: Action Toolbar */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-zinc-800 w-full md:w-auto justify-end">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-black/10 dark:border-zinc-700/80 text-xs font-bold transition-all shadow-2xs"
            title="Copiar texto"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />}
            <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={onPin}
            className={`p-2 rounded-xl border transition-all ${
              note.isPinned 
                ? 'bg-amber-200/80 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-400/40' 
                : 'bg-white/70 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-black/10 dark:border-zinc-700/80'
            }`}
            title={note.isPinned ? 'Desfijar' : 'Fijar nota'}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-700 dark:fill-amber-400 text-amber-800 dark:text-amber-400' : ''}`} />
          </button>

          <button
            onClick={onEdit}
            className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-black/10 dark:border-zinc-700/80 transition-all shadow-2xs"
            title="Editar nota"
          >
            <Edit3 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/90 hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-700 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 border border-black/10 dark:border-zinc-700/80 transition-all shadow-2xs"
            title="Eliminar nota"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    )
  }

  return (
    <div className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between space-y-4 ${palette.bg} ${palette.border} ${palette.text} shadow-xs hover:shadow-md group`}>
      
      {/* Header of Note */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${palette.badge} inline-flex items-center gap-1.5`}>
            <CategoryIcon className="w-3 h-3" />
            {categoryConfig.label.split('/')[0]}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={onPin}
              className={`p-1.5 rounded-xl transition-all ${
                note.isPinned ? 'bg-amber-200/80 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300' : 'opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 dark:text-zinc-300'
              }`}
              title={note.isPinned ? 'Desfijar' : 'Fijar nota'}
            >
              <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-700 dark:fill-amber-400 text-amber-800 dark:text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        <h3 className="text-base font-black uppercase tracking-tight line-clamp-2 leading-snug mb-2 text-zinc-950 dark:text-white">
          {note.title}
        </h3>

        <p className={`text-xs font-medium leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-300`}>
          {note.content}
        </p>
      </div>

      {/* Footer of Note */}
      <div className={`pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${isDark ? 'border-zinc-800' : 'border-black/5 dark:border-zinc-800'}`}>
        <span className={`flex items-center gap-1 opacity-60 text-zinc-500 dark:text-zinc-400`}>
          <Clock className="w-3 h-3" />
          {new Date(note.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onCopy}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors"
            title="Copiar contenido"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors"
            title="Editar nota"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-400 dark:text-zinc-300 transition-colors"
            title="Eliminar nota"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  )
}
