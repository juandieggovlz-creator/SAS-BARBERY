'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  ExternalLink, 
  Save, 
  Loader2, 
  Scissors, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  ArrowRight, 
  Check, 
  Copy, 
  Sparkles, 
  X, 
  Clock, 
  Star, 
  Image as ImageIcon, 
  MessageSquare, 
  Plus, 
  Trash2,
  Share2,
  Navigation,
  CheckCircle2,
  Info,
  Sun,
  Moon,
  Upload,
  Camera,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { PRESET_THEMES, FONT_OPTIONS, VisualTheme } from '@/lib/themes'
import { ConfirmImageDeleteModal } from '@/components/ui/ConfirmImageDeleteModal'
import { BANNER_PRESETS, DEFAULT_HERO_BANNER } from '@/components/public/BannerPresets'
import { DayScheduleItem, DEFAULT_SCHEDULE, parseSchedule, formatTime12h, formatDayHours } from '@/lib/schedule'
import { buildSocialUrl } from '@/lib/socials'

/* ── Brand social icons as inline SVGs ── */
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const SOCIAL_NETWORKS = [
  {
    key: 'whatsapp',
    showKey: 'showWhatsapp',
    label: 'WhatsApp (Chat & Reservas)',
    icon: <WhatsAppIcon />,
    color: '#25d366',
    placeholder: '+57 300 123 4567 o https://wa.link/mi-barberia',
    description: 'Ingresa tu número celular (ej: +57 300...) o tu enlace wa.link / wa.me directo.'
  },
  {
    key: 'instagram',
    showKey: 'showInstagram',
    label: 'Instagram',
    icon: <InstagramIcon />,
    color: '#e1306c',
    placeholder: 'https://instagram.com/tu_barberia o @tu_barberia',
    description: 'Enlace a tu perfil de Instagram o nombre de usuario.'
  },
  {
    key: 'facebook',
    showKey: 'showFacebook',
    label: 'Facebook',
    icon: <FacebookIcon />,
    color: '#1877f2',
    placeholder: 'https://facebook.com/tu_barberia o tu_barberia',
    description: 'Enlace a tu página de Facebook.'
  },
  {
    key: 'tiktok',
    showKey: 'showTiktok',
    label: 'TikTok',
    icon: <TikTokIcon />,
    color: '#000000',
    placeholder: 'https://tiktok.com/@tu_barberia o @tu_barberia',
    description: 'Enlace a tu cuenta de TikTok o usuario.'
  },
]

type PageConfig = {
  theme: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  whatsapp: string; showWhatsapp: boolean
  instagram: string; showInstagram: boolean
  facebook: string; showFacebook: boolean
  tiktok: string; showTiktok: boolean
  showPrices: boolean; showTeam: boolean; showServices: boolean
  requireBarber: boolean
  coverTitle: string; coverSubtitle: string
  slogan: string; bannerUrl: string; businessHours: string
  scheduleJson: DayScheduleItem[]
  gallery: Array<{ id: string; url: string; caption: string; category: string }>
  testimonials: Array<{ id: string; name: string; comment: string; rating: number }>
}

