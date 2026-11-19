'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { Calendar, MapPin, ArrowUpRight, ArrowDown } from 'lucide-react'
import { ThemeColors } from '@/lib/themes'
import { getOptimizedImageUrl } from '@/lib/gallery'
import CanvasScrollSequence from '@/components/public/CanvasScrollSequence'
import CinematicLuxuryHero from '@/components/public/CinematicLuxuryHero'
import { HeroVariant, isCinematicLuxuryCover } from '@/components/public/BannerPresets'

/* ── Brand WhatsApp SVG Icon ── */
const WhatsAppBrandIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export interface CinematicHeroProps {
  businessName: string
  coverTitle?: string | null
  coverSubtitle?: string | null
  slogan?: string | null
  businessDescription?: string | null
  bannerUrl: string
  address?: string | null
  isTodayOpen: boolean
  isOpenNow?: boolean
  todayHoursText?: string | null
  closedCustomMessage?: string | null
  whatsappUrl?: string | null
  servicesCount?: number
  barbersCount?: number
  themeId?: string | null
  heroVariant?: HeroVariant
  motionStyle?: string | null
  colorMode: 'dark' | 'light' | 'system'
  colors: ThemeColors
  accentBtnText: string
  headingFont: string
  bodyFont: string
  enableScrollSequence?: boolean
  sequencePattern?: string | null
  sequenceFrameCount?: number
  onBookClick: () => void
  onExploreServicesClick?: () => void
}

const LEGACY_BOILERPLATE_SUBTITLES = new Set([
  'reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería diseñada para resaltar tu mejor estilo.',
  'experiencia de autor',
  'grooming & estilo de autor',
])

/**
 * Resuelve el titular principal dinámico:
 * Si el usuario definió un titular propio en coverTitle (y no es el boilerplate genérico "Bienvenido a..."),
 * se usa ese. De lo contrario, se proyecta el nombre comercial real del negocio.
 */
function resolveHeroHeadline(businessName: string, coverTitle?: string | null): string {
  const cleanBiz = (businessName || '').trim() || 'Barbería Oficial'
  const rawCover = (coverTitle || '').trim()

  if (!rawCover) return cleanBiz

  const welcomeRegex = /^bienvenidos?\s+a\s+/i
  if (welcomeRegex.test(rawCover)) {
    const stripped = rawCover.replace(welcomeRegex, '').trim()
    if (!stripped || stripped.toLowerCase() === cleanBiz.toLowerCase()) {
      return cleanBiz
    }
    return cleanBiz || stripped
  }

  return rawCover
}

/**
 * Resuelve la descripción breve editable del Hero cuando existe y no es texto demo antiguo.
 */
function resolveHeroDescription(
  coverSubtitle?: string | null,
  businessDescription?: string | null
): string | null {
  const sub = (coverSubtitle || '').trim()
  if (sub && !LEGACY_BOILERPLATE_SUBTITLES.has(sub.toLowerCase())) {
    return sub
  }
  const desc = (businessDescription || '').trim()
  if (desc && !LEGACY_BOILERPLATE_SUBTITLES.has(desc.toLowerCase())) {
    return desc
  }
  return null
}

/**
 * Divide el nombre en 1 o 2 líneas rítmicas con métricas fluidas de clamp()
 * para la columna editorial izquierda.
 */
