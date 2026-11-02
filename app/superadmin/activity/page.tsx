'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity,
  Calendar,
  Building2,
  DollarSign,
  UserPlus,
  RefreshCw,
  Loader2,
  Filter,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ActivityItem {
  id: string
  type: 'APPOINTMENT' | 'BUSINESS' | 'PAYMENT' | 'CLIENT'
  title: string
  description: string
  businessName: string
  businessId: string
  businessSlug?: string
  amount?: number | null
  createdAt: string
}

export default function SuperAdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      params.set('limit', '50')

      const res = await fetch(`/api/superadmin/activity?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setActivities(json.activities || [])
      } else {
        toast.error('Error al cargar la actividad')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [typeFilter])

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <Activity className="w-3 h-3" />
              Monitoreo en Tiempo Real
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Actividad Global de la Plataforma
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Flujo en vivo de citas reservadas, cobros registrados, nuevos clientes y barberías en todo el SaaS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivities}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar Flujo</span>
          </button>
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'ALL', label: 'Todos los Eventos' },
          { id: 'APPOINTMENT', label: '📅 Citas Agendadas' },
          { id: 'BUSINESS', label: '🏢 Nuevas Barberías' },
          { id: 'PAYMENT', label: '💰 Pagos y Cobros' },
          { id: 'CLIENT', label: '👤 Clientes Registrados' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              typeFilter === tab.id
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TIMELINE STREAM ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
            <span className="text-xs font-semibold text-zinc-400">Sincronizando flujo de actividad...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <Activity className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-bold text-zinc-700">No hay actividad reciente</p>
            <p className="text-xs">Los eventos aparecerán automáticamente a medida que ocurran en las barberías.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {activities.map((item) => {
              const isApt = item.type === 'APPOINTMENT'
              const isBiz = item.type === 'BUSINESS'
              const isPay = item.type === 'PAYMENT'
              const isCli = item.type === 'CLIENT'

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-zinc-50/60 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isApt
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : isBiz
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : isPay
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-purple-50 text-purple-600 border-purple-100'
                      }`}
                    >
                      {isApt && <Calendar className="w-5 h-5" />}
                      {isBiz && <Building2 className="w-5 h-5" />}
                      {isPay && <DollarSign className="w-5 h-5" />}
                      {isCli && <UserPlus className="w-5 h-5" />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-950">
                          {item.title}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <Link
                          href={`/superadmin/businesses/${item.businessId}`}
                          className="text-xs font-semibold text-zinc-600 hover:text-amber-600 transition-colors flex items-center gap-1 truncate"
                        >
                          <Building2 className="w-3 h-3 text-zinc-400" />
                          <span>{item.businessName}</span>
                        </Link>
                      </div>

                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.description}
                      </p>

                      <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount if present */}
                  {item.amount !== null && item.amount !== undefined && (
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-zinc-950 font-mono">
                        {formatCOP(item.amount)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
