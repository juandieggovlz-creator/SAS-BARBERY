'use client'

import React, { useEffect, useState } from 'react'

interface BarberPoleLoaderProps {
  businessName?: string
  minDurationMs?: number
  onComplete?: () => void
}

export default function BarberPoleLoader({
  minDurationMs = 450,
  onComplete
}: BarberPoleLoaderProps) {
  // If rendered inside the editor preview iframe, skip loader completely
  const isIframe = typeof window !== 'undefined' && window.self !== window.top
  const [visible, setVisible] = useState(!isIframe)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    if (isIframe) {
      if (onComplete) onComplete()
      return
    }
    const timer = setTimeout(() => {
      setFadingOut(true)
      const hideTimer = setTimeout(() => {
        setVisible(false)
        if (onComplete) onComplete()
      }, 400)
      return () => clearTimeout(hideTimer)
    }, minDurationMs)

    return () => clearTimeout(timer)
  }, [minDurationMs, onComplete])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md transition-all duration-400 ${
        fadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
    >
      {/* Minimalist soft glow */}
      <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-red-600/15 via-blue-600/15 to-white/10 blur-2xl pointer-events-none animate-pulse" />

      {/* Minimalist Barber Pole Capsule */}
      <div className="relative flex flex-col items-center">
        {/* Sleek rounded cylinder capsule */}
        <div className="relative w-8 h-24 rounded-full overflow-hidden shadow-2xl border border-white/25 ring-1 ring-black/40 bg-zinc-900">
          {/* Rotating spiral stripes */}
          <div className="absolute inset-0 barber-pole-cylinder" />

          {/* Minimalist glass reflection sheen */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-white/35 to-black/50 pointer-events-none" />

          {/* Glass specular light line */}
          <div className="absolute top-1 bottom-1 left-1.5 w-0.5 bg-white/60 rounded-full blur-[0.5px] pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
