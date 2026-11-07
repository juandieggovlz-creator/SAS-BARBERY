'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Smartphone,
  Tablet,
  Palette,
  Camera,
  Calendar,
  CheckCircle2,
  Globe,
  ArrowRight,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

type DeviceType = 'desktop' | 'tablet' | 'mobile'

const deviceConfig = {
  desktop: {
    frameClass: 'w-full max-w-[700px] mx-auto',
    outerClass: 'bg-zinc-200 dark:bg-[#151922] rounded-2xl p-2 shadow-2xl border border-zinc-300 dark:border-white/10',
    screenClass: 'rounded-xl overflow-hidden bg-white dark:bg-[#0c0e14]',
    aspectRatio: '16/9',
  },
  tablet: {
    frameClass: 'w-[380px] mx-auto',
    outerClass: 'bg-zinc-800 rounded-[28px] p-2.5 shadow-2xl border-4 border-zinc-700',
    screenClass: 'rounded-[20px] overflow-hidden bg-white dark:bg-[#0c0e14]',
    aspectRatio: '4/3',
  },
  mobile: {
    frameClass: 'w-[280px] mx-auto',
    outerClass: 'bg-zinc-900 rounded-[42px] p-2.5 shadow-2xl border-4 border-zinc-700',
    screenClass: 'rounded-[32px] overflow-hidden bg-zinc-950 relative',
    aspectRatio: '9/18.5',
  },
}

const features = [
  {
    icon: Palette,
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    title: 'Temas y Colores Personalizables',
    desc: 'Elige entre paletas elegantes oscuras, claras o doradas para reflejar la identidad visual de tu barbería.',
  },
  {
    icon: Camera,
    color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
    title: 'Galería de Cortes & Portada',
    desc: 'Sube fotografías de tus mejores trabajos, eslogan y redes sociales para deslumbrar a los visitantes.',
  },
  {
    icon: Calendar,
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    title: 'Motor de Reservas Directo',
    desc: 'El cliente escoge barbero, servicio, fecha y hora disponible. Cero llamadas perdidas ni tiempos muertos.',
  },
]

export default function WebpageShowcase() {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const cfg = deviceConfig[device]

  return (
    <section
      id="pagina-web"
      className="py-20 md:py-28 relative overflow-hidden bg-zinc-50/50 dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="webpage-title"
    >
      {/* Background radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Globe className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Tu Presencia Digital</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Sin Programar</span>
          </div>

          <h2
            id="webpage-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Una página web profesional{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
              autogenerada para tu barbería.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Sin programar ni contratar agencias. BarberOS crea tu portal oficial de reservas adaptado perfectamente a cualquier pantalla.
          </p>
        </motion.div>

        {/* ── Device Selector ── */}
        <div className="flex items-center justify-center mb-10">
          <div className="p-1.5 rounded-2xl bg-white dark:bg-[#11141c] border border-zinc-200/90 dark:border-white/10 flex items-center gap-1 shadow-sm backdrop-blur-md">
            {([
              { key: 'desktop', Icon: Monitor, label: 'Computador' },
              { key: 'tablet', Icon: Tablet, label: 'Tablet' },
              { key: 'mobile', Icon: Smartphone, label: 'Celular' },
            ] as const).map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.97] ${
                  device === key
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Content: Features left + Device Mockup right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Features */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                barberos.app/b/tu-barberia
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-tight">
                Tu marca, tus reglas y reservas 100% automáticas
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Cada barbería en BarberOS obtiene un enlace exclusivo para compartir en bio de Instagram, TikTok, Google Maps y estados de WhatsApp.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <div
                    key={i}
                    className="liquid-glass flex items-start gap-3.5 p-4 rounded-2xl shadow-xs"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${f.color}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950 dark:text-white">{f.title}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all"
            >
              <span>Crear Mi Página Web Gratis</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Right: Device Mockup */}
          <div className="lg:col-span-7 flex justify-center items-center py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={device}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cfg.frameClass}
              >
                {/* ── Outer device frame ── */}
                <div className={cfg.outerClass}>

                  {/* Desktop: browser bar */}
                  {device === 'desktop' && (
                    <div className="rounded-t-lg px-3 py-2 flex items-center gap-2 bg-zinc-100 dark:bg-[#12151e] border-b border-zinc-200 dark:border-white/10">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" aria-hidden="true" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      </div>
                      <div className="flex-1 mx-3 bg-white dark:bg-[#0c0e14] rounded-md px-3 py-1 flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">
                        <LinkIcon className="w-3 h-3 text-emerald-500 shrink-0" aria-hidden="true" />
                        <span className="truncate">barberos.app/b/barberia-elite-sas</span>
                      </div>
                      <div className="w-6" />
                    </div>
                  )}

                  {/* ── Screen area ── */}
                  <div className={cfg.screenClass}>
                    {device === 'mobile' ? (
                      <div className="relative overflow-hidden w-full" style={{ height: '520px' }}>
                        <Image
                          src="/landing/pagina-web-mobile.png"
                          alt="Página web de barbería en móvil"
                          fill
                          className="object-cover object-top dark:hidden"
                          priority
                          sizes="280px"
                        />
                        <Image
                          src="/landing/pagina-web-mobile-dark.png"
                          alt="Página web de barbería en móvil modo oscuro"
                          fill
                          className="object-cover object-top hidden dark:block"
                          priority
                          sizes="280px"
                        />
                        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-2.5 pointer-events-none">
                          <div className="w-20 h-4 bg-zinc-950 rounded-full border border-zinc-800" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="relative w-full overflow-hidden"
                        style={{ aspectRatio: cfg.aspectRatio }}
                      >
                        <Image
                          src="/landing/pagina-web-real.png"
                          alt="Página web de barbería generada por BarberOS"
                          fill
                          className="object-cover object-top dark:hidden"
                          priority
                          sizes="(max-width: 1024px) 100vw, 700px"
                        />
                        <Image
                          src="/landing/pagina-web-real-dark.png"
                          alt="Página web de barbería generada por BarberOS modo oscuro"
                          fill
                          className="object-cover object-top hidden dark:block"
                          priority
                          sizes="(max-width: 1024px) 100vw, 700px"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {device === 'mobile' && (
                  <div className="flex justify-center mt-2">
                    <div className="w-24 h-1 bg-zinc-600 rounded-full" aria-hidden="true" />
                  </div>
                )}
                {device === 'tablet' && (
                  <div className="flex justify-center mt-2">
                    <div className="w-10 h-1 bg-zinc-600 rounded-full" aria-hidden="true" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom trust bar ── */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/80 dark:border-white/10 pt-8">
          {[
            'Dominio oficial autogenerado al registrarte',
            'Optimizada para celulares, tablets y computadores',
            'Catálogo de servicios con precios y tiempos transparentes',
            'Personalización de colores, portada, galería y eslogan',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
