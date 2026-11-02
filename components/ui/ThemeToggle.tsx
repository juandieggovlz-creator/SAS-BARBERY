'use client'

import React from 'react'
import { useTheme } from '@/lib/theme'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  /** Visual variant to match the context where it's placed */
  variant?: 'navbar' | 'topbar' | 'sidebar' | 'settings'
  className?: string
}

export default function ThemeToggle({ variant = 'topbar', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (variant === 'navbar') {
    // Minimalist icon-only button for landing navbar with ☀️ / 🌙
    return (
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro ☀️' : 'Modo oscuro 🌙'}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 select-none cursor-pointer text-base hover:scale-105 active:scale-95 border ${
          isDark
            ? 'bg-zinc-800 border-zinc-700 text-amber-300 hover:bg-zinc-700 shadow-xs'
            : 'bg-zinc-100 border-zinc-200/80 text-zinc-700 hover:bg-zinc-200/80'
        } ${className}`}
      >
        <span role="img" aria-label={isDark ? 'Sol' : 'Luna'}>
          {isDark ? '☀️' : '🌙'}
        </span>
      </button>
    )
  }

  if (variant === 'settings') {
    // Full card variant for settings page
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <button
          onClick={() => { if (theme !== 'light') toggleTheme() }}
          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
            !isDark
              ? 'border-zinc-950 bg-zinc-50 dark:bg-zinc-900'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
            <Sun className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-xs font-black text-zinc-950 dark:text-white">Modo Claro</span>
          {!isDark && (
            <span className="text-[10px] text-emerald-600 font-bold">● Activo</span>
          )}
        </button>
        <button
          onClick={() => { if (theme !== 'dark') toggleTheme() }}
          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
            isDark
              ? 'border-amber-500 bg-zinc-800/60'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-sm">
            <Moon className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-xs font-black text-zinc-950 dark:text-white">Modo Oscuro</span>
          {isDark && (
            <span className="text-[10px] text-amber-500 font-bold">● Activo</span>
          )}
        </button>
      </div>
    )
  }

  // Default: icon-only button for topbars and sidebars
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 border
        ${isDark
          ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700'
          : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
        } ${className}`}
    >
      {isDark
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />
      }
    </button>
  )
}
