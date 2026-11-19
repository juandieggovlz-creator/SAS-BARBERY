'use client'

import React, { useRef, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Calendar, MapPin, ArrowUpRight, ArrowDown } from 'lucide-react'
import { ThemeColors } from '@/lib/themes'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/* ── Brand WhatsApp SVG Icon ── */
const WhatsAppBrandIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export interface CinematicLuxuryHeroProps {
  businessName: string
  slogan?: string | null
  description?: string | null
  bannerUrl: string
  address?: string | null
  isTodayOpen: boolean
  isOpenNow?: boolean
  todayHoursText?: string | null
  closedCustomMessage?: string | null
  whatsappUrl?: string | null
  colors: ThemeColors
  accentBtnText: string
  headingFont: string
  bodyFont: string
  onBookClick: () => void
  onExploreServicesClick?: () => void
}

/**
 * 60 fotogramas muestreados uniformemente (f_0001, f_0003, ..., f_0120) desde la secuencia
 * de 120 frames (1280×720). Para un recorrido corto de ~540px en escritorio (~360px en móvil),
 * 60 fotogramas ofrecen 1 frame cada ~9px de scroll, reduciendo a la mitad el tráfico de red
 * y el tiempo de decodificación.
 */
const ACTIVE_FRAME_COUNT = 60

function getMappedFileIndex(slotIdx: number): number {
  if (slotIdx <= 0) return 1
  if (slotIdx >= ACTIVE_FRAME_COUNT - 1) return 120
  return Math.min(120, Math.round((slotIdx / (ACTIVE_FRAME_COUNT - 1)) * 119) + 1)
}

function getSlotFrameUrl(slotIdx: number): string {
  const fileNum = getMappedFileIndex(slotIdx)
  return `/imagenes/silla-frames/f_${String(fileNum).padStart(4, '0')}.webp`
}

/**
 * Divide el nombre comercial en 1 o 2 líneas equilibradas con escala fluida clamp()
 */
function getLuxuryTitleMetrics(text: string): {
  lines: string[]
  fontSizeClamp: string
  lineHeight: number
  letterSpacing: string
} {
  const clean = (text || 'Barbería Oficial').trim().replace(/\s+/g, ' ')
  const len = clean.length
  const words = clean.split(' ')

  let lines: string[] = [clean]

  if (words.length === 2 && len >= 9) {
    lines = [words[0], words[1]]
  } else if (words.length >= 3) {
    let acc = 0
    let splitIdx = 1
    for (let i = 0; i < words.length - 1; i++) {
      acc += words[i].length + 1
      splitIdx = i + 1
      if (acc >= len * 0.44) break
    }
    lines = [words.slice(0, splitIdx).join(' '), words.slice(splitIdx).join(' ')]
  }

  if (len <= 11) {
    return {
      lines,
      fontSizeClamp: 'clamp(2.65rem, 6.2vw, 5.4rem)',
      lineHeight: 0.94,
      letterSpacing: '-0.035em',
    }
  }
  if (len <= 20) {
    return {
      lines,
      fontSizeClamp: 'clamp(2.25rem, 4.9vw, 4.35rem)',
      lineHeight: 0.97,
      letterSpacing: '-0.03em',
    }
  }
  if (len <= 30) {
    return {
      lines,
      fontSizeClamp: 'clamp(1.95rem, 3.8vw, 3.5rem)',
      lineHeight: 1.0,
      letterSpacing: '-0.025em',
    }
  }
  return {
    lines,
    fontSizeClamp: 'clamp(1.7rem, 3.0vw, 2.75rem)',
    lineHeight: 1.04,
    letterSpacing: '-0.02em',
  }
}

type FrameSource = ImageBitmap | HTMLImageElement

