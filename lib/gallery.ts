/**
 * BARBEROS — Modelo y utilidades de la galería pública de cada barbería.
 *
 * La galería se guarda como JSON en `BusinessPage.gallery` (aislada por negocio),
 * por lo que los nuevos campos opcionales NO requieren migración de base de datos
 * y los registros antiguos siguen siendo válidos.
 *
 * Principio rector: nunca mostrar información inventada. Una foto solo muestra un
 * título si el propietario lo escribió, o el nombre de un servicio real asociado.
 */

export interface GalleryItem {
  id: string
  url: string
  publicId?: string
  /** Campo legado. Puede contener nombres de archivo o textos de demostración. */
  caption?: string
  /** Título personalizado escrito por el propietario (opcional). */
  title?: string
  /** Descripción opcional escrita por el propietario. */
  description?: string
  /** Clave de categoría (slug). Predeterminadas: cortes, barbas, instalaciones. */
  category: string
  /** Nombre visible de una categoría personalizada. */
  categoryLabel?: string
  /** Servicio real de BarberOS asociado (opcional). */
  serviceId?: string | null
  /** Orden de presentación (menor = primero). */
  order?: number
  /** Dimensiones del archivo original (cuando se conocen). */
  width?: number
  height?: number
  createdAt?: string
}

export interface GalleryServiceRef {
  id: string
  name: string
}

/** Límite por colección (8 fotos por colección según especificación oficial). */
export const GALLERY_MAX_PER_CATEGORY = 8

/** Lado mayor mínimo recomendado para que una foto no se vea pixelada. */
export const GALLERY_MIN_RECOMMENDED_PX = 1000

export const DEFAULT_GALLERY_CATEGORIES: { key: string; label: string }[] = [
  { key: 'cortes', label: 'Cortes' },
  { key: 'barbas', label: 'Barbas' },
  { key: 'instalaciones', label: 'Instalaciones' },
]

/** Sugerencias para categorías adicionales (el propietario decide si las usa). */
export const SUGGESTED_EXTRA_CATEGORIES = ['Coloración', 'Tratamientos', 'Peinados', 'Otros servicios']

export function slugifyCategory(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/**
 * Normaliza la categoría manteniendo compatibilidad con datos antiguos
 * ("barba" → "barbas", "instalacion" → "instalaciones", vacío → "cortes").
 * Las categorías personalizadas se conservan como slug.
 */
export function normalizeGalleryCategory(cat?: string | null): string {
  const c = slugifyCategory(cat || '')
  if (!c) return 'cortes'
  if (c === 'corte' || c === 'cortes') return 'cortes'
  if (c === 'barba' || c === 'barbas') return 'barbas'
  if (c === 'instalacion' || c === 'instalaciones') return 'instalaciones'
  return c
}

export function getCategoryLabel(key: string, items?: GalleryItem[]): string {
  const def = DEFAULT_GALLERY_CATEGORIES.find((d) => d.key === key)
  if (def) return def.label
  const withLabel = items?.find(
    (i) => normalizeGalleryCategory(i.category) === key && i.categoryLabel?.trim()
  )
  if (withLabel?.categoryLabel) return withLabel.categoryLabel.trim()
  return key.replace(/-/g, ' ').replace(/^\w/, (m) => m.toUpperCase())
}

/** Categorías realmente usadas por el negocio, en orden: predeterminadas primero. */
export function getUsedCategories(items: GalleryItem[]): { key: string; label: string; count: number }[] {
  const counts = new Map<string, number>()
  items.forEach((i) => {
    const k = normalizeGalleryCategory(i.category)
    counts.set(k, (counts.get(k) || 0) + 1)
  })
  const keys = [
    ...DEFAULT_GALLERY_CATEGORIES.map((d) => d.key).filter((k) => counts.has(k)),
    ...Array.from(counts.keys()).filter((k) => !DEFAULT_GALLERY_CATEGORIES.some((d) => d.key === k)),
  ]
  return keys.map((key) => ({ key, label: getCategoryLabel(key, items), count: counts.get(key) || 0 }))
}

/**
 * Textos de demostración que antiguas versiones de BarberOS asignaban a fotografías.
 * Se ocultan sin borrar la imagen.
 */
const LEGACY_DEMO_CAPTIONS = new Set(
  [
    'Fade Clásico & Texturizado',
    'Degradado Skin Fade Pulido',
    'Corte Moderno Urbano',
    'Tijera y Acabado Mate',
    'Diseño de Líneas & Contorno',
    'Diseño de línea',
    'Contorno',
    'Perfilado con Navaja de Precisión',
    'Perfilado de Barba Completa',
    'Ritual de Toalla Caliente',
    'Ritual toalla caliente',
    'Afeitado Tradicional al Ras',
    'Hidratación & Bálsamos Esenciales',
    'Diseño de Bigote y Pómulos',
    'Degradado y Sombreado de Barba',
    'Sillones de Cuero Vintage',
    'Salón Principal Luxury',
    'Estación de Trabajo Profesional',
    'Zona Lounge & Luces Neón',
    'Espejos con Iluminación LED',
    'Área de Lavado y Spa',
    'Corte de autor',
    'Experiencia de autor',
    'Acabado de precisión',
    'Trabajo de precisión profesional',
  ].map((s) => s.toLowerCase().trim())
)

/** Detecta captions que en realidad son nombres de archivo (IMG_2034, WhatsApp Image…). */
export function looksLikeFilename(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^(img|image|dsc|dscn|pxl|mvimg|photo|foto|screenshot|captura|whatsapp|wa\d|signal|snapchat|received|download|descarga|unnamed|file|imagen)\b/i.test(t)) return true
  if (/\d{6,}/.test(t)) return true
  if (/^[0-9a-f]{8}[\s-]?[0-9a-f]{4}/i.test(t)) return true
  const digits = (t.match(/\d/g) || []).length
  return digits / t.length > 0.4
}

