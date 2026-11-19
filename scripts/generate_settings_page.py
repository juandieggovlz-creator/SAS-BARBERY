code = """'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  Check
} from 'lucide-react'
import AccentColorPicker from '@/components/ui/AccentColorPicker'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  hasPassword: boolean
  isGoogleUser: boolean
  createdAt: string
  businessName: string
  businessLogo?: string | null
  businessSlug?: string | null
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialTab = (searchParams?.get('tab') as 'account' | 'security' | 'appearance') || 'account'
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'appearance'>(
    ['account', 'security', 'appearance'].includes(initialTab) ? initialTab : 'account'
  )

  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Account form
  const [userName, setUserName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        if (data?.user) {
          setUserProfile(data.user)
          setUserName(data.user.name || '')
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
    fetchProfile()
  }, [])

  // Sync tab with URL if changed
  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    if (tabParam === 'security' || tabParam === 'appearance' || tabParam === 'account') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim()) {
      toast.error('El nombre no puede estar vacío')
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
        toast.success('Nombre actualizado correctamente ✨')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        toast.error(data.error || 'Error al actualizar el nombre')
      }
    } catch {
      toast.error('Error de red al actualizar')
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userProfile?.hasPassword && !currentPassword) {
      toast.error('Debes ingresar tu contraseña actual')
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
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('¡Contraseña actualizada exitosamente!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        fetchProfile()
      } else {
        toast.error(data.error || 'No se pudo cambiar la contraseña')
      }
    } catch {
      toast.error('Error de red al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
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
      {/* ── Banner de Perfil de Usuario ── */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 relative border border-zinc-200 dark:border-zinc-800">
            {userProfile.businessLogo ? (
              <Image
                src={userProfile.businessLogo}
                alt={userProfile.businessName}
                fill
                sizes="64px"
                className="object-cover"
                priority
              />
            ) : (
              <span className="text-lg font-black text-amber-400">
                {(userProfile.name || userProfile.email).substring(0, 2).toUpperCase()}
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
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/webpage"
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
          >
            <Store size={14} className="text-amber-500" /> Editor Web
          </Link>
        </div>
      </div>

      {/* ── Navegación Simplificada de 3 Apartados (Fase 2) ── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
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
          A. MI CUENTA
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" /> Información Personal del Usuario
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
                    Nombre del Usuario <span className="text-amber-500">*</span>
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
                    Nombre personal del titular de la cuenta. Es independiente del nombre comercial de tu barbería.
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
                    Correo único para iniciar sesión en BarberOS. No es modificable sin verificación de seguridad.
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
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>

          {/* Tarjeta de Aclaración: Información Pública de la Barbería */}
          <div className="p-6 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Store size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-200">
                  ¿Deseas editar el logo, dirección, horarios o datos públicos de tu negocio?
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                  Para evitar duplicaciones y mantener sincronizada la página pública, la identidad del local se gestiona centralmente en el <strong>Editor Web</strong>.
                </p>
              </div>
            </div>

            <Link
              href="/webpage"
              className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs"
            >
              Ir a Editor Web <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          B. SEGURIDAD & CONTRASEÑA
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" /> Actualizar Contraseña de Acceso
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Asegura tu cuenta cambiando periódicamente tu contraseña por una combinación segura.
              </p>
            </div>

            {userProfile.isGoogleUser && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong>Cuenta vinculada con Google.</strong> Actualmente inicias sesión directamente mediante Google. Puedes establecer una contraseña local a continuación si deseas poder ingresar también con correo y contraseña.
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-bold ${newPassword.length >= 8 ? 'text-emerald-600' : 'text-zinc-400'}`}>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
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
                  <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
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

          {/* Garantías de Seguridad */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Protección Criptográfica de BarberOS
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Tus contraseñas se almacenan mediante hashing unidireccional con sal aleatoria (bcrypt). El sistema nunca almacena contraseñas en texto plano ni las expone en registros ni respuestas de red. Al cambiar tu contraseña, se revocan automáticamente sesiones secundarias abiertas en otros navegadores.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          C. APARIENCIA DEL PANEL
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
"""

with open(r'c:\Users\ADMIN\Documents\JUAN V\SAS-BARBERY\app\settings\page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Settings page written successfully!")
