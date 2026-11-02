export interface ThemeColors {
  bg: string
  surface: string
  surfaceCard: string
  border: string
  textPrimary: string
  textSecondary: string
  accent: string
  accentHover: string
  accentContrast?: string
  badgeBg: string
  badgeText: string
  shadow: string
}

export interface VisualTheme {
  id: string
  name: string
  description: string
  primary: string
  secondary: string
  accent: string
  dark: ThemeColors
  light: ThemeColors
}

export const PRESET_THEMES: VisualTheme[] = [
  {
    id: 'ELEGANTE',
    name: 'Elegante',
    description: 'Negro, Blanco y Dorado Clásico',
    primary: '#09090b',
    secondary: '#ffffff',
    accent: '#d4af37',
    dark: {
      bg: '#09090b',
      surface: '#121215',
      surfaceCard: '#18181c',
      border: 'rgba(212, 175, 55, 0.22)',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: '#d4af37',
      accentHover: '#e5c158',
      badgeBg: 'rgba(212, 175, 55, 0.14)',
      badgeText: '#f5d77f',
      shadow: 'rgba(212, 175, 55, 0.15)',
    },
    light: {
      bg: '#fafaf9',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(180, 145, 35, 0.22)',
      textPrimary: '#18181b',
      textSecondary: '#52525b',
      accent: '#b89329',
      accentHover: '#a07d1a',
      badgeBg: 'rgba(212, 175, 55, 0.12)',
      badgeText: '#855e1c',
      shadow: 'rgba(180, 145, 35, 0.12)',
    },
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    description: 'Negro, Blanco y Carmín Exclusivo',
    primary: '#0a0a0c',
    secondary: '#ffffff',
    accent: '#e11d48',
    dark: {
      bg: '#0a0a0c',
      surface: '#131317',
      surfaceCard: '#191920',
      border: 'rgba(225, 29, 72, 0.25)',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: '#e11d48',
      accentHover: '#f43f5e',
      badgeBg: 'rgba(225, 29, 72, 0.14)',
      badgeText: '#fda4af',
      shadow: 'rgba(225, 29, 72, 0.18)',
    },
    light: {
      bg: '#fafafa',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(225, 29, 72, 0.2)',
      textPrimary: '#09090b',
      textSecondary: '#52525b',
      accent: '#e11d48',
      accentHover: '#be123c',
      badgeBg: 'rgba(225, 29, 72, 0.1)',
      badgeText: '#be123c',
      shadow: 'rgba(225, 29, 72, 0.12)',
    },
  },
  {
    id: 'URBANO',
    name: 'Urbano',
    description: 'Negro Streetwear y Naranja Óxido',
    primary: '#0c0a09',
    secondary: '#fafaf9',
    accent: '#f97316',
    dark: {
      bg: '#0c0a09',
      surface: '#171412',
      surfaceCard: '#211c19',
      border: 'rgba(249, 115, 22, 0.25)',
      textPrimary: '#fafaf9',
      textSecondary: '#a8a29e',
      accent: '#f97316',
      accentHover: '#fb923c',
      badgeBg: 'rgba(249, 115, 22, 0.14)',
      badgeText: '#fdba74',
      shadow: 'rgba(249, 115, 22, 0.16)',
    },
    light: {
      bg: '#fafaf9',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(249, 115, 22, 0.2)',
      textPrimary: '#1c1917',
      textSecondary: '#57534e',
      accent: '#ea580c',
      accentHover: '#c2410c',
      badgeBg: 'rgba(249, 115, 22, 0.1)',
      badgeText: '#c2410c',
      shadow: 'rgba(234, 88, 12, 0.12)',
    },
  },
  {
    id: 'MINIMALISTA',
    name: 'Minimalista',
    description: 'Blanco Puro, Negro Carbón y Plata',
    primary: '#ffffff',
    secondary: '#09090b',
    accent: '#71717a',
    dark: {
      bg: '#09090b',
      surface: '#121214',
      surfaceCard: '#18181b',
      border: 'rgba(255, 255, 255, 0.14)',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      accent: '#ffffff',
      accentHover: '#e4e4e7',
      accentContrast: '#000000',
      badgeBg: 'rgba(255, 255, 255, 0.08)',
      badgeText: '#f4f4f5',
      shadow: 'rgba(255, 255, 255, 0.08)',
    },
    light: {
      bg: '#fafafa',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(0, 0, 0, 0.12)',
      textPrimary: '#09090b',
      textSecondary: '#52525b',
      accent: '#18181b',
      accentHover: '#27272a',
      accentContrast: '#ffffff',
      badgeBg: 'rgba(24, 24, 27, 0.06)',
      badgeText: '#18181b',
      shadow: 'rgba(0, 0, 0, 0.06)',
    },
  },
  {
    id: 'MODERNO',
    name: 'Moderno',
    description: 'Azul Marino, Blanco y Azul Eléctrico',
    primary: '#080d1a',
    secondary: '#ffffff',
    accent: '#3b82f6',
    dark: {
      bg: '#080d1a',
      surface: '#0f172a',
      surfaceCard: '#1e293b',
      border: 'rgba(59, 130, 246, 0.25)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      accent: '#3b82f6',
      accentHover: '#60a5fa',
      badgeBg: 'rgba(59, 130, 246, 0.14)',
      badgeText: '#93c5fd',
      shadow: 'rgba(59, 130, 246, 0.18)',
    },
    light: {
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(59, 130, 246, 0.2)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      accent: '#2563eb',
      accentHover: '#1d4ed8',
      badgeBg: 'rgba(59, 130, 246, 0.1)',
      badgeText: '#1d4ed8',
      shadow: 'rgba(37, 99, 235, 0.12)',
    },
  },
  {
    id: 'LUXURY_GOLD',
    name: 'Luxury Gold',
    description: 'Obsidiana Pura, Champán y Oro Real',
    primary: '#040404',
    secondary: '#ffffff',
    accent: '#ffd700',
    dark: {
      bg: '#040404',
      surface: '#0d0d0f',
      surfaceCard: '#141417',
      border: 'rgba(255, 215, 0, 0.28)',
      textPrimary: '#ffffff',
      textSecondary: '#d4d4d8',
      accent: '#ffd700',
      accentHover: '#ffe55c',
      badgeBg: 'rgba(255, 215, 0, 0.16)',
      badgeText: '#ffea75',
      shadow: 'rgba(255, 215, 0, 0.22)',
    },
    light: {
      bg: '#fffdfa',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(202, 138, 4, 0.25)',
      textPrimary: '#1c1917',
      textSecondary: '#44403c',
      accent: '#ca8a04',
      accentHover: '#a16207',
      badgeBg: 'rgba(202, 138, 4, 0.12)',
      badgeText: '#854d0e',
      shadow: 'rgba(202, 138, 4, 0.15)',
    },
  },
  {
    id: 'DARK_RED',
    name: 'Dark Red',
    description: 'Negro Sangre y Rojo Rubí Intenso',
    primary: '#080305',
    secondary: '#ffffff',
    accent: '#dc2626',
    dark: {
      bg: '#080305',
      surface: '#12080a',
      surfaceCard: '#1c0c10',
      border: 'rgba(220, 38, 38, 0.28)',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: '#dc2626',
      accentHover: '#ef4444',
      badgeBg: 'rgba(220, 38, 38, 0.15)',
      badgeText: '#fca5a5',
      shadow: 'rgba(220, 38, 38, 0.2)',
    },
    light: {
      bg: '#fff5f5',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(220, 38, 38, 0.2)',
      textPrimary: '#18181b',
      textSecondary: '#52525b',
      accent: '#b91c1c',
      accentHover: '#991b1b',
      badgeBg: 'rgba(220, 38, 38, 0.1)',
      badgeText: '#991b1b',
      shadow: 'rgba(185, 28, 28, 0.12)',
    },
  },
  {
    id: 'MIDNIGHT_BLUE',
    name: 'Midnight Blue',
    description: 'Azul Noche Profundo y Cyan Neón',
    primary: '#030712',
    secondary: '#f1f5f9',
    accent: '#06b6d4',
    dark: {
      bg: '#030712',
      surface: '#0b1329',
      surfaceCard: '#111d3d',
      border: 'rgba(6, 182, 212, 0.28)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      accent: '#06b6d4',
      accentHover: '#22d3ee',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      badgeText: '#67e8f9',
      shadow: 'rgba(6, 182, 212, 0.2)',
    },
    light: {
      bg: '#f0fdfa',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(13, 148, 136, 0.22)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      accent: '#0d9488',
      accentHover: '#0f766e',
      badgeBg: 'rgba(13, 148, 136, 0.1)',
      badgeText: '#0f766e',
      shadow: 'rgba(13, 148, 136, 0.12)',
    },
  },
  {
    id: 'WHITE_LUXURY',
    name: 'White Luxury',
    description: 'Blanco Marfil, Bronce Noble y Onyx',
    primary: '#fcfbf9',
    secondary: '#1a1918',
    accent: '#a88a53',
    dark: {
      bg: '#141312',
      surface: '#1c1a18',
      surfaceCard: '#24221f',
      border: 'rgba(168, 138, 83, 0.28)',
      textPrimary: '#fcfbf9',
      textSecondary: '#a8a29e',
      accent: '#c5a86d',
      accentHover: '#dfc285',
      badgeBg: 'rgba(168, 138, 83, 0.15)',
      badgeText: '#e7ce97',
      shadow: 'rgba(168, 138, 83, 0.18)',
    },
    light: {
      bg: '#fcfbf9',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(168, 138, 83, 0.24)',
      textPrimary: '#1a1918',
      textSecondary: '#57534e',
      accent: '#8c6d3b',
      accentHover: '#71552a',
      badgeBg: 'rgba(168, 138, 83, 0.12)',
      badgeText: '#71552a',
      shadow: 'rgba(140, 109, 59, 0.14)',
    },
  },
  {
    id: 'CARBON_BLACK',
    name: 'Carbon Black',
    description: 'Grafito Carbón y Verde Esmeralda',
    primary: '#0c0d10',
    secondary: '#f8fafc',
    accent: '#10b981',
    dark: {
      bg: '#0c0d10',
      surface: '#13151b',
      surfaceCard: '#1a1d24',
      border: 'rgba(16, 185, 129, 0.25)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      accent: '#10b981',
      accentHover: '#34d399',
      badgeBg: 'rgba(16, 185, 129, 0.14)',
      badgeText: '#6ee7b7',
      shadow: 'rgba(16, 185, 129, 0.18)',
    },
    light: {
      bg: '#f0fdf4',
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: 'rgba(5, 150, 105, 0.22)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      accent: '#059669',
      accentHover: '#047857',
      badgeBg: 'rgba(5, 150, 105, 0.1)',
      badgeText: '#047857',
      shadow: 'rgba(5, 150, 105, 0.12)',
    },
  },
]

