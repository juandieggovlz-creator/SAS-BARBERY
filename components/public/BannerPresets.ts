export interface BannerPreset {
  id: string
  title: string
  description: string
  url: string
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'banner-1',
    title: 'Sillón Clásico & Estilo Vintage',
    description: 'Ambiente clásico de barbería tradicional',
    url: '/imagenes/banner-sillon-vintage.jpeg'
  },
  {
    id: 'banner-2',
    title: 'Corte Moderno & Detallado',
    description: 'Perfilado y corte con navaja de precisión',
    url: '/imagenes/banner-corte-navaja.jpeg'
  },
  {
    id: 'banner-3',
    title: 'Ambiente Barber Shop Premium',
    description: 'Estética contemporánea con sillones de piel',
    url: '/imagenes/banner-barber-premium.jpeg'
  },
  {
    id: 'banner-4',
    title: 'Estación de Trabajo & Herramientas',
    description: 'Tijeras, máquinas profesionales y cosmética',
    url: '/imagenes/banner-estacion-tijeras.jpeg'
  },
  {
    id: 'banner-5',
    title: 'Ritual de Barba & Cuidados',
    description: 'Toalla caliente y afeitado tradicional',
    url: '/imagenes/banner-cuidado-barba.jpeg'
  },
  {
    id: 'banner-6',
    title: 'Salón de Barberos & Luces Neón',
    description: 'Iluminación de estudio y atención personalizada',
    url: '/imagenes/banner-salon-neon.jpeg'
  }
]

export const DEFAULT_HERO_BANNER = BANNER_PRESETS[0].url
