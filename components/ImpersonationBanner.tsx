'use client'

import React, { useEffect, useState } from 'react'
import { ShieldAlert, ArrowLeft, Loader2, Scissors, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImpersonationState {
  isImpersonated: boolean
  isSuperAdminSupport?: boolean
  isBarberPreview?: boolean
  superAdminId?: string | null
  originalOwnerId?: string | null
  businessId?: string | null
  businessName?: string | null
  role?: string | null
  barberName?: string | null
  reason?: string | null
  expiresAt?: string | null
}

export default function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState>({ isImpersonated: false })
  const [loadingSuperAdmin, setLoadingSuperAdmin] = useState(false)
  const [loadingOwner, setLoadingOwner] = useState(false)

  useEffect(() => {
    fetch('/api/superadmin/check-impersonation')
      .then(res => res.json())
      .then(data => {
        if (data?.isImpersonated) {
          setState(data)
        }
      })
      .catch(() => {})
  }, [])

  if (!state.isImpersonated) return null

  const handleExitToSuperAdmin = async () => {
    setLoadingSuperAdmin(true)
    try {
      const res = await fetch('/api/superadmin/switch-back', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Retornando al panel Super Admin')
        window.location.href = data.redirect || '/superadmin/businesses'
      } else {
        toast.error(data.error || 'Error al salir del modo de soporte')
        setLoadingSuperAdmin(false)
      }
    } catch {
      toast.error('Error de red al salir del modo soporte')
      setLoadingSuperAdmin(false)
    }
  }

  const handleExitToOwner = async () => {
    setLoadingOwner(true)
    try {
      const res = await fetch('/api/auth/switch-back-admin', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Retornando al panel de Propietario')
        window.location.href = data.redirect || '/barbers'
      } else {
        toast.error(data.error || 'Error al salir de la vista de barbero')
        setLoadingOwner(false)
      }
    } catch {
      toast.error('Error de red al regresar al panel de propietario')
      setLoadingOwner(false)
    }
  }

  const roleLabel =
    state.role === 'BARBER'
      ? `Panel de Barbero${state.barberName ? ` (${state.barberName})` : ''}`
      : state.role === 'BRANCH_ADMIN'
      ? 'Panel de Administración de Sede'
      : 'Panel del Propietario'

  const expiresFormatted = state.expiresAt
    ? new Date(state.expiresAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      data-testid="impersonation-banner"
      className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md sticky top-0 z-50"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <ShieldAlert className="w-4 h-4 shrink-0 text-zinc-950" />
        <span>
          <strong className="uppercase">
            {state.isSuperAdminSupport ? 'Modo Soporte Administrativo Activo:' : 'Modo Supervisión de Barbero:'}
          </strong>{' '}
          {state.businessName ? (
            <>
              Negocio <strong>{state.businessName}</strong> • Vista: <strong>{roleLabel}</strong>
            </>
          ) : (
            <>Vista activa: <strong>{roleLabel}</strong></>
          )}
          {expiresFormatted && (
            <span className="ml-1.5 text-[11px] font-semibold opacity-80">
              (Expira {expiresFormatted})
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {state.isBarberPreview && (
          <button
            onClick={handleExitToOwner}
            disabled={loadingOwner || loadingSuperAdmin}
            className="bg-zinc-900/85 hover:bg-zinc-900 text-white px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingOwner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>Volver a Propietario</span>
          </button>
        )}

        {state.isSuperAdminSupport && (
          <button
            onClick={handleExitToSuperAdmin}
            disabled={loadingSuperAdmin || loadingOwner}
            className="bg-zinc-950 hover:bg-zinc-800 text-white px-3.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingSuperAdmin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>Volver a Super Admin</span>
          </button>
        )}
      </div>
    </div>
  )
}