export default function CinematicLuxuryHero({
  businessName,
  slogan,
  description,
  bannerUrl,
  address,
  isTodayOpen,
  isOpenNow,
  todayHoursText,
  closedCustomMessage,
  whatsappUrl,
  colors,
  accentBtnText,
  headingFont,
  bodyFont,
  onBookClick,
  onExploreServicesClick,
}: CinematicLuxuryHeroProps) {
  const headline = (businessName || '').trim() || 'Barbería Oficial'
  const { lines, fontSizeClamp, lineHeight, letterSpacing } = useMemo(
    () => getLuxuryTitleMetrics(headline),
    [headline]
  )

  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const posterWrapRef = useRef<HTMLDivElement | null>(null)
  const leftScrimRef = useRef<HTMLDivElement | null>(null)
  const contentWrapRef = useRef<HTMLDivElement | null>(null)
  const statusRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const sloganRef = useRef<HTMLDivElement | null>(null)
  const descRef = useRef<HTMLParagraphElement | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)
  const bottomBarRef = useRef<HTMLDivElement | null>(null)
  const scrollHintRef = useRef<HTMLDivElement | null>(null)

  const effectiveOpenNow = typeof isOpenNow === 'boolean' ? isOpenNow : isTodayOpen
  const statusLabel = useMemo(() => {
    if (effectiveOpenNow) {
      return todayHoursText ? `ABIERTO AHORA · ${todayHoursText}` : 'ABIERTO AHORA'
    }
    if (isTodayOpen && todayHoursText) {
      return `CERRADO · Hoy ${todayHoursText}`
    }
    return closedCustomMessage?.trim()
      ? `CERRADO · ${closedCustomMessage.trim()}`
      : 'CERRADO'
  }, [effectiveOpenNow, isTodayOpen, todayHoursText, closedCustomMessage])

  const isCanonicalLuxuryAsset =
    !bannerUrl ||
    bannerUrl.includes('hero-cinematic-luxury') ||
    bannerUrl.includes('banner-barber-premium') ||
    bannerUrl.includes('silla')

  // ── 1. Microanimaciones de entrada de la interfaz superpuesta ──
  useGSAP(
    () => {
      if (!sectionRef.current) return
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) return

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (statusRef.current) {
        tl.fromTo(
          statusRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.45 },
          0.04
        )
      }
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.55 },
          0.1
        )
      }
      if (sloganRef.current) {
        tl.fromTo(
          sloganRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45 },
          0.18
        )
      }
      if (descRef.current) {
        tl.fromTo(
          descRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45 },
          0.24
        )
      }
      if (actionsRef.current) {
        tl.fromTo(
          actionsRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5 },
          0.3
        )
      }
      if (bottomBarRef.current) {
        tl.fromTo(
          bottomBarRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.45 },
          0.38
        )
      }
    },
    { scope: sectionRef, dependencies: [headline, slogan, description] }
  )

  // ── 2. Motor Canvas con ImageBitmap Off-Thread + ScrollTrigger Pin Corto (~540px Desktop / ~360px Móvil) ──
  useGSAP(
    () => {
      if (!isCanonicalLuxuryAsset) return

      const sectionEl = sectionRef.current
      const canvas = canvasRef.current
      if (!sectionEl || !canvas) return

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) return

      let isCancelled = false
      let viewportW = window.innerWidth
      let isMobile = viewportW < 768
      const frameStep = isMobile ? 2 : 1

      const frames: (FrameSource | null)[] = new Array(ACTIVE_FRAME_COUNT).fill(null)
      const inFlight = new Set<number>()
      let currentProgress = 0
      let lastDrawnSlot = -1
      let canvasReady = false

      const ctx2d = canvas.getContext('2d', { alpha: false })

      /**
       * Buffer interno 1280×720 (nativo) o adaptado al aspect-ratio del viewport con tope 1280px.
       */
      const syncCanvasSize = () => {
        const parent = canvas.parentElement
        if (!parent) return
        viewportW = window.innerWidth
        isMobile = viewportW < 768
        const cw = Math.max(1, parent.clientWidth)
        const ch = Math.max(1, parent.clientHeight)
        const maxWidth = isMobile ? 854 : 1280
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        const targetW = Math.min(maxWidth, Math.round(cw * dpr))
        const aspect = ch / cw
        const targetH = Math.max(1, Math.round(targetW * aspect))

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW
          canvas.height = targetH
          lastDrawnSlot = -1
          renderFrameForProgress(currentProgress, true)
        }
      }

      /**
       * Dibuja el ImageBitmap en < 0.1ms sin bloquear el hilo principal.
       */
      const drawCoverFrame = (source: FrameSource, progress: number) => {
        if (!ctx2d) return
        const cw = canvas.width
        const ch = canvas.height
        const iw = 'width' in source && source.width ? source.width : 1280
        const ih = 'height' in source && source.height ? source.height : 720
        if (!cw || !ch) return

        const scale = Math.max(cw / iw, ch / ih)
        const sw = iw * scale
        const sh = ih * scale

        const focalX = viewportW < 1024
          ? 0.74 - Math.min(1, progress * 1.45) * 0.24
          : 0.5
        const focalY = 0.48

        const dx = (cw - sw) * focalX
        const dy = (ch - sh) * focalY

        ctx2d.drawImage(source, dx, dy, sw, sh)
      }

      const getNearestLoadedSlot = (targetSlot: number): { slot: number; src: FrameSource } | null => {
        const direct = frames[targetSlot]
        if (direct) return { slot: targetSlot, src: direct }

        for (let offset = 1; offset < ACTIVE_FRAME_COUNT; offset++) {
          const prev = targetSlot - offset
          if (prev >= 0 && frames[prev]) {
            return { slot: prev, src: frames[prev]! }
          }
          const next = targetSlot + offset
          if (next < ACTIVE_FRAME_COUNT && frames[next]) {
            return { slot: next, src: frames[next]! }
          }
        }
        return null
      }

      /**
       * Decodifica el fotograma fuera del hilo principal mediante createImageBitmap
       * para que nunca bloquee el scroll ni se desaloje de la caché de texturas.
       */
      const loadSlot = async (slotIdx: number): Promise<boolean> => {
        if (isCancelled || slotIdx < 0 || slotIdx >= ACTIVE_FRAME_COUNT) return false
        if (frames[slotIdx]) return true
        if (inFlight.has(slotIdx)) return false

        inFlight.add(slotIdx)
        const url = getSlotFrameUrl(slotIdx)

        try {
          if (typeof window.createImageBitmap === 'function') {
            const res = await fetch(url, { priority: slotIdx < 10 ? 'high' : 'auto' } as RequestInit)
            if (!res.ok) throw new Error('HTTP ' + res.status)
            const blob = await res.blob()
            const bitmap = await window.createImageBitmap(blob)
            inFlight.delete(slotIdx)

            if (isCancelled) {
              bitmap.close()
              return false
            }
            frames[slotIdx] = bitmap
          } else {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const el = new Image()
              el.decoding = 'async'
              el.src = url
              el.onload = () => resolve(el)
              el.onerror = reject
            })
            inFlight.delete(slotIdx)
            if (isCancelled) return false
            frames[slotIdx] = img
          }

          if (!canvasReady && slotIdx === 0) {
            canvasReady = true
            syncCanvasSize()
            canvas.style.opacity = '1'
            if (posterWrapRef.current) {
              posterWrapRef.current.style.opacity = '0'
            }
          } else {
            const targetSlot = Math.min(
              ACTIVE_FRAME_COUNT - 1,
              Math.round(currentProgress * (ACTIVE_FRAME_COUNT - 1))
            )
            if (Math.abs(slotIdx - targetSlot) <= 1) {
              renderFrameForProgress(currentProgress, true)
            }
          }
          return true
        } catch {
          inFlight.delete(slotIdx)
          return false
        }
      }

      const renderFrameForProgress = (progress: number, force = false) => {
        const clamped = Math.max(0, Math.min(1, progress))
        currentProgress = clamped
        const rawSlot = Math.min(
          ACTIVE_FRAME_COUNT - 1,
          Math.round(clamped * (ACTIVE_FRAME_COUNT - 1))
        )
        const targetSlot =
          frameStep === 2 && rawSlot < ACTIVE_FRAME_COUNT - 1
            ? rawSlot - (rawSlot % 2)
            : rawSlot

        if (!frames[targetSlot]) {
          loadSlot(targetSlot)
          const next = targetSlot + frameStep
          const prev = targetSlot - frameStep
          if (next < ACTIVE_FRAME_COUNT && !frames[next]) loadSlot(next)
          if (prev >= 0 && !frames[prev]) loadSlot(prev)
        }

        const match = getNearestLoadedSlot(targetSlot)
        if (!match) return

        if (!force && match.slot === lastDrawnSlot && match.slot === targetSlot) return
        drawCoverFrame(match.src, clamped)
        lastDrawnSlot = match.slot
      }

      syncCanvasSize()
      const resizeObserver = new ResizeObserver(() => {
        syncCanvasSize()
      })
      if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement)
      }

      // Precarga rápida fuera del hilo principal (60 bitmaps en Desktop / 30 en Móvil)
      ;(async () => {
        await loadSlot(0)
        if (isCancelled) return

        // Primeros 10 slots inmediatos
        const initialBatch: number[] = []
        for (let i = frameStep; i <= 10 && i < ACTIVE_FRAME_COUNT; i += frameStep) {
          initialBatch.push(i)
        }
        await Promise.all(initialBatch.map((s) => loadSlot(s)))
        if (isCancelled) return

        // Keyframes cada 4 slots
        const anchors: number[] = []
        for (let i = 12; i < ACTIVE_FRAME_COUNT; i += 4) {
          if (!frames[i]) anchors.push(i)
        }
        if (!frames[ACTIVE_FRAME_COUNT - 1]) anchors.push(ACTIVE_FRAME_COUNT - 1)
        for (let i = 0; i < anchors.length; i += 5) {
          if (isCancelled) return
          await Promise.all(anchors.slice(i, i + 5).map((s) => loadSlot(s)))
        }

        // Relleno completo en lotes de 6
        const remaining: number[] = []
        for (let i = frameStep; i < ACTIVE_FRAME_COUNT; i += frameStep) {
          if (!frames[i]) remaining.push(i)
        }
        for (let i = 0; i < remaining.length; i += 6) {
          if (isCancelled) return
          await Promise.all(remaining.slice(i, i + 6).map((s) => loadSlot(s)))
        }
      })()

      /**
       * Distancia física de scroll reducida un ~55%:
       * - Antes: 1080–1320 px en escritorio (850–1050 px tablet, 640–820 px móvil).
       * - Ahora: 500–600 px en escritorio (~5 giros cortos de rueda), 420–480 px en tablet, 320–380 px en móvil.
       */
      const getPinScrollDistance = () => {
        const vh = window.innerHeight || 800
        if (window.innerWidth < 768) {
          return Math.round(Math.min(380, Math.max(320, vh * 0.45)))
        }
        if (window.innerWidth < 1024) {
          return Math.round(Math.min(480, Math.max(400, vh * 0.5)))
        }
        return Math.round(Math.min(600, Math.max(480, vh * 0.56)))
      }

      const applyHeroState = (p: number, forceCanvas = false) => {
        renderFrameForProgress(p, forceCanvas)

        if (contentWrapRef.current) {
          const fadeProgress = Math.max(0, Math.min(1, (p - 0.48) / 0.44))
          const opacity = 1 - fadeProgress * 0.9
          const translateY = -fadeProgress * 22
          contentWrapRef.current.style.opacity = opacity.toFixed(3)
          contentWrapRef.current.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`
        }

        if (leftScrimRef.current) {
          const scrimOpacity = 1 - Math.max(0, Math.min(1, (p - 0.42) / 0.48)) * 0.65
          leftScrimRef.current.style.opacity = scrimOpacity.toFixed(3)
        }

        if (scrollHintRef.current) {
          const hintOpacity = Math.max(0, 1 - p * 4)
          scrollHintRef.current.style.opacity = hintOpacity.toFixed(3)
        }
      }

      const st = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top top',
        end: () => `+=${getPinScrollDistance()}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.06,
        anticipatePin: 1,
        refreshPriority: 10,
        invalidateOnRefresh: true,
        onUpdate: (self) => applyHeroState(self.progress),
        onLeaveBack: () => applyHeroState(0, true),
        onLeave: () => applyHeroState(1, true),
      })

      ScrollTrigger.sort()
      ScrollTrigger.refresh()

      return () => {
        isCancelled = true
        resizeObserver.disconnect()
        st.kill()
        for (let i = 0; i < frames.length; i++) {
          const f = frames[i]
          if (f) {
            if ('close' in f && typeof f.close === 'function') {
              f.close()
            } else if ('src' in f) {
              f.src = ''
            }
            frames[i] = null
          }
        }
        inFlight.clear()
      }
    },
    { scope: sectionRef, dependencies: [isCanonicalLuxuryAsset] }
  )

  return (
    <section
      ref={sectionRef}
      aria-label={`Portada de ${businessName}`}
      className="relative w-full h-[100svh] min-h-[620px] max-h-[1120px] bg-[#060608] text-white overflow-hidden flex flex-col justify-between select-none"
      style={{ fontFamily: bodyFont }}
    >
      {/* ══════════════════════════════════════════════════════════
          CAPA 1: ESCENARIO CINEMATOGRÁFICO (PRIMER FOTOGRAMA + CANVAS IMAGEBITMAP)
      ══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {isCanonicalLuxuryAsset ? (
          <>
            <div
              ref={posterWrapRef}
              className="absolute inset-0 w-full h-full transition-opacity duration-150"
            >
              <picture className="block w-full h-full">
                <source srcSet="/imagenes/hero-cinematic-luxury.avif" type="image/avif" />
                <source srcSet="/imagenes/hero-cinematic-luxury.webp" type="image/webp" />
                <img
                  src="/imagenes/silla-frames/f_0001.webp"
                  alt={`Interior arquitectónico de ${businessName}`}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover object-[74%_48%] sm:object-[68%_48%] lg:object-center"
                />
              </picture>
            </div>

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full block opacity-0"
            />
          </>
        ) : (
          <img
            src={bannerUrl}
            alt={`Portada de ${businessName}`}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-[74%_48%] sm:object-[68%_48%] lg:object-center"
          />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          CAPA 2: DEGRADADOS DE LEGIBILIDAD LOCALIZADOS
      ══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
        <div ref={leftScrimRef} className="absolute inset-0">
          <div
            className="hidden lg:block absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(6, 6, 8, 0.76) 0%, rgba(6, 6, 8, 0.46) 28%, rgba(6, 6, 8, 0.12) 48%, transparent 64%)',
            }}
          />

          <div
            className="lg:hidden absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(6, 6, 8, 0.42) 0%, rgba(6, 6, 8, 0.12) 34%, rgba(6, 6, 8, 0.62) 68%, rgba(6, 6, 8, 0.86) 100%)',
            }}
          />
        </div>

        <div
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background:
              'linear-gradient(to bottom, rgba(6, 6, 8, 0.62) 0%, rgba(6, 6, 8, 0.18) 60%, transparent 100%)',
          }}
        />

        <div
          className="absolute inset-x-0 bottom-0 h-28"
          style={{
            background:
              'linear-gradient(to top, rgba(6, 6, 8, 0.84) 0%, rgba(6, 6, 8, 0.28) 55%, transparent 100%)',
          }}
        />
      </div>

      {/* Espaciador del Navbar superior fijo */}
      <div className="h-20 sm:h-24 shrink-0 pointer-events-none" aria-hidden="true" />

      {/* ══════════════════════════════════════════════════════════
          CAPA 3: INTERFAZ SUPERPUESTA (ZONA OSCURA IZQUIERDA)
          Sin backdrop-blur dentro del contenedor animado para evitar
          readbacks de GPU sobre el Canvas durante el scroll.
      ══════════════════════════════════════════════════════════ */}
      <div className="relative z-20 flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 flex items-end pb-8 sm:pb-12 lg:items-center lg:pb-0">
        <div
          ref={contentWrapRef}
          className="w-full max-w-xl lg:max-w-[52%] xl:max-w-[46%] flex flex-col items-start text-left gap-4 sm:gap-5"
        >
          {/* 1. Indicador dinámico ABIERTO AHORA / CERRADO */}
          <div ref={statusRef} className="flex flex-wrap items-center gap-2.5">
            <a
              href="#horarios"
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-150 bg-[#09090d]/85 hover:bg-[#09090d] border border-white/15 text-zinc-100"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    effectiveOpenNow ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span>{statusLabel}</span>
            </a>
          </div>

          {/* 2. Nombre comercial grande y protagonista */}
          <h1
            ref={titleRef}
            className="font-black uppercase tracking-tight w-full text-white"
            style={{
              fontFamily: headingFont,
              fontSize: fontSizeClamp,
              lineHeight,
              letterSpacing,
              textShadow: '0 6px 28px rgba(0, 0, 0, 0.5)',
            }}
          >
            {lines.map((line, idx) => (
              <span key={`${line}-${idx}`} className="block">
                {line}
              </span>
            ))}
          </h1>

          {/* 3. Eslogan editable */}
          {slogan && (
            <div ref={sloganRef} className="flex items-center gap-3">
              <span
                className="w-7 h-[1.5px] rounded-full shrink-0"
                style={{ backgroundColor: colors.accent }}
                aria-hidden="true"
              />
              <p
                className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em]"
                style={{ color: colors.accent }}
              >
                {slogan}
              </p>
            </div>
          )}

          {/* 4. Descripción breve */}
          {description && (
            <p
              ref={descRef}
              className="text-sm sm:text-base font-normal leading-relaxed text-zinc-200/95 max-w-md"
              style={{ textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)' }}
            >
              {description}
            </p>
          )}

          {/* 5. Botones de acción */}
          <div
            ref={actionsRef}
            className="pt-2 w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <button
              type="button"
              onClick={onBookClick}
              className="group min-h-[52px] inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-[0.14em] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-transform duration-150 hover:brightness-105 active:scale-[0.98] cursor-pointer"
              style={{
                backgroundColor: colors.accent,
                color: accentBtnText,
              }}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Reservar cita</span>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                style={{
                  backgroundColor:
                    accentBtnText === '#000000'
                      ? 'rgba(0, 0, 0, 0.14)'
                      : 'rgba(255, 255, 255, 0.2)',
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
                className="min-h-[52px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] text-white bg-[#09090d]/85 hover:bg-[#09090d] border border-white/20 hover:border-white/35 transition-colors duration-150 active:scale-[0.98]"
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

      {/* ══════════════════════════════════════════════════════════
          CAPA 4: CONTENIDO INFERIOR SUPERPUESTO
      ══════════════════════════════════════════════════════════ */}
      <div
        ref={bottomBarRef}
        className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 pb-5 sm:pb-7 shrink-0"
      >
        <div className="pt-4 border-t border-white/12 grid grid-cols-2 md:grid-cols-3 items-center gap-4 text-xs">
          <div className="min-w-0 flex items-center">
            {address && !address.startsWith('http') ? (
              <a
                href="#ubicacion"
                className="inline-flex items-center gap-2 font-medium text-zinc-300 hover:text-white transition-colors truncate max-w-full"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: colors.accent }} />
                <span className="truncate">{address}</span>
              </a>
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 truncate">
                {businessName}
              </span>
            )}
          </div>

          <div
            ref={scrollHintRef}
            className="hidden md:flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-300"
            aria-hidden="true"
          >
            <span>Desliza para entrar</span>
            <span
              className="w-[1.5px] h-5 rounded-full opacity-80"
              style={{ backgroundColor: colors.accent }}
            />
          </div>

          <div className="flex items-center justify-end">
            {onExploreServicesClick && (
              <button
                type="button"
                onClick={onExploreServicesClick}
                className="group inline-flex items-center gap-2.5 font-bold uppercase tracking-[0.15em] text-[11px] text-zinc-200 hover:text-white transition-colors cursor-pointer py-1"
              >
                <span>Ver servicios</span>
                <span className="w-7 h-7 rounded-full flex items-center justify-center border border-white/25 bg-[#09090d]/80 transition-transform duration-150 group-hover:translate-y-0.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
