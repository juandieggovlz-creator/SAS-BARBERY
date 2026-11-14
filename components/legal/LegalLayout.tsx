'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, ShieldCheck, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LegalNav from './LegalNav'
import { getLegalDocBySlug, LegalDocMeta } from '@/lib/legal-documents'
import { LEGAL_CONFIG } from '@/lib/legal-config'
import { getPublicSettings, getWhatsAppUrl } from '@/lib/platform-config'

interface LegalLayoutProps {
  currentSlug: string
  docMeta?: LegalDocMeta
  children: React.ReactNode
}

export default function LegalLayout({ currentSlug, docMeta, children }: LegalLayoutProps) {
  const meta = docMeta || getLegalDocBySlug(currentSlug)
  const [waUrl, setWaUrl] = useState(`https://wa.me/573242063393?text=${encodeURIComponent('Hola, tengo una consulta sobre las políticas de BarberOS.')}`)
  const [waDisplay, setWaDisplay] = useState('+57 324 206 3393')

  useEffect(() => {
    getPublicSettings().then(s => {
      const phone = s.support_whatsapp
      setWaUrl(getWhatsAppUrl(phone, 'Hola, tengo una consulta sobre las políticas de BarberOS.'))
      setWaDisplay(phone)
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-amber-500 selection:text-black transition-colors duration-200">
      {/* ── 1. HEADER SUPERIOR ── */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-md shadow-zinc-950/15 shrink-0 border border-zinc-200 dark:border-zinc-800">
              <Image
                src="/logo.png"
                alt="BarberOS Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-zinc-950 dark:text-white uppercase flex items-center gap-1.5">
                Barber<span className="font-light text-zinc-500">OS</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  Legal
                </span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="navbar" />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Regresar al inicio</span>
              <span className="sm:hidden">Inicio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. NAVEGACIÓN UNIFICADA DE DOCUMENTOS (TODAS LAS 8 POLÍTICAS) ── */}
      <LegalNav currentSlug={currentSlug} />

      {/* ── 3. CONTENIDO PRINCIPAL ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Encabezado del Documento Activo */}
        {meta && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                {meta.categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-bold">
                Versión {meta.version}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                ● Vigente
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-white leading-tight">
              {meta.title}
            </h1>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
              {meta.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Última actualización: <strong className="text-zinc-800 dark:text-zinc-200">{meta.effectiveDate}</strong>
              </span>
              <span>•</span>
              <span>Jurisdicción: <strong className="text-zinc-800 dark:text-zinc-200">{LEGAL_CONFIG.jurisdiction}</strong></span>
            </div>
          </div>
        )}

        {/* Cuerpo del Documento */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {children}
        </div>

        {/* ── 4. CANAL DE ATENCIÓN Y CONTACTO OFICIAL ── */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>Canal Oficial de Atención Legal & Transparencia</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">Atención Directa</span>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Para ejercer tus derechos de Habeas Data (consulta, rectificación o revocatoria de autorización), consultas sobre términos de servicio o reportes técnicos, comunícate a través de nuestros canales oficiales:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" /> Correo Oficial:
              </p>
              <a href={`mailto:${LEGAL_CONFIG.operator.officialEmail}`} className="text-amber-600 dark:text-amber-400 font-semibold hover:underline block mt-1">
                {LEGAL_CONFIG.operator.officialEmail}
              </a>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Oficial:
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline block mt-1"
              >
                {waDisplay}
              </a>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> Ubicación:
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                Sincelejo, Sucre, Colombia
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