function getBalancedTitleMetrics(text: string): {
  line1: string
  line2: string | null
  fontSizeClamp: string
  lineHeight: number
  letterSpacing: string
} {
  const clean = text.trim().replace(/\s+/g, ' ')
  const len = clean.length
  const words = clean.split(' ')

  let line1 = clean
  let line2: string | null = null

  if (words.length === 2 && len >= 9) {
    line1 = words[0]
    line2 = words[1]
  } else if (words.length >= 3) {
    const totalChars = clean.length
    let acc = 0
    let splitIdx = 1
    for (let i = 0; i < words.length - 1; i++) {
      acc += words[i].length + 1
      splitIdx = i + 1
      if (acc >= totalChars * 0.45) break
    }
    line1 = words.slice(0, splitIdx).join(' ')
    line2 = words.slice(splitIdx).join(' ')
  }

  if (len <= 12) {
    return {
      line1,
      line2,
      fontSizeClamp: 'clamp(2.4rem, 5.2vw, 4.4rem)',
      lineHeight: 0.98,
      letterSpacing: '-0.03em',
    }
  }

  if (len <= 22) {
    return {
      line1,
      line2,
      fontSizeClamp: 'clamp(2.1rem, 4.2vw, 3.8rem)',
      lineHeight: 1.0,
      letterSpacing: '-0.025em',
    }
  }

  if (len <= 32) {
    return {
      line1,
      line2,
      fontSizeClamp: 'clamp(1.8rem, 3.4vw, 3.1rem)',
      lineHeight: 1.02,
      letterSpacing: '-0.02em',
    }
  }

  return {
    line1,
    line2,
    fontSizeClamp: 'clamp(1.6rem, 2.8vw, 2.5rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.015em',
  }
}

export default function CinematicHero(props: CinematicHeroProps) {
  const isLuxuryVariant =
    props.heroVariant === 'cinematic-luxury' ||
    (!props.heroVariant && isCinematicLuxuryCover(props.bannerUrl))

  const headline = resolveHeroHeadline(props.businessName, props.coverTitle)
  const cleanSlogan = (props.slogan || '').trim()
  const description = resolveHeroDescription(props.coverSubtitle, props.businessDescription)

  const displaySlogan = useMemo(() => {
    if (!cleanSlogan) return null
    if (cleanSlogan.toLowerCase() === props.businessName.trim().toLowerCase()) return null
    if (cleanSlogan.toLowerCase() === headline.trim().toLowerCase()) return null
    if (LEGACY_BOILERPLATE_SUBTITLES.has(cleanSlogan.toLowerCase())) return null
    return cleanSlogan
  }, [cleanSlogan, props.businessName, headline])

  if (isLuxuryVariant) {
    return (
      <CinematicLuxuryHero
        businessName={headline}
        slogan={displaySlogan}
        description={description}
        bannerUrl={props.bannerUrl}
        address={props.address}
        isTodayOpen={props.isTodayOpen}
        isOpenNow={props.isOpenNow}
        todayHoursText={props.todayHoursText}
        closedCustomMessage={props.closedCustomMessage}
        whatsappUrl={props.whatsappUrl}
        colors={props.colors}
        accentBtnText={props.accentBtnText}
        headingFont={props.headingFont}
        bodyFont={props.bodyFont}
        onBookClick={props.onBookClick}
        onExploreServicesClick={props.onExploreServicesClick}
      />
    )
  }

  return (
    <EditorialSplitHero
      {...props}
      resolvedHeadline={headline}
      resolvedSlogan={displaySlogan}
      resolvedDescription={description}
    />
  )
}

