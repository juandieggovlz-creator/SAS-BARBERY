'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut,
  LifeBuoy,
  Menu,
  X,
  Store
} from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'
import BarberTopBar from '@/components/barber/BarberTopBar'
import BarberBottomNav from '@/components/barber/BarberBottomNav'
import PanelAccentProvider from '@/components/ui/PanelAccentProvider'

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

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<BarberProfile | null>(null)

  useEffect(() => {
    if (pathname?.startsWith('/barber/access')) return

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/barber/profile')
        if (res.ok) {
          const data = await res.json()
          if (data && data.name) {
            setProfile(data)
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
      }
    }
    fetchProfile()
  }, [pathname])

  // Control de apertura por eventos externos (BarberTopBar, BarberBottomNav) y bloqueo de scroll
  useEffect(() => {
    const handleOpen = () => setMobileOpen(true)
    const handleToggle = () => setMobileOpen(prev => !prev)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('open-barber-sidebar', handleOpen)
    window.addEventListener('toggle-barber-sidebar', handleToggle)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('open-barber-sidebar', handleOpen)
      window.removeEventListener('toggle-barber-sidebar', handleToggle)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  if (pathname?.startsWith('/barber/access')) {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const navGroups: {
    title: string
    items: { label: string; href: string; icon: React.ElementType }[]
  }[] = [
    {
      title: 'OPERACIONES',
      items: [
        { label: 'Inicio', href: '/barber/dashboard', icon: LayoutDashboard },
        { label: 'Mi Agenda', href: '/barber/calendar', icon: Calendar },
        { label: 'Servicios', href: '/barber/services', icon: Scissors },
      ]
    },
    {
      title: 'RENDIMIENTO',
      items: [
        { label: 'Comisiones', href: '/barber/commissions', icon: DollarSign },
        { label: 'Rendimiento', href: '/barber/performance', icon: TrendingUp },
        { label: 'Horarios', href: '/barber/schedule', icon: Clock },
      ]
    },
    {
      title: 'COMUNICACIÓN',
      items: [
        { label: 'Chat Interno', href: '/barber/chat', icon: MessageSquare },
        { label: 'Notificaciones', href: '/barber/notifications', icon: Bell },
      ]
    },
    {
      title: 'CUENTA',
      items: [
        { label: 'Mi Perfil', href: '/barber/profile', icon: User },
        { label: 'Soporte BarberOS', href: '/barber/support', icon: LifeBuoy },
      ]
    }
  ]

  const sidebarContent = (
    <div
      className="h-full flex flex-col bg-white dark:bg-[#09090b] border-r border-zinc-100 dark:border-zinc-800/80 selection:bg-black selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── BRAND HEADER (Idéntico a OwnerSidebar) ── */}
      <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
        <Link href="/barber/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-[#151518] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative border border-zinc-200 dark:border-zinc-800 shrink-0">
            {profile?.business?.logo ? (
              <Image
                src={profile.business.logo}
                alt={profile.business.name || 'Barbería'}
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <Image
                src="/logo.png"
                alt="BarberOS"
                fill
                sizes="36px"
                className="object-cover"
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                Barber<span style={{ color: 'var(--accent, #F59E0B)' }}>OS</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 truncate max-w-[150px] transition-all duration-200 shadow-xs border"
                style={{
                  backgroundColor: 'var(--accent-op15, rgba(245,158,11,0.15))',
                  borderColor: 'var(--accent-op30, rgba(245,158,11,0.30))',
                  color: 'var(--accent, #F59E0B)',
                }}
              >
                <Store className="w-2.5 h-2.5 shrink-0" style={{ color: 'var(--accent, #F59E0B)' }} />
                <span className="truncate">{profile?.business?.name || 'Mi Barbería'}</span>
              </span>
            </div>
          </div>
        </Link>

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── NAVIGATION (Misma línea que OwnerSidebar) ── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              <span>{group.title}</span>
              <span className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800/70" />
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || (item.href !== '/barber/dashboard' && pathname?.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 group border
                      ${active
                        ? 'shadow-xs font-extrabold'
                        : 'border-transparent font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-[#16161a] hover:text-zinc-950 dark:hover:text-white'
                      }
                    `}
                    style={active ? {
                      backgroundColor: 'var(--accent-op15, rgba(245, 158, 11, 0.14))',
                      borderColor: 'var(--accent-op30, rgba(245, 158, 11, 0.30))',
                      color: 'var(--accent, #F59E0B)',
                    } : undefined}
                  >
                    {active && (
                      <span
                        className="w-1 h-4 rounded-full shrink-0 transition-all"
                        style={{
                          backgroundColor: 'var(--accent, #F59E0B)',
                          boxShadow: '0 0 8px var(--accent-op60, rgba(245, 158, 11, 0.6))',
                        }}
                      />
                    )}
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                        active
                          ? 'shadow-2xs'
                          : 'bg-zinc-100/80 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200/70 dark:group-hover:bg-zinc-800 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:scale-105'
                      }`}
                      style={active ? {
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                      } : undefined}
                    >
                      <Icon
                        className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
                        strokeWidth={active ? 2.4 : 2}
                      />
                    </span>
                    <span className="truncate tracking-tight">{item.label}</span>
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0 transition-all"
                        style={{
                          backgroundColor: 'var(--accent, #F59E0B)',
                          boxShadow: '0 0 8px var(--accent-op60, rgba(245, 158, 11, 0.6))',
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER / PROFILE (Misma línea que OwnerSidebar) ── */}
      <div className="shrink-0 p-3 pb-6 border-t border-zinc-100 dark:border-zinc-800/80">
        <div
          className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-all duration-200 shadow-xs border"
          style={{
            backgroundColor: 'var(--accent-op15, rgba(245, 158, 11, 0.15))',
            borderColor: 'var(--accent-op30, rgba(245, 158, 11, 0.30))',
          }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative bg-zinc-950 dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800">
            {profile?.avatar ? (
              <Image src={profile.avatar} alt={profile.name || 'Barbero'} fill sizes="28px" className="object-cover" unoptimized />
            ) : (
              <span className="text-[11px] font-black" style={{ color: 'var(--accent, #F59E0B)' }}>
                {profile?.name?.charAt(0) || 'B'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-zinc-900 dark:text-white truncate">
              {profile?.name || 'Barbero'}
            </div>
            <div
              className="text-[10px] font-bold truncate"
              style={{ color: 'var(--accent, #F59E0B)' }}
            >
              {profile?.specialty || 'Barbero Profesional'}
            </div>
          </div>
          <div className="w-2 h-2 rounded-full shrink-0 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" title="En línea" />
        </div>

        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <ThemeToggle variant="navbar" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">Tema</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all rounded-lg cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <PanelAccentProvider>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] font-sans selection:bg-black selection:text-white flex overflow-x-hidden">
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
            <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col bg-white dark:bg-[#09090b] animate-in slide-in-from-left duration-250 pt-safe pb-safe">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#09090b] w-full min-w-0">
          <BarberTopBar profile={profile} />
          <main
            className={`flex-1 w-full min-w-0 panel-page-enter ${
              pathname === '/barber/chat'
                ? 'h-[calc(100vh-4rem)] p-2 sm:p-3 overflow-hidden flex flex-col pb-20 md:pb-3'
                : 'p-3 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8'
            }`}
          >
            {children}
          </main>
        </div>

        {/* Barra inferior ergonómica para móviles */}
        <BarberBottomNav />
      </div>
    </PanelAccentProvider>
  )
}
