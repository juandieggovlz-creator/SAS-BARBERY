'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Search,
  Phone,
  Calendar,
  Scissors,
  Edit3,
  Save,
  X,
  Loader2,
  MessageSquare,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  UserPlus,
  History,
  ShieldCheck,
  Clock,
  Lock,
  Eye,
  Trash2,
  Camera,
  AlertTriangle,
  ExternalLink,
  Plus,
  DollarSign,
  TrendingUp,
  Bookmark,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { buildSocialUrl } from '@/lib/socials'

interface ClientListItem {
  id: string
  name: string
  phone: string
  email?: string | null
  internalNotes?: string | null
  createdAt: string
  totalVisits: number
  visitsWithMe: number
  clientStatus: 'RECURRENT' | 'NEW' | 'ACTIVE' | 'INACTIVE'
  lastVisit?: string | null
  lastVisitRaw?: string | null
  nextVisit?: string | null
  nextVisitRaw?: string | null
  nextVisitBarber?: string | null
  favoriteService?: string | null
}

interface ClientAppointment {
  id: string
  reservationCode: string
  date: string
  time: string
  formattedDate: string
  serviceName: string
  servicePrice: number
  duration: number
  barberName: string
  barberId: string
  isMe: boolean
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  notes?: string | null
}

interface ClientNote {
  id: string
  title: string
  content: string
  isPinned: boolean
  category: 'GENERAL' | 'PRIVATE' | 'PREFERENCE' | 'ALERT' | 'PHOTO'
  color: string
  createdAt: string
  isMyPrivateNote?: boolean
}

interface ClientDetailData {
  client: {
    id: string
    name: string
    phone: string
    email?: string | null
    internalNotes?: string | null
    createdAt: string
  }
  stats: {
    totalVisits: number
    visitsWithMe: number
    totalSpent: number
    totalSpentWithMe: number
    lastVisit?: string | null
    nextVisit?: string | null
    avgDaysBetweenVisits?: number | null
    favoriteService?: string | null
    favoriteServices: Array<{ count: number; name: string; price: number }>
    favoriteBarber?: string | null
    registeredSince: string
  }
  allAppointments: ClientAppointment[]
  notes: ClientNote[]
}

