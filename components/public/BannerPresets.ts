/**
 * BARBEROS — Catálogo Oficial de Portadas Prediseñadas & Especificaciones Técnicas
 *
 * Directrices de FASE 4:
 * 1. BarberOS provee un catálogo mantenido de portadas prediseñadas.
 * 2. Los propietarios no suben imágenes arbitrarias ni URLs externas para el fondo de portada.
 * 3. Cada portada cuenta con tarjeta visual, miniatura, nombre de estilo, descripción,
 *    badge de estado, iluminación ambiental preconfigurada y estilo de movimiento.
 * 4. Toda la complejidad de animación (zoom sutil, movimiento cinemático, blur y luz ambiental)
 *    está preconfigurada y se aplica automáticamente sin intervención técnica del usuario.
 * 5. Especificaciones técnicas exactas para diseñadores y fotógrafos de BarberOS:
 *    - Resolución recomendada: 2560 × 1440 px (Ultra HD 1440p) o mínimo 1920 × 1080 px.
 *    - Relación de aspecto: 16:9 estricta.
 *    - Formato: WebP o AVIF (con fallback JPEG progresivo), compresión de calidad 82-85%.
 *    - Peso objetivo del archivo: < 180 KB por portada.
 *    - Punto focal: Centrado vertical (45-55%) con tercio izquierdo despejado o de bajo contraste
 *      para garantizar legibilidad editorial de tipografía superpuesta.
 */

export interface HeroCoverSpec {
  resolution: string
  aspectRatio: string
  format: string
  recommendedPath: string
  maxFileSize: string
  focalPointRule: string
  description: string
}

export const OFFICIAL_HERO_COVER_SPECS: HeroCoverSpec = {
  resolution: '2560 × 1440 px (Mínimo 1920 × 1080 px)',
  aspectRatio: '16:9 Panorámica Estricta',
  format: 'WebP o AVIF de alta eficiencia',
  recommendedPath: '/imagenes/hero-cinematic-luxury.webp',
  maxFileSize: '< 180 KB optimizado',
  focalPointRule: 'Punto focal derecho (silla y espejo), tercio izquierdo oscuro despejado para titular.',
  description: 'Composición cinematográfica fullscreen de autor con iluminación cálida circular, profundidad 3D interactiva y cámara vinculada al scroll.',
}

export const OFFICIAL_BARBEROS_HERO_COVER = '/imagenes/hero-cinematic-luxury.webp'
export const DEFAULT_HERO_BANNER = OFFICIAL_BARBEROS_HERO_COVER

export type HeroVariant = 'cinematic-luxury' | 'editorial-split'

export interface BarberOSCoverTheme {
  id: string
  title: string
  badge: string
  description: string
  url: string
  masterUrl?: string
  heroVariant?: HeroVariant
  motionStyle: 'CINEMATIC' | 'ELEGANT' | 'DYNAMIC'
  lighting: string
  recommended?: boolean
}

/**
 * Portada Oficial Activa de BarberOS (Única experiencia habilitada en producción).
 * En futuras actualizaciones se podrán agregar nuevos diseños animados a esta lista.
 */
export const BARBEROS_OFFICIAL_COVERS: BarberOSCoverTheme[] = [
  {
    id: 'cinematic-luxury',
    title: 'CINEMATIC LUXURY 3D',
    badge: 'Scroll Video 3D',
    description: 'Recorrido cinematográfico interactivo controlado por scroll: la cámara avanza hacia la silla negra frente al espejo circular iluminado.',
    url: '/imagenes/hero-cinematic-luxury.webp',
    masterUrl: '/imagenes/silla.mp4',
    heroVariant: 'cinematic-luxury',
    motionStyle: 'CINEMATIC',
    lighting: 'Recorrido 3D al Scroll · 1280×720',
    recommended: true,
  },
]

/**
 * Diseños estáticos archivados (ocultos del selector visible, conservados por compatibilidad).
 */
