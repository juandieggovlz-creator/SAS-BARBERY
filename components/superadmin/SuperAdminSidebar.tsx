'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Store,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  AlertOctagon,
  LifeBuoy,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Bot,
  Loader2,
  Palette,
  Sun,
  Moon
} from 'lucide-react'
import { useSuperAdminTheme } from '@/components/superadmin/SuperAdminThemeManager'

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const { theme: saTheme, toggleTheme: saToggleTheme } = useSuperAdminTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email?: string; role?: string; name?: string } | null>(null)

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d?.user) {
          setCurrentUser(d.user)
        }
      })
      .catch(() => {})
  }, [])

  // Control de apertura por eventos externos y bloqueo de scroll
  React.useEffect(() => {
    const handleOpen = () => setMobileOpen(true)
    const handleToggle = () => setMobileOpen(prev => !prev)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('open-superadmin-sidebar', handleOpen)
    window.addEventListener('toggle-superadmin-sidebar', handleToggle)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('open-superadmin-sidebar', handleOpen)
      window.removeEventListener('toggle-superadmin-sidebar', handleToggle)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const navGroups = [
    {
      title: 'CENTRO DE COMANDO',
      items: [
        { label: 'Centro de Control', href: '/superadmin/dashboard', icon: LayoutDashboard },
        { label: 'Barberías & Negocios', href: '/superadmin/businesses', icon: Building2 },
        { label: 'Sedes & Sucursales', href: '/superadmin/branches', icon: Store },
        { label: 'Directorio de Usuarios', href: '/superadmin/users', icon: Users },
      ]
    },
    {
      title: 'MONETIZACIÓN & NEGOCIO',
      items: [
        { label: 'Planes & Precios', href: '/superadmin/plans', icon: CreditCard },
        { label: 'Facturación & Pagos', href: '/superadmin/billing', icon: DollarSign },
        { label: 'Pipeline Comercial', href: '/superadmin/commercial', icon: TrendingUp },
      ]
    },
    {
      title: 'SALUD & SOPORTE TÉCNICO',
      items: [
        { label: 'Monitor de Servicios', href: '/superadmin/system', icon: Activity },
        { label: 'Sentinel Telegram', href: '/superadmin/sentinel', icon: Bot },
        { label: 'Centro de Incidencias', href: '/superadmin/incidents', icon: AlertOctagon },
        { label: 'Tickets de Soporte', href: '/superadmin/support', icon: LifeBuoy },
      ]
    },
    {
      title: 'PLATAFORMA & AUDITORÍA',
      items: [
        { label: 'Bitácora de Auditoría', href: '/superadmin/audit', icon: FileText },
        { label: 'Comunicados Globales', href: '/superadmin/announcements', icon: Bell },
        { label: 'Políticas & Legal', href: '/superadmin/legal', icon: ShieldCheck },
        { label: 'Mi Apariencia', href: '/superadmin/appearance', icon: Palette },
        { label: 'Configuración Global', href: '/superadmin/settings', icon: Settings },
      ]
    }
  ]

  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (loggingOut) return
    setLoggingOut(true)
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
      })
    } catch {
      // Ignore
    } finally {
      window.location.replace('/login')
    }
  }

  const isActive = (href: string) =>
    href === '/superadmin/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)

  const sidebarContent = (
    <div
      className="h-full flex flex-col bg-white dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── BRAND HEADER ── */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <Link href="/superadmin/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0 border border-zinc-300 dark:border-zinc-700 bg-zinc-950 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="BarberOS Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                Barber<span className="text-amber-500">OS</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono shadow-2xs">
                SUPER ADMIN
              </span>
            </div>
          </div>
        </Link>

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── NAVEGACIÓN ORGANIZADA ── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              <span>{group.title}</span>
              <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800/70" />
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 group border
                      ${
                        active
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs font-extrabold'
                          : 'border-transparent font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-white'
                      }
                    `}
                  >
                    {active && (
                      <span className="w-1 h-4 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                    )}
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                        active
                          ? 'bg-amber-500 text-zinc-950 shadow-2xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200/70 dark:group-hover:bg-zinc-800 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:scale-105'
                      }`}
                    >
                      <Icon
                        className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
                        strokeWidth={active ? 2.4 : 2}
                      />
                    </span>
                    <span className="truncate tracking-tight">{item.label}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER / SUPERADMIN PERFIL ── */}
      <div className="shrink-0 p-3 pb-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0c0c0e]">
        {/* Profile Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-amber-500/30 text-amber-400 shadow-2xs font-black text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-zinc-950 dark:text-white truncate">
              {currentUser?.role === 'ROOT_PLATFORM_OWNER'
                ? 'Platform Owner (Root)'
                : currentUser?.role === 'SUPER_ADMIN'
                ? 'Super Administrador'
                : 'Administrador'}
            </div>
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">
              {currentUser?.email || 'barberos.contacto@gmail.com'}
            </div>
          </div>
          <div
            className="w-2 h-2 rounded-full shrink-0 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
            title="Conectado con privilegios globales"
          />
        </div>

        {/* Quick controls */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saToggleTheme}
              aria-label={saTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={saTheme === 'dark' ? 'Modo claro ☀️' : 'Modo oscuro 🌙'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 select-none cursor-pointer border ${
                saTheme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-amber-300 hover:bg-zinc-700 shadow-xs'
                  : 'bg-zinc-100 border-zinc-200/80 text-zinc-700 hover:bg-zinc-200/80'
              }`}
            >
              {saTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:inline">
              Tema Consola
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all rounded-lg cursor-pointer disabled:opacity-50 touch-manipulation"
            title="Cerrar sesión global"
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{loggingOut ? 'Saliendo...' : 'Salir'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed top-0 left-0 z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col bg-white dark:bg-[#0c0c0e] animate-in slide-in-from-left duration-250 pt-safe pb-safe">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
