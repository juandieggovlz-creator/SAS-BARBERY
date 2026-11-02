'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Play } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Big Contrast Card */}
        <div className="relative rounded-[36px] bg-zinc-950 text-white p-8 sm:p-14 lg:p-20 overflow-hidden shadow-2xl border border-zinc-800 text-center space-y-8">
          
          {/* Ambient Lighting Background Accents */}
          <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>COMIENZA HOY MISMO</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Lleva tu barbería al siguiente nivel de rentabilidad y orden
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed">
              Únete a las barberías que ya ahorran horas cada semana, eliminaron los descuadres de caja y aumentaron sus reservas sin esfuerzo.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-black uppercase tracking-wider px-8 py-4 rounded-2xl shadow-2xl shadow-white/10 transition-all active:scale-95 group text-center"
              >
                <span>Crear Mi Barbería Gratis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#sistema"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 text-sm font-bold uppercase tracking-wider px-7 py-4 rounded-2xl transition-all text-center"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Solicitar Demostración</span>
              </a>
            </div>

            {/* Security checklist */}
            <div className="pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>14 días de prueba sin costo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sin tarjeta de crédito requerida</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cancela en cualquier momento</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
