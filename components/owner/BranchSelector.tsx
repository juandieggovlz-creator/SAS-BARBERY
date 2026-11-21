'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Building2, ChevronDown, Store, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
const COOKIE_NAME = 'active_branch_id'

export function getActiveBranchId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromSession = sessionStorage.getItem('active_branch_id')
    if (fromSession && fromSession !== ALL_BRANCHES_ID) return fromSession

    // Fallback: leer de document.cookie
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'))
    const val = match ? decodeURIComponent(match[2]) : null
    return val && val !== ALL_BRANCHES_ID ? val : null
  } catch {
    return null
  }
}

export function setActiveBranchId(id: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (!id || id === ALL_BRANCHES_ID) {
      sessionStorage.removeItem('active_branch_id')
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
    } else {
      sessionStorage.setItem('active_branch_id', id)
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=2592000; SameSite=Lax`
    }
    window.dispatchEvent(new CustomEvent('branch-changed', { detail: { branchId: id } }))
  } catch {
    // ignore
  }
}

export default function BranchSelector({ visible }: Props) {
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [loading, setLoading] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar sede activa al montar
  useEffect(() => {
    setActiveBranchIdState(getActiveBranchId())
  }, [])

  // Cargar lista de sedes cuando el dropdown se abre
  const fetchBranches = useCallback(async () => {
    if (branches.length > 0) return
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

  const handleSelect = async (branchId: string | null) => {
    // Determinar ID objetivo (si null, la sede principal)
    const targetId = branchId || branches.find(b => b.isMainBranch)?.id || branches[0]?.id
    if (!targetId) return

    try {
      setSwitchingId(targetId)
      const res = await fetch(`/api/owner/branches/${targetId}/switch`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActiveBranchIdState(targetId)
        setActiveBranchId(targetId)
        toast.success(`Cambiando a sede: ${data.branch?.name || 'Sede seleccionada'}`)
        setOpen(false)
        window.location.reload()
      } else {
        toast.error(data.error || 'Error al cambiar de sede')
      }
    } catch {
      toast.error('Error de red al cambiar de sede')
    } finally {
      setSwitchingId(null)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        disabled={switchingId !== null}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
        title="Cambiar sede activa"
      >
        {switchingId ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
        ) : activeBranch ? (
          <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        )}
        <span className="hidden md:inline max-w-[140px] truncate">
          {activeBranch ? activeBranch.name : 'Sede Activa'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-scaleUp origin-top-right">
          <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Cambiar Sede Activa
            </span>
          </div>

          {/* Lista de sedes */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {branches.map(branch => {
                const isSelected = activeBranchId === branch.id
                return (
                  <button
                    key={branch.id}
                    onClick={() => handleSelect(branch.id)}
                    disabled={switchingId !== null}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer ${
                      isSelected ? 'bg-amber-50/70 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <Store className={`w-4 h-4 shrink-0 ${branch.isMainBranch ? 'text-amber-500' : 'text-zinc-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {branch.name}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                            branch.isMainBranch
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {branch.isMainBranch ? 'Principal' : 'Vinculada'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono truncate block">
                        /{branch.slug}
                      </span>
                    </div>
                    {switchingId === branch.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                    ) : isSelected ? (
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : null}
                  </button>
                )
              })}
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
