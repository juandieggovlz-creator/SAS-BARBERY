'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  Calendar,
  DollarSign,
  UserCheck,
  LayoutDashboard,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Check,
  Scissors,
  Receipt,
  Layers,
  ChevronRight
} from 'lucide-react'

// Safe ScrollTrigger registration
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ShowcaseTab {
  id: string
  label: string
  shortTitle: string
  icon: React.ComponentType<{ className?: string }>
  headline: string
  description: string
  lightImage: string
  darkImage: string
  metrics: { label: string; value: string }[]
  bullets: string[]
  badgeText: string
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'agenda',
    label: 'Agenda Inteligente',
    shortTitle: 'Agenda Multi-Barbero',
    icon: Calendar,
    headline: 'Agenda sincronizada en tiempo real sin solapamientos',
    description: 'Visualiza a todo tu equipo en columnas dinámicas. Cada barbero tiene sus tiempos exactos por servicio, pausas de almuerzo y descansos configurados sin llamadas ni desorden.',
    lightImage: '/landing/agenda.jpg',
    darkImage: '/landing/agenda-dark.jpg',
    badgeText: 'Control de Turnos en Vivo',
    metrics: [
      { label: 'Citas al día', value: '45+ turnos' },
      { label: 'Tiempo ahorrado', value: '3h diarias' },
      { label: 'Conflictos', value: '0 cruces' }
    ],
    bullets: [
      'Bloqueo instantáneo de horarios con un solo clic',
      'Sincronización en vivo con las reservas de tus clientes',
      'Alertas sonoras y visuales cuando entra una nueva cita'
    ]
  },
  {
    id: 'dashboard',
    label: 'Dashboard Dueño',
    shortTitle: 'Control Administrativo',
    icon: LayoutDashboard,
    headline: 'Control total de ingresos, métricas y equipo en una sola pantalla',
    description: 'Toma decisiones con números reales. Supervisa la facturación del día, el rendimiento de cada barbero y el estado de tu negocio desde cualquier dispositivo.',
    lightImage: '/landing/dashboard-admin.jpg',
    darkImage: '/landing/dashboard-admin-dark.jpg',
    badgeText: 'Mando Central del Negocio',
    metrics: [
      { label: 'Facturación hoy', value: '$1.480.000' },
      { label: 'Barberos activos', value: '6 en turno' },
      { label: 'Ocupación', value: '94% sillones' }
    ],
    bullets: [
      'Ingresos desglosados por efectivo, transferencias y datáfono',
      'Indicador en vivo de barberos disponibles y ocupados',
      'Historial de auditoría para evitar citas borradas sin rastro'
    ]
  },
  {
    id: 'finanzas',
    label: 'Caja & Comisiones',
    shortTitle: 'Cierre de Caja Ciego',
    icon: DollarSign,
    headline: 'Cierre de caja ciego y cálculo exacto de comisiones',
    description: 'Elimina las fugas de dinero y los cuadernos arrugados. Cada servicio cobra automáticamente su comisión y el arqueo de caja cuadra al centavo con los métodos de pago.',
    lightImage: '/landing/finanzas.jpg',
    darkImage: '/landing/finanzas-dark.jpg',
    badgeText: 'Auditoría Anti-Fugas',
    metrics: [
      { label: 'Descuadre caja', value: '$0 COP' },
      { label: 'Comisiones', value: '100% exactas' },
      { label: 'Liquidación', value: '1 solo clic' }
    ],
    bullets: [
      'Arqueo ciego para que la recepción cuente sin ver el sistema',
      'Liquidación automática según el porcentaje pactado con cada barbero',
      'Registro de egresos operativos para calcular utilidad neta'
    ]
  },
  {
    id: 'barbero',
    label: 'Portal del Barbero',
    shortTitle: 'Acceso Barbero',
    icon: UserCheck,
    headline: 'Cada barbero con su enlace privado y control de turnos',
    description: 'Motiva a tu equipo dándoles acceso directo a su agenda y comisiones del día sin revelar información financiera confidencial de la empresa.',
    lightImage: '/landing/dashboard-barbero.jpg',
    darkImage: '/landing/dashboard-barbero-dark.jpg',
    badgeText: 'Autonomía y Transparencia',
    metrics: [
      { label: 'Transparencia', value: '100% clara' },
      { label: 'Acceso privado', value: 'PIN / Link' },
      { label: 'Motivación', value: '+35% ventas' }
    ],
    bullets: [
      'Enlace único personal que funciona en cualquier celular',
      'Gestión de estados: Cliente en camino, En sillón, Terminado',
      'Historial de propinas y comisiones acumuladas en tiempo real'
    ]
  },
  {
    id: 'webpage',
    label: 'Página Web Oficial',
    shortTitle: 'Página de Reservas',
    icon: Globe,
    headline: 'Tu propia página web profesional autogenerada al instante',
    description: 'Tus clientes reservan 24/7 desde un portal con tu logo, fotos de trabajos, catálogo de servicios y mapa de ubicación. Olvídate de pagar páginas web costosas.',
    lightImage: '/landing/pagina-web-real.png',
    darkImage: '/landing/pagina-web-real-dark.png',
    badgeText: 'Presencia Digital 24/7',
    metrics: [
      { label: 'Disponibilidad', value: '24/7 online' },
      { label: 'Pasos reserva', value: 'Solo 3 clics' },
      { label: 'Costo extra', value: '$0 incluido' }
    ],
    bullets: [
      'Enlace personalizado listo para tu bio de Instagram y WhatsApp',
      'Clientes escogen su barbero preferido y horario disponible',
      'Confirmación digital instantánea con recordatorio automático'
    ]
  }
]

