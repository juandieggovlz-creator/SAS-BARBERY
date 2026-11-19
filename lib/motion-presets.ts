/**
 * BARBEROS — Sistema de Dirección Artística y Perfiles de Movimiento Cinemático
 * Define los presets de animación para las páginas públicas (/b/[slug]) y el constructor (/webpage).
 */

export type MotionStyleId = 'ELEGANT' | 'CINEMATIC' | 'DYNAMIC'

export interface MotionPresetConfig {
  id: MotionStyleId
  name: string
  badge: string
  description: string
  /** CSS cubic-bezier para transiciones declarativas */
  cssEaseOut: string
  /** Easing de GSAP para timelines de entrada */
  gsapEaseOut: string
  /** Desplazamiento vertical parallax de la imagen de fondo en el Hero (%) */
  heroBgParallaxY: number
  /** Escala inicial de la imagen del Hero en el settle-zoom */
  heroSettleScaleFrom: number
  /** Escala final de la imagen del Hero al hacer scroll completo */
  heroScrollScaleTo: number
  /** Desplazamiento vertical del titular principal durante el scroll (%) */
  heroTitleScrollY: number
  /** Desplazamiento horizontal del texto arquitectónico de fondo (%) */
  heroWatermarkScrollX: number
  /** Desenfoque inicial (px) en la entrada blur-rise (solo desktop) */
  entranceBlurPx: number
  /** Duración base de la coreografía de entrada (segundos) */
  entranceDuration: number
  /** Intervalo entre elementos en cascada (segundos) */
  staggerStep: number
  /** Suavizado del scrub de ScrollTrigger (segundos o boolean) */
  scrubSmoothing: number
  /** Activa respuesta de profundidad sutil con el puntero en pantallas grandes */
  enablePointerDepth: boolean
  /** Intensidad del desplazamiento con el puntero (px) */
  pointerDepthIntensity: number
}

export const MOTION_PRESETS: Record<MotionStyleId, MotionPresetConfig> = {
  ELEGANT: {
    id: 'ELEGANT',
    name: 'Elegante Editorial',
    badge: 'Sutil & Atemporal',
    description: 'Transiciones serenas, composición editorial de revista y movimiento orgánico discreto.',
    cssEaseOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
    gsapEaseOut: 'power3.out',
    heroBgParallaxY: 10,
    heroSettleScaleFrom: 1.06,
    heroScrollScaleTo: 1.03,
    heroTitleScrollY: -12,
    heroWatermarkScrollX: -6,
    entranceBlurPx: 6,
    entranceDuration: 0.95,
    staggerStep: 0.1,
    scrubSmoothing: 0.6,
    enablePointerDepth: false,
    pointerDepthIntensity: 0,
  },
  CINEMATIC: {
    id: 'CINEMATIC',
    name: 'Cinematográfico',
    badge: 'Motion Sites Signature',
    description: 'Profundidad multicapa, entrada blur-rise coreografiada, parallax diferencial y narrativa por scroll.',
    cssEaseOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    gsapEaseOut: 'expo.out',
    heroBgParallaxY: 20,
    heroSettleScaleFrom: 1.14,
    heroScrollScaleTo: 1.08,
    heroTitleScrollY: -26,
    heroWatermarkScrollX: -18,
    entranceBlurPx: 12,
    entranceDuration: 1.15,
    staggerStep: 0.12,
    scrubSmoothing: 0.85,
    enablePointerDepth: true,
    pointerDepthIntensity: 14,
  },
  DYNAMIC: {
    id: 'DYNAMIC',
    name: 'Dinámico Expresivo',
    badge: 'Alto Impacto',
    description: 'Tipografía cinética audaz, parallax pronunciado, respuesta magnética al cursor y ritmo enérgico.',
    cssEaseOut: 'cubic-bezier(0.19, 1, 0.22, 1)',
    gsapEaseOut: 'power4.out',
    heroBgParallaxY: 28,
    heroSettleScaleFrom: 1.18,
    heroScrollScaleTo: 1.12,
    heroTitleScrollY: -36,
    heroWatermarkScrollX: -30,
    entranceBlurPx: 14,
    entranceDuration: 1.0,
    staggerStep: 0.09,
    scrubSmoothing: 0.5,
    enablePointerDepth: true,
    pointerDepthIntensity: 22,
  },
}

export const MOTION_PRESET_LIST: MotionPresetConfig[] = [
  MOTION_PRESETS.CINEMATIC,
  MOTION_PRESETS.ELEGANT,
  MOTION_PRESETS.DYNAMIC,
]

