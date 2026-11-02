'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { 
  Scissors, 
  MapPin, 
  Phone, 
  Calendar, 
  ArrowRight, 
  User, 
  Clock, 
  Star, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Share2, 
  Loader2,
  CalendarCheck,
  MessageCircle,
  Award,
  Navigation,
  CheckSquare,
  Square,
  ShieldCheck,
  Plus,
  Layers
} from 'lucide-react'
import { getTheme, getFont, getEffectiveColors, getAccentContrast, VisualTheme, ThemeColors } from '@/lib/themes'
import BarberPoleLoader from '@/components/public/BarberPoleLoader'
import { BANNER_PRESETS, DEFAULT_HERO_BANNER } from '@/components/public/BannerPresets'
import { DayScheduleItem, DEFAULT_SCHEDULE, parseSchedule, formatDayHours, formatTime12h } from '@/lib/schedule'
import { buildSocialUrl } from '@/lib/socials'
import { parseLocation } from '@/lib/maps'

/* ── Brand Social Icons ── */
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const DEFAULT_BANNER = DEFAULT_HERO_BANNER

const DEFAULT_GALLERY = [
  // ── Cortes (6) ──
  { id: 'c-1', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80', caption: 'Fade Clásico & Texturizado', category: 'cortes' },
  { id: 'c-2', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80', caption: 'Degradado Skin Fade Pulido', category: 'cortes' },
  { id: 'c-3', url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80', caption: 'Corte Moderno Urbano', category: 'cortes' },
  { id: 'c-4', url: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=800&q=80', caption: 'Tijera y Acabado Mate', category: 'cortes' },
  { id: 'c-5', url: 'https://images.unsplash.com/photo-1593702295094-aea22597af65?auto=format&fit=crop&w=800&q=80', caption: 'Diseño de Líneas & Contorno', category: 'cortes' },
  { id: 'c-6', url: '/imagenes/banner-corte-navaja.jpeg', caption: 'Perfilado con Navaja de Precisión', category: 'cortes' },

  // ── Barbas (6) ──
  { id: 'b-1', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80', caption: 'Perfilado de Barba Completa', category: 'barbas' },
  { id: 'b-2', url: '/imagenes/banner-cuidado-barba.jpeg', caption: 'Ritual de Toalla Caliente', category: 'barbas' },
  { id: 'b-3', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', caption: 'Afeitado Tradicional al Ras', category: 'barbas' },
  { id: 'b-4', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', caption: 'Hidratación & Bálsamos Esenciales', category: 'barbas' },
  { id: 'b-5', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', caption: 'Diseño de Bigote y Pómulos', category: 'barbas' },
  { id: 'b-6', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', caption: 'Degradado y Sombreado de Barba', category: 'barbas' },

  // ── Instalaciones (6) ──
  { id: 'i-1', url: '/imagenes/banner-sillon-vintage.jpeg', caption: 'Sillones de Cuero Vintage', category: 'instalaciones' },
  { id: 'i-2', url: '/imagenes/banner-barber-premium.jpeg', caption: 'Salón Principal Luxury', category: 'instalaciones' },
  { id: 'i-3', url: '/imagenes/banner-estacion-tijeras.jpeg', caption: 'Estación de Trabajo Profesional', category: 'instalaciones' },
  { id: 'i-4', url: '/imagenes/banner-salon-neon.jpeg', caption: 'Zona Lounge & Luces Neón', category: 'instalaciones' },
  { id: 'i-5', url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80', caption: 'Espejos con Iluminación LED', category: 'instalaciones' },
  { id: 'i-6', url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80', caption: 'Área de Lavado y Spa', category: 'instalaciones' },
]

const DEFAULT_TESTIMONIALS = [
  { id: '1', name: 'Andrés Morales', comment: 'El mejor fade que me han hecho en años. La atención, la puntualidad y el ambiente superan cualquier expectativa.', rating: 5, date: 'Hace 3 días' },
  { id: '2', name: 'Camilo Restrepo', comment: 'Excelente experiencia de principio a fin. El ritual de toalla caliente para la barba es de otro nivel.', rating: 5, date: 'Hace 1 semana' },
  { id: '3', name: 'Sebastián Gómez', comment: 'Puntuales, pulcros y los barberos realmente dominan las técnicas modernas. 100% recomendado.', rating: 5, date: 'Hace 2 semanas' },
]



export default function PublicBusinessPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [colorMode, setColorMode] = useState<'dark' | 'light' | 'system'>('dark')
  const [activeGalleryCat, setActiveGalleryCat] = useState<'todos' | 'cortes' | 'barbas' | 'instalaciones'>('todos')
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // ── Multi-Service Booking State ──
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [availableSlots, setAvailableSlots] = useState<{ time: string; barberIds: string[] }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null)

  const [navScrolled, setNavScrolled] = useState(false)
  const reserveRef = useRef<HTMLDivElement>(null)

  const todayIndex = new Date().getDay()

  useEffect(() => {
    if (!slug) return
    const fetchBusiness = async () => {
      try {
        const res = await fetch(`/api/public/b/${slug}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBusiness()
  }, [slug])

  // ── Sincronización en tiempo real con el Editor Web mediante postMessage ──
  useEffect(() => {
    // Avisar al editor padre que el iframe está montado y listo
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_IFRAME_READY' }, '*')
    }

    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_STATE_UPDATE') {
        const { config, logo, previewColorMode } = event.data
        if (config || logo !== undefined) {
          setData((prev: any) => {
            if (!prev) return prev
            return {
              ...prev,
              logo: logo !== undefined ? logo : prev.logo,
              page: {
                ...(prev.page || {}),
                ...(config || {})
              }
            }
          })
        }
        if (previewColorMode) {
          setColorMode(previewColorMode)
        }
      }
    }

    window.addEventListener('message', handlePreviewMessage)
    return () => window.removeEventListener('message', handlePreviewMessage)
  }, [])

  // Scroll listener — nav se vuelve sólido al salir del hero
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Real-time slot calculation
  useEffect(() => {
    async function loadSlots() {
      if (!data || selectedServices.length === 0 || !selectedDate) return
      setLoadingSlots(true)
      setSelectedSlot(null)
      try {
        const primaryService = selectedServices[0]
        const totalDuration = selectedServices.reduce((acc, s) => acc + (Number(s.duration) || 30), 0)
        const url = `/api/public/availability?businessId=${data.id}&serviceId=${primaryService.id}&duration=${totalDuration}&date=${selectedDate}${selectedBarber ? `&barberId=${selectedBarber.id}` : ''}`
        const res = await fetch(url)
        const json = await res.json()
        setAvailableSlots(json.slots || [])
      } catch {
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    if (bookingStep === 4) {
      loadSlots()
    }
  }, [bookingStep, data, selectedServices, selectedDate, selectedBarber])

  const scrollToBooking = (service?: any, barber?: any) => {
    if (service) {
      // If service is not in selection, select it
      setSelectedServices(prev => {
        const exists = prev.some(s => s.id === service.id)
        if (exists) return prev
        return [...prev, service]
      })
      setBookingStep(1)
    } else if (barber) {
      setSelectedBarber(barber)
      setBookingStep(1)
    }
    reserveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleService = (service: any) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id)
      if (exists) return prev.filter(s => s.id !== service.id)
      return [...prev, service]
    })
  }

  const totalAccumulatedPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0)
  const totalAccumulatedDuration = selectedServices.reduce((sum, s) => sum + (Number(s.duration) || 30), 0)

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError(null)
    if (!clientName.trim() || !clientPhone.trim() || !selectedSlot || selectedServices.length === 0 || !data) {
      setBookingError('Por favor completa todos los campos requeridos.')
      return
    }

    setSubmittingBooking(true)
    try {
      const primaryService = selectedServices[0]
      const fullDateTime = `${selectedDate}T${selectedSlot}:00`

      const payload = {
        businessId: data.id,
        serviceId: primaryService.id,
        totalDuration: totalAccumulatedDuration,
        barberId: selectedBarber?.id || (availableSlots.find(s => s.time === selectedSlot)?.barberIds[0]),
        date: fullDateTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
      }

      const res = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const resJson = await res.json()

      if (res.ok && resJson.appointment) {
        setBookingSuccess(resJson.appointment)
        setBookingStep(5)
      } else {
        setBookingError(resJson.error || 'No se pudo agendar la cita. Intenta con otro horario.')
      }
    } catch {
      setBookingError('Error de conexión al conectar con la barbería.')
    } finally {
      setSubmittingBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3.5">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-400">Preparando Barbería...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white flex-col gap-4 p-6 text-center">
        <Scissors className="w-16 h-16 text-zinc-700" />
        <h1 className="text-3xl font-black">Barbería no encontrada</h1>
        <p className="text-zinc-500 text-sm max-w-md">El enlace no corresponde a ningún negocio activo en BarberOS.</p>
      </div>
    )
  }

  // ── Theme & Font Configuration ──
  const pageConfig = data.page || {}
  const theme: VisualTheme = getTheme(pageConfig.theme || 'ELEGANTE')
  const fontConfig = getFont(pageConfig.fontFamily || 'inter')
  const colors: ThemeColors = getEffectiveColors(theme, colorMode)
  const isLightMode = colorMode === 'light'
  const accentBtnText = getAccentContrast(colors.accent, colors.accentContrast)

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Social Links
  const showWhatsapp = pageConfig.showWhatsapp !== false
  const showInstagram = pageConfig.showInstagram !== false
  const showFacebook = pageConfig.showFacebook !== false
  const showTiktok = pageConfig.showTiktok !== false

  const rawWhatsapp = pageConfig.whatsapp || data.phone || ''
  const whatsappUrl = (showWhatsapp && rawWhatsapp) ? buildSocialUrl('whatsapp', rawWhatsapp) : ''
  const instagramUrl = (showInstagram && pageConfig.instagram) ? buildSocialUrl('instagram', pageConfig.instagram) : ''
  const facebookUrl = (showFacebook && pageConfig.facebook) ? buildSocialUrl('facebook', pageConfig.facebook) : ''
  const tiktokUrl = (showTiktok && pageConfig.tiktok) ? buildSocialUrl('tiktok', pageConfig.tiktok) : ''

  // Helper para normalizar categoría
  const normalizeGalleryCat = (cat: string) => {
    const c = (cat || 'cortes').toLowerCase()
    if (c === 'barba' || c === 'barbas') return 'barbas'
    if (c === 'instalacion' || c === 'instalaciones') return 'instalaciones'
    return 'cortes'
  }

  // Gallery items - separate custom uploaded images vs default reference images
  const hasCustomGallery = Array.isArray(pageConfig.gallery) && pageConfig.gallery.length > 0
  const customGallery = hasCustomGallery ? pageConfig.gallery : []

  const filteredGallery = (() => {
    if (hasCustomGallery) {
      if (activeGalleryCat === 'todos') {
        const cortes = customGallery.filter((i: any) => normalizeGalleryCat(i.category) === 'cortes').slice(0, 6)
        const barbas = customGallery.filter((i: any) => normalizeGalleryCat(i.category) === 'barbas').slice(0, 6)
        const instalaciones = customGallery.filter((i: any) => normalizeGalleryCat(i.category) === 'instalaciones').slice(0, 6)
        return [...cortes, ...barbas, ...instalaciones]
      }
      return customGallery.filter((i: any) => normalizeGalleryCat(i.category) === activeGalleryCat).slice(0, 6)
    }

    // Fallback: Si el negocio aún no ha subido fotos, mostrar estilos curados de referencia
    if (activeGalleryCat === 'todos') {
      const cortes = DEFAULT_GALLERY.filter((i: any) => normalizeGalleryCat(i.category) === 'cortes').slice(0, 6)
      const barbas = DEFAULT_GALLERY.filter((i: any) => normalizeGalleryCat(i.category) === 'barbas').slice(0, 6)
      const instalaciones = DEFAULT_GALLERY.filter((i: any) => normalizeGalleryCat(i.category) === 'instalaciones').slice(0, 6)
      return [...cortes, ...barbas, ...instalaciones]
    }
    return DEFAULT_GALLERY.filter((i: any) => normalizeGalleryCat(i.category) === activeGalleryCat).slice(0, 6)
  })()

  // Testimonials
  const testimonialItems = Array.isArray(pageConfig.testimonials) && pageConfig.testimonials.length > 0 
    ? pageConfig.testimonials 
    : DEFAULT_TESTIMONIALS

  // Horarios Semanales Estructurados & Estado de Hoy
  const effectiveSchedule = parseSchedule(pageConfig.scheduleJson || pageConfig.businessHours)
  const todayScheduleItem = effectiveSchedule.find((s: DayScheduleItem) => s.dayIndex === todayIndex) || effectiveSchedule[0]
  const isTodayOpen = todayScheduleItem ? todayScheduleItem.isOpen : true

  // Next 12 days for date selector
  const nextDays = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      full: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('es-CO', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('es-CO', { month: 'short' }),
      isToday: i === 0,
    }
  })

  // Google Maps location resolution & security validation
  const locationInfo = parseLocation(data.address, data.name)

  return (
    <div 
      className="min-h-screen w-full flex flex-col transition-colors duration-300 antialiased overflow-x-hidden"
      style={{ 
        backgroundColor: colors.bg, 
        color: colors.textPrimary,
        fontFamily: fontConfig.bodyFont,
        '--accent-color': colors.accent 
      } as React.CSSProperties}
    >
      {/* 💈 BARBER POLE ENTRANCE LOADER */}
      <BarberPoleLoader businessName={data.name} />

      {/* ════════════════════════════════════════════════════════
          1. HEADER / NAVBAR FLOTANTE (transparente en hero, sólido al hacer scroll)
      ════════════════════════════════════════════════════════ */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
        style={{ 
          backgroundColor: navScrolled 
            ? (colorMode === 'light' ? 'rgba(255, 255, 255, 0.95)' : `${colors.bg}f0`) 
            : 'transparent',
          backdropFilter: navScrolled ? 'blur(14px)' : 'none',
          borderBottom: navScrolled 
            ? `1px solid ${colorMode === 'light' ? 'rgba(0,0,0,0.08)' : colors.border}` 
            : 'none',
          boxShadow: navScrolled ? '0 4px 30px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {data.logo ? (
              <div 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden flex items-center justify-center p-1 bg-black/40 backdrop-blur-md border shrink-0 shadow-md transition-transform hover:scale-105"
                style={{ borderColor: `${colors.accent}60`, boxShadow: `0 2px 10px ${colors.accent}25` }}
              >
                <img 
                  src={data.logo} 
                  alt={data.name} 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
            ) : (
              <div 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black shadow-md shrink-0 border" 
                style={{ backgroundColor: colors.accent, color: '#000000', borderColor: colors.accent }}
              >
                <Scissors className="w-5 h-5" />
              </div>
            )}
            <span 
              className={`font-black text-base sm:text-lg md:text-xl tracking-tight leading-tight truncate transition-colors ${
                navScrolled && colorMode === 'light' ? 'text-zinc-900' : 'text-white drop-shadow-md'
              }`} 
              style={{ fontFamily: fontConfig.headingFont }}
            >
              {data.name}
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className={`hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider transition-colors ${
            navScrolled && colorMode === 'light' ? 'text-zinc-700' : 'text-white/80'
          }`}>
            {data.services && data.services.length > 0 && (
              <a href="#servicios" className={`transition-colors ${navScrolled && colorMode === 'light' ? 'hover:text-black' : 'hover:text-white'}`}>Servicios</a>
            )}
            {data.barbers && data.barbers.length > 0 && (
              <a href="#equipo" className={`transition-colors ${navScrolled && colorMode === 'light' ? 'hover:text-black' : 'hover:text-white'}`}>Equipo</a>
            )}
            <a href="#galeria" className={`transition-colors ${navScrolled && colorMode === 'light' ? 'hover:text-black' : 'hover:text-white'}`}>Galería</a>
            <a href="#horarios" className={`transition-colors ${navScrolled && colorMode === 'light' ? 'hover:text-black' : 'hover:text-white'}`}>Horarios</a>
            <a href="#ubicacion" className={`transition-colors ${navScrolled && colorMode === 'light' ? 'hover:text-black' : 'hover:text-white'}`}>Ubicación</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Color Mode Toggle */}
            <button
              onClick={() => setColorMode(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`p-2.5 rounded-full border transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center ${
                navScrolled && colorMode === 'light'
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:bg-zinc-200 hover:border-zinc-400 shadow-xs'
                  : 'bg-black/50 border-white/20 text-white hover:bg-black/75 backdrop-blur-md'
              }`}
              title={colorMode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Cambiar tema"
            >
              {colorMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className={`w-4 h-4 ${navScrolled && colorMode === 'light' ? 'text-zinc-900 fill-zinc-900' : 'text-amber-300 fill-amber-300'}`} />
              )}
            </button>

            {/* Quick WhatsApp */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#25D366]/25 cursor-pointer"
              >
                <WhatsAppIcon />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Primary CTA */}
            <button
              onClick={() => scrollToBooking()}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              style={{ backgroundColor: colors.accent, color: accentBtnText }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reservar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          2. HERO CINEMATOGRÁFICO CON ANIMACIÓN Y OVERLAYS
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-screen w-full flex items-center justify-center px-4 sm:px-5 py-20 sm:py-24">
        {/* Cinematic Background Image with luxury dark gradient overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={pageConfig.bannerUrl || DEFAULT_BANNER} 
            alt={`Portada de ${data.name}`}
            className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.1] scale-105 animate-hero-zoom transition-transform duration-1000 ease-out" 
          />
          {/* Deep dark cinematic gradient overlay for 100% razor-sharp contrast in all modes */}
          <div 
            className="absolute inset-0" 
            style={{ 
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.52) 50%, rgba(0, 0, 0, 0.88) 100%)'
            }} 
          />
          {/* Radial Ambient Glow */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${colors.accent}35 0%, transparent 70%)`
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center w-full">
          {/* Spacer en lugar del badge eliminado */}
          <div className="mb-4 sm:mb-6" />

          {/* Title — usa coverTitle configurado o el nombre real del negocio */}
          <h1 
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.12] mb-6 text-white drop-shadow-lg animate-fade-in-up delay-100 px-2"
            style={{ fontFamily: fontConfig.headingFont }}
          >
            {pageConfig.coverTitle && pageConfig.coverTitle.trim()
              ? pageConfig.coverTitle
              : `Bienvenido a ${data.name}`}
          </h1>

          {/* Descripción profesional */}
          <p className="text-sm sm:text-base md:text-lg font-medium max-w-2xl text-zinc-200 leading-relaxed mb-8 drop-shadow animate-fade-in-up delay-200">
            {pageConfig.coverSubtitle && pageConfig.coverSubtitle.trim()
              ? pageConfig.coverSubtitle
              : 'Reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería diseñada para resaltar tu mejor estilo.'}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-in-up delay-400">
            <button
              onClick={() => scrollToBooking()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-sm font-black uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              style={{ backgroundColor: colors.accent, color: accentBtnText }}
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Cita</span>
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-sm font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#25D366]/30 cursor-pointer border border-[#25D366]"
              >
                <WhatsAppIcon />
                <span>Ir a WhatsApp</span>
              </a>
            )}
          </div>

          {/* Trust Badges — Pastillas oscuras con cristal y tipografía de alto contraste */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12 text-xs font-bold animate-fade-in-up delay-500">
            {data.address && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/60 backdrop-blur-md shadow-md text-white">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-xs">{data.address}</span>
              </div>
            )}
            {isTodayOpen ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/40 bg-black/60 backdrop-blur-md shadow-md">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold text-xs text-emerald-300">Abierto Hoy</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/40 bg-black/60 backdrop-blur-md shadow-md">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="font-semibold text-xs text-rose-300">
                  {todayScheduleItem.customMessage?.trim() || 'Cerrado Hoy'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/40 bg-black/60 backdrop-blur-md shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-xs text-amber-300">Barberos Profesionales</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. SERVICIOS DESTACADOS (MULTI-SELECCIÓN)
      ══════════════════════════════════════════════════════════ */}
      {data.services && data.services.length > 0 && (
        <section id="servicios" className="py-20 px-5 border-t" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-[0.2em] block mb-2" style={{ color: colors.accent }}>
                CATÁLOGO EXCLUSIVO
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: fontConfig.headingFont }}>
                Nuestros Servicios
              </h2>
              <p className="text-sm font-medium opacity-75" style={{ color: colors.textSecondary }}>
                Puedes seleccionar uno o varios servicios para combinarlos en una misma cita.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.services.map((service: any) => {
                const isSelected = selectedServices.some(s => s.id === service.id)
                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                      isSelected ? 'shadow-xl scale-[1.01]' : 'hover:border-zinc-500/40'
                    }`}
                    style={{
                      backgroundColor: isSelected ? colors.badgeBg : colors.surfaceCard,
                      borderColor: isSelected ? colors.accent : colors.border,
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <h3 className="text-lg font-black tracking-tight group-hover:text-amber-400 transition-colors" style={{ fontFamily: fontConfig.headingFont }}>
                          {service.name}
                        </h3>
                        {pageConfig.showPrices !== false && (
                          <span className="text-base font-black shrink-0 ml-3" style={{ color: colors.accent }}>
                            {formatCOP(Number(service.price))}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium opacity-75 line-clamp-2 mb-6" style={{ color: colors.textSecondary }}>
                        {service.description || 'Atención personalizada con acabado profesional y productos de alta gama.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: `${colors.border}60` }}>
                      <div className="flex items-center gap-1.5 text-xs font-bold opacity-70">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration} min</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-amber-400' : 'opacity-60'}`}>
                          {isSelected ? 'Seleccionado' : 'Añadir'}
                        </span>
                        <div 
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'border-transparent' : 'opacity-40'
                          }`}
                          style={isSelected ? { backgroundColor: colors.accent, color: accentBtnText } : { borderColor: colors.textSecondary }}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          4. EQUIPO DE BARBEROS
      ══════════════════════════════════════════════════════════ */}
      {data.barbers && data.barbers.length > 0 && pageConfig.showTeam !== false && (
        <section id="equipo" className="py-20 px-5 border-t" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-black uppercase tracking-[0.2em] block mb-2" style={{ color: colors.accent }}>
                TALENTO & EXPERIENCIA
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: fontConfig.headingFont }}>
                Equipo de Maestros
              </h2>
              <p className="text-sm font-medium opacity-75" style={{ color: colors.textSecondary }}>
                Profesionales certificados con años de experiencia en técnicas de barbería tradicional y vanguardista.
              </p>
            </div>

            <div className="flex flex-wrap items-stretch justify-center gap-6">
              {data.barbers.map((barber: any, bIdx: number) => {
                const placeholderAvatars = [
                  '/imagenes/banner-corte-navaja.jpeg',
                  '/imagenes/banner-sillon-vintage.jpeg',
                  '/imagenes/banner-estacion-tijeras.jpeg',
                  '/imagenes/banner-cuidado-barba.jpeg'
                ]
                const barberPhoto = barber.avatar || placeholderAvatars[bIdx % placeholderAvatars.length]

                return (
                  <div
                    key={barber.id}
                    onClick={() => scrollToBooking(undefined, barber)}
                    className="group p-6 rounded-3xl border text-center transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col items-center justify-between shadow-sm hover:shadow-xl w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[290px] max-w-sm"
                    style={{
                      backgroundColor: colors.surfaceCard,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex flex-col items-center w-full">
                      {/* Barber Photo Container */}
                      <div className="relative mb-5 mx-auto">
                        <div 
                          className="w-28 h-28 rounded-full overflow-hidden border-2 shadow-lg transition-transform duration-300 group-hover:scale-105 mx-auto bg-zinc-800"
                          style={{ borderColor: colors.accent }}
                        >
                          <img 
                            src={barberPhoto} 
                            alt={barber.name} 
                            className="w-full h-full object-cover object-center" 
                          />
                        </div>
                        <div 
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md"
                          style={{ backgroundColor: colors.accent, color: '#000000' }}
                        >
                          <Scissors className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Name — uniform min-height for perfect grid alignment */}
                      <h3 
                        className="font-black text-lg tracking-tight mb-1 text-center w-full truncate" 
                        style={{ fontFamily: fontConfig.headingFont, color: colors.textPrimary }}
                        title={barber.name}
                      >
                        {barber.name}
                      </h3>

                      {/* Specialty */}
                      <p 
                        className="text-xs font-bold uppercase tracking-wider mb-2 text-center w-full truncate" 
                        style={{ color: colors.accent }}
                      >
                        {barber.specialty || 'Master Barber'}
                      </p>

                      {/* Experience badge */}
                      <div className="flex items-center justify-center gap-1.5 mb-5 w-full">
                        <span 
                          className="text-[11px] font-semibold px-3 py-1 rounded-full border inline-flex items-center gap-1" 
                          style={{ borderColor: colors.border, backgroundColor: `${colors.accent}12`, color: colors.textSecondary }}
                        >
                          <Award className="w-3 h-3" style={{ color: colors.accent }} />
                          <span>Barbero Profesional</span>
                        </span>
                      </div>
                    </div>

                    <div className="w-full pt-3.5 border-t mt-auto" style={{ borderColor: `${colors.border}60` }}>
                      <button
                        className="w-full text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all border flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-xs"
                        style={{ 
                          borderColor: colors.border, 
                          backgroundColor: colors.surface,
                          color: colors.textPrimary 
                        }}
                      >
                        <span>Agendar con {barber.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          5. GALERÍA DE TRABAJOS
      ══════════════════════════════════════════════════════════ */}
      <section id="galeria" className="py-20 px-5 border-t" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-[0.2em] block mb-2" style={{ color: colors.accent }}>
              PORTAFOLIO DE CORTES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: fontConfig.headingFont }}>
              Nuestra Galería
            </h2>
            <p className="text-sm font-medium opacity-75 mb-2" style={{ color: colors.textSecondary }}>
              Cada detalle cuenta. Explora cortes, perfilados y el ambiente de nuestras instalaciones.
            </p>
            {!hasCustomGallery && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border mb-6" style={{ borderColor: colors.border, color: colors.accent, backgroundColor: `${colors.accent}10` }}>
                Fotografías de Estilo & Referencia Curadas
              </span>
            )}
            {hasCustomGallery && <div className="mb-6" />}

            {/* Category tabs */}
            <div className="inline-flex p-1 rounded-2xl border backdrop-blur-md" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'cortes', label: 'Cortes' },
                { id: 'barbas', label: 'Barbas' },
                { id: 'instalaciones', label: 'Instalaciones' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGalleryCat(tab.id as any)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeGalleryCat === tab.id ? 'shadow-sm font-black' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={activeGalleryCat === tab.id ? { backgroundColor: colors.accent, color: colors.bg } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid or Empty State */}
          {filteredGallery.length === 0 ? (
            <div 
              className="py-16 px-6 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center max-w-md mx-auto"
              style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 opacity-60"
                style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
              >
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-sm font-black mb-1" style={{ color: colors.textPrimary }}>
                Próximamente más fotografías en esta sección
              </p>
              <p className="text-xs font-medium opacity-60" style={{ color: colors.textSecondary }}>
                Nuestro equipo está preparando nuevos trabajos profesionales para compartir contigo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredGallery.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxImg(item.url)}
                  className="group relative h-52 sm:h-72 rounded-3xl overflow-hidden cursor-pointer border shadow-sm"
                  style={{ borderColor: colors.border }}
                >
                  <img 
                    src={item.url} 
                    alt={item.caption || 'Corte de barbería'} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                    <span className="text-xs font-black text-white">{item.caption || 'Corte exclusivo'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Modal Lightbox ── */}
      {lightboxImg && (
        <div 
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <button 
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img 
            src={lightboxImg} 
            alt="Ampliación de foto" 
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" 
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          6. TESTIMONIOS & RESEÑAS
      ══════════════════════════════════════════════════════════ */}
      <section id="testimonios" className="py-20 px-5 border-t" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-[0.2em] block mb-2" style={{ color: colors.accent }}>
              OPINIONES REALES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: fontConfig.headingFont }}>
              Lo Que Dicen Nuestros Clientes
            </h2>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-xs font-bold ml-2 opacity-80">5.0 de calificación media</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialItems.map((test: any) => (
              <div 
                key={test.id}
                className="p-8 rounded-3xl border flex flex-col justify-between relative shadow-sm"
                style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
              >
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: test.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic mb-6 opacity-90" style={{ color: colors.textPrimary }}>
                    "{test.comment}"
                  </p>
                </div>

                <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: `${colors.border}60` }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase shadow-xs" style={{ backgroundColor: colors.accent, color: accentBtnText }}>
                      {test.name ? test.name.charAt(0) : 'C'}
                    </div>
                    <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>{test.name}</span>
                  </div>
                  {test.date && (
                    <span className="text-[10px] font-medium opacity-50" style={{ color: colors.textSecondary }}>{test.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. UBICACIÓN, CONTACTO & HORARIOS
      ══════════════════════════════════════════════════════════ */}
      <section id="contacto" className="py-20 px-5 border-t" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-[0.2em] block mb-2" style={{ color: colors.accent }}>
              VISÍTANOS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: fontConfig.headingFont }}>
              Ubicación & Canales
            </h2>
            <p className="text-sm font-medium opacity-75" style={{ color: colors.textSecondary }}>
              Estamos listos para recibirte y brindarte la mejor experiencia de barbería.
            </p>
          </div>

          <div className={`grid grid-cols-1 ${locationInfo ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'} gap-6`}>
            {/* Card 1: Dirección & Mapa Incrustado */}
            {locationInfo && (
              <div 
                className="p-8 rounded-3xl border flex flex-col justify-between shadow-sm"
                style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-xs" style={{ backgroundColor: colors.accent, color: accentBtnText }}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-2" style={{ fontFamily: fontConfig.headingFont }}>
                    Nuestra Ubicación
                  </h3>
                  <p className="text-sm font-medium opacity-80 mb-4 leading-relaxed" style={{ color: colors.textSecondary }}>
                    {locationInfo.displayText}
                  </p>

                  {/* Mapa incrustado sin requerir API key de pago */}
                  <div 
                    className="w-full h-44 rounded-2xl overflow-hidden border shadow-xs mb-5 relative bg-zinc-100 dark:bg-zinc-900"
                    style={{ borderColor: colors.border }}
                  >
                    <iframe
                      src={locationInfo.embedUrl}
                      title={`Ubicación de ${data.name}`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      aria-label={`Mapa interactivo de ${data.name}`}
                    />
                  </div>
                </div>

                {/* Botón Cómo llegar */}
                <a
                  href={locationInfo.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-xs font-black uppercase tracking-wider py-3 rounded-xl border flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-95 cursor-pointer shadow-xs"
                  style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
                >
                  <Navigation className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                  <span>Cómo llegar</span>
                </a>
              </div>
            )}

            {/* Card 2: Horarios Semanales */}
            <div 
              className="p-8 rounded-3xl border flex flex-col justify-between shadow-sm"
              style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-xs" style={{ backgroundColor: colors.accent, color: accentBtnText }}>
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: fontConfig.headingFont }}>
                    Horarios de Atención
                  </h3>
                  {isTodayOpen ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Abierto Hoy
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      Cerrado Hoy
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mb-2 mt-3">
                  {effectiveSchedule.map((item: DayScheduleItem) => {
                    const isToday = item.dayIndex === todayIndex
                    return (
                      <div 
                        key={item.day} 
                        className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors ${
                          isToday ? 'font-black bg-zinc-500/10' : 'font-medium opacity-80'
                        }`}
                        style={{ color: colors.textPrimary }}
                      >
                        <span className="flex items-center gap-1.5">
                          {isToday && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />}
                          {item.day}
                        </span>
                        <span className="font-mono text-[11px]">
                          {formatDayHours(item).text}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-3 border-t text-[11px] opacity-60 text-center" style={{ borderColor: `${colors.border}60` }}>
                Agenda previa recomendada
              </div>
            </div>

            {/* Card 3: Canales Oficiales & Redes */}
            <div 
              className="p-8 rounded-3xl border flex flex-col justify-between shadow-sm"
              style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-xs" style={{ backgroundColor: colors.accent, color: accentBtnText }}>
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black tracking-tight mb-2" style={{ fontFamily: fontConfig.headingFont }}>
                  Contacto & Redes
                </h3>
                <p className="text-sm font-medium opacity-80 mb-5 leading-relaxed" style={{ color: colors.textSecondary }}>
                  {data.phone ? `Llámanos o escríbenos al ${data.phone}` : 'Contáctanos directamente en nuestras redes'}
                </p>

                {/* Social buttons */}
                <div className="space-y-2">
                  {showWhatsapp && whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-xs font-bold py-2.5 px-4 rounded-xl border flex items-center justify-between transition-all hover:scale-102 active:scale-95 cursor-pointer"
                      style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#25d366] text-white flex items-center justify-center">
                          <WhatsAppIcon />
                        </div>
                        <span>WhatsApp Oficial</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                    </a>
                  )}

                  {showInstagram && instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-xs font-bold py-2.5 px-4 rounded-xl border flex items-center justify-between transition-all hover:scale-102 active:scale-95 cursor-pointer"
                      style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#e1306c] text-white flex items-center justify-center">
                          <InstagramIcon />
                        </div>
                        <span>Instagram</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                    </a>
                  )}

                  {showFacebook && facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-xs font-bold py-2.5 px-4 rounded-xl border flex items-center justify-between transition-all hover:scale-102 active:scale-95 cursor-pointer"
                      style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#1877f2] text-white flex items-center justify-center">
                          <FacebookIcon />
                        </div>
                        <span>Facebook</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                    </a>
                  )}

                  {showTiktok && tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-xs font-bold py-2.5 px-4 rounded-xl border flex items-center justify-between transition-all hover:scale-102 active:scale-95 cursor-pointer"
                      style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center">
                          <TikTokIcon />
                        </div>
                        <span>TikTok</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t text-[11px] opacity-60 text-center" style={{ borderColor: `${colors.border}60` }}>
                {data.email ? data.email : 'Atención garantizada'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. MÓDULO DE RESERVA ONLINE INTERACTIVO (#reservar)
      ══════════════════════════════════════════════════════════ */}
      <section 
        id="reservar" 
        ref={reserveRef}
        className="py-20 px-5 border-t scroll-mt-10" 
        style={{ borderColor: colors.border, backgroundColor: colors.bg }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-[0.2em] block mb-2" style={{ color: colors.accent }}>
              SISTEMA DE CITAS EN LÍNEA
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: fontConfig.headingFont }}>
              Agenda Tu Cita
            </h2>
            <p className="text-sm font-medium opacity-75" style={{ color: colors.textSecondary }}>
              Elige tus servicios, selecciona tu fecha y asegura tu lugar en tiempo real.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto py-2">
            {[
              { num: 1, label: 'Servicios' },
              { num: 2, label: 'Barbero' },
              { num: 3, label: 'Fecha' },
              { num: 4, label: 'Hora' },
              { num: 5, label: 'Confirmar' }
            ].map(s => {
              const isPast = bookingStep > s.num
              const isCurrent = bookingStep === s.num
              return (
                <div key={s.num} className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => s.num < bookingStep && setBookingStep(s.num as any)}
                    disabled={s.num > bookingStep}
                    className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                      isCurrent ? 'scale-110 shadow-md' : isPast ? 'cursor-pointer' : 'opacity-40'
                    }`}
                    style={
                      isCurrent || isPast
                        ? { backgroundColor: colors.accent, color: colors.bg }
                        : { backgroundColor: colors.surface, color: colors.textSecondary }
                    }
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </button>
                  <span className={`text-xs font-bold ${isCurrent ? 'opacity-100 font-black' : 'opacity-50'}`}>
                    {s.label}
                  </span>
                  {s.num < 5 && <div className="w-4 sm:w-8 h-0.5 bg-zinc-700/40" />}
                </div>
              )
            })}
          </div>

          {/* Booking Card Container */}
          <div 
            className="p-6 sm:p-10 rounded-[32px] border shadow-2xl relative"
            style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
          >
            {/* Error Message */}
            {bookingError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* ── PASO 1: SELECCIONAR SERVICIOS (MULTI-SELECCIÓN) ── */}
            {bookingStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black" style={{ fontFamily: fontConfig.headingFont }}>
                      1. Elige tus servicios
                    </h3>
                    <span className="text-xs opacity-60 font-medium block mt-0.5">
                      Puedes marcar múltiples servicios simultáneamente
                    </span>
                  </div>
                  {selectedServices.length > 0 && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
                      {selectedServices.length} seleccionado(s)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {data.services?.map((svc: any) => {
                    const isSelected = selectedServices.some(s => s.id === svc.id)
                    return (
                      <div
                        key={svc.id}
                        onClick={() => toggleService(svc)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                          isSelected ? 'shadow-md scale-[1.01]' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? colors.accent : colors.border,
                          backgroundColor: isSelected ? colors.badgeBg : colors.bg,
                        }}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'border-transparent' : 'opacity-40'}`}
                            style={isSelected ? { backgroundColor: colors.accent, color: accentBtnText } : { borderColor: colors.textSecondary }}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm mb-0.5">{svc.name}</h4>
                            <span className="text-xs opacity-60 font-medium">{svc.duration} min</span>
                          </div>
                        </div>
                        <span className="font-black text-sm shrink-0 ml-2" style={{ color: colors.accent }}>
                          {formatCOP(Number(svc.price))}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
                  <div className="text-xs">
                    <span className="opacity-50 block">Total estimado ({totalAccumulatedDuration} min):</span>
                    <span className="text-lg font-black" style={{ color: colors.accent }}>
                      {formatCOP(totalAccumulatedPrice)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedServices.length === 0 && data.services && data.services.length > 0) {
                        setSelectedServices([data.services[0]])
                      }
                      setBookingStep(2)
                    }}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    style={{ backgroundColor: colors.accent, color: accentBtnText }}
                  >
                    <span>Siguiente: Barbero</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 2: SELECCIONAR BARBERO ── */}
            {bookingStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black" style={{ fontFamily: fontConfig.headingFont }}>
                    2. Selecciona a tu barbero
                  </h3>
                  <button 
                    onClick={() => setBookingStep(1)} 
                    className="text-xs font-bold opacity-60 hover:opacity-100 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Volver
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {/* Opción Cualquiera */}
                  <div
                    onClick={() => setSelectedBarber(null)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                      selectedBarber === null ? 'shadow-md scale-[1.01]' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: selectedBarber === null ? colors.accent : colors.border,
                      backgroundColor: selectedBarber === null ? colors.badgeBg : colors.bg,
                    }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: colors.surface, color: colors.accent }}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Cualquier Barbero</h4>
                      <span className="text-xs opacity-60">Mayor disponibilidad</span>
                    </div>
                  </div>

                  {/* Lista de Barberos */}
                  {data.barbers?.map((b: any) => {
                    const isSelected = selectedBarber?.id === b.id
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBarber(b)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                          isSelected ? 'shadow-md scale-[1.01]' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? colors.accent : colors.border,
                          backgroundColor: isSelected ? colors.badgeBg : colors.bg,
                        }}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border" style={{ borderColor: colors.accent }}>
                          {b.avatar ? (
                            <img src={b.avatar} alt={b.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-sm truncate">{b.name}</h4>
                          <span className="text-xs opacity-60 truncate block">{b.specialty || 'Master Barber'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
                  <button
                    onClick={() => setBookingStep(1)}
                    className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={() => setBookingStep(3)}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    style={{ backgroundColor: colors.accent, color: accentBtnText }}
                  >
                    <span>Siguiente: Fecha</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 3: SELECCIONAR FECHA ── */}
            {bookingStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black" style={{ fontFamily: fontConfig.headingFont }}>
                    3. Selecciona la fecha
                  </h3>
                  <button 
                    onClick={() => setBookingStep(2)} 
                    className="text-xs font-bold opacity-60 hover:opacity-100 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Volver
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {nextDays.map(d => {
                    const isSelected = selectedDate === d.full
                    return (
                      <button
                        key={d.full}
                        onClick={() => setSelectedDate(d.full)}
                        className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          isSelected ? 'shadow-md scale-[1.03]' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? colors.accent : colors.border,
                          backgroundColor: isSelected ? colors.badgeBg : colors.bg,
                        }}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider block opacity-60">{d.dayName}</span>
                        <span className="text-xl font-black block my-0.5">{d.dayNum}</span>
                        <span className="text-[10px] uppercase font-bold opacity-60 block">{d.month}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
                  <button
                    onClick={() => setBookingStep(2)}
                    className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={() => setBookingStep(4)}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    style={{ backgroundColor: colors.accent, color: accentBtnText }}
                  >
                    <span>Ver Horarios Disponibles</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 4: SELECCIONAR HORA ── */}
            {bookingStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black" style={{ fontFamily: fontConfig.headingFont }}>
                      4. Selecciona la hora
                    </h3>
                    <span className="text-xs opacity-60 font-bold block mt-0.5">
                      Fecha: {selectedDate} • {selectedBarber ? selectedBarber.name : 'Cualquier barbero disponible'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setBookingStep(3)} 
                    className="text-xs font-bold opacity-60 hover:opacity-100 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Cambiar fecha
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">Consultando disponibilidad en tiempo real...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed rounded-2xl p-6" style={{ borderColor: colors.border }}>
                    <Clock className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <h4 className="font-bold text-sm mb-1">No hay horarios disponibles para esta fecha</h4>
                    <p className="text-xs opacity-60 max-w-sm mx-auto mb-4">Intenta seleccionando otro día o prueba con otro barbero.</p>
                    <button
                      onClick={() => setBookingStep(3)}
                      className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border cursor-pointer"
                      style={{ borderColor: colors.border }}
                    >
                      Elegir otra fecha
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-1">
                    {availableSlots.map(slot => {
                      const isSelected = selectedSlot === slot.time
                      return (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-3 px-2 rounded-xl border-2 text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                            isSelected ? 'scale-105 shadow-md font-black' : 'opacity-75 hover:opacity-100'
                          }`}
                          style={{
                            borderColor: isSelected ? colors.accent : colors.border,
                            backgroundColor: isSelected ? colors.accent : colors.bg,
                            color: isSelected ? accentBtnText : colors.textPrimary,
                          }}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
                  <button
                    onClick={() => setBookingStep(3)}
                    className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    disabled={!selectedSlot}
                    onClick={() => setBookingStep(5)}
                    className={`flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                      !selectedSlot ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105 active:scale-95'
                    }`}
                    style={
                      !selectedSlot
                        ? {
                            backgroundColor: isLightMode ? '#e2e8f0' : '#27272a',
                            color: isLightMode ? '#64748b' : '#94a3b8',
                          }
                        : {
                            backgroundColor: colors.accent,
                            color: accentBtnText,
                          }
                    }
                  >
                    <span>Continuar a Confirmar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 5: CONFIRMAR RESERVA (O ESTADO EXITOSO) ── */}
            {bookingStep === 5 && (
              <div>
                {bookingSuccess ? (
                  /* Confirmación Exitosa */
                  <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
                        ¡RESERVA CONFIRMADA CON ÉXITO!
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: fontConfig.headingFont }}>
                        Te esperamos en {data.name}
                      </h3>
                    </div>

                    {/* Resumen del ticket */}
                    <div className="max-w-md mx-auto p-5 rounded-2xl border text-left space-y-3 font-medium text-xs" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                      <div className="flex justify-between pb-2 border-b" style={{ borderColor: `${colors.border}60` }}>
                        <span className="opacity-50">Código de Reserva:</span>
                        <span className="font-mono font-black text-sm" style={{ color: colors.accent }}>
                          {bookingSuccess.reservationCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-50">Servicio(s):</span>
                        <span className="font-bold text-right">{selectedServices.map(s => s.name).join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-50">Barbero:</span>
                        <span className="font-bold">{bookingSuccess.barber?.name || selectedBarber?.name || 'Asignado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-50">Fecha y Hora:</span>
                        <span className="font-bold text-amber-400">{selectedDate} a las {selectedSlot}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-black text-sm" style={{ borderColor: `${colors.border}60` }}>
                        <span>Total:</span>
                        <span style={{ color: colors.accent }}>
                          {formatCOP(totalAccumulatedPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      {whatsappUrl && (
                        <a
                          href={`${whatsappUrl}&text=Hola!%20Acabo%20de%20agendar%20mi%20cita%20con%20código%20${bookingSuccess.reservationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold bg-[#25d366] text-white shadow-md hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
                        >
                          <WhatsAppIcon />
                          <span>Avisar por WhatsApp</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setBookingSuccess(null)
                          setBookingStep(1)
                          setSelectedServices([])
                          setSelectedSlot(null)
                        }}
                        className="px-5 py-3 rounded-full text-xs font-bold border transition-all hover:opacity-100 opacity-70 w-full sm:w-auto cursor-pointer"
                        style={{ borderColor: colors.border }}
                      >
                        Agendar otra cita
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulario de Datos del Cliente */
                  <form onSubmit={handleCreateAppointment} className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black" style={{ fontFamily: fontConfig.headingFont }}>
                        5. Confirma tus datos
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setBookingStep(4)} 
                        className="text-xs font-bold opacity-60 hover:opacity-100 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Cambiar hora
                      </button>
                    </div>

                    {/* Ticket Summary Card */}
                    <div className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                      <div>
                        <span className="opacity-50 block text-[10px] uppercase font-bold">Servicios</span>
                        <span className="font-bold">{selectedServices.map(s => s.name).join(', ')}</span>
                      </div>
                      <div>
                        <span className="opacity-50 block text-[10px] uppercase font-bold">Fecha & Hora</span>
                        <span className="font-bold text-amber-400">{selectedDate} — {selectedSlot}</span>
                      </div>
                      <div>
                        <span className="opacity-50 block text-[10px] uppercase font-bold">Total</span>
                        <span className="font-black text-sm" style={{ color: colors.accent }}>
                          {formatCOP(totalAccumulatedPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-1.5">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={e => setClientName(e.target.value)}
                          placeholder="Tu nombre y apellido"
                          className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:border-amber-400 transition-colors"
                          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-1.5">
                          Número de WhatsApp / Teléfono *
                        </label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={e => setClientPhone(e.target.value)}
                          placeholder="Ej: +57 300 123 4567"
                          className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:border-amber-400 transition-colors"
                          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
                      <button
                        type="button"
                        onClick={() => setBookingStep(4)}
                        className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        disabled={submittingBooking}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: colors.accent, color: accentBtnText }}
                      >
                        {submittingBooking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirmando Cita...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" strokeWidth={3} />
                            <span>Confirmar Reserva</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER DE AGENCIA PROFESIONAL
      ══════════════════════════════════════════════════════════ */}
      <footer 
        className="pt-16 pb-12 px-5 border-t mt-auto text-left"
        style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Columna 1: Marca & Identidad */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {data.logo ? (
                  <div 
                    className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center p-1 bg-black/40 border shrink-0 shadow-md"
                    style={{ borderColor: `${colors.accent}60`, boxShadow: `0 2px 10px ${colors.accent}25` }}
                  >
                    <img 
                      src={data.logo} 
                      alt={data.name} 
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-md shrink-0 border"
                    style={{ backgroundColor: colors.accent, color: '#000000', borderColor: colors.accent }}
                  >
                    <Scissors className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-lg tracking-tight leading-tight" style={{ fontFamily: fontConfig.headingFont }}>
                    {data.name}
                  </h3>
                  <span className="text-[10px] uppercase font-black tracking-widest block opacity-60">
                    Barbería Oficial
                  </span>
                </div>
              </div>

              <p className="text-xs opacity-70 leading-relaxed font-normal">
                {pageConfig.heroSubtitle || data.description || 'Experiencia exclusiva de barbería y estilismo. Cortes de precisión, perfilado de barba y atención de primer nivel.'}
              </p>

              {/* Redes Sociales */}
              <div className="flex items-center gap-2 pt-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105"
                    style={{ borderColor: `${colors.accent}40`, backgroundColor: `${colors.accent}15`, color: colors.accent }}
                    title="WhatsApp Oficial"
                  >
                    <WhatsAppIcon />
                  </a>
                )}
                {pageConfig.instagram && (
                  <a
                    href={buildSocialUrl('instagram', pageConfig.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105 opacity-80 hover:opacity-100"
                    style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}
                    title="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}
              </div>
            </div>

            {/* Columna 2: Navegación Rápida */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: colors.accent }}>
                Navegación
              </h4>
              <ul className="space-y-2.5 text-xs font-medium opacity-80">
                {data.services && data.services.length > 0 && (
                  <li>
                    <a href="#servicios" className="hover:opacity-100 transition-opacity hover:underline">
                      Catálogo de Servicios
                    </a>
                  </li>
                )}
                {data.barbers && data.barbers.length > 0 && (
                  <li>
                    <a href="#equipo" className="hover:opacity-100 transition-opacity hover:underline">
                      Equipo de Barberos
                    </a>
                  </li>
                )}
                <li>
                  <a href="#horarios" className="hover:opacity-100 transition-opacity hover:underline">
                    Horarios de Atención
                  </a>
                </li>
                <li>
                  <a href="#galeria" className="hover:opacity-100 transition-opacity hover:underline">
                    Galería de Trabajos
                  </a>
                </li>
                <li>
                  <a href="#ubicacion" className="hover:opacity-100 transition-opacity hover:underline">
                    Ubicación en el Mapa
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 3: Horarios & Contacto */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: colors.accent }}>
                Atención & Contacto
              </h4>
              <div className="space-y-3 text-xs opacity-80">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.accent }} />
                  <div>
                    <span className="font-bold block">
                      Hoy: {isTodayOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                    <span className="text-[11px] opacity-70">
                      {isTodayOpen ? formatDayHours(todayScheduleItem).text : (todayScheduleItem?.customMessage || 'Día de descanso')}
                    </span>
                  </div>
                </div>

                {data.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.accent }} />
                    <span className="leading-snug">{data.address}</span>
                  </div>
                )}

                {data.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                    <a href={`tel:${data.phone}`} className="hover:underline font-bold">
                      {data.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 4: Políticas & Confianza */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: colors.accent }}>
                Políticas & Seguridad
              </h4>
              <p className="text-xs opacity-70 leading-relaxed font-normal">
                Garantizamos tu turno reservado de forma transparente y segura. Consulta nuestras políticas oficiales antes de tu visita.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="text-left text-xs font-bold transition-opacity hover:opacity-100 opacity-80 flex items-center gap-2 cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={{ color: colors.accent }} />
                  <span>Términos del Servicio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="text-left text-xs font-bold transition-opacity hover:opacity-100 opacity-80 flex items-center gap-2 cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={{ color: colors.accent }} />
                  <span>Política de Privacidad</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-footer Bottom Bar */}
          <div 
            className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-60"
            style={{ borderColor: colors.border }}
          >
            <p>© {new Date().getFullYear()} {data.name}. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => setLegalModal('terms')}
                className="hover:opacity-100 transition-opacity cursor-pointer"
              >
                Términos
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => setLegalModal('privacy')}
                className="hover:opacity-100 transition-opacity cursor-pointer"
              >
                Privacidad
              </button>
              <span>•</span>
              <p>
                Tecnología oficial impulsada por <span className="font-black text-white">BarberOS</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          MODAL DE TÉRMINOS & POLÍTICA DE PRIVACIDAD
      ══════════════════════════════════════════════════════════ */}
      {legalModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setLegalModal(null)}
        >
          <div 
            className="w-full max-w-2xl max-h-[85vh] rounded-3xl border overflow-hidden flex flex-col shadow-2xl relative animate-scaleUp"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: `${colors.accent}15`, borderColor: `${colors.accent}40`, color: colors.accent }}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight" style={{ fontFamily: fontConfig.headingFont }}>
                    {legalModal === 'terms' ? 'Términos y Condiciones del Servicio' : 'Política de Privacidad & Protección de Datos'}
                  </h3>
                  <p className="text-xs opacity-60 font-medium">
                    {data.name} • Actualizado para la vigencia actual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-2 rounded-xl border opacity-70 hover:opacity-100 transition-all cursor-pointer"
                style={{ borderColor: colors.border }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pestañas rápidas */}
            <div className="px-6 pt-3 pb-1 border-b flex gap-2 shrink-0 text-xs font-bold" style={{ borderColor: colors.border }}>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  legalModal === 'terms' ? 'border shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: legalModal === 'terms' ? `${colors.accent}20` : 'transparent',
                  borderColor: legalModal === 'terms' ? colors.accent : 'transparent',
                  color: legalModal === 'terms' ? colors.accent : colors.textPrimary
                }}
              >
                Términos del Servicio
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  legalModal === 'privacy' ? 'border shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: legalModal === 'privacy' ? `${colors.accent}20` : 'transparent',
                  borderColor: legalModal === 'privacy' ? colors.accent : 'transparent',
                  color: legalModal === 'privacy' ? colors.accent : colors.textPrimary
                }}
              >
                Política de Privacidad
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs opacity-90 leading-relaxed font-normal">
              {legalModal === 'terms' ? (
                <>
                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      1. Agendamiento y Confirmación de Citas
                    </h5>
                    <p>
                      Al solicitar una cita en <strong>{data.name}</strong> a través de nuestra plataforma web o canal de WhatsApp oficial, el cliente reserva un espacio de tiempo específico con el profesional elegido. La cita queda registrada de forma automática en nuestro sistema de agenda en tiempo real.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      2. Puntualidad y Tolerancia
                    </h5>
                    <p>
                      Agradecemos presentarse con 5 minutos de anticipación. Contamos con una tolerancia máxima de <strong>10 minutos</strong>. Pasado este tiempo, para respetar el tiempo de los demás clientes agendados, el turno podrá ser reprogramado o cancelado según la disponibilidad del establecimiento.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      3. Cancelaciones y Reagendamientos
                    </h5>
                    <p>
                      Si necesitas reprogramar o cancelar tu cita, te solicitamos notificar con al menos <strong>1 hora de anticipación</strong> a través de nuestro enlace de gestión o canal de WhatsApp oficial, permitiendo que otro cliente pueda aprovechar dicho espacio.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      4. Precios y Formas de Pago
                    </h5>
                    <p>
                      Los precios exhibidos en nuestro catálogo son oficiales y están expresados en moneda de curso legal. El pago del servicio se efectúa directamente en el establecimiento al finalizar la atención, salvo promociones con reserva prepagada explícitamente acordadas.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      1. Responsable del Tratamiento de Datos
                    </h5>
                    <p>
                      El responsable de la custodia y tratamiento de tus datos personales es <strong>{data.name}</strong>, operando bajo la plataforma de agendamiento tecnológico <strong>BarberOS</strong>, en estricto cumplimiento de las normativas de protección de datos personales (Habeas Data).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      2. Finalidad de los Datos Recolectados
                    </h5>
                    <p>
                      Los datos solicitados al momento de reservar (nombre completo y número de teléfono/WhatsApp) se emplean <strong>exclusivamente</strong> para:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 pt-1 opacity-85">
                      <li>Confirmación y envío de recordatorios de tu cita.</li>
                      <li>Notificaciones en caso de reprogramaciones o imprevistos de horario.</li>
                      <li>Historial de visitas para personalizar tus preferencias de corte y estilo.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      3. Confidencialidad y No Transferencia
                    </h5>
                    <p>
                      No vendemos, cedemos ni compartimos tu información personal con terceros bajo ningún concepto publicitario ni comercial. Tu información permanece protegida mediante conexiones seguras cifradas.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      4. Derechos del Titular (ARCO)
                    </h5>
                    <p>
                      En cualquier momento puedes solicitar la actualización, rectificación o eliminación definitiva de tus datos de nuestro sistema poniéndote en contacto directo con la administración de <strong>{data.name}</strong> a través de nuestros canales oficiales de contacto.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t flex justify-end shrink-0" style={{ borderColor: colors.border }}>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: colors.accent, color: '#000000' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