export default function ScrollExpandShowcase() {
  const [activeTab, setActiveTab] = useState<string>('agenda')
  const sectionRef = useRef<HTMLDivElement>(null)
  const pinContainerRef = useRef<HTMLDivElement>(null)
  const mockupContainerRef = useRef<HTMLDivElement>(null)
  const floatingLeftRef = useRef<HTMLDivElement>(null)
  const floatingRightTopRef = useRef<HTMLDivElement>(null)
  const floatingRightBottomRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const currentTab = SHOWCASE_TABS.find(t => t.id === activeTab) || SHOWCASE_TABS[0]

  // GSAP ScrollTrigger Pinned & Smooth Expanding Canvas
  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion || !mockupContainerRef.current) return

      const mm = gsap.matchMedia()

      // Desktop & Large Screens (>= 768px): Pinned expanding canvas
      mm.add('(min-width: 768px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinContainerRef.current,
            start: 'top top',
            end: '+=110%',
            scrub: 1,
            pin: true,
            anticipatePin: 1
          }
        })

        // Expand container from focused card (74%) to full panoramic stage (100%)
        tl.fromTo(
          mockupContainerRef.current,
          {
            width: '74%',
            scale: 0.84,
            y: 40,
            borderRadius: '36px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
          },
          {
            width: '100%',
            scale: 1,
            y: 0,
            borderRadius: '18px',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6)',
            ease: 'power2.out'
          },
          0
        )

        // Float Left Card outward
        if (floatingLeftRef.current) {
          tl.fromTo(
            floatingLeftRef.current,
            { x: 0, y: 0, opacity: 1, scale: 1 },
            { x: -70, y: -40, opacity: 0, scale: 0.9, ease: 'power1.out' },
            0.15
          )
        }

        // Float Right Top Card outward
        if (floatingRightTopRef.current) {
          tl.fromTo(
            floatingRightTopRef.current,
            { x: 0, y: 0, opacity: 1, scale: 1 },
            { x: 70, y: -40, opacity: 0, scale: 0.9, ease: 'power1.out' },
            0.15
          )
        }

        // Float Right Bottom Card outward
        if (floatingRightBottomRef.current) {
          tl.fromTo(
            floatingRightBottomRef.current,
            { x: 0, y: 0, opacity: 1, scale: 1 },
            { x: 60, y: 30, opacity: 0, scale: 0.9, ease: 'power1.out' },
            0.2
          )
        }

        // Ambient glow expansion
        if (glowRef.current) {
          tl.fromTo(
            glowRef.current,
            { scale: 0.75, opacity: 0.3 },
            { scale: 1.25, opacity: 0.75, ease: 'power2.out' },
            0
          )
        }
      })

      // Mobile screens (< 768px): Smooth scrub without pinning
      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          mockupContainerRef.current,
          { scale: 0.92, opacity: 0.8 },
          {
            scale: 1,
            opacity: 1,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              end: 'bottom 80%',
              scrub: 0.5
            }
          }
        )
      })

      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      id="sistema"
      className="relative bg-[#fafafa] dark:bg-[#07080c] border-y border-zinc-200/80 dark:border-white/10 transition-colors duration-300"
    >
      {/* Pinned Scroll Wrapper for Desktop */}
      <div ref={pinContainerRef} className="py-20 md:py-28 overflow-hidden relative">

        {/* Ambient Radial Spotlight */}
        <div
          ref={glowRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-emerald-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="uppercase tracking-wider font-black text-[10px]">Experiencia Inmersiva</span>
              <span className="text-zinc-400 dark:text-zinc-600">·</span>
              <span className="font-medium text-xs">Módulos en Vivo</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white"
            >
              Toda tu barbería en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100">
                un solo centro de control.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed"
            >
              Navega por los módulos principales que transformarán tu barbería en un negocio organizado, transparente y altamente rentable.
            </motion.p>
          </div>

          {/* Interactive Module Tabs */}
          <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2 scrollbar-none">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#11141c] border border-zinc-200/90 dark:border-white/10 shadow-sm backdrop-blur-md">
              {SHOWCASE_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-[0.97] ${
                      isActive
                        ? 'text-zinc-950 dark:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeShowcaseTab"
                        className="absolute inset-0 rounded-xl bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-500 dark:text-zinc-400'}`} />
                      <span className="hidden sm:inline font-bold">{tab.label}</span>
                      <span className="sm:hidden font-bold">{tab.shortTitle}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════
              EXPANDING MOCKUP CANVAS WITH PARALLAX DEPTH
          ═════════════════════════════════════════════════════════ */}
          <div className="relative mx-auto flex items-center justify-center">

            {/* Floating Left Parallax Card */}
            <div
              ref={floatingLeftRef}
              className="hidden xl:block absolute -left-6 top-1/3 -translate-y-1/2 z-30 pointer-events-none w-72"
            >
              <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#121620]/95 backdrop-blur-md border border-zinc-200/90 dark:border-white/15 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Cero Solapamientos
                    </span>
                    <p className="text-xs font-bold text-zinc-950 dark:text-white mt-0.5">
                      Horarios exactos por corte
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Sincronización en tiempo real
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Right Top Parallax Card */}
            <div
              ref={floatingRightTopRef}
              className="hidden xl:block absolute -right-6 top-1/4 -translate-y-1/2 z-30 pointer-events-none w-64"
            >
              <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#121620]/95 backdrop-blur-md border border-zinc-200/90 dark:border-white/15 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Arqueo Ciego
                    </span>
                    <p className="text-xs font-bold text-zinc-950 dark:text-white mt-0.5">
                      Cierre de caja sin descuadre
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      100% conciliado con Nequi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Right Bottom Parallax Card */}
            <div
              ref={floatingRightBottomRef}
              className="hidden xl:block absolute -right-4 bottom-8 z-30 pointer-events-none w-64"
            >
              <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#121620]/95 backdrop-blur-md border border-zinc-200/90 dark:border-white/15 shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950 dark:text-white leading-tight">
                      Web Oficial Activa
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Reservas 24/7 sin WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════
                THE EXPANDING CANVAS CONTAINER
            ═════════════════════════════════════════════════════════ */}
            <div
              ref={mockupContainerRef}
              className="relative w-full max-w-6xl mx-auto overflow-hidden bg-white dark:bg-[#0c0e15] border border-zinc-200/90 dark:border-white/10 shadow-2xl transition-all"
            >
              {/* Browser Window Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-zinc-100/90 dark:bg-[#12151e] border-b border-zinc-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white dark:bg-[#0c0e15] border border-zinc-200/90 dark:border-white/10 text-xs font-mono text-zinc-600 dark:text-zinc-400 shadow-xs">
                  <span className="text-zinc-400">https://</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-200">
                    barberos.app/{currentTab.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {currentTab.badgeText}
                  </span>
                </div>
              </div>

              {/* Viewport Frame with AnimatePresence */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full"
                  >
                    {/* Light Mode Screenshot */}
                    <Image
                      src={currentTab.lightImage}
                      alt={currentTab.headline}
                      fill
                      className="object-cover object-top dark:hidden"
                      sizes="(max-width: 1280px) 100vw, 1200px"
                      priority
                    />
                    {/* Dark Mode Screenshot */}
                    <Image
                      src={currentTab.darkImage}
                      alt={currentTab.headline}
                      fill
                      className="object-cover object-top hidden dark:block"
                      sizes="(max-width: 1280px) 100vw, 1200px"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Interactive Info Bar */}
              <div className="p-6 sm:p-8 bg-zinc-50/90 dark:bg-[#10131b] border-t border-zinc-200/80 dark:border-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 space-y-3">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                      {currentTab.headline}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {currentTab.description}
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {currentTab.bullets.map((bullet, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 grid grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-zinc-200/80 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6 text-center">
                    {currentTab.metrics.map((m, i) => (
                      <div key={i} className="bg-white dark:bg-white/[0.04] p-3 rounded-xl border border-zinc-200/80 dark:border-white/5">
                        <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                          {m.value}
                        </p>
                        <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 uppercase tracking-wider">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
