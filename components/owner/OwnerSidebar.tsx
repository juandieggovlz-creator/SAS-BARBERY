'use client'

import React, { useState, useEffect, useRef } from 'react'

let globalOwnerSidebarScroll = 0
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  UserCheck,
  Scissors,
  DollarSign,
  TrendingUp,
  FileText,
  MessageSquare,
  MessageCircle,
  Globe,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Building2,
  ChevronRight,
  LifeBuoy,
  Crown,
  Loader2
} from 'lucide-react'

interface BusinessInfo {
  name: string
  slug: string
  logo?: string | null
}

let cachedOwnerBusiness: BusinessInfo | null = null

export default function OwnerSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [business, setBusiness] = useState<BusinessInfo | null>(cachedOwnerBusiness)

  const navScrollRef = useRef<HTMLDivElement>(null)

  // Guardar posición de scroll al desplazarse y al hacer clic en enlaces
  const handleScroll = () => {
    if (navScrollRef.current) {
      const top = navScrollRef.current.scrollTop
      globalOwnerSidebarScroll = top
      try {
        sessionStorage.setItem('owner_sidebar_scroll', String(top))
      } catch { }
    }
  }

  // Control de apertura por eventos externos (TopBar, BottomNav) y bloqueo de scroll
  useEffect(() => {
    const handleOpen = () => setMobileOpen(true)
    const handleToggle = () => setMobileOpen(prev => !prev)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('open-owner-sidebar', handleOpen)
    window.addEventListener('toggle-owner-sidebar', handleToggle)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('open-owner-sidebar', handleOpen)
      window.removeEventListener('toggle-owner-sidebar', handleToggle)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Bloqueo de scroll de fondo en móviles cuando el drawer está abierto
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

  // Restaurar la posición de scroll exacta al montar o cambiar de sección
  useEffect(() => {
    let saved = globalOwnerSidebarScroll
    try {
      const fromSession = sessionStorage.getItem('owner_sidebar_scroll')
      if (fromSession !== null) {
        saved = Number(fromSession)
      }
    } catch { }

    const applyScroll = () => {
      if (navScrollRef.current) {
        if (saved > 0) {
          navScrollRef.current.scrollTop = saved
        }
      }
    }

    applyScroll()
    const frameId = requestAnimationFrame(applyScroll)
    const t1 = setTimeout(applyScroll, 40)
    const t2 = setTimeout(applyScroll, 120)

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pathname])

  useEffect(() => {
    async function fetchBusinessInfo() {
      try {
        // 1. Obtener negocio específico del usuario logueado
        const res = await fetch('/api/owner/business')
        if (res.ok) {
          const data = await res.json()
          if (data && data.name) {
            const info = { name: data.name, slug: data.slug, logo: data.logo }
            cachedOwnerBusiness = info
            setBusiness(info)
            return
          }
        }

        // 2. Fallback con la sesión de auth actual
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const meData = await meRes.json()
          if (meData?.user?.business?.name) {
            const info = {
              name: meData.user.business.name,
              slug: meData.user.business.slug,
              logo: meData.user.business.logo
            }
            cachedOwnerBusiness = info
            setBusiness(info)
            return
          }
        }
      } catch {
        // Fallback default
      }
    }
    fetchBusinessInfo()

    const handleUpdate = () => fetchBusinessInfo()
    window.addEventListener('business-updated', handleUpdate)
    return () => window.removeEventListener('business-updated', handleUpdate)
  }, [])

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
      // Ignore network errors and continue to redirect
    } finally {
      window.location.replace('/login')
    }
  }

  const navGroups: { title: string; items: { label: string; href: string; icon: React.ElementType; external?: boolean }[] }[] = [
    {
      title: 'GENERAL',
      items: [
        { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Agenda', href: '/calendar', icon: Calendar },
        { label: 'Citas', href: '/appointments', icon: Clock },
        { label: 'Clientes', href: '/clients', icon: Users },
      ]
    },
    {
      title: 'GESTIÓN',
      items: [
        { label: 'Barberos', href: '/barbers', icon: UserCheck },
        { label: 'Servicios', href: '/services', icon: Scissors },
        { label: 'Finanzas', href: '/finances', icon: DollarSign },
        { label: 'Reportes', href: '/reports', icon: TrendingUp },
        { label: 'Sedes', href: '/branches', icon: Building2 },
      ]
    },
    {
      title: 'COMUNICACIÓN',
      items: [
        { label: 'Chat Interno', href: '/chat', icon: MessageSquare },
        { label: 'Notas', href: '/notes', icon: FileText },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { label: 'Página Web', href: '/webpage', icon: Globe },
        { label: 'Conexión WhatsApp', href: '/integrations', icon: MessageCircle },
        { label: 'Configuración', href: '/settings', icon: Settings },
        { label: 'Membresía & Plan', href: '/subscription', icon: Crown },
        { label: 'Soporte BarberOS', href: '/support', icon: LifeBuoy },
      ]
    }
  ]

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-[#09090b] border-r border-zinc-100 dark:border-zinc-800/80 selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── BRAND HEADER ── */}
      <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-[#151518] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
            {business?.logo ? (
              <Image
                src={business.logo}
                alt={business.name}
                fill
                sizes="36px"
                className="object-cover"
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
                <span className="truncate">{business?.name || 'Mi Barbería'}</span>
              </span>
            </div>
          </div>
        </Link>

        {mobileOpen && (
          <button
            onClick={() => { handleScroll(); setMobileOpen(false); }}
            className="md:hidden text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── NAVIGATION ── */}
      <div ref={navScrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              <span>{group.title}</span>
              <span className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800/70" />
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    target={item.external ? '_blank' : undefined}
                    onClick={() => {
                      handleScroll()
                      setMobileOpen(false)
                    }}
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
                    {active ? (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0 transition-all"
                        style={{
                          backgroundColor: 'var(--accent, #F59E0B)',
                          boxShadow: '0 0 8px var(--accent-op60, rgba(245, 158, 11, 0.6))',
                        }}
                      />
                    ) : item.external ? (
                      <ChevronRight className="ml-auto w-3.5 h-3.5 text-zinc-400 opacity-60 group-hover:text-white group-hover:opacity-100 transition-opacity" />
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER / PROFILE ── */}
      <div className="shrink-0 p-3 pb-6 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Profile Card */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-all duration-200 shadow-xs border"
          style={{
            backgroundColor: 'var(--accent-op15, rgba(245, 158, 11, 0.15))',
            borderColor: 'var(--accent-op30, rgba(245, 158, 11, 0.30))',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative bg-zinc-950 dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800"
          >
            {business?.logo ? (
              <Image
                src={business.logo}
                alt={business.name}
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <Image
                src="/logo.png"
                alt="BarberOS"
                fill
                sizes="28px"
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-zinc-900 dark:text-white truncate">
              {business?.name || 'Mi Barbería'}
            </div>
            <div
              className="text-[10px] font-bold truncate"
              style={{ color: 'var(--accent, #F59E0B)' }}
            >
              Panel Propietario
            </div>
          </div>
          <div
            className="w-2 h-2 rounded-full shrink-0 transition-all"
            style={{
              backgroundColor: 'var(--accent, #F59E0B)',
              boxShadow: '0 0 8px var(--accent-op60, rgba(245, 158, 11, 0.6))',
            }}
            title="Activo"
          />
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="group flex items-center w-full gap-2.5 px-3 py-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-white dark:hover:text-white hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800 transition-all rounded-xl cursor-pointer disabled:opacity-50 touch-manipulation"
        >
          {loggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          )}
          <span>{loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
        </button>
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
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col bg-white dark:bg-[#09090b] animate-in slide-in-from-left duration-250 pt-safe pb-safe">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
