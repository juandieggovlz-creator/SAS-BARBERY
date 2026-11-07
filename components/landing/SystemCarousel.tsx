'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UserCheck,
  DollarSign,
  BarChart3,
  Calendar,
  Globe,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface SlideItem {
  id: string
  tabLabel: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  tagline: string
  description: string
  highlights: string[]
  imageSrc: string
  imageSrcDark?: string
}

const slides: SlideItem[] = [
  {
    id: 'dashboard-admin',
    tabLabel: 'Dashboard Dueño',
    icon: LayoutDashboard,
    title: 'Control total de tu barbería en una sola pantalla',
    tagline: 'Visión en tiempo real de ingresos, citas activas y rendimiento de tu equipo',
    description: 'Olvídate de cuadernos y tablas confusas. Visualiza en vivo el flujo de citas del día, cuántos servicios ha realizado cada barbero, el dinero ingresado y las métricas clave de tu barbería.',
    highlights: [
      'Ingresos del día y desglose por método de pago',
      'Estado en vivo de cada barbero (Disponible, En Turno, Descanso)',
      'Alertas de citas pendientes y confirmadas en tiempo real',
      'Acceso administrativo seguro para supervisar desde tu celular o PC'
    ],
    imageSrc: '/landing/dashboard-admin.jpg',
    imageSrcDark: '/landing/dashboard-admin-dark.jpg'
  },
  {
    id: 'dashboard-barbero',
    tabLabel: 'Portal del Barbero',
    icon: UserCheck,
    title: 'Cada barbero con su agenda personal y comisiones al día',
    tagline: 'Autonomía y motivación para tu equipo sin revelar datos confidenciales',
    description: 'Cada barbero de tu equipo cuenta con un enlace único y privado. Puede revisar sus citas asignadas, cambiar su estado en tiempo real, marcar clientes atendidos y consultar sus comisiones generadas sin ver las finanzas del dueño.',
    highlights: [
      'Acceso privado por enlace directo con PIN o contraseña',
      'Cálculo automático de su porcentaje de comisión por servicio',
      'Gestión de turnos (Llegó cliente, Iniciar servicio, Finalizar)',
      'Historial de propinas y resumen para liquidaciones claras'
    ],
    imageSrc: '/landing/dashboard-barbero.jpg',
    imageSrcDark: '/landing/dashboard-barbero-dark.jpg'
  },
  {
    id: 'finanzas',
    tabLabel: 'Finanzas & Caja',
    icon: DollarSign,
    title: 'Cierre de caja ciego y control financiero anti-fugas',
    tagline: 'Cero descuadres entre recepción, barberos y cuenta bancaria',
    description: 'Registra cobros en efectivo, transferencias Nequi/Bancolombia y datáfono. Al terminar el día o turno, realiza el cierre de caja con arqueo preciso para garantizar que el dinero contado coincida exactamente con las citas registradas.',
    highlights: [
      'Cierre de caja por turnos o diario con un solo clic',
      'Control estricto de medios de pago (Efectivo, Tarjeta, Transferencia)',
      'Registro de gastos operativos (arriendo, insumos, servicios públicos)',
      'Historial de auditoría para evitar citas borradas sin autorización'
    ],
    imageSrc: '/landing/finanzas.jpg',
    imageSrcDark: '/landing/finanzas-dark.jpg'
  },
  {
    id: 'agenda',
    tabLabel: 'Agenda Inteligente',
    icon: Calendar,
    title: 'Agenda multi-barbero sin solapamientos ni llamadas',
    tagline: 'Organización sincronizada que elimina el caos de turnos',
    description: 'Visualiza la agenda de todos tus barberos en columnas sincronizadas. El algoritmo inteligente calcula la duración exacta de cada servicio y evita citas dobles o barberos sobrecargados.',
    highlights: [
      'Vista por día, semana y barbero individual',
      'Duraciones personalizadas por servicio y tiempos de descanso',
      'Bloqueo de horarios para almuerzo o descansos con un clic',
      'Sincronización instantánea con las reservas públicas de los clientes'
    ],
    imageSrc: '/landing/agenda.jpg',
    imageSrcDark: '/landing/agenda-dark.jpg'
  },
  {
    id: 'reportes',
    tabLabel: 'Reportes & Analítica',
    icon: BarChart3,
    title: 'Métricas de crecimiento para tomar decisiones con datos',
    tagline: 'Conoce qué servicios son los más rentables y cuáles clientes regresan',
    description: 'BarberOS analiza tus ventas y clientes automáticamente. Descubre tus horas pico, los servicios con mayor margen y el porcentaje de retención de clientes para fidelizarlos y multiplicar tu facturación.',
    highlights: [
      'Evolución de facturación mensual y comparativo vs mes anterior',
      'Ranking de servicios más solicitados y barberos más productivos',
      'Ticket promedio por cliente y tasa de recurrencia',
      'Exportación de balances contables a formato digital'
    ],
    imageSrc: '/landing/reportes.jpg',
    imageSrcDark: '/landing/reportes-dark.jpg'
  },
  {
    id: 'pagina-web',
    tabLabel: 'Página Web Oficial',
    icon: Globe,
    title: 'Tu propia página web profesional autogenerada',
    tagline: 'Presencia digital de lujo con tu logo, fotos y servicios',
    description: 'Olvídate de pagar millones a una agencia. BarberOS genera automáticamente una página web elegante para tu barbería (ej. barberos.app/b/tu-barberia) con tus colores de marca, fotos de cortes y botón de reserva directa.',
    highlights: [
      'Dominio oficial propio autogenerado al registrarte',
      'Personalización de colores, portada, galería y eslogan',
      'Catálogo de servicios con precios y tiempos transparentes',
      'Optimizada para celulares, tablets y computadores'
    ],
    imageSrc: '/landing/pagina-web-real.png',
    imageSrcDark: '/landing/pagina-web-real.png'
  },
  {
    id: 'reservas',
    tabLabel: 'Reservas 24/7',
    icon: Clock,
    title: 'Tus clientes reservan solos a cualquier hora del día',
    tagline: 'Libera tu WhatsApp y llena tu agenda incluso mientras duermes',
    description: 'Tus clientes eligen su barbero favorito, el servicio y la hora en solo 3 clics sin descargar aplicaciones ni crear contraseñas tediosas. Reciben confirmación inmediata con el resumen digital de su cita.',
    highlights: [
      'Proceso en 3 pasos ultra rápido desde celular',
      'Elección de barbero o "Primer profesional disponible"',
      'Confirmación instantánea con código de reserva único',
      'Reducción del 90% en mensajes manuales de WhatsApp'
    ],
    imageSrc: '/landing/reservas.jpg',
    imageSrcDark: '/landing/reservas-dark.jpg'
  }
]

