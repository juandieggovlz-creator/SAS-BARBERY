'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Scissors, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Lock, 
  Sparkles, 
  User, 
  Phone, 
  MapPin, 
  Upload, 
  X, 
  Palette, 
  Clock, 
  Copy, 
  Plus, 
  Trash2, 
  Sun, 
  Moon, 
  DollarSign, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import { DEFAULT_SCHEDULE, DayScheduleItem } from '@/lib/schedule'
import LocationSelector from '@/components/ui/LocationSelector'

type PresetColor = {
  id: string
  name: string
  hex: string
}

const PRESET_COLORS: PresetColor[] = [
  { id: 'gold', name: 'Dorado Luxury', hex: '#F59E0B' },
  { id: 'blue', name: 'Azul Real', hex: '#2563EB' },
  { id: 'emerald', name: 'Verde Esmeralda', hex: '#10B981' },
  { id: 'rose', name: 'Rojo Imperial', hex: '#EF4444' },
]

const QUICK_SERVICE_PRESETS = [
  { name: 'Corte Clásico', duration: 30, price: 30000 },
  { name: 'Fade / Degradado', duration: 40, price: 35000 },
  { name: 'Barba & Toalla Caliente', duration: 25, price: 25000 },
  { name: 'Combo Corte + Barba', duration: 55, price: 50000 },
]

