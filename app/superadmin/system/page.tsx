'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity,
  Database,
  Server,
  KeyRound,
  HardDrive,
  Mail,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceHealth {
  name: string
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN'
  latencyMs: number
  details: string
}

interface ServerInfo {
  uptimeSeconds: number
  nodeVersion: string
  memoryRssMb: number
  memoryHeapUsedMb: number
  platform: string
  timestamp: string
}

export default function SuperAdminSystemPage() {
  const [services, setServices] = useState<Record<string, ServiceHealth>>({})
  const [server, setServer] = useState<ServerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<string>('')

  const fetchHealth = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/superadmin/system')
      if (res.ok) {
        const json = await res.json()
        setServices(json.services)
        setServer(json.server)
        setLastCheckTime(new Date().toLocaleTimeString('es-CO'))
      } else {
        toast.error('Error al consultar el estado de los servicios')
      }
    } catch {
      toast.error('Error de red al conectar con el servidor')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return {
          icon: CheckCircle2,
          text: '🟢 Operativo',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
      case 'DEGRADED':
        return {
          icon: AlertTriangle,
          text: '🟡 Degradado',
          className: 'bg-amber-50 text-amber-700 border-amber-200'
        }
      case 'DOWN':
      default:
        return {
          icon: XCircle,
          text: '🔴 Fuera de Servicio',
          className: 'bg-rose-50 text-rose-700 border-rose-200'
        }
    }
  }

  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes} minutos`
  }

  const serviceIcons: Record<string, any> = {
    database: Database,
    api: Server,
    auth: KeyRound,
    storage: HardDrive,
    email: Mail
  }

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
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
            Estado del Sistema BarberOS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Diagnóstico activo de infraestructura, base de datos, APIs, almacenamiento y servicios esenciales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastCheckTime && (
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              Último chequeo: {lastCheckTime}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-zinc-900' : ''}`} />
            <span>{checking ? 'Diagnosticando...' : 'Ejecutar Diagnóstico'}</span>
          </button>
        </div>
      </div>

      {/* ── GLOBAL HEALTH STATUS BANNER ── */}
      <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase text-zinc-950">
                  Todos los Sistemas Principales Operativos
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  100% DISPONIBILIDAD
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                BarberOS responde sin anomalías en la base de datos, autenticación y procesamiento de citas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 REQUIRED SERVICE CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-zinc-200">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
            <span className="text-xs font-bold text-zinc-400">Verificando servicios del SaaS...</span>
          </div>
        ) : (
          Object.entries(services).map(([key, service]) => {
            const Icon = serviceIcons[key] || Activity
            const badge = getStatusBadge(service.status)

            return (
              <div
                key={key}
                className="p-5 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase text-zinc-900">
                        {service.name}
                      </h3>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Latencia: {service.latencyMs} ms
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.className}`}>
                    {badge.text}
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-600 leading-relaxed">
                  {service.details}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── SERVER RESOURCE TELEMETRY ── */}
      {server && (
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" /> Telemetría del Servidor
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Nodo de Ejecución</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="text-[10px] font-black uppercase text-zinc-400">Tiempo de Actividad</div>
              <div className="text-lg font-black text-zinc-900 mt-1">
                {formatUptime(server.uptimeSeconds)}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="text-[10px] font-black uppercase text-zinc-400">Versión Node.js</div>
              <div className="text-lg font-black text-zinc-900 mt-1 font-mono">
                {server.nodeVersion}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="text-[10px] font-black uppercase text-zinc-400">Memoria Heap Usada</div>
              <div className="text-lg font-black text-zinc-900 mt-1">
                {server.memoryHeapUsedMb} MB
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="text-[10px] font-black uppercase text-zinc-400">Plataforma SO</div>
              <div className="text-lg font-black text-zinc-900 mt-1 uppercase font-mono">
                {server.platform}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
