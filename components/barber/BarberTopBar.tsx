'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Store, User, Menu } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'
import ImpersonationBanner from '@/components/ImpersonationBanner'

interface BarberProfile {
  name: string
  avatar?: string | null
  specialty?: string | null
  business?: {
    id: string
    name: string
    logo?: string | null
    slug: string
  } | null
}

const barberRouteTitles: Record<string, { title: string; subtitle: string }> = {
  '/barber/dashboard': { title: 'Centro de Operaciones', subtitle: 'Resumen de citas del día y métricas personales' },
  '/barber/calendar': { title: 'Mi Agenda', subtitle: 'Vista de calendario y citas programadas' },
  '/barber/services': { title: 'Catálogo de Servicios', subtitle: 'Servicios habilitados, duraciones y precios' },
  '/barber/commissions': { title: 'Mis Comisiones', subtitle: 'Liquidación transparente y pagos acumulados' },
  '/barber/performance': { title: 'Rendimiento & Métricas', subtitle: 'Estadísticas de atención y satisfacción' },
  '/barber/schedule': { title: 'Mis Horarios', subtitle: 'Configuración de disponibilidad y turnos semanales' },
  '/barber/chat': { title: 'Chat Interno', subtitle: 'Comunicación en tiempo real con la administración' },
  '/barber/notifications': { title: 'Notificaciones', subtitle: 'Avisos de citas, reprogramaciones y alertas' },
  '/barber/profile': { title: 'Mi Perfil Profesional', subtitle: 'Especialidad, datos de contacto y avatar' },
  '/barber/support': { title: 'Soporte BarberOS', subtitle: 'Ayuda, tickets y documentación' },
}

interface BarberTopBarProps {
  profile?: BarberProfile | null
}

export default function BarberTopBar({ profile }: BarberTopBarProps) {
  const pathname = usePathname()

  const matchedKey = Object.keys(barberRouteTitles).find(
    (k) => pathname === k || (k !== '/barber/dashboard' && pathname?.startsWith(k))
  )
  const currentRoute = matchedKey
    ? barberRouteTitles[matchedKey]
    : { title: 'Panel del Barbero', subtitle: 'Gestión de citas y servicios' }

  return (
    <>
      <ImpersonationBanner />
      <header
        className="h-16 bg-white dark:bg-[#09090b] border-b border-zinc-100 dark:border-zinc-800/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20 shrink-0"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
      {/* Left: Mobile Menu Toggle + Title & Subtitle */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-barber-sidebar'))}
          className="md:hidden p-2 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer touch-manipulation"
          aria-label="Abrir menú de barbero"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h1
            className="text-sm sm:text-base md:text-lg font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2 truncate"
            style={{ letterSpacing: '-0.02em' }}
          >
            {currentRoute.title}
          </h1>
          <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 dark:text-zinc-400 hidden sm:block truncate">
            {currentRoute.subtitle}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
        {/* Business Badge */}
        {profile?.business?.name && (
          <span
            className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border truncate max-w-[180px] shadow-xs"
            style={{
              backgroundColor: 'var(--accent-op15, rgba(245,158,11,0.15))',
              borderColor: 'var(--accent-op30, rgba(245,158,11,0.30))',
              color: 'var(--accent, #F59E0B)',
            }}
          >
            <Store className="w-3 h-3 shrink-0" style={{ color: 'var(--accent, #F59E0B)' }} />
            <span className="truncate">{profile.business.name}</span>
          </span>
        )}

        {/* Theme Toggle */}
        <ThemeToggle variant="navbar" />

        {/* Interactive Notification Bell */}
        <NotificationBell />

        {/* Quick Profile Pill */}
        <Link
          href="/barber/profile"
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative border border-zinc-200 dark:border-zinc-700 text-white font-bold text-xs shrink-0">
            {profile?.avatar ? (
              <Image src={profile.avatar} alt={profile.name || 'Barbero'} fill sizes="28px" className="object-cover" unoptimized />
            ) : (
              <User className="w-3.5 h-3.5" style={{ color: 'var(--accent, #F59E0B)' }} />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-black text-zinc-950 dark:text-white block truncate max-w-[110px] leading-tight">
              {profile?.name || 'Barbero'}
            </span>
            <span className="text-[9px] font-bold block truncate leading-tight" style={{ color: 'var(--accent, #F59E0B)' }}>
              {profile?.specialty || 'En línea'}
            </span>
          </div>
        </Link>
      </div>
      </header>
    </>
  )
}

