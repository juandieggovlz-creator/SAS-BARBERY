'use client'

import React, { useState, useEffect } from 'react'
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
  ChevronRight,
  LifeBuoy,
  Crown
} from 'lucide-react'

interface BusinessInfo {
  name: string
  slug: string
  logo?: string | null
}

export default function OwnerSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [business, setBusiness] = useState<BusinessInfo | null>(null)

  useEffect(() => {
    async function fetchBusinessInfo() {
      try {
        // 1. Obtener negocio específico del usuario logueado
        const res = await fetch('/api/owner/business')
        if (res.ok) {
          const data = await res.json()
          if (data && data.name) {
            setBusiness({ name: data.name, slug: data.slug, logo: data.logo })
            return
          }
        }

        // 2. Fallback con la sesión de auth actual
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const meData = await meRes.json()
          if (meData?.user?.business?.name) {
            setBusiness({
              name: meData.user.business.name,
              slug: meData.user.business.slug,
              logo: meData.user.business.logo
            })
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore
    }
    window.location.href = '/login'
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
                className="object-contain p-1"
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                Barber<span className="text-amber-500">OS</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 truncate max-w-[150px] border border-amber-400/30 bg-amber-400/15 text-amber-500 dark:text-amber-400 transition-all duration-200 shadow-xs"
              >
                <Store className="w-2.5 h-2.5 shrink-0 text-amber-500 dark:text-amber-400" />
                <span className="truncate">{business?.name || 'Mi Barbería'}</span>
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

      {/* ── NAVIGATION ── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-400">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group
                      ${active
                        ? 'bg-zinc-950 text-white dark:bg-amber-400/15 dark:text-amber-300 dark:border dark:border-amber-400/30 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-950 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-amber-400' : 'text-zinc-400 dark:text-zinc-400 group-hover:text-amber-400 dark:group-hover:text-amber-400'}`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="truncate">{item.label}</span>
                    {active ? (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] shrink-0" />
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
          className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl border border-amber-400/30 bg-amber-400/15 transition-all duration-200 shadow-xs"
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
                className="object-contain p-0.5"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-zinc-900 dark:text-white truncate">
              {business?.name || 'Mi Barbería'}
            </div>
            <div
              className="text-[10px] font-bold truncate text-amber-500 dark:text-amber-400"
            >
              Panel Propietario
            </div>
          </div>
          <div
            className="w-2 h-2 rounded-full shrink-0 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            title="Activo"
          />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="group flex items-center w-full gap-2.5 px-3 py-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-white dark:hover:text-white hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800 transition-all rounded-xl"
        >
          <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </button>
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
    </>
  )
}
