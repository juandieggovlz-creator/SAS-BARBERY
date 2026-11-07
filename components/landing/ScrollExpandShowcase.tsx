'use client'

import React, { useRef, useState, useEffect } from 'react'
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
  MessageSquare,
  Check
} from 'lucide-react'

// Register ScrollTrigger safely
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
    metrics: [
      { label: 'Citas al día', value: '45+ turnos' },
      { label: 'Tiempo ahorrado', value: '3h diarias' },
      { label: 'Conflictos', value: '0 cruces' }
    ],
    bullets: [
      'Bloqueo instantáneo de horarios con un clic',
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
    metrics: [
      { label: 'Facturación hoy', value: '$840.000' },
      { label: 'Barberos activos', value: '6 en turno' },
      { label: 'Ocupación', value: '92% sillones' }
    ],
    bullets: [
      'Ingresos desglosados por efectivo, transferencias y datáfono',
      'Indicador en vivo de barberos disponibles y ocupados',
      'Historial de auditoría para evitar citas borradas'
    ]
  },
  {
    id: 'finanzas',
    label: 'Caja & Finanzas',
    shortTitle: 'Cierre de Caja Ciego',
    icon: DollarSign,
    headline: 'Cierre de caja ciego y cálculo exacto de comisiones',
    description: 'Elimina las fugas de dinero y los cuadernos arrugados. Cada servicio cobra automáticamente su comisión y el arqueo de caja cuadra al centavo con los métodos de pago.',
    lightImage: '/landing/finanzas.jpg',
    darkImage: '/landing/finanzas-dark.jpg',
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
  const mockupContainerRef = useRef<HTMLDivElement>(null)
  const floatingLeftRef = useRef<HTMLDivElement>(null)
  const floatingRightTopRef = useRef<HTMLDivElement>(null)
  const floatingRightBottomRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const currentTab = SHOWCASE_TABS.find(t => t.id === activeTab) || SHOWCASE_TABS[0]

  // GSAP ScrollTrigger orchestration for Smooth Expanding Mockup
  useGSAP(
    () => {
      // Respect user's motion preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion || !mockupContainerRef.current) return

      const mm = gsap.matchMedia()

      // Desktop & Tablet animation (> 768px)
      mm.add('(min-width: 768px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            end: 'bottom 85%',
            scrub: 1,
            toggleActions: 'play reverse play reverse'
          }
        })

        // Expand container from contained card (80%) to panoramic (100%)
        tl.fromTo(
          mockupContainerRef.current,
          {
            width: '82%',
            scale: 0.92,
            borderRadius: '32px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
          },
          {
            width: '100%',
            scale: 1,
            borderRadius: '20px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
            ease: 'power2.out'
          },
          0
        )

        // Parallax on Left Floating Card
        if (floatingLeftRef.current) {
          tl.fromTo(
            floatingLeftRef.current,
            { y: 60, x: -20, opacity: 0.6 },
            { y: -30, x: 0, opacity: 1, ease: 'none' },
            0
          )
        }

        // Parallax on Right Top Floating Card
        if (floatingRightTopRef.current) {
          tl.fromTo(
            floatingRightTopRef.current,
            { y: 80, x: 25, opacity: 0.6 },
            { y: -40, x: 0, opacity: 1, ease: 'none' },
            0
          )
        }

        // Parallax on Right Bottom Floating Card
        if (floatingRightBottomRef.current) {
          tl.fromTo(
            floatingRightBottomRef.current,
            { y: 50, x: 15, opacity: 0.7 },
            { y: -20, x: 0, opacity: 1, ease: 'none' },
            0
          )
        }

        // Ambient glow expansion
        if (glowRef.current) {
          tl.fromTo(
            glowRef.current,
            { scale: 0.8, opacity: 0.3 },
            { scale: 1.15, opacity: 0.7, ease: 'power2.out' },
            0
          )
        }
      })

      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      id="sistema"
      className="relative py-20 md:py-28 overflow-hidden bg-zinc-50/70 dark:bg-[#09090c] border-y border-zinc-200/80 dark:border-zinc-800/80 transition-colors duration-300"
    >
      {/* Background Decorative Radial Ambience */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-500/10 via-emerald-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="uppercase tracking-wider">Efecto Inmersivo · Plataforma en Vivo</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white"
          >
            Toda tu barbería en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-400 dark:to-amber-200">
              una sola plataforma.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto"
          >
            Diseñado para erradicar el desorden de turnos, el cruce de horarios y los descuadres de caja. Explora cada módulo en acción:
          </motion.p>

          {/* Interactive Module Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-2 pt-4"
          >
            {SHOWCASE_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md scale-102 ring-2 ring-amber-500/30'
                      : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400 dark:text-amber-600' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            THE EXPANDING GSAP MOCKUP CONTAINER
            Smoothly scales & widens as the user scrolls through the page
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative flex justify-center items-center my-6">
          <div
            ref={mockupContainerRef}
            className="w-full max-w-5xl mx-auto overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl transition-all duration-300"
          >
            {/* Realistic Browser Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-[280px] sm:max-w-md truncate">
                <span className="text-zinc-400 select-none">https://</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                  barberos.app/{currentTab.id}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">En Vivo</span>
              </div>
            </div>

            {/* Dynamic Screenshot Viewport */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full h-full"
                >
                  {/* Light Image */}
                  <Image
                    src={currentTab.lightImage}
                    alt={currentTab.headline}
                    fill
                    className="object-cover object-top dark:hidden"
                    priority
                    sizes="(max-width: 1024px) 100vw, 1200px"
                  />
                  {/* Dark Image */}
                  <Image
                    src={currentTab.darkImage}
                    alt={currentTab.headline}
                    fill
                    className="object-cover object-top hidden dark:block"
                    priority
                    sizes="(max-width: 1024px) 100vw, 1200px"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Parallax Overlay Glass Badge 1: WhatsApp Bot Alert */}
              <div
                ref={floatingLeftRef}
                className="hidden lg:flex absolute bottom-6 left-6 z-20 items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 shadow-xl max-w-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                    WhatsApp Automático
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Recordatorio enviado a Mateo (Corte Fade 4:00 PM)
                  </p>
                </div>
              </div>

              {/* Parallax Overlay Glass Badge 2: Comisión Calculada */}
              <div
                ref={floatingRightTopRef}
                className="hidden lg:flex absolute top-6 right-6 z-20 items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 shadow-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Comisión Barbero
                  </p>
                  <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                    $220.000 COP <span className="text-[10px] font-normal text-zinc-400">(40%)</span>
                  </p>
                </div>
              </div>

              {/* Parallax Overlay Glass Badge 3: Cierre de Caja Cuadrado */}
              <div
                ref={floatingRightBottomRef}
                className="hidden lg:flex absolute bottom-6 right-6 z-20 items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-950/90 dark:bg-white/90 text-white dark:text-zinc-950 shadow-xl"
              >
                <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span className="text-xs font-black tracking-wide">Caja Cuadrada al 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Card Below Showcase */}
        <motion.div
          key={`detail-${currentTab.id}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white">
                {currentTab.headline}
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {currentTab.description}
              </p>
              <ul className="space-y-2 pt-2">
                {currentTab.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-5 flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6">
              <div className="grid grid-cols-3 gap-2 text-center">
                {currentTab.metrics.map((m, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                    <p className="text-sm sm:text-base font-black text-zinc-950 dark:text-white">
                      {m.value}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="mt-3 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              >
                <span>Probar {currentTab.shortTitle} Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

