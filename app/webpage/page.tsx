'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  ArrowUp,
  ArrowDown,
  Edit2,
  Building2,
  Layers,
  Palette,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { PRESET_THEMES, FONT_OPTIONS, VisualTheme } from '@/lib/themes'
import {
  MOTION_PRESET_LIST,
  MotionStyleId,
  resolveMotionPreset,
  extractMotionConfigFromPage,
} from '@/lib/motion-presets'
import { getPublicPageUrl } from '@/lib/url'
import { ConfirmImageDeleteModal } from '@/components/ui/ConfirmImageDeleteModal'
import { 
  OFFICIAL_BARBEROS_HERO_COVER, 
  OFFICIAL_HERO_COVER_SPECS, 
  DEFAULT_HERO_BANNER,
  BARBEROS_OFFICIAL_COVERS,
  BarberOSCoverTheme,
  DEFAULT_COVER_ID,
  getCoverById,
  resolveCoverBannerUrl,
} from '@/components/public/BannerPresets'
import { DayScheduleItem, DEFAULT_SCHEDULE, parseSchedule, formatTime12h, formatDayHours } from '@/lib/schedule'
import { buildSocialUrl } from '@/lib/socials'
import { validateGoogleMapsUrl, parseLocation } from '@/lib/maps'
import {
  GalleryItem,
  GALLERY_MAX_PER_CATEGORY,
  DEFAULT_GALLERY_CATEGORIES,
  SUGGESTED_EXTRA_CATEGORIES,
  normalizeGalleryCategory,
  getCategoryLabel,
  getUsedCategories,
  sortGallery,
  isLowResolution,
  sanitizeGalleryItem,
} from '@/lib/gallery'

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
  motionStyle: MotionStyleId
  enableScrollSequence: boolean
  sequencePattern: string
  sequenceFrameCount: number
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  whatsapp: string; showWhatsapp: boolean
  showPhone: boolean
  showEmail: boolean
  defaultColorMode: 'dark' | 'light'
  instagram: string; showInstagram: boolean
  facebook: string; showFacebook: boolean
  tiktok: string; showTiktok: boolean
  showPrices: boolean; showTeam: boolean; showServices: boolean
  requireBarber: boolean
  coverTitle: string; coverSubtitle: string
  slogan: string; bannerUrl: string; businessHours: string
  scheduleJson: DayScheduleItem[]
  gallery: GalleryItem[]
  testimonials: Array<{ id: string; name: string; comment: string; rating: number }>
}

export type EditorTabId = 
  | 'identity' 
  | 'appearance' 
  | 'cover' 
  | 'services_gallery' 
  | 'location_hours' 
  | 'contact_socials'