export default function BarberClientsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalBusiness, setTotalBusiness] = useState(0)
  const [totalMyClients, setTotalMyClients] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')

  // Modals & Panels
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<ClientDetailData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailTab, setDetailTab] = useState<'profile' | 'history' | 'notes' | 'photos'>('profile')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'me'>('all')

  // Create Client Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newInitialNote, setNewInitialNote] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{ id: string; name: string; phone: string } | null>(null)

  // Add Note within Dossier
  const [noteContent, setNoteContent] = useState('')
  const [noteCategory, setNoteCategory] = useState<'GENERAL' | 'PRIVATE' | 'PREFERENCE' | 'ALERT' | 'PHOTO'>('GENERAL')
  const [notePhotoUrl, setNotePhotoUrl] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  const fetchClients = useCallback(async (searchQuery = search, filterVal = activeFilter, pageNum = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (filterVal) params.set('filter', filterVal)
      params.set('page', pageNum.toString())

      const res = await fetch(`/api/barber/clients?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
        setTotal(data.total || 0)
        setTotalBusiness(data.totalBusinessClients || 0)
        setTotalMyClients(data.totalMyClients || 0)
      } else {
        toast.error('Error al cargar clientes')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [search, activeFilter, page])

  useEffect(() => {
    fetchClients(search, activeFilter, page)
  }, [fetchClients, search, activeFilter, page])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const openClientDetail = async (clientId: string) => {
    setSelectedClientId(clientId)
    setLoadingDetail(true)
    setDetailTab('profile')
    try {
      const res = await fetch(`/api/barber/clients/${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setDetailData(data)
      } else {
        toast.error('No se pudo cargar la ficha del cliente')
      }
    } catch {
      toast.error('Error de conexión al cargar la ficha')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setDuplicateWarning(null)
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('El nombre y el teléfono son requeridos')
      return
    }

    setCreatingClient(true)
    try {
      const res = await fetch('/api/barber/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || null,
          initialNote: newInitialNote.trim() || null
        })
      })

      const data = await res.json()

      if (res.status === 409 && data.exists) {
        setDuplicateWarning(data.client)
        toast.warning(data.message || 'Este cliente ya existe en el negocio.')
        return
      }

      if (res.ok) {
        toast.success('Cliente registrado exitosamente')
        setShowCreateModal(false)
        setNewName('')
        setNewPhone('')
        setNewEmail('')
        setNewInitialNote('')
        await fetchClients(search, activeFilter, page)
        if (data.client?.id) {
          openClientDetail(data.client.id)
        }
      } else {
        toast.error(data.error || 'Error al registrar cliente')
      }
    } catch {
      toast.error('Error de conexión al registrar')
    } finally {
      setCreatingClient(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) return
    const content = noteCategory === 'PHOTO'
      ? (notePhotoUrl ? `Foto de corte: ${notePhotoUrl}\n${noteContent}` : noteContent)
      : noteContent

    if (!content.trim()) {
      toast.error('Escribe el contenido de la nota o URL de la foto')
      return
    }

    setSubmittingNote(true)
    try {
      const res = await fetch(`/api/barber/clients/${selectedClientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: noteCategory,
          content: content.trim(),
          title: noteCategory === 'PHOTO' ? 'Corte de Referencia' : undefined
        })
      })

      if (res.ok) {
        toast.success(noteCategory === 'PRIVATE' ? 'Nota privada guardada' : 'Ficha actualizada')
        setNoteContent('')
        setNotePhotoUrl('')
        // Refresh detail
        const refRes = await fetch(`/api/barber/clients/${selectedClientId}`)
        if (refRes.ok) {
          setDetailData(await refRes.json())
        }
        await fetchClients(search, activeFilter, page)
      } else {
        toast.error('Error al guardar la nota')
      }
    } catch {
      toast.error('Error de red al guardar la nota')
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedClientId || !confirm('¿Eliminar esta nota?')) return
    try {
      const res = await fetch(`/api/barber/clients/${selectedClientId}/notes?noteId=${noteId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Nota eliminada')
        const refRes = await fetch(`/api/barber/clients/${selectedClientId}`)
        if (refRes.ok) {
          setDetailData(await refRes.json())
        }
      } else {
        toast.error('Error al eliminar nota')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const STATUS_BADGES = {
    RECURRENT: { label: 'Recurrente', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    ACTIVE:    { label: 'Activo',     bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    NEW:       { label: 'Nuevo',      bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    INACTIVE:  { label: 'Inactivo',   bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ═══════════════════════════════════════════════════════
          HEADER: RESUMEN DE CLIENTES DEL NEGOCIO
      ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-200 p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-950 text-white">
              Fidelización & Ficha Técnica
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Base de clientes de la barbería
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 mt-1.5">
            Directorio de Clientes
          </h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            {totalBusiness} clientes registrados en el negocio · <strong className="text-zinc-900">{totalMyClients} han sido atendidos por ti</strong>.
          </p>
        </div>


      </div>

      {/* ═══════════════════════════════════════════════════════
          BARRA DE BÚSQUEDA Y FILTROS INSTANTÁNEOS
      ═══════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o número de teléfono..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchClients(search, activeFilter, page); toast.info('Actualizando lista...') }}
              className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtros de ciclo de vida */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
          {[
            { id: 'ALL',        label: `Todos (${totalBusiness})` },
            { id: 'MY_CLIENTS', label: `Mis Clientes (${totalMyClients})` },
            { id: 'RECURRENT',  label: 'Recurrentes (3+ visitas)' },
            { id: 'ACTIVE',     label: 'Activos' },
            { id: 'NEW',        label: 'Nuevos' },
            { id: 'WITH_NEXT',  label: 'Con Próxima Cita' },
            { id: 'NO_NEXT',    label: 'Sin Próxima Cita' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setActiveFilter(f.id); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          GRILLA DE CLIENTES
      ═══════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cargando directorio...</span>
        </div>
      ) : clients.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => {
              const whatsappUrl = client.phone ? buildSocialUrl('whatsapp', client.phone) : ''
              const statusBadge = STATUS_BADGES[client.clientStatus] || STATUS_BADGES.ACTIVE

              return (
                <div
                  key={client.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top: Avatar + Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white font-black text-lg flex items-center justify-center shadow-xs">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-zinc-950 tracking-tight leading-tight">{client.name}</h3>
                          <p className="text-xs font-mono font-medium text-zinc-500 mt-0.5">{client.phone}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Visitas: Negocio vs Conmigo */}
                    <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded-2xl border border-zinc-100 text-center">
                      <div>
                        <span className="text-[9px] font-black uppercase text-zinc-400 block">Total Visitas</span>
                        <span className="text-sm font-black text-zinc-900">{client.totalVisits}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 block">Conmigo</span>
                        <span className="text-sm font-black text-amber-600">{client.visitsWithMe}</span>
                      </div>
                    </div>

                    {/* Fechas: Última y Próxima */}
                    <div className="space-y-1.5 text-xs text-zinc-500 font-medium pt-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="w-3.5 h-3.5" /> Última:
                        </span>
                        <span className="font-bold text-zinc-800">{client.lastVisit || 'Sin registros'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" /> Próxima:
                        </span>
                        {client.nextVisit ? (
                          <span className="font-bold text-emerald-600">{client.nextVisit}</span>
                        ) : (
                          <span className="text-zinc-400 italic">No programada</span>
                        )}
                      </div>

                      {client.favoriteService && (
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <Scissors className="w-3.5 h-3.5 text-amber-500" /> Servicio top:
                          </span>
                          <span className="font-bold text-zinc-900 truncate max-w-[140px]">{client.favoriteService}</span>
                        </div>
                      )}
                    </div>

                    {/* Nota Interna Destacada */}
                    {client.internalNotes && (
                      <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 block mb-0.5">
                          Preferencias del Cliente
                        </span>
                        <p className="text-xs text-amber-950 font-medium italic line-clamp-2">
                          "{client.internalNotes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openClientDetail(client.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>

                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition-colors"
                        title="Llamar"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2.5 border border-zinc-200 rounded-xl hover:bg-zinc-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-zinc-700">Página {page}</span>
              <button
                disabled={page * 50 >= total}
                onClick={() => setPage(p => p + 1)}
                className="p-2.5 border border-zinc-200 rounded-xl hover:bg-zinc-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="text-base font-black text-zinc-800">
            {search ? 'No se encontraron clientes con esa búsqueda' : 'No hay clientes en esta categoría'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search
              ? 'Intenta buscar por otro nombre o número de teléfono.'
              : 'Los clientes registrados en la barbería o agendados desde la página pública se listan aquí automáticamente.'}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: FICHA TÉCNICA Y EXPEDIENTE DEL CLIENTE
      ═══════════════════════════════════════════════════════ */}
      {selectedClientId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl border border-zinc-100 max-h-[90vh] flex flex-col space-y-5">
            {/* Header del Expediente */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              {detailData?.client ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {detailData.client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Expediente del Cliente</span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-950 tracking-tight">{detailData.client.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>{detailData.client.phone}</span>
                      {detailData.client.email && <span>· {detailData.client.email}</span>}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-black text-zinc-900">Cargando expediente...</h3>
                </div>
              )}

              <button
                onClick={() => { setSelectedClientId(null); setDetailData(null) }}
                className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail || !detailData ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
                <span className="text-xs font-bold text-zinc-400">Cargando historial y ficha técnica...</span>
              </div>
            ) : (
              <>
                {/* Tabs del Expediente */}
                <div className="flex items-center gap-1.5 border-b border-zinc-100 pb-2">
                  {[
                    { id: 'profile', label: 'Resumen & Estadísticas' },
                    { id: 'history', label: `Historial de Citas (${detailData.allAppointments.length})` },
                    { id: 'notes',   label: `Ficha & Notas (${detailData.notes.length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        detailTab === tab.id
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contenido según Tab */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {/* TAB 1: RESUMEN Y ESTADÍSTICAS */}
                  {detailTab === 'profile' && (
                    <div className="space-y-5">
                      {/* Grid Estadístico */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-center">
                          <span className="text-[9px] font-black uppercase text-zinc-400 block">Total Visitas</span>
                          <span className="text-2xl font-black text-zinc-950 mt-1 block">{detailData.stats.totalVisits}</span>
                          <span className="text-[10px] text-zinc-400">en el negocio</span>
                        </div>
                        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-center">
                          <span className="text-[9px] font-black uppercase text-amber-700 block">Visitas Conmigo</span>
                          <span className="text-2xl font-black text-amber-700 mt-1 block">{detailData.stats.visitsWithMe}</span>
                          <span className="text-[10px] text-amber-600/80">atendidas por ti</span>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-center">
                          <span className="text-[9px] font-black uppercase text-zinc-400 block">Consumo Total</span>
                          <span className="text-xl font-black text-zinc-950 mt-1 block">{formatCOP(detailData.stats.totalSpent)}</span>
                          <span className="text-[10px] text-zinc-400">servicios completados</span>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-center">
                          <span className="text-[9px] font-black uppercase text-zinc-400 block">Frecuencia Media</span>
                          <span className="text-xl font-black text-zinc-950 mt-1 block">
                            {detailData.stats.avgDaysBetweenVisits ? `${detailData.stats.avgDaysBetweenVisits} días` : 'N/A'}
                          </span>
                          <span className="text-[10px] text-zinc-400">entre visitas</span>
                        </div>
                      </div>

                      {/* Preferencias Principales */}
                      <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-3">
                        <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Preferencias & Fidelización</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-zinc-400 block">Servicio Habitual:</span>
                            <span className="font-bold text-zinc-900">{detailData.stats.favoriteService || 'Sin historial'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">Barbero más Frecuente:</span>
                            <span className="font-bold text-zinc-900">{detailData.stats.favoriteBarber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">Última Visita:</span>
                            <span className="font-bold text-zinc-900">
                              {detailData.stats.lastVisit ? new Date(detailData.stats.lastVisit).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Nunca'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">Cliente Desde:</span>
                            <span className="font-bold text-zinc-900">
                              {new Date(detailData.stats.registeredSince).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Notas de Preferencia Activas */}
                      {detailData.client.internalNotes && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                            Observaciones / Estilo de Corte
                          </span>
                          <p className="text-xs text-amber-950 font-medium italic">
                            "{detailData.client.internalNotes}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: HISTORIAL DE CITAS (NEGOCIO + CONMIGO) */}
                  {detailTab === 'history' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
                          <button
                            onClick={() => setHistoryFilter('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              historyFilter === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500'
                            }`}
                          >
                            Todas en la Barbería ({detailData.allAppointments.length})
                          </button>
                          <button
                            onClick={() => setHistoryFilter('me')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              historyFilter === 'me' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500'
                            }`}
                          >
                            Conmigo ({detailData.allAppointments.filter(a => a.isMe).length})
                          </button>
                        </div>
                      </div>

                      {detailData.allAppointments.filter(a => historyFilter === 'all' || a.isMe).length > 0 ? (
                        <div className="space-y-2.5">
                          {detailData.allAppointments
                            .filter(a => historyFilter === 'all' || a.isMe)
                            .map(appt => (
                              <div
                                key={appt.id}
                                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                                  appt.isMe ? 'bg-amber-50/20 border-amber-200/80' : 'bg-zinc-50 border-zinc-100'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-900">{appt.formattedDate} · {appt.time}</span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                      appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                      appt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {appt.status}
                                    </span>
                                    {appt.isMe && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black">
                                        Atendido por ti
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-zinc-600 font-semibold mt-0.5">
                                    {appt.serviceName} · Barbero: <strong>{appt.barberName}</strong>
                                  </p>
                                  {appt.notes && <p className="text-zinc-400 italic text-[11px] mt-0.5">"{appt.notes}"</p>}
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-black text-zinc-900">{formatCOP(appt.servicePrice)}</span>
                                  <span className="block text-[10px] text-zinc-400 font-mono">{appt.reservationCode}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic text-center py-8">
                          No hay citas registradas en este filtro.
                        </p>
                      )}
                    </div>
                  )}

                  {/* TAB 3: FICHA TÉCNICA & SISTEMA DE NOTAS */}
                  {detailTab === 'notes' && (
                    <div className="space-y-6">
                      {/* Formulario Nueva Nota */}
                      <form onSubmit={handleAddNote} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-zinc-600">Registrar Nueva Observación</span>
                          <div className="flex items-center gap-1">
                            {[
                              { id: 'GENERAL', label: '📌 General' },
                              { id: 'PRIVATE', label: '🔒 Privada' },
                              { id: 'ALERT',   label: '⚠️ Alerta / Piel' },
                              { id: 'PREFERENCE', label: '✨ Gusto' },
                              { id: 'PHOTO',   label: '📸 Foto Corte' },
                            ].map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setNoteCategory(cat.id as any)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                  noteCategory === cat.id
                                    ? 'bg-zinc-950 text-white shadow-xs'
                                    : 'bg-white text-zinc-600 border border-zinc-200'
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {noteCategory === 'PHOTO' && (
                          <input
                            type="url"
                            value={notePhotoUrl}
                            onChange={e => setNotePhotoUrl(e.target.value)}
                            placeholder="URL de la foto de referencia (https://...)"
                            className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:border-zinc-900"
                          />
                        )}

                        <textarea
                          rows={2}
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          placeholder={
                            noteCategory === 'PRIVATE' ? 'Nota visible únicamente para ti (ej. hábitos, preferencias privadas)...' :
                            noteCategory === 'ALERT'   ? 'Alergias a productos, piel sensible, no usar navaja...' :
                            noteCategory === 'PREFERENCE' ? 'Estilo de degradado favorito, peinado, productos preferidos...' :
                            'Observación general para el equipo de barbería...'
                          }
                          className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-900 resize-none"
                        />

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingNote || !noteContent.trim()}
                            className="px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5"
                          >
                            {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>Guardar en Ficha</span>
                          </button>
                        </div>
                      </form>

                      {/* Lista de Notas */}
                      {detailData.notes.length > 0 ? (
                        <div className="space-y-3">
                          {detailData.notes.map(n => (
                            <div
                              key={n.id}
                              className={`p-4 rounded-2xl border space-y-1.5 text-xs ${
                                n.category === 'ALERT'   ? 'bg-red-50/70 border-red-200 text-red-950' :
                                n.category === 'PRIVATE' ? 'bg-purple-50/70 border-purple-200 text-purple-950' :
                                n.category === 'PREFERENCE' ? 'bg-amber-50/70 border-amber-200 text-amber-950' :
                                'bg-zinc-50 border-zinc-200 text-zinc-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    n.category === 'ALERT'   ? 'bg-red-200 text-red-900' :
                                    n.category === 'PRIVATE' ? 'bg-purple-200 text-purple-900' :
                                    n.category === 'PREFERENCE' ? 'bg-amber-200 text-amber-900' :
                                    'bg-zinc-200 text-zinc-800'
                                  }`}>
                                    {n.category === 'PRIVATE' ? '🔒 Nota Privada' :
                                     n.category === 'ALERT'   ? '⚠️ Alerta' :
                                     n.category === 'PREFERENCE' ? '✨ Preferencia' : '📌 General'}
                                  </span>
                                  <span className="font-black text-zinc-950">{n.title}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-zinc-400">
                                    {new Date(n.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteNote(n.id)}
                                    className="text-zinc-400 hover:text-red-600 p-1"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="font-medium whitespace-pre-wrap leading-relaxed">{n.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic text-center py-6">
                          No existen notas registradas para este cliente todavía.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer del Modal */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {detailData.client.phone && (
                      <>
                        <a
                          href={`tel:${detailData.client.phone}`}
                          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-800 flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Llamar</span>
                        </a>
                        <a
                          href={buildSocialUrl('whatsapp', detailData.client.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => { setSelectedClientId(null); setDetailData(null) }}
                    className="px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl"
                  >
                    Cerrar Ficha
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: REGISTRAR NUEVO CLIENTE (CON VALIDACIÓN DUPLICADOS)
      ═══════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-zinc-100 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center font-black">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-950 uppercase">Nuevo Cliente</h3>
                  <p className="text-xs text-zinc-400">Perteneciente a la barbería</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setDuplicateWarning(null) }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-start gap-2 text-amber-900">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <h4 className="font-black text-xs uppercase">Cliente ya registrado</h4>
                    <p className="text-xs mt-0.5">
                      Ya existe un cliente con el teléfono <strong>{duplicateWarning.phone}</strong> a nombre de <strong>{duplicateWarning.name}</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      openClientDetail(duplicateWarning.id)
                    }}
                    className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors"
                  >
                    Abrir Ficha de {duplicateWarning.name}
                  </button>
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="py-2 px-3 bg-white border border-amber-300 text-amber-900 rounded-xl text-xs font-bold"
                  >
                    Modificar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 ml-1">
                    Nombre Completo *
                  </label>
                  <input
                    required
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 ml-1">
                    Teléfono Móvil *
                  </label>
                  <input
                    required
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 ml-1">
                    Correo Electrónico (opcional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 ml-1">
                    Nota Inicial / Preferencia de Corte (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={newInitialNote}
                    onChange={e => setNewInitialNote(e.target.value)}
                    placeholder="Ej. Prefiere corte clásico con tijera..."
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-950 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 border border-zinc-200 rounded-xl text-xs font-black uppercase text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="flex-1 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-md"
                  >
                    {creatingClient ? 'Guardando...' : 'Crear Cliente'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
