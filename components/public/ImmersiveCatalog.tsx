'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  Clock,
  Check,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Scissors,
  Award,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { ThemeColors } from '@/lib/themes'
import { getOptimizedImageUrl } from '@/lib/gallery'

/* ══════════════════════════════════════════════════════════════════════════
   1. SECCIÓN DE SERVICIOS — LISTA EDITORIAL VERTICAL PREMIUM
   Diseño editorial inspirado en menús de estudio de alta gama:
   - Se adapta a 1, 2, 4 o muchos servicios sin dejar huecos ni espacios negros.
   - Conserva filtro por categorías reales (cuando hay más de una),
     selección múltiple y reserva directa.
══════════════════════════════════════════════════════════════════════════ */

export interface EditorialServicesShowcaseProps {
  services: any[]
  selectedServices: any[]
  showPrices: boolean
  colors: ThemeColors
  accentBtnText: string
  headingFont: string
  colorMode: 'dark' | 'light' | 'system'
  formatCOP: (n: number) => string
  onToggleService: (service: any) => void
  onBookSingleService: (service: any) => void
}

export function EditorialServicesShowcase({
  services,
  selectedServices,
  showPrices,
  colors,
  accentBtnText,
  headingFont,
  colorMode,
  formatCOP,
  onToggleService,
  onBookSingleService,
}: EditorialServicesShowcaseProps) {
  const isLight = colorMode === 'light'
  const [activeCategory, setActiveCategory] = useState<string>('TODOS')

  // Extraer categorías reales registradas en los servicios de la barbería
  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach((s) => {
      const cat = (s.category || '').trim()
      if (cat) set.add(cat)
    })
    return Array.from(set)
  }, [services])

  const filteredServices = useMemo(() => {
    if (activeCategory === 'TODOS') return services
    return services.filter((s) => (s.category || '').trim() === activeCategory)
  }, [services, activeCategory])

  return (
    <div className="max-w-5xl mx-auto">
      {/* Filtro de categorías reales (solo aparece si el negocio tiene 2 o más categorías) */}
      {categories.length > 1 && (
        <div
          data-narrative-item
          className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b"
          style={{ borderColor: `${colors.border}80` }}
        >
          {['TODOS', ...categories].map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-150 cursor-pointer border ${isActive ? 'font-black shadow-sm' : 'opacity-70 hover:opacity-100'
                  }`}
                style={{
                  backgroundColor: isActive ? colors.accent : colors.surfaceCard,
                  borderColor: isActive ? colors.accent : colors.border,
                  color: isActive ? accentBtnText : colors.textPrimary,
                }}
              >
                {cat === 'TODOS' ? `Todos (${services.length})` : cat}
              </button>
            )
          })}
        </div>
      )}

      {/* Contenedor Editorial Vertical con separadores arquitectónicos */}
      <div
        className="rounded-[28px] border overflow-hidden divide-y shadow-sm"
        style={{
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
        }}
      >
        {filteredServices.map((service: any, idx: number) => {
          const isSelected = selectedServices.some((s) => s.id === service.id)
          const indexLabel = String(idx + 1).padStart(2, '0')
          const hasDescription = Boolean(service.description && service.description.trim())
          const hasCategory = Boolean(service.category && service.category.trim())

          return (
            <div
              key={service.id}
              data-narrative-item
              onClick={() => onToggleService(service)}
              className="group relative px-5 sm:px-8 py-5 sm:py-6 transition-colors duration-300 cursor-pointer"
              style={{
                borderColor: colors.border,
                backgroundColor: isSelected
                  ? `${colors.accent}${isLight ? '12' : '16'}`
                  : 'transparent',
              }}
            >
              {/* Indicador lateral izquierdo activo o en hover */}
              <div
                aria-hidden="true"
                className={`absolute left-0 top-0 bottom-0 w-1 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  }`}
                style={{ backgroundColor: colors.accent }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                {/* Bloque Izquierdo: Índice + Nombre + Descripción + Metadatos */}
                <div className="flex items-start gap-3.5 sm:gap-5 min-w-0 flex-1">
                  {/* Casilla / Índice interactivo */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleService(service)
                    }}
                    aria-label={isSelected ? `Quitar ${service.name}` : `Seleccionar ${service.name}`}
                    className="mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer"
                    style={
                      isSelected
                        ? {
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                          color: accentBtnText,
                        }
                        : {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.textSecondary,
                        }
                    }
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span className="font-mono text-xs font-black">{indexLabel}</span>
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3
                        className="font-black tracking-tight leading-snug transition-colors"
                        style={{
                          fontFamily: headingFont,
                          fontSize: 'clamp(1.1rem, 1.6vw, 1.35rem)',
                          color: isSelected ? colors.accent : colors.textPrimary,
                        }}
                      >
                        {service.name}
                      </h3>

                      {hasCategory && categories.length > 1 && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                          style={{
                            borderColor: colors.border,
                            color: colors.textSecondary,
                            backgroundColor: colors.surface,
                          }}
                        >
                          {service.category}
                        </span>
                      )}
                    </div>

                    {hasDescription && (
                      <p
                        className="text-xs sm:text-sm font-normal leading-relaxed max-w-2xl opacity-80"
                        style={{ color: colors.textSecondary }}
                      >
                        {service.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs">
                      <span
                        className="inline-flex items-center gap-1.5 font-semibold opacity-75"
                        style={{ color: colors.textSecondary }}
                      >
                        <Clock className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                        <span>{service.duration} min</span>
                      </span>

                      {isSelected && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider"
                          style={{ color: colors.accent }}
                        >
                          • Incluido en tu selección
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloque Derecho: Precio + Acciones (Seleccionar / Reservar) */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 pl-12 sm:pl-0 shrink-0">
                  {showPrices && (
                    <div className="text-left sm:text-right">
                      <span
                        className="font-black tracking-tight block leading-none"
                        style={{
                          fontFamily: headingFont,
                          fontSize: 'clamp(1.15rem, 1.8vw, 1.45rem)',
                          color: colors.textPrimary,
                        }}
                      >
                        {formatCOP(Number(service.price))}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider opacity-55 block mt-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {service.duration} min
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onBookSingleService(service)
                      }}
                      className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] px-4 py-2 rounded-full border transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      style={{
                        borderColor: isSelected ? colors.accent : `${colors.accent}55`,
                        backgroundColor: isSelected ? colors.accent : `${colors.accent}14`,
                        color: isSelected ? accentBtnText : colors.textPrimary,
                      }}
                    >
                      <span>Reservar</span>
                      <ArrowUpRight
                        className="w-3.5 h-3.5"
                        style={{ color: isSelected ? accentBtnText : colors.accent }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   2. EQUIPO DE BARBEROS — DISTRIBUCIÓN AUTOMÁTICA SEGÚN CANTIDAD
   - 1 barbero: centrado con presencia editorial.
   - 2 barberos: par simétrico centrado.
   - 3 barberos: 3 columnas simétricas.
   - 4 o más barberos: filas organizadas con última fila centrada automáticamente.
   - Usa únicamente nombres, especialidades y fotografías reales.
══════════════════════════════════════════════════════════════════════════ */

export interface EditorialBarbersShowcaseProps {
  barbers: any[]
  colors: ThemeColors
  accentBtnText: string
  headingFont: string
  onSelectBarber: (barber: any) => void
}

function getBarberInitials(name?: string | null): string {
  const clean = (name || 'B').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function EditorialBarbersShowcase({
  barbers,
  colors,
  accentBtnText,
  headingFont,
  onSelectBarber,
}: EditorialBarbersShowcaseProps) {
  const count = barbers.length

  // Determinar contenedor y ancho de tarjeta según la cantidad real de barberos
  const containerClass =
    count === 1
      ? 'max-w-sm mx-auto'
      : count === 2
        ? 'max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6'
        : count === 3
          ? 'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'max-w-6xl mx-auto flex flex-wrap justify-center gap-6'

  const itemWidthClass =
    count >= 4
      ? 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[276px]'
      : 'w-full'

  return (
    <div className={containerClass}>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .barberos-team-card {
            transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease, border-color 240ms ease;
          }
          .barberos-team-card:hover {
            transform: translate3d(0, -6px, 0);
            box-shadow: 0 22px 44px -12px rgba(0, 0, 0, 0.55);
          }
          .barberos-team-photo {
            transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          .barberos-team-card:hover .barberos-team-photo {
            transform: scale(1.03);
          }
        }
      `}</style>
      {barbers.map((barber: any, idx: number) => {
        const fallbackAvatar = `/imagenes saas/barbero-${(idx % 4) + 1}.png`
        const rawPhoto = (barber.avatar && String(barber.avatar).trim()) || fallbackAvatar
        const optimizedPhoto = getOptimizedImageUrl(rawPhoto, 900)
        const firstName = (barber.name || 'Barbero').trim().split(/\s+/)[0]
        const initials = getBarberInitials(barber.name)

        return (
          <div
            key={barber.id}
            data-narrative-item
            className={itemWidthClass}
          >
            <article
              onClick={() => onSelectBarber(barber)}
              className="barberos-team-card group relative rounded-[28px] overflow-hidden border cursor-pointer flex flex-col justify-end aspect-[4/5] min-h-[360px] bg-zinc-950 w-full"
              style={{
                borderColor: colors.border,
              }}
            >
              {optimizedPhoto ? (
                <img
                  src={optimizedPhoto}
                  alt={barber.name}
                  className="barberos-team-photo absolute inset-0 w-full h-full object-cover object-[center_18%]"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                /* Retrato tipográfico de estudio cuando el barbero no tiene fotografía subida */
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                  style={{
                    background: `radial-gradient(circle at 50% 35%, ${colors.accent}28 0%, #111115 70%)`,
                  }}
                >
                  <div
                    className="w-24 h-24 rounded-full border-2 flex items-center justify-center text-2xl font-black tracking-wider mb-6 shadow-inner"
                    style={{
                      borderColor: `${colors.accent}55`,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      color: colors.accent,
                      fontFamily: headingFont,
                    }}
                  >
                    {initials}
                  </div>
                </div>
              )}

              {/* Gradiente inferior localizado para legibilidad del nombre y botón (no cubre la cara del barbero) */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[46%] pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.55) 45%, rgba(9,9,11,0.92) 100%)',
                }}
              />

              {/* Información real del barbero */}
              <div className="relative z-10 p-6 flex flex-col justify-end">
                {barber.specialty?.trim() && (
                  <div className="inline-flex items-center gap-1.5 mb-1.5">
                    <Award className="w-3.5 h-3.5 shrink-0" style={{ color: colors.accent }} />
                    <span
                      className="text-[11px] font-black uppercase tracking-[0.18em] truncate"
                      style={{ color: colors.accent }}
                    >
                      {barber.specialty}
                    </span>
                  </div>
                )}

                <h3
                  className="text-white font-black tracking-tight leading-tight mb-4 truncate drop-shadow-md"
                  style={{
                    fontFamily: headingFont,
                    fontSize: 'clamp(1.3rem, 2vw, 1.55rem)',
                  }}
                  title={barber.name}
                >
                  {barber.name}
                </h3>

                <div
                  className="pt-3.5 border-t flex items-center justify-between gap-3 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.18)' }}
                >
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-white/90 group-hover:text-white">
                    Reservar con {firstName}
                  </span>

                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1 shrink-0 shadow-md"
                    style={{
                      backgroundColor: colors.accent,
                      color: accentBtnText,
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </article>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   3. GALERÍA DE FOTOGRAFÍAS REALES + LIGHTBOX DE ALTA DEFINICIÓN
   - Sin etiquetas inventadas: solo muestra título o servicio si existen,
     y la categoría real de la fotografía.
   - Se adapta limpiamente desde 1 hasta 6+ fotografías sin estirar imágenes pequeñas.
   - Hover elegante con zoom muy sutil (1.03) y overlay ligero.
══════════════════════════════════════════════════════════════════════════ */

export interface ImmersiveGalleryShowcaseProps {
  items: any[]
  activeCategory: string
  colors: ThemeColors
  accentBtnText: string
  headingFont: string
  onBookStyle?: (service?: any) => void
}

export function ImmersiveGalleryShowcase({
  items,
  activeCategory,
  colors,
  accentBtnText,
  headingFont,
  onBookStyle,
}: ImmersiveGalleryShowcaseProps) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useGSAP(
    () => {
      if (!gridRef.current || items.length === 0) return

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gridRef.current!.querySelectorAll('[data-gallery-card]')
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.04,
              ease: 'power2.out',
              clearProps: 'transform',
            }
          )
        }
      })

      return () => mm.revert()
    },
    { scope: gridRef, dependencies: [activeCategory, items.length] }
  )

  useEffect(() => {
    if (activeIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null)
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev !== null ? (prev + 1) % items.length : null))
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev !== null ? (prev - 1 + items.length) % items.length : null
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, items.length])

  if (items.length === 0) {
    return null
  }

  const total = items.length

  // Distribución equilibrada según la cantidad de fotos reales (1 a 6+)
  const gridContainerClass =
    total === 1
      ? 'max-w-2xl mx-auto grid grid-cols-1 gap-5'
      : total === 2
        ? 'max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5'
        : total === 4
          ? 'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'

  const currentItem = activeIndex !== null ? items[activeIndex] : null

  return (
    <>
      <div ref={gridRef} className={gridContainerClass}>
        {items.map((item: any, idx: number) => {
          const realTitle: string | null = item.displayTitle || null
          const realDescription: string | null = item.description?.trim() || null
          const categoryLabel: string | null = item.displayCategory || null
          const linkedService = item.linkedService || null
          const thumbUrl = getOptimizedImageUrl(item.url, 1200)

          return (
            <div
              key={item.id || `${item.url}-${idx}`}
              data-gallery-card
              onClick={() => setActiveIndex(idx)}
              className="group relative rounded-[24px] overflow-hidden cursor-pointer border shadow-sm transition-shadow duration-300 hover:shadow-xl aspect-[4/3] bg-zinc-900"
              style={{ borderColor: colors.border }}
            >
              <img
                src={thumbUrl}
                alt={realTitle || categoryLabel || 'Fotografía de la barbería'}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />

              {/* Overlay ligero que no oscurece la fotografía */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none"
              />

              {/* Barra superior: Categoría real discreta + icono de ampliar */}
              <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 pointer-events-none">
                {categoryLabel ? (
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full backdrop-blur-md border"
                    style={{
                      color: '#ffffff',
                      backgroundColor: 'rgba(0,0,0,0.42)',
                      borderColor: 'rgba(255,255,255,0.18)',
                    }}
                  >
                    {categoryLabel}
                  </span>
                ) : (
                  <span />
                )}

                <span
                  className="w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center text-white opacity-75 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.42)',
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Pie de foto: SOLO se renderiza si existe título personalizado, descripción o servicio real asociado */}
              {(realTitle || realDescription || linkedService) && (
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-10 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    {realTitle && (
                      <p
                        className="text-white font-black tracking-tight text-sm sm:text-base leading-snug truncate drop-shadow-sm"
                        style={{ fontFamily: headingFont }}
                      >
                        {realTitle}
                      </p>
                    )}
                    {realDescription && (
                      <p className="text-xs text-zinc-200/90 line-clamp-1 mt-0.5">
                        {realDescription}
                      </p>
                    )}
                    {linkedService && realTitle !== linkedService.name && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.16em] block mt-1 truncate"
                        style={{ color: colors.accent }}
                      >
                        {linkedService.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Lightbox de Alta Definición (Preserva proporción original sin estirar) ── */}
      {currentItem && activeIndex !== null && (
        <div
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-lg flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de fotografía"
        >
          {/* Barra superior */}
          <div
            className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-xs font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
                style={{
                  color: colors.accent,
                  borderColor: `${colors.accent}45`,
                  backgroundColor: `${colors.accent}15`,
                }}
              >
                {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </span>
              {currentItem.displayCategory && (
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                  {currentItem.displayCategory}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar vista ampliada"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Imagen central en resolución original / optimizada sin distorsión */}
          <div className="relative flex-1 flex items-center justify-center my-4 max-w-6xl w-full mx-auto min-h-0">
            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex((activeIndex - 1 + items.length) % items.length)
                }}
                className="absolute left-0 sm:left-2 z-20 w-11 h-11 rounded-full bg-black/65 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Fotografía anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={getOptimizedImageUrl(currentItem.url, 2000)}
              alt={currentItem.displayTitle || currentItem.displayCategory || 'Vista ampliada'}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[74vh] max-w-[90vw] sm:max-w-[80vw] object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex((activeIndex + 1) % items.length)
                }}
                className="absolute right-0 sm:right-2 z-20 w-11 h-11 rounded-full bg-black/65 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Siguiente fotografía"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Barra inferior del Lightbox: solo muestra texto si existe información real */}
          <div
            className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/85 border border-white/15 backdrop-blur-md px-5 py-3.5 rounded-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center sm:text-left min-w-0">
              {currentItem.displayTitle ? (
                <p
                  className="text-white font-black text-sm sm:text-base tracking-tight truncate"
                  style={{ fontFamily: headingFont }}
                >
                  {currentItem.displayTitle}
                </p>
              ) : (
                <p className="text-xs font-bold uppercase tracking-wider text-white/75">
                  {currentItem.displayCategory || 'Galería'}
                </p>
              )}
              {currentItem.description?.trim() && (
                <p className="text-xs text-white/70 mt-0.5 line-clamp-2">
                  {currentItem.description}
                </p>
              )}
            </div>

            {onBookStyle && (
              <button
                type="button"
                onClick={() => {
                  const svc = currentItem.linkedService || undefined
                  setActiveIndex(null)
                  onBookStyle(svc)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                style={{ backgroundColor: colors.accent, color: accentBtnText }}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>
                  {currentItem.linkedService
                    ? `Reservar ${currentItem.linkedService.name}`
                    : 'Reservar cita'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
