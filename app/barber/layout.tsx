'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Percent, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut,
  LifeBuoy,
  Menu,
  X,
  UserCheck,
  Store
} from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'

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

  if (pathname?.startsWith('/barber/access')) {
    return <>{children}</>
  }

  const [profile, setProfile] = useState<BarberProfile | null>(null)

  useEffect(() => {
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
  }, [])

  const navItems = [
    { name: 'Inicio', href: '/barber/dashboard', icon: LayoutDashboard },
    { name: 'Mi Agenda', href: '/barber/calendar', icon: Calendar },
    { name: 'Catálogo de Servicios', href: '/barber/services', icon: Scissors },
    { name: 'Comisiones', href: '/barber/commissions', icon: Percent },
    { name: 'Rendimiento', href: '/barber/performance', icon: TrendingUp },
    { name: 'Horarios', href: '/barber/schedule', icon: Clock },
    { name: 'Chat', href: '/barber/chat', icon: MessageSquare },
    { name: 'Notificaciones', href: '/barber/notifications', icon: Bell },
    { name: 'Perfil', href: '/barber/profile', icon: User },
    { name: 'Soporte', href: '/barber/support', icon: LifeBuoy },
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] selection:bg-black selection:text-white transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── BRAND HEADER ── */}
      <div className="px-6 py-4.5 border-b border-[var(--sidebar-border)] flex items-center justify-between shrink-0">
        <Link href="/barber/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-zinc-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative border border-zinc-200 dark:border-zinc-800 shrink-0">
            {profile?.business?.logo ? (
              <Image
                src={profile.business.logo}
                alt={profile.business.name}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <Scissors className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-[var(--sidebar-text)]" style={{ letterSpacing: '-0.02em' }}>
                Barber<span className="text-amber-500">OS</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 truncate max-w-[150px] border border-amber-400/30 bg-amber-400/15 text-amber-500 dark:text-amber-400 shadow-xs">
                <Store className="w-2.5 h-2.5 shrink-0 text-amber-500 dark:text-amber-400" />
                <span className="truncate">{profile?.business?.name || 'Mi Barbería'}</span>
              </span>
            </div>
          </div>
        </Link>

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] p-1 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── NAVIGATION ── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        <div>
          <div className="px-3 mb-2 text-[9px] font-black uppercase tracking-widest text-[var(--sidebar-text-muted)]">
            MENÚ BARBERO
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                    ${active
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-xs'
                      : 'text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]'
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400 dark:text-zinc-950' : 'text-[var(--sidebar-text-muted)]'}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="truncate">{item.name}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-zinc-950 shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── FOOTER / PROFILE ── */}
      <div className="shrink-0 p-3 pb-6 border-t border-[var(--sidebar-border)]">
        {/* Profile Card */}
        {profile && profile.name && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 overflow-hidden shadow-xs relative text-white font-black text-xs">
              {profile.avatar ? (
                <Image src={profile.avatar} alt={profile.name} fill className="object-cover" unoptimized />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                {profile.name}
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold truncate">
                {profile.specialty || 'Barbero Profesional'}
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="En línea" />
          </div>
        )}

        {/* Theme Toggle in sidebar */}
        <div className="px-3 py-2 mb-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--sidebar-text-muted)] uppercase tracking-wider">Tema</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--sidebar-text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all rounded-xl"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile Toggle Button Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-white border border-zinc-200 shadow-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-black text-sm text-zinc-950 tracking-tight">Barber<span className="text-amber-500">OS</span></span>
        </div>
        <NotificationBell />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed top-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 md:ml-64 bg-[var(--background)] transition-colors duration-200 ${pathname === '/barber/chat' ? 'h-screen overflow-hidden flex flex-col p-2 sm:p-3' : 'overflow-x-hidden overflow-y-auto max-h-screen'}`}>
        <div className={pathname === '/barber/chat' ? 'w-full h-full flex-1 flex flex-col min-h-0' : 'p-4 sm:p-6 md:p-8 w-full'}>
          {children}
        </div>
      </main>
    </div>
  )
}

