'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Scale,
  Building2,
  RefreshCw,
  Search,
  Eye,
  Sliders,
  Check,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react'
import { LEGAL_DOCUMENTS, LegalDocMeta } from '@/lib/legal-documents'
import { LEGAL_CONFIG, getPendingLegalChecklist } from '@/lib/legal-config'

interface ConsentLog {
  id: string
  userName: string
  businessName: string | null
  action: string
  ipAddress: string
  createdAt: string
  details?: any
}

export default function SuperAdminLegalPage() {
  const [documents] = useState<LegalDocMeta[]>(LEGAL_DOCUMENTS)
  const [checklist] = useState(getPendingLegalChecklist())
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const fetchConsentLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch('/api/superadmin/audit?search=TERMS')
      if (res.ok) {
        const data = await res.json()
        setConsentLogs(data.logs || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchConsentLogs()
  }, [])

  const filteredDocs = selectedCategory === 'ALL'
    ? documents
    : documents.filter(d => d.category === selectedCategory)

  return (
    <div className="space-y-8 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Marco Legal & Habeas Data
            </span>
            <span className="text-[10px] font-mono text-zinc-400">Ley 1581 / Ley 1480 / Ley 527</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            Políticas, Cumplimiento & Documentos Legales
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Catálogo unificado de los 8 documentos legales oficiales de BarberOS, estado de vigencia, trazabilidad de consentimiento y formalización.
          </p>
        </div>

        <button
          onClick={fetchConsentLogs}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── RESUMEN LEGAL STATUS BANNER ── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <span>Régimen Operativo: Persona Natural Comerciante</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                En Constitución S.A.S.
              </span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {LEGAL_CONFIG.formalization.statusDescription}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0">
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Jurisdicción Oficial:</p>
          <p className="text-xs font-black text-zinc-950 dark:text-white">{LEGAL_CONFIG.jurisdiction}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{LEGAL_CONFIG.operator.city}, Colombia</p>
        </div>
      </div>

      {/* ── 1. CATÁLOGO DE DOCUMENTOS LEGALES (8 OFICIALES) ── */}
      <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Documentos Legales Oficiales ({filteredDocs.length} de {documents.length})
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Todos los documentos cuentan con navegación unificada, diseño responsivo y sin pantallas congeladas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'CONTRATOS', label: 'Contratos' },
              { id: 'PRIVACIDAD', label: 'Privacidad' },
              { id: 'OPERACIONES', label: 'Operaciones & SLA' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3 hover:border-amber-500/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {doc.categoryLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-zinc-500">
                      v{doc.version}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      ● Vigente
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-zinc-950 dark:text-white leading-snug">
                  {doc.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                  {doc.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-zinc-400">
                  {doc.route}
                </span>

                <Link
                  href={doc.route}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>Ver documento</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. CHECKLIST DE FORMALIZACIÓN LEGAL (TRANSPARENCIA) ── */}
      <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Checklist de Formalización & Cumplimiento en Colombia
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Estado de los requisitos societarios, tributarios y técnicos para la operación plena en territorio colombiano.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {checklist.map(item => (
            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">{item.id}</span>
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">{item.title}</span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    item.priority === 'CRÍTICO'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
              </div>

              <div className="shrink-0">
                {item.status === 'CONFIGURADO_CODIGO' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configurado en Código
                  </span>
                )}
                {item.status === 'EN_REVISION_ABOGADO' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    En Revisión
                  </span>
                )}
                {item.status === 'PENDIENTE_PROPIETARIO' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Fase Comercial
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. AUDITORÍA DE CONSENTIMIENTO DE USUARIOS (HABEAS DATA) ── */}
      <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              Trazabilidad de Consentimiento & Aceptación de Términos
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Registros inmutables de aceptación formal de políticas al registrarse en BarberOS (Ley 1581 de 2012 Art. 9).
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {consentLogs.length} eventos registrados
          </span>
        </div>

        {loadingLogs ? (
          <div className="p-8 text-center text-xs text-zinc-400">Cargando bitácora de consentimiento...</div>
        ) : consentLogs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 text-center text-xs text-zinc-500">
            No se encontraron eventos recientes de aceptación explícita en auditoría.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-400">
                  <th className="py-2.5 px-3">Usuario / Titular</th>
                  <th className="py-2.5 px-3">Barbería</th>
                  <th className="py-2.5 px-3">Acción Registrada</th>
                  <th className="py-2.5 px-3">Dirección IP</th>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                {consentLogs.slice(0, 10).map(log => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.businessName || 'Plataforma'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {log.ipAddress}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
