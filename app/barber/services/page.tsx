'use client'

import React, { useState, useEffect } from 'react'
import { Scissors, Clock, DollarSign, Info, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface ServiceItem {
  id: string
  name: string
  category?: string | null
  duration: number
  price: number
  description?: string | null
}

export default function BarberServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setServices(data)
          }
        }
      } catch {
        toast.error('Error al cargar catálogo de servicios')
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cargando tus servicios...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white">
              Catálogo Profesional
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 mt-1">
            Catálogo de Servicios ({services.length})
          </h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Catálogo oficial de servicios ofrecidos por la barbería con su duración y precios de lista.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs font-semibold text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Configurado por la administración del negocio</span>
        </div>
      </div>

      {/* Grid de Servicios */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                    <Scissors className="w-5 h-5" />
                  </div>
                  {srv.category && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {srv.category}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black text-zinc-950 tracking-tight">{srv.name}</h3>
                  {srv.description && (
                    <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed line-clamp-2">
                      {srv.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{srv.duration} min</span>
                </div>
                <span className="text-base font-black text-zinc-900">
                  {formatCOP(Number(srv.price))}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 text-center space-y-3">
          <Scissors className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-800">No hay servicios registrados aún</h3>
          <p className="text-xs text-zinc-400">Pide al administrador del negocio que agregue los servicios del catálogo.</p>
        </div>
      )}
    </div>
  )
}
