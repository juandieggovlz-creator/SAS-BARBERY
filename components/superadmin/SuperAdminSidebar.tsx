'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Percent,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Crown
} from 'lucide-react'

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navGroups = [
    {
      title: 'PLATAFORMA',
      items: [
        { label: 'Centro de Control', href: '/superadmin/dashboard', icon: LayoutDashboard },
        { label: 'Barberías & Negocios', href: '/superadmin/businesses', icon: Building2 },
        { label: 'Usuarios Registrados', href: '/superadmin/users', icon: Users },
      ]
    },
    {
      title: 'NEGOCIO & PAGOS',
      items: [
        { label: 'Planes & Precios', href: '/superadmin/plans', icon: CreditCard },
        { label: 'Códigos Promocionales', href: '/superadmin/coupons', icon: Percent },
        { label: 'Auditoría & Logs', href: '/superadmin/audit', icon: FileText },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { label: 'Configuración Global', href: '/superadmin/settings', icon: Settings },
      ]
    }
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore
    }
    window.location.href = '/login'
  }

  const isActive = (href: string) =>
    href === '/superadmin/dashboard'
      ? pathname === href
      : pathname.startsWith(href)

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-[#09090b] border-r border-zinc-100 dark:border-zinc-800/80" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── BRAND HEADER ── */}
      <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 border border-zinc-200 dark:border-zinc-800">
            <Image
              src="/logo.png"
              alt="BarberOS Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                Barber<span className="text-amber-500">OS</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-amber-400/30 bg-amber-400/15 text-amber-500 dark:text-amber-400 transition-all duration-200 shadow-xs"
              >
                SUPER ADMIN
              </span>
            </div>
          </div>
        </div>

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
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group
                      ${active
                        ? 'bg-zinc-950 text-white dark:bg-amber-400/15 dark:text-amber-300 dark:border dark:border-amber-400/30 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-950 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-amber-400' : 'text-zinc-400 dark:text-zinc-400 group-hover:text-amber-400 dark:group-hover:text-amber-400'}`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER / PROFILE ── */}
      <div className="shrink-0 p-3 pb-8 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Profile card */}
        <div
          className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl border border-amber-400/30 bg-amber-400/15 transition-all duration-200 shadow-xs"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-950 dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 text-amber-500 dark:text-amber-400"
          >
            <Crown className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-zinc-900 dark:text-white truncate">Super Admin</div>
            <div
              className="text-[10px] font-semibold truncate text-amber-500 dark:text-amber-400"
            >
              BarberOS Central
            </div>
          </div>
          <div
            className="w-2 h-2 rounded-full shrink-0 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            title="En línea"
          />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-2.5 px-3 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all rounded-xl"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-xl bg-white border border-zinc-200 shadow-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
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