export interface FontOption {
  id: string
  name: string
  category: string
  headingFont: string
  bodyFont: string
  sample: string
  pairDescription: string
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'elegante',
    name: 'Elegante',
    category: 'Elegante',
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', sans-serif",
    sample: 'Playfair Display + Inter',
    pairDescription: 'Serifa sofisticada y lectura limpia de alta gama',
  },
  {
    id: 'moderna',
    name: 'Moderna',
    category: 'Moderna',
    headingFont: "'Poppins', sans-serif",
    bodyFont: "'Inter', sans-serif",
    sample: 'Poppins + Inter',
    pairDescription: 'Geométrica vanguardista, nítida y dinámica',
  },
  {
    id: 'premium',
    name: 'Premium',
    category: 'Premium',
    headingFont: "'Cormorant Garamond', Garamond, serif",
    bodyFont: "'Montserrat', sans-serif",
    sample: 'Cormorant Garamond + Montserrat',
    pairDescription: 'Lujo editorial exclusivo y elegancia clásica',
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    category: 'Minimalista',
    headingFont: "'Manrope', sans-serif",
    bodyFont: "'Inter', sans-serif",
    sample: 'Manrope + Inter',
    pairDescription: 'Minimalismo nórdico, equilibrio y precisión moderna',
  },
  {
    id: 'clasica',
    name: 'Clásica',
    category: 'Clásica',
    headingFont: "'Merriweather', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    sample: 'Merriweather + Source Sans',
    pairDescription: 'Tradición atemporal de barbería tradicional',
  },
]

