'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  AlertOctagon,
  Moon,
  MessageCircle,
  ExternalLink,
  Phone,
  RefreshCw,
  Loader2,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SuperAdminCommercialPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'trials2' | 'trials5' | 'expired' | 'inactive'>('trials2')

  const fetchCommercial = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/commercial')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error('Error al cargar datos comerciales')
      }
    } catch {
      toast.error('Error de red al conectar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommercial()
  }, [])

  const getCleanPhone = (phone?: string) => {
    if (!phone) return ''
    const cleaned = phone.replace(/[^\d+]/g, '')
    if (!cleaned.startsWith('+') && !cleaned.startsWith('57') && cleaned.length === 10) {
      return `57${cleaned}`
    }
    return cleaned.replace('+', '')
  }

  const openWhatsApp = (phone: string, text: string) => {
    const clean = getCleanPhone(phone)
    if (!clean) {
      toast.error('Este negocio no tiene número de teléfono registrado')
      return
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <TrendingUp className="w-3 h-3" />
              Conversión & Retención
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950" style={{ letterSpacing: '-0.03em' }}>
            Centro de Seguimiento Comercial
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Detecta barberías listas para renovación, pruebas por expirar y cuentas en riesgo para actuar por WhatsApp.
          </p>
        </div>

        <button
          onClick={fetchCommercial}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar Oportunidades</span>
        </button>
      </div>

      {/* ── 4 KPI CARDS (THE 4 CRITICAL FUNNEL STATES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tab 1: Prueba termina en 2 días */}
        <button
          onClick={() => setActiveTab('trials2')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'trials2'
              ? 'bg-amber-500 text-zinc-950 border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-2xl ${activeTab === 'trials2' ? 'bg-zinc-950 text-white' : 'bg-amber-100 text-amber-800'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeTab === 'trials2' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-amber-100 text-amber-900'
            }`}>
              Urgente
            </span>
          </div>
          <div className="text-3xl font-black">
            {data?.summary?.trialsEnding2DaysCount ?? 0}
          </div>
          <div className={`text-xs font-bold uppercase tracking-tight mt-1 ${activeTab === 'trials2' ? 'text-zinc-950' : 'text-zinc-600'}`}>
            Prueba termina en 2 días
          </div>
          <p className={`text-[10px] mt-1 ${activeTab === 'trials2' ? 'text-zinc-900' : 'text-zinc-400'}`}>
            Listos para cerrar venta comercial hoy.
          </p>
        </button>

        {/* Tab 2: Prueba termina en 5 días */}
        <button
          onClick={() => setActiveTab('trials5')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'trials5'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-2xl ${activeTab === 'trials5' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-800'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeTab === 'trials5' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
            }`}>
              Seguimiento
            </span>
          </div>
          <div className="text-3xl font-black">
            {data?.summary?.trialsEnding5DaysCount ?? 0}
          </div>
          <div className={`text-xs font-bold uppercase tracking-tight mt-1 ${activeTab === 'trials5' ? 'text-white' : 'text-zinc-600'}`}>
            Prueba termina en 5 días
          </div>
          <p className={`text-[10px] mt-1 ${activeTab === 'trials5' ? 'text-blue-100' : 'text-zinc-400'}`}>
            Acompañamiento y agendamiento de demo.
          </p>
        </button>

        {/* Tab 3: Plan vencido */}
        <button
          onClick={() => setActiveTab('expired')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'expired'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/20'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-2xl ${activeTab === 'expired' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-800'}`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeTab === 'expired' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-900'
            }`}>
              Recuperar
            </span>
          </div>
          <div className="text-3xl font-black">
            {data?.summary?.plansExpiredCount ?? 0}
          </div>
          <div className={`text-xs font-bold uppercase tracking-tight mt-1 ${activeTab === 'expired' ? 'text-white' : 'text-zinc-600'}`}>
            Plan Vencido
          </div>
          <p className={`text-[10px] mt-1 ${activeTab === 'expired' ? 'text-rose-100' : 'text-zinc-400'}`}>
            Suscripción o período expirado.
          </p>
        </button>

        {/* Tab 4: Sin actividad hace 30 días */}
        <button
          onClick={() => setActiveTab('inactive')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'inactive'
              ? 'bg-zinc-900 text-white border-zinc-950 shadow-md shadow-zinc-950/20'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-2xl ${activeTab === 'inactive' ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-800'}`}>
              <Moon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeTab === 'inactive' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'
            }`}>
              Riesgo Churn
            </span>
          </div>
          <div className="text-3xl font-black">
            {data?.summary?.inactive30DaysCount ?? 0}
          </div>
          <div className={`text-xs font-bold uppercase tracking-tight mt-1 ${activeTab === 'inactive' ? 'text-white' : 'text-zinc-600'}`}>
            Sin actividad (+30 días)
          </div>
          <p className={`text-[10px] mt-1 ${activeTab === 'inactive' ? 'text-zinc-400' : 'text-zinc-400'}`}>
            No registran citas ni accesos recientes.
          </p>
        </button>
      </div>

      {/* ── LEADS ACTION LIST TABLE ── */}
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
            <span className="text-xs font-bold text-zinc-400">Analizando métricas de retención...</span>
          </div>
        ) : (
          <div>
            {/* Header info */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">
                  {activeTab === 'trials2' && '🔥 Pruebas que terminan en 2 días'}
                  {activeTab === 'trials5' && '⏳ Pruebas que terminan en 5 días'}
                  {activeTab === 'expired' && '🚨 Negocios con Plan Vencido / Suspendido'}
                  {activeTab === 'inactive' && '💤 Barberías sin actividad hace más de 30 días'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Haz clic en el botón de WhatsApp para iniciar la conversación directamente con el propietario.
                </p>
              </div>
            </div>

            {/* List */}
            {(() => {
              const currentList =
                activeTab === 'trials2'
                  ? data?.trialsEnding2Days || []
                  : activeTab === 'trials5'
                  ? data?.trialsEnding5Days || []
                  : activeTab === 'expired'
                  ? data?.plansExpired || []
                  : data?.inactive30Days || []

              if (currentList.length === 0) {
                return (
                  <div className="p-16 text-center text-zinc-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60" />
                    <p className="text-sm font-bold text-zinc-800">
                      ¡Excelente! No hay negocios en este estado crítico
                    </p>
                    <p className="text-xs">Todas las barberías están al día en este segmento.</p>
                  </div>
                )
              }

              return (
                <div className="divide-y divide-zinc-100">
                  {currentList.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-zinc-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link
                            href={`/superadmin/businesses/${item.id}`}
                            className="font-black text-base text-zinc-950 hover:text-amber-600 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <span className="text-[10px] font-mono text-zinc-400">
                            /{item.slug}
                          </span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                            {item.planName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
                          <span>
                            <strong>Propietario:</strong> {item.ownerEmail || 'Sin email'}
                          </span>
                          {item.phone && (
                            <span>
                              <strong>Teléfono:</strong> {item.phone}
                            </span>
                          )}
                          {item.daysRemaining !== undefined && (
                            <span className="text-amber-700 font-bold">
                              Restan: {item.daysRemaining} día(s)
                            </span>
                          )}
                          {item.daysExpired !== undefined && (
                            <span className="text-rose-700 font-bold">
                              Vencido hace {item.daysExpired} día(s)
                            </span>
                          )}
                          {item.daysSinceActivity !== undefined && (
                            <span className="text-zinc-700 font-bold">
                              Inactivo: {item.daysSinceActivity} días
                            </span>
                          )}
                        </div>

                        {/* Suggested WhatsApp message preview */}
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-700 font-medium italic mt-2">
                          "{item.suggestedMessage}"
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openWhatsApp(item.phone, item.suggestedMessage)}
                          disabled={!item.phone}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                          title="Contactar al propietario por WhatsApp con mensaje pre-cargado"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Contactar WhatsApp</span>
                        </button>

                        <Link
                          href={`/superadmin/businesses/${item.id}`}
                          className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-2xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Gestionar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
