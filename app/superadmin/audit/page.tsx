'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Clock,
  User,
  Building2,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AuditItem {
  id: string
  action: string
  entity: string
  entityId?: string | null
  userName: string
  userRole: string
  businessName?: string | null
  businessId?: string | null
  ipAddress: string
  createdAt: string
}

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (actionFilter !== 'ALL') params.set('action', actionFilter)

      const res = await fetch(`/api/superadmin/audit?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setLogs(json.logs || [])
      } else {
        toast.error('Error al cargar la bitácora de auditoría')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [search, actionFilter])

  // Helper to format action names into human-readable Spanish text
  const formatActionName = (action: string) => {
    switch (action) {
      case 'BUSINESS_CREATED': return 'Negocio Creado'
      case 'BUSINESS_SUSPENDED': return 'Negocio Suspendido'
      case 'BUSINESS_ACTIVATED': return 'Negocio Reactivado'
      case 'PLAN_CREATED': return 'Plan Creado'
      case 'PLAN_UPDATED': return 'Plan Actualizado'
      case 'USER_CREATED': return 'Usuario Creado'
      case 'USER_SUSPENDED':
      case 'USER_UPDATED': return 'Usuario Modificado / Suspendido'
      case 'IMPERSONATE_LOGIN': return 'Ingreso como Propietario (Soporte)'
      case 'SUBSCRIPTION_RENEWED': return 'Cambio / Renovación de Suscripción'
      case 'PLATFORM_SETTINGS_UPDATED': return 'Configuración Modificada'
      default: return action.replace(/_/g, ' ')
    }
  }

  return (
    <div className="space-y-6 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <ShieldCheck className="w-3 h-3" />
              Trazabilidad Administrativa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Módulo de Auditoría
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Registro claro de eventos administrativos críticos: creación de negocios, suspensiones, cambios de planes y accesos en modo soporte.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refrescar</span>
        </button>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuario, acción o negocio afectado..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 transition-all"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
        >
          <option value="ALL">Todos los Eventos Administrativos</option>
          <option value="IMPERSONATE_LOGIN">Ingreso como Propietario</option>
          <option value="BUSINESS_SUSPENDED">Negocio Suspendido</option>
          <option value="BUSINESS_ACTIVATED">Negocio Reactivado</option>
          <option value="BUSINESS_CREATED">Negocio Creado</option>
          <option value="PLAN_UPDATED">Plan Actualizado</option>
          <option value="SUBSCRIPTION_RENEWED">Cambio de Suscripción</option>
          <option value="USER_UPDATED">Usuario Modificado</option>
          <option value="PLATFORM_SETTINGS_UPDATED">Configuración Modificada</option>
        </select>
      </div>

      {/* ── AUDIT TABLE ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
            <span className="text-xs font-semibold text-zinc-400">Consultando registros administrativos...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <ShieldCheck className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm font-bold text-zinc-700">No hay eventos registrados</p>
            <p className="text-xs">Los registros administrativos aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-4">Hora</th>
                  <th className="py-4 px-5">Usuario</th>
                  <th className="py-4 px-6">Acción</th>
                  <th className="py-4 px-6">Entidad Afectada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {logs.map(log => {
                  const dateObj = new Date(log.createdAt)
                  const fecha = dateObj.toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                  const hora = dateObj.toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Fecha */}
                      <td className="py-4 px-6 font-semibold text-zinc-900 whitespace-nowrap">
                        {fecha}
                      </td>

                      {/* Hora */}
                      <td className="py-4 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {hora}
                      </td>

                      {/* Usuario */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold">
                            👑
                          </div>
                          <div>
                            <div className="font-bold text-zinc-950 truncate max-w-[170px]">
                              {log.userName}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              IP: {log.ipAddress}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Acción */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          log.action === 'IMPERSONATE_LOGIN'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : log.action.includes('SUSPENDED')
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : log.action.includes('ACTIVATED') || log.action.includes('CREATED')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                        }`}>
                          {formatActionName(log.action)}
                        </span>
                      </td>

                      {/* Entidad Afectada */}
                      <td className="py-4 px-6">
                        {log.businessName ? (
                          <Link
                            href={log.businessId ? `/superadmin/businesses/${log.businessId}` : '#'}
                            className="font-semibold text-zinc-900 hover:text-amber-600 transition-colors flex items-center gap-1.5"
                          >
                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{log.businessName}</span>
                          </Link>
                        ) : (
                          <span className="font-medium text-zinc-600">
                            {log.entity} (Configuración Global)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
