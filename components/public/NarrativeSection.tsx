'use client'

import React, { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ThemeColors } from '@/lib/themes'
import { getOptimizedImageUrl } from '@/lib/gallery'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export type NarrativeTransitionVariant =
  | 'elevation-overlap'
  | 'clip-reveal'
  | 'editorial-frame'

export interface NarrativeSectionProps {
  id: string
  /** Número de capítulo editorial ("01", "02", etc.) */
  chapterNumber: string
  /** Etiqueta superior (eyebrow) */
  eyebrow: string
  /** Título principal de la sección */
  title: string
  /** Subtítulo descriptivo opcional */
  subtitle?: string
  /** Palabra arquitectónica gigante de fondo con parallax diferencial */
  watermark?: string
  /** Variante de transición narrativa al entrar en viewport */
  variant?: NarrativeTransitionVariant
  /** Alineación del encabezado editorial */
  headerAlign?: 'left' | 'center'
  /** Contenido adicional debajo del subtítulo en el header (ej. tabs, badges, estrellas) */
  headerSlot?: React.ReactNode
  /** ID del tema visual actual */
  themeId?: string | null
  /** Estilo de movimiento configurado ("ELEGANT" | "CINEMATIC" | "DYNAMIC") */
  motionStyle?: string | null
  /** Modo de color activo */
  colorMode: 'dark' | 'light' | 'system'
  /** Paleta de colores resuelta */
  colors: ThemeColors
  /** Fuente de titulares */
  headingFont: string
  /** Color de fondo de la sección */
  backgroundColor?: string
  /** Clases adicionales para el elemento section */
  className?: string
  /** Ref externa opcional (ej. reserveRef para scrollToBooking) */
  sectionRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

export function NarrativeSection({
  id,
  chapterNumber,
  eyebrow,
  title,
  subtitle,
  watermark,
  variant = 'editorial-frame',
  headerAlign = 'left',
  headerSlot,
  themeId,
  motionStyle,
  colorMode,
  colors,
  headingFont,
  backgroundColor,
  className = '',
  sectionRef,
  children,
}: NarrativeSectionProps) {
  const internalRef = useRef<HTMLElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const hairlineRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const watermarkRef = useRef<HTMLDivElement | null>(null)
  const orbRef = useRef<HTMLDivElement | null>(null)

  const isLight = colorMode === 'light'
  const bg = backgroundColor || colors.surface

  // Asignar tanto ref interna como ref externa si existe
  const setRefs = (node: HTMLElement | null) => {
    internalRef.current = node
    if (sectionRef) {
      ; (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  useGSAP(
    () => {
      const sectionEl = internalRef.current
      if (!sectionEl) return

      const mm = gsap.matchMedia()

      // ── 1. Accesibilidad: Movimiento Reducido ──
      mm.add('(prefers-reduced-motion: reduce)', () => {
        const allAnimated = sectionEl.querySelectorAll(
          '[data-narrative-header], [data-narrative-item], [data-narrative-slot]'
        )
        gsap.set(allAnimated, { clearProps: 'all', opacity: 1 })
        if (hairlineRef.current) {
          gsap.set(hairlineRef.current, { scaleX: 1 })
        }
      })

      // ── 2. Sistema Unificado de Animación Editorial por Sección (1 Timeline Coordinada + 1 Scrub de Fondo) ──
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const entryTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 82%',
            toggleActions: 'play none none none',
            invalidateOnRefresh: true,
          },
        })

        // 2a. Línea divisoria arquitectónica (0.0s)
        if (hairlineRef.current) {
          entryTl.fromTo(
            hairlineRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            {
              scaleX: 1,
              duration: 0.65,
              ease: 'power3.out',
            },
            0
          )
        }

        // 2b. Título y subtítulo de la sección (0.0s — desplazamiento vertical corto y opacidad)
        if (headerRef.current) {
          const headerParts = headerRef.current.querySelectorAll('[data-narrative-header]')
          if (headerParts.length > 0) {
            entryTl.fromTo(
              headerParts,
              { opacity: 0, y: 22 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.07,
                ease: 'power3.out',
                clearProps: 'transform',
              },
              0
            )
          }
        }

        // 2c. Tarjetas / filas (Servicios, Equipo, etc. — entran casi de inmediato en 0.14s con stagger coordinado)
        const items = sectionEl.querySelectorAll('[data-narrative-item]')
        if (items.length > 0) {
          entryTl.fromTo(
            items,
            { opacity: 0, y: 28, scale: 0.985 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.62,
              stagger: 0.09,
              ease: 'power3.out',
              clearProps: 'transform,scale',
            },
            0.14
          )
        }

        // 2d. Letras decorativas grandes del fondo (movimiento sutil vinculado al scroll)
        if (watermarkRef.current) {
          gsap.fromTo(
            watermarkRef.current,
            { xPercent: 6, yPercent: 10 },
            {
              xPercent: -8,
              yPercent: -10,
              ease: 'none',
              force3D: true,
              scrollTrigger: {
                trigger: sectionEl,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.2,
                invalidateOnRefresh: true,
              },
            }
          )
        }
      })

      return () => mm.revert()
    },
    {
      scope: internalRef,
      dependencies: [variant, colorMode],
    }
  )

  const isCentered = headerAlign === 'center'

  return (
    <section
      id={id}
      ref={setRefs}
      className={`relative overflow-hidden ${variant === 'elevation-overlap'
        ? '-mt-6 sm:-mt-10 z-20 rounded-t-[32px] sm:rounded-t-[48px] shadow-[0_-20px_60px_rgba(0,0,0,0.35)] border-t'
        : 'border-t'
        } ${className}`}
      style={{
        borderColor: colors.border,
        backgroundColor: bg,
      }}
    >
      <div ref={stageRef} className="relative py-20 sm:py-28 px-5 sm:px-8 lg:px-12">
        {/* ── Luz ambiental estática (radial-gradient nativo sin filtro blur-3xl costoso) ── */}
        <div
          ref={orbRef}
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-24 right-1/4 w-[28rem] h-[28rem] rounded-full opacity-25"
          style={{
            background: `radial-gradient(circle, ${colors.accent}${isLight ? '18' : '22'} 0%, transparent 70%)`,
          }}
        />

        {/* ── Marca de agua tipográfica arquitectónica con parallax sutil ── */}
        {watermark && (
          <div
            ref={watermarkRef}
            aria-hidden="true"
            className="pointer-events-none select-none absolute top-8 right-2 sm:right-8 z-0 overflow-hidden"
          >
            <span
              className="block font-black uppercase tracking-tighter leading-none whitespace-nowrap"
              style={{
                fontFamily: headingFont,
                fontSize: 'clamp(4.5rem, 13vw, 12rem)',
                color: isLight ? 'rgba(0,0,0,0.038)' : 'rgba(255,255,255,0.045)',
              }}
            >
              {watermark}
            </span>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* ── Barra índice de capítulo editorial + Hairline animada ── */}
          <div className="mb-10 sm:mb-14">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[11px] font-black tracking-[0.25em] uppercase px-2.5 py-1 rounded-md border"
                  style={{
                    color: colors.accent,
                    borderColor: `${colors.accent}40`,
                    backgroundColor: `${colors.accent}12`,
                  }}
                >
                  CAP. {chapterNumber}
                </span>
                <span
                  className="text-[11px] font-black uppercase tracking-[0.24em]"
                  style={{ color: colors.accent }}
                >
                  {eyebrow}
                </span>
              </div>

              <span
                className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-[0.22em] opacity-40"
                style={{ color: colors.textSecondary }}
              >
                {watermark || eyebrow} // {chapterNumber}
              </span>
            </div>

            {/* Línea arquitectónica horizontal animada con ScrollTrigger */}
            <div
              className="w-full h-px relative overflow-hidden"
              style={{ backgroundColor: `${colors.border}80` }}
            >
              <div
                ref={hairlineRef}
                className="absolute inset-y-0 left-0 w-40 sm:w-64 h-full"
                style={{ backgroundColor: colors.accent }}
              />
            </div>
          </div>

          {/* ── Encabezado Editorial Principal ── */}
          <div
            ref={headerRef}
            className={`mb-12 sm:mb-16 ${isCentered
              ? 'text-center max-w-3xl mx-auto'
              : 'flex flex-col lg:flex-row lg:items-end justify-between gap-6'
              }`}
          >
            <div className={isCentered ? 'mx-auto' : 'max-w-2xl'}>
              <h2
                data-narrative-header
                className="font-black tracking-tight leading-[0.98]"
                style={{
                  fontFamily: headingFont,
                  fontSize: 'clamp(2.1rem, 4.5vw, 3.75rem)',
                  color: colors.textPrimary,
                }}
              >
                {title}
              </h2>

              {subtitle && (
                <p
                  data-narrative-header
                  className={`text-sm sm:text-base font-medium leading-relaxed opacity-80 mt-4 ${isCentered ? 'max-w-xl mx-auto' : 'max-w-xl'
                    }`}
                  style={{ color: colors.textSecondary }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {headerSlot && (
              <div
                data-narrative-header
                className={isCentered ? 'mt-6 flex flex-col items-center' : 'shrink-0'}
              >
                {headerSlot}
              </div>
            )}
          </div>

          {/* ── Cuerpo de la sección ── */}
          <div>{children}</div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   BANDA NARRATIVA INTERMEDIA (CINEMATIC STATEMENT BAND)
   Transición escénica con tipografía cinética en doble dirección y ventana
   fotográfica revelada mediante clip-path controlado por scroll.
══════════════════════════════════════════════════════════════════════════ */

export interface CinematicStatementBandProps {
  primaryText: string
  secondaryText: string
  imageUrl: string
  caption: string
  themeId?: string | null
  motionStyle?: string | null
  colorMode: 'dark' | 'light' | 'system'
  colors: ThemeColors
  headingFont: string
  onActionClick?: () => void
}

export function CinematicStatementBand({
  primaryText,
  secondaryText,
  imageUrl,
  caption,
  colorMode,
  colors,
  headingFont,
  onActionClick,
}: CinematicStatementBandProps) {
  const bandRef = useRef<HTMLDivElement | null>(null)
  const rowLeftRef = useRef<HTMLDivElement | null>(null)
  const rowRightRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useGSAP(
    () => {
      const bandEl = bandRef.current
      if (!bandEl) return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: reduce)', () => {
        if (rowLeftRef.current) gsap.set(rowLeftRef.current, { clearProps: 'all' })
        if (rowRightRef.current) gsap.set(rowRightRef.current, { clearProps: 'all' })
        if (imgRef.current) gsap.set(imgRef.current, { clearProps: 'all' })
      })

      // Movimiento horizontal fluido del nombre comercial sincronizado con el scroll (GPU translate3d, cero clip-path)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (rowLeftRef.current) {
          gsap.fromTo(
            rowLeftRef.current,
            { xPercent: -2 },
            {
              xPercent: -24,
              ease: 'none',
              force3D: true,
              scrollTrigger: {
                trigger: bandEl,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.25,
                invalidateOnRefresh: true,
              },
            }
          )
        }

        if (rowRightRef.current) {
          gsap.fromTo(
            rowRightRef.current,
            { xPercent: -22 },
            {
              xPercent: -2,
              ease: 'none',
              force3D: true,
              scrollTrigger: {
                trigger: bandEl,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.25,
                invalidateOnRefresh: true,
              },
            }
          )
        }

        if (imgRef.current) {
          gsap.fromTo(
            imgRef.current,
            { scale: 1.06, yPercent: -5 },
            {
              scale: 1.06,
              yPercent: 5,
              ease: 'none',
              force3D: true,
              scrollTrigger: {
                trigger: bandEl,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.25,
                invalidateOnRefresh: true,
              },
            }
          )
        }
      })

      return () => mm.revert()
    },
    { scope: bandRef, dependencies: [primaryText, secondaryText, colorMode] }
  )

  return (
    <div
      ref={bandRef}
      className="relative py-16 sm:py-24 border-t overflow-hidden select-none"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      {/* ── Fila Cinética 1 (Desplazamiento Izquierda) ── */}
      <div
        ref={rowLeftRef}
        aria-hidden="true"
        className="w-max whitespace-nowrap flex items-center gap-8 opacity-20 pointer-events-none mb-4 will-change-transform"
      >
        {[0, 1, 2, 3].map((idx) => (
          <span
            key={idx}
            className="font-black uppercase tracking-tighter leading-none"
            style={{
              fontFamily: headingFont,
              fontSize: 'clamp(2.75rem, 7vw, 6.5rem)',
              color: colors.textPrimary,
            }}
          >
            {primaryText} <span style={{ color: colors.accent }}>✦</span>
          </span>
        ))}
      </div>

      {/* ── Gran Banner Escénico de Formato Cinematográfico ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -my-4 sm:-my-8">
        <div
          ref={frameRef}
          onClick={onActionClick}
          className={`relative h-[50vh] sm:h-[65vh] md:h-[75vh] min-h-[440px] max-h-[780px] rounded-[32px] sm:rounded-[40px] overflow-hidden border shadow-2xl ${onActionClick ? 'cursor-pointer group' : ''
            }`}
          style={{ borderColor: `${colors.accent}45` }}
        >
          <img
            ref={imgRef}
            src={getOptimizedImageUrl(imageUrl, 2048)}
            alt={caption || primaryText}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          {/* Velo editorial profundo: iluminación balanceada y lectura perfecta de titulares */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(9,9,11,0.85) 0%, rgba(9,9,11,0.25) 48%, rgba(9,9,11,0.38) 100%)',
            }}
          />

          <div className="absolute inset-0 p-6 sm:p-10 md:p-14 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[11px] font-black uppercase tracking-[0.22em] px-4 py-1.5 rounded-full border shadow-md"
                style={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.24)',
                  backgroundColor: 'rgba(9,9,13,0.82)',
                }}
              >
                ✦ {primaryText}
              </span>
              <span
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ backgroundColor: colors.accent }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="max-w-2xl min-w-0">
                {caption ? (
                  <p
                    className="text-white font-black tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] text-balance"
                    style={{
                      fontFamily: headingFont,
                      fontSize: 'clamp(1.65rem, 3.8vw, 3rem)',
                    }}
                  >
                    {caption}
                  </p>
                ) : (
                  <p
                    className="text-white font-black tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] text-balance"
                    style={{
                      fontFamily: headingFont,
                      fontSize: 'clamp(1.65rem, 3.8vw, 3rem)',
                    }}
                  >
                    {primaryText}
                  </p>
                )}
              </div>
              {onActionClick && (
                <span
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest px-7 py-3.5 rounded-full transition-transform duration-300 group-hover:scale-105 shrink-0 self-start sm:self-auto shadow-2xl"
                  style={{
                    backgroundColor: colors.accent,
                    color: '#09090b',
                  }}
                >
                  Reservar cita →
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fila Cinética 2 (Desplazamiento Derecha) ── */}
      {secondaryText ? (
        <div
          ref={rowRightRef}
          aria-hidden="true"
          className="w-max whitespace-nowrap flex items-center gap-8 opacity-20 pointer-events-none mt-2 will-change-transform"
        >
          {[0, 1, 2, 3].map((idx) => (
            <span
              key={idx}
              className="font-black uppercase tracking-tighter leading-none"
              style={{
                fontFamily: headingFont,
                fontSize: 'clamp(2.75rem, 7vw, 6.5rem)',
                WebkitTextStroke: `1px ${colors.textPrimary}`,
                color: 'transparent',
              }}
            >
              {secondaryText} <span style={{ color: colors.accent }}>•</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
