'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  User, 
  Shield, 
  Palette, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Store, 
  Mail, 
  KeyRound, 
  Sparkles, 
  ShieldCheck,
  Check,
  Info,
  Upload,
  Trash2,
  ImageIcon,
  Copy,
  MapPin,
  Phone,
  Globe
} from 'lucide-react'
import AccentColorPicker from '@/components/ui/AccentColorPicker'
import { ConfirmImageDeleteModal } from '@/components/ui/ConfirmImageDeleteModal'
import { getPublicPageUrl } from '@/lib/url'

interface UserProfile {
  id: string
  name: string
  avatar?: string | null
  email: string
  role: string
  hasPassword: boolean
  isGoogleUser: boolean
  createdAt: string
  businessName: string
  businessLogo?: string | null
  businessSlug?: string | null
}

interface BusinessData {
  id: string
  name: string
  slug: string
  phone?: string | null
  address?: string | null
  mapsUrl?: string | null
  description?: string | null
  email?: string | null
  logo?: string | null
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [business, setBusiness] = useState<BusinessData | null>(null)

  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN'

  // Tabs: 'business' | 'account' | 'security' | 'appearance'
  const initialTabParam = searchParams?.get('tab') as 'business' | 'account' | 'security' | 'appearance' | null
  const [activeTab, setActiveTab] = useState<'business' | 'account' | 'security' | 'appearance'>('account')

