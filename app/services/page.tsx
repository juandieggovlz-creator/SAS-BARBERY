'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Scissors,
  Plus,
  X,
  Trash2,
  Pencil,
  Clock,
  Search,
  AlertCircle,
  Power,
  Sparkles,
  Info
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string | null
  price: string | number
  duration: number
  category?: string | null
  isActive: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  'Cortes': 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  'Barba': 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  'Combos': 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-200 dark:border-violet-900',
  'Tratamientos': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  'Especiales': 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-900',
}

const SUGGESTED_CATEGORIES = ['Cortes', 'Barba', 'Combos', 'Tratamientos', 'Especiales']
const DURATION_PRESETS = [15, 20, 30, 45, 60, 90]

function formatPrice(price: string | number) {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num || 0)
}

function broadcastCatalogUpdate() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('barberos_catalog_sync')
      channel.postMessage({ type: 'CATALOG_UPDATED', timestamp: Date.now() })
      channel.close()
    } catch {
      // Ignorar errores en navegadores sin soporte
    }
  }
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [search, setSearch] = useState('')

  // Formulario nuevo servicio
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    category: '',
    isActive: true
  })
  const [isSubmittingNew, setIsSubmittingNew] = useState(false)

  // Formulario editar servicio
  const [editingService, setEditingService] = useState<{
    id: string
    name: string
    description: string
    price: string
    duration: string
    category: string
    isActive: boolean
  } | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Modal eliminar servicio
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services?includeInactive=true')
      if (!res.ok) throw new Error('Error al cargar servicios')
      const data = await res.json()
      setServices(Array.isArray(data) ? data : [])
    } catch {
      toast.error('No se pudo cargar el catálogo de servicios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Categorías existentes dinámicas para autocompletado
  const existingCategories = useMemo(() => {
    const set = new Set<string>(SUGGESTED_CATEGORIES)
    services.forEach(s => {
      if (s.category && s.category.trim()) set.add(s.category.trim())
    })
    return Array.from(set)
  }, [services])

  // Contadores
  const activeCount = useMemo(() => services.filter(s => s.isActive).length, [services])
  const inactiveCount = useMemo(() => services.filter(s => !s.isActive).length, [services])

  // Filtrado
  const filtered = useMemo(() => {
    return services.filter(s => {
      // Filtro de estado
      if (statusFilter === 'ACTIVE' && !s.isActive) return false
      if (statusFilter === 'INACTIVE' && s.isActive) return false

      // Filtro de búsqueda
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const matchesName = s.name.toLowerCase().includes(q)
      const matchesCategory = (s.category || '').toLowerCase().includes(q)
      const matchesDesc = (s.description || '').toLowerCase().includes(q)
      return matchesName || matchesCategory || matchesDesc
    })
  }, [services, statusFilter, search])

  // Activar / Desactivar Servicio (Toggle Rápido)
  const handleToggleStatus = async (service: Service) => {
    const newStatus = !service.isActive
    const actionLabel = newStatus ? 'activado' : 'desactivado'

    // Optimistic UI update
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: newStatus } : s))

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al cambiar estado')
      }

      toast.success(`Servicio "${service.name}" ${actionLabel}`)
      broadcastCatalogUpdate()
    } catch (err: unknown) {
      // Revertir optimistic update
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: service.isActive } : s))
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del servicio'
      toast.error(msg)
    }
  }

  // Guardar nuevo servicio
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('El nombre del servicio es obligatorio')
      return
    }

    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Ingresa un precio válido (mayor o igual a 0)')
      return
    }

    const durationNum = parseInt(formData.duration)
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error('La duración debe ser mayor a 0 minutos')
      return
    }

    setIsSubmittingNew(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category.trim() || null,
          price: priceNum,
          duration: durationNum,
          isActive: formData.isActive
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear servicio')
      }

      toast.success(`Servicio "${data.name}" añadido al catálogo`)
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '30',
        category: '',
        isActive: true
      })
      setShowForm(false)
      fetchServices()
      broadcastCatalogUpdate()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar servicio'
      toast.error(msg)
    } finally {
      setIsSubmittingNew(false)
    }
  }

  // Guardar edición de servicio
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService) return

    if (!editingService.name.trim()) {
      toast.error('El nombre del servicio es obligatorio')
      return
    }

    const priceNum = parseFloat(editingService.price)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Ingresa un precio válido (mayor o igual a 0)')
      return
    }

    const durationNum = parseInt(editingService.duration)
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error('La duración debe ser mayor a 0 minutos')
      return
    }

    setIsSubmittingEdit(true)
    try {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingService.name.trim(),
          description: editingService.description.trim() || null,
          category: editingService.category.trim() || null,
          price: priceNum,
          duration: durationNum,
          isActive: editingService.isActive
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar servicio')
      }

      toast.success(`Servicio "${data.name}" actualizado`)
      setEditingService(null)
      fetchServices()
      broadcastCatalogUpdate()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar servicio'
      toast.error(msg)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar servicio')
      }

      if (data.action === 'ARCHIVED') {
        toast.info(data.message || 'Servicio archivado/desactivado por historial de citas')
      } else {
        toast.success(data.message || 'Servicio eliminado permanentemente')
      }

      setServiceToDelete(null)
      fetchServices()
      broadcastCatalogUpdate()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar servicio'
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-black dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm">
            <Scissors className="w-5 h-5 text-white dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Gestión de Catálogo</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {services.length} Total
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">Servicios</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 panel-btn-accent px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Servicio</span>
        </button>
      </div>

      {/* ── Pestañas de Estado & Barra de Búsqueda ───────────────────────────── */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Pestañas de estado */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 self-start md:self-auto overflow-x-auto w-full md:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Activos ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'INACTIVE'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Inactivos ({inactiveCount})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-semibold outline-none focus:border-zinc-900 dark:focus:border-amber-400 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla de Servicios ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#18181b]">
                <th className="px-6 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Servicio y Descripción</th>
                <th className="px-6 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoría</th>
                <th className="px-6 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Duración</th>
                <th className="px-6 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Precio COP</th>
                <th className="px-6 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Estado</th>
                <th className="px-6 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-black dark:border-t-amber-400 rounded-full animate-spin" />
                      <span className="text-xs text-zinc-400 font-medium">Cargando catálogo...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map(service => (
                  <tr
                    key={service.id}
                    className={`hover:bg-zinc-50/70 dark:hover:bg-[#18181b]/70 transition-colors group ${
                      !service.isActive ? 'opacity-65 bg-zinc-50/30 dark:bg-zinc-900/20' : ''
                    }`}
                  >
                    {/* Servicio & Descripción */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          service.isActive
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                            : 'bg-zinc-200 dark:bg-zinc-800/50 text-zinc-400'
                        }`}>
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-950 dark:text-white text-sm tracking-tight">{service.name}</span>
                            {!service.isActive && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                Inactivo
                              </span>
                            )}
                          </div>
                          {service.description ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5 max-w-md">
                              {service.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-zinc-400/80 italic mt-0.5">Sin descripción</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-6 py-4">
                      {service.category ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          CATEGORY_COLORS[service.category] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {service.category}
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Duración */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{service.duration} min</span>
                      </div>
                    </td>

                    {/* Precio */}
                    <td className="px-6 py-4">
                      <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                        {formatPrice(service.price)}
                      </span>
                    </td>

                    {/* Estado con Toggle Rápido */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(service)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border ${
                          service.isActive
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}
                        title={service.isActive ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        <span>{service.isActive ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingService({
                            id: service.id,
                            name: service.name,
                            description: service.description || '',
                            price: service.price.toString(),
                            duration: service.duration.toString(),
                            category: service.category || '',
                            isActive: service.isActive
                          })}
                          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
                          title="Editar servicio"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setServiceToDelete(service)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                          title="Eliminar o archivar servicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                        <Scissors className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No se encontraron servicios</p>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        {search ? 'No hay resultados que coincidan con la búsqueda.' : 'Aún no tienes servicios en este catálogo o filtro seleccionado.'}
                      </p>
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          className="text-xs font-bold text-zinc-600 dark:text-zinc-400 underline cursor-pointer"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Añadir Servicio ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-zinc-950 dark:text-white text-base">Añadir Nuevo Servicio</h3>
                  <p className="text-xs text-zinc-400 font-medium">Disponible en reservas públicas y agenda interna</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                  Nombre del Servicio *
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Corte Fade Clásico"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all placeholder:text-zinc-400"
                />
              </div>

              {/* Categoría con sugerencias */}
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                  Categoría
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ej. Cortes, Barba, Combos, Tratamientos"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all placeholder:text-zinc-400"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-zinc-400 self-center">Sugerencias:</span>
                  {existingCategories.slice(0, 6).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        formData.category === cat
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-black'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Descripción (visible en página pública)
                  </label>
                  <span className="text-[10px] text-zinc-400">{formData.description.length}/500</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalla lo que incluye el servicio (ej. lavado, peinado con cera, toalla caliente)..."
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all placeholder:text-zinc-400 resize-none"
                />
              </div>

              {/* Precio & Duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                    Precio COP ($) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-zinc-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="35000"
                      className="w-full pl-7 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all placeholder:text-zinc-400"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium block mt-1">
                    {formData.price ? formatPrice(formData.price) : 'Valor en pesos'}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                    Duración (Minutos) *
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="absolute left-3 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="number"
                      min={5}
                      max={720}
                      step={5}
                      required
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="30"
                      className="w-full pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {DURATION_PRESETS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration: d.toString() })}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          formData.duration === d.toString()
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estado Inicial */}
              <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${formData.isActive ? 'text-emerald-500' : 'text-zinc-400'}`} />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Estado inicial del servicio</p>
                    <p className="text-[10px] text-zinc-400">
                      {formData.isActive ? 'Disponible de inmediato para reservas' : 'Inactivo (oculto en página pública)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer border transition-all ${
                    formData.isActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-200 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                  }`}
                >
                  {formData.isActive ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !formData.name.trim() || !formData.price}
                  className="flex-1 py-3 rounded-xl panel-btn-accent text-xs font-bold disabled:opacity-40 transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingNew ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Guardar Servicio</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Servicio ─────────────────────────────────────────── */}
      {editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-zinc-700 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-zinc-950 dark:text-white text-base">Editar Servicio</h3>
                  <p className="text-xs text-zinc-400 font-medium truncate max-w-xs">{editingService.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Aviso de seguridad sobre precios históricos */}
            <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <p className="leading-relaxed">
                <strong>Protección de datos:</strong> Si modificas el precio o duración, se aplicará únicamente a nuevas reservas. Las citas pasadas conservan su valor financiero original.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                  Nombre del Servicio *
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  maxLength={100}
                  value={editingService.name}
                  onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all"
                />
              </div>

              {/* Categoría con sugerencias */}
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                  Categoría
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={editingService.category}
                  onChange={e => setEditingService({ ...editingService, category: e.target.value })}
                  placeholder="Ej. Cortes, Barba, Combos, Tratamientos"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all placeholder:text-zinc-400"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-zinc-400 self-center">Sugerencias:</span>
                  {existingCategories.slice(0, 6).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditingService({ ...editingService, category: cat })}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        editingService.category === cat
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-black'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Descripción (visible en página pública)
                  </label>
                  <span className="text-[10px] text-zinc-400">{editingService.description.length}/500</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={editingService.description}
                  onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Detalla lo que incluye el servicio..."
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all placeholder:text-zinc-400 resize-none"
                />
              </div>

              {/* Precio & Duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                    Precio COP ($) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-zinc-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      required
                      value={editingService.price}
                      onChange={e => setEditingService({ ...editingService, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium block mt-1">
                    {editingService.price ? formatPrice(editingService.price) : 'Valor'}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                    Duración (Minutos) *
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="absolute left-3 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="number"
                      min={5}
                      max={720}
                      step={5}
                      required
                      value={editingService.duration}
                      onChange={e => setEditingService({ ...editingService, duration: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-amber-400 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {DURATION_PRESETS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditingService({ ...editingService, duration: d.toString() })}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          editingService.duration === d.toString()
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${editingService.isActive ? 'text-emerald-500' : 'text-zinc-400'}`} />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Disponibilidad en reservas</p>
                    <p className="text-[10px] text-zinc-400">
                      {editingService.isActive ? 'Activo (visible en web pública y agenda)' : 'Inactivo (oculto temporalmente)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingService({ ...editingService, isActive: !editingService.isActive })}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer border transition-all ${
                    editingService.isActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-200 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                  }`}
                >
                  {editingService.isActive ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || !editingService.name.trim()}
                  className="flex-1 py-3 rounded-xl panel-btn-accent text-xs font-bold disabled:opacity-40 transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Eliminación ───────────────────────────────────── */}
      {serviceToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-11 h-11 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-zinc-950 dark:text-white text-base">¿Eliminar servicio?</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Vas a remover <strong className="text-zinc-900 dark:text-white">{serviceToDelete.name}</strong> del catálogo.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mb-5">
              <AlertCircle className="w-4 h-4 inline mr-1 text-amber-600" />
              Si este servicio ya cuenta con citas en el historial, será <strong>archivado</strong> automáticamente para no alterar los reportes financieros ni las citas pasadas. Si nunca fue utilizado, se eliminará permanentemente.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
