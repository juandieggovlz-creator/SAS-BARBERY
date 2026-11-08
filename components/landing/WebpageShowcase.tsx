'use client'

import React, { useState } from 'react'
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
  Sparkles,
  Star,
  Clock,
  Check,
  Scissors,
  MapPin,
  Phone,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

type DeviceType = 'desktop' | 'tablet' | 'mobile'

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
    title: 'Catálogo de Servicios & Portada',
    desc: 'Muestra tus mejores cortes con precios claros, tiempos de servicio y eslogan para convertir visitantes en clientes.',
  },
  {
    icon: Calendar,
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    title: 'Motor de Reservas Directo',
    desc: 'El cliente escoge barbero, servicio, fecha y hora disponible. Confirmación automática sin llamadas ni tiempos muertos.',
  },
]

// ─────────────────────────────────────────────────────────────
// COMPONENTE NATIVO SINCRONIZADO: SIMULACIÓN WEB DE BARBERÍA
// ─────────────────────────────────────────────────────────────
interface WebPreviewProps {
  device: DeviceType
}

function WebpageInteractivePreview({ device }: WebPreviewProps) {
  const [selectedService, setSelectedService] = useState(0)
  const [selectedBarber, setSelectedBarber] = useState(0)
  const [selectedTime, setSelectedTime] = useState('11:30 AM')
  const [confirmed, setConfirmed] = useState(false)

  const services = [
    { name: 'Skin Fade Pro', price: '$35.000', duration: '40 min' },
    { name: 'Barba Ritual', price: '$25.000', duration: '25 min' },
    { name: 'Combo Titán VIP', price: '$55.000', duration: '60 min' }
  ]

  const barbers = [
    { name: 'Carlos Ruiz', role: 'Master Fade' },
    { name: 'Mateo Valencia', role: 'Estilista' },
    { name: 'Julián Fade', role: 'Colorimetría' }
  ]

  const times = ['09:30 AM', '11:30 AM', '02:15 PM', '04:00 PM']

  const handleBook = () => {
    setConfirmed(true)
    setTimeout(() => setConfirmed(false), 3500)
  }

  return (
    <div className="w-full h-full bg-zinc-50 dark:bg-[#090b10] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-3.5 sm:p-5 select-none transition-colors duration-300 font-sans text-left overflow-y-auto">
      {/* ── Brand Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/90 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20">
            BE
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-black text-zinc-950 dark:text-white leading-tight">
                Barbería Elite
              </h4>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                Abierto
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[190px] sm:max-w-none">
              Carrera 20 # 25-18, Centro · Sincelejo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>4.9</span>
          <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">(240)</span>
        </div>
      </div>

      {/* ── Step 1: Select Service ── */}
      <div className="space-y-1.5 my-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            1. Elige tu servicio
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            {services[selectedService].name} · {services[selectedService].price}
          </span>
        </div>

        <div className={`grid gap-2 ${device === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {services.map((s, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedService(idx)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                selectedService === idx
                  ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-white/[0.03] border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-950 dark:text-white leading-tight">
                  {s.name}
                </span>
                {selectedService === idx && (
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className="text-zinc-500 dark:text-zinc-400">{s.duration}</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{s.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 2: Select Barber ── */}
      <div className="space-y-1.5 mb-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
          2. Selecciona tu barbero
        </span>
        <div className="grid grid-cols-3 gap-2">
          {barbers.map((b, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedBarber(idx)}
              className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                selectedBarber === idx
                  ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-white/[0.03] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
              }`}
            >
              <p className="text-[11px] font-bold truncate leading-tight">{b.name}</p>
              <p className={`text-[9px] truncate ${selectedBarber === idx ? 'text-zinc-800 font-medium' : 'text-zinc-400'}`}>
                {b.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 3: Select Time ── */}
      <div className="space-y-1.5 mb-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
          3. Horario para hoy
        </span>
        <div className="flex flex-wrap gap-1.5">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTime(t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedTime === t
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'bg-white dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Booking Action / Confirmation ── */}
      <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 shrink-0">
        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>¡Cita confirmada! Notificación enviada por WhatsApp</span>
            </motion.div>
          ) : (
            <button
              onClick={handleBook}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirmar Cita para las {selectedTime}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 mt-2">
          Sin descargas · Sincronizado automáticamente con BarberOS
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL WEBPAGESHOWCASE
// ─────────────────────────────────────────────────────────────
export default function WebpageShowcase() {
  const [device, setDevice] = useState<DeviceType>('desktop')

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
            Sin programar ni contratar agencias. BarberOS crea tu portal oficial de reservas adaptado perfectamente a cualquier pantalla y con sincronización en tiempo real.
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
                Cada barbería en BarberOS obtiene un enlace exclusivo para compartir en su biografía de Instagram, TikTok, Google Maps y estados de WhatsApp.
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
                className={
                  device === 'desktop'
                    ? 'w-full max-w-[680px] mx-auto'
                    : device === 'tablet'
                    ? 'w-[420px] max-w-full mx-auto'
                    : 'w-[300px] max-w-full mx-auto'
                }
              >
                {/* ── Outer Device Frame ── */}
                <div
                  className={
                    device === 'desktop'
                      ? 'bg-zinc-200 dark:bg-[#151922] rounded-2xl p-2.5 shadow-2xl border border-zinc-300 dark:border-white/10'
                      : device === 'tablet'
                      ? 'bg-zinc-800 rounded-[32px] p-3 shadow-2xl border-4 border-zinc-700'
                      : 'bg-zinc-900 rounded-[44px] p-3 shadow-2xl border-4 border-zinc-700 relative'
                  }
                >
                  {/* Desktop Browser Top Bar */}
                  {device === 'desktop' && (
                    <div className="rounded-t-lg px-3 py-2 flex items-center gap-2 bg-zinc-100 dark:bg-[#12151e] border-b border-zinc-200 dark:border-white/10 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" aria-hidden="true" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      </div>
                      <div className="flex-1 mx-3 bg-white dark:bg-[#0c0e14] rounded-md px-3 py-1 flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">
                        <LinkIcon className="w-3 h-3 text-emerald-500 shrink-0" aria-hidden="true" />
                        <span className="truncate">barberos.app/b/barberia-elite</span>
                      </div>
                      <div className="w-6" />
                    </div>
                  )}

                  {/* Mobile Dynamic Island Notch */}
                  {device === 'mobile' && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                      <div className="w-20 h-4 bg-zinc-950 rounded-full border border-zinc-800" />
                    </div>
                  )}

                  {/* Screen View Area */}
                  <div
                    className={`rounded-xl overflow-hidden shadow-inner ${
                      device === 'mobile'
                        ? 'h-[500px] rounded-[30px] pt-4'
                        : device === 'tablet'
                        ? 'h-[440px] rounded-[22px]'
                        : 'h-[400px]'
                    }`}
                  >
                    <WebpageInteractivePreview device={device} />
                  </div>
                </div>

                {/* Bottom Home Indicator for Mobile & Tablet */}
                {device === 'mobile' && (
                  <div className="flex justify-center mt-2.5">
                    <div className="w-24 h-1 bg-zinc-500/60 rounded-full" aria-hidden="true" />
                  </div>
                )}
                {device === 'tablet' && (
                  <div className="flex justify-center mt-2">
                    <div className="w-12 h-1 bg-zinc-500/60 rounded-full" aria-hidden="true" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  )
}