export default function WebpageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState<'theme' | 'texts' | 'hours' | 'socials' | 'gallery' | 'testimonials'>('theme')
  const [businessData, setBusinessData] = useState<any>(null)
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [origin, setOrigin] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  // Logo state & ref
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showDeleteLogoConfirm, setShowDeleteLogoConfirm] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Gallery state & refs
  const [galleryFilter, setGalleryFilter] = useState<'todos' | 'cortes' | 'barbas' | 'instalaciones'>('cortes')
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [galleryItemToDelete, setGalleryItemToDelete] = useState<string | null>(null)
  const galleryFileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)

  // Testimonial item form state
  const [newTestimonialName, setNewTestimonialName] = useState('')
  const [newTestimonialComment, setNewTestimonialComment] = useState('')
  const [newTestimonialRating, setNewTestimonialRating] = useState(5)

  const [pageConfig, setPageConfig] = useState<PageConfig>({
    theme: 'ELEGANTE',
    primaryColor: '#09090b', secondaryColor: '#ffffff', accentColor: '#d4af37',
    fontFamily: 'elegante',
    whatsapp: '', showWhatsapp: true,
    instagram: '', showInstagram: true,
    facebook: '', showFacebook: true,
    tiktok: '', showTiktok: true,
    showPrices: true, showTeam: true, showServices: true,
    requireBarber: false,
    coverTitle: '', coverSubtitle: '', slogan: '', bannerUrl: '',
    businessHours: JSON.stringify(DEFAULT_SCHEDULE),
    scheduleJson: DEFAULT_SCHEDULE,
    gallery: [],
    testimonials: [],
  })

  // ── Sincronización en tiempo real hacia el iframe (CERO ESPERA / CERO RECARGA) ──
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'PREVIEW_STATE_UPDATE',
        config: pageConfig,
        logo: logoUrl,
      }, '*')
    }
  }, [pageConfig, logoUrl])

  useEffect(() => {
    const handleIframeReady = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_IFRAME_READY' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'PREVIEW_STATE_UPDATE',
          config: pageConfig,
          logo: logoUrl,
        }, '*')
      }
    }
    window.addEventListener('message', handleIframeReady)
    return () => window.removeEventListener('message', handleIframeReady)
  }, [pageConfig, logoUrl])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/owner/webpage')
        if (res.ok) {
          const data = await res.json()
          setBusinessData(data)
          if (data.logo) {
            setLogoUrl(data.logo)
          }
          if (data.page) {
            const sanitized = { ...data.page }
            const nullableStrings: (keyof PageConfig)[] = [
              'coverTitle', 'coverSubtitle', 'slogan', 'bannerUrl', 'businessHours',
              'whatsapp', 'instagram', 'facebook', 'tiktok'
            ]
            nullableStrings.forEach(k => { if (sanitized[k] === null || sanitized[k] === undefined) (sanitized as any)[k] = '' })
            if (!Array.isArray(sanitized.gallery)) sanitized.gallery = []
            if (!Array.isArray(sanitized.testimonials) || sanitized.testimonials.length === 0) {
              sanitized.testimonials = [
                { id: '1', name: 'Andrés Morales', comment: 'El mejor fade que me han hecho en años. La atención, la puntualidad y el ambiente superan cualquier expectativa.', rating: 5 },
                { id: '2', name: 'Camilo Restrepo', comment: 'Excelente experiencia de principio a fin. El ritual de toalla caliente para la barba es de otro nivel.', rating: 5 },
                { id: '3', name: 'Sebastián Gómez', comment: 'Puntuales, pulcros y los barberos realmente dominan las técnicas modernas. 100% recomendado.', rating: 5 },
              ]
            }

            // Pre-fill coverTitle & coverSubtitle with the effective values shown on the public page
            // so the editor always shows exactly what the visitor sees
            const bizName = data.name || 'Barbería Elite SAS'
            if (!sanitized.coverTitle) {
              sanitized.coverTitle = `Bienvenido a ${bizName}`
            }
            if (!sanitized.coverSubtitle) {
              sanitized.coverSubtitle = 'Reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería diseñada para resaltar tu mejor estilo.'
            }
            
            // Parse structured schedule
            sanitized.scheduleJson = parseSchedule(sanitized.scheduleJson || sanitized.businessHours)
            sanitized.businessHours = JSON.stringify(sanitized.scheduleJson)

            setPageConfig((prev: PageConfig) => ({ ...prev, ...sanitized }))
          }
        }
      } catch {
        toast.error('Error al cargar la configuración')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/owner/webpage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          logo: logoUrl,
          page: {
            ...pageConfig,
            businessHours: JSON.stringify(pageConfig.scheduleJson)
          } 
        }),
      })
      if (res.ok) {
          const updated = await res.json()
          setBusinessData(updated)
          if (updated?.logo !== undefined) {
            setLogoUrl(updated.logo || '')
          }
          // Sync pageConfig from server response to guarantee consistency
          if (updated?.page) {
            const serverPage = { ...updated.page }
            const nullableStrings: (keyof PageConfig)[] = [
              'coverTitle', 'coverSubtitle', 'slogan', 'bannerUrl', 'businessHours',
              'whatsapp', 'instagram', 'facebook', 'tiktok'
            ]
            nullableStrings.forEach(k => { if (serverPage[k] === null || serverPage[k] === undefined) (serverPage as any)[k] = '' })
            if (!Array.isArray(serverPage.gallery)) serverPage.gallery = []
            if (!Array.isArray(serverPage.testimonials)) serverPage.testimonials = []
            serverPage.scheduleJson = parseSchedule(serverPage.scheduleJson || serverPage.businessHours)
            serverPage.businessHours = JSON.stringify(serverPage.scheduleJson)
            setPageConfig((prev: PageConfig) => ({ ...prev, ...serverPage }))
          }
          setHasUnsaved(false)
          toast.success('¡Página web guardada y publicada!')
          setShowSavedModal(true)
          // Bump iframe key after a tick so postMessage with updated config fires first
          setTimeout(() => setIframeKey(prev => prev + 1), 150)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Error al guardar la página')
      }
    } catch {
      toast.error('Error de red al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateDaySchedule = (dayIndex: number, partial: Partial<DayScheduleItem>) => {
    setPageConfig(prev => {
      const currentList = Array.isArray(prev.scheduleJson) && prev.scheduleJson.length > 0
        ? prev.scheduleJson
        : DEFAULT_SCHEDULE
      const updated = currentList.map(item => {
        if (item.dayIndex === dayIndex) {
          return { ...item, ...partial }
        }
        return item
      })
      return {
        ...prev,
        scheduleJson: updated,
        businessHours: JSON.stringify(updated),
      }
    })
    setHasUnsaved(true)
  }

  const copyDayToWeekdays = (sourceIndex: number) => {
    const list = Array.isArray(pageConfig.scheduleJson) && pageConfig.scheduleJson.length > 0
      ? pageConfig.scheduleJson
      : DEFAULT_SCHEDULE
    const source = list.find(d => d.dayIndex === sourceIndex)
    if (!source) return
    const updated = list.map(item => {
      // Aplicar a Lunes (1) hasta Sábado (6)
      if (item.dayIndex >= 1 && item.dayIndex <= 6) {
        return {
          ...item,
          isOpen: source.isOpen,
          openTime: source.openTime,
          closeTime: source.closeTime,
        }
      }
      return item
    })
    setPageConfig(prev => ({
      ...prev,
      scheduleJson: updated,
      businessHours: JSON.stringify(updated),
    }))
    setHasUnsaved(true)
    toast.success(`Horario de ${source.day} copiado a Lunes - Sábado`)
  }

  const applyDefaultHours = () => {
    setPageConfig(prev => ({
      ...prev,
      scheduleJson: DEFAULT_SCHEDULE,
      businessHours: JSON.stringify(DEFAULT_SCHEDULE),
    }))
    setHasUnsaved(true)
    toast.success('Horarios restaurados por defecto')
  }

  const copyUrl = () => {
    if (!bizUrl) return
    navigator.clipboard.writeText(bizUrl)
    setCopied(true)
    toast.success('¡Enlace copiado al portapapeles! 🚀')
    setTimeout(() => setCopied(false), 2500)
  }

  const applyTheme = (themeId: string) => {
    const selectedTheme = PRESET_THEMES.find(t => t.id === themeId)
    if (selectedTheme) {
      setPageConfig(prev => ({
        ...prev,
        theme: selectedTheme.id,
        primaryColor: selectedTheme.primary,
        secondaryColor: selectedTheme.secondary,
        accentColor: selectedTheme.accent
      }))
    }
  }

  const set = (key: keyof PageConfig, val: unknown) => {
    setPageConfig(prev => ({ ...prev, [key]: val }))
    setHasUnsaved(true)
  }

  const normalizeGalleryCat = (cat: string): 'cortes' | 'barbas' | 'instalaciones' => {
    const c = (cat || 'cortes').toLowerCase().trim()
    if (c === 'barba' || c === 'barbas') return 'barbas'
    if (c === 'instalacion' || c === 'instalaciones') return 'instalaciones'
    return 'cortes'
  }

  const getCatCount = (catId: 'cortes' | 'barbas' | 'instalaciones') => {
    return (pageConfig.gallery || []).filter(i => normalizeGalleryCat(i.category) === catId).length
  }

  // ── LOGO HANDLERS ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG, WEBP o SVG.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen del logo no debe superar los 5MB.')
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
        setLogoUrl(data.logoUrl)
        setHasUnsaved(true)
        toast.success('Foto actualizada correctamente.')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        toast.error(data.error || 'No se pudo actualizar la foto. Inténtalo de nuevo.')
      }
    } catch (err) {
      console.error(err)
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    if (!logoUrl) return

    setUploadingLogo(true)
    try {
      const res = await fetch('/api/owner/business/logo', {
        method: 'DELETE',
      })
      if (res.ok) {
        setLogoUrl('')
        setHasUnsaved(true)
        setShowDeleteLogoConfirm(false)
        toast.success('Foto eliminada correctamente.')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('business-updated'))
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'No se pudo eliminar la foto. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo eliminar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  // ── GALERÍA CLOUDINARY HANDLERS ──
  const handleUploadGalleryPhotos = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetCategory: 'cortes' | 'barbas' | 'instalaciones'
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const currentCount = getCatCount(targetCategory)
    const availableQuota = 6 - currentCount

    if (availableQuota <= 0) {
      toast.error(`La categoría "${targetCategory}" ya alcanzó el límite máximo de 6 fotos. Elimina una para subir otra.`)
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
      return
    }

    const filesArray = Array.from(files)
    if (filesArray.length > availableQuota) {
      toast.error(`Solo puedes subir ${availableQuota} foto(s) más en "${targetCategory}". Has seleccionado ${filesArray.length}.`)
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
      return
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    for (const f of filesArray) {
      if (!validMimes.includes(f.type)) {
        toast.error(`El archivo "${f.name}" no es una imagen permitida (JPG, PNG o WEBP).`)
        if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
        return
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`"${f.name}" supera el tamaño máximo permitido de 5MB.`)
        if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
        return
      }
    }

    setUploadingGallery(true)
    const formData = new FormData()
    formData.append('category', targetCategory)
    filesArray.forEach(f => formData.append('files', f))

    try {
      const res = await fetch('/api/owner/webpage/gallery', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok && data.gallery) {
        setPageConfig(prev => ({ ...prev, gallery: data.gallery }))
        setHasUnsaved(true)
        toast.success('Foto actualizada correctamente.')
      } else {
        toast.error(data.error || 'No se pudo actualizar la foto. Inténtalo de nuevo.')
      }
    } catch (err) {
      console.error(err)
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    } finally {
      setUploadingGallery(false)
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
    }
  }

  const handleTriggerReplace = (itemId: string) => {
    setReplacingItemId(itemId)
    replaceFileInputRef.current?.click()
  }

  const handleExecuteReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const itemId = replacingItemId
    if (!file || !itemId) return

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validMimes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB.')
      return
    }

    const item = pageConfig.gallery?.find(i => i.id === itemId)
    const category = item ? normalizeGalleryCat(item.category) : 'cortes'

    setUploadingGallery(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('replaceId', itemId)
    formData.append('category', category)

    try {
      const res = await fetch('/api/owner/webpage/gallery', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok && data.gallery) {
        setPageConfig(prev => ({ ...prev, gallery: data.gallery }))
        setHasUnsaved(true)
        toast.success('Foto actualizada correctamente.')
      } else {
        toast.error(data.error || 'No se pudo actualizar la foto. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    } finally {
      setReplacingItemId(null)
      setUploadingGallery(false)
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = ''
    }
  }

  const handleConfirmDeleteGalleryItem = async () => {
    if (!galleryItemToDelete) return

    const id = galleryItemToDelete
    setDeletingItemId(id)
    try {
      const res = await fetch(`/api/owner/webpage/gallery?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (res.ok && data.gallery) {
        setPageConfig(prev => ({ ...prev, gallery: data.gallery }))
        setHasUnsaved(true)
        setGalleryItemToDelete(null)
        toast.success('Foto eliminada correctamente.')
      } else {
        toast.error(data.error || 'No se pudo eliminar la foto. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo eliminar la foto. Inténtalo de nuevo.')
    } finally {
      setDeletingItemId(null)
    }
  }

  const applyDefaultTestimonials = () => {
    const defaults = [
      { id: '1', name: 'Andrés Morales', comment: 'El mejor fade que me han hecho en años. La atención, la puntualidad y el ambiente superan cualquier expectativa.', rating: 5 },
      { id: '2', name: 'Camilo Restrepo', comment: 'Excelente experiencia de principio a fin. El ritual de toalla caliente para la barba es de otro nivel.', rating: 5 },
      { id: '3', name: 'Sebastián Gómez', comment: 'Puntuales, pulcros y los barberos realmente dominan las técnicas modernas. 100% recomendado.', rating: 5 },
    ]
    setPageConfig(prev => ({ ...prev, testimonials: defaults }))
    setHasUnsaved(true)
    toast.success('Testimonios por defecto restaurados')
  }

  const updateTestimonialItem = (id: string, partial: Partial<{ name: string; comment: string; rating: number }>) => {
    setPageConfig(prev => ({
      ...prev,
      testimonials: prev.testimonials.map(item => item.id === id ? { ...item, ...partial } : item)
    }))
    setHasUnsaved(true)
  }

  const addTestimonialItem = () => {
    if (!newTestimonialName.trim() || !newTestimonialComment.trim()) {
      toast.error('Ingresa el nombre del cliente y su comentario')
      return
    }
    const item = {
      id: Date.now().toString(),
      name: newTestimonialName.trim(),
      comment: newTestimonialComment.trim(),
      rating: newTestimonialRating,
    }
    setPageConfig(prev => ({ ...prev, testimonials: [...prev.testimonials, item] }))
    setNewTestimonialName('')
    setNewTestimonialComment('')
    setHasUnsaved(true)
    toast.success('Testimonio agregado')
  }

  const removeTestimonialItem = (id: string) => {
    setPageConfig(prev => ({ ...prev, testimonials: prev.testimonials.filter(i => i.id !== id) }))
    setHasUnsaved(true)
    toast.success('Testimonio eliminado')
  }

  const bizName = businessData?.name || 'Barbería Elite SAS'
  const bizSlug = businessData?.slug || 'barberia-elite'
  const bizPath = `/b/${bizSlug}`
  const bizUrl = origin ? `${origin}${bizPath}` : (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}${bizPath}` : bizPath)

  const currentTheme = PRESET_THEMES.find(t => t.id === pageConfig.theme) || PRESET_THEMES[0]
  const currentFont = FONT_OPTIONS.find(f => f.id === pageConfig.fontFamily) || FONT_OPTIONS[0]

  return (
    <div className="flex flex-row h-full overflow-hidden">

      {/* ══════════════ SIDEBAR DE CONFIGURACIÓN ══════════════ */}
      <div className="w-[430px] shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full z-10 overflow-hidden shadow-xs">
        {/* Header Superior */}
        <div className="px-5 py-4 border-b border-zinc-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base text-zinc-900 tracking-tight">Editor Web de Barbería</h1>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Página pública de alto impacto y conversión</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={bizUrl} target="_blank"
                className="text-xs font-bold text-zinc-600 border border-zinc-200 hover:border-zinc-900 hover:text-zinc-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" /> Ver en vivo
              </Link>
              <button onClick={handleSave} disabled={saving || loading}
                className="bg-zinc-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar
              </button>
            </div>
          </div>

          {/* URL con botón de copiar rápido */}
          <div className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5">
            <a href={bizUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 group flex-1 truncate"
              title="Abrir enlace">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-400" />
              <span className="text-[11px] font-mono font-medium text-zinc-600 group-hover:text-zinc-950 transition-colors truncate">
                {bizUrl}
              </span>
            </a>
            <button
              onClick={copyUrl}
              className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-950 bg-white border border-zinc-200 hover:border-zinc-300 px-2 py-1 rounded-md transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Pestañas de Secciones */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-100 overflow-x-auto bg-zinc-50/70 scrollbar-none">
          {[
            { id: 'theme', label: '10 Temas & Tipos' },
            { id: 'texts', label: 'Portada & Textos' },
            { id: 'hours', label: 'Horarios' },
            { id: 'socials', label: 'Redes & WhatsApp' },
            { id: 'gallery', label: 'Galería' },
            { id: 'testimonials', label: 'Testimonios' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/80 font-black' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del Panel Activo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── 1. TEMAS & TIPOGRAFÍAS ── */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    10 Temas Visuales Luxury
                  </h3>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                    Paletas Curadas
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  Cambia de estilo instantáneamente. Cada tema define contrastes, tarjetas y acentos de color.
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {PRESET_THEMES.map(t => {
                    const isSelected = pageConfig.theme === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => applyTheme(t.id)}
                        className={`p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected ? 'border-zinc-950 bg-zinc-50 shadow-xs ring-2 ring-zinc-950/5' : 'border-zinc-100 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex w-10 h-7 rounded-lg overflow-hidden border border-black/10 gap-0.5 shadow-2xs">
                            <div className="flex-1" style={{ backgroundColor: t.primary }} />
                            <div className="w-2.5" style={{ backgroundColor: t.secondary }} />
                            <div className="w-2.5" style={{ backgroundColor: t.accent }} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-zinc-900 block">{t.name}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">{t.description}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Tipografías & Maridajes (Google Fonts)
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                    5 Categorías Claras
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  Cada opción combina una fuente de títulos con una fuente de lectura para un contraste visual evidente.
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {FONT_OPTIONS.map(font => {
                    const isSelected = pageConfig.fontFamily === font.id
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => set('fontFamily', font.id)}
                        className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950/5 shadow-xs' 
                            : 'border-zinc-100 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div className="flex-1 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              className="text-sm font-black text-zinc-900 block tracking-tight" 
                              style={{ fontFamily: font.headingFont }}
                            >
                              {font.name}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                              {font.category}
                            </span>
                          </div>
                          <span 
                            className="text-xs text-zinc-700 font-medium block mb-1" 
                            style={{ fontFamily: font.headingFont }}
                          >
                            {font.sample}
                          </span>
                          <span 
                            className="text-[10px] text-zinc-400 block" 
                            style={{ fontFamily: font.bodyFont }}
                          >
                            {font.pairDescription}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── 2. PORTADA & TEXTOS ── */}
          {activeTab === 'texts' && (
            <div className="space-y-5">
              {/* Logo Oficial de la Barbería */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Logo Oficial de la Barbería
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Se muestra en la barra de navegación superior, pie de página y comprobantes
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    logoUrl 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}>
                    {logoUrl ? 'Foto configurada' : 'Sin logo configurado'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-zinc-200">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white relative overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200 shadow-xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-sm font-black text-zinc-400">
                        {bizName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-zinc-800">
                      {logoUrl ? 'Logo cargado desde tu dispositivo' : 'Sube tu logo para personalizar tu página'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Formatos: PNG, JPG o WEBP (máximo 5MB). Almacenamiento optimizado de alta resolución.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload size={13} /> {logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                        </>
                      )}
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        disabled={uploadingLogo}
                        onClick={() => setShowDeleteLogoConfirm(true)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 rounded-xl transition-all cursor-pointer"
                        title="Eliminar logo"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Título de Portada</label>
                <input
                  type="text"
                  value={pageConfig.coverTitle}
                  onChange={e => set('coverTitle', e.target.value)}
                  placeholder={`Bienvenido a ${bizName}`}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-900"
                />
                <span className="text-[10px] text-zinc-400 block mt-1">
                  Se genera automáticamente con el nombre real de tu barbería. Puedes personalizar el texto.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Descripción Principal de Portada</label>
                <textarea
                  rows={3}
                  value={pageConfig.coverSubtitle}
                  onChange={e => set('coverSubtitle', e.target.value)}
                  placeholder="Reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería diseñada para resaltar tu mejor estilo."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-900 resize-none"
                />
                <span className="text-[10px] text-zinc-400 block mt-1">
                  Descripción profesional por defecto. Puedes personalizarla para tu barbería.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-2">
                  Imagen de Fondo / Banner Principal (6 Estilos Preestablecidos)
                </label>
                
                {/* 6 Preset Image Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                  {BANNER_PRESETS.map((preset) => {
                    const isSelected = pageConfig.bannerUrl === preset.url
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => set('bannerUrl', preset.url)}
                        className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all p-1 flex flex-col ${
                          isSelected 
                            ? 'border-black ring-2 ring-black/20 shadow-md bg-zinc-100' 
                            : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50'
                        }`}
                      >
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-800 mb-1.5">
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="bg-white text-black p-1 rounded-full shadow-lg">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-800 line-clamp-1 px-1">
                          {preset.title}
                        </span>
                        <span className="text-[9px] text-zinc-500 line-clamp-1 px-1 mb-0.5">
                          {preset.description}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>
                    El estilo seleccionado se aplica y optimiza automáticamente con degradados cinematográficos para máxima legibilidad.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. HORARIOS SEMANALES COMPLETOS ── */}
          {activeTab === 'hours' && (
            <div className="space-y-5">
              {/* Header & Acciones Rápidas */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Horarios de Atención Semanales
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Sincronización en Vivo
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Configura cada día de la semana individualmente. Puedes activar o desactivar días para marcarlos como <strong>cerrados</strong> y definir el horario exacto de apertura y cierre.
                </p>

                {/* Botones de acción rápida */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200/70">
                  <button
                    type="button"
                    onClick={() => copyDayToWeekdays(1)}
                    className="text-[11px] font-bold text-zinc-700 hover:text-zinc-950 bg-white border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3 h-3 text-zinc-500" />
                    Copiar Lunes a Lun-Sáb
                  </button>
                  <button
                    type="button"
                    onClick={applyDefaultHours}
                    className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Restablecer por defecto
                  </button>
                </div>
              </div>

              {/* Lista de 7 Días */}
              <div className="space-y-3">
                {(pageConfig.scheduleJson && pageConfig.scheduleJson.length > 0
                  ? pageConfig.scheduleJson
                  : DEFAULT_SCHEDULE
                ).map((item) => {
                  const formattedOpen = formatTime12h(item.openTime)
                  const formattedClose = formatTime12h(item.closeTime)

                  return (
                    <div
                      key={item.day}
                      className={`rounded-2xl border transition-all duration-200 p-4 space-y-3 ${
                        item.isOpen
                          ? 'bg-white border-zinc-200 shadow-2xs'
                          : 'bg-zinc-50/90 border-zinc-200/70 opacity-90'
                      }`}
                    >
                      {/* Fila Principal: Nombre del Día + Estado + Switch */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-black text-zinc-900">{item.day}</span>
                          {item.isOpen ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {formattedOpen} - {formattedClose}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {item.customMessage?.trim() || 'Cerrado'}
                            </span>
                          )}
                        </div>

                        {/* Switch Abierto / Cerrado */}
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${
                            item.isOpen ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'
                          }`}>
                            {item.isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDaySchedule(item.dayIndex, { isOpen: !item.isOpen })}
                            className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                              item.isOpen 
                                ? 'bg-emerald-500 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-500/30' 
                                : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-400/30 dark:border-zinc-700'
                            }`}
                            title={item.isOpen ? 'Marcar como cerrado' : 'Marcar como abierto'}
                          >
                            <div
                              className={`w-4 h-4 rounded-full keep-white toggle-knob bg-white absolute top-1 shadow-sm transition-all ${
                                item.isOpen ? 'left-6' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Contenido Condicional según Abierto o Cerrado */}
                      {item.isOpen ? (
                        <div className="space-y-2.5 pt-1">
                          <div className="grid grid-cols-2 gap-3">
                            {/* Hora Apertura */}
                            <div>
                              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                                Hora de Apertura
                              </label>
                              <input
                                type="time"
                                value={item.openTime}
                                onChange={e => updateDaySchedule(item.dayIndex, { openTime: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-900"
                              />
                            </div>

                            {/* Hora Cierre */}
                            <div>
                              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                                Hora de Cierre
                              </label>
                              <input
                                type="time"
                                value={item.closeTime}
                                onChange={e => updateDaySchedule(item.dayIndex, { closeTime: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-900"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                            Mensaje personalizado para este día cerrado (opcional)
                          </label>
                          <input
                            type="text"
                            value={item.customMessage || ''}
                            onChange={e => updateDaySchedule(item.dayIndex, { customMessage: e.target.value })}
                            placeholder="Ej: Cerrado por mantenimiento / Día de descanso"
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 outline-none focus:border-zinc-900"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 4. REDES SOCIALES & WHATSAPP ── */}
          {activeTab === 'socials' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-1">
                  Canales & Redes Oficiales
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Solo los canales que actives con el interruptor aparecerán con su logo oficial en la página. Al hacer clic, enviarán directamente al visitante a tu chat o perfil.
                </p>
              </div>

              <div className="space-y-3">
                {SOCIAL_NETWORKS.map(net => {
                  const urlVal = ((pageConfig as any)[net.key] ?? '') as string
                  const showVal = (pageConfig as any)[net.showKey] as boolean
                  const resolvedUrl = buildSocialUrl(net.key, urlVal)

                  return (
                    <div key={net.key} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-2xs" style={{ backgroundColor: net.color }}>
                            {net.icon}
                          </div>
                          <div>
                            <span className="text-xs font-black text-zinc-900 block">{net.label}</span>
                            <span className="text-[10px] text-zinc-400 font-medium">{net.description}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => set(net.showKey as keyof PageConfig, !showVal)}
                          className={`w-11 h-6 rounded-full transition-all relative cursor-pointer shrink-0 ${
                            showVal 
                              ? 'bg-emerald-500 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-500/30' 
                              : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-400/30 dark:border-zinc-700'
                          }`}
                          title={showVal ? 'Desactivar red social' : 'Activar red social'}
                        >
                          <div className={`w-4 h-4 rounded-full keep-white toggle-knob bg-white absolute top-1 shadow-sm transition-all ${
                            showVal ? 'left-6' : 'left-1'
                          }`} />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={urlVal}
                        onChange={e => set(net.key as keyof PageConfig, e.target.value)}
                        placeholder={net.placeholder}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white transition-all"
                      />

                      {/* Vista previa del enlace final verificado */}
                      {urlVal.trim() && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Redirige a:</span>
                          <a
                            href={resolvedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono font-medium text-blue-600 hover:underline truncate max-w-[280px] inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{resolvedUrl}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 5. GALERÍA DE FOTOS (3 CATEGORÍAS - MÁXIMO 6 FOTOS C/U) ── */}
          {activeTab === 'gallery' && (
            <div className="space-y-5">
              {/* Resumen de cupos y selector de categoría */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Galería Oficial de la Barbería
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Sube fotos reales desde tu dispositivo. Máximo 6 fotos por categoría.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 bg-white border border-zinc-200 px-2.5 py-1 rounded-full shadow-2xs">
                    {pageConfig.gallery?.length || 0}/18 fotos totales
                  </span>
                </div>

                {/* Quota cards clicables para cambiar de categoría */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-200/80">
                  {(['cortes', 'barbas', 'instalaciones'] as const).map(catKey => {
                    const count = getCatCount(catKey)
                    const isSelected = galleryFilter === catKey
                    const catTitle = catKey === 'cortes' ? 'Cortes' : catKey === 'barbas' ? 'Barbas' : 'Instalaciones'
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setGalleryFilter(catKey)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                            : count >= 6
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900 hover:border-amber-300'
                            : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                          {catTitle}
                        </span>
                        <span className="text-xs font-black block mt-0.5">
                          {count} <span className={`text-[10px] font-medium ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>/ 6</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Contenedor principal de la categoría activa */}
              {(() => {
                const activeCat = galleryFilter === 'todos' ? 'cortes' : galleryFilter
                const catCount = getCatCount(activeCat)
                const isFull = catCount >= 6
                const availableQuota = 6 - catCount

                const catMeta = {
                  cortes: {
                    title: 'Cortes de Cabello',
                    desc: 'Muestra degradados, skin fades, cortes clásicos y texturizados.',
                  },
                  barbas: {
                    title: 'Barbas & Afeitado',
                    desc: 'Perfilado de barba, afeitado al ras y ritual de toalla caliente.',
                  },
                  instalaciones: {
                    title: 'Instalaciones & Salón',
                    desc: 'Sillones, espejos, iluminación y ambiente de tu barbería.',
                  },
                }[activeCat]

                const visibleItems = (pageConfig.gallery || []).filter(item => {
                  if (galleryFilter === 'todos') return true
                  return normalizeGalleryCat(item.category) === galleryFilter
                })

                return (
                  <div className="space-y-4">
                    {/* Header de la categoría con botón de subida nativo */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-zinc-900">
                              {catMeta.title}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isFull
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {isFull ? 'Límite alcanzado (6/6)' : `${availableQuota} cupos disponibles`}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {catMeta.desc}
                          </p>
                        </div>

                        {/* Botón de subida conectado al selector nativo del dispositivo */}
                        <div className="shrink-0">
                          <input
                            ref={galleryFileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => handleUploadGalleryPhotos(e, activeCat)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isFull || uploadingGallery}
                            onClick={() => galleryFileInputRef.current?.click()}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                              isFull
                                ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                                : 'bg-zinc-900 hover:bg-black text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            {uploadingGallery ? (
                              <>
                                <Loader2 size={13} className="animate-spin" /> Subiendo...
                              </>
                            ) : (
                              <>
                                <Upload size={13} /> Subir fotografías
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {isFull ? (
                        <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl">
                          <Info size={14} className="shrink-0" />
                          <span>
                            Has alcanzado el límite de 6 fotografías en esta categoría. Para subir una nueva, elimina o reemplaza una foto existente.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-50 p-2 rounded-xl">
                          <CheckCircle2 size={12} className="text-zinc-500 shrink-0" />
                          <span>
                            Puedes seleccionar hasta {availableQuota} foto(s) a la vez desde tu celular o computadora. Formatos JPG, PNG o WEBP (máx. 5MB c/u).
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Input oculto para la acción de reemplazo */}
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleExecuteReplace}
                      className="hidden"
                    />

                    {/* Cuadrícula de fotos */}
                    {visibleItems.length === 0 ? (
                      <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-200/70 text-zinc-500 flex items-center justify-center">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-800 uppercase tracking-tight">
                            Sin fotografías en {catMeta.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 max-w-xs mt-0.5">
                            Sube hasta 6 fotos directamente desde tu galería o cámara para mostrar tu trabajo profesional a los clientes.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={uploadingGallery}
                          onClick={() => galleryFileInputRef.current?.click()}
                          className="flex items-center gap-2 bg-zinc-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-all cursor-pointer shadow-xs"
                        >
                          <Upload size={13} /> Subir primera fotografía
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {visibleItems.map(item => {
                          const isBeingReplaced = replacingItemId === item.id
                          const isBeingDeleted = deletingItemId === item.id

                          return (
                            <div
                              key={item.id}
                              className="group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-xs"
                            >
                              {/* Thumbnail */}
                              <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                                <img
                                  src={item.url}
                                  alt={item.caption || 'Foto de galería'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Indicador de carga de reemplazo o eliminación */}
                                {(isBeingReplaced || isBeingDeleted) && (
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>{isBeingDeleted ? 'Eliminando...' : 'Reemplazando...'}</span>
                                  </div>
                                )}

                                {/* Overlay de acciones rápidas */}
                                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    disabled={isBeingReplaced || isBeingDeleted || uploadingGallery}
                                    onClick={() => handleTriggerReplace(item.id)}
                                    className="p-1.5 bg-white/95 hover:bg-white text-zinc-800 rounded-lg shadow-md hover:text-black transition-all cursor-pointer"
                                    title="Reemplazar foto con otra de tu dispositivo"
                                  >
                                    <RefreshCw size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBeingReplaced || isBeingDeleted || uploadingGallery}
                                    onClick={() => setGalleryItemToDelete(item.id)}
                                    className="p-1.5 bg-white/95 hover:bg-rose-50 text-rose-600 rounded-lg shadow-md transition-all cursor-pointer"
                                    title="Eliminar foto"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Footer con título */}
                              <div className="p-2.5 bg-white border-t border-zinc-100">
                                <span className="text-xs font-bold text-zinc-900 block truncate" title={item.caption}>
                                  {item.caption || 'Sin título'}
                                </span>
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                                  <span className="uppercase font-extrabold tracking-wider">
                                    {normalizeGalleryCat(item.category)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerReplace(item.id)}
                                    className="text-zinc-600 hover:text-zinc-950 font-bold hover:underline cursor-pointer"
                                  >
                                    Reemplazar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── 6. TESTIMONIOS ── */}
          {activeTab === 'testimonials' && (
            <div className="space-y-5">
              {/* Header con información y botón de restauración */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    Testimonios & Reseñas de Clientes
                  </h3>
                  <button
                    type="button"
                    onClick={applyDefaultTestimonials}
                    className="text-[11px] font-bold text-zinc-700 hover:text-zinc-950 bg-white border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    Restablecer 3 por Defecto
                  </button>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Las reseñas que edites o agregues aquí aparecerán destacadas en la sección de testimonios de tu página pública. Puedes modificar los nombres, estrellas y textos directamente en las tarjetas de abajo.
                </p>
              </div>

              {/* Formulario para añadir nuevo testimonio */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 space-y-3">
                <span className="text-xs font-black text-zinc-900 block flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-zinc-500" /> Añadir Nueva Reseña
                </span>
                <input
                  type="text"
                  value={newTestimonialName}
                  onChange={e => setNewTestimonialName(e.target.value)}
                  placeholder="Nombre del Cliente (ej: Santiago Vélez)"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:border-zinc-900"
                />
                <textarea
                  rows={2}
                  value={newTestimonialComment}
                  onChange={e => setNewTestimonialComment(e.target.value)}
                  placeholder="Comentario o reseña del cliente..."
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:border-zinc-900 resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewTestimonialRating(star)}
                        className="cursor-pointer"
                        title={`${star} estrellas`}
                      >
                        <Star className={`w-4 h-4 ${star <= newTestimonialRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}`} />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addTestimonialItem}
                    className="bg-zinc-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-all cursor-pointer"
                  >
                    Añadir Reseña
                  </button>
                </div>
              </div>

              {/* Lista editable de testimonios actuales */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  Reseñas Mostradas en la Página ({pageConfig.testimonials?.length || 0})
                </span>

                {pageConfig.testimonials && pageConfig.testimonials.length > 0 ? (
                  pageConfig.testimonials.map((item, idx) => (
                    <div key={item.id || idx} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        {/* Star Rating selector per item */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateTestimonialItem(item.id, { rating: star })}
                              className="cursor-pointer"
                              title={`Cambiar a ${star} estrellas`}
                            >
                              <Star className={`w-3.5 h-3.5 ${star <= (item.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}`} />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTestimonialItem(item.id)}
                          className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          title="Eliminar testimonio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">Nombre del Cliente</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateTestimonialItem(item.id, { name: e.target.value })}
                          placeholder="Nombre del cliente"
                          className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">Comentario o Reseña</label>
                        <textarea
                          rows={2}
                          value={item.comment}
                          onChange={e => updateTestimonialItem(item.id, { comment: e.target.value })}
                          placeholder="Escribe el testimonio aquí..."
                          className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-zinc-900 focus:bg-white resize-none"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center">
                    <p className="text-xs text-zinc-400 italic mb-2">No hay testimonios agregados.</p>
                    <button
                      type="button"
                      onClick={applyDefaultTestimonials}
                      className="text-xs font-bold text-zinc-900 underline cursor-pointer"
                    >
                      Cargar testimonios por defecto
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════ PREVIEW REAL — IFRAME de la p\u00e1gina publicada ══════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0d0d]">
        {/* Toolbar de visualización */}
        <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            {/* Selector de Dispositivo */}
            <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === 'desktop' ? 'bg-zinc-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Escritorio</span>
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === 'tablet' ? 'bg-zinc-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet</span>
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === 'mobile' ? 'bg-zinc-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Móvil</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsaved && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-700/50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                Cambios en tiempo real (sin guardar)
              </span>
            )}
            {!hasUnsaved && iframeKey > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Publicado
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsaved}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                hasUnsaved && !saving
                  ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Guardando...' : 'Guardar y publicar'}
            </button>
          </div>
        </div>

        {/* ── Contenedor del iframe real ── */}
        <div className="flex-1 overflow-auto flex items-start justify-center py-5 px-4">
          <div
            className="transition-all duration-500 ease-in-out flex flex-col"
            style={{
              width:    previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '390px',
              minWidth: previewMode === 'mobile' ? '390px' : undefined,
              maxWidth: previewMode === 'desktop' ? '1280px' : undefined,
              height: 'calc(100vh - 110px)',
              minHeight: '600px',
            }}
          >
            {/* Barra del navegador simulada */}
            <div className="h-9 bg-zinc-800 rounded-t-2xl flex items-center px-4 gap-3 shrink-0 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex items-center bg-zinc-700/50 rounded-md px-3 py-1 gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-mono text-[10px] text-zinc-300 truncate">{bizUrl}</span>
              </div>
              <a
                href={bizUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* IFRAME — página real con scroll, animaciones, hover, sticky nav y sync en vivo */}
            <div className="flex-1 relative rounded-b-2xl overflow-hidden border border-white/5 border-t-0 shadow-2xl bg-zinc-950">
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={bizPath}
                className="w-full h-full border-0 block"
                title="Preview — Página publicada de tu barbería"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de publicación con enlace público ── */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSavedModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-600 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              ¡PÁGINA PUBLICADA CON ÉXITO!
            </div>

            <h3 className="text-xl font-black text-zinc-900 leading-tight mb-2">
              Tu enlace público está listo
            </h3>

            <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-5">
              Tu sitio web ya está activo y actualizado con el nuevo diseño. Comparte este enlace en tus redes sociales, bio de Instagram o envíalo por WhatsApp a tus clientes para recibir reservas 24/7.
            </p>

            <div className="bg-zinc-50 border-2 border-zinc-200/80 rounded-2xl p-3.5 mb-5 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Enlace de tu Barbería
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={bizUrl}
                  className="flex-1 bg-transparent font-mono text-xs font-bold text-zinc-800 outline-none select-all truncate"
                />
                <button
                  onClick={copyUrl}
                  className="shrink-0 bg-zinc-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={bizUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold py-3 rounded-xl transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver página en vivo
              </a>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold py-3 rounded-xl transition-all"
              >
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación para eliminar logo */}
      <ConfirmImageDeleteModal
        isOpen={showDeleteLogoConfirm}
        isDeleting={uploadingLogo}
        title="¿Eliminar logo?"
        description="¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer."
        confirmText="Eliminar foto"
        cancelText="Cancelar"
        onClose={() => setShowDeleteLogoConfirm(false)}
        onConfirm={handleRemoveLogo}
      />

      {/* Confirmación para eliminar foto de galería */}
      <ConfirmImageDeleteModal
        isOpen={Boolean(galleryItemToDelete)}
        isDeleting={Boolean(deletingItemId)}
        title="¿Eliminar foto de galería?"
        description="¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer."
        confirmText="Eliminar foto"
        cancelText="Cancelar"
        onClose={() => setGalleryItemToDelete(null)}
        onConfirm={handleConfirmDeleteGalleryItem}
      />

    </div>
  )
}
