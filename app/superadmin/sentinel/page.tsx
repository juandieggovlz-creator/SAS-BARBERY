'use client'

import React, { useState, useEffect } from 'react'
import {
  Bot,
  ShieldCheck,
  Send,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Activity,
  ArrowUpRight,
  Database,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'

interface SentinelData {
  bot: {
    name: string
    username: string
    chatIdAuthorized: string
    webhookUrl: string
    tokenConfigured: boolean
    secretConfigured: boolean
  }
  webhook: {
    url?: string
    pending_update_count?: number
    last_error_message?: string
    last_error_date?: number
    error?: string
  }
  outbox: {
    pendingCount: number
    items: any[]
  }
  recentLogs: Array<{
    id: string
    action: string
    details: any
    createdAt: string
    ipAddress: string | null
  }>
}

export default function SentinelSuperAdminPage() {
  const [data, setData] = useState<SentinelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchSentinelData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/sentinel')
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        toast.error(json.error || 'Error al cargar datos de BarberOS Sentinel')
      }
    } catch {
      toast.error('Error de red al consultar estado de Sentinel')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSentinelData()
  }, [])

  const handleSendTestMessage = async () => {
    try {
      setActionLoading('test')
      const res = await fetch('/api/superadmin/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_notification' })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || 'Notificación enviada a Telegram')
        fetchSentinelData()
      } else {
        toast.error(json.error || 'Fallo al enviar notificación a Telegram')
      }
    } catch {
      toast.error('Error de red al enviar prueba')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRetryOutbox = async () => {
    try {
      setActionLoading('retry')
      const res = await fetch('/api/superadmin/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_outbox' })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message)
        fetchSentinelData()
      } else {
        toast.error(json.error || 'Error al reintentar cola')
      }
    } catch {
      toast.error('Error de red al reintentar notificaciones')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                BarberOS Sentinel
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  Telegram Bot Oficial
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Monitoreo continuo, despacho prioritario de incidencias y administración ejecutiva remota.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://t.me/BarberOSSentinelBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 transition-all"
          >
            <span>@BarberOSSentinelBot</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={fetchSentinelData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all"
            title="Refrescar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Estado del Bot</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>En Línea</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Token API validado y activo
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Chat ID Autorizado</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {data?.bot.chatIdAuthorized || '5734885656'}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Acceso administrativo restringido
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Modo de Conexión</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {data?.webhook?.url ? 'Webhook Activo' : 'Webhook Preparado'}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Pendientes Telegram: {data?.webhook?.pending_update_count ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Cola Outbox (Fallidos)</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {data?.outbox.pendingCount ?? 0} pendientes
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Persistencia transactional en Neon
          </p>
        </div>
      </div>

      {/* ── ACTION CONTROLS ── */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Pruebas y Diagnóstico Operativo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTestMessage}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{actionLoading === 'test' ? 'Enviando...' : 'Enviar Alerta de Prueba'}</span>
          </button>

          {data && data.outbox.pendingCount > 0 && (
            <button
              onClick={handleRetryOutbox}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'retry' ? 'animate-spin' : ''}`} />
              <span>Reintentar Cola</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TWO COLUMN GRID: WEBHOOK CONFIG + COMMANDS GUIDE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhook Status */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-500" />
            Configuración del Webhook
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">Endpoint Webhook:</span>
              <code className="font-mono text-[11px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-800 dark:text-zinc-200">
                /api/telegram/webhook
              </code>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">URL Destino Vercel:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 truncate max-w-[260px]">
                {data?.bot.webhookUrl}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">Secret Token Header:</span>
              <span className="font-semibold text-emerald-500">
                {data?.bot.secretConfigured ? '✅ Configurado y Activo' : '⚠️ Falta configurar'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">Último error en Telegram:</span>
              <span className="text-slate-600 dark:text-zinc-400">
                {data?.webhook?.last_error_message || 'Ninguno reportado'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              💡 Comando de terminal para registrar o renovar webhook oficial:
            </p>
            <code className="block mt-1 p-2 rounded bg-slate-100 dark:bg-zinc-950 font-mono text-[11px] text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-zinc-800">
              npm run telegram:set-webhook
            </code>
          </div>
        </div>

        {/* Available Commands */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-500" />
            Comandos Ejecutables en @BarberOSSentinelBot
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
              <code className="font-mono font-bold text-amber-500">/panel</code>
              <span className="text-slate-600 dark:text-zinc-300">Abre el panel interactivo con teclado inline</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
              <code className="font-mono font-bold text-amber-500">/status</code>
              <span className="text-slate-600 dark:text-zinc-300">Latencia DB Neon, uptime y métricas en vivo</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
              <code className="font-mono font-bold text-amber-500">/businesses</code>
              <span className="text-slate-600 dark:text-zinc-300">Últimos negocios registrados, estados y sedes</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
              <code className="font-mono font-bold text-amber-500">/subscriptions</code>
              <span className="text-slate-600 dark:text-zinc-300">Estado de planes SaaS y desglose de clientes</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
              <code className="font-mono font-bold text-amber-500">/support</code>
              <span className="text-slate-600 dark:text-zinc-300">Tickets abiertos con botones para atender y resolver</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
              <code className="font-mono font-bold text-amber-500">/incidents</code>
              <span className="text-slate-600 dark:text-zinc-300">Alertas de seguridad y fallas críticas del sistema</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT AUDIT LOGS TABLE ── */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            Historial de Notificaciones y Eventos Sentinel
          </span>
          <span className="text-xs text-slate-400 font-normal">
            Registros inmutables en AuditLog
          </span>
        </h2>

        {data && data.recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Acción</th>
                  <th className="py-2 px-3">Detalle del Evento</th>
                  <th className="py-2 px-3">IP Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono">
                {data.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2 px-3 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-zinc-300 font-sans">
                      {log.details?.title ? (
                        <span>
                          <b>{log.details.title}</b> — {log.details.description || (log.details.success ? 'Entregado' : 'Pendiente')}
                        </span>
                      ) : (
                        JSON.stringify(log.details)
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {log.ipAddress || 'Interno'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No se registran eventos recientes de Sentinel en la bitácora.
          </div>
        )}
      </div>
    </div>
  )
}