  // Logo uploader state
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deleteLogoOpen, setDeleteLogoOpen] = useState(false)
  const [deletingLogo, setDeletingLogo] = useState(false)

  // Business form state
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessMapsUrl, setBusinessMapsUrl] = useState('')
  const [savingBusiness, setSavingBusiness] = useState(false)

  // Account form state (Personal)
  const [userName, setUserName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Avatar personal state
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [deleteAvatarOpen, setDeleteAvatarOpen] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Copied link state
  const [copiedLink, setCopiedLink] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Perfil del usuario
      const profileRes = await fetch('/api/user/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData?.user) {
          setUserProfile(profileData.user)
          setUserName(profileData.user.name || '')

          // Si es dueño o superadmin, traer también datos de la barbería
          if (profileData.user.role === 'OWNER' || profileData.user.role === 'SUPER_ADMIN') {
            const bizRes = await fetch('/api/owner/business')
            if (bizRes.ok) {
              const bizData = await bizRes.json()
              if (bizData && bizData.name) {
                setBusiness(bizData)
                setBusinessName(bizData.name || '')
                setBusinessPhone(bizData.phone || '')
                setBusinessAddress(bizData.address || '')
                setBusinessMapsUrl(bizData.mapsUrl || '')
              }
            }
          }
        }
      } else {
        toast.error('Error al cargar la información de tu cuenta')
      }
    } catch {
      toast.error('Error de conexión al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const handleBusinessUpdate = () => {
      fetch('/api/owner/business')
        .then(res => res.ok ? res.json() : null)
        .then(bizData => {
          if (bizData && bizData.name) {
            setBusiness(bizData)
            setBusinessName(bizData.name || '')
            setBusinessPhone(bizData.phone || '')
            setBusinessAddress(bizData.address || '')
            setBusinessMapsUrl(bizData.mapsUrl || '')
          }
        })
        .catch(() => {})
    }

    window.addEventListener('business-updated', handleBusinessUpdate)
    return () => window.removeEventListener('business-updated', handleBusinessUpdate)
  }, [])

  // Sync tab with URL if changed or adjust default
  useEffect(() => {
    if (!userProfile) return
    const isOwnerRole = userProfile.role === 'OWNER' || userProfile.role === 'SUPER_ADMIN'
    
    if (initialTabParam) {
      if (isOwnerRole && ['business', 'account', 'security', 'appearance'].includes(initialTabParam)) {
        setActiveTab(initialTabParam)
      } else if (!isOwnerRole && ['account', 'security', 'appearance'].includes(initialTabParam)) {
        setActiveTab(initialTabParam)
      }
    } else {
      // Default: 'business' si es propietario, 'account' si es barbero/otro
      setActiveTab(isOwnerRole ? 'business' : 'account')
    }
  }, [searchParams, userProfile])

  // ── SUBIDA DE LOGO (Misma API y Cloudinary que el Editor Web) ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no admitido. Sube una imagen JPG, PNG o WEBP por seguridad.')
      if (logoInputRef.current) logoInputRef.current.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El logotipo no debe superar los 5MB de tamaño.')
      if (logoInputRef.current) logoInputRef.current.value = ''
      return
    }

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/owner/business/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.logoUrl) {
        setBusiness(prev => prev ? { ...prev, logo: data.logoUrl } : null)
        setUserProfile(prev => prev ? { ...prev, businessLogo: data.logoUrl } : null)
        toast.success('¡Logotipo de la barbería actualizado con éxito!')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        toast.error(data.error || 'No se pudo actualizar el logotipo')
      }
    } catch {
      toast.error('Error de conexión al subir el logotipo')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  // ── ELIMINACIÓN DE LOGO ──
  const handleDeleteLogo = async () => {
    setDeletingLogo(true)
    try {
      const res = await fetch('/api/owner/business/logo', {
        method: 'DELETE',
      })
      if (res.ok) {
        setBusiness(prev => prev ? { ...prev, logo: null } : null)
        setUserProfile(prev => prev ? { ...prev, businessLogo: null } : null)
        setDeleteLogoOpen(false)
        toast.success('Logotipo eliminado correctamente')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'No se pudo eliminar el logotipo')
      }
    } catch {
      toast.error('Error de red al eliminar logotipo')
    } finally {
      setDeletingLogo(false)
    }
  }

  // ── ACTUALIZACIÓN DE DATOS DEL NEGOCIO (Comercial) ──
  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName.trim()) {
      toast.error('El nombre comercial de la barbería es obligatorio')
      return
    }

    setSavingBusiness(true)
    try {
      const res = await fetch('/api/owner/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName.trim(),
          phone: businessPhone.trim() || null,
          address: businessAddress.trim() || null,
          mapsUrl: businessMapsUrl.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setBusiness(prev => prev ? { ...prev, ...data } : null)
        setUserProfile(prev => prev ? { ...prev, businessName: data.name } : null)
        toast.success('Datos comerciales de la barbería actualizados ✨')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        toast.error(data.error || 'Error al guardar los datos del negocio')
      }
    } catch {
      toast.error('Error de red al guardar datos de la barbería')
    } finally {
      setSavingBusiness(false)
    }
  }

  // ── ACTUALIZACIÓN DE NOMBRE PERSONAL (Titular) ──
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim()) {
      toast.error('El nombre personal no puede estar vacío')
      return
    }

    setSavingName(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName.trim() }),
      })

      const data = await res.json()
      if (res.ok) {
        setUserProfile(prev => (prev ? { ...prev, name: data.user.name } : null))
        toast.success('Nombre personal actualizado correctamente ✨')
      } else {
        toast.error(data.error || 'Error al actualizar el nombre')
      }
    } catch {
      toast.error('Error de red al actualizar nombre')
    } finally {
      setSavingName(false)
    }
  }

  // ── SUBIDA Y GESTIÓN DE FOTO DE PERFIL PERSONAL (Titular) ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La foto de perfil no puede superar los 5MB')
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.avatarUrl) {
        setUserProfile(prev => (prev ? { ...prev, avatar: data.avatarUrl } : null))
        toast.success('Foto de perfil personal actualizada ✨')
      } else {
        toast.error(data.error || 'No se pudo subir la foto de perfil')
      }
    } catch {
      toast.error('Error de conexión al subir foto de perfil')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleDeleteAvatar = async () => {
    setDeletingAvatar(true)
    try {
      const res = await fetch('/api/user/avatar', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setUserProfile(prev => (prev ? { ...prev, avatar: null } : null))
        toast.success('Foto de perfil personal eliminada')
        setDeleteAvatarOpen(false)
      } else {
        toast.error(data.error || 'No se pudo eliminar la foto de perfil')
      }
    } catch {
      toast.error('Error de conexión al eliminar foto de perfil')
    } finally {
      setDeletingAvatar(false)
    }
  }

  // ── SOLICITUD DE CÓDIGO OTP PARA CAMBIO DE CONTRASEÑA ──
  const handleRequestCode = async () => {
    setSendingCode(true)
    try {
      const res = await fetch('/api/user/change-password/code', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setCodeSent(true)
        toast.success(data.message || 'Código de confirmación enviado a tu correo')
      } else {
        toast.error(data.error || 'No se pudo enviar el código de confirmación')
      }
    } catch {
      toast.error('Error de conexión al solicitar el código')
    } finally {
      setSendingCode(false)
    }
  }

  // ── CAMBIO DE CONTRASEÑA ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userProfile?.hasPassword && !currentPassword) {
      toast.error('Debes ingresar tu contraseña actual')
      return
    }

    if (userProfile?.isGoogleUser && !verificationCode.trim()) {
      toast.error('Por seguridad debes ingresar el código de confirmación enviado a tu correo')
      return
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('La confirmación de la nueva contraseña no coincide')
      return
    }

    if (userProfile?.hasPassword && currentPassword === newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          verificationCode: verificationCode.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('¡Contraseña actualizada exitosamente!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setVerificationCode('')
        setCodeSent(false)
        fetchData()
      } else {
        toast.error(data.error || 'No se pudo cambiar la contraseña')
      }
    } catch {
      toast.error('Error de red al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  const copyPublicPageLink = () => {
    const slug = business?.slug || userProfile?.businessSlug
    if (!slug) return
    const url = getPublicPageUrl(slug)
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    toast.success('Enlace de la página pública copiado al portapapeles 🚀')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Cargando configuración de la cuenta...
          </span>
        </div>
      </div>
    )
  }

  if (!userProfile) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Banner de Perfil: Personal del Titular + Vinculación Comercial ── */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar Personal del Titular (Separado estrictamente del logotipo de la barbería) */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 relative border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {userProfile.avatar ? (
              <Image
                src={userProfile.avatar}
                alt={userProfile.name || 'Usuario'}
                fill
                sizes="64px"
                className="object-cover"
                priority
              />
            ) : (
              <span className="text-xl font-black text-amber-400">
                {(userProfile.name || userProfile.email || 'U').substring(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                {userProfile.name || 'Usuario BarberOS'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {userProfile.role}
              </span>
            </div>
            <p className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
              {userProfile.email}
            </p>

            {/* Identidad comercial vinculada */}
            {userProfile.businessName && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Barbería: <strong className="text-zinc-950 dark:text-zinc-100">{userProfile.businessName}</strong></span>
              </div>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/webpage"
              className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
            >
              <Store size={14} className="text-amber-500" /> Editor Web
            </Link>
          </div>
        )}
      </div>

      {/* ── Navegación de Pestañas ── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'business'
                ? 'bg-zinc-950 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-md border border-transparent dark:border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Store size={14} /> Mi Barbería
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'account'
              ? 'bg-zinc-950 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-md border border-transparent dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
          }`}
        >
          <User size={14} /> Mi Cuenta
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-zinc-950 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-md border border-transparent dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
          }`}
        >
          <Shield size={14} /> Seguridad
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-zinc-950 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-md border border-transparent dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
          }`}
        >
          <Palette size={14} /> Apariencia del Panel
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          1. MI BARBERÍA (Gestión Comercial del Propietario)
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'business' && isOwner && (
        <div className="space-y-6">
          {/* A. LOGOTIPO DEL NEGOCIO */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" /> Logotipo Oficial de la Barbería
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Este logo identifica tu marca en el panel administrativo, el Editor Web y tu página pública de reservas.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 w-fit">
                Misma fuente que Editor Web
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview del logo comercial */}
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-zinc-950 text-white flex items-center justify-center font-black shadow-md shrink-0 relative border border-zinc-200 dark:border-zinc-800">
                {business?.logo ? (
                  <Image
                    src={business.logo}
                    alt={business.name || 'Logo Barbería'}
                    fill
                    sizes="112px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400 gap-1.5 p-2 text-center">
                    <ImageIcon className="w-7 h-7 text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-500">Sin logotipo</span>
                  </div>
                )}
              </div>

              {/* Botones de acción del logo */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="panel-btn-accent px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> {business?.logo ? 'Cambiar Logotipo' : 'Subir Logotipo'}
                      </>
                    )}
                  </button>

                  {business?.logo && (
                    <button
                      type="button"
                      disabled={uploadingLogo || deletingLogo}
                      onClick={() => setDeleteLogoOpen(true)}
                      className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg">
                  Formatos permitidos: <strong>JPG, PNG o WEBP</strong>. Tamaño máximo: <strong>5MB</strong>.
                  La imagen se almacena de forma segura en la nube (Cloudinary) y se sincroniza al instante en todos tus canales.
                </p>
              </div>
            </div>
          </div>

          {/* B. INFORMACIÓN COMERCIAL DEL ESTABLECIMIENTO */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" /> Identidad Comercial de la Barbería
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Datos públicos de tu local. Cambiar el nombre comercial no altera tu nombre personal como titular.
              </p>
            </div>

            <form onSubmit={handleUpdateBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Comercial */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Nombre Comercial del Negocio <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Ej: Barbería Don Juan"
                    className="w-full px-3.5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all"
                  />
                </div>

                {/* Teléfono del Negocio */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={e => setBusinessPhone(e.target.value)}
                    placeholder="Ej: +57 300 123 4567"
                    className="w-full px-3.5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all font-mono"
                  />
                </div>

                {/* Dirección Física */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Dirección del Local
                  </label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={e => setBusinessAddress(e.target.value)}
                    placeholder="Ej: Cra 15 # 85-20, Bogotá"
                    className="w-full px-3.5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all"
                  />
                </div>

                {/* Enlace de Google Maps */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Enlace de Google Maps
                  </label>
                  <input
                    type="url"
                    value={businessMapsUrl}
                    onChange={e => setBusinessMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full px-3.5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Aviso Informativo: Eslogan y Descripción gestionados en Editor Web */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-950 dark:text-zinc-100 font-bold block">Eslogan y Descripción de Portada</strong>
                    Para evitar duplicidades, la descripción y el eslogan comercial de tu barbería se administran exclusivamente desde el Editor Web.
                  </div>
                </div>
                <Link
                  href="/webpage"
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Store size={13} /> Ir a Editor Web
                </Link>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingBusiness}
                  className="panel-btn-accent px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {savingBusiness ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar Datos de la Barbería
                </button>
              </div>
            </form>
          </div>

          {/* C. PÁGINA PÚBLICA & EDITOR WEB */}
          <div className="p-6 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-200">
                  Página Web Pública de Reservas
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5 leading-relaxed font-mono">
                  {business?.slug ? getPublicPageUrl(business.slug) : 'Cargando enlace...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={copyPublicPageLink}
                className="bg-white dark:bg-zinc-900 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedLink ? 'Copiado' : 'Copiar Enlace'}</span>
              </button>

              {business?.slug && (
                <a
                  href={getPublicPageUrl(business.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-zinc-900 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Ver Página</span>
                  <ExternalLink size={13} />
                </a>
              )}

              <Link
                href="/webpage"
                className="panel-btn-accent px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              >
                <Store size={13} /> Ir a Editor Web
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          2. MI CUENTA (Información Personal del Titular)
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* A. FOTO DE PERFIL PERSONAL */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" /> Foto de Perfil Personal
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tu fotografía personal identifica tu cuenta de titular en el panel administrativo.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 w-fit">
                Privada · No comercial
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview de la foto personal */}
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-zinc-950 text-white flex items-center justify-center font-black shadow-md shrink-0 relative border border-zinc-200 dark:border-zinc-800">
                {userProfile?.avatar ? (
                  <Image
                    src={userProfile.avatar}
                    alt={userProfile.name || 'Foto de Perfil'}
                    fill
                    sizes="96px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <span className="text-2xl font-black text-amber-400">
                    {(userProfile?.name || userProfile?.email || 'U').substring(0, 1).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />

                <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                  <button
                    type="button"
                    disabled={uploadingAvatar || deletingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="panel-btn-accent px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> {userProfile?.avatar ? 'Cambiar Foto' : 'Subir Foto'}
                      </>
                    )}
                  </button>

                  {userProfile?.avatar && (
                    <button
                      type="button"
                      disabled={uploadingAvatar || deletingAvatar}
                      onClick={() => setDeleteAvatarOpen(true)}
                      className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg">
                  Formatos permitidos: <strong>JPG, PNG o WEBP</strong> (máx. <strong>5MB</strong>). Esta foto es exclusiva de tu perfil de usuario; no sustituye tu logotipo comercial ni se publica automáticamente en la página web pública.
                </p>
              </div>
            </div>
          </div>

          {/* B. INFORMACIÓN PERSONAL DEL TITULAR */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" /> Información Personal del Titular
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Datos de tu perfil y credenciales de acceso administrativo.
              </p>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nombre de Usuario */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Nombre del Titular de la Cuenta <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-3.5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                    Nombre personal del titular. Cambiar tu nombre personal no modifica el nombre comercial de tu barbería.
                  </p>
                </div>

                {/* Correo Electrónico (Solo Lectura) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Correo Electrónico de Acceso
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={userProfile.email}
                      className="w-full px-3.5 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl text-xs font-mono font-medium text-zinc-600 dark:text-zinc-300 outline-none cursor-not-allowed select-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      <CheckCircle2 size={11} /> Verificado
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                    Correo único para iniciar sesión en BarberOS.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-400 font-medium">
                  Cuenta creada el {new Date(userProfile.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <button
                  type="submit"
                  disabled={savingName || userName.trim() === (userProfile.name || '')}
                  className="bg-zinc-950 dark:bg-zinc-800 hover:bg-black dark:hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {savingName ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar Nombre Personal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          3. SEGURIDAD & CONTRASEÑA
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" /> Actualizar Contraseña de Acceso
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Asegura tu cuenta cambiando periódicamente tu contraseña por una combinación segura de al menos 8 caracteres.
              </p>
            </div>

            {userProfile.isGoogleUser && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                  <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <strong>Cuenta vinculada con Google.</strong> Actualmente inicias sesión directamente mediante Google. Para establecer una contraseña local por primera vez, por seguridad exigimos verificar tu identidad con un código de un solo uso enviado a tu correo <strong>{userProfile.email}</strong>.
                  </div>
                </div>

                {/* Bloque para solicitar y validar código OTP en cuenta Google */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Código de Confirmación por Correo <span className="text-amber-500">*</span>
                      </label>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Enviaremos un código seguro de 6 dígitos a tu bandeja de entrada
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={sendingCode}
                      onClick={handleRequestCode}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {sendingCode ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                      <span>{codeSent ? 'Reenviar Código' : 'Enviar Código'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Ingresa el código de 6 dígitos"
                    className="w-full px-3.5 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              {/* Contraseña Actual (solo si el usuario ya tiene una) */}
              {userProfile.hasPassword && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Contraseña Actual <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                      className="w-full px-3.5 py-3 pr-10 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      title={showCurrentPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Nueva Contraseña <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3.5 py-3 pr-10 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-bold ${newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                    ● Mínimo 8 caracteres ({newPassword.length}/8)
                  </span>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Confirmar Nueva Contraseña <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className={`w-full px-3.5 py-3 pr-10 bg-zinc-50 dark:bg-zinc-950/60 border rounded-2xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> Las contraseñas no coinciden
                  </p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Las contraseñas coinciden
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                  className="bg-zinc-950 dark:bg-zinc-800 hover:bg-black dark:hover:bg-zinc-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>

          {/* Garantías de Seguridad & Recuperación */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Protección y Recuperación Segura de BarberOS
            </h4>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-2 leading-relaxed">
              <p>
                ● <strong>Hashing criptográfico:</strong> Tus contraseñas se almacenan mediante hashing unidireccional con sal aleatoria (bcrypt 12 rondas). BarberOS nunca almacena contraseñas en texto plano ni las expone en registros.
              </p>
              <p>
                ● <strong>Revocación de sesiones:</strong> Al cambiar tu contraseña, se revocan automáticamente las sesiones secundarias activas en otros dispositivos o navegadores.
              </p>
              <p>
                ● <strong>Recuperación por correo transaccional (Resend):</strong> Si olvidas tu contraseña, puedes solicitar un enlace de restablecimiento desde la pantalla de inicio de sesión. El enlace utiliza tokens criptográficos de un solo uso con caducidad de 15 minutos, los cuales quedan invalidados de inmediato una vez utilizados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          4. APARIENCIA DEL PANEL
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" /> Apariencia del Software Interno
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Personaliza los acentos visuales del panel de administración privado de tu barbería.
              </p>
            </div>

            {/* Aviso sobre el control global de modo oscuro/claro */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <strong className="text-zinc-900 dark:text-white block mb-0.5">Control Global de Modo Claro / Oscuro</strong>
                El tema de tu panel se controla directamente con el botón de sol/luna ubicado en la esquina superior derecha de la barra superior (Header). Tu elección se guarda automáticamente en tu navegador y se conserva en cada inicio de sesión sin parpadeos.
              </div>
            </div>

            {/* Selector de Color de Acento del Dashboard */}
            <div className="pt-2">
              <AccentColorPicker />
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[11px] text-zinc-500 dark:text-zinc-400">
              <strong>Nota sobre la página pública:</strong> El color de acento del panel administra exclusivamente los componentes privados del dashboard (gráficos, botones, badges y calendarios). La página pública de tu barbería conserva su propia dirección de arte seleccionada en el <Link href="/webpage" className="underline font-bold text-zinc-800 dark:text-zinc-200">Editor Web</Link>.
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar logotipo comercial */}
      <ConfirmImageDeleteModal
        isOpen={deleteLogoOpen}
        onClose={() => setDeleteLogoOpen(false)}
        onConfirm={handleDeleteLogo}
        isDeleting={deletingLogo}
        title="¿Eliminar logotipo de la barbería?"
        description="Esta acción eliminará el logotipo comercial actual de la barbería. Tu página pública, el Editor Web y la barra lateral volverán a mostrar el isotipo predeterminado de BarberOS. ¿Deseas continuar?"
        confirmText="Eliminar logotipo"
        cancelText="Cancelar"
      />

      {/* Modal de confirmación para eliminar foto de perfil personal */}
      <ConfirmImageDeleteModal
        isOpen={deleteAvatarOpen}
        onClose={() => setDeleteAvatarOpen(false)}
        onConfirm={handleDeleteAvatar}
        isDeleting={deletingAvatar}
        title="¿Eliminar foto de perfil personal?"
        description="Esta acción eliminará tu foto de perfil personal. Tu cuenta volverá a identificarse con tus iniciales. Tu logotipo comercial no se verá afectado. ¿Deseas continuar?"
        confirmText="Eliminar foto"
        cancelText="Cancelar"
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-12 text-center text-xs font-bold uppercase tracking-wider text-zinc-400">
        Cargando configuración...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
