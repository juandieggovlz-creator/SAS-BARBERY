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
  ChevronRight
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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
        { label: 'Centro de Incidencias', href: '/superadmin/incidents', icon: AlertOctagon },
        { label: 'Tickets de Soporte', href: '/superadmin/support', icon: LifeBuoy },
      ]
    },
    {
      title: 'PLATAFORMA & AUDITORÍA',
      items: [
        { label: 'Bitácora de Auditoría', href: '/superadmin/audit', icon: FileText },
        { label: 'Comunicados Globales', href: '/superadmin/announcements', icon: Bell },
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
            <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
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
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 group border
                      ${
                        active
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs'
                          : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="truncate">{item.label}</span>
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
              Super Administrador
            </div>
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">
              admin@barberos.co
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
            <ThemeToggle variant="navbar" />
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:inline">
              Tema
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all rounded-lg cursor-pointer"
            title="Cerrar sesión global"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#0c0c0e] border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-black text-sm text-zinc-950 dark:text-white tracking-tight">
            Barber<span className="text-amber-500">OS</span>
          </span>
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30">
            ADMIN
          </span>
        </div>
        <ThemeToggle variant="navbar" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed top-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
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