export function getTheme(themeId?: string): VisualTheme {
  if (!themeId) return PRESET_THEMES[0]
  const normalized = themeId.toUpperCase()
  const match = PRESET_THEMES.find(t => t.id === normalized)
  return match || PRESET_THEMES[0]
}

export function getFont(fontId?: string): FontOption {
  if (!fontId) return FONT_OPTIONS[0]
  const id = fontId.toLowerCase()
  // Support backwards compatibility with previous IDs
  if (id === 'playfair') return FONT_OPTIONS[0]
  if (id === 'inter') return FONT_OPTIONS[1]
  if (id === 'cinzel') return FONT_OPTIONS[2]
  if (id === 'jakarta') return FONT_OPTIONS[3]
  if (id === 'outfit') return FONT_OPTIONS[1]

  const match = FONT_OPTIONS.find(f => f.id === id)
  return match || FONT_OPTIONS[0]
}

export function getEffectiveColors(theme: VisualTheme, mode: 'dark' | 'light' | 'system'): ThemeColors {
  if (mode === 'light') return theme.light
  return theme.dark
}

export function getAccentContrast(accentColor?: string, customContrast?: string): string {
  if (customContrast) return customContrast
  if (!accentColor) return '#ffffff'
  const hex = accentColor.replace('#', '')
  let r = 255, g = 255, b = 255
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 155 ? '#000000' : '#ffffff'
}
