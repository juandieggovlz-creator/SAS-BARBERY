'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Clock, DollarSign, Menu } from 'lucide-react'

export default function BarberBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Inicio', href: '/barber/dashboard', icon: LayoutDashboard },
    { label: 'Mi Agenda', href: '/barber/calendar', icon: Calendar },
    { label: 'Horarios', href: '/barber/schedule', icon: Clock },
    { label: 'Comisiones', href: '/barber/commissions', icon: DollarSign },
  ]

  const handleOpenMenu = () => {
    window.dispatchEvent(new CustomEvent('open-barber-sidebar'))
  }

  return (
    <nav
      aria-label="Navegación móvil del barbero"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 px-2 py-1 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href !== '/barber/dashboard' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 relative touch-manipulation ${
                active
                  ? 'font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              style={{
                color: active ? 'var(--accent, #F59E0B)' : undefined,
              }}
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5 transition-transform"
                  style={{
                    color: active ? 'var(--accent, #F59E0B)' : undefined,
                  }}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {active && (
                  <span
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--accent, #F59E0B)',
                      boxShadow: '0 0 6px var(--accent-op60, rgba(245,158,11,0.6))',
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Botón de Menú Completo */}
        <button
          onClick={handleOpenMenu}
          type="button"
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer touch-manipulation"
          aria-label="Abrir menú completo de barbero"
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} />
          <span className="text-[10px] mt-0.5 tracking-tight">Menú</span>
        </button>
      </div>
    </nav>
  )
}
