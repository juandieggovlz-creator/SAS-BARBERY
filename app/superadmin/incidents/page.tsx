'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Server,
  Zap,
  Building2,
  FileText,
  X,
  MessageSquare,
  ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'

interface IncidentRecord {
  id: string
  title: string
  service: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  description: string
  resolutionNotes?: string | null
  affectedBusinessesCount: number
  createdAt: string
  resolvedAt?: string | null
}

interface SummaryData {
  total: number
  criticalCount: number
  investigatingCount: number
  openCount: number
  resolvedCount: number
}

export default function SuperAdminIncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newService, setNewService] = useState('Base de Datos Neon')
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH')
  const [newDescription, setNewDescription] = useState('')
  const [newAffectedCount, setNewAffectedCount] = useState('0')
  const [creating, setCreating] = useState(false)

  // Resolve Modal
  const [resolvingIncident, setResolvingIncident] = useState<IncidentRecord | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (severityFilter !== 'ALL') params.set('severity', severityFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/superadmin/incidents?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setIncidents(data.incidents || [])
        setSummary(data.summary || null)
      } else {
        toast.error('Error al cargar centro de incidencias')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [severityFilter, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchIncidents, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/superadmin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          service: newService,
          severity: newSeverity,
          description: newDescription,
          affectedBusinessesCount: Number(newAffectedCount) || 0
        })
      })

      if (res.ok) {
        toast.success('Incidencia registrada con éxito')
        setCreateModalOpen(false)
        setNewTitle('')
        setNewDescription('')
        fetchIncidents()
      } else {
        toast.error('Error al registrar la incidencia')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (incidentId: string, status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED', notes?: string) => {
    try {
      const res = await fetch('/api/superadmin/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          status,
          resolutionNotes: notes
        })
      })

      if (res.ok) {
        toast.success(status === 'RESOLVED' ? 'Incidencia resuelta y archivada' : 'Estado de incidencia actualizado')
        setResolvingIncident(null)
        setResolveNotes('')
        fetchIncidents()
      } else {
        toast.error('Error al actualizar incidencia')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3 h-3" />
              SRE & Continuidad Operativa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white" style={{ letterSpacing: '-0.03em' }}>
            Centro de Incidencias & Monitoreo de Errores
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Supervisa cortes, degradación de servicios, fallos en webhooks de Meta y afectación de clientes en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchIncidents}
            className="p-2.5 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Incidencia</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI CARDS (ALTO CONTRASTE, NO PALE COLORS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Críticos */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-bold">
              Crítico
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {summary?.criticalCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            Incidentes Críticos Activos
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Requieren atención y despliegue urgente
          </p>
        </div>

        {/* En Investigación */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold">
              En Análisis
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-950 dark:text-white">
            {summary?.investigatingCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            En Diagnóstico
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Equipo técnico investigando causa raíz
          </p>
        </div>

        {/* Abiertos */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/40 font-bold">
              Pendientes
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-950 dark:text-white">
            {summary?.openCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            Incidentes Abiertos
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Detectados por monitor o reporte de usuario
          </p>
        </div>

        {/* Resueltos */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 font-bold">
              Histórico
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {summary?.resolvedCount ?? 0}
          </div>
          <div className="text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400 mt-1">
            Incidentes Resueltos
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Normalizados con notas de solución
          </p>
        </div>
      </div>

      {/* ── FILTERS & SEARCH TOOLBAR ── */}
      <div className="p-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, servicio afectado o descripción técnica..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-rose-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
          >
            <option value="ALL">Todas las Severidades</option>
            <option value="CRITICAL">🔴 Crítica</option>
            <option value="HIGH">🟠 Alta</option>
            <option value="MEDIUM">🟡 Media</option>
            <option value="LOW">🔵 Baja</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="OPEN">Abierto</option>
            <option value="INVESTIGATING">En Investigación</option>
            <option value="RESOLVED">Resuelto</option>
          </select>
        </div>
      </div>

      {/* ── INCIDENTS LIST ── */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
            <span className="text-xs font-bold text-zinc-400">Consultando bitácora de incidencias...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">¡Cero incidentes en este filtro!</p>
            <p className="text-xs">Todos los servicios operan bajo estándares óptimos.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {incidents.map(inc => {
              const severityBadge =
                inc.severity === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 font-black'
                  : inc.severity === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 font-bold'
                  : inc.severity === 'MEDIUM'
                  ? 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/40 font-bold'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 font-bold'

              const statusBadge =
                inc.status === 'RESOLVED'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                  : inc.status === 'INVESTIGATING'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'

              return (
                <div
                  key={inc.id}
                  className="p-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] uppercase px-2.5 py-1 rounded-md border ${severityBadge}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-[10px] uppercase px-2.5 py-1 rounded-md border font-bold ${statusBadge}`}>
                        {inc.status}
                      </span>
                      <h3 className="font-black text-base text-zinc-950 dark:text-white">
                        {inc.title}
                      </h3>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                      {inc.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap pt-1 font-mono">
                      <span>
                        <strong className="text-zinc-800 dark:text-zinc-200">Servicio:</strong> {inc.service}
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-zinc-800 dark:text-zinc-200">Afectación:</strong> {inc.affectedBusinessesCount} barbería(s)
                      </span>
                      <span>•</span>
                      <span>
                        Registrado el {new Date(inc.createdAt).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {inc.resolvedAt && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            Resuelto el {new Date(inc.resolvedAt).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>

                    {inc.resolutionNotes && (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 font-medium mt-2">
                        <strong className="text-emerald-600 dark:text-emerald-400">Nota de Solución:</strong> {inc.resolutionNotes}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    {inc.status !== 'RESOLVED' && (
                      <>
                        {inc.status === 'OPEN' && (
                          <button
                            onClick={() => handleUpdateStatus(inc.id, 'INVESTIGATING')}
                            className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Marcar En Investigación
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setResolvingIncident(inc)
                            setResolveNotes('')
                          }}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Resolver Incidencia
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── MODAL NUEVA INCIDENCIA ── */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-zinc-950 dark:text-white">
                  Registrar Incidencia Operativa
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Documenta cualquier corte o anomalía en infraestructura o APIs.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Título de la Incidencia *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: Caída temporal de Webhooks de WhatsApp"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                    Servicio Afectado
                  </label>
                  <select
                    value={newService}
                    onChange={e => setNewService(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
                  >
                    <option value="Base de Datos Neon">Neon PostgreSQL</option>
                    <option value="WhatsApp Cloud API">WhatsApp Cloud API</option>
                    <option value="API Next.js / Vercel">API Serverless</option>
                    <option value="Almacenamiento Cloudinary">Cloudinary Media</option>
                    <option value="Pasarela de Pagos">Pasarela de Pagos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                    Severidad
                  </label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
                  >
                    <option value="CRITICAL">🔴 Crítica (Corte Total)</option>
                    <option value="HIGH">🟠 Alta (Degradado)</option>
                    <option value="MEDIUM">🟡 Media (Parcial)</option>
                    <option value="LOW">🔵 Baja (Cosmético)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Barberías Afectadas Estimadas
                </label>
                <input
                  type="number"
                  value={newAffectedCount}
                  onChange={e => setNewAffectedCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Descripción Técnica y Alcance *
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Detalla el error, logs detectados o impacto en la operación..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>Registrar Incidencia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RESOLVER INCIDENCIA ── */}
      {resolvingIncident && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-zinc-950 dark:text-white">
                  Resolver Incidencia
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {resolvingIncident.title} • {resolvingIncident.service}
                </p>
              </div>
              <button
                onClick={() => setResolvingIncident(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                  Notas de Solución y Causa Raíz
                </label>
                <textarea
                  rows={4}
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Describe cómo se solucionó el problema para el registro histórico del equipo..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setResolvingIncident(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(resolvingIncident.id, 'RESOLVED', resolveNotes)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Resolver</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

