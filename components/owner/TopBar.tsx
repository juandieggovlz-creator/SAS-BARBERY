'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'

import NotificationBell from '@/components/notifications/NotificationBell'

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Centro de Operaciones', subtitle: 'Resumen ejecutivo y control del negocio' },
  '/calendar': { title: 'Agenda & Calendario', subtitle: 'Vista cronológica de citas por barbero' },
  '/appointments': { title: 'Gestión de Citas', subtitle: 'Control detallado, estados y reprogramación' },
  '/clients': { title: 'Directorio de Clientes CRM', subtitle: 'Historial de visitas y notas internas' },
  '/barbers': { title: 'Equipo de Barberos', subtitle: 'Rendimiento, comisiones y agendas' },
  '/services': { title: 'Catálogo de Servicios', subtitle: 'Precios, duraciones y categorías' },
  '/finances': { title: 'Finanzas & Cierre de Caja', subtitle: 'Ingresos reales, gastos y rentabilidad neta' },
  '/reports': { title: 'Reportes & Analíticas', subtitle: 'Métricas clave de desempeño del negocio' },
  '/notes': { title: 'Notas & Recordatorios', subtitle: 'Avisos internos e instrucciones del equipo' },
  '/chat': { title: 'Chat Interno', subtitle: 'Comunicación en tiempo real con barberos' },
  '/webpage': { title: 'Editor de Página Web', subtitle: 'Personalización de tema, catálogo y reservas en vivo' },
  '/branches': { title: 'Sedes & Sucursales', subtitle: 'Administración corporativa y control de sedes' },
  '/settings': { title: 'Configuración del Negocio', subtitle: 'Perfil público, horarios y preferencias' },
}

interface TopBarProps {
  onOpenSearch?: () => void
}

export default function TopBar({ onOpenSearch }: TopBarProps) {
  const pathname = usePathname()

  const matchedKey = Object.keys(routeTitles).find(k => pathname === k || (k !== '/dashboard' && pathname.startsWith(k)))
  const currentRoute = matchedKey ? routeTitles[matchedKey] : { title: 'BarberOS Panel', subtitle: 'Gestión integral de barbería' }

  return (
    <header
      className="h-16 bg-white dark:bg-[#09090b] border-b border-zinc-100 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          {currentRoute.title}
        </h1>
        <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 hidden sm:block">
          {currentRoute.subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-zinc-50 dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-2 rounded-xl text-xs font-medium transition-all border border-zinc-200/80 dark:border-zinc-700/80"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Buscar...</span>
          <kbd className="hidden sm:inline bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[9px] font-mono border border-zinc-200 dark:border-zinc-700 text-zinc-400 shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Interactive Notification Bell */}
        <NotificationBell />

        {/* Action Button: New Appointment */}
        <Link
          href="/appointments"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 group cursor-pointer"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)',
            boxShadow: '0 4px 14px var(--accent-op30)'
          }}
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 shrink-0" strokeWidth={3} style={{ color: 'var(--accent-contrast)' }} />
          <span className="hidden sm:inline font-black" style={{ color: 'var(--accent-contrast)' }}>Nueva Cita</span>
        </Link>
      </div>
    </header>
  )
}