/**
 * Resuelve el preset de movimiento activo a partir de la configuración de la página
 * o infiere el más coherente según el tema visual seleccionado, manteniendo 100% compatibilidad.
 */
export function resolveMotionPreset(
  explicitStyle?: string | null,
  themeId?: string | null
): MotionPresetConfig {
  if (explicitStyle) {
    const normalized = explicitStyle.toUpperCase().trim()
    if (normalized === 'ELEGANT' || normalized === 'ELEGANTE') return MOTION_PRESETS.ELEGANT
    if (normalized === 'CINEMATIC' || normalized === 'CINEMATOGRAFICO') return MOTION_PRESETS.CINEMATIC
    if (normalized === 'DYNAMIC' || normalized === 'DINAMICO') return MOTION_PRESETS.DYNAMIC
  }

  const theme = (themeId || 'ELEGANTE').toUpperCase()
  if (theme === 'MINIMALISTA' || theme === 'WHITE_LUXURY') {
    return MOTION_PRESETS.ELEGANT
  }
  if (theme === 'URBANO' || theme === 'MODERNO' || theme === 'DARK_RED') {
    return MOTION_PRESETS.DYNAMIC
  }

  return MOTION_PRESETS.CINEMATIC
}

export interface PageMotionConfig {
  motionStyle: MotionStyleId
  enableScrollSequence: boolean
  sequencePattern: string
  sequenceFrameCount: number
  showPhone: boolean
  showEmail: boolean
  defaultColorMode: 'dark' | 'light'
}

/**
 * Extrae la configuración de movimiento y preferencias de página desde el objeto `page`
 * (ya sea en campos directos o embebida de forma retrocompatible dentro del JSON de `businessHours`).
 */
export function extractMotionConfigFromPage(page: any): PageMotionConfig {
  const defaultPreset = resolveMotionPreset(null, page?.theme)
  let embedded: any = {}

  if (page?.businessHours && typeof page.businessHours === 'string') {
    try {
      const parsed = JSON.parse(page.businessHours)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?._motionConfig) {
        embedded = parsed[0]._motionConfig
      }
    } catch {
      // Ignore parse errors
    }
  }

  const rawStyle = page?.motionStyle || embedded.motionStyle || defaultPreset.id
  const resolved = resolveMotionPreset(rawStyle, page?.theme)

  return {
    motionStyle: resolved.id,
    enableScrollSequence:
      page?.enableScrollSequence !== undefined
        ? Boolean(page.enableScrollSequence)
        : Boolean(embedded.enableScrollSequence),
    sequencePattern:
      page?.sequencePattern !== undefined
        ? String(page.sequencePattern || '')
        : String(embedded.sequencePattern || ''),
    sequenceFrameCount:
      Number(page?.sequenceFrameCount || embedded.sequenceFrameCount || 60) || 60,
    showPhone:
      page?.showPhone !== undefined
        ? Boolean(page.showPhone)
        : (embedded.showPhone !== undefined ? Boolean(embedded.showPhone) : true),
    showEmail:
      page?.showEmail !== undefined
        ? Boolean(page.showEmail)
        : (embedded.showEmail !== undefined ? Boolean(embedded.showEmail) : true),
    defaultColorMode:
      (page?.defaultColorMode || embedded.defaultColorMode || 'dark') === 'light' ? 'light' : 'dark',
  }
}

/**
 * Embebe la configuración de movimiento y visibilidad dentro del arreglo serializado de `businessHours`
 * sin alterar la estructura de arreglo de 7 días ni requerir migraciones destructivas en Prisma.
 */
export function embedMotionConfigInSchedule(
  scheduleArray: any[],
  motionConfig: Partial<PageMotionConfig>
): any[] {
  if (!Array.isArray(scheduleArray) || scheduleArray.length === 0) return scheduleArray
  const cloned = scheduleArray.map((item) => ({ ...item }))
  cloned[0] = {
    ...cloned[0],
    _motionConfig: {
      motionStyle: motionConfig.motionStyle || 'CINEMATIC',
      enableScrollSequence: Boolean(motionConfig.enableScrollSequence),
      sequencePattern: motionConfig.sequencePattern ? String(motionConfig.sequencePattern).trim() : '',
      sequenceFrameCount: Math.min(150, Math.max(10, Number(motionConfig.sequenceFrameCount) || 60)),
      showPhone: motionConfig.showPhone !== undefined ? Boolean(motionConfig.showPhone) : true,
      showEmail: motionConfig.showEmail !== undefined ? Boolean(motionConfig.showEmail) : true,
      defaultColorMode: motionConfig.defaultColorMode === 'light' ? 'light' : 'dark',
    },
  }
  return cloned
}