export const ARCHIVED_STATIC_COVERS: BarberOSCoverTheme[] = [
  {
    id: 'heritage-classic',
    title: 'Heritage Clásico',
    badge: 'Editorial',
    description: 'Estética clásica editorial con maderas nobles, cuero envejecido y luz cálida de autor.',
    url: '/imagenes/hero-barberos-cover.webp',
    heroVariant: 'editorial-split',
    motionStyle: 'CINEMATIC',
    lighting: 'Cálida direccional 3200K',
  },
  {
    id: 'vintage-lounge',
    title: 'Sillón Vintage & Madera',
    badge: 'Tradicional',
    description: 'Homenaje a la barbería artesanal de época con sillón clásico y textura de roble.',
    url: '/imagenes/banner-sillon-vintage.jpeg',
    heroVariant: 'editorial-split',
    motionStyle: 'ELEGANT',
    lighting: 'Natural ambiental difusa',
  },
  {
    id: 'urban-neon',
    title: 'Atelier Urbano Neón',
    badge: 'Moderno',
    description: 'Estilo street-luxe con iluminación de acento neón y vibrante atmósfera metropolitana.',
    url: '/imagenes/banner-salon-neon.jpeg',
    heroVariant: 'editorial-split',
    motionStyle: 'DYNAMIC',
    lighting: 'Neón cian & ámbar',
  },
  {
    id: 'razor-mastery',
    title: 'Corte Clásico & Navaja',
    badge: 'Artesanal',
    description: 'Precisión artesanal en primer plano con navaja de afeitar y maestría tradicional.',
    url: '/imagenes/banner-corte-navaja.jpeg',
    heroVariant: 'editorial-split',
    motionStyle: 'ELEGANT',
    lighting: 'Puntual de detalle',
  },
  {
    id: 'steel-craft',
    title: 'Estación Tijeras & Acero',
    badge: 'Técnico',
    description: 'Herramientas maestras de acero forjado ordenadas sobre superficie metálica pulida.',
    url: '/imagenes/banner-estacion-tijeras.jpeg',
    heroVariant: 'editorial-split',
    motionStyle: 'DYNAMIC',
    lighting: 'Fría de estudio 5600K',
  },
  {
    id: 'beard-ritual',
    title: 'Ritual de Barba Tradicional',
    badge: 'Sensorial',
    description: 'Enfoque sensorial de cuidado masculino, toalla caliente y ritual de afeitado.',
    url: '/imagenes/banner-cuidado-barba.jpeg',
    heroVariant: 'editorial-split',
    motionStyle: 'CINEMATIC',
    lighting: 'Suave envolvente',
  },
]

export const DEFAULT_COVER_ID = 'cinematic-luxury'

/**
 * Resuelve siempre la portada cinematográfica oficial activa, garantizando migración
 * automática y segura para barberías que tuvieran guardada cualquier portada estática anterior.
 */
export function getCoverById(idOrUrl?: string | null): BarberOSCoverTheme {
  if (!idOrUrl) return BARBEROS_OFFICIAL_COVERS[0]
  const clean = idOrUrl.trim().toLowerCase()
  const found = BARBEROS_OFFICIAL_COVERS.find(
    (c) => c.id.toLowerCase() === clean || c.url.toLowerCase() === clean
  )
  return found || BARBEROS_OFFICIAL_COVERS[0]
}

/**
 * Indica si la portada seleccionada corresponde al Hero Fullscreen 3D Cinematic Luxury.
 */
export function isCinematicLuxuryCover(idOrUrl?: string | null): boolean {
  return getCoverById(idOrUrl).heroVariant === 'cinematic-luxury'
}

/**
 * Resuelve la URL canónica de la portada oficial elegida.
 */
export function resolveCoverBannerUrl(idOrUrl?: string | null): string {
  return getCoverById(idOrUrl).url
}

/** Fallback retrocompatible para componentes que consumían BANNER_PRESETS */
export const BANNER_PRESETS = BARBEROS_OFFICIAL_COVERS.map((c) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  url: c.url,
}))
