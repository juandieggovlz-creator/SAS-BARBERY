'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Server,
  Zap,
  Phone,
  ShieldAlert
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function SLAPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-amber-500 selection:text-black transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-md shadow-zinc-950/15 shrink-0">
              <Image
                src="/logo.png"
                alt="BarberOS Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white uppercase flex items-center gap-1.5">
                Barber<span className="font-light text-zinc-500">OS</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                  SLA
                </span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="navbar" />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Regresar al inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Cross Navigation Bar */}
      <nav className="border-b border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-100/70 dark:bg-zinc-900/40 transition-colors">
        <div className="max-w-5xl mx-auto px-5 py-2.5 flex items-center gap-3 overflow-x-auto text-xs font-semibold">
          <Link
            href="/terminos-y-condiciones"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Términos y Condiciones
          </Link>
          <Link
            href="/politica-de-privacidad"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Política de Privacidad
          </Link>
          <Link
            href="/seguridad"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Seguridad y Datos
          </Link>
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap font-bold">
            Acuerdo SLA
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-12">
        {/* Title & Metadata */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" /> Estándares de Servicio
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
            Acuerdo de Nivel de Servicio (SLA)
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Última actualización: <span className="text-zinc-800 dark:text-zinc-200">Noviembre 2026</span> • Documento de compromisos operativos
          </p>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>Nota informativa y alcance legal:</strong> Este documento establece las metas operativas y de soporte técnico que BarberOS procura cumplir diligentemente. No constituye una cláusula penal automática ni compromiso indemnizatorio frente a fallas atribuibles a proveedores globales de internet, energía o infraestructura de terceros. Sujeto a revisión y validación legal según los términos de servicio suscritos.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {/* Section 1: Disponibilidad de la Plataforma */}
          <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                1. Disponibilidad de la Plataforma (Uptime Objetivo)
              </h2>
            </div>
            <p>
              BarberOS opera sobre infraestructura distribuida en la nube con un objetivo de disponibilidad anual del <strong>99.5%</strong> para el motor central de reservas online y consulta de agendas, disponible las 24 horas del día, los 7 días de la semana.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              *Se excluyen de la métrica las ventanas de mantenimiento preventivo previamente notificadas o las interrupciones ajenas a BarberOS (cortes de conectividad móvil del usuario, bloqueos de proveedores locales de telecomunicaciones, etc.).
            </p>
          </section>

          {/* Section 2: Ventanas de Mantenimiento */}
          <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                2. Ventanas de Mantenimiento y Actualizaciones
              </h2>
            </div>
            <p>
              Para garantizar la estabilidad y aplicar mejoras de rendimiento o seguridad, se programan actualizaciones preferentemente en horarios de bajo impacto comercial (entre las 11:00 PM y las 5:00 AM hora de Colombia UTC-5).
            </p>
          </section>

          {/* Section 3: Tiempos de Respuesta de Soporte */}
          <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Headphones className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                3. Horarios y Tiempos Estimados de Respuesta de Soporte
              </h2>
            </div>
            <p>
              El equipo de soporte humano atiende consultas operativas a través de nuestro canal oficial de WhatsApp y correo electrónico:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800">
                <p className="font-bold text-zinc-950 dark:text-white">Horario de Atención:</p>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Lunes a Sábado: 8:00 AM – 7:00 PM</p>
                <p className="text-zinc-500 dark:text-zinc-400">Domingos y Festivos: Monitoreo crítico</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800">
                <p className="font-bold text-zinc-950 dark:text-white">Tiempos de Respuesta Estimados:</p>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Incidencias críticas: Menos de 2 horas</p>
                <p className="text-zinc-500 dark:text-zinc-400">Consultas generales: Mismo día hábil</p>
              </div>
            </div>
          </section>

          {/* Section 4: Contacto Oficial */}
          <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-2">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              Canal Oficial de Asistencia Técnica
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Comunícate directamente con nuestro equipo de atención para soporte o reporte de incidencias.
            </p>
            <div className="pt-2 flex justify-center gap-3 text-xs">
              <a
                href="https://wa.me/573242063393"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                WhatsApp Oficial: +57 324 206 3393
              </a>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-600 dark:text-zinc-400">Sincelejo, Sucre, Colombia</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

