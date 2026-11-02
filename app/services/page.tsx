'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Scissors, Plus, X, Trash2, Pencil, Clock, DollarSign, Tag, Search } from 'lucide-react'

interface Service {
  id: string
  name: string
  price: string
  duration: number
  category?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'Cortes':    'bg-blue-100 text-blue-700',
  'Barba':     'bg-amber-100 text-amber-700',
  'Combos':    'bg-violet-100 text-violet-700',
  'Especiales':'bg-rose-100 text-rose-700',
}

function formatPrice(price: string | number) {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState({ name: '', price: '', duration: '30', category: '' })
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<{ id: string; name: string; price: string; duration: string; category: string } | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error()
      setServices(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchServices() }, [])

  const handleUpdate = async () => {
    if (!editingService) return
    const original = services.find(s => s.id === editingService.id)
    if (
      original?.name === editingService.name &&
      original?.price.toString() === editingService.price &&
      original?.duration.toString() === editingService.duration
    ) { setEditingService(null); return }

    const promise = fetch(`/api/services/${editingService.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingService.name, price: editingService.price, duration: editingService.duration, category: editingService.category })
    })
    toast.promise(promise, {
      loading: 'Actualizando servicio...',
      success: () => { fetchServices(); setEditingService(null); return 'Servicio actualizado' },
      error: 'Error al actualizar'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) return
    const promise = fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, price: parseFloat(formData.price), duration: parseInt(formData.duration), barbershopId: 'default' })
    })
    toast.promise(promise, {
      loading: 'Guardando servicio...',
      success: () => { setFormData({ name: '', price: '', duration: '30', category: '' }); setShowForm(false); fetchServices(); return 'Servicio guardado' },
      error: 'Error al guardar'
    })
  }

  const confirmDelete = async () => {
    if (!serviceToDelete) return
    const promise = fetch(`/api/services/${serviceToDelete.id}`, { method: 'DELETE' })
    toast.promise(promise, {
      loading: 'Eliminando...',
      success: () => { fetchServices(); setServiceToDelete(null); return 'Servicio eliminado' },
      error: 'Error al eliminar'
    })
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Catálogo</p>
              <p className="text-2xl font-black text-zinc-950">{services.length} servicios</p>
            </div>

          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Añadir Servicio
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-[#18181b] transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 text-white px-4 py-2.5 rounded-xl text-xs font-bold shrink-0">
          <span>{filtered.length}</span>
          <span className="text-zinc-400">resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#18181b]">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Servicio</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoría</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Duración</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Precio</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                      <span className="text-sm text-zinc-400 font-medium">Cargando catálogo...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? filtered.map(service => (
                <tr key={service.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-[#1f1f23] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                        <Scissors className="w-4 h-4 text-zinc-500" />
                      </div>
                      <span className="font-bold text-zinc-950 dark:text-white text-sm">{service.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {service.category ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${CATEGORY_COLORS[service.category] || 'bg-zinc-100 text-zinc-500'}`}>
                        {service.category}
                      </span>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 text-sm font-medium">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {service.duration} min
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-emerald-700 font-black text-sm">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatPrice(service.price).replace('$', '').trim()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingService({ id: service.id, name: service.name, price: service.price.toString(), duration: service.duration.toString(), category: service.category || '' })}
                        className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setServiceToDelete(service)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center">
                        <Scissors className="w-6 h-6 text-zinc-300" />
                      </div>
                      <p className="text-sm text-zinc-400 font-medium">No se encontraron servicios</p>
                      {search && <button onClick={() => setSearch('')} className="text-xs text-zinc-500 underline">Limpiar búsqueda</button>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <h3 className="font-black text-zinc-950">Editar Servicio</h3>
                  <p className="text-xs text-zinc-400">{editingService.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingService(null)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre del Servicio</label>
                <input
                  autoFocus
                  type="text"
                  value={editingService.name}
                  onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Categoría</label>
                <input
                  type="text"
                  value={editingService.category}
                  onChange={e => setEditingService({ ...editingService, category: e.target.value })}
                  placeholder="Ej. Cortes, Barba, Combos"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={e => setEditingService({ ...editingService, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Duración (min)</label>
                  <input
                    type="number"
                    value={editingService.duration}
                    onChange={e => setEditingService({ ...editingService, duration: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditingService(null) }}
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingService(null)} className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors">Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Service Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-zinc-950">Añadir Servicio</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre del Servicio</label>
                <input
                  autoFocus
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Corte Fade"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Categoría</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ej. Cortes, Barba, Combos"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="35000"
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Minutos</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="30"
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={!formData.name || !formData.price} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors">Guardar Servicio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {serviceToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-zinc-950 mb-1">¿Eliminar servicio?</h3>
                <p className="text-sm text-zinc-500">
                  Se eliminará <strong className="text-zinc-700">{serviceToDelete.name}</strong> del catálogo permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setServiceToDelete(null)} className="flex-1 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
