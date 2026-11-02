'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Scissors, UserPlus, X, Trash2, Link as LinkIcon, Copy, Check, Search, RefreshCw, Pencil, Image as ImageIcon, ExternalLink, Zap, Lock, Upload, Camera, Loader2 } from 'lucide-react'
import { ConfirmImageDeleteModal } from '@/components/ui/ConfirmImageDeleteModal'

interface Barber {
  id: string
  name: string
  status: string
  avatar?: string | null
  specialty?: string | null
  phone?: string | null
  createdAt: string
  user?: {
    email: string
    inviteToken: string | null
    password: string | null
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editSpecialty, setEditSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showDeleteBarberAvatarConfirm, setShowDeleteBarberAvatarConfirm] = useState(false)
  const [showDeleteNewAvatarConfirm, setShowDeleteNewAvatarConfirm] = useState(false)
  const editAvatarInputRef = useRef<HTMLInputElement>(null)
  const newAvatarInputRef = useRef<HTMLInputElement>(null)
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null)
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'>('ALL')

  const filtered = barbers.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.user?.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const fetchBarbers = async () => {
    try {
      const res = await fetch('/api/barbers', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setBarbers(await res.json())
    } catch { toast.error('Error al cargar barberos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBarbers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    setLoading(true)
    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, avatar, specialty })
      })
      const data = await res.json()
      if (res.ok) {
        setName(''); setEmail(''); setAvatar(''); setSpecialty(''); setShowForm(false)
        fetchBarbers()
        toast.success('Barbero registrado. Pulsa "Activar Dashboard" para habilitar su acceso y generar su link.')
      } else { toast.error(data.error || 'Error al registrar') }
    } catch { toast.error('Error de red') }
    finally { setLoading(false) }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBarber || !editName) return
    setLoading(true)
    try {
      const res = await fetch(`/api/barbers/${editingBarber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          avatar: editAvatar,
          specialty: editSpecialty
        })
      })
      if (res.ok) {
        setEditingBarber(null)
        fetchBarbers()
        toast.success('Barbero actualizado correctamente')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar barbero')
      }
    } catch {
      toast.error('Error de red al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (b: Barber) => {
    setEditingBarber(b)
    setEditName(b.name || '')
    setEditAvatar(b.avatar || '')
    setEditSpecialty(b.specialty || '')
  }

  const handleUploadEditAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingBarber) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB.')
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('barberId', editingBarber.id)

    try {
      const res = await fetch('/api/barbers/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.avatarUrl) {
        setEditAvatar(data.avatarUrl)
        fetchBarbers()
        toast.success('Foto actualizada correctamente.')
      } else {
        toast.error(data.error || 'No se pudo actualizar la foto. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingAvatar(false)
      if (editAvatarInputRef.current) editAvatarInputRef.current.value = ''
    }
  }

  const handleRemoveEditAvatar = async () => {
    if (!editingBarber) return

    setUploadingAvatar(true)
    try {
      const res = await fetch(`/api/barbers/avatar?barberId=${editingBarber.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setEditAvatar('')
        setShowDeleteBarberAvatarConfirm(false)
        fetchBarbers()
        toast.success('Foto eliminada correctamente.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'No se pudo eliminar la foto. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo eliminar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUploadNewAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB.')
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/barbers/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.avatarUrl) {
        setAvatar(data.avatarUrl)
        toast.success('Foto actualizada correctamente.')
      } else {
        toast.error(data.error || 'No se pudo actualizar la foto. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingAvatar(false)
      if (newAvatarInputRef.current) newAvatarInputRef.current.value = ''
    }
  }

  const handleRemoveNewAvatar = () => {
    setAvatar('')
    setShowDeleteNewAvatarConfirm(false)
    toast.success('Foto eliminada correctamente.')
  }

  const confirmDelete = async () => {
    if (!barberToDelete) return
    const promise = fetch(`/api/barbers/${barberToDelete.id}`, { method: 'DELETE' })
    toast.promise(promise, {
      loading: 'Eliminando barbero...',
      success: () => { fetchBarbers(); setBarberToDelete(null); return 'Barbero eliminado' },
      error: () => { setBarberToDelete(null); return 'Error al eliminar' }
    })
  }

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await fetch(`/api/barbers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) { toast.success(newStatus === 'ACTIVE' ? 'Barbero activado' : 'Barbero desactivado'); fetchBarbers() }
      else toast.error('Error al cambiar estado')
    } catch { toast.error('Error de red') }
  }

  const handleResetAccess = async (id: string) => {
    if (!confirm('¿Generar nuevo enlace de acceso? El anterior quedará inválido.')) return
    const promise = async () => {
      const res = await fetch(`/api/barbers/invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLastInviteLink(data.inviteLink)
      fetchBarbers()
      return data
    }
    toast.promise(promise(), {
      loading: 'Generando enlace...',
      success: 'Nuevo enlace generado',
      error: (e: Error) => e.message
    })
  }

  const handleEnterAsBarber = async (barberId: string) => {
    const promise = async () => {
      const res = await fetch('/api/auth/impersonate-barber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al entrar al panel del barbero')
      window.location.href = data.redirect || '/barber/dashboard'
      return data
    }
    toast.promise(promise(), {
      loading: 'Ingresando al dashboard del barbero...',
      success: 'Acceso concedido',
      error: (e: Error) => e.message
    })
  }

  const handleActivateDashboard = async (barberId: string) => {
    const promise = async () => {
      const res = await fetch(`/api/barbers/${barberId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al activar dashboard')
      setLastInviteLink(data.inviteLink)
      fetchBarbers()
      if (data.inviteLink) {
        try {
          await navigator.clipboard.writeText(data.inviteLink)
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        } catch {
          // ignore
        }
      }
      return data
    }

    toast.promise(promise(), {
      loading: 'Activando dashboard del barbero...',
      success: '¡Dashboard activado! Enlace de acceso copiado al portapapeles',
      error: (e: Error) => e.message
    })
  }

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('¡Enlace copiado al portapapeles!')
    setTimeout(() => setCopied(false), 2000)
  }

  const activeCount = barbers.filter(b => b.status === 'ACTIVE').length
  const pendingCount = barbers.filter(b => b.status === 'PENDING').length
  const inactiveCount = barbers.filter(b => b.status === 'INACTIVE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Equipo</p>
              <p className="text-2xl font-black text-zinc-950">{barbers.length} barberos</p>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Activos</p>
              <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Pendientes</p>
              <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Inactivos</p>
              <p className="text-2xl font-black text-zinc-400">{inactiveCount}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Barbero
        </button>
      </div>

      {/* Invite Link Banner */}
      {lastInviteLink && (
        <div className="bg-zinc-950 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-950 opacity-50" />
          <div className="relative flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">Enlace de acceso / invitación</p>
              <p className="text-zinc-400 text-xs">Comparte este enlace con el barbero o entra a su portal</p>
            </div>
          </div>
          <div className="relative flex-1 flex items-center gap-3 w-full sm:w-auto">
            <input
              readOnly
              value={lastInviteLink}
              className="flex-1 bg-white/10 border border-white/10 text-white text-xs font-mono px-4 py-2.5 rounded-xl outline-none min-w-0 w-full select-all"
            />
            <button
              onClick={() => copyLink(lastInviteLink)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-zinc-100'}`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar Link'}
            </button>
            <a
              href={lastInviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-all shrink-0 border border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Entrar
            </a>
          </div>
          <button onClick={() => setLastInviteLink(null)} className="relative text-zinc-500 hover:text-white transition-colors p-1 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-[#18181b] transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
        </div>
        <div className="flex gap-1 bg-zinc-100 dark:bg-[#18181b] p-1 rounded-xl overflow-x-auto">
          {([
            { id: 'ALL', label: 'Todos' },
            { id: 'ACTIVE', label: `Activos (${activeCount})` },
            { id: 'PENDING', label: `Pendientes (${pendingCount})` },
            { id: 'INACTIVE', label: `Inactivos (${inactiveCount})` }
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === s.id ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-950 dark:text-white font-black' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
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
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Barbero</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Estado</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Acceso</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                      <span className="text-sm text-zinc-400 font-medium">Cargando equipo...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? filtered.map(barber => (
                <tr key={barber.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-[#1f1f23] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {barber.avatar ? (
                        <img
                          src={barber.avatar}
                          alt={barber.name}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0">
                          {getInitials(barber.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-zinc-950 dark:text-white text-sm uppercase tracking-tight">{barber.name}</p>
                        <p className="text-xs text-zinc-400">
                          {barber.specialty ? <span className="text-zinc-600 dark:text-zinc-400 font-medium">{barber.specialty} • </span> : null}
                          {barber.user?.email || 'Sin correo'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      barber.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : barber.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        barber.status === 'ACTIVE' 
                          ? 'bg-emerald-500' 
                          : barber.status === 'PENDING'
                          ? 'bg-amber-500'
                          : 'bg-zinc-300'
                      }`} />
                      {barber.status === 'ACTIVE' ? 'Activo' : barber.status === 'PENDING' ? 'Pendiente' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      barber.user?.password
                        ? 'bg-blue-100 text-blue-700'
                        : barber.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {barber.user?.password 
                        ? '✓ Configurado' 
                        : barber.status === 'ACTIVE' 
                        ? '⚡ Dashboard Activo' 
                        : '⏳ Sin Activar'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botón Activar Dashboard si está PENDING */}
                      {barber.status === 'PENDING' && (
                        <button
                          onClick={() => handleActivateDashboard(barber.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-95"
                          title="Activar cuenta del barbero y generar enlace de acceso al dashboard"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Activar Dashboard</span>
                        </button>
                      )}

                      {/* Botón Entrar si está ACTIVE */}
                      {barber.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleEnterAsBarber(barber.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                          title="Entrar directamente al panel de este barbero como supervisor"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Entrar</span>
                        </button>
                      )}

                      {/* Botón Reactivar si está INACTIVE */}
                      {barber.status === 'INACTIVE' && (
                        <button
                          onClick={() => handleActivateDashboard(barber.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                          title="Reactivar dashboard del barbero"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Reactivar</span>
                        </button>
                      )}

                      {/* Botón de Copiar Link de Acceso */}
                      <button
                        onClick={async () => {
                          let token = barber.user?.inviteToken
                          if (!token) {
                            try {
                              const res = await fetch(`/api/barbers/${barber.id}/activate`, { method: 'POST' })
                              const data = await res.json()
                              if (data.inviteLink) {
                                setLastInviteLink(data.inviteLink)
                                copyLink(data.inviteLink)
                                fetchBarbers()
                                return
                              }
                            } catch {
                              // fallback
                            }
                          }
                          const link = `${window.location.origin}/barber/access/${token || barber.id}`
                          setLastInviteLink(link)
                          copyLink(link)
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all border border-zinc-200 active:scale-95"
                        title="Copiar enlace de acceso directo al dashboard de este barbero"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Link</span>
                      </button>

                      {/* Botón Editar */}
                      <button
                        onClick={() => openEditModal(barber)}
                        className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 transition-all"
                        title="Editar información y foto"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Regenerar Acceso (Solo si está activo) */}
                      {barber.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleResetAccess(barber.id)}
                          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-all"
                          title="Generar nuevo enlace de invitación/acceso"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Toggle Estado (Pausar si está activo) */}
                      {barber.status === 'ACTIVE' && (
                        <button
                          onClick={() => toggleStatus(barber.id, barber.status)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                          title="Pausar barbero temporalmente"
                        >
                          Pausar
                        </button>
                      )}

                      {/* Eliminar */}
                      <button
                        onClick={() => setBarberToDelete(barber)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all"
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
                        <Scissors className="w-6 h-6 text-zinc-300" />
                      </div>
                      <p className="text-sm text-zinc-400 font-medium">No se encontraron barberos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Barber Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-zinc-950">Registrar Barbero</h3>
                  <p className="text-xs text-zinc-400">Se enviará un enlace de invitación</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Carlos Ruiz"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Correo Electrónico *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="barbero@email.com"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Especialidad (opcional)</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  placeholder="Ej. Master Fade & Barba"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Foto de Perfil (opcional)</label>
                <div className="flex items-center gap-3 p-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white relative overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200 shadow-2xs">
                    {avatar ? (
                      <img src={avatar} alt={name || 'Barbero'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-zinc-400">
                        {name ? getInitials(name) : <Camera size={16} />}
                      </span>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-800 truncate">
                      {avatar ? 'Foto lista para asociar' : 'Sin foto'}
                    </p>
                    <p className="text-[10px] text-zinc-400">JPG, PNG o WEBP (máx. 5MB)</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={newAvatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUploadNewAvatar}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => newAvatarInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload size={12} /> {avatar ? 'Cambiar' : 'Subir Foto'}
                        </>
                      )}
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteNewAvatarConfirm(true)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 rounded-xl transition-all cursor-pointer"
                        title="Quitar foto"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={!name || !email || loading} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors">
                  {loading ? 'Generando...' : 'Generar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Barber Modal */}
      {editingBarber && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-zinc-950">Editar Barbero</h3>
                  <p className="text-xs text-zinc-400">Modifica nombre, especialidad o foto de perfil</p>
                </div>
              </div>
              <button onClick={() => setEditingBarber(null)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Ej. Carlos Ruiz"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Especialidad</label>
                <input
                  type="text"
                  value={editSpecialty}
                  onChange={e => setEditSpecialty(e.target.value)}
                  placeholder="Ej. Master Fade & Barba"
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 bg-white transition-colors placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Foto de Perfil</label>
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div className="w-14 h-14 rounded-xl bg-zinc-950 text-white relative overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    {editAvatar ? (
                      <img src={editAvatar} alt={editName || 'Barbero'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-zinc-400">
                        {editName ? getInitials(editName) : <Camera size={18} />}
                      </span>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {editAvatar ? 'Foto asignada' : 'Sin foto'}
                    </p>
                    <p className="text-[10px] text-zinc-400">JPG, PNG o WEBP (máx. 5MB)</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={editAvatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUploadEditAvatar}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => editAvatarInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload size={12} /> {editAvatar ? 'Cambiar Foto' : 'Subir Foto'}
                        </>
                      )}
                    </button>
                    {editAvatar && (
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => setShowDeleteBarberAvatarConfirm(true)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all cursor-pointer"
                        title="Quitar foto"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingBarber(null)} className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={!editName || loading} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors">
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {barberToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-zinc-950 mb-1">¿Eliminar barbero?</h3>
                <p className="text-sm text-zinc-500">
                  Se eliminará a <strong className="text-zinc-700">{barberToDelete.name}</strong> y su acceso. Esta acción es irreversible.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBarberToDelete(null)} className="flex-1 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación para eliminar foto de barbero en edición */}
      <ConfirmImageDeleteModal
        isOpen={showDeleteBarberAvatarConfirm}
        isDeleting={uploadingAvatar}
        title="¿Eliminar foto de perfil?"
        description="¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer."
        confirmText="Eliminar foto"
        cancelText="Cancelar"
        onClose={() => setShowDeleteBarberAvatarConfirm(false)}
        onConfirm={handleRemoveEditAvatar}
      />

      {/* Confirmación para eliminar foto en nuevo barbero */}
      <ConfirmImageDeleteModal
        isOpen={showDeleteNewAvatarConfirm}
        title="¿Eliminar foto seleccionada?"
        description="¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer."
        confirmText="Eliminar foto"
        cancelText="Cancelar"
        onClose={() => setShowDeleteNewAvatarConfirm(false)}
        onConfirm={handleRemoveNewAvatar}
      />

    </div>
  )
}
