'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
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
  ShieldCheck,
  Scissors
} from 'lucide-react'
import { DEFAULT_SCHEDULE, DayScheduleItem } from '@/lib/schedule'
import LocationSelector from '@/components/ui/LocationSelector'
import Image from 'next/image'
import { getPublicPageUrl } from '@/lib/url'

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
    const url = getPublicPageUrl(createdBusiness.slug)
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    toast.success('Enlace copiado al portapapeles')
    setTimeout(() => setCopiedUrl(false), 2500)
  }

  const stepsList = [
    { num: 1, title: 'Cuenta', icon: User },
    { num: 2, title: 'Negocio', icon: Building2 },
    { num: 3, title: 'Estilo', icon: Palette },
    { num: 4, title: 'Horarios', icon: Clock },
    { num: 5, title: 'Servicios', icon: Scissors },
    { num: 6, title: 'Barbero', icon: User },
    { num: 7, title: '¡Listo!', icon: CheckCircle2 },
  ]

  return (
    <div className="auth-page min-h-screen flex flex-col justify-between">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl"
          style={{ filter: 'blur(120px)' }}
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl"
          style={{ filter: 'blur(120px)' }}
        />
      </div>

      {/* Top Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 border-b sticky top-0 backdrop-blur-md transition-colors duration-300 border-border-subtle bg-bg-canvas/80"
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
          >
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 bg-gradient-to-br from-accent to-primary"
              >
                <Image src="/logo.png" alt="BarberOS" fill sizes="36px" className="object-cover" />
              </motion.div>
              <span className="text-xl font-black tracking-tight text-text-primary uppercase">
                Barber<span className="font-light text-text-tertiary">OS</span>
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {/* Theme Toggle */}
            <motion.button
              onClick={() => setPageTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl glass border-border-subtle flex items-center justify-center text-text-tertiary hover:text-accent transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            <motion.div className="text-xs text-text-tertiary">
              ¿Ya tienes cuenta?{' '}
              <motion.a
                href="/login"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="font-black text-text-primary hover:underline transition-colors"
              >
                Iniciar sesión
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Wizard Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="relative z-10 border-b py-4 px-4 sm:px-6 transition-colors duration-300 border-border-subtle bg-bg-canvas/80 backdrop-blur-md"
      >
        <div className="max-w-3xl mx-auto">
          {/* Steps Breadcrumbs */}
          <div className="flex items-center justify-between mb-3">
            {stepsList.map((s, idx) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step > s.num
                      ? 'bg-success text-text-inverse shadow-sm'
                      : step === s.num
                      ? 'bg-accent text-text-inverse ring-4 ring-accent/20 shadow-md'
                      : 'bg-bg-subtle text-text-muted border border-border-subtle'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4 stroke-[3]" /> : <s.icon className="w-4 h-4" aria-hidden="true" />}
                </motion.div>
                <motion.span
                  className={`text-[10px] font-bold mt-1 hidden sm:block ${
                    step === s.num
                      ? 'text-text-primary'
                      : step > s.num
                      ? 'text-success'
                      : 'text-text-muted'
                  }`}
                >
                  {s.title}
                </motion.span>
              </motion.div>
            ))}
          </div>

          {/* Progress bar line */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-bg-subtle">
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="h-full rounded-full bg-accent"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Wizard Card */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full card-elevated rounded-[36px] p-6 sm:p-10 relative overflow-hidden"
        >
          {/* Decorative accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" />

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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-2"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-border-subtle text-[10px] font-black uppercase tracking-wider text-text-secondary"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>Paso 1 de 6 · Cuenta de Administrador</span>
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                    Crea tu cuenta y comienza a gestionar tu barbería
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Configura tu negocio en pocos minutos. Tendrás control absoluto de tus ingresos y equipo.
                  </p>
                </motion.div>

                {/* Google Quick Registration */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="space-y-3"
                >
                  <motion.a
                    href="/api/auth/google"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative overflow-hidden w-full py-4 px-5 rounded-2xl btn-secondary flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {/* Sweep light effect on hover */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent pointer-events-none"
                    />

                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className="w-5 h-5 flex items-center justify-center shrink-0"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </motion.div>

                    <motion.span
                      whileHover={{ color: 'var(--accent)' }}
                      transition={{ duration: 0.2 }}
                      className="group-hover:text-accent transition-colors duration-200 font-bold text-xs uppercase tracking-wider"
                    >
                      Crear cuenta con Google
                    </motion.span>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className="text-text-muted group-hover:text-accent transition-colors duration-300"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </motion.a>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="w-full border-t border-border-subtle" />
                    <span className="px-3 text-[10px] font-black uppercase tracking-wider bg-bg-canvas text-text-muted absolute">
                      o completa tus datos
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {/* Nombre Completo */}
                  <motion.div className="sm:col-span-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <User className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="input-base pl-11 pr-4"
                        autoComplete="name"
                      />
                    </div>
                  </motion.div>

                  {/* Correo Electrónico */}
                  <motion.div className="sm:col-span-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Mail className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@barberia.com"
                        className="input-base pl-11 pr-4"
                        autoComplete="email"
                      />
                    </div>
                  </motion.div>

                  {/* Contraseña */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Contraseña * (mínimo 6 car.)
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Lock className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-base pl-11 pr-4"
                        autoComplete="new-password"
                      />
                    </div>
                  </motion.div>

                  {/* Confirmar Contraseña */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Lock className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-base pl-11 pr-4"
                        autoComplete="new-password"
                      />
                    </div>
                  </motion.div>

                  {/* Casilla explícita de aceptación de Términos y Privacidad */}
                  <motion.div className="sm:col-span-2 pt-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.45 }}>
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                      <motion.input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="mt-0.5 w-4 h-4 rounded border-border-default bg-bg-subtle text-accent focus:ring-2 focus:ring-accent/20 accent-accent cursor-pointer shrink-0"
                      />
                      <span className="text-xs leading-relaxed text-text-secondary">
                        He leído y acepto expresamente los{' '}
                        <Link
                          href="/terminos-y-condiciones"
                          target="_blank"
                          className="font-bold underline underline-offset-2 text-accent hover:text-accent/80 transition-colors"
                        >
                          Términos y Condiciones
                        </Link>{' '}
                        y la{' '}
                        <Link
                          href="/politica-de-privacidad"
                          target="_blank"
                          className="font-bold underline underline-offset-2 text-accent hover:text-accent/80 transition-colors"
                        >
                          Política de Privacidad
                        </Link>{' '}
                        de BarberOS.
                      </span>
                    </label>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="pt-4 flex justify-end"
                >
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary text-sm py-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ArrowRight className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.span>
                  </motion.button>
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-2"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-border-subtle text-[10px] font-black uppercase tracking-wider text-text-secondary"
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>Paso 2 de 6 · Información del Negocio</span>
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                    Cuéntanos sobre tu barbería
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Estos datos aparecerán en tu portal de reservas online y en los comprobantes de tus clientes.
                  </p>
                </motion.div>

                {/* Subir Logo (File Upload Only) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="p-4 rounded-2xl glass border-border-subtle flex flex-col sm:flex-row items-center gap-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="relative w-20 h-20 rounded-2xl border border-border-subtle flex items-center justify-center overflow-hidden shrink-0 shadow-sm bg-bg-subtle"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Scissors className="w-8 h-8 text-text-muted" aria-hidden="true" />
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex-1 text-center sm:text-left"
                  >
                    <p className="text-sm font-black mb-1 text-text-primary">
                      Logo Oficial de la Barbería
                    </p>
                    <p className="text-xs mb-3 text-text-tertiary">
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
                      <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer border border-border-subtle bg-surface-2 hover:bg-surface-3 text-text-primary"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{logoPreview ? 'Cambiar logo' : 'Subir archivo de logo'}</span>
                      </motion.button>
                      {logoPreview && (
                        <motion.button
                          type="button"
                          onClick={() => setLogoPreview(null)}
                          whileHover={{ scale: 1.1, rotate: 180 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-xl text-error hover:bg-error-bg transition-colors"
                          title="Eliminar logo"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {/* Nombre Barbería */}
                  <motion.div className="sm:col-span-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Nombre de la Barbería *
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Building2 className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        placeholder="Ej. Barbería Elite SAS"
                        className="input-base pl-11 pr-4"
                      />
                    </div>
                    {slug && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-1 text-xs font-mono text-text-muted"
                      >
                        Tu enlace web: <span className="font-bold text-text-primary">barberos.app/b/{slug}</span>
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Teléfono */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Teléfono de Contacto
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Phone className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+57 300 123 4567"
                        className="input-base pl-11 pr-4"
                      />
                    </div>
                  </motion.div>

                  {/* WhatsApp */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      WhatsApp para Reservas
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Phone className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+57 324 206 3393"
                        className="input-base pl-11 pr-4"
                      />
                    </div>
                  </motion.div>

                  {/* Selector Inteligente de Ubicación (Departamento y Ciudad) */}
                  <motion.div className="sm:col-span-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
                    <LocationSelector
                      department={department}
                      city={city}
                      onDepartmentChange={(dept) => setDepartment(dept)}
                      onCityChange={(c) => setCity(c)}
                      isDark={isDark}
                      required={true}
                    />
                  </motion.div>

                  {/* Dirección */}
                  <motion.div className="sm:col-span-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.45 }}>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Dirección Física
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <MapPin className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Calle 85 # 14-20, Local 102"
                        className="input-base pl-11 pr-4"
                      />
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="pt-4 flex items-center justify-between"
                >
                  <motion.button
                    type="button"
                    onClick={() => setStep(1)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl border border-border-default text-text-secondary font-bold text-xs uppercase tracking-wider hover:bg-bg-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                    <span>Atrás</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary text-sm py-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ArrowRight className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.span>
                  </motion.button>
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-2"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-border-subtle text-[10px] font-black uppercase tracking-wider text-text-secondary"
                  >
                    <Palette className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                    <span>Paso 3 de 6 · Personalización Inicial</span>
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                    Personaliza tu espacio
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Ajusta la paleta de colores de tu sistema y la moneda para facturación.
                  </p>
                </motion.div>

                {/* Dashboard Theme Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-3">
                    Tema del Dashboard
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setDashboardTheme('light')}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      layout
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        dashboardTheme === 'light'
                          ? 'border-accent bg-accent/5 shadow-sm'
                          : 'border-border-subtle hover:border-border-strong bg-surface-1'
                      }`}
                    >
                      <motion.div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20"
                        >
                          <Sun className="w-5 h-5" aria-hidden="true" />
                        </motion.div>
                        <div>
                          <p className="text-xs font-black text-text-primary">Modo Claro</p>
                          <p className="text-[10px] text-text-tertiary">Fondo blanco profesional</p>
                        </div>
                      </motion.div>
                      <AnimatePresence>
                        {dashboardTheme === 'light' && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-accent" aria-hidden="true" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => setDashboardTheme('dark')}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      layout
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        dashboardTheme === 'dark'
                          ? 'border-accent bg-accent/5 shadow-sm'
                          : 'border-border-subtle hover:border-border-strong bg-surface-1'
                      }`}
                    >
                      <motion.div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="w-9 h-9 rounded-xl bg-text-primary/10 text-text-primary flex items-center justify-center border border-border-subtle"
                        >
                          <Moon className="w-5 h-5" aria-hidden="true" />
                        </motion.div>
                        <div>
                          <p className={`text-xs font-black ${dashboardTheme === 'dark' ? 'text-text-primary' : 'text-text-secondary'}`}>Modo Oscuro</p>
                          <p className={`text-[10px] ${dashboardTheme === 'dark' ? 'text-text-tertiary' : 'text-text-muted'}`}>Estilo oscuro nocturno</p>
                        </div>
                      </motion.div>
                      <AnimatePresence>
                        {dashboardTheme === 'dark' && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-accent" aria-hidden="true" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Color Principal */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-3">
                    Color Principal de Marca
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_COLORS.map(c => {
                      const isSelected = primaryColor === c.hex
                      return (
                        <motion.button
                          key={c.id}
                          type="button"
                          onClick={() => setPrimaryColor(c.hex)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          layout
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                            isSelected ? 'border-accent bg-accent/5 shadow-sm' : 'border-border-subtle hover:border-border-strong bg-surface-1'
                          }`}
                        >
                          <motion.div
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-8 h-8 rounded-full border border-black/10 shadow-sm flex items-center justify-center text-white"
                            style={{ backgroundColor: c.hex }}
                          >
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          <span className="text-[10px] font-bold text-text-secondary text-center">{c.name}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Moneda */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                >
                  <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-3">
                    Moneda de Facturación
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { code: 'COP', label: 'COP - Peso Colombiano ($)' },
                      { code: 'USD', label: 'USD - Dólar ($)' },
                      { code: 'MXN', label: 'MXN - Peso Mexicano ($)' },
                      { code: 'EUR', label: 'EUR - Euro (€)' },
                    ].map(cur => (
                      <motion.button
                        key={cur.code}
                        type="button"
                        onClick={() => setCurrency(cur.code)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                        className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                          currency === cur.code
                            ? 'bg-text-primary text-text-inverse font-black shadow-sm'
                            : 'bg-surface-1 text-text-secondary font-bold border border-border-subtle hover:border-border-strong text-xs'
                        }`}
                      >
                        <span className="text-xs">{cur.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="pt-4 flex items-center justify-between"
                >
                  <motion.button
                    type="button"
                    onClick={() => setStep(2)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl border border-border-default text-text-secondary font-bold text-xs uppercase tracking-wider hover:bg-bg-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                    <span>Atrás</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary text-sm py-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ArrowRight className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.span>
                  </motion.button>
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-border-subtle text-[10px] font-black uppercase tracking-wider text-text-secondary"
                    >
                      <Clock className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                      <span>Paso 4 de 6 · Horarios de Atención</span>
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                      ¿Cuáles son tus horarios?
                    </h2>
                    <p className="text-xs text-text-tertiary">
                      Tus clientes solo podrán agendar en los turnos que tengas habilitados.
                    </p>
                  </div>

                  {/* Copy schedule button */}
                  <motion.button
                    type="button"
                    onClick={handleCopyScheduleToAll}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-bold border border-border-subtle transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer bg-surface-2 hover:bg-surface-3 text-text-primary"
                  >
                    <Copy className="w-3.5 h-3.5 text-text-tertiary" aria-hidden="true" />
                    <span>Copiar horario a todos los días</span>
                  </motion.button>
                </motion.div>

                {/* Days Table */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="border border-border-subtle rounded-2xl overflow-hidden divide-y divide-border-subtle"
                >
                  {schedule.map((item, idx) => (
                    <motion.div
                      key={item.dayIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + idx * 0.04 }}
                      className="p-3.5 flex items-center justify-between transition-colors bg-surface-1 hover:bg-surface-2"
                    >
                      <div className="flex items-center gap-3 w-32">
                        <motion.input
                          type="checkbox"
                          checked={item.isOpen}
                          onChange={(e) => {
                            const val = e.target.checked
                            setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, isOpen: val } : s))
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-4.5 h-4.5 rounded cursor-pointer accent-success border-border-default bg-bg-subtle"
                        />
                        <span className={`text-xs font-bold ${
                          item.isOpen ? 'text-text-primary' : 'text-text-muted line-through'
                        }`}>
                          {item.day}
                        </span>
                      </div>

                      {item.isOpen ? (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="time"
                            value={item.openTime}
                            onChange={(e) => {
                              const val = e.target.value
                              setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, openTime: val } : s))
                            }}
                            className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-medium outline-none bg-surface-2 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                          <span className="text-text-muted text-xs">a</span>
                          <input
                            type="time"
                            value={item.closeTime}
                            onChange={(e) => {
                              const val = e.target.value
                              setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, closeTime: val } : s))
                            }}
                            className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-medium outline-none bg-surface-2 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </motion.div>
                      ) : (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-xs font-semibold px-3 py-1 rounded-lg bg-error-bg text-error border border-error-border"
                        >
                          Cerrado
                        </motion.span>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="pt-4 flex items-center justify-between"
                >
                  <motion.button
                    type="button"
                    onClick={() => setStep(3)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl border border-border-default text-text-secondary font-bold text-xs uppercase tracking-wider hover:bg-bg-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                    <span>Atrás</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary text-sm py-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ArrowRight className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.span>
                  </motion.button>
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-2"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-border-subtle text-[10px] font-black uppercase tracking-wider text-text-secondary"
                  >
                    <Scissors className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>Paso 5 de 6 · Servicios</span>
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                    Agrega tus primeros servicios
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Haz clic en los ejemplos rápidos para añadirlos en un segundo, o escribe tus servicios personalizados.
                  </p>
                </motion.div>

                {/* Quick Presets */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-2">
                    Ejemplos rápidos populares:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SERVICE_PRESETS.map((p, idx) => (
                      <motion.button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPresetService(p)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-border-subtle bg-surface-2 hover:bg-surface-3 text-text-primary"
                      >
                        <Plus className="w-3.5 h-3.5 text-text-tertiary" aria-hidden="true" />
                        <span>{p.name} ({p.duration} min - ${p.price.toLocaleString('es-CO')})</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Add Custom Service Form */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="p-4 rounded-2xl glass border-border-subtle space-y-3"
                >
                  <span className="text-xs font-black text-text-primary block">
                    Personalizar o añadir nuevo servicio:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">Nombre</label>
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Ej. Diseño & Hair Tattoo"
                        className="input-base pl-4 pr-4 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">Duración</label>
                      <select
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className="input-base pl-4 pr-4 text-xs"
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
                      <label className="block text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">Precio ($)</label>
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        step="1000"
                        className="input-base pl-4 pr-4 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <motion.button
                      type="button"
                      onClick={handleAddService}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs bg-accent text-text-inverse"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Agregar servicio</span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Services List */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="space-y-2"
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                    Servicios configurados ({services.length}):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {services.map((s, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 + idx * 0.04 }}
                        className="p-3 rounded-2xl border border-border-subtle flex items-center justify-between shadow-2xs bg-surface-1 hover:bg-surface-2"
                      >
                        <div>
                          <p className="text-xs font-black text-text-primary">{s.name}</p>
                          <p className="text-[10px] text-text-tertiary">
                            {s.duration} min · <span className="font-bold text-text-primary">${s.price.toLocaleString('es-CO')}</span>
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          whileHover={{ scale: 1.15, rotate: 180 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-text-muted hover:text-error p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="pt-4 flex items-center justify-between"
                >
                  <motion.button
                    type="button"
                    onClick={() => setStep(4)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl border border-border-default text-text-secondary font-bold text-xs uppercase tracking-wider hover:bg-bg-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                    <span>Atrás</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary text-sm py-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ArrowRight className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.span>
                  </motion.button>
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-2"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-border-subtle text-[10px] font-black uppercase tracking-wider text-text-secondary"
                  >
                    <User className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>Paso 6 de 6 · Equipo Inicial</span>
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                    Agrega tu primer barbero
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Puedes agregar a tu primer estilista o saltar este paso si eres el único que atiende o prefieres agregarlos después en tu panel.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="p-6 rounded-2xl glass border-border-subtle space-y-4"
                >
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                      Nombre del Barbero
                    </label>
                    <div className="relative">
                      <motion.div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <User className="w-4.5 h-4.5" aria-hidden="true" />
                      </motion.div>
                      <input
                        type="text"
                        value={barberName}
                        onChange={(e) => setBarberName(e.target.value)}
                        placeholder="Ej. Carlos 'The Blade' Ruiz"
                        className="input-base pl-11 pr-4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                        Especialidad
                      </label>
                      <input
                        type="text"
                        value={barberSpecialty}
                        onChange={(e) => setBarberSpecialty(e.target.value)}
                        placeholder="Degradados & Barba"
                        className="input-base pl-4 pr-4"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-text-tertiary mb-2">
                        Teléfono Celular
                      </label>
                      <input
                        type="tel"
                        value={barberPhone}
                        onChange={(e) => setBarberPhone(e.target.value)}
                        placeholder="+57 311 000 0000"
                        className="input-base pl-4 pr-4"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <motion.button
                    type="button"
                    onClick={() => setStep(5)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border-default text-text-secondary font-bold text-xs uppercase tracking-wider hover:bg-bg-subtle transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                    <span>Atrás</span>
                  </motion.button>

                  <motion.div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Botón: Agregar después */}
                    <motion.button
                      type="button"
                      disabled={loading}
                      onClick={() => handleCompleteRegistration(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 sm:flex-initial px-5 py-3.5 rounded-xl border border-border-default font-bold text-xs uppercase tracking-wider transition-all cursor-pointer bg-surface-2 hover:bg-surface-3 text-text-primary"
                    >
                      Agregar después
                    </motion.button>

                    {/* Botón: Finalizar y crear */}
                    <motion.button
                      type="button"
                      disabled={loading}
                      onClick={() => handleCompleteRegistration(false)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 sm:flex-initial btn-primary text-sm py-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          <span>Crear mi barbería</span>
                          <motion.span
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <Check className="w-4.5 h-4.5 stroke-[3]" aria-hidden="true" />
                          </motion.span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
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
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-success/20 border border-success/30 bg-success/10 text-success"
                >
                  <CheckCircle2 className="w-12 h-12" aria-hidden="true" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="space-y-2"
                >
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.3 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30 text-[10px] font-black uppercase tracking-widest text-success"
                  >
                    ¡Configuración Completa!
                  </motion.span>
                  <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
                    Tu barbería está lista
                  </h2>
                  <p className="text-sm max-w-md mx-auto leading-relaxed text-text-secondary">
                    Ya puedes comenzar a recibir reservas, organizar tus citas y administrar tu negocio con BarberOS.
                  </p>
                </motion.div>

                {/* Summary Box */}
                {createdBusiness && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="max-w-md mx-auto border border-border-subtle rounded-2xl p-5 text-left space-y-3 bg-surface-1"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                      <div>
                        <p className="text-xs font-black text-text-primary">{createdBusiness.name}</p>
                        <p className="text-[10px] text-text-tertiary">Portal oficial de reservas activo</p>
                      </div>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-success"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">Enlace de tu página web:</p>
                      <div className="flex items-center justify-between border border-border-subtle rounded-xl px-3 py-2 bg-surface-2">
                        <span className="font-mono text-xs truncate text-text-secondary">
                          barberos.app/b/{createdBusiness.slug}
                        </span>
                        <motion.button
                          type="button"
                          onClick={copyPublicUrl}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="ml-2 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
                >
                  <motion.button
                    type="button"
                    onClick={() => {
                      router.push('/dashboard')
                      router.refresh()
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto bg-text-primary hover:bg-text-secondary text-text-inverse font-black text-xs uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Ir al Dashboard</span>
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ArrowRight className="w-4.5 h-4.5" aria-hidden="true" />
                    </motion.span>
                  </motion.button>

                  {createdBusiness && (
                    <motion.a
                      href={`/b/${createdBusiness.slug}`}
                      target="_blank"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto btn-secondary text-sm py-4 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4.5 h-4.5" aria-hidden="true" />
                      <span>Ver mi Página Web</span>
                    </motion.a>
                  )}
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-text-tertiary"
      >
        <p>© {new Date().getFullYear()} BarberOS. Tu negocio organizado desde el primer día.</p>
      </motion.footer>
    </div>
  )
}