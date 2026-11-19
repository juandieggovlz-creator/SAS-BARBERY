'use client'

import React from 'react'
import Link from 'next/link'
import { Crown, Sparkles, ArrowRight, ShieldAlert, Check } from 'lucide-react'

export interface PlanFeatureGateProps {
  featureName: string
  currentPlanName?: string
  requiredPlanName?: string
  description?: string
  benefits?: string[]
  className?: string
  showComparisonLink?: boolean
}

export default function PlanFeatureGate({
  featureName,
  currentPlanName = 'Básico',
  requiredPlanName = 'Plan Profesional o Premium VIP',
  description = 'Para utilizar esta herramienta necesitas actualizar tu suscripción.',
  benefits = [],
  className = '',
  showComparisonLink = true
}: PlanFeatureGateProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-[#121217] to-black border border-amber-500/30 p-6 sm:p-8 text-white shadow-2xl ${className}`}>
      {/* Luz ambiental sutil dorada */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Función Exclusiva
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800">
              Tu plan actual: <strong className="text-zinc-200">{currentPlanName}</strong>
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Esta función requiere el {requiredPlanName}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
              {description} Accede a <strong className="text-zinc-200">{featureName}</strong> y potencia el crecimiento de tu barbería.
            </p>
          </div>

          {benefits.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs">
              {benefits.map((b, idx) => (
                <li key={idx} className="flex items-center gap-2 text-zinc-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          <Link
            href="/subscription"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-zinc-950" />
            <span>Ver Planes y Actualizar</span>
          </Link>

          {showComparisonLink && (
            <Link
              href="/subscription"
              className="inline-flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white font-bold text-xs py-2 transition-colors"
            >
              <span>Comparar todos los beneficios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
