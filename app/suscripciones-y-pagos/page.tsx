'use client'

import React from 'react'
import LegalLayout from '@/components/legal/LegalLayout'
import { getLegalDocBySlug } from '@/lib/legal-documents'
import { CreditCard, CheckCircle2, AlertCircle, Zap, ShieldCheck, Clock } from 'lucide-react'

export default function SuscripcionesPagosPage() {
  const meta = getLegalDocBySlug('suscripciones-y-pagos')

  return (
    <LegalLayout currentSlug="suscripciones-y-pagos" docMeta={meta}>
      {/* Alerta Informativa */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          <strong>Transparencia de Tarifas en Colombia:</strong> Todos los precios de los planes SaaS de BarberOS están fijados en pesos colombianos (COP), sin cargos ocultos ni renovación obligatoria por tarjeta no consentida.
        </p>
      </div>

      <div className="space-y-8">
        {/* Sección 1: Estructura de Planes y Precios Oficiales */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              1. Catálogo Oficial de Planes y Tarifas
            </h2>
          </div>
          <p>
            BarberOS ofrece 3 niveles de suscripción diseñados para adaptarse a la escala operativa de cada barbería o cadena en Colombia:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            {/* Plan Básico */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Membresía Inicial</span>
                <h3 className="font-black text-base text-zinc-950 dark:text-white">Plan Básico</h3>
                <div className="text-xl font-black text-zinc-950 dark:text-white my-2 font-mono">
                  $69.900 <span className="text-xs font-normal text-zinc-400">COP/mes</span>
                </div>
                <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 pt-1">
                  <li>✓ Hasta 3 barberos activos</li>
                  <li>✓ 1 sede física</li>
                  <li>✓ Cierres de caja diarios</li>
                  <li>✓ Agenda online 24/7</li>
                </ul>
              </div>
            </div>

            {/* Plan Profesional */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/40 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">El Más Popular</span>
                <h3 className="font-black text-base text-zinc-950 dark:text-white">Plan Profesional</h3>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 my-2 font-mono">
                  $119.900 <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">COP/mes</span>
                </div>
                <ul className="space-y-1.5 text-zinc-700 dark:text-zinc-300 pt-1">
                  <li>✓ Hasta 10 barberos activos</li>
                  <li>✓ Automatización WhatsApp Meta</li>
                  <li>✓ Liquidación de comisiones</li>
                  <li>✓ Control detallado de egresos</li>
                </ul>
              </div>
            </div>

            {/* Plan Premium VIP */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Cadenas & Expansión</span>
                <h3 className="font-black text-base text-zinc-950 dark:text-white">Premium VIP</h3>
                <div className="text-xl font-black text-zinc-950 dark:text-white my-2 font-mono">
                  $169.900 <span className="text-xs font-normal text-zinc-400">COP/mes</span>
                </div>
                <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 pt-1">
                  <li>✓ Hasta 30 barberos activos</li>
                  <li>✓ Módulo Multisede corporativo</li>
                  <li>✓ Analítica e informes globales</li>
                  <li>✓ Soporte prioritario dedicado</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Sección 2: Ciclo de Facturación y Medios de Pago */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              2. Modalidad de Pago y Ciclo Mensual
            </h2>
          </div>
          <p>
            El servicio se contrata por mensualidades anticipadas:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Medios habilitados:</strong> Transferencia bancaria (Bancolombia, Nequi, Daviplata), pasarelas de pago colombianas autorizadas o acuerdo comercial directo.</li>
            <li><strong>Fecha de corte:</strong> Corresponde al mismo día calendario del mes en que inició la suscripción paga tras expirar la prueba gratuita.</li>
            <li><strong>Periodo de gracia por mora:</strong> En caso de retraso en el pago, BarberOS otorga un margen de cortesía de <strong>3 días calendario</strong> para formalizar la renovación antes de suspender temporalmente el acceso a la agenda.</li>
          </ul>
        </section>

        {/* Sección 3: Mejoras o Cambios de Plan (Upgrades / Downgrades) */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              3. Cambios de Plan y Escalabilidad
            </h2>
          </div>
          <p className="text-xs">
            El propietario puede solicitar el cambio a un plan superior en cualquier momento cuando su equipo de barberos crezca o requiera habilitar sucursales adicionales. La diferencia de tarifa se ajustará de forma proporcional por los días restantes del ciclo en curso.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}

