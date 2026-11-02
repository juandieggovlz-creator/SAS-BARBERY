'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Search, X, UserPlus, Pencil, Trash2, Phone, Calendar, Users, ChevronRight } from 'lucide-react'

interface Client {
  id: string
  name: string
  phone: string
  createdAt: string
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-emerald-600',
  'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600'
]
function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<{ id: string; name: string; phone: string } | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch {
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return
    const promise = fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    toast.promise(promise, {
      loading: 'Registrando cliente...',
      success: () => { setFormData({ name: '', phone: '' }); setShowForm(false); fetchClients(); return 'Cliente registrado con éxito' },
      error: 'Error al registrar cliente'
    })
  }

  const handleUpdate = async () => {
    if (!editingClient) return
    const original = clients.find(c => c.id === editingClient.id)
    if (original?.name === editingClient.name && original?.phone === editingClient.phone) {
      setEditingClient(null); return
    }
    const promise = fetch(`/api/clients/${editingClient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingClient.name, phone: editingClient.phone })
    })
    toast.promise(promise, {
      loading: 'Actualizando...',
      success: () => { fetchClients(); setEditingClient(null); return 'Cliente actualizado' },
      error: 'Error al actualizar'
    })
  }

  const confirmDelete = async () => {
    if (!clientToDelete) return
    const promise = fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE' })
    toast.promise(promise, {
      loading: 'Eliminando...',
      success: () => { fetchClients(); setClientToDelete(null); return 'Cliente eliminado' },
      error: () => { setClientToDelete(null); return 'Error al eliminar' }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Total</p>
            <p className="text-2xl font-black text-zinc-950">{clients.length} clientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
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
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-50/80 dark:bg-[#18181b]">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Teléfono</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Registrado</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                      <span className="text-sm text-zinc-400 font-medium">Cargando clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? filtered.map((client, i) => (
                <tr key={client.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-[#1f1f23] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${avatarColor(client.name)} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-bold text-zinc-950 dark:text-white text-sm hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 group/link"
                        >
                          {client.name}
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                        <span className="text-[10px] text-zinc-400 font-medium">#{String(i + 1).padStart(3, '0')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-sm font-medium">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      {client.phone || <span className="text-zinc-300 italic text-xs">Sin teléfono</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                      {new Date(client.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingClient({ id: client.id, name: client.name, phone: client.phone })}
                        className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client)}
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
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-zinc-300" />
                      </div>
                      <p className="text-sm text-zinc-400 font-medium">No se encontraron clientes</p>
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
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${avatarColor(editingClient.name)} flex items-center justify-center text-white text-sm font-black`}>
                  {getInitials(editingClient.name)}
                </div>
                <div>
                  <h3 className="font-black text-zinc-950">Editar Cliente</h3>
                  <p className="text-xs text-zinc-400">{editingClient.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingClient(null)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre</label>
                <input
                  autoFocus
                  type="text"
                  value={editingClient.name}
                  onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                <input
                  type="text"
                  value={editingClient.phone}
                  onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditingClient(null) }}
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingClient(null)} className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors">Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-zinc-950">Nuevo Cliente</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre completo</label>
                <input
                  autoFocus
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Juan Martínez"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej. +57 321 000 0000"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={!formData.name || !formData.phone} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-zinc-950 mb-1">¿Eliminar cliente?</h3>
                <p className="text-sm text-zinc-500">
                  Se eliminará a <strong className="text-zinc-700">{clientToDelete.name}</strong> de forma permanente. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setClientToDelete(null)} className="flex-1 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
