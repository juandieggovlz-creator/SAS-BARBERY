'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  ShieldCheck,
  Building2,
  Users,
  ArrowRight,
  Zap,
  Bell,
  Loader2,
  X
} from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function SuperAdminTopBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    businesses: Array<{ id: string; name: string; slug: string; status: string; planName: string }>
    users: Array<{ id: string; email: string; role: string }>
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null)
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/superadmin/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data)
          setShowResults(true)
        }
      } catch {
        // Ignore search errors
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const statusColor: Record<string, string> = {
    ACTIVE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    TRIAL: 'text-amber-700 bg-amber-50 border-amber-200',
    SUSPENDED: 'text-rose-700 bg-rose-50 border-rose-200',
    CANCELLED: 'text-zinc-600 bg-zinc-100 border-zinc-200'
  }

  return (
    <header
      className="h-16 bg-white dark:bg-[#09090b] border-b border-zinc-100 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center gap-4 sticky top-0 z-20"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── LEFT: SEARCH ── */}
      <div ref={searchRef} className="relative flex-1 max-w-xl hidden sm:block">
        <div className="relative">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults) setShowResults(true) }}
            placeholder="Buscar barbería, propietario, correo..."
            className="w-full pl-10 pr-10 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs font-medium text-[var(--input-text)] placeholder:text-[var(--text-muted)] outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowResults(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Resultados Globales
              </span>
              <button
                onClick={() => setShowResults(false)}
                className="text-[10px] text-zinc-400 hover:text-zinc-700 font-semibold"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2 space-y-3">
              {/* Businesses */}
              <div>
                <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  Barberías ({searchResults.businesses.length})
                </div>
                {searchResults.businesses.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-zinc-400 italic">Sin coincidencias</p>
                ) : (
                  searchResults.businesses.map(b => (
                    <Link
                      key={b.id}
                      href={`/superadmin/businesses/${b.id}`}
                      onClick={() => setShowResults(false)}
                      className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-[9px] font-black text-zinc-700 shrink-0">
                          {b.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-zinc-900 truncate">{b.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${statusColor[b.status] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                          {b.status}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    </Link>
                  ))
                )}
              </div>

              {/* Users */}
              {searchResults.users.length > 0 && (
                <div className="border-t border-zinc-100 pt-2">
                  <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    Usuarios ({searchResults.users.length})
                  </div>
                  {searchResults.users.map(u => (
                    <Link
                      key={u.id}
                      href="/superadmin/users"
                      onClick={() => setShowResults(false)}
                      className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <Users className="w-3 h-3 text-zinc-500" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-800 truncate">{u.email}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 shrink-0 uppercase">
                          {u.role}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: BADGES ── */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Status pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">SaaS Operativo</span>
        </div>

        {/* Master badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 dark:bg-amber-500 rounded-xl shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 dark:text-zinc-950" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-white dark:text-zinc-950 uppercase tracking-wider hidden sm:inline">Modo Master</span>
        </div>
      </div>
    </header>
  )
}