export default function SystemCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeSlide = slides[currentIndex]

  // Auto-rotation every 7 seconds
  useEffect(() => {
    if (isPaused) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 7000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, currentIndex])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  return (
    <section id="sistema" className="section section-alt relative overflow-hidden" aria-labelledby="sistema-title">
      {/* Background radial accent - Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-100/40 via-amber-100/30 to-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10 hidden dark:hidden" aria-hidden="true" />

      {/* Background radial accent - Dark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-900/20 via-amber-900/15 to-emerald-900/20 rounded-full blur-3xl pointer-events-none -z-10 dark:block hidden" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-border-subtle text-xs font-semibold text-text-secondary">
            <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="uppercase tracking-wider">Demostración en Vivo</span>
          </div>

          <h2 id="sistema-title" className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-text-primary leading-[1.05]">
            Todo tu negocio en una sola plataforma
          </h2>

          <p className="text-base sm:text-lg text-text-secondary font-normal leading-relaxed">
            Explora las herramientas que transforman barberías convencionales en negocios organizados, rentables y escalables.
          </p>
        </motion.div>

        {/* Tab Selector Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-6 mb-12 no-scrollbar"
          role="tablist"
          aria-label="Módulos del sistema"
        >
          {slides.map((slide, idx) => {
            const Icon = slide.icon
            const isActive = idx === currentIndex
            return (
              <motion.button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-text-primary text-text-inverse border-text-primary shadow-md shadow-text-primary/20'
                    : 'bg-surface-1 text-text-tertiary border-border-subtle hover:bg-bg-subtle hover:text-text-primary'
                }`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${slide.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-text-inverse' : 'text-text-muted'}`} aria-hidden="true" />
                <span>{slide.tabLabel}</span>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Main Carousel Display Card */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="card card-elevated p-6 sm:p-8 lg:p-10 relative overflow-hidden"
        >
          {/* Progress bar line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-subtle" aria-hidden="true">
            <motion.div
              key={currentIndex}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 7, ease: 'linear' }}
              className="h-full bg-text-primary"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              role="tabpanel"
              id={`panel-${activeSlide.id}`}
              aria-labelledby={`tab-${activeSlide.id}`}
            >
              {/* Left Column: Details & Features */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:col-span-5 space-y-6"
              >
                <div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="inline-block text-[11px] font-black uppercase tracking-widest text-accent bg-accent-light px-3 py-1 rounded-full border border-accent-subtle mb-3"
                  >
                    {activeSlide.tabLabel}
                  </motion.span>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight leading-snug"
                  >
                    {activeSlide.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-sm font-semibold text-text-tertiary mt-1"
                  >
                    {activeSlide.tagline}
                  </motion.p>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="text-sm text-text-secondary leading-relaxed"
                >
                  {activeSlide.description}
                </motion.p>

                {/* Highlights List */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="space-y-3 pt-2"
                >
                  {activeSlide.highlights.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium text-text-secondary leading-snug">{item}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Action CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="pt-4 flex items-center gap-4 flex-wrap"
                >
                  <motion.a
                    href="/register"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 btn-accent text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md shadow-accent/20 hover:shadow-glow-sm transition-all duration-200 group"
                  >
                    <span>Probar Este Módulo</span>
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </motion.span>
                  </motion.a>

                  {/* Manual Navigation Controls */}
                  <div className="flex items-center gap-2 ml-auto">
                    <motion.button
                      onClick={handlePrev}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl border border-border-default text-text-tertiary hover:bg-bg-subtle hover:text-text-primary transition-all duration-200"
                      aria-label="Módulo anterior"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </motion.button>
                    <span className="text-xs font-mono font-bold text-text-tertiary px-2">
                      {currentIndex + 1} / {slides.length}
                    </span>
                    <motion.button
                      onClick={handleNext}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl border border-border-default text-text-tertiary hover:bg-bg-subtle hover:text-text-primary transition-all duration-200"
                      aria-label="Módulo siguiente"
                    >
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: High Quality Mockup Frame */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-7"
              >
                <div className="mockup-frame p-3 sm:p-4">
                  {/* Window Browser Header */}
                  <div className="mockup-browser-bar flex items-center justify-between pb-3 px-2 mb-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
                    </div>
                    <div className="text-[10px] font-mono text-text-tertiary bg-surface-1 px-3 py-0.5 rounded-md border border-border-subtle">
                      barberos.app/{activeSlide.id.replace('dashboard-', '')}
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Image Presentation */}
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-bg-base shadow-inner group">
                    {activeSlide.imageSrcDark ? (
                      <>
                        <Image
                          src={activeSlide.imageSrc}
                          alt={activeSlide.title}
                          fill
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] dark:hidden"
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <Image
                          src={activeSlide.imageSrcDark}
                          alt={`${activeSlide.title} Modo Oscuro`}
                          fill
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] hidden dark:block"
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </>
                    ) : (
                      <Image
                        src={activeSlide.imageSrc}
                        alt={activeSlide.title}
                        fill
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}