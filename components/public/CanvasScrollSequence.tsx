'use client'

import React, { useEffect, useRef, useState } from 'react'

export interface CanvasScrollSequenceProps {
  /** Patrón de ruta de frames, ej: "/frames/f_{index}.jpg" donde {index} se reemplaza por 0001..0150 */
  frameUrlPattern?: string
  /** Cantidad total de frames de la secuencia (máximo 150) */
  frameCount?: number
  /** Progreso normalizado del scroll (0.0 a 1.0) provisto por ScrollTrigger del contenedor padre */
  progress: number
  /** Imagen de respaldo inmediata si no existen frames o mientras carga el frame 0001 */
  fallbackImageUrl: string
  /** Alt descriptivo para accesibilidad */
  alt: string
  /** Clase CSS opcional */
  className?: string
}

/**
 * Motor opcional de secuencia de imágenes controlada por scroll en HTML5 Canvas.
 * Implementa carga progresiva en 3 fases (Frame 1 -> Keyframes -> Intermedios),
 * renderizado bajo demanda (dirty-frame check) y reducción de memoria en dispositivos móviles.
 */
export default function CanvasScrollSequence({
  frameUrlPattern = '/frames/f_{index}.jpg',
  frameCount = 90,
  progress,
  fallbackImageUrl,
  alt,
  className = '',
}: CanvasScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  const loadedFlagsRef = useRef<boolean[]>([])
  const lastDrawnFrameRef = useRef<number>(-1)
  const rafIdRef = useRef<number | null>(null)

  const [firstFrameReady, setFirstFrameReady] = useState(false)
  const [sequenceFailed, setSequenceFailed] = useState(false)

  const safeTotalFrames = Math.min(Math.max(frameCount, 2), 150)

  const buildFrameUrl = (oneBasedIndex: number): string => {
    const padded = String(oneBasedIndex).padStart(4, '0')
    if (frameUrlPattern.includes('{index}')) {
      return frameUrlPattern.replace('{index}', padded)
    }
    const base = frameUrlPattern.replace(/\/$/, '')
    return `${base}/f_${padded}.jpg`
  }

  /**
   * Dibuja una imagen en el canvas simulando `object-fit: cover` centrado
   */
  const drawCoverImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    if (!iw || !ih || !cw || !ch) return

    const scale = Math.max(cw / iw, ch / ih)
    const sw = iw * scale
    const sh = ih * scale
    const dx = (cw - sw) * 0.5
    const dy = (ch - sh) * 0.5

    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, sw, sh)
  }

  /**
   * Busca el frame cargado más cercano al índice solicitado para evitar parpadeos en negro
   */
  const findNearestLoadedImage = (targetIdx: number): HTMLImageElement | null => {
    const imgs = imagesRef.current
    const flags = loadedFlagsRef.current
    if (flags[targetIdx] && imgs[targetIdx]) return imgs[targetIdx]

    for (let offset = 1; offset < safeTotalFrames; offset++) {
      const prev = targetIdx - offset
      if (prev >= 0 && flags[prev] && imgs[prev]) return imgs[prev]
      const next = targetIdx + offset
      if (next < safeTotalFrames && flags[next] && imgs[next]) return imgs[next]
    }
    return null
  }

  // 1. Carga progresiva no bloqueante en 3 fases + control de memoria
  useEffect(() => {
    let isCancelled = false
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    // En móvil reducimos a la mitad la densidad de frames cargados en RAM
    const mobileStep = isMobile ? 2 : 1

    imagesRef.current = new Array(safeTotalFrames).fill(null)
    loadedFlagsRef.current = new Array(safeTotalFrames).fill(false)
    lastDrawnFrameRef.current = -1

    const loadSingleFrame = (zeroBasedIdx: number): Promise<boolean> => {
      return new Promise(resolve => {
        if (isCancelled) return resolve(false)
        if (loadedFlagsRef.current[zeroBasedIdx]) return resolve(true)

        const img = new Image()
        img.decoding = 'async'
        img.src = buildFrameUrl(zeroBasedIdx + 1)

        img.onload = () => {
          if (isCancelled) {
            img.src = ''
            return resolve(false)
          }
          imagesRef.current[zeroBasedIdx] = img
          loadedFlagsRef.current[zeroBasedIdx] = true
          resolve(true)
        }

        img.onerror = () => {
          img.src = ''
          resolve(false)
        }
      })
    }

    const startProgressiveLoading = async () => {
      // FASE 1: Prioridad absoluta al primer frame (f_0001)
      const firstOk = await loadSingleFrame(0)
      if (isCancelled) return

      if (!firstOk) {
        // Si no existe el primer frame, activamos fallback fotográfico limpio sin bloquear la página
        setSequenceFailed(true)
        return
      }

      setFirstFrameReady(true)
      const firstImg = imagesRef.current[0]
      if (firstImg) {
        drawCoverImage(firstImg)
        lastDrawnFrameRef.current = 0
      }

      // FASE 2: Keyframes (1 de cada 6 frames) para permitir scrubbing inmediato
      const keyframeIndices: number[] = []
      const fillerIndices: number[] = []

      for (let i = mobileStep; i < safeTotalFrames; i += mobileStep) {
        if (i % 6 === 0 || i === safeTotalFrames - 1) {
          keyframeIndices.push(i)
        } else {
          fillerIndices.push(i)
        }
      }

      // Cargar keyframes en lotes pequeños de 4 para no saturar la red
      const batchSize = isMobile ? 2 : 4
      for (let i = 0; i < keyframeIndices.length; i += batchSize) {
        if (isCancelled) return
        const batch = keyframeIndices.slice(i, i + batchSize)
        await Promise.all(batch.map(idx => loadSingleFrame(idx)))
      }

      // FASE 3: Relleno progresivo en baja prioridad
      for (let i = 0; i < fillerIndices.length; i += batchSize) {
        if (isCancelled) return
        const batch = fillerIndices.slice(i, i + batchSize)
        await Promise.all(batch.map(idx => loadSingleFrame(idx)))
      }
    }

    startProgressiveLoading()

    return () => {
      isCancelled = true
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      // Liberar memoria de texturas decodificadas
      imagesRef.current.forEach(img => {
        if (img) img.src = ''
      })
      imagesRef.current = []
      loadedFlagsRef.current = []
    }
  }, [frameUrlPattern, safeTotalFrames])

  // 2. Dimensionamiento responsive del Canvas con límite de DPR para cuidar VRAM
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const isMobile = window.innerWidth < 768
      const maxDpr = isMobile ? 1.25 : 2
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)

      const width = Math.floor(parent.clientWidth * dpr)
      const height = Math.floor(parent.clientHeight * dpr)

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        const currentImg = findNearestLoadedImage(
          Math.max(0, lastDrawnFrameRef.current)
        )
        if (currentImg) {
          drawCoverImage(currentImg)
        }
      }
    }

    updateCanvasSize()
    const observer = new ResizeObserver(() => {
      updateCanvasSize()
    })
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement)
    }

    return () => {
      observer.disconnect()
    }
  }, [firstFrameReady])

  // 3. Renderizado sincronizado con el progreso de scroll (Dirty-frame check)
  useEffect(() => {
    if (!firstFrameReady || sequenceFailed) return

    const clamped = Math.max(0, Math.min(1, progress))
    const targetFrame = Math.min(
      safeTotalFrames - 1,
      Math.round(clamped * (safeTotalFrames - 1))
    )

    if (targetFrame === lastDrawnFrameRef.current) return

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const img = findNearestLoadedImage(targetFrame)
      if (img) {
        drawCoverImage(img)
        lastDrawnFrameRef.current = targetFrame
      }
    })
  }, [progress, firstFrameReady, sequenceFailed, safeTotalFrames])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Fallback fotográfico instantáneo (visible mientras carga el frame 1 o si faltan frames) */}
      <img
        src={fallbackImageUrl}
        alt={alt}
        className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
          firstFrameReady && !sequenceFailed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        loading="eager"
      />

      {/* Lienzo de secuencia acelerado por hardware */}
      {!sequenceFailed && (
        <canvas
          ref={canvasRef}
          aria-label={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            firstFrameReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