export default function WebpageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewColorMode, setPreviewColorMode] = useState<'dark' | 'light'>('dark')
  const [activeTab, setActiveTab] = useState<EditorTabId>('identity')
  const [businessData, setBusinessData] = useState<any>(null)
  const [businessForm, setBusinessForm] = useState({
    name: '',
    address: '',
    mapsUrl: '',
    phone: '',
    description: '',
    email: '',
  })
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
  const [galleryFilter, setGalleryFilter] = useState<string>('cortes')
  const [customCategories, setCustomCategories] = useState<Array<{ id: string; label: string }>>([])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [renamingCollection, setRenamingCollection] = useState<{ id: string; label: string } | null>(null)
  const [newCollectionLabelInput, setNewCollectionLabelInput] = useState('')
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
    motionStyle: 'CINEMATIC',
    enableScrollSequence: false,
    sequencePattern: '',
    sequenceFrameCount: 60,
    primaryColor: '#09090b', secondaryColor: '#ffffff', accentColor: '#d4af37',
    fontFamily: 'elegante',
    whatsapp: '', showWhatsapp: true,
    showPhone: true,
    showEmail: true,
    defaultColorMode: 'dark',
    instagram: '', showInstagram: true,
    facebook: '', showFacebook: true,
    tiktok: '', showTiktok: true,
    showPrices: true, showTeam: true, showServices: true,
    requireBarber: false,
    coverTitle: '', coverSubtitle: '', slogan: '', bannerUrl: DEFAULT_HERO_BANNER,
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
        businessName: businessForm.name,
        address: businessForm.address,
        mapsUrl: businessForm.mapsUrl,
        phone: businessForm.phone,
        description: businessForm.description,
        email: businessForm.email,
        previewColorMode,
      }, '*')
    }
  }, [pageConfig, logoUrl, businessForm, previewColorMode])

  useEffect(() => {
    const handleIframeReady = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_IFRAME_READY' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'PREVIEW_STATE_UPDATE',
          config: pageConfig,
          logo: logoUrl,
          businessName: businessForm.name,
          address: businessForm.address,
          mapsUrl: businessForm.mapsUrl,
          phone: businessForm.phone,
          description: businessForm.description,
          email: businessForm.email,
          previewColorMode,
        }, '*')
      }
    }
    window.addEventListener('message', handleIframeReady)
    return () => window.removeEventListener('message', handleIframeReady)
  }, [pageConfig, logoUrl, businessForm, previewColorMode])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/owner/webpage', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setBusinessData(data)
          setBusinessForm({
            name: data.name || '',
            address: data.address || '',
            mapsUrl: data.mapsUrl || '',
            phone: data.phone || '',
            description: data.description || '',
            email: data.email || '',
          })
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
            if (!Array.isArray(sanitized.gallery)) {
              sanitized.gallery = []
            } else {
              sanitized.gallery = sanitized.gallery.map((item: any, idx: number) => sanitizeGalleryItem(item, idx))
            }
            if (!Array.isArray(sanitized.testimonials)) {
              sanitized.testimonials = []
            }

            // Resolve canonical official cover from curated catalog
            sanitized.bannerUrl = resolveCoverBannerUrl(sanitized.bannerUrl)

            // Clean legacy welcome coverTitle or redundant exact business name so Hero stays dynamically tied to businessForm.name
            if (
              !sanitized.coverTitle ||
              /^bienvenidos?\s+a\s+/i.test(sanitized.coverTitle) ||
              (data.name && sanitized.coverTitle.trim().toLowerCase() === data.name.trim().toLowerCase())
            ) {
              sanitized.coverTitle = ''
            }
            if (
              sanitized.coverSubtitle ===
              'Reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería diseñada para resaltar tu mejor estilo.'
            ) {
              sanitized.coverSubtitle = ''
            }

            // Parse structured schedule & motion config
            const motionCfg = extractMotionConfigFromPage(sanitized)
            sanitized.motionStyle = motionCfg.motionStyle
            sanitized.enableScrollSequence = motionCfg.enableScrollSequence
            sanitized.sequencePattern = motionCfg.sequencePattern
            sanitized.sequenceFrameCount = motionCfg.sequenceFrameCount
            sanitized.showPhone = motionCfg.showPhone
            sanitized.showEmail = motionCfg.showEmail
            sanitized.defaultColorMode = motionCfg.defaultColorMode
            setPreviewColorMode(sanitized.defaultColorMode)

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

  const setBizField = (key: keyof typeof businessForm, val: string) => {
    setBusinessForm(prev => {
      if (key === 'name') {
        setPageConfig(p => {
          if (p.coverTitle && p.coverTitle.trim() === prev.name.trim()) {
            return { ...p, coverTitle: '' }
          }
          return p
        })
      }
      return { ...prev, [key]: val }
    })
    setHasUnsaved(true)
  }

  const handleSave = async () => {
    if (!businessForm.name.trim()) {
      toast.error('El nombre comercial de la barbería no puede estar vacío.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/owner/webpage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessForm.name.trim(),
          address: businessForm.address.trim(),
          mapsUrl: businessForm.mapsUrl.trim(),
          phone: businessForm.phone.trim(),
          description: businessForm.description.trim(),
          email: businessForm.email.trim(),
          logo: logoUrl,
          page: {
            ...pageConfig,
            coverTitle: '',
            coverSubtitle: '',
            slogan: pageConfig.slogan ? pageConfig.slogan.trim() : '',
            bannerUrl: resolveCoverBannerUrl(pageConfig.bannerUrl),
            showPhone: pageConfig.showPhone,
            showEmail: pageConfig.showEmail,
            defaultColorMode: pageConfig.defaultColorMode,
            businessHours: JSON.stringify(pageConfig.scheduleJson)
          }
        }),
      })
      if (res.ok) {
          const updated = await res.json()
          setBusinessData(updated)
          setBusinessForm({
            name: updated.name || businessForm.name,
            address: updated.address ?? businessForm.address,
            mapsUrl: updated.mapsUrl ?? businessForm.mapsUrl,
            phone: updated.phone ?? businessForm.phone,
            description: updated.description ?? businessForm.description,
            email: updated.email ?? businessForm.email,
          })
          if (updated?.logo !== undefined) {
            setLogoUrl(updated.logo || '')
          }
          if (updated?.page) {
            const serverPage = { ...updated.page }
            const nullableStrings: (keyof PageConfig)[] = [
              'coverTitle', 'coverSubtitle', 'slogan', 'bannerUrl', 'businessHours',
              'whatsapp', 'instagram', 'facebook', 'tiktok'
            ]
            nullableStrings.forEach(k => { if (serverPage[k] === null || serverPage[k] === undefined) (serverPage as any)[k] = '' })
            if (!Array.isArray(serverPage.gallery)) {
              serverPage.gallery = []
            } else {
              serverPage.gallery = serverPage.gallery.map((item: any, idx: number) => sanitizeGalleryItem(item, idx))
            }
            if (!Array.isArray(serverPage.testimonials)) serverPage.testimonials = []
            const motionCfg = extractMotionConfigFromPage(serverPage)
            serverPage.motionStyle = motionCfg.motionStyle
            serverPage.enableScrollSequence = motionCfg.enableScrollSequence
            serverPage.sequencePattern = motionCfg.sequencePattern
            serverPage.sequenceFrameCount = motionCfg.sequenceFrameCount
            serverPage.showPhone = motionCfg.showPhone
            serverPage.showEmail = motionCfg.showEmail
            serverPage.defaultColorMode = motionCfg.defaultColorMode
            serverPage.scheduleJson = parseSchedule(serverPage.scheduleJson || serverPage.businessHours)
            serverPage.businessHours = JSON.stringify(serverPage.scheduleJson)
            serverPage.bannerUrl = resolveCoverBannerUrl(serverPage.bannerUrl)
            setPageConfig((prev: PageConfig) => ({ ...prev, ...serverPage }))
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('business-updated'))
          }
          setHasUnsaved(false)
          toast.success('¡Página web guardada y publicada!')
          setShowSavedModal(true)
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
      setHasUnsaved(true)
    }
  }

  const set = (key: keyof PageConfig, val: unknown) => {
    setPageConfig(prev => ({ ...prev, [key]: val }))
    setHasUnsaved(true)
  }

  const getCatCount = (catId: string) => {
    const norm = normalizeGalleryCategory(catId)
    return (pageConfig.gallery || []).filter(i => normalizeGalleryCategory(i.category) === norm).length
  }

  const allGalleryCategories = useMemo(() => {
    const map = new Map<string, string>()
    for (const def of DEFAULT_GALLERY_CATEGORIES) {
      map.set(def.key, def.label)
    }
    for (const used of getUsedCategories(pageConfig.gallery || [])) {
      if (!map.has(used.key)) {
        map.set(used.key, used.label)
      }
    }
    for (const custom of customCategories) {
      if (!map.has(custom.id)) {
        map.set(custom.id, custom.label)
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [pageConfig.gallery, customCategories])

  const handleAddCustomCategory = (rawLabel?: string) => {
    const label = (rawLabel ?? newCategoryInput).trim()
    if (!label) return
    const id = normalizeGalleryCategory(label)
    if (!customCategories.some(c => c.id === id)) {
      setCustomCategories(prev => [...prev, { id, label }])
    }
    setGalleryFilter(id)
    setNewCategoryInput('')
    toast.success(`Categoría "${label}" creada`)
  }

  const handleExecuteRenameCollection = async () => {
    if (!renamingCollection || !newCollectionLabelInput.trim()) return
    const oldCat = renamingCollection.id
    const newLabel = newCollectionLabelInput.trim()
    try {
      const res = await fetch('/api/owner/webpage/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RENAME_COLLECTION',
          oldCategory: oldCat,
          newCategoryLabel: newLabel,
        }),
      })
      const data = await res.json()
      if (res.ok && data.gallery) {
        setPageConfig(prev => ({
          ...prev,
          gallery: data.gallery.map((g: any, idx: number) => sanitizeGalleryItem(g, idx)),
        }))
        const newSlug = data.newCategorySlug || normalizeGalleryCategory(newLabel)
        setGalleryFilter(newSlug)
        setCustomCategories(prev => {
          const filtered = prev.filter(c => c.id !== oldCat)
          return [...filtered, { id: newSlug, label: newLabel }]
        })
        setRenamingCollection(null)
        setNewCollectionLabelInput('')
        setHasUnsaved(true)
        toast.success(`Colección renombrada a "${newLabel}"`)
      } else {
        toast.error(data.error || 'No se pudo renombrar la colección')
      }
    } catch {
      toast.error('Error al renombrar la colección')
    }
  }

  const updateGalleryItem = (id: string, partial: Partial<GalleryItem>) => {
    setPageConfig(prev => ({
      ...prev,
      gallery: (prev.gallery || []).map(item => {
        if (item.id !== id) return item
        const next = { ...item, ...partial }
        if (partial.title !== undefined) {
          next.caption = partial.title
        }
        if (partial.category !== undefined) {
          const norm = normalizeGalleryCategory(partial.category)
          const foundCat = allGalleryCategories.find(c => c.id === norm)
          next.category = norm
          next.categoryLabel = foundCat?.label || partial.categoryLabel || getCategoryLabel(norm, prev.gallery)
        }
        return next
      })
    }))
    setHasUnsaved(true)
  }

  const moveGalleryItem = async (id: string, direction: 'up' | 'down') => {
    const sorted = sortGallery(pageConfig.gallery || [])
    const activeCat = normalizeGalleryCategory(galleryFilter)
    const catItems = sorted.filter(i => normalizeGalleryCategory(i.category) === activeCat)
    const idx = catItems.findIndex(i => i.id === id)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= catItems.length) return

    const newCatItems = [...catItems]
    const temp = newCatItems[idx]
    newCatItems[idx] = newCatItems[swapIdx]
    newCatItems[swapIdx] = temp

    const orderMap = new Map<string, number>()
    newCatItems.forEach((item, index) => {
      orderMap.set(item.id, index)
    })

    const updated = (pageConfig.gallery || []).map(item => {
      if (orderMap.has(item.id)) {
        return { ...item, order: orderMap.get(item.id)! }
      }
      return item
    })

    const sortedUpdated = sortGallery(updated)
    setPageConfig(prev => ({ ...prev, gallery: sortedUpdated }))
    setHasUnsaved(true)

    // Sincronizar reordenamiento al servidor
    try {
      await fetch('/api/owner/webpage/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REORDER',
          items: newCatItems.map((it, i) => ({ id: it.id, order: i })),
        }),
      })
    } catch {
      // Estado local ya actualizado
    }
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
        toast.success('Logo actualizado correctamente.')
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
        toast.success('Logo eliminado correctamente.')
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
    targetCategory: string
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const normCat = normalizeGalleryCategory(targetCategory)
    const catLabel = allGalleryCategories.find(c => c.id === normCat)?.label || getCategoryLabel(normCat)
    const currentCount = getCatCount(normCat)
    const availableQuota = GALLERY_MAX_PER_CATEGORY - currentCount

    if (availableQuota <= 0) {
      toast.error(`La categoría "${catLabel}" ya alcanzó el límite máximo de ${GALLERY_MAX_PER_CATEGORY} fotos. Elimina una para subir otra.`)
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
      return
    }

    const filesArray = Array.from(files)
    if (filesArray.length > availableQuota) {
      toast.error(`Solo puedes subir ${availableQuota} foto(s) más en "${catLabel}". Has seleccionado ${filesArray.length}.`)
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
    formData.append('category', normCat)
    formData.append('categoryLabel', catLabel)
    filesArray.forEach(f => formData.append('files', f))

    try {
      const res = await fetch('/api/owner/webpage/gallery', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok && data.gallery) {
        setPageConfig(prev => ({
          ...prev,
          gallery: data.gallery.map((item: any, idx: number) => sanitizeGalleryItem(item, idx)),
        }))
        setHasUnsaved(true)
        toast.success('Fotografía(s) cargada(s) correctamente.')
      } else {
        toast.error(data.error || 'No se pudo subir la foto. Inténtalo de nuevo.')
      }
    } catch (err) {
      console.error(err)
      toast.error('No se pudo subir la foto. Inténtalo de nuevo.')
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
    const category = item ? normalizeGalleryCategory(item.category) : 'cortes'
    const categoryLabel = item?.categoryLabel || getCategoryLabel(category)

    setUploadingGallery(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('replaceId', itemId)
    formData.append('category', category)
    formData.append('categoryLabel', categoryLabel)
    if (item?.title) formData.append('title', item.title)
    if (item?.serviceId) formData.append('serviceId', item.serviceId)

    try {
      const res = await fetch('/api/owner/webpage/gallery', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok && data.gallery) {
        setPageConfig(prev => ({
          ...prev,
          gallery: data.gallery.map((g: any, idx: number) => sanitizeGalleryItem(g, idx)),
        }))
        setHasUnsaved(true)
        toast.success('Foto reemplazada correctamente.')
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
        setPageConfig(prev => ({
          ...prev,
          gallery: data.gallery.map((g: any, idx: number) => sanitizeGalleryItem(g, idx)),
        }))
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
      { id: '1', name: 'Andrés Morales', comment: 'Excelente corte y atención puntual. El ambiente de la barbería es impecable.', rating: 5 },
      { id: '2', name: 'Camilo Restrepo', comment: 'Gran precisión en el perfilado de barba y trato muy profesional.', rating: 5 },
      { id: '3', name: 'Sebastián Gómez', comment: 'Reservar por la web fue rapidísimo y me atendieron a la hora exacta.', rating: 5 },
    ]
    setPageConfig(prev => ({ ...prev, testimonials: defaults }))
    setHasUnsaved(true)
    toast.success('Ejemplos de reseñas cargados — edítalos con opiniones reales de tus clientes')
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

  const bizName = businessForm.name.trim() || businessData?.name || 'Mi Barbería'
  const bizSlug = businessData?.slug || 'barberia'
  const bizPath = `/b/${bizSlug}`
  const bizUrl = getPublicPageUrl(bizSlug)

  const currentTheme = PRESET_THEMES.find(t => t.id === pageConfig.theme) || PRESET_THEMES[0]
  const currentFont = FONT_OPTIONS.find(f => f.id === pageConfig.fontFamily) || FONT_OPTIONS[0]

  // Google Maps URL validation & interactive preview
  const mapsValidation = useMemo(() => {
    if (!businessForm.mapsUrl.trim()) return null
    return validateGoogleMapsUrl(businessForm.mapsUrl)
  }, [businessForm.mapsUrl])

  const locationPreview = useMemo(() => {
    return parseLocation(businessForm.mapsUrl || businessForm.address, businessForm.name, businessForm.address)
  }, [businessForm.mapsUrl, businessForm.address, businessForm.name])

  const registeredServices = Array.isArray(businessData?.services) ? businessData.services : []

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
                className="panel-btn-accent px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar
              </button>
            </div>
          </div>

          {/* URL con botón de copiar rápido */}
          <div className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5">
            <a href={bizUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 group flex-1 truncate"
              title="Abrir enlace">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-400" />
              <span className="text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors truncate">
                {bizUrl}
              </span>
            </a>
            <button
              onClick={copyUrl}
              className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 px-2 py-1 rounded-md transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* 6 Pestañas de Secciones Claras (Fase 10) */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto bg-zinc-50 dark:bg-[#141418] scrollbar-none">
          {[
            { id: 'identity', label: '1. Identidad' },
            { id: 'appearance', label: '2. Apariencia' },
            { id: 'cover', label: '3. Portada' },
            { id: 'services_gallery', label: '4. Servicios & Galería' },
            { id: 'location_hours', label: '5. Ubicación & Horarios' },
            { id: 'contact_socials', label: '6. Contacto & Redes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EditorTabId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'panel-pill-active font-black shadow-xs' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del Panel Activo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ════════════════════════════════════════════════════════
              1. IDENTIDAD DEL NEGOCIO (Fase 2)
          ════════════════════════════════════════════════════════ */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              {/* Logo Oficial de la Barbería */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-zinc-700" /> Logo Oficial de la Barbería
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Aparece en la barra superior, pie de página y comprobantes
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    logoUrl 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}>
                    {logoUrl ? 'Foto configurada' : 'Sin logo'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-zinc-200">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white relative overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200 shadow-xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover object-center" />
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
                      {logoUrl ? 'Logo cargado en alta resolución' : 'Sube tu logo para personalizar tu página'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Formatos: PNG, JPG, WEBP o SVG (máx 5MB).
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
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 panel-btn-accent px-3.5 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-50 cursor-pointer shadow-xs"
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

              {/* Formulario Principal de Identidad */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-700" /> Información Comercial Central
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                    Fuente única de verdad de tu barbería. Se proyecta automáticamente en todos los módulos.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                    Nombre Comercial de la Barbería <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={e => setBizField('name', e.target.value)}
                    placeholder="Ej: Barbería Studio Central"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1">
                    Nombre oficial del establecimiento. Cambiarlo aquí actualiza la portada, navegación y recibos.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                    Descripción Breve del Negocio
                  </label>
                  <textarea
                    rows={3}
                    value={businessForm.description}
                    onChange={e => setBizField('description', e.target.value)}
                    placeholder="Describe en pocas líneas el concepto, estilo y propuesta de valor de tu barbería..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-900 resize-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1">
                    Se utiliza en la sección Sobre Nosotros y metadatos compartibles.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                    Eslogan o Frase Distintiva <span className="text-zinc-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={pageConfig.slogan}
                    onChange={e => set('slogan', e.target.value)}
                    placeholder="Ej: Cortes de precisión y afeitado tradicional"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1">
                    Aparece con tipografía elegante como subtítulo distintivo en la portada, sin competir con el nombre.
                  </span>
                </div>

                {/* Canales de Contacto con Visibilidad Independiente (Fase 2) */}
                <div className="space-y-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                    Canales de Contacto & Visibilidad Pública
                  </span>

                  {/* Teléfono */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Teléfono Público
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                          {pageConfig.showPhone ? 'Visible en web' : 'Oculto'}
                        </span>
                        <button
                          type="button"
                          onClick={() => set('showPhone', !pageConfig.showPhone)}
                          className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${
                            pageConfig.showPhone
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                              : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}
                          title="Mostrar u ocultar teléfono en la página pública"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 shadow-xs transition-all ${
                              pageConfig.showPhone ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={businessForm.phone}
                      onChange={e => setBizField('phone', e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                      Si el switch está desactivado o el campo está vacío, no se mostrará ningún botón ni dato telefónico en la web pública.
                    </span>
                  </div>

                  {/* Correo Electrónico */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-600 dark:text-zinc-300">@</span>
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Correo Electrónico Público
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                          {pageConfig.showEmail ? 'Visible en web' : 'Oculto'}
                        </span>
                        <button
                          type="button"
                          onClick={() => set('showEmail', !pageConfig.showEmail)}
                          className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${
                            pageConfig.showEmail
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                              : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}
                          title="Mostrar u ocultar correo en la página pública"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 shadow-xs transition-all ${
                              pageConfig.showEmail ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <input
                      type="email"
                      value={businessForm.email}
                      onChange={e => setBizField('email', e.target.value)}
                      placeholder="contacto@mibarberia.com"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                      Si el switch está desactivado o el campo está vacío, el correo quedará completamente oculto de la web pública.
                    </span>
                  </div>

                  {/* WhatsApp */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 text-[#25d366]">
                          <WhatsAppIcon />
                        </div>
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          WhatsApp de Reservas & Atención
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                          {pageConfig.showWhatsapp ? 'Visible en web' : 'Oculto'}
                        </span>
                        <button
                          type="button"
                          onClick={() => set('showWhatsapp', !pageConfig.showWhatsapp)}
                          className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${
                            pageConfig.showWhatsapp
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                              : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}
                          title="Mostrar u ocultar botón de WhatsApp"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 shadow-xs transition-all ${
                              pageConfig.showWhatsapp ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={pageConfig.whatsapp}
                      onChange={e => set('whatsapp', e.target.value)}
                      placeholder="+57 300 123 4567 o https://wa.link/mi-barberia"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-amber-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                      Solo se mostrará el botón flotante y el acceso a chat si el switch está activo y contiene un número o enlace válido.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              2. APARIENCIA, TEMAS & TIPOGRAFÍAS (Fase 3)
          ════════════════════════════════════════════════════════ */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Modo de Color Predeterminado para Visitantes (Fase 3) */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xs">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-500" /> Modo de Color Predeterminado del Negocio
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">
                    Define la apariencia visual inicial con la que se exhibe tu barbería a visitantes nuevos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      set('defaultColorMode', 'dark')
                      setPreviewColorMode('dark')
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                      pageConfig.defaultColorMode === 'dark'
                        ? 'bg-zinc-950 dark:bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Oscuro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      set('defaultColorMode', 'light')
                      setPreviewColorMode('light')
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                      pageConfig.defaultColorMode === 'light'
                        ? 'bg-white dark:bg-zinc-200 text-zinc-950 shadow-sm ring-1 ring-zinc-300'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Claro</span>
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  Los visitantes siempre podrán alternar entre modo claro u oscuro mediante el botón de sol/luna en la barra superior. Su preferencia personal se recordará en su dispositivo en visitas futuras.
                </p>
              </div>

              {/* 10 Temas Luxury */}
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
                  Cada tema define contrastes de autor, tarjetas de servicio, degradados y acentos lumínicos.
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {PRESET_THEMES.map(t => {
                    const isSelected = pageConfig.theme === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTheme(t.id)}
                        className={`p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected ? 'panel-card-selected shadow-xs' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#141418]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex w-10 h-7 rounded-lg overflow-hidden border border-black/10 gap-0.5 shadow-2xs">
                            <div className="flex-1" style={{ backgroundColor: t.primary }} />
                            <div className="w-2.5" style={{ backgroundColor: t.secondary }} />
                            <div className="w-2.5" style={{ backgroundColor: t.accent }} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-zinc-900 dark:text-white block">{t.name}</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{t.description}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full panel-btn-accent flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tipografías & Maridajes */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Tipografías & Maridajes (Google Fonts)
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    5 Estilos Curados
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  Combina una fuente de títulos con una fuente de lectura para máxima jerarquía visual.
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
                            ? 'panel-card-selected shadow-xs' 
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#141418]'
                        }`}
                      >
                        <div className="flex-1 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight" 
                              style={{ fontFamily: font.headingFont }}
                            >
                              {font.name}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                              {font.category}
                            </span>
                          </div>
                          <span 
                            className="text-xs text-zinc-700 dark:text-zinc-300 font-medium block mb-1" 
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
                          <div className="w-5 h-5 rounded-full panel-btn-accent flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dirección de Movimiento (Motion Sites) */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                      Dirección de Movimiento
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                    Motion Sites Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  Transiciones y cadencia cinemática adaptadas al tema elegido.
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {MOTION_PRESET_LIST.map((preset) => {
                    const isSelected = (pageConfig.motionStyle || 'CINEMATIC') === preset.id
                    const recommendedForTheme =
                      resolveMotionPreset(null, pageConfig.theme).id === preset.id

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => set('motionStyle', preset.id)}
                        className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'panel-card-selected shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#141418]'
                        }`}
                      >
                        <div className="flex-1 pr-3">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-xs font-black text-zinc-900 dark:text-white">
                              {preset.name}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700">
                              {preset.badge}
                            </span>
                            {recommendedForTheme && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Recomendado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full panel-btn-accent flex items-center justify-center shrink-0 shadow-xs">
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

          {/* ════════════════════════════════════════════════════════
              3. PORTADA — SELECCIÓN DE IMAGEN PREDETERMINADA
          ════════════════════════════════════════════════════════ */}
          {activeTab === 'cover' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Portada
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                    Selecciona la imagen que aparecerá en la portada de tu página web.
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                    El nombre comercial, el eslogan y la descripción se administran directamente desde la sección <strong className="text-zinc-700 dark:text-zinc-300">Identidad</strong>.
                  </p>
                </div>

                {/* Si hay una portada personalizada histórica que no coincide con las oficiales, se conserva y muestra */}
                {(() => {
                  const hasCustomCover =
                    pageConfig.bannerUrl &&
                    !BARBEROS_OFFICIAL_COVERS.some(
                      c => c.url === pageConfig.bannerUrl || c.id === pageConfig.bannerUrl
                    )

                  if (!hasCustomCover) return null

                  const isCustomSelected =
                    !BARBEROS_OFFICIAL_COVERS.some(
                      c => c.url === pageConfig.bannerUrl || c.id === pageConfig.bannerUrl
                    )

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => set('bannerUrl', pageConfig.bannerUrl)}
                      className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer flex flex-col focus:outline-none mb-3 ${
                        isCustomSelected
                          ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 dark:ring-amber-400/30 shadow-lg shadow-amber-500/10 bg-white dark:bg-[#141418]'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#141418]'
                      }`}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                        <img
                          src={pageConfig.bannerUrl}
                          alt="Portada personalizada actual"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20">
                            Tu Portada Personalizada
                          </span>
                        </div>
                        {isCustomSelected && (
                          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md z-10">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="p-3.5 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Portada personalizada actual
                          </span>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Referencia previa conservada. Si eliges una portada predeterminada de abajo, puedes volver a cambiarla cuando quieras.
                          </p>
                        </div>
                        {isCustomSelected && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                            Activa
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Grilla de Portadas Prediseñadas Oficiales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {BARBEROS_OFFICIAL_COVERS.map((cover) => {
                    const isSelected =
                      pageConfig.bannerUrl === cover.url ||
                      pageConfig.bannerUrl === cover.id ||
                      (!pageConfig.bannerUrl && cover.id === DEFAULT_COVER_ID)

                    return (
                      <div
                        key={cover.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          set('bannerUrl', cover.url)
                          set('motionStyle', cover.motionStyle)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            set('bannerUrl', cover.url)
                            set('motionStyle', cover.motionStyle)
                          }
                        }}
                        className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer flex flex-col focus:outline-none ${
                          isSelected
                            ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 dark:ring-amber-400/30 shadow-lg shadow-amber-500/10 bg-white dark:bg-[#141418]'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#141418] hover:bg-zinc-50/70 dark:hover:bg-[#181820]'
                        }`}
                      >
                        {/* Miniatura 16:9 con Badge */}
                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                          <img
                            src={cover.url}
                            alt={cover.title}
                            className={`w-full h-full object-cover transition-transform duration-500 ${
                              isSelected ? 'scale-105' : 'group-hover:scale-105 opacity-90 group-hover:opacity-100'
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                          {/* Badge de estilo / recomendación */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20">
                              {cover.badge}
                            </span>
                            {cover.recommended && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-xs">
                                Sugerido
                              </span>
                            )}
                          </div>

                          {/* Checkmark de Selección Activa */}
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md z-10">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>
                          )}

                          {/* Iluminación & Motion Badge sobre la imagen */}
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-zinc-300 font-medium z-10">
                            <span className="truncate">{cover.lighting}</span>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/10 shrink-0 ml-1">
                              {cover.motionStyle}
                            </span>
                          </div>
                        </div>

                        {/* Metadatos y Descripción */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-black uppercase tracking-wider ${
                              isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-zinc-100'
                            }`}>
                              {cover.title}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Seleccionada
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-2 text-zinc-600 dark:text-zinc-400">
                            {cover.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              4. SERVICIOS & GALERÍA DE COLECCIONES (Fase 5 y 6)
          ════════════════════════════════════════════════════════ */}
          {activeTab === 'services_gallery' && (
            <div className="space-y-6">
              {/* Sección A: Servicios Activos Registrados en BarberOS */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-zinc-700" /> Servicios Activos Registrados
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Refleja automáticamente los servicios configurados en tu catálogo oficial.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {registeredServices.length} activos
                  </span>
                </div>

                {registeredServices.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {registeredServices.slice(0, 6).map((srv: any) => (
                      <div key={srv.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-zinc-900 block truncate">{srv.name}</span>
                          <span className="text-[10px] text-zinc-400 capitalize">{srv.category || 'General'} • {srv.duration} min</span>
                        </div>
                        <span className="font-mono font-black text-zinc-800 shrink-0">
                          ${Number(srv.price).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    ))}
                    {registeredServices.length > 6 && (
                      <p className="text-[10px] text-zinc-400 text-center font-medium">
                        + {registeredServices.length - 6} servicios más visibles en tu página pública
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-zinc-50 rounded-xl border border-zinc-200/80">
                    <p className="text-xs text-zinc-500">No tienes servicios activos configurados.</p>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Precios, duraciones y fotos de servicios se gestionan en Finanzas & Servicios.
                  </span>
                  <Link
                    href="/services"
                    className="text-xs font-black text-zinc-900 hover:text-black flex items-center gap-1 underline underline-offset-2 shrink-0 ml-2"
                  >
                    Administrar Servicios <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Sección B: Galería de Colecciones (Máx 6 por categoría) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-700" /> Galería de Colecciones
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Máximo {GALLERY_MAX_PER_CATEGORY} fotografías por colección. Sin fotos inventadas.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 bg-white border border-zinc-200 px-2.5 py-1 rounded-full shadow-2xs">
                    {pageConfig.gallery?.length || 0} fotos activas
                  </span>
                </div>

                {/* Quota cards clicables para cambiar de categoría */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-200/80">
                  {allGalleryCategories.map(cat => {
                    const count = getCatCount(cat.id)
                    const isSelected = normalizeGalleryCategory(galleryFilter) === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setGalleryFilter(cat.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'panel-card-selected shadow-sm'
                            : count >= GALLERY_MAX_PER_CATEGORY
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900 hover:border-amber-300'
                            : 'bg-white dark:bg-[#141418] border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-wider block truncate ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {cat.label}
                        </span>
                        <span className="text-xs font-black block mt-0.5">
                          {count} <span className="text-[10px] font-medium text-zinc-400">/ {GALLERY_MAX_PER_CATEGORY}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Crear nueva categoría / colección */}
                <div className="pt-2 border-t border-zinc-200/70 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Nueva colección personalizada:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_EXTRA_CATEGORIES.filter(s => !allGalleryCategories.some(c => c.id === normalizeGalleryCategory(s))).map(sug => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddCustomCategory(sug)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-950 transition-all cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={e => setNewCategoryInput(e.target.value)}
                      placeholder="Ej: Colorimetría, Barbería VIP..."
                      className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomCategory()}
                      disabled={!newCategoryInput.trim()}
                      className="px-3 py-1.5 rounded-xl panel-btn-accent text-xs font-black disabled:opacity-40 cursor-pointer"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenedor principal de la categoría activa */}
              {(() => {
                const activeCat = normalizeGalleryCategory(galleryFilter === 'todos' ? 'cortes' : galleryFilter)
                const activeCatObj = allGalleryCategories.find(c => c.id === activeCat) || {
                  id: activeCat,
                  label: getCategoryLabel(activeCat),
                }
                const catCount = getCatCount(activeCat)
                const isFull = catCount >= GALLERY_MAX_PER_CATEGORY
                const availableQuota = GALLERY_MAX_PER_CATEGORY - catCount

                const defaultDescriptions: Record<string, string> = {
                  cortes: 'Muestra degradados, cortes clásicos y estilos reales realizados en tu barbería.',
                  barbas: 'Perfilado de barba, afeitado tradicional y rituales de toalla caliente.',
                  instalaciones: 'Sillones, estaciones de trabajo, iluminación y ambiente de tu local.',
                }
                const catDesc = defaultDescriptions[activeCat] || `Fotografías reales de la colección ${activeCatObj.label}.`

                const sortedAll = sortGallery(pageConfig.gallery || [])
                const visibleItems = sortedAll.filter(item => normalizeGalleryCategory(item.category) === activeCat)
                const availableServices = registeredServices

                return (
                  <div className="space-y-4">
                    {/* Header de la categoría con acciones */}
                    <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs space-y-3 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">
                            {activeCatObj.label}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingCollection(activeCatObj)
                              setNewCollectionLabelInput(activeCatObj.label)
                            }}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded-md transition-colors shrink-0 cursor-pointer"
                            title="Renombrar esta colección"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isFull
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {catCount} / {GALLERY_MAX_PER_CATEGORY} fotos
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {catDesc}
                      </p>

                      {/* Botón para subir fotos cuando la colección ya tiene contenido */}
                      {visibleItems.length > 0 && (
                        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          {isFull ? (
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium text-center">
                              Límite de {GALLERY_MAX_PER_CATEGORY} fotos alcanzado en esta colección.
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={uploadingGallery}
                              onClick={() => galleryFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black panel-btn-accent cursor-pointer active:scale-95 transition-all shadow-xs"
                            >
                              {uploadingGallery ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" /> Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload size={13} /> Subir más fotos a {activeCatObj.label} ({availableQuota} disponibles)
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Modal/Formulario inline para renombrar colección */}
                      {renamingCollection?.id === activeCatObj.id && (
                        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-2">
                          <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                            Renombrar Colección "{activeCatObj.label}"
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newCollectionLabelInput}
                              onChange={e => setNewCollectionLabelInput(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none"
                              placeholder="Nuevo nombre de colección"
                            />
                            <button
                              type="button"
                              onClick={handleExecuteRenameCollection}
                              className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingCollection(null)}
                              className="px-2 py-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-medium cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input nativo de subida de fotos */}
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={e => handleUploadGalleryPhotos(e, activeCat)}
                      className="hidden"
                    />

                    {/* Input oculto para la acción de reemplazo */}
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleExecuteReplace}
                      className="hidden"
                    />

                    {/* Lista editable de fotos de la categoría o Zona única de subida si está vacía */}
                    {visibleItems.length === 0 ? (
                      <div
                        onClick={() => !uploadingGallery && galleryFileInputRef.current?.click()}
                        className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-all text-center flex flex-col items-center justify-center space-y-3 cursor-pointer group overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 max-w-xs">
                          <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                            Subir fotos a {activeCatObj.label}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Haz clic aquí para seleccionar hasta {GALLERY_MAX_PER_CATEGORY} fotos desde tu dispositivo (JPG, PNG o WebP).
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={uploadingGallery}
                          className="flex items-center gap-2 panel-btn-accent text-xs font-black px-4 py-2 rounded-xl transition-all shadow-xs pointer-events-none"
                        >
                          {uploadingGallery ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload size={13} /> Seleccionar fotografías
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleItems.map((item, idx) => {
                          const isBeingReplaced = replacingItemId === item.id
                          const isBeingDeleted = deletingItemId === item.id
                          const lowRes = isLowResolution(item)

                          return (
                            <div
                              key={item.id}
                              className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-2xs space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                            >
                              <div className="flex items-start gap-3.5">
                                <div className="relative w-24 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800">
                                  <img
                                    src={item.url}
                                    alt={item.title || activeCatObj.label}
                                    className="w-full h-full object-cover"
                                  />
                                  {(isBeingReplaced || isBeingDeleted) && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                                      <Loader2 size={16} className="animate-spin" />
                                    </div>
                                  )}
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 text-white text-[9px] font-mono font-bold">
                                    #{idx + 1}
                                  </span>
                                </div>

                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => moveGalleryItem(item.id, 'up')}
                                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                        title="Mover antes"
                                      >
                                        <ArrowUp size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === visibleItems.length - 1}
                                        onClick={() => moveGalleryItem(item.id, 'down')}
                                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                        title="Mover después"
                                      >
                                        <ArrowDown size={12} />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        disabled={isBeingReplaced || isBeingDeleted || uploadingGallery}
                                        onClick={() => handleTriggerReplace(item.id)}
                                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1 cursor-pointer"
                                      >
                                        <RefreshCw size={11} /> Reemplazar
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isBeingReplaced || isBeingDeleted || uploadingGallery}
                                        onClick={() => setGalleryItemToDelete(item.id)}
                                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                        title="Eliminar foto"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <input
                                      type="text"
                                      value={item.title ?? ''}
                                      onChange={e => updateGalleryItem(item.id, { title: e.target.value })}
                                      placeholder="Título opcional (vacío = sin etiqueta)"
                                      className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                                        Categoría
                                      </label>
                                      <select
                                        value={normalizeGalleryCategory(item.category)}
                                        onChange={e => updateGalleryItem(item.id, { category: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                                      >
                                        {allGalleryCategories.map(c => (
                                          <option key={c.id} value={c.id}>
                                            {c.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                                        Servicio asociado (opcional)
                                      </label>
                                      <select
                                        value={item.serviceId || ''}
                                        onChange={e => updateGalleryItem(item.id, { serviceId: e.target.value || undefined })}
                                        className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                                      >
                                        <option value="">Ninguno (solo categoría)</option>
                                        {availableServices.map((srv: any) => (
                                          <option key={srv.id} value={srv.id}>
                                            {srv.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {lowRes && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                  <AlertCircle size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                  <span>
                                    Resolución baja ({item.width || '?'}×{item.height || '?'}px). Te sugerimos reemplazarla por una foto de al menos 1000px.
                                  </span>
                                </div>
                              )}
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

          {/* ════════════════════════════════════════════════════════
              5. UBICACIÓN & HORARIOS SEMANALES (Fase 7 y 8)
          ════════════════════════════════════════════════════════ */}
          {activeTab === 'location_hours' && (
            <div className="space-y-6">
              {/* Sección A: Ubicación Física y Google Maps */}
              <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" /> Ubicación & Google Maps
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    Configura la dirección física y el mapa interactivo para que tus clientes lleguen fácilmente.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                    Dirección Física del Local
                  </label>
                  <input
                    type="text"
                    value={businessForm.address}
                    onChange={e => setBizField('address', e.target.value)}
                    placeholder="Ej: Calle 85 # 14-20, Barrio Chicó, Bogotá"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-1">
                    Dirección legible que se muestra en la sección Visítanos y pie de página.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                    Enlace de Compartir o Código Iframe de Google Maps
                  </label>
                  <input
                    type="text"
                    value={businessForm.mapsUrl}
                    onChange={e => setBizField('mapsUrl', e.target.value)}
                    placeholder="https://maps.app.goo.gl/... o código <iframe> de Google Maps"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-1">
                    Acepta enlaces cortos <code>maps.app.goo.gl</code>, enlaces de navegador o código embed copiado de Google Maps.
                  </span>
                </div>

                {/* Feedback de validación de Google Maps */}
                {mapsValidation && (
                  <div>
                    {mapsValidation.isValid ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Enlace de Google Maps verificado y seguro.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>{mapsValidation.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Previsualización del mapa si locationPreview tiene embedUrl */}
                {locationPreview?.embedUrl && (
                  <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Vista previa del mapa interactivo:
                    </span>
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 shadow-xs">
                      <iframe
                        src={locationPreview.embedUrl}
                        title="Vista previa del mapa"
                        className="w-full h-full border-0"
                        loading="lazy"
                      />
                    </div>
                    {locationPreview.directionsUrl && (
                      <a
                        href={locationPreview.directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Probar enlace de "Cómo llegar" en nueva pestaña
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Sección B: Horarios Semanales Completos */}
              <div className="bg-zinc-50 dark:bg-[#101014] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Horarios Semanales de Atención
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/80">
                    Sincronización en Vivo
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Configura cada día de la semana. Los días cerrados se reflejan en el motor de reservas y en el calendario.
                </p>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200/70 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => copyDayToWeekdays(1)}
                    className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3 h-3 text-zinc-500" />
                    Copiar Lunes a Lun-Sáb
                  </button>
                  <button
                    type="button"
                    onClick={applyDefaultHours}
                    className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Restablecer por defecto
                  </button>
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
                            ? 'bg-white dark:bg-[#141418] border-zinc-200 dark:border-zinc-800 shadow-2xs'
                            : 'bg-zinc-50 dark:bg-[#0d0d10] border-zinc-200/70 dark:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-sm font-black text-zinc-900 dark:text-white shrink-0 min-w-[72px]">
                              {item.day}
                            </span>
                            {item.isOpen ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 whitespace-nowrap shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                                <span className="whitespace-nowrap">{formattedOpen} – {formattedClose}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 whitespace-nowrap shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="whitespace-nowrap">{item.customMessage?.trim() || 'Cerrado'}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${
                              item.isOpen ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'
                            }`}>
                              {item.isOpen ? 'Abierto' : 'Cerrado'}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDaySchedule(item.dayIndex, { isOpen: !item.isOpen })}
                              className={`w-11 h-6 rounded-full transition-all relative cursor-pointer shrink-0 ${
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

                        {item.isOpen ? (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                                Apertura
                              </label>
                              <input
                                type="time"
                                value={item.openTime}
                                onChange={e => updateDaySchedule(item.dayIndex, { openTime: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-semibold text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                                Cierre
                              </label>
                              <input
                                type="time"
                                value={item.closeTime}
                                onChange={e => updateDaySchedule(item.dayIndex, { closeTime: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-semibold text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1">
                            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                              Mensaje personalizado para este día cerrado
                            </label>
                            <input
                              type="text"
                              value={item.customMessage || ''}
                              onChange={e => updateDaySchedule(item.dayIndex, { customMessage: e.target.value })}
                              placeholder="Ej: Cerrado por descanso del equipo"
                              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              6. CONTACTO, REDES & TESTIMONIOS (Fase 2, 8 y 10)
          ════════════════════════════════════════════════════════ */}
          {activeTab === 'contact_socials' && (
            <div className="space-y-6">
              {/* Canales y Redes Sociales */}
              <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" /> Canales Oficiales & Redes Sociales
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    Solo los canales que actives con el interruptor aparecerán en tu página pública.
                  </p>
                </div>

                <div className="space-y-3">
                  {SOCIAL_NETWORKS.map(net => {
                    const urlVal = ((pageConfig as any)[net.key] ?? '') as string
                    const showVal = (pageConfig as any)[net.showKey] as boolean
                    const resolvedUrl = buildSocialUrl(net.key, urlVal)

                    return (
                      <div key={net.key} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-2xs" style={{ backgroundColor: net.color }}>
                              {net.icon}
                            </div>
                            <div>
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 block">{net.label}</span>
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
                            title={showVal ? 'Desactivar canal' : 'Activar canal'}
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
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                        />

                        {urlVal.trim() && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Redirige a:</span>
                            <a
                              href={resolvedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[280px] inline-flex items-center gap-1"
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

              {/* Testimonios & Reseñas de Clientes */}
              <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Reseñas de Clientes
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                      Agrega o edita testimonios reales para reforzar la credibilidad de tu página.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applyDefaultTestimonials}
                    className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Restablecer 3
                  </button>
                </div>

                {/* Formulario para añadir nueva reseña */}
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30 space-y-3">
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Añadir Reseña de Cliente
                  </span>
                  <input
                    type="text"
                    value={newTestimonialName}
                    onChange={e => setNewTestimonialName(e.target.value)}
                    placeholder="Nombre del cliente (ej: Santiago Vélez)"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                  <textarea
                    rows={2}
                    value={newTestimonialComment}
                    onChange={e => setNewTestimonialComment(e.target.value)}
                    placeholder="Comentario o experiencia del cliente..."
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-none"
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
                          <Star className={`w-4 h-4 ${star <= newTestimonialRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addTestimonialItem}
                      className="panel-btn-accent text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Añadir Reseña
                    </button>
                  </div>
                </div>

                {/* Lista de testimonios actuales */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    Reseñas Activas ({pageConfig.testimonials?.length || 0})
                  </span>

                  {pageConfig.testimonials && pageConfig.testimonials.length > 0 ? (
                    pageConfig.testimonials.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => updateTestimonialItem(item.id, { rating: star })}
                                className="cursor-pointer"
                                title={`Cambiar a ${star} estrellas`}
                              >
                                <Star className={`w-3.5 h-3.5 ${star <= (item.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTestimonialItem(item.id)}
                            className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                            title="Eliminar testimonio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => updateTestimonialItem(item.id, { name: e.target.value })}
                            placeholder="Nombre del cliente"
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-950 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                          />
                        </div>

                        <div>
                          <textarea
                            rows={2}
                            value={item.comment}
                            onChange={e => updateTestimonialItem(item.id, { comment: e.target.value })}
                            placeholder="Escribe el testimonio aquí..."
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-none"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-center">
                      <p className="text-xs text-zinc-400 italic mb-2">No hay testimonios agregados.</p>
                      <button
                        type="button"
                        onClick={applyDefaultTestimonials}
                        className="text-xs font-bold text-zinc-900 dark:text-zinc-100 underline cursor-pointer"
                      >
                        Cargar testimonios por defecto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════ PREVIEW REAL — IFRAME de la página publicada ══════════════ */}
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

            {/* Selector de Modo de Color para Preview */}
            <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
              <button
                type="button"
                onClick={() => setPreviewColorMode('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewColorMode === 'dark' ? 'bg-zinc-700 text-amber-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Previsualizar en tema oscuro"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Oscuro</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewColorMode('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewColorMode === 'light' ? 'bg-zinc-200 text-zinc-900 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Previsualizar en tema claro"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Claro</span>
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

        {/* Contenedor del iframe real */}
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

            {/* IFRAME con scroll, animaciones y sync en vivo */}
            <div className="flex-1 relative rounded-b-2xl overflow-hidden border border-white/5 border-t-0 shadow-2xl bg-zinc-950">
              {loading || !businessData?.slug ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Cargando vista previa en vivo...</span>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  key={`${iframeKey}-${businessData.slug}`}
                  src={bizPath}
                  className="w-full h-full border-0 block"
                  title="Preview — Página publicada de tu barbería"
                  loading="eager"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de publicación con enlace público */}
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