function EditorialSplitHero({
  businessName,
  resolvedHeadline: headline,
  resolvedSlogan: displaySlogan,
  resolvedDescription: description,
  bannerUrl,
  address,
  isTodayOpen,
  todayHoursText,
  closedCustomMessage,
  whatsappUrl,
  colors,
  accentBtnText,
  headingFont,
  bodyFont,
  enableScrollSequence = false,
  sequencePattern,
  sequenceFrameCount = 60,
  onBookClick,
  onExploreServicesClick,
}: CinematicHeroProps & {
  resolvedHeadline: string
  resolvedSlogan: string | null
  resolvedDescription: string | null
}) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const imgWrapRef = useRef<HTMLDivElement | null>(null)
  const bgImgRef = useRef<HTMLImageElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const statusRowRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const descRef = useRef<HTMLParagraphElement | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)
  const metaBarRef = useRef<HTMLDivElement | null>(null)

  const optimizedBannerUrl = useMemo(() => getOptimizedImageUrl(bannerUrl, 2048), [bannerUrl])

  const { line1, line2, fontSizeClamp, lineHeight, letterSpacing } = useMemo(
    () => getBalancedTitleMetrics(headline),
    [headline]
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (statusRowRef.current) {
        tl.fromTo(statusRowRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45 }, 0.05)
      }
      if (titleRef.current) {
        tl.fromTo(titleRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55 }, 0.12)
      }
      if (descRef.current) {
        tl.fromTo(descRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45 }, 0.22)
      }
      if (actionsRef.current) {
        tl.fromTo(actionsRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 0.3)
      }
      if (metaBarRef.current) {
        tl.fromTo(metaBarRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45 }, 0.38)
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [headline, displaySlogan, description])

  return (
    <section
      ref={sectionRef}
      aria-label={`Portada de ${businessName}`}
      className="relative w-full min-h-[100svh] lg:h-[100svh] lg:min-h-[660px] lg:max-h-[1040px] bg-[#070709] text-white overflow-hidden flex flex-col justify-between select-none"
      style={{ fontFamily: bodyFont }}
    >
      {/* ══════════════════════════════════════════════════════════
          CONTENEDOR PRINCIPAL DIVIDIDO (SPLIT EDITORIAL PURO)
          Desktop (lg+): Dos columnas claras 50/50.
          - Columna izquierda: fondo oscuro limpio, textos y CTAs.
          - Columna derecha: fotografía protagonista con desvanecimiento hacia la izquierda.
          Móvil (<lg): Foto arriba (42vh), contenido abajo.
      ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full flex-1 flex flex-col lg:grid lg:grid-cols-12 max-w-[1540px] mx-auto">
        
        {/* ── COLUMNA IZQUIERDA: CONTENIDO, JERARQUÍA Y ACCIONES ── */}
        <div
          ref={contentRef}
          className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center px-5 sm:px-10 lg:pl-12 lg:pr-8 xl:pl-20 pt-24 sm:pt-28 lg:pt-0 pb-6 sm:pb-8 lg:pb-0 z-20 order-last lg:order-first"
        >
          <div className="w-full max-w-xl flex flex-col items-start text-left gap-4 sm:gap-5">
            {/* 1. Indicador de Horario Real + Eslogan */}
            <div ref={statusRowRef} className="flex flex-wrap items-center gap-2.5">
              <a
                href="#horarios"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-zinc-200 active:scale-[0.98]"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {isTodayOpen && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isTodayOpen ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                </span>
                <span>
                  {isTodayOpen
                    ? todayHoursText
                      ? `Abierto hoy · ${todayHoursText}`
                      : 'Abierto hoy'
                    : closedCustomMessage?.trim() || 'Cerrado hoy'}
                </span>
              </a>

              {displaySlogan && (
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] border"
                  style={{
                    borderColor: `${colors.accent}45`,
                    backgroundColor: `${colors.accent}14`,
                    color: colors.accent,
                  }}
                >
                  {displaySlogan}
                </span>
              )}
            </div>

            {/* 2. Titular Principal Editorial */}
            <h1
              ref={titleRef}
              className="font-black uppercase tracking-tight w-full text-white"
              style={{
                fontFamily: headingFont,
                fontSize: fontSizeClamp,
                lineHeight,
                letterSpacing,
              }}
            >
              <span className="block">{line1}</span>
              {line2 && <span className="block mt-0.5">{line2}</span>}
            </h1>

            {/* 3. Descripción Editorial */}
            {description && (
              <p
                ref={descRef}
                className="text-sm sm:text-base font-normal leading-relaxed text-zinc-300 max-w-lg pl-3.5 border-l-2"
                style={{ borderColor: colors.accent }}
              >
                {description}
              </p>
            )}

            {/* 4. Botones de Acción: Reservar cita (Principal) y WhatsApp (Secundario) */}
            <div
              ref={actionsRef}
              className="pt-2 w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <button
                type="button"
                onClick={onBookClick}
                className="group min-h-[50px] inline-flex items-center justify-center gap-3 px-7 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-xl transition-all duration-200 hover:brightness-105 active:scale-[0.97] cursor-pointer"
                style={{
                  backgroundColor: colors.accent,
                  color: accentBtnText,
                }}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Reservar cita</span>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{
                    backgroundColor:
                      accentBtnText === '#000000'
                        ? 'rgba(0, 0, 0, 0.12)'
                        : 'rgba(255, 255, 255, 0.18)',
                  }}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[50px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-white/[0.07] hover:bg-white/[0.12] border border-white/20 backdrop-blur-md transition-all duration-200 active:scale-[0.97]"
                >
                  <span className="text-[#25D366]">
                    <WhatsAppBrandIcon />
                  </span>
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: ESCENARIO FOTOGRÁFICO PROTAGONISTA ── */}
        <div
          ref={imgWrapRef}
          className="lg:col-span-5 xl:col-span-6 relative w-full h-[40vh] sm:h-[46vh] lg:h-full min-h-[300px] overflow-hidden order-first lg:order-last z-10"
        >
          {enableScrollSequence && sequencePattern ? (
            <CanvasScrollSequence
              frameUrlPattern={sequencePattern}
              frameCount={sequenceFrameCount}
              progress={0}
              fallbackImageUrl={optimizedBannerUrl}
              alt={businessName}
              className="w-full h-full"
            />
          ) : (
            <img
              ref={bgImgRef}
              src={optimizedBannerUrl}
              alt={`Fotografía principal de ${businessName}`}
              className="w-full h-full object-cover object-center lg:object-[center_35%] will-change-transform"
              loading="eager"
              fetchPriority="high"
            />
          )}

          {/* Transición suave hacia la izquierda en Desktop (sin corte brusco, sin tapar textos) */}
          <div
            className="hidden lg:block absolute inset-y-0 left-0 w-36 xl:w-48 pointer-events-none z-10"
            style={{
              background:
                'linear-gradient(to right, #070709 0%, rgba(7, 7, 9, 0.85) 30%, rgba(7, 7, 9, 0.3) 70%, transparent 100%)',
            }}
          />

          {/* Sombra superior suave bajo el Navbar */}
          <div
            className="absolute inset-x-0 top-0 h-28 pointer-events-none z-10"
            style={{
              background:
                'linear-gradient(to bottom, rgba(7, 7, 9, 0.75) 0%, rgba(7, 7, 9, 0.2) 60%, transparent 100%)',
            }}
          />

          {/* Desvanecimiento inferior hacia el contenido en Móvil */}
          <div
            className="lg:hidden absolute inset-x-0 bottom-0 h-32 pointer-events-none z-10"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(7, 7, 9, 0.6) 45%, #070709 100%)',
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BARRA DE METADATOS INFERIOR (UBICACIÓN & EXPLORACIÓN)
      ══════════════════════════════════════════════════════════ */}
      <div
        ref={metaBarRef}
        className="relative z-20 w-full max-w-[1540px] mx-auto px-5 sm:px-10 lg:px-12 xl:px-20 pb-4 sm:pb-6 shrink-0"
      >
        <div className="pt-3.5 flex flex-wrap items-center justify-between gap-4 text-xs border-t border-white/10 text-zinc-400">
          {/* Dirección física */}
          {address && !address.startsWith('http') ? (
            <a
              href="#ubicacion"
              className="inline-flex items-center gap-2 font-medium text-zinc-300 hover:text-white transition-colors truncate max-w-xs sm:max-w-md"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: colors.accent }} />
              <span className="truncate">{address}</span>
            </a>
          ) : (
            <span className="font-medium text-zinc-400">{businessName}</span>
          )}

          {/* Anclaje suave hacia Servicios */}
          {onExploreServicesClick && (
            <button
              type="button"
              onClick={onExploreServicesClick}
              className="group inline-flex items-center gap-2 font-bold uppercase tracking-[0.14em] text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <span>Ver servicios</span>
              <span className="w-6 h-6 rounded-full flex items-center justify-center border border-white/20 transition-transform duration-200 group-hover:translate-y-0.5">
                <ArrowDown className="w-3 h-3" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
