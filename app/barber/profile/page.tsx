'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { User, Save, Camera, Mail, BadgeCheck, Phone, FileText, MessageCircle, Share2, Eye, Upload, Trash2, Loader2 } from 'lucide-react'
import { ConfirmImageDeleteModal } from '@/components/ui/ConfirmImageDeleteModal'

interface BarberProfileData {
  id: string
  name: string
  specialty?: string | null
  avatar?: string | null
  phone?: string | null
  bio?: string | null
  instagram?: string | null
  whatsapp?: string | null
  tiktok?: string | null
  user?: { email: string }
}

export default function BarberProfilePage() {
  const [profile, setProfile] = useState<BarberProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setFetchError(null)
    try {
      const res = await fetch('/api/barber/profile')
      const data = await res.json()
      if (!res.ok) {
        setFetchError(data?.error || 'No se pudo cargar el perfil')
      } else {
        setProfile(data)
      }
    } catch {
      setFetchError('Error de conexión al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

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
    formData.append('barberId', profile.id)

    try {
      const res = await fetch('/api/barbers/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null)
        toast.success('Foto actualizada correctamente.')
      } else {
        toast.error(data.error || 'No se pudo actualizar la foto. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (!profile) return

    setUploadingAvatar(true)
    try {
      const res = await fetch(`/api/barbers/avatar?barberId=${profile.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, avatar: null } : null)
        setShowDeleteAvatarConfirm(false)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch('/api/barber/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        toast.success('Perfil actualizado correctamente')
      } else {
        toast.error('Error al guardar perfil')
      }
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-zinc-500 font-bold uppercase text-xs">Cargando perfil...</div>
  }

  if (fetchError || !profile) {
    return (
      <div className="p-10 flex flex-col items-center gap-4">
        <p className="text-red-500 font-bold uppercase text-xs">{fetchError || 'No se encontró el perfil del barbero'}</p>
        <button
          onClick={fetchProfile}
          className="bg-black text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-black uppercase tracking-tighter">Mi Perfil</h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2 ml-1">
            Información personal y redes que se muestran en la página pública
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PROFILE EDITOR */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="bg-zinc-50 p-8 flex flex-col items-center border-b border-zinc-100">
            <div className="relative group">
              <div className="w-32 h-32 bg-black rounded-3xl flex items-center justify-center text-white text-5xl font-black shadow-2xl relative overflow-hidden">
                {profile.avatar ? (
                  <Image src={profile.avatar} alt={profile.name || 'Barbero'} fill className="object-cover" unoptimized />
                ) : (
                  (profile.name || 'B').charAt(0).toUpperCase()
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadAvatar}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={13} /> {profile.avatar ? 'Cambiar Foto' : 'Subir Foto'}
                  </>
                )}
              </button>
              {profile.avatar && (
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => setShowDeleteAvatarConfirm(true)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 rounded-xl transition-all cursor-pointer"
                  title="Quitar foto"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-xl font-black text-black uppercase tracking-tight">{profile.name}</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                {profile.specialty || 'Barbero Profesional'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black focus:border-black outline-none"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 ml-1">Teléfono Móvil</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="text"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black focus:border-black outline-none"
                    placeholder="+57 300 000 0000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 ml-1">Especialidad</label>
              <div className="relative">
                <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={profile.specialty || ''}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black focus:border-black outline-none"
                  placeholder="Ej. Fade & Barba Tradicional"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 ml-1">Descripción / Bio Pública</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-zinc-400" size={18} />
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-black focus:border-black outline-none resize-none"
                  placeholder="Escribe una breve descripción sobre tus años de experiencia, estilo de corte..."
                />
              </div>
            </div>

            {/* REDES SOCIALES */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-black uppercase text-zinc-400 ml-1">Redes Sociales</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={18} />
                  <input
                    type="text"
                    value={profile.instagram || ''}
                    onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black focus:border-black outline-none"
                    placeholder="@usuario_instagram"
                  />
                </div>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  <input
                    type="text"
                    value={profile.whatsapp || ''}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black focus:border-black outline-none"
                    placeholder="+57 300 000 0000"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar Cambios de Perfil'}
            </button>
          </form>
        </div>

        {/* PUBLIC CARD PREVIEW */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6">
              <Eye size={16} />
              Vista Previa Página Pública
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 text-white text-center space-y-4 shadow-xl">
              <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-zinc-800 relative border-2 border-amber-500/40">
                {profile.avatar ? (
                  <Image src={profile.avatar} alt={profile.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black">{profile.name.charAt(0)}</div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-black uppercase tracking-tight">{profile.name}</h4>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-0.5">
                  {profile.specialty || 'Especialista BarberOS'}
                </p>
              </div>

              <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">
                "{profile.bio || 'Especialista en cortes modernos, degradados limpios y perfilaría de barba profesional.'}"
              </p>

              <div className="flex justify-center gap-3 pt-2">
                {profile.instagram && (
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-pink-400">
                    <Share2 size={14} />
                  </span>
                )}
                {profile.whatsapp && (
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                    <MessageCircle size={14} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmImageDeleteModal
        isOpen={showDeleteAvatarConfirm}
        isDeleting={uploadingAvatar}
        title="¿Eliminar foto de perfil?"
        description="¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer."
        confirmText="Eliminar foto"
        cancelText="Cancelar"
        onClose={() => setShowDeleteAvatarConfirm(false)}
        onConfirm={handleRemoveAvatar}
      />
    </div>
  )
}