export default function RegisterWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI Theme (independent from dashboardTheme which is the business preference)
  const [pageTheme, setPageTheme] = useState<'light' | 'dark'>('dark')
  const isDark = pageTheme === 'dark'

  // Step 1: User Account
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Step 2: Business Info
  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [country, setCountry] = useState('Colombia')
  const [department, setDepartment] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Step 3: Customization
  const [dashboardTheme, setDashboardTheme] = useState<'light' | 'dark'>('light')
  const [primaryColor, setPrimaryColor] = useState('#F59E0B')
  const [currency, setCurrency] = useState('COP')

  // Step 4: Schedule
  const [schedule, setSchedule] = useState<DayScheduleItem[]>(DEFAULT_SCHEDULE)

  // Step 5: Services
  const [services, setServices] = useState<Array<{ name: string; duration: number; price: number }>>([
    { name: 'Corte Clásico', duration: 30, price: 30000 },
    { name: 'Barba & Toalla Caliente', duration: 25, price: 25000 },
  ])
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState(30)
  const [newServicePrice, setNewServicePrice] = useState(30000)

  // Step 6: First Barber
  const [barberName, setBarberName] = useState('')
  const [barberSpecialty, setBarberSpecialty] = useState('Fade Master')
  const [barberPhone, setBarberPhone] = useState('')
  const [barberEmail, setBarberEmail] = useState('')

  // Step 7: Completed Data
  const [createdBusiness, setCreatedBusiness] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Auto-slug generator
  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val)
    const generated = val
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generated)
  }

  // Handle Logo Upload (File to Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen (PNG, JPG o WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setLogoPreview(result)
      toast.success('Logo cargado correctamente')
    }
    reader.readAsDataURL(file)
  }

  // Copy schedule from Monday to all open days
  const handleCopyScheduleToAll = () => {
    const monday = schedule.find(s => s.dayIndex === 1) || schedule[0]
    setSchedule(prev => prev.map(item => ({
      ...item,
      openTime: monday.openTime,
      closeTime: monday.closeTime,
      isOpen: item.dayIndex === 0 ? item.isOpen : true,
    })))
    toast.success(`Horario (${monday.openTime} - ${monday.closeTime}) copiado a todos los días`)
  }

  // Add custom service
  const handleAddService = () => {
    if (!newServiceName.trim()) {
      toast.error('Ingresa el nombre del servicio')
      return
    }
    setServices(prev => [
      ...prev,
      {
        name: newServiceName.trim(),
        duration: Number(newServiceDuration) || 30,
        price: Number(newServicePrice) || 0
      }
    ])
    setNewServiceName('')
    setNewServicePrice(30000)
    toast.success('Servicio añadido')
  }

  const handleAddPresetService = (preset: typeof QUICK_SERVICE_PRESETS[0]) => {
    if (services.some(s => s.name.toLowerCase() === preset.name.toLowerCase())) {
      toast.info('Este servicio ya está en tu lista')
      return
    }
    setServices(prev => [...prev, { ...preset }])
    toast.success(`Servicio "${preset.name}" agregado`)
  }

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index))
  }

  // Next Step Validations
  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        toast.error('Ingresa tu nombre completo')
        return
      }
      if (!email.trim() || !email.includes('@')) {
        toast.error('Ingresa un correo electrónico válido')
        return
      }
      if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres')
        return
      }
      if (password !== confirmPassword) {
        toast.error('Las contraseñas no coinciden')
        return
      }
      if (!acceptedTerms) {
        toast.error('Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      if (!businessName.trim()) {
        toast.error('Ingresa el nombre de tu barbería')
        return
      }
      if (!department.trim()) {
        toast.error('Por favor selecciona el departamento de tu negocio')
        return
      }
      if (!city.trim()) {
        toast.error('Por favor selecciona la ciudad de tu negocio')
        return
      }
      setStep(3)
      return
    }

    if (step === 3) {
      setStep(4)
      return
    }

    if (step === 4) {
      setStep(5)
      return
    }

    if (step === 5) {
      if (services.length === 0) {
        toast.error('Agrega al menos un servicio para tus clientes')
        return
      }
      setStep(6)
      return
    }

    if (step === 6) {
      // Step 6 submit to server
      handleCompleteRegistration()
    }
  }

  // Submit complete wizard to backend
  const handleCompleteRegistration = async (skipBarber = false) => {
    setLoading(true)

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      businessName: businessName.trim(),
      slug: slug.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      businessEmail: businessEmail.trim() || email.trim(),
      country,
      department,
      city: city.trim(),
      address: address.trim(),
      logo: logoPreview,
      dashboardTheme,
      primaryColor,
      currency,
      schedule,
      services,
      acceptedTerms: true,
      termsVersion: '1.0',
      termsAcceptedAt: new Date().toISOString(),
      firstBarber: skipBarber || !barberName.trim() ? null : {
        name: barberName.trim(),
        specialty: barberSpecialty.trim(),
        phone: barberPhone.trim(),
        email: barberEmail.trim()
      }
    }

    try {
      const res = await fetch('/api/auth/register-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al registrar tu barbería')
      }

      setCreatedBusiness(data.business)
      setStep(7)
      toast.success('¡Registro completado con éxito!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const copyPublicUrl = () => {
    if (!createdBusiness) return
    const url = `${window.location.origin}/b/${createdBusiness.slug}`
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    toast.success('Enlace copiado al portapapeles')
    setTimeout(() => setCopiedUrl(false), 2500)
  }

  const stepsList = [
    { num: 1, title: 'Cuenta' },
    { num: 2, title: 'Negocio' },
    { num: 3, title: 'Estilo' },
    { num: 4, title: 'Horarios' },
    { num: 5, title: 'Servicios' },
    { num: 6, title: 'Barbero' },
    { num: 7, title: '¡Listo!' },
  ]

  // ── Design tokens for dark/light theming ──────────────────────────────────
  const cx = {
    label:        isDark ? 'block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2' : 'block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2',
    input:        isDark
      ? 'w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-750 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
      : 'w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all',
    select:       isDark
      ? 'w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-100 focus:outline-none focus:border-zinc-500 transition-all'
      : 'w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:border-zinc-900 transition-all',
    badge:        isDark ? 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-400' : 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-700',
    heading:      isDark ? 'text-2xl sm:text-3xl font-black text-white tracking-tight' : 'text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight',
    subtext:      isDark ? 'text-sm text-zinc-400' : 'text-sm text-zinc-500',
    card:         isDark ? 'rounded-2xl border border-zinc-700/80 bg-zinc-800/60 p-5' : 'rounded-2xl border border-zinc-200 bg-zinc-50 p-5',
    divider:      isDark ? 'border-zinc-700/60' : 'border-zinc-200',
    btnPrimary:   isDark
      ? 'bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer'
      : 'bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer',
    btnSecondary: isDark
      ? 'flex items-center gap-2 text-zinc-400 hover:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer'
      : 'flex items-center gap-2 text-zinc-500 hover:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer',
    sectionTitle: isDark ? 'text-xs font-black uppercase tracking-wider text-zinc-400' : 'text-xs font-black uppercase tracking-wider text-zinc-500',
    itemCard:     isDark ? 'flex items-center justify-between p-3 rounded-xl bg-zinc-800 border border-zinc-700' : 'flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200',
    textPrimary:  isDark ? 'text-white' : 'text-zinc-950',
    textMuted:    isDark ? 'text-zinc-400' : 'text-zinc-500',
    inputBase:    isDark
      ? 'py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-750 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
      : 'py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all',
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${
      isDark
        ? 'bg-zinc-950 selection:bg-white selection:text-zinc-950'
        : 'bg-zinc-50 selection:bg-zinc-900 selection:text-white'
    }`}>

      {/* Top Navbar */}
      <header className={`border-b sticky top-0 z-30 px-6 py-4 backdrop-blur-md transition-colors duration-300 ${
        isDark
          ? 'border-zinc-800/80 bg-zinc-950/90'
          : 'border-zinc-200/80 bg-white/80'
      }`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform ${
              isDark ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white'
            }`}>
              <Scissors className="w-4 h-4" />
            </div>
            <span className={`text-xl font-black tracking-tight uppercase ${
              isDark ? 'text-white' : 'text-zinc-950'
            }`}>
              Barber<span className={`font-light ${ isDark ? 'text-zinc-500' : 'text-zinc-400' }`}>OS</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setPageTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? 'bg-zinc-800 text-amber-400 hover:bg-zinc-700 border border-zinc-700'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className={`text-xs ${ isDark ? 'text-zinc-400' : 'text-zinc-500' }`}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className={`font-bold hover:underline ${
                isDark ? 'text-white' : 'text-zinc-950'
              }`}>
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Wizard Progress Bar */}
      <div className={`w-full border-b py-4 px-4 sm:px-6 transition-colors duration-300 ${
        isDark ? 'bg-zinc-900/80 border-zinc-800/80' : 'bg-white border-zinc-200/80'
      }`}>
        <div className="max-w-3xl mx-auto">
          {/* Steps Breadcrumbs */}
          <div className="flex items-center justify-between mb-3">
            {stepsList.map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step > s.num
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : step === s.num
                      ? isDark
                        ? 'bg-white text-zinc-950 ring-4 ring-white/10 shadow-sm'
                        : 'bg-zinc-950 text-white ring-4 ring-zinc-950/10 shadow-sm'
                      : isDark
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.num}
                </div>
                <span className={`text-[10px] font-bold mt-1 hidden sm:block ${
                  step === s.num
                    ? isDark ? 'text-white' : 'text-zinc-950'
                    : 'text-zinc-500'
                }`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar line */}
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${ isDark ? 'bg-zinc-800' : 'bg-zinc-100' }`}>
            <motion.div 
              className={`h-full rounded-full ${ isDark ? 'bg-white' : 'bg-zinc-950' }`}
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Main Wizard Card */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className={`w-full rounded-3xl border shadow-xl p-6 sm:p-10 relative overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-zinc-900 border-zinc-800/80 shadow-black/40'
            : 'bg-white border-zinc-200/90'
        }`}>

          <AnimatePresence mode="wait">
            
            {/* ══════════════════════════════════════════════════════
                PASO 1: CREAR CUENTA DE PROPIETARIO
            ══════════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className={cx.badge}>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Paso 1 de 6 · Cuenta de Administrador</span>
                  </div>
                  <h2 className={cx.heading}>
                    Crea tu cuenta y comienza a gestionar tu barbería
                  </h2>
                  <p className={cx.subtext}>
                    Configura tu negocio en pocos minutos. Tendrás control absoluto de tus ingresos y equipo.
                  </p>
                </div>

                {/* Google Quick Registration */}
                <div className="space-y-3">
                  <a
                    href="/api/auth/google"
                    className={`group relative overflow-hidden w-full py-3.5 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] border shadow-xs cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900/90 hover:bg-zinc-850 text-white border-zinc-800 hover:border-zinc-700 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)]'
                        : 'bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                    }`}
                  >
                    {/* Sweep light effect on hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                    <div className="w-5 h-5 flex items-center justify-center shrink-0 group-hover:scale-115 transition-transform duration-300 ease-out">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>

                    <span className="tracking-wider group-hover:text-amber-400 dark:group-hover:text-amber-300 transition-colors duration-200">
                      Crear cuenta con Google
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-zinc-400 group-hover:text-amber-300" />
                  </a>

                  <div className="relative flex items-center justify-center my-3">
                    <div className={`w-full border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`} />
                    <span className={`px-3 text-[10px] font-bold uppercase tracking-wider absolute ${
                      isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-400'
                    }`}>
                      o completa tus datos
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre Completo */}
                  <div className="sm:col-span-2">
                    <label className={cx.label}>
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className={cx.input}
                      />
                    </div>
                  </div>

                  {/* Correo Electrónico */}
                  <div className="sm:col-span-2">
                    <label className={cx.label}>
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@barberia.com"
                        className={cx.input}
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className={cx.label}>
                      Contraseña * (mínimo 6 car.)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={cx.input}
                      />
                    </div>
                  </div>

                  {/* Confirmar Contraseña */}
                  <div>
                    <label className={cx.label}>
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={cx.input}
                      />
                    </div>
                  </div>

                  {/* Casilla explícita de aceptación de Términos y Privacidad */}
                  <div className="sm:col-span-2 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer shrink-0"
                      />
                      <span className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        He leído y acepto expresamente los{' '}
                        <Link 
                          href="/terminos-y-condiciones" 
                          target="_blank" 
                          className="font-bold underline underline-offset-2 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          Términos y Condiciones
                        </Link>{' '}
                        y la{' '}
                        <Link 
                          href="/politica-de-privacidad" 
                          target="_blank" 
                          className="font-bold underline underline-offset-2 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          Política de Privacidad
                        </Link>{' '}
                        de BarberOS.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className={cx.btnPrimary}
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}


            {/* ══════════════════════════════════════════════════════
                PASO 2: INFORMACIÓN DE LA BARBERÍA & LOGO
            ══════════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className={cx.badge}>
                    <Building2 className="w-3 h-3 text-blue-600" />
                    <span>Paso 2 de 6 · Información del Negocio</span>
                  </div>
                  <h2 className={cx.heading}>
                    Cuéntanos sobre tu barbería
                  </h2>
                  <p className={cx.subtext}>
                    Estos datos aparecerán en tu portal de reservas online y en los comprobantes de tus clientes.
                  </p>
                </div>

                {/* Subir Logo (File Upload Only) */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-colors ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-900/90'
                    : 'border-zinc-200 bg-zinc-50/70'
                }`}>
                  <div className={`relative w-20 h-20 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700'
                      : 'bg-white border-zinc-200'
                  }`}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Scissors className={`w-8 h-8 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className={`text-xs font-black mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      Logo Oficial de la Barbería
                    </p>
                    <p className={`text-[11px] mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Sube un archivo PNG, JPG o SVG (máximo 5MB). Se verá en tu página web.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer border ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100'
                            : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{logoPreview ? 'Cambiar logo' : 'Subir archivo de logo'}</span>
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => setLogoPreview(null)}
                          className={`p-2 rounded-xl text-rose-500 transition-colors ${
                            isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                          }`}
                          title="Eliminar logo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre Barbería */}
                  <div className="sm:col-span-2">
                    <label className={cx.label}>
                      Nombre de la Barbería *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        placeholder="Ej. Barbería Elite SAS"
                        className={cx.input}
                      />
                    </div>
                    {slug && (
                      <p className="mt-1 text-[11px] font-mono text-zinc-500">
                        Tu enlace web: <span className="font-bold text-zinc-900">barberos.app/b/{slug}</span>
                      </p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className={cx.label}>
                      Teléfono de Contacto
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+57 300 123 4567"
                        className={cx.input}
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className={cx.label}>
                      WhatsApp para Reservas
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+57 324 206 3393"
                        className={cx.input}
                      />
                    </div>
                  </div>

                  {/* Selector Inteligente de Ubicación (Departamento y Ciudad) */}
                  <div className="sm:col-span-2">
                    <LocationSelector
                      department={department}
                      city={city}
                      onDepartmentChange={(dept) => setDepartment(dept)}
                      onCityChange={(c) => setCity(c)}
                      isDark={isDark}
                      required={true}
                    />
                  </div>

                  {/* Dirección */}
                  <div className="sm:col-span-2">
                    <label className={cx.label}>
                      Dirección Física
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Calle 85 # 14-20, Local 102"
                        className={cx.input}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className={cx.btnPrimary}
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                PASO 3: PERSONALIZACIÓN & APARIENCIA
            ══════════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className={cx.badge}>
                    <Palette className="w-3 h-3 text-purple-600" />
                    <span>Paso 3 de 6 · Personalización Inicial</span>
                  </div>
                  <h2 className={cx.heading}>
                    Personaliza tu espacio
                  </h2>
                  <p className={cx.subtext}>
                    Ajusta la paleta de colores de tu sistema y la moneda para facturación.
                  </p>
                </div>

                {/* Dashboard Theme Toggle */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3">
                    Tema del Dashboard
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDashboardTheme('light')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        dashboardTheme === 'light'
                          ? 'border-zinc-950 bg-zinc-50/80 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                          <Sun className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-900">Modo Claro</p>
                          <p className="text-[10px] text-zinc-500">Fondo blanco profesional</p>
                        </div>
                      </div>
                      {dashboardTheme === 'light' && <CheckCircle2 className="w-5 h-5 text-zinc-950" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDashboardTheme('dark')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        dashboardTheme === 'dark'
                          ? 'border-zinc-950 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 text-white flex items-center justify-center border border-zinc-700">
                          <Moon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`text-xs font-black ${dashboardTheme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Modo Oscuro</p>
                          <p className={`text-[10px] ${dashboardTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>Estilo oscuro nocturno</p>
                        </div>
                      </div>
                      {dashboardTheme === 'dark' && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </button>
                  </div>
                </div>

                {/* Color Principal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3">
                    Color Principal de Marca
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_COLORS.map(c => {
                      const isSelected = primaryColor === c.hex
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPrimaryColor(c.hex)}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                            isSelected ? 'border-zinc-950 bg-zinc-50 shadow-xs' : 'border-zinc-200 hover:border-zinc-300 bg-white'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-full border border-black/10 shadow-sm flex items-center justify-center text-white"
                            style={{ backgroundColor: c.hex }}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-bold text-zinc-800 text-center">{c.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Moneda */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3">
                    Moneda de Facturación
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { code: 'COP', label: 'COP - Peso Colombiano ($)' },
                      { code: 'USD', label: 'USD - Dólar ($)' },
                      { code: 'MXN', label: 'MXN - Peso Mexicano ($)' },
                      { code: 'EUR', label: 'EUR - Euro (€)' },
                    ].map(cur => (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => setCurrency(cur.code)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          currency === cur.code
                            ? 'border-zinc-950 bg-zinc-950 text-white font-black shadow-xs'
                            : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 font-bold bg-white text-xs'
                        }`}
                      >
                        <span className="text-xs">{cur.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className={cx.btnPrimary}
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                PASO 4: HORARIOS DE ATENCIÓN
            ══════════════════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx.badge}>
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Paso 4 de 6 · Horarios de Atención</span>
                    </div>
                    <h2 className={cx.heading}>
                      ¿Cuáles son tus horarios?
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Tus clientes solo podrán agendar en los turnos que tengas habilitados.
                    </p>
                  </div>

                  {/* Copy schedule button */}
                  <button
                    type="button"
                    onClick={handleCopyScheduleToAll}
                    className={`self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border-zinc-700'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copiar horario a todos los días</span>
                  </button>
                </div>

                {/* Days Table */}
                <div className={`border rounded-2xl overflow-hidden divide-y ${
                  isDark
                    ? 'border-zinc-800 divide-zinc-800/80'
                    : 'border-zinc-200 divide-zinc-200'
                }`}>
                  {schedule.map((item, idx) => (
                    <div
                      key={item.dayIndex}
                      className={`p-3.5 flex items-center justify-between transition-colors ${
                        isDark
                          ? 'bg-zinc-900/90 hover:bg-zinc-850'
                          : 'bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-32">
                        <input
                          type="checkbox"
                          checked={item.isOpen}
                          onChange={(e) => {
                            const val = e.target.checked
                            setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, isOpen: val } : s))
                          }}
                          className={`w-4 h-4 rounded cursor-pointer ${
                            isDark
                              ? 'border-zinc-700 text-amber-500 focus:ring-0 bg-zinc-800'
                              : 'border-zinc-300 text-zinc-950 focus:ring-zinc-950'
                          }`}
                        />
                        <span className={`text-xs font-bold ${
                          item.isOpen
                            ? isDark ? 'text-white' : 'text-zinc-950'
                            : 'text-zinc-500 line-through'
                        }`}>
                          {item.day}
                        </span>
                      </div>

                      {item.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={item.openTime}
                            onChange={(e) => {
                              const val = e.target.value
                              setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, openTime: val } : s))
                            }}
                            className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium outline-none ${
                              isDark
                                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-zinc-900'
                            }`}
                          />
                          <span className="text-zinc-500 text-xs">a</span>
                          <input
                            type="time"
                            value={item.closeTime}
                            onChange={(e) => {
                              const val = e.target.value
                              setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, closeTime: val } : s))
                            }}
                            className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium outline-none ${
                              isDark
                                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-zinc-900'
                            }`}
                          />
                        </div>
                      ) : (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                          isDark
                            ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                            : 'text-rose-500 bg-rose-50'
                        }`}>
                          Cerrado
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className={cx.btnPrimary}
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                PASO 5: SERVICIOS INICIALES
            ══════════════════════════════════════════════════════ */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className={cx.badge}>
                    <Scissors className="w-3 h-3 text-amber-500" />
                    <span>Paso 5 de 6 · Servicios</span>
                  </div>
                  <h2 className={cx.heading}>
                    Agrega tus primeros servicios
                  </h2>
                  <p className={cx.subtext}>
                    Haz clic en los ejemplos rápidos para añadirlos en un segundo, o escribe tus servicios personalizados.
                  </p>
                </div>

                {/* Quick Presets */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Ejemplos rápidos populares:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SERVICE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPresetService(p)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs border ${
                          isDark
                            ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200/80'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{p.name} ({p.duration} min - ${p.price.toLocaleString('es-CO')})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Custom Service Form */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-zinc-200 bg-zinc-50'
                }`}>
                  <span className={`text-xs font-black block ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Personalizar o añadir nuevo servicio:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Ej. Diseño & Hair Tattoo"
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                            : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                        }`}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Duración</label>
                      <select
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                            : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                        }`}
                      >
                        <option value={15}>15 minutos</option>
                        <option value={20}>20 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={40}>40 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>60 minutos</option>
                        <option value={90}>90 minutos</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Precio ($)</label>
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        step="1000"
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                            : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddService}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isDark
                          ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar servicio</span>
                    </button>
                  </div>
                </div>

                {/* Services List */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Servicios configurados ({services.length}):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {services.map((s, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between shadow-2xs ${
                          isDark
                            ? 'border-zinc-800 bg-zinc-900/90'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>{s.name}</p>
                          <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {s.duration} min · <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>${s.price.toLocaleString('es-CO')}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className={cx.btnPrimary}
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                PASO 6: PRIMER BARBERO / TRABAJO SOLO
            ══════════════════════════════════════════════════════ */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className={cx.badge}>
                    <User className="w-3 h-3 text-blue-600" />
                    <span>Paso 6 de 6 · Equipo Inicial</span>
                  </div>
                  <h2 className={cx.heading}>
                    Agrega tu primer barbero
                  </h2>
                  <p className={cx.subtext}>
                    Puedes agregar a tu primer estilista o saltar este paso si eres el único que atiende o prefieres agregarlos después en tu panel.
                  </p>
                </div>

                <div className={`p-6 rounded-2xl border space-y-4 ${
                  isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-zinc-200 bg-zinc-50'
                }`}>
                  <div>
                    <label className={cx.label}>
                      Nombre del Barbero
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={barberName}
                        onChange={(e) => setBarberName(e.target.value)}
                        placeholder="Ej. Carlos 'The Blade' Ruiz"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500'
                            : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={cx.label}>
                        Especialidad
                      </label>
                      <input
                        type="text"
                        value={barberSpecialty}
                        onChange={(e) => setBarberSpecialty(e.target.value)}
                        placeholder="Degradados & Barba"
                        className={`w-full px-4 py-3 border rounded-xl text-sm font-medium outline-none ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500'
                            : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={cx.label}>
                        Teléfono Celular
                      </label>
                      <input
                        type="tel"
                        value={barberPhone}
                        onChange={(e) => setBarberPhone(e.target.value)}
                        placeholder="+57 311 000 0000"
                        className={`w-full px-4 py-3 border rounded-xl text-sm font-medium outline-none ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500'
                            : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Botón: Agregar después */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleCompleteRegistration(true)}
                      className={`flex-1 sm:flex-initial px-5 py-3.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        isDark
                          ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                          : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      Agregar después
                    </button>

                    {/* Botón: Finalizar y crear */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleCompleteRegistration(false)}
                      className={`flex-1 sm:flex-initial font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                        isDark
                          ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                      }`}
                    >
                      {loading ? (
                        <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                          isDark ? 'border-zinc-950' : 'border-white'
                        }`} />
                      ) : (
                        <>
                          <span>Crear mi barbería</span>
                          <Check className="w-4 h-4 stroke-[3]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                PASO 7: FINALIZACIÓN EXITOSA (RESUMEN)
            ══════════════════════════════════════════════════════ */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-6 py-4"
              >
                {/* Success Icon */}
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 border ${
                  isDark
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                }`}>
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    isDark
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                      : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  }`}>
                    ¡Configuración Completa!
                  </span>
                  <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-zinc-950'
                  }`}>
                    Tu barbería está lista
                  </h2>
                  <p className={`text-sm max-w-md mx-auto leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Ya puedes comenzar a recibir reservas, organizar tus citas y administrar tu negocio con BarberOS.
                  </p>
                </div>

                {/* Summary Box */}
                {createdBusiness && (
                  <div className={`max-w-md mx-auto border rounded-2xl p-5 text-left space-y-3 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800'
                      : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className={`flex items-center justify-between pb-3 border-b ${
                      isDark ? 'border-zinc-800' : 'border-zinc-200/80'
                    }`}>
                      <div>
                        <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>{createdBusiness.name}</p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Portal oficial de reservas activo</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Enlace de tu página web:</p>
                      <div className={`flex items-center justify-between border rounded-xl px-3 py-2 ${
                        isDark
                          ? 'bg-zinc-800/90 border-zinc-700'
                          : 'bg-white border-zinc-200'
                      }`}>
                        <span className={`font-mono text-xs truncate ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
                          barberos.app/b/{createdBusiness.slug}
                        </span>
                        <button
                          type="button"
                          onClick={copyPublicUrl}
                          className={`ml-2 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
                            isDark
                              ? 'text-zinc-300 hover:text-white'
                              : 'text-zinc-800 hover:text-black'
                          }`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/dashboard')
                      router.refresh()
                    }}
                    className="w-full sm:w-auto bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ir al Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {createdBusiness && (
                    <Link
                      href={`/b/${createdBusiness.slug}`}
                      target="_blank"
                      className="w-full sm:w-auto bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider px-7 py-4 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ver mi Página Web</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} BarberOS. Tu negocio organizado desde el primer día.</p>
      </footer>

    </div>
  )
}

