'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, Menu } from 'lucide-react'

import NotificationBell from '@/components/notifications/NotificationBell'
import BranchSelector from '@/components/owner/BranchSelector'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import ThemeToggle from '@/components/ui/ThemeToggle'

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
  '/integrations': { title: 'Conexión WhatsApp', subtitle: 'Automatización de reservas vía WhatsApp' },
  '/subscription': { title: 'Membresía & Plan', subtitle: 'Gestión de suscripción y funciones habilitadas' },
  '/support': { title: 'Soporte BarberOS', subtitle: 'Ayuda, tickets y documentación' },
}

interface TopBarProps {
  onOpenSearch?: () => void
}

export default function TopBar({ onOpenSearch }: TopBarProps) {
  const pathname = usePathname()
  const [showBranchSelector, setShowBranchSelector] = useState(false)

  const matchedKey = Object.keys(routeTitles).find(k => pathname === k || (k !== '/dashboard' && pathname.startsWith(k)))
  const currentRoute = matchedKey ? routeTitles[matchedKey] : { title: 'BarberOS Panel', subtitle: 'Gestión integral de barbería' }

  // Contexto visual de sede activa y empresa
  const [activeBranchContext, setActiveBranchContext] = useState<{
    companyName: string
    branchName: string
    isMainBranch: boolean
  } | null>(null)

  // Detectar si el usuario tiene multisedes habilitadas y cargar contexto de sede activa
  useEffect(() => {
    const checkMultiBranch = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const data = await res.json()
        const business = data?.user?.business
        const plan = business?.plan
        if (data?.user?.companyId && plan?.allowsMultiBranch) {
          setShowBranchSelector(true)
        }
        if (data?.activeBranch) {
          setActiveBranchContext({
            companyName: data.companyName || 'BarberOS',
            branchName: data.activeBranch.name,
            isMainBranch: Boolean(data.activeBranch.isMainBranch)
          })
        }
      } catch {
        // ignore
      }
    }
    checkMultiBranch()
  }, [])

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
            onClick={() => window.dispatchEvent(new CustomEvent('open-owner-sidebar'))}
            className="md:hidden p-2 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer touch-manipulation"
            aria-label="Abrir menú de navegación"
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

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto shrink-0">
          {/* Identificador Visual de Sede Activa & Empresa */}
          {activeBranchContext && (
            <div className="hidden lg:flex flex-col items-end text-right border-r border-zinc-200/80 dark:border-zinc-800 pr-3 mr-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 truncate max-w-[170px]">
                {activeBranchContext.companyName}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                  {activeBranchContext.branchName}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                    activeBranchContext.isMainBranch
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60'
                  }`}
                >
                  {activeBranchContext.isMainBranch ? 'Sede principal' : 'Sede vinculada'}
                </span>
              </div>
            </div>
          )}

          {/* Branch Selector (only shown for multi-branch VIP accounts) */}
          <BranchSelector visible={showBranchSelector} />

          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 bg-zinc-50 dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium transition-all border border-zinc-200/80 dark:border-zinc-700/80 cursor-pointer touch-manipulation"
            aria-label="Buscar en BarberOS"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="hidden md:inline">Buscar...</span>
            <kbd className="hidden lg:inline bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[9px] font-mono border border-zinc-200 dark:border-zinc-700 text-zinc-400 shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* Interactive Notification Bell */}
          <NotificationBell />

          {/* Quick Theme Switcher (Light / Dark) */}
          <ThemeToggle variant="navbar" />

          {/* Action Button: New Appointment */}
          <Link
            href="/appointments"
            className="panel-btn-accent flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 group cursor-pointer touch-manipulation"
            aria-label="Nueva Cita"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 shrink-0" strokeWidth={3} />
            <span className="hidden sm:inline font-black">Nueva Cita</span>
          </Link>
        </div>
      </header>
    </>
  )
}
