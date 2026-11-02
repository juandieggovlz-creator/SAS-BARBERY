'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  Palette, 
  Sparkles, 
  Camera, 
  Calendar,
  CheckCircle2,
  Globe,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'

type DeviceType = 'desktop' | 'tablet' | 'mobile'

const IMAGE_SRC = '/landing/pagina-web-real.png'
const IMAGE_MOBILE_SRC = '/landing/pagina-web-mobile.png'

// Each device defines its own outer frame + inner screen proportions
const deviceConfig = {
  desktop: {
    frameClass: 'w-full max-w-[700px] mx-auto',
    outerClass: 'bg-zinc-200 rounded-xl p-2 shadow-2xl border border-zinc-300',
    screenClass: 'rounded-lg overflow-hidden bg-white',
    imageContainerClass: 'relative w-full',
    // Desktop: landscape, show top portion of page
    aspectRatio: '16/9',
    objectPosition: 'top',
    showBrowserBar: true,
    showNotch: false,
  },
  tablet: {
    frameClass: 'w-[380px] mx-auto',
    outerClass: 'bg-zinc-800 rounded-[24px] p-2.5 shadow-2xl border-4 border-zinc-700',
    screenClass: 'rounded-[16px] overflow-hidden bg-white',
    imageContainerClass: 'relative w-full',
    aspectRatio: '4/3',
    objectPosition: 'top',
    showBrowserBar: false,
    showNotch: false,
  },
  mobile: {
    frameClass: 'w-[270px] mx-auto',
    outerClass: 'bg-zinc-900 rounded-[42px] p-2.5 shadow-2xl border-4 border-zinc-700',
    screenClass: 'rounded-[32px] overflow-hidden bg-zinc-950 relative',
    imageContainerClass: 'relative w-full',
    aspectRatio: '9/18.5',
    objectPosition: 'top',
    showBrowserBar: false,
    showNotch: true,
  },
}

const features = [
  {
    icon: Palette,
    color: 'bg-amber-500/10 text-amber-600',
    title: 'Temas y Colores Personalizables',
    desc: 'Elige entre paletas elegantes oscuras, claras o doradas para reflejar la identidad visual de tu barbería.',
  },
  {
    icon: Camera,
    color: 'bg-purple-500/10 text-purple-600',
    title: 'Galería de Cortes & Portada',
    desc: 'Sube fotografías de tus mejores trabajos, eslogan y redes sociales para deslumbrar a los visitantes.',
  },
  {
    icon: Calendar,
    color: 'bg-emerald-500/10 text-emerald-600',
    title: 'Motor de Reservas Directo',
    desc: 'El cliente escoge barbero, servicio, fecha y hora disponible. Cero llamadas perdidas ni tiempos muertos.',
  },
]

export default function WebpageShowcase() {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const cfg = deviceConfig[device]

  return (
    <section id="pagina-web" className="py-24 md:py-32 bg-white relative overflow-hidden">

      {/* Soft background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-blue-100/30 via-emerald-100/20 to-amber-100/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="uppercase tracking-wider">Tu Presencia Digital</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Una página web profesional autogenerada para tu barbería
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Sin programar ni contratar agencias. BarberOS crea tu portal oficial de reservas adaptado perfectamente a cualquier pantalla.
          </p>
        </div>

        {/* ── Device Selector ── */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-zinc-100 p-1.5 rounded-2xl flex items-center gap-1 border border-zinc-200 shadow-xs">
            {([
              { key: 'desktop', Icon: Monitor, label: 'Desktop' },
              { key: 'tablet',  Icon: Tablet,  label: 'Tablet' },
              { key: 'mobile',  Icon: Smartphone, label: 'Móvil' },
            ] as const).map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  device === key
                    ? 'bg-white text-zinc-950 shadow-sm font-black'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Content: Text left + Device right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left: Features */}
          <div className="lg:col-span-5 space-y-7">
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                barberos.app/b/tu-barberia
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight">
                Tu marca, tus reglas y reservas 100% automáticas
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Cada barbería en BarberOS obtiene un enlace exclusivo para compartir en bio de Instagram, TikTok, Google Maps y estados de WhatsApp.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 hover:shadow-sm transition-all">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-950">{f.title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 group"
            >
              <span>Crear Mi Página Web</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right: Device Mockup */}
          <div className="lg:col-span-7 flex justify-center items-center py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={device}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={cfg.frameClass}
              >
                {/* ── Outer device frame ── */}
                <div className={cfg.outerClass}>

                  {/* Desktop: browser bar on top */}
                  {/* Desktop: browser bar */}
                  {device === 'desktop' && (
                    <div className="bg-zinc-100 dark:bg-[#18181d] rounded-t-md px-3 py-2 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-400" />
                        <span className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 mx-3 bg-white dark:bg-[#121215] rounded-md px-3 py-1 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                        <LinkIcon className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">barberos.app/b/barberia-elite-sas</span>
                      </div>
                      <div className="w-8" />
                    </div>
                  )}

                  {/* ── Screen / image area ── */}
                  <div className={cfg.screenClass}>

                    {device === 'mobile' ? (
                      /* Mobile: Dedicated mobile screenshot (portrait 9:19) showing full mobile layout */
                      <div className="relative overflow-hidden w-full" style={{ height: '520px' }}>
                        <Image
                          src={IMAGE_MOBILE_SRC}
                          alt="Página web de barbería en móvil"
                          fill
                          className="object-cover object-top"
                          unoptimized
                          priority
                        />
                        {/* Notch overlay — sits ON TOP of image */}
                        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-2.5 pointer-events-none">
                          <div className="w-20 h-4 bg-zinc-950 rounded-full border border-zinc-800/80" />
                        </div>
                      </div>
                    ) : (
                      /* Desktop & Tablet: aspect-ratio + object-cover */
                      <div
                        className="relative w-full overflow-hidden"
                        style={{ aspectRatio: cfg.aspectRatio }}
                      >
                        <Image
                          src={IMAGE_SRC}
                          alt="Página web de barbería generada por BarberOS"
                          fill
                          className="object-cover object-top"
                          unoptimized
                          priority
                        />
                      </div>
                    )}

                  </div>
                </div>

                {/* Tablet/Mobile: home button indicator */}
                {device === 'mobile' && (
                  <div className="flex justify-center mt-1.5">
                    <div className="w-24 h-1 bg-zinc-600 rounded-full" />
                  </div>
                )}
                {device === 'tablet' && (
                  <div className="flex justify-center mt-2">
                    <div className="w-8 h-1 bg-zinc-600 rounded-full" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* ── Bottom trust bar ── */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-zinc-500 border-t border-zinc-200/80 pt-10">
          {[
            'Dominio oficial autogenerado al registrarte',
            'Optimizada para celulares, tablets y computadores',
            'Catálogo de servicios con precios y tiempos transparentes',
            'Personalización de colores, portada, galería y eslogan',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
