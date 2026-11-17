'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
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
import { extractMotionConfigFromPage } from '@/lib/motion-presets'
import BarberPoleLoader from '@/components/public/BarberPoleLoader'
import CinematicHero from '@/components/public/CinematicHero'
import { NarrativeSection, CinematicStatementBand } from '@/components/public/NarrativeSection'
import {
  EditorialServicesShowcase,
  EditorialBarbersShowcase,
  ImmersiveGalleryShowcase,
} from '@/components/public/ImmersiveCatalog'
import { CinematicBookingWidget } from '@/components/public/CinematicBookingWidget'
import { BANNER_PRESETS, DEFAULT_HERO_BANNER, resolveCoverBannerUrl } from '@/components/public/BannerPresets'
import {
  GalleryItem,
  GalleryServiceRef,
  GALLERY_MAX_PER_CATEGORY,
  getCategoryLabel,
  getLinkedService,
  getUsedCategories,
  normalizeGalleryCategory,
  resolveGalleryTitle,
  sortGallery,
} from '@/lib/gallery'
import { DayScheduleItem, DEFAULT_SCHEDULE, parseSchedule, formatDayHours, formatTime12h } from '@/lib/schedule'
import { buildSocialUrl } from '@/lib/socials'
import { parseLocation } from '@/lib/maps'

/* ── Brand Social Icons ── */
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

const DEFAULT_BANNER = DEFAULT_HERO_BANNER

/** Reseñas de demostración que versiones anteriores del constructor insertaban automáticamente. */
const LEGACY_DEMO_TESTIMONIAL_COMMENTS = new Set([
  'El mejor fade que me han hecho en años. La atención, la puntualidad y el ambiente superan cualquier expectativa.',
  'Excelente experiencia de principio a fin. El ritual de toalla caliente para la barba es de otro nivel.',
  'Puntuales, pulcros y los barberos realmente dominan las técnicas modernas. 100% recomendado.',
])

/** Día de la semana según la hora de Colombia (no la del dispositivo del visitante). */
function getBusinessTodayIndex(timeZone = 'America/Bogota'): number {
  try {
    const wd = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone }).format(new Date())
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd)
  } catch {
    return new Date().getDay()
  }
}



