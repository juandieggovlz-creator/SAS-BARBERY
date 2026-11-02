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
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
    <section id="sistema" className="py-24 md:py-32 bg-zinc-50/70 border-y border-zinc-200/80 relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-100/40 via-amber-100/30 to-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 text-xs font-bold text-zinc-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="uppercase tracking-wider">Demostración en Vivo</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Todo tu negocio en una sola plataforma
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
            Explora las herramientas que transforman barberías convencionales en negocios organizados, rentables y escalables.
          </p>
        </div>

        {/* Tab Selector Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {slides.map((slide, idx) => {
            const Icon = slide.icon
            const isActive = idx === currentIndex
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-md shadow-zinc-950/15'
                    : 'bg-white text-zinc-600 border-zinc-200/90 hover:bg-zinc-100/80 hover:text-zinc-950'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{slide.tabLabel}</span>
              </button>
            )
          })}
        </div>

        {/* Main Carousel Display Card */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xl shadow-zinc-950/5 p-6 sm:p-8 lg:p-10 relative overflow-hidden"
        >
          {/* Progress bar line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100">
            <motion.div
              key={currentIndex}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 7, ease: 'linear' }}
              className="h-full bg-zinc-950"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Left Column: Details & Features */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="inline-block text-[11px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
                    {activeSlide.tabLabel}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-snug">
                    {activeSlide.title}
                  </h3>
                  <p className="text-sm font-semibold text-zinc-500 mt-1">
                    {activeSlide.tagline}
                  </p>
                </div>

                <p className="text-sm text-zinc-600 leading-relaxed">
                  {activeSlide.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-2.5 pt-2">
                  {activeSlide.highlights.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-zinc-700 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="pt-4 flex items-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 group"
                  >
                    <span>Probar Este Módulo</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>

                  {/* Manual Navigation Controls */}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handlePrev}
                      className="p-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      {currentIndex + 1} / {slides.length}
                    </span>
                    <button
                      onClick={handleNext}
                      className="p-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: High Quality Mockup Frame */}
              <div className="lg:col-span-7">
                <div className="bg-zinc-100/80 dark:bg-[#18181d] rounded-2xl p-2.5 sm:p-4 border border-zinc-200/90 dark:border-zinc-800 shadow-xl overflow-hidden relative group">
                  {/* Window Browser Header */}
                  <div className="flex items-center justify-between pb-3 px-2 border-b border-zinc-200/70 dark:border-zinc-800 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-300 bg-white dark:bg-[#121215] px-3 py-0.5 rounded-md border border-zinc-200/80 dark:border-zinc-700">
                      barberos.app/{activeSlide.id.replace('dashboard-', '')}
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Image Presentation */}
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0e] shadow-inner">
                    {activeSlide.imageSrcDark ? (
                      <>
                        <Image
                          src={activeSlide.imageSrc}
                          alt={activeSlide.title}
                          fill
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] dark:hidden"
                          unoptimized
                        />
                        <Image
                          src={activeSlide.imageSrcDark}
                          alt={`${activeSlide.title} Modo Oscuro`}
                          fill
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] hidden dark:block"
                          unoptimized
                        />
                      </>
                    ) : (
                      <Image
                        src={activeSlide.imageSrc}
                        alt={activeSlide.title}
                        fill
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                        unoptimized
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}
