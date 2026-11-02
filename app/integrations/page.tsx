'use client'

import React from 'react'
import WhatsAppIntegrationSettings from '@/components/owner/WhatsAppIntegrationSettings'
import { MessageCircle, ShieldCheck, Zap } from 'lucide-react'

export default function IntegrationsPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* ── HEADER DE SECCIÓN ── */}
      <div className="bg-white dark:bg-[#111317] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <MessageCircle className="w-7 h-7" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Canal Oficial
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Sistema de Conexión
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
              Conexión WhatsApp & Meta API
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
              Configura el canal de WhatsApp de tu barbería para reservas interactivas 24/7, recordatorios automáticos y notificaciones a clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Encriptación Segura</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Flujos Guiados</span>
          </div>
        </div>
      </div>

      {/* ── COMPONENTE PRINCIPAL DE INTEGRACIÓN ── */}
      <WhatsAppIntegrationSettings />
    </div>
  )
}