export default function PublicBusinessPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [colorMode, setColorMode] = useState<'dark' | 'light' | 'system'>('dark')
  const [activeGalleryCat, setActiveGalleryCat] = useState<string>('todos')
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Cargar preferencia del visitante o aplicar modo predeterminado del negocio
  useEffect(() => {
    if (typeof window === 'undefined' || !slug) return
    try {
      const saved = localStorage.getItem(`b_${slug}_theme`)
      if (saved === 'dark' || saved === 'light') {
        setColorMode(saved)
        return
      }
    } catch {}
    if (data?.page?.defaultColorMode === 'light' || data?.page?.defaultColorMode === 'dark') {
      setColorMode(data.page.defaultColorMode)
    }
  }, [slug, data?.page?.defaultColorMode])

  const toggleTheme = () => {
    const next = colorMode === 'dark' ? 'light' : 'dark'
    setColorMode(next)
    if (typeof window !== 'undefined' && slug) {
      try {
        localStorage.setItem(`b_${slug}_theme`, next)
      } catch {}
    }
  }

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
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'cancelacion' | 'anticipos' | 'datos' | null>(null)

  const [navScrolled, setNavScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const reserveRef = useRef<HTMLDivElement>(null)

  const todayIndex = getBusinessTodayIndex()

  useEffect(() => {
    if (!slug) return
    const fetchBusiness = async () => {
      try {
        const res = await fetch(`/api/public/b/${slug}`, { cache: 'no-store' })
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

    // ── Sincronización entre pestañas (BroadcastChannel) ──
    let channel: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('barberos_catalog_sync')
        channel.onmessage = (event) => {
          if (event.data?.type === 'CATALOG_UPDATED') {
            fetchBusiness()
          }
        }
      } catch {
        // Fallback silencioso
      }
    }

    // ── Revalidación al volver a la pestaña (Visibility & Focus) ──
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchBusiness()
      }
    }
    window.addEventListener('focus', handleVisibility)
    document.addEventListener('visibilitychange', handleVisibility)

    // ── Sondeo suave en segundo plano (cada 45s solo si la pestaña está visible) ──
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchBusiness()
      }
    }, 45000)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('focus', handleVisibility)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [slug])

  // ── Sincronización en tiempo real con el Editor Web mediante postMessage ──
  useEffect(() => {
    // Avisar al editor padre que el iframe está montado y listo
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_IFRAME_READY' }, '*')
    }

    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_STATE_UPDATE') {
        const {
          config,
          logo,
          businessName,
          address,
          phone,
          description,
          email,
          mapsUrl,
          previewColorMode,
        } = event.data
        if (
          config ||
          logo !== undefined ||
          businessName !== undefined ||
          address !== undefined ||
          phone !== undefined ||
          description !== undefined ||
          email !== undefined ||
          mapsUrl !== undefined
        ) {
          setData((prev: any) => {
            if (!prev) return prev
            return {
              ...prev,
              name: businessName !== undefined && businessName.trim() ? businessName : prev.name,
              address: address !== undefined ? address : prev.address,
              phone: phone !== undefined ? phone : prev.phone,
              description: description !== undefined ? description : prev.description,
              email: email !== undefined ? email : prev.email,
              mapsUrl: mapsUrl !== undefined ? mapsUrl : prev.mapsUrl,
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

  // Scroll listener — nav se vuelve sólido al salir del hero y detecta la sección activa
  useEffect(() => {
    const sectionIds = ['servicios', 'equipo', 'galeria', 'horarios', 'ubicacion']
    const onScroll = () => {
      const scrollY = window.scrollY
      setNavScrolled(scrollY > 60)

      if (scrollY < 320) {
        setActiveSection('')
        return
      }

      const viewportTrigger = scrollY + 240
      let current = ''
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          const top = rect.top + scrollY
          const height = rect.height
          if (viewportTrigger >= top && viewportTrigger < top + height) {
            current = id
            break
          }
        }
      }
      setActiveSection(current)
    }

    onScroll()
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
        serviceIds: selectedServices.map((s) => s.id),
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
    notFound()
  }

  // ── Theme, Font & Motion Configuration ──
  const rawPageConfig = data.page || {}
  const motionConfig = extractMotionConfigFromPage(rawPageConfig)
  const pageConfig = { ...rawPageConfig, ...motionConfig }
  const theme: VisualTheme = getTheme(pageConfig.theme || 'ELEGANTE')
  const fontConfig = getFont(pageConfig.fontFamily || 'inter')
  const colors: ThemeColors = getEffectiveColors(theme, colorMode)
  const isLightMode = colorMode === 'light'
  const accentBtnText = getAccentContrast(colors.accent, colors.accentContrast)

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Social & Visibility Links (Fase 2)
  const showWhatsapp = pageConfig.showWhatsapp !== false && Boolean(pageConfig.whatsapp && pageConfig.whatsapp.trim())
  const showPhone = pageConfig.showPhone !== false && Boolean(data.phone && data.phone.trim())
  const showEmail = pageConfig.showEmail !== false && Boolean(data.email && data.email.trim())
  const showInstagram = pageConfig.showInstagram !== false && Boolean(pageConfig.instagram && pageConfig.instagram.trim())
  const showFacebook = pageConfig.showFacebook !== false && Boolean(pageConfig.facebook && pageConfig.facebook.trim())
  const showTiktok = pageConfig.showTiktok !== false && Boolean(pageConfig.tiktok && pageConfig.tiktok.trim())

  const rawWhatsapp = (pageConfig.whatsapp || '').trim()
  const whatsappUrl = (showWhatsapp && rawWhatsapp) ? buildSocialUrl('whatsapp', rawWhatsapp) : ''
  const instagramUrl = (showInstagram && pageConfig.instagram) ? buildSocialUrl('instagram', pageConfig.instagram) : ''
  const facebookUrl = (showFacebook && pageConfig.facebook) ? buildSocialUrl('facebook', pageConfig.facebook) : ''
  const tiktokUrl = (showTiktok && pageConfig.tiktok) ? buildSocialUrl('tiktok', pageConfig.tiktok) : ''

  // ── Galería: únicamente fotografías reales subidas por el negocio ──
  // Sin fotos de stock ni etiquetas inventadas. Si no hay fotos, la sección se oculta.
  const galleryServices: GalleryServiceRef[] = Array.isArray(data.services)
    ? data.services.map((s: any) => ({ id: s.id, name: s.name }))
    : []
  const customGallery: GalleryItem[] = Array.isArray(pageConfig.gallery)
    ? sortGallery(
      (pageConfig.gallery as any[]).filter((i) => i && typeof i.url === 'string' && i.url.trim())
    )
    : []
  const hasCustomGallery = customGallery.length > 0
  const galleryCategories = getUsedCategories(customGallery)
  const effectiveGalleryCat =
    activeGalleryCat !== 'todos' && galleryCategories.some((c) => c.key === activeGalleryCat)
      ? activeGalleryCat
      : 'todos'

  const filteredGallery = (() => {
    const byCat = (key: string) =>
      customGallery
        .filter((i) => normalizeGalleryCategory(i.category) === key)
        .slice(0, GALLERY_MAX_PER_CATEGORY)
    if (effectiveGalleryCat === 'todos') {
      const allowed = new Set(galleryCategories.flatMap((c) => byCat(c.key).map((i) => i.id)))
      return customGallery.filter((i) => allowed.has(i.id))
    }
    return byCat(effectiveGalleryCat)
  })().map((item) => ({
    ...item,
    displayTitle: resolveGalleryTitle(item, galleryServices),
    displayCategory: getCategoryLabel(normalizeGalleryCategory(item.category), customGallery),
    linkedService: getLinkedService(item, galleryServices)
      ? data.services.find((s: any) => s.id === item.serviceId)
      : null,
  }))

  // ── Testimonios: solo reseñas agregadas por el negocio (se excluyen las de demostración) ──
  const testimonialItems: any[] = Array.isArray(pageConfig.testimonials)
    ? pageConfig.testimonials.filter(
      (t: any) =>
        t &&
        typeof t.comment === 'string' &&
        t.comment.trim() &&
        !LEGACY_DEMO_TESTIMONIAL_COMMENTS.has(t.comment.trim())
    )
    : []
  const testimonialAverage =
    testimonialItems.length > 0
      ? testimonialItems.reduce((acc, t) => acc + (Number(t.rating) || 5), 0) / testimonialItems.length
      : 0

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
  const locationInfo = parseLocation(data.mapsUrl || data.address, data.name, data.address)

  return (
    <div
      className="min-h-screen w-full flex flex-col transition-colors duration-300 antialiased overflow-x-clip"
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
          1. HEADER / NAVBAR FLOTANTE (Adaptativo a Modo Claro y Oscuro con Contraste Garantizado)
      ════════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: navScrolled
            ? (isLightMode ? 'rgba(255, 255, 255, 0.96)' : `${colors.bg}f0`)
            : 'transparent',
          backdropFilter: navScrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: navScrolled ? 'blur(16px)' : 'none',
          borderBottom: navScrolled
            ? (isLightMode ? '1px solid rgba(0, 0, 0, 0.08)' : `1px solid ${colors.border}`)
            : 'none',
          boxShadow: navScrolled
            ? (isLightMode ? '0 4px 20px rgba(0, 0, 0, 0.06)' : '0 4px 30px rgba(0, 0, 0, 0.4)')
            : 'none',
        }}
      >
        <style>{`
          .barberos-nav-link {
            position: relative;
            padding: 0.375rem 0;
            transition: color 180ms ease;
          }
          .barberos-nav-indicator {
            pointer-events: none;
            position: absolute;
            left: 0;
            right: 0;
            bottom: -2px;
            height: 2px;
            border-radius: 9999px;
            transform: scaleX(0);
            transform-origin: left center;
            transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
          }
          .barberos-nav-link:hover .barberos-nav-indicator,
          .barberos-nav-link.is-active .barberos-nav-indicator {
            transform: scaleX(1);
          }
          .barberos-nav-btn {
            transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1), filter 180ms ease, background-color 180ms ease, border-color 180ms ease;
          }
          .barberos-nav-btn:hover {
            transform: translateY(-1.5px);
          }
          .barberos-nav-btn:active {
            transform: scale(0.97);
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Identidad de Marca (Logo + Nombre comercial alineados ópticamente) */}
          <a
            href="#"
            className="group flex items-center gap-2 sm:gap-3 min-w-0 focus:outline-none"
          >
            {data.logo ? (
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 bg-black"
                style={{
                  border: `1.5px solid ${colors.accent}55`,
                  boxShadow: `0 2px 10px ${colors.accent}20`,
                }}
              >
                <img
                  src={data.logo}
                  alt={data.name}
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black shadow-sm shrink-0 border transition-transform duration-200"
                style={{ backgroundColor: colors.accent, color: accentBtnText, borderColor: colors.accent }}
              >
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <span
              className={`tracking-tight leading-none truncate transition-all duration-200 ${
                navScrolled
                  ? (isLightMode ? 'text-zinc-950 font-black text-sm sm:text-base' : 'text-white font-black text-sm sm:text-base')
                  : 'text-white/80 hover:text-white font-semibold text-xs sm:text-sm drop-shadow-xs'
              }`}
              style={{
                fontFamily: fontConfig.headingFont,
              }}
            >
              {data.name}
            </span>
          </a>

          {/* Enlaces de Navegación Desktop con Indicador Animado de Hover y Estado Activo */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center text-xs font-bold uppercase tracking-wider transition-colors"
            style={{
              gap: '28px',
              color: navScrolled && isLightMode ? '#27272a' : 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {[
              ...(data.services && data.services.length > 0 ? [{ id: 'servicios', label: 'Servicios' }] : []),
              ...(data.barbers && data.barbers.length > 0 ? [{ id: 'equipo', label: 'Equipo' }] : []),
              ...(hasCustomGallery ? [{ id: 'galeria', label: 'Galería' }] : []),
              { id: 'horarios', label: 'Horarios' },
              { id: 'ubicacion', label: 'Ubicación' },
            ].map((item) => {
              const isActive = activeSection === item.id
              const linkColor = isActive
                ? (navScrolled && isLightMode ? '#09090b' : '#ffffff')
                : (navScrolled && isLightMode ? '#3f3f46' : 'rgba(255, 255, 255, 0.82)')
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`barberos-nav-link ${isActive ? 'is-active' : ''}`}
                  style={{ color: linkColor }}
                >
                  <span>{item.label}</span>
                  <span
                    className="barberos-nav-indicator"
                    style={{ backgroundColor: colors.accent }}
                  />
                </a>
              )
            })}
          </nav>

          {/* Acciones del Navbar (Tema, WhatsApp y Reservar — Sin Competir con el Hero) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Color Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`barberos-nav-btn p-2 sm:p-2.5 rounded-full border cursor-pointer flex items-center justify-center transition-all ${
                navScrolled && isLightMode
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:bg-zinc-200 shadow-xs'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 text-white backdrop-blur-md'
              }`}
              title={colorMode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Cambiar tema"
            >
              {colorMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className={`w-4 h-4 ${navScrolled && isLightMode ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-200 fill-zinc-200'}`} />
              )}
            </button>

            {/* WhatsApp en Navbar: Se muestra solo al hacer scroll para no competir con el Hero */}
            {whatsappUrl && navScrolled && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="barberos-nav-btn hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  backgroundColor: isLightMode ? 'rgba(24, 24, 27, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                  border: isLightMode ? '1px solid rgba(24, 24, 27, 0.14)' : '1px solid rgba(255, 255, 255, 0.18)',
                  color: isLightMode ? '#18181b' : '#ffffff',
                }}
              >
                <span className="text-[#25D366] flex items-center">
                  <WhatsAppIcon />
                </span>
                <span>WhatsApp</span>
              </a>
            )}

            {/* Primary CTA (Reservar): Etereo/discreto en el Hero, Prominente y Sólido al hacer Scroll */}
            <button
              onClick={() => scrollToBooking()}
              className="barberos-nav-btn flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0 transition-all duration-200"
              style={
                navScrolled
                  ? {
                      backgroundColor: colors.accent,
                      color: accentBtnText,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                    }
                  : {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      backdropFilter: 'blur(8px)',
                    }
              }
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Reservar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          2. HERO CINEMATOGRÁFICO MULTICAPA (MOTION SITES ARCHITECTURE)
      ══════════════════════════════════════════════════════════ */}
      <CinematicHero
        businessName={data.name}
        coverTitle={null}
        coverSubtitle={null}
        slogan={pageConfig.slogan}
        businessDescription={data.description}
        bannerUrl={resolveCoverBannerUrl(pageConfig.bannerUrl || DEFAULT_BANNER)}
        address={data.address}
        isTodayOpen={isTodayOpen}
        todayHoursText={isTodayOpen && todayScheduleItem ? formatDayHours(todayScheduleItem).text : null}
        closedCustomMessage={todayScheduleItem?.customMessage}
        whatsappUrl={showWhatsapp && whatsappUrl ? whatsappUrl : null}
        servicesCount={data.services?.length || 0}
        barbersCount={data.barbers?.length || 0}
        themeId={pageConfig.theme}
        motionStyle={pageConfig.motionStyle}
        colorMode={colorMode}
        colors={colors}
        accentBtnText={accentBtnText}
        headingFont={fontConfig.headingFont}
        bodyFont={fontConfig.bodyFont}
        enableScrollSequence={Boolean(pageConfig.enableScrollSequence)}
        sequencePattern={pageConfig.sequencePattern}
        sequenceFrameCount={pageConfig.sequenceFrameCount}
        onBookClick={() => scrollToBooking()}
        onExploreServicesClick={
          data.services && data.services.length > 0
            ? () => {
              const el = document.getElementById('servicios')
              el?.scrollIntoView({ behavior: 'smooth' })
            }
            : undefined
        }
      />

      {/* ══════════════════════════════════════════════════════════
          3. SERVICIOS DESTACADOS (MULTI-SELECCIÓN) — CAPÍTULO 01
      ══════════════════════════════════════════════════════════ */}
      {data.services && data.services.length > 0 && (
        <NarrativeSection
          id="servicios"
          chapterNumber="01"
          eyebrow="SERVICIOS"
          title="Nuestros Servicios"
          subtitle="Elige uno o varios servicios y combínalos en una misma cita."
          watermark="SERVICIOS"
          variant="editorial-frame"
          headerAlign="left"
          themeId={pageConfig.theme}
          motionStyle={pageConfig.motionStyle}
          colorMode={colorMode}
          colors={colors}
          headingFont={fontConfig.headingFont}
          backgroundColor={colors.surface}
          headerSlot={
            selectedServices.length > 0 ? (
              <div
                className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border shadow-sm"
                style={{
                  borderColor: colors.accent,
                  backgroundColor: `${colors.accent}15`,
                  color: colors.textPrimary,
                }}
              >
                <span className="text-xs font-black uppercase tracking-wider">
                  {selectedServices.length} {selectedServices.length === 1 ? 'servicio elegido' : 'servicios elegidos'}
                </span>
                <button
                  onClick={() => scrollToBooking()}
                  className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: colors.accent, color: accentBtnText }}
                >
                  Continuar →
                </button>
              </div>
            ) : null
          }
        >
          <EditorialServicesShowcase
            services={data.services}
            selectedServices={selectedServices}
            showPrices={pageConfig.showPrices !== false}
            colors={colors}
            accentBtnText={accentBtnText}
            headingFont={fontConfig.headingFont}
            colorMode={colorMode}
            formatCOP={formatCOP}
            onToggleService={toggleService}
            onBookSingleService={(service) => scrollToBooking(service)}
          />
        </NarrativeSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          4. EQUIPO DE BARBEROS — CAPÍTULO 02
      ══════════════════════════════════════════════════════════ */}
      {data.barbers && data.barbers.length > 0 && pageConfig.showTeam !== false && (
        <NarrativeSection
          id="equipo"
          chapterNumber="02"
          eyebrow="EQUIPO"
          title={data.barbers.length === 1 ? 'Tu barbero' : 'Nuestro equipo'}
          subtitle={data.barbers.length === 1 ? 'Agenda directamente tu cita.' : 'Elige con quién quieres agendar tu cita.'}
          watermark="EQUIPO"
          variant="clip-reveal"
          headerAlign="left"
          themeId={pageConfig.theme}
          motionStyle={pageConfig.motionStyle}
          colorMode={colorMode}
          colors={colors}
          headingFont={fontConfig.headingFont}
          backgroundColor={colors.bg}
        >
          <EditorialBarbersShowcase
            barbers={data.barbers}
            colors={colors}
            accentBtnText={accentBtnText}
            headingFont={fontConfig.headingFont}
            onSelectBarber={(barber) => scrollToBooking(undefined, barber)}
          />
        </NarrativeSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          INTERLUDIO NARRATIVO CINEMÁTICO (STATEMENT BAND)
          Solo datos reales: nombre del negocio, servicios registrados y eslogan (si existe).
      ══════════════════════════════════════════════════════════ */}
      <CinematicStatementBand
        primaryText={data.name}
        secondaryText={
          Array.isArray(data.services) && data.services.length > 0
            ? data.services.slice(0, 4).map((s: any) => s.name).join(' • ')
            : ''
        }
        imageUrl={customGallery[0]?.url || pageConfig.bannerUrl || DEFAULT_BANNER}
        caption={(pageConfig.slogan || '').trim()}
        themeId={pageConfig.theme}
        motionStyle={pageConfig.motionStyle}
        colorMode={colorMode}
        colors={colors}
        headingFont={fontConfig.headingFont}
        onActionClick={() => scrollToBooking()}
      />

      {/* ══════════════════════════════════════════════════════════
          5. GALERÍA DE TRABAJOS — CAPÍTULO 03 (solo fotos reales)
      ══════════════════════════════════════════════════════════ */}
      {hasCustomGallery && (
        <NarrativeSection
          id="galeria"
          chapterNumber="03"
          eyebrow="GALERÍA"
          title="Nuestra Galería"
          subtitle={`Fotografías de ${data.name}.`}
          watermark="GALERÍA"
          variant="editorial-frame"
          headerAlign="left"
          themeId={pageConfig.theme}
          motionStyle={pageConfig.motionStyle}
          colorMode={colorMode}
          colors={colors}
          headingFont={fontConfig.headingFont}
          backgroundColor={colors.surface}
          headerSlot={
            galleryCategories.length > 1 ? (
              <div
                role="tablist"
                aria-label="Categorías de la galería"
                className="inline-flex flex-wrap p-1 rounded-2xl border backdrop-blur-md"
                style={{ borderColor: colors.border, backgroundColor: colors.bg }}
              >
                {[{ key: 'todos', label: 'Todos' }, ...galleryCategories].map(tab => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={effectiveGalleryCat === tab.key}
                    onClick={() => setActiveGalleryCat(tab.key)}
                    className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${effectiveGalleryCat === tab.key ? 'shadow-sm font-black' : 'opacity-60 hover:opacity-100'
                      }`}
                    style={effectiveGalleryCat === tab.key ? { backgroundColor: colors.accent, color: accentBtnText } : { color: colors.textPrimary }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null
          }
        >
          <ImmersiveGalleryShowcase
            items={filteredGallery}
            activeCategory={effectiveGalleryCat}
            colors={colors}
            accentBtnText={accentBtnText}
            headingFont={fontConfig.headingFont}
            onBookStyle={(service) => scrollToBooking(service || undefined)}
          />
        </NarrativeSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          6. TESTIMONIOS & RESEÑAS — CAPÍTULO 04 (solo reseñas reales)
      ══════════════════════════════════════════════════════════ */}
      {testimonialItems.length > 0 && (
        <NarrativeSection
          id="testimonios"
          chapterNumber="04"
          eyebrow="OPINIONES"
          title="Lo Que Dicen Nuestros Clientes"
          subtitle="Reseñas compartidas por clientes de la barbería."
          watermark="RESEÑAS"
          variant="clip-reveal"
          headerAlign="left"
          themeId={pageConfig.theme}
          motionStyle={pageConfig.motionStyle}
          colorMode={colorMode}
          colors={colors}
          headingFont={fontConfig.headingFont}
          backgroundColor={colors.bg}
          headerSlot={
            testimonialItems.length >= 2 ? (
              <div
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border"
                style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}
              >
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-black ml-1 opacity-90" style={{ color: colors.textPrimary }}>
                  {testimonialAverage.toFixed(1)} · {testimonialItems.length} reseñas
                </span>
              </div>
            ) : null
          }
        >
          <div
            className={
              testimonialItems.length === 1
                ? 'max-w-2xl mx-auto'
                : testimonialItems.length === 2
                  ? 'max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6'
                  : 'grid grid-cols-1 md:grid-cols-3 gap-6'
            }
          >
            {testimonialItems.map((test: any, idx: number) => (
              <article
                key={test.id || idx}
                data-narrative-item
                className="p-7 sm:p-9 rounded-[28px] border flex flex-col justify-between relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 shadow-sm"
                style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
              >
                {/* Comilla tipográfica editorial de fondo */}
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-6 text-7xl font-serif leading-none select-none pointer-events-none opacity-15"
                  style={{ color: colors.accent, fontFamily: fontConfig.headingFont }}
                >
                  “
                </span>

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Number(test.rating) || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span
                      className="font-mono text-[10px] font-black uppercase tracking-[0.2em] opacity-45"
                      style={{ color: colors.textSecondary }}
                    >
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <blockquote
                    className="text-sm sm:text-base font-medium leading-relaxed mb-7"
                    style={{ color: colors.textPrimary }}
                  >
                    “{test.comment}”
                  </blockquote>
                </div>

                <footer
                  className="relative z-10 flex items-center justify-between border-t pt-4"
                  style={{ borderColor: `${colors.border}80` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0"
                      style={{ backgroundColor: colors.accent, color: accentBtnText }}
                    >
                      {test.name ? test.name.trim().charAt(0) : 'C'}
                    </div>
                    <div className="min-w-0">
                      <span
                        className="text-xs sm:text-sm font-black block truncate"
                        style={{ color: colors.textPrimary, fontFamily: fontConfig.headingFont }}
                      >
                        {test.name}
                      </span>
                      {test.date && (
                        <span
                          className="text-[10px] font-medium opacity-55 block"
                          style={{ color: colors.textSecondary }}
                        >
                          {test.date}
                        </span>
                      )}
                    </div>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </NarrativeSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          7. UBICACIÓN, CONTACTO & HORARIOS — CAPÍTULO 05 (COMPOSICIÓN EDITORIAL)
      ══════════════════════════════════════════════════════════ */}
      <NarrativeSection
        id="contacto"
        chapterNumber="05"
        eyebrow="VISÍTANOS"
        title="Horarios, Ubicación & Contacto"
        subtitle={`Información de atención y canales directos de ${data.name}.`}
        watermark="CONTACTO"
        variant="editorial-frame"
        headerAlign="left"
        themeId={pageConfig.theme}
        motionStyle={pageConfig.motionStyle}
        colorMode={colorMode}
        colors={colors}
        headingFont={fontConfig.headingFont}
        backgroundColor={colors.surface}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* ── COLUMNA IZQUIERDA (5 COLS): HORARIOS SEMANALES Y ESTADO ACTUAL ── */}
          <div
            id="horarios"
            data-narrative-item
            className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] border flex flex-col justify-between shadow-sm scroll-mt-24"
            style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
          >
            <div>
              <div className="flex items-center justify-between gap-3 pb-5 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${colors.accent}18`, color: colors.accent }}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em] block opacity-60"
                      style={{ color: colors.textSecondary }}
                    >
                      JORNADA SEMANAL
                    </span>
                    <h3
                      className="text-lg sm:text-xl font-black tracking-tight"
                      style={{ fontFamily: fontConfig.headingFont }}
                    >
                      Horarios de Atención
                    </h3>
                  </div>
                </div>

                {isTodayOpen ? (
                  <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Abierto hoy
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Cerrado hoy
                  </span>
                )}
              </div>

              <div className="divide-y my-4" style={{ borderColor: `${colors.border}60` }}>
                {effectiveSchedule.map((item: DayScheduleItem) => {
                  const isToday = item.dayIndex === todayIndex
                  return (
                    <div
                      key={item.day}
                      className={`flex items-center justify-between text-xs sm:text-sm py-3 px-2.5 rounded-xl transition-colors ${isToday ? 'font-black' : 'font-medium opacity-80'
                        }`}
                      style={{
                        color: colors.textPrimary,
                        backgroundColor: isToday ? `${colors.accent}12` : 'transparent',
                        borderColor: `${colors.border}50`,
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {isToday && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: colors.accent }}
                          />
                        )}
                        <span>{item.day}</span>
                        {isToday && (
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                          >
                            Hoy
                          </span>
                        )}
                      </span>
                      <span
                        className="font-mono text-xs"
                        style={{ color: item.isOpen ? colors.textPrimary : colors.textSecondary }}
                      >
                        {formatDayHours(item).text}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              className="pt-4 border-t flex items-center justify-between gap-3 text-xs"
              style={{ borderColor: colors.border }}
            >
              <span className="opacity-65">Reserva tu turno en línea sin esperas</span>
              <button
                type="button"
                onClick={() => scrollToBooking()}
                className="font-black uppercase tracking-wider text-[11px] inline-flex items-center gap-1 hover:underline cursor-pointer"
                style={{ color: colors.accent }}
              >
                <span>Agendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── COLUMNA DERECHA (7 COLS): UBICACIÓN, MAPA, SEDES Y CANALES DE CONTACTO ── */}
          <div
            id="ubicacion"
            data-narrative-item
            className="lg:col-span-7 flex flex-col gap-6 scroll-mt-24"
          >
            {/* Bloque Superior: Dirección Física & Mapa */}
            <div
              className="p-6 sm:p-8 rounded-[28px] border shadow-sm space-y-5 flex-1 flex flex-col justify-between"
              style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: colors.accent, color: accentBtnText }}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.2em] block opacity-60"
                        style={{ color: colors.textSecondary }}
                      >
                        SEDE & DIRECCIÓN
                      </span>
                      <h3
                        className="text-lg sm:text-xl font-black tracking-tight"
                        style={{ fontFamily: fontConfig.headingFont }}
                      >
                        {data.name}
                      </h3>
                      <p
                        className="text-xs sm:text-sm font-medium opacity-85 mt-1 leading-relaxed"
                        style={{ color: colors.textSecondary }}
                      >
                        {data.address && !data.address.startsWith('http')
                          ? data.address
                          : locationInfo?.displayText ||
                          'Contáctanos por nuestros canales directos para indicaciones de llegada.'}
                      </p>
                    </div>
                  </div>

                  {locationInfo && (
                    <a
                      href={locationInfo.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                      style={{
                        borderColor: colors.accent,
                        backgroundColor: `${colors.accent}15`,
                        color: colors.textPrimary,
                      }}
                    >
                      <Navigation className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                      <span>Cómo llegar</span>
                    </a>
                  )}
                </div>

                {/* Mapa interactivo cuando hay dirección o enlace de Google Maps */}
                {locationInfo?.embedUrl && (
                  <div
                    className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden border shadow-xs relative bg-zinc-900"
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
                )}

                {/* Sedes adicionales de la misma barbería (cuando existen) */}
                {Array.isArray(data.siblingBranches) && data.siblingBranches.length > 0 && (
                  <div
                    className="pt-4 border-t space-y-2.5"
                    style={{ borderColor: colors.border }}
                  >
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em] block opacity-70"
                      style={{ color: colors.accent }}
                    >
                      OTRAS SEDES DE ESTA BARBERÍA
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {data.siblingBranches.map((branch: any) => (
                        <Link
                          key={branch.id}
                          href={`/b/${branch.slug}`}
                          className="p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all hover:scale-[1.01]"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                          }}
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-black block truncate">
                              {branch.name}
                            </span>
                            {branch.address && !branch.address.startsWith('http') && (
                              <span className="text-[11px] opacity-65 block truncate">
                                {branch.address}
                              </span>
                            )}
                          </div>
                          <ArrowRight
                            className="w-4 h-4 shrink-0"
                            style={{ color: colors.accent }}
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bloque Inferior Integrado: Teléfono, WhatsApp y Redes Sociales */}
              <div
                className="pt-5 border-t space-y-3"
                style={{ borderColor: colors.border }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] opacity-65"
                    style={{ color: colors.textSecondary }}
                  >
                    CANALES DIRECTOS & REDES OFICIALES
                  </span>
                  {showEmail && data.email && (
                    <a
                      href={`mailto:${data.email}`}
                      className="text-xs font-semibold hover:underline opacity-80"
                    >
                      {data.email}
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {showPhone && data.phone && (
                    <a
                      href={`tel:${data.phone}`}
                      className="py-3 px-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.bg,
                        color: colors.textPrimary,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider opacity-60 block">
                            Teléfono
                          </span>
                          <span className="font-bold truncate block">{data.phone}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </a>
                  )}

                  {showWhatsapp && whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.bg,
                        color: colors.textPrimary,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#25d366] text-white flex items-center justify-center shrink-0">
                          <WhatsAppIcon />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider opacity-60 block">
                            Chat directo
                          </span>
                          <span className="font-bold truncate block">WhatsApp</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </a>
                  )}

                  {showInstagram && instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.bg,
                        color: colors.textPrimary,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#e1306c] text-white flex items-center justify-center shrink-0">
                          <InstagramIcon />
                        </div>
                        <span className="font-bold truncate">Instagram</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </a>
                  )}

                  {showFacebook && facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.bg,
                        color: colors.textPrimary,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#1877f2] text-white flex items-center justify-center shrink-0">
                          <FacebookIcon />
                        </div>
                        <span className="font-bold truncate">Facebook</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </a>
                  )}

                  {showTiktok && tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.bg,
                        color: colors.textPrimary,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shrink-0 border border-white/15">
                          <TikTokIcon />
                        </div>
                        <span className="font-bold truncate">TikTok</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </NarrativeSection>

      {/* ══════════════════════════════════════════════════════════
          8. MÓDULO DE RESERVA ONLINE INTERACTIVO (#reservar) — CAPÍTULO 06
      ══════════════════════════════════════════════════════════ */}
      <NarrativeSection
        id="reservar"
        sectionRef={reserveRef}
        chapterNumber="06"
        eyebrow="SISTEMA DE CITAS EN LÍNEA"
        title="Agenda Tu Cita"
        subtitle="Elige tus servicios, selecciona tu fecha y asegura tu lugar en tiempo real."
        watermark="RESERVAS"
        variant="clip-reveal"
        headerAlign="center"
        themeId={pageConfig.theme}
        motionStyle={pageConfig.motionStyle}
        colorMode={colorMode}
        colors={colors}
        headingFont={fontConfig.headingFont}
        backgroundColor={colors.bg}
        className="scroll-mt-10"
      >
        {data?.effectiveSubscription && data.effectiveSubscription.canUsePublicBooking === false ? (
          <div
            className="max-w-2xl mx-auto p-8 sm:p-10 rounded-3xl border text-center space-y-6 my-6 shadow-2xl backdrop-blur-md"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-inner"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: colors.textPrimary, fontFamily: fontConfig.headingFont }}>
                Atención y Reservas Directas
              </h3>
              <p className="text-sm opacity-80 max-w-md mx-auto leading-relaxed" style={{ color: colors.textSecondary }}>
                El agendamiento en línea por la web se encuentra temporalmente en pausa. Nuestro equipo te atiende con gusto de manera directa para coordinar tu turno:
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-105"
                  style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
                >
                  <WhatsAppIcon />
                  Agendar por WhatsApp
                </a>
              )}
              {data.phone && (
                <a
                  href={`tel:${data.phone}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm border transition-all hover:scale-105"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                >
                  <Phone className="w-4 h-4" />
                  Llamar: {data.phone}
                </a>
              )}
            </div>
          </div>
        ) : (
          <CinematicBookingWidget
            businessName={data.name}
            services={data.services || []}
            barbers={data.barbers || []}
            selectedServices={selectedServices}
            selectedBarber={selectedBarber}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            availableSlots={availableSlots}
            loadingSlots={loadingSlots}
            bookingStep={bookingStep}
            bookingError={bookingError}
            bookingSuccess={bookingSuccess}
            submittingBooking={submittingBooking}
            clientName={clientName}
            clientPhone={clientPhone}
            nextDays={nextDays}
            totalAccumulatedPrice={totalAccumulatedPrice}
            totalAccumulatedDuration={totalAccumulatedDuration}
            depositEnabled={data.depositEnabled}
            depositType={data.depositType}
            depositPercentage={data.depositPercentage}
            depositFixedAmount={data.depositFixedAmount}
            depositInstructions={data.depositInstructions}
            advancePaymentConfig={data.advancePaymentConfig || pageConfig.advancePaymentConfig || null}
            whatsappUrl={whatsappUrl}
            colors={colors}
            accentBtnText={accentBtnText}
            headingFont={fontConfig.headingFont}
            isLightMode={isLightMode}
            formatCOP={formatCOP}
            onSetBookingStep={(step) => setBookingStep(step)}
            onToggleService={toggleService}
            onSelectDefaultServiceIfEmpty={() => {
              if (selectedServices.length === 0 && data.services && data.services.length > 0) {
                setSelectedServices([data.services[0]])
              }
            }}
            onSelectBarber={(barber) => setSelectedBarber(barber)}
            onSelectDate={(date) => setSelectedDate(date)}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            onChangeClientName={(val) => setClientName(val)}
            onChangeClientPhone={(val) => setClientPhone(val)}
            onSubmitBooking={handleCreateAppointment}
            onResetBooking={() => {
              setBookingSuccess(null)
              setBookingStep(1)
              setSelectedServices([])
              setSelectedSlot(null)
            }}
            onScrollToBooking={() => scrollToBooking()}
          />
        )}
      </NarrativeSection>

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
                    className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-md bg-black"
                    style={{ border: `1.5px solid ${colors.accent}50`, boxShadow: `0 2px 10px ${colors.accent}25` }}
                  >
                    <img
                      src={data.logo}
                      alt={data.name}
                      className="w-full h-full object-cover object-center"
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

              {(pageConfig.slogan || data.description) && (
                <p className="text-xs opacity-70 leading-relaxed font-normal">
                  {data.description || pageConfig.slogan}
                </p>
              )}

              {/* Redes Sociales Activas */}
              <div className="flex items-center flex-wrap gap-2 pt-2">
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
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105 opacity-80 hover:opacity-100"
                    style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}
                    title="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105 opacity-80 hover:opacity-100"
                    style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}
                    title="Facebook"
                  >
                    <FacebookIcon />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105 opacity-80 hover:opacity-100"
                    style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}
                    title="TikTok"
                  >
                    <TikTokIcon />
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
                {hasCustomGallery && (
                  <li>
                    <a href="#galeria" className="hover:opacity-100 transition-opacity hover:underline">
                      Galería de Trabajos
                    </a>
                  </li>
                )}
                <li>
                  <a href="#horarios" className="hover:opacity-100 transition-opacity hover:underline">
                    Horarios de Atención
                  </a>
                </li>
                <li>
                  <a href="#ubicacion" className="hover:opacity-100 transition-opacity hover:underline">
                    Ubicación y Contacto
                  </a>
                </li>
                <li>
                  <a href="#reservar" className="hover:opacity-100 transition-opacity hover:underline font-bold" style={{ color: colors.accent }}>
                    Reservar Cita
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
                      {isTodayOpen ? formatDayHours(todayScheduleItem).text : (todayScheduleItem?.customMessage || 'Cerrado hoy')}
                    </span>
                  </div>
                </div>

                {data.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.accent }} />
                    {locationInfo ? (
                      <a href={locationInfo.directionsUrl} target="_blank" rel="noopener noreferrer" className="leading-snug hover:underline">
                        {data.address.startsWith('http') ? 'Ver ubicación en Google Maps ↗' : data.address}
                      </a>
                    ) : (
                      <span className="leading-snug">{data.address}</span>
                    )}
                  </div>
                )}

                {showPhone && data.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                    <a href={`tel:${data.phone}`} className="hover:underline font-bold">
                      {data.phone}
                    </a>
                  </div>
                )}

                {showEmail && data.email && (
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 shrink-0 text-xs font-black text-center" style={{ color: colors.accent }}>@</span>
                    <a href={`mailto:${data.email}`} className="hover:underline font-bold text-xs truncate">
                      {data.email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 4: Políticas & Confianza */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: colors.accent }}>
                Políticas & Condiciones
              </h4>
              <p className="text-xs opacity-70 leading-relaxed font-normal">
                Tu turno reservado con transparencia y respaldo. Consulta nuestras políticas antes de tu visita.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="text-left text-xs font-bold transition-opacity hover:opacity-100 opacity-80 flex items-center gap-2 cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={{ color: colors.accent }} />
                  <span>Términos de reserva</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModal('cancelacion')}
                  className="text-left text-xs font-bold transition-opacity hover:opacity-100 opacity-80 flex items-center gap-2 cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={{ color: colors.accent }} />
                  <span>Cancelaciones y reprogramaciones</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModal('anticipos')}
                  className="text-left text-xs font-bold transition-opacity hover:opacity-100 opacity-80 flex items-center gap-2 cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={{ color: colors.accent }} />
                  <span>Anticipos y devoluciones</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="text-left text-xs font-bold transition-opacity hover:opacity-100 opacity-80 flex items-center gap-2 cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={{ color: colors.accent }} />
                  <span>Política de privacidad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModal('datos')}
                  className="text-left text-xs font-bold transition-opacity hover:opacity-100 opacity-80 flex items-center gap-2 cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={{ color: colors.accent }} />
                  <span>Tratamiento de datos (Habeas Data)</span>
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
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
                onClick={() => setLegalModal('cancelacion')}
                className="hover:opacity-100 transition-opacity cursor-pointer"
              >
                Cancelaciones
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setLegalModal('anticipos')}
                className="hover:opacity-100 transition-opacity cursor-pointer"
              >
                Anticipos
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
              <Link
                href="/politica-de-cookies"
                className="hover:opacity-100 transition-opacity"
              >
                Cookies
              </Link>
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
                    {legalModal === 'terms' && 'Términos de Reserva y Condiciones del Servicio'}
                    {legalModal === 'privacy' && 'Política de Privacidad & Protección de Datos'}
                    {legalModal === 'cancelacion' && 'Política de Cancelaciones & Reprogramaciones'}
                    {legalModal === 'anticipos' && 'Política de Anticipos y Devoluciones'}
                    {legalModal === 'datos' && 'Tratamiento de Datos Personales (Habeas Data)'}
                  </h3>
                  <p className="text-xs opacity-60 font-medium">
                    {data.name} • Políticas oficiales del establecimiento
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
            <div className="px-6 pt-3 pb-1 border-b flex gap-2 shrink-0 text-xs font-bold overflow-x-auto" style={{ borderColor: colors.border }}>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${legalModal === 'terms' ? 'border shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                style={{
                  backgroundColor: legalModal === 'terms' ? `${colors.accent}20` : 'transparent',
                  borderColor: legalModal === 'terms' ? colors.accent : 'transparent',
                  color: legalModal === 'terms' ? colors.accent : colors.textPrimary
                }}
              >
                Términos de reserva
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('cancelacion')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${legalModal === 'cancelacion' ? 'border shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                style={{
                  backgroundColor: legalModal === 'cancelacion' ? `${colors.accent}20` : 'transparent',
                  borderColor: legalModal === 'cancelacion' ? colors.accent : 'transparent',
                  color: legalModal === 'cancelacion' ? colors.accent : colors.textPrimary
                }}
              >
                Cancelaciones
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('anticipos')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${legalModal === 'anticipos' ? 'border shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                style={{
                  backgroundColor: legalModal === 'anticipos' ? `${colors.accent}20` : 'transparent',
                  borderColor: legalModal === 'anticipos' ? colors.accent : 'transparent',
                  color: legalModal === 'anticipos' ? colors.accent : colors.textPrimary
                }}
              >
                Anticipos y devoluciones
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${legalModal === 'privacy' ? 'border shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                style={{
                  backgroundColor: legalModal === 'privacy' ? `${colors.accent}20` : 'transparent',
                  borderColor: legalModal === 'privacy' ? colors.accent : 'transparent',
                  color: legalModal === 'privacy' ? colors.accent : colors.textPrimary
                }}
              >
                Privacidad
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('datos')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${legalModal === 'datos' ? 'border shadow-xs' : 'opacity-60 hover:opacity-100'}`}
                style={{
                  backgroundColor: legalModal === 'datos' ? `${colors.accent}20` : 'transparent',
                  borderColor: legalModal === 'datos' ? colors.accent : 'transparent',
                  color: legalModal === 'datos' ? colors.accent : colors.textPrimary
                }}
              >
                Habeas Data
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs opacity-90 leading-relaxed font-normal">
              {legalModal === 'terms' && (
                <>
                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      1. Agendamiento y Confirmación de Citas
                    </h5>
                    <p>
                      Al solicitar una cita en <strong>{data.name}</strong> a través de nuestra página web o canal de WhatsApp oficial, el cliente reserva un bloque exclusivo en la agenda del profesional seleccionado.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      2. Puntualidad y Margen de Cortesía
                    </h5>
                    <p>
                      Recomendamos llegar con 5 minutos de anticipación. Contamos con una tolerancia máxima de <strong>10 minutos</strong>. Pasado este tiempo, para respetar la agenda de los siguientes clientes, el turno podrá ajustarse o reprogramarse según disponibilidad.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      3. Cancelaciones y Reprogramaciones
                    </h5>
                    <p>
                      Si necesitas reprogramar o cancelar tu cita, agradecemos notificar con al menos <strong>1 hora de anticipación</strong> a través del enlace de autogestión de tu reserva o mediante nuestro WhatsApp oficial.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      4. Precios y Formas de Pago
                    </h5>
                    <p>
                      Los precios exhibidos en el catálogo digital de <strong>{data.name}</strong> corresponden a las tarifas oficiales vigentes. El pago se realiza en el establecimiento al finalizar el servicio, salvo cuando aplique un anticipo de reserva indicado explícitamente durante el agendamiento.
                    </p>
                  </div>
                </>
              )}

              {legalModal === 'cancelacion' && (
                <>
                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      1. Tiempo de Tolerancia de Espera
                    </h5>
                    <p>
                      En <strong>{data.name}</strong> contamos con un margen de cortesía de <strong>10 minutos</strong> sobre la hora agendada. Pasado dicho tiempo sin aviso previo, el profesional podrá disponer del espacio para no retrasar los turnos siguientes.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      2. Reprogramación o Cancelación Oportuna
                    </h5>
                    <p>
                      Puedes cancelar o modificar el horario de tu cita sin costo hasta <strong>1 hora antes</strong> de la hora acordada utilizando el enlace incluido en tu confirmación o escribiendo directamente a nuestro WhatsApp de atención.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      3. Inasistencias sin Aviso Previo (No-Show)
                    </h5>
                    <p>
                      Las inasistencias reiteradas sin previo aviso pueden requerir confirmación anticipada o abono previo para futuras reservas en <strong>{data.name}</strong>.
                    </p>
                  </div>
                </>
              )}

              {legalModal === 'anticipos' && (
                <>
                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      1. Aplicación de Anticipos de Reserva
                    </h5>
                    <p>
                      Cuando un servicio o turno en <strong>{data.name}</strong> solicite anticipo para confirmar la cita, el monto o porcentaje se mostrará de forma clara antes de finalizar la solicitud y se descontará íntegramente del valor total a pagar en la barbería.
                    </p>
                    {data.depositInstructions && (
                      <p className="mt-2 p-3 rounded-xl border text-xs" style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}>
                        <strong>Instrucciones del establecimiento:</strong> {data.depositInstructions}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      2. Conservación del Anticipo por Reprogramación
                    </h5>
                    <p>
                      {pageConfig.advancePaymentConfig?.cancellationPolicy ||
                        'Si notificas la reprogramación de tu cita con al menos 1 hora de anticipación, tu anticipo se conserva íntegramente a favor para tu nueva fecha agendada.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      3. Devoluciones y Casos de Inasistencia
                    </h5>
                    <p>
                      En caso de cancelación por parte del establecimiento o fuerza mayor comprobada, el anticipo será reembolsado en su totalidad o abonado a una nueva fecha a elección del cliente. En caso de inasistencia sin previo aviso, el anticipo cubre la reserva del bloque de tiempo del profesional.
                    </p>
                  </div>
                </>
              )}

              {legalModal === 'privacy' && (
                <>
                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      1. Responsable del Tratamiento de Datos
                    </h5>
                    <p>
                      El responsable de la custodia y tratamiento de tus datos personales es <strong>{data.name}</strong>, operando mediante la infraestructura tecnológica de <strong>BarberOS</strong>, en cumplimiento de las normas de protección de datos personales.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      2. Finalidad de los Datos Recolectados
                    </h5>
                    <p>
                      Los datos solicitados al momento de reservar (nombre y número de contacto) se utilizan <strong>exclusivamente</strong> para:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 pt-1 opacity-85">
                      <li>Confirmación y recordatorios de tu cita agendada.</li>
                      <li>Comunicación directa ante reprogramaciones o novedades de horario.</li>
                      <li>Atención personalizada durante tu visita a <strong>{data.name}</strong>.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      3. Confidencialidad y No Transferencia
                    </h5>
                    <p>
                      No comercializamos ni cedemos tu información personal a terceros ajenos a la prestación de tu servicio de barbería.
                    </p>
                  </div>
                </>
              )}

              {legalModal === 'datos' && (
                <>
                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      1. Autorización de Tratamiento (Habeas Data — Ley 1581 de 2012)
                    </h5>
                    <p>
                      Al registrar tu reserva en <strong>{data.name}</strong>, autorizas de manera previa, expresa e informada el tratamiento de tus datos de contacto para la gestión operativa de tus citas.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-black text-sm uppercase tracking-wider" style={{ color: colors.accent }}>
                      2. Ejercicio de Derechos ARCO
                    </h5>
                    <p>
                      Como titular de los datos tienes derecho en todo momento a conocer, actualizar, rectificar y solicitar la supresión de tu información comunicándote directamente con los canales de atención de <strong>{data.name}</strong>.
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

      {/* Botón Flotante de WhatsApp (Visible solo si está habilitado y tiene número válido) */}
      {showWhatsapp && whatsappUrl && (
        <aside
          aria-label="Contacto por WhatsApp"
          className="fixed bottom-6 right-6 z-40"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25d366] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs font-bold"
            title="Escríbenos por WhatsApp"
            aria-label="Chat directo por WhatsApp"
          >
            <WhatsAppIcon />
            <span className="hidden sm:inline font-black tracking-tight">WhatsApp</span>
          </a>
        </aside>
      )}
    </div>
  )
}