export function isLegacyDemoCaption(text?: string | null): boolean {
  if (!text) return false
  return LEGACY_DEMO_CAPTIONS.has(text.toLowerCase().trim())
}

/** Devuelve un caption legado solo si parece escrito intencionalmente por el propietario. */
export function getTrustedLegacyCaption(item: GalleryItem): string | null {
  const c = (item.caption || '').trim()
  if (!c) return null
  if (isLegacyDemoCaption(c) || looksLikeFilename(c)) return null
  return c
}

/**
 * Título visible de una foto: título del propietario → caption legado confiable →
 * nombre del servicio real asociado → ninguno.
 */
export function resolveGalleryTitle(item: GalleryItem, services?: GalleryServiceRef[]): string | null {
  const title = (item.title || '').trim()
  if (title) return title
  // Si el ítem ya fue editado con el nuevo constructor, `title` manda (vacío = sin título).
  if (item.title === undefined) {
    const legacy = getTrustedLegacyCaption(item)
    if (legacy) return legacy
  }
  const service = getLinkedService(item, services)
  return service ? service.name : null
}

export function getLinkedService(item: GalleryItem, services?: GalleryServiceRef[]): GalleryServiceRef | null {
  if (!item.serviceId || !services?.length) return null
  return services.find((s) => s.id === item.serviceId) || null
}

/** Ordena por `order` y, en su ausencia, por la posición original (estable). */
export function sortGallery<T extends GalleryItem>(items: T[]): T[] {
  return items
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      const oa = typeof a.item.order === 'number' ? a.item.order : a.idx
      const ob = typeof b.item.order === 'number' ? b.item.order : b.idx
      return oa - ob || a.idx - b.idx
    })
    .map((x) => x.item)
}

export function isLowResolution(item: GalleryItem): boolean {
  if (!item.width || !item.height) return false
  return Math.max(item.width, item.height) < GALLERY_MIN_RECOMMENDED_PX
}

/**
 * Genera una variante optimizada de Cloudinary sin modificar el original:
 * f_auto,q_auto + ancho máximo con `c_limit` (nunca amplía imágenes pequeñas).
 * URLs que no son de Cloudinary se devuelven intactas.
 */
export function getOptimizedImageUrl(url: string, maxWidth: number): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto:good,c_limit,w_${Math.round(maxWidth)}/`)
}

/**
 * Sanea un ítem recibido del cliente: limita longitudes, conserva campos conocidos
 * y nunca inventa información faltante.
 */
export function sanitizeGalleryItem(raw: any, index: number): GalleryItem | null {
  if (!raw || typeof raw !== 'object' || typeof raw.url !== 'string' || !raw.url.trim()) return null
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : undefined)
  const category = normalizeGalleryCategory(raw.category)
  const item: GalleryItem = {
    id: str(raw.id, 80) || `g-${index}-${Date.now()}`,
    url: raw.url.trim(),
    category,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : index,
  }
  const publicId = str(raw.publicId, 300)
  if (publicId) item.publicId = publicId
  if (typeof raw.caption === 'string') item.caption = raw.caption.trim().slice(0, 120)
  if (typeof raw.title === 'string') item.title = raw.title.trim().slice(0, 80)
  const description = str(raw.description, 280)
  if (description) item.description = description
  const categoryLabel = str(raw.categoryLabel, 40)
  if (categoryLabel && !DEFAULT_GALLERY_CATEGORIES.some((d) => d.key === category)) item.categoryLabel = categoryLabel
  const serviceId = str(raw.serviceId, 80)
  if (serviceId) item.serviceId = serviceId
  const width = num(raw.width)
  const height = num(raw.height)
  if (width && height) {
    item.width = width
    item.height = height
  }
  const createdAt = str(raw.createdAt, 40)
  if (createdAt) item.createdAt = createdAt
  return item
}
