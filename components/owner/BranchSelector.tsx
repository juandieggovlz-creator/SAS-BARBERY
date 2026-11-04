'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Building2, ChevronDown, Store, Check, Loader2 } from 'lucide-react'

export interface BranchOption {
  id: string
  name: string
  slug: string
  isMainBranch: boolean
  status: string
}

interface Props {
  /** Muestra u oculta el selector según si el usuario tiene multisedes */
  visible: boolean
}

const ALL_BRANCHES_ID = '__all__'

export function getActiveBranchId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem('active_branch_id') || null
  } catch {
    return null
  }
}

export function setActiveBranchId(id: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (!id || id === ALL_BRANCHES_ID) {
      sessionStorage.removeItem('active_branch_id')
    } else {
      sessionStorage.setItem('active_branch_id', id)
    }
    // Disparar evento para que el resto del layout reaccione
    window.dispatchEvent(new CustomEvent('branch-changed', { detail: { branchId: id } }))
  } catch {
    // ignore
  }
}

export default function BranchSelector({ visible }: Props) {
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [loading, setLoading] = useState(false)
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar desde sessionStorage al montar
  useEffect(() => {
    setActiveBranchIdState(getActiveBranchId())
  }, [])

  // Cargar lista de sedes cuando el dropdown se abre
  const fetchBranches = useCallback(async () => {
    if (branches.length > 0) return // ya cargadas
    try {
      setLoading(true)
      const res = await fetch('/api/owner/branches')
      if (res.ok) {
        const data = await res.json()
        setBranches(data.branches || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [branches.length])

  useEffect(() => {
    if (open) fetchBranches()
  }, [open, fetchBranches])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!visible) return null

  const activeBranch = branches.find(b => b.id === activeBranchId) || null

  const handleSelect = (branchId: string | null) => {
    setActiveBranchIdState(branchId)
    setActiveBranchId(branchId)
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all"
        title="Cambiar sede activa"
      >
        {activeBranch ? (
          <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        )}
        <span className="hidden md:inline max-w-[140px] truncate">
          {activeBranch ? activeBranch.name : 'Todas las sedes'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-scaleUp origin-top-right">
          {/* Opción: Todas las sedes */}
          <button
            onClick={() => handleSelect(null)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors border-b border-zinc-100 dark:border-zinc-800"
          >
            <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="flex-1 text-left">
              <span className="text-xs font-bold text-zinc-900 dark:text-white block">Todas las sedes</span>
              <span className="text-[10px] text-zinc-400">Vista consolidada corporativa</span>
            </div>
            {!activeBranchId && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
          </button>

          {/* Lista de sedes */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => handleSelect(branch.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors ${
                    activeBranchId === branch.id ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                  }`}
                >
                  <Store className={`w-4 h-4 shrink-0 ${branch.status === 'ACTIVE' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block truncate">{branch.name}</span>
                    <div className="flex items-center gap-1.5">
                      {branch.isMainBranch && (
                        <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">Principal</span>
                      )}
                      <span className="text-[10px] text-zinc-400 font-mono truncate">/{branch.slug}</span>
                    </div>
                  </div>
                  {activeBranchId === branch.id && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </button>
              ))}
              {branches.length === 0 && (
                <div className="px-4 py-4 text-center text-xs text-zinc-400">
                  No hay sedes disponibles
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
