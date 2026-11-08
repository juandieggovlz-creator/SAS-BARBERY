'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Play } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section
      id="cta-final"
      className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#07080c] transition-colors duration-300"
      aria-labelledby="cta-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Big Contrast Luxury Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl p-8 sm:p-14 lg:p-20 overflow-hidden shadow-2xl text-center space-y-8 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.03] to-amber-500/[0.06] dark:from-[#0d1017] dark:via-[#090b10] dark:to-[#07080c] border border-amber-500/30 dark:border-amber-500/20 transition-colors duration-300"
        >
          {/* Ambient Lighting Background Accents */}
          <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-amber-500/20 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-1/4 -mb-20 w-96 h-96 bg-emerald-500/15 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">

            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="uppercase tracking-widest text-[10px] font-black">Comienza Hoy Mismo</span>
              <span className="text-zinc-400 dark:text-zinc-600">·</span>
              <span className="font-semibold text-xs">1 Mes Gratis a Full</span>
            </div>

            {/* Headline */}
            <h2
              id="cta-title"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.06]"
            >
              Lleva tu barbería al siguiente nivel de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-200 dark:to-amber-400 animate-shiny">
                rentabilidad y orden.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Únete a las más de 500 barberías que ya eliminaron los descuadres de caja, liquidan comisiones sin discusiones y multiplican sus reservas 24/7.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:shadow-amber-500/35 transition-all cursor-pointer group"
              >
                <span>Crear Mi Barbería Gratis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              <a
                href="#sistema"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-white dark:bg-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.12] active:scale-[0.97] text-zinc-900 dark:text-white font-bold text-xs sm:text-sm uppercase tracking-wider border border-zinc-200/90 dark:border-white/10 shadow-sm transition-all"
              >
                <Play className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" aria-hidden="true" />
                <span>Explorar Demostración</span>
              </a>
            </div>

            {/* Bullets */}
            <div className="pt-8 border-t border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              {[
                '1 mes de prueba gratis con todo incluido',
                'Configuración en 3 minutos',
                'Cancela cuando quieras',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}
