'use client'

import React from 'react'
import LegalLayout from '@/components/legal/LegalLayout'
import { getLegalDocBySlug } from '@/lib/legal-documents'
import { RotateCcw, Clock, AlertCircle, DollarSign, Calendar, ShieldAlert } from 'lucide-react'

export default function CancelacionReembolsosPage() {
  const meta = getLegalDocBySlug('cancelacion-y-reembolsos')

  return (
    <LegalLayout currentSlug="cancelacion-y-reembolsos" docMeta={meta}>
      {/* Alerta de Alcance */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          <strong>Doble Naturaleza del Servicio:</strong> BarberOS distingue claramente entre dos relaciones jurídicas: (i) la relación comercial entre la barbería y su cliente final al agendar un corte o tratamiento; y (ii) la relación de suscripción SaaS entre el propietario de la barbería y BarberOS como proveedor de software.
        </p>
      </div>

      <div className="space-y-8">
        {/* Sección 1: Cancelación de Citas por Clientes */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              1. Cancelación y Reprogramación de Citas en Barberías
            </h2>
          </div>
          <p>
            Los clientes que agenden citas a través del portal web público o el canal oficial de WhatsApp de cada establecimiento están sujetos a las siguientes directrices generales de cortesía operativa:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Tiempo de aviso previo:</strong> Se solicita notificar la cancelación o solicitud de reagendamiento con al menos <strong>1 hora de anticipación</strong> a la hora pactada.</li>
            <li><strong>Tolerancia de espera:</strong> La barbería mantendrá reservado el turno durante un margen de cortesía de hasta <strong>10 minutos</strong>. Superado este lapso, el barbero podrá disponer del turno para atender clientes presenciales o en espera.</li>
            <li><strong>Ausentismo injustificado (No-Show):</strong> Los clientes que no asistan reiteradamente sin previo aviso podrán ver restringida la opción de reserva directa en línea a criterio exclusivo del establecimiento.</li>
          </ul>
        </section>

        {/* Sección 2: Anticipos y Señas de Reserva */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              2. Régimen de Anticipos y Señas Opcionales
            </h2>
          </div>
          <p>
            BarberOS permite a cada negocio configurar de manera autónoma la exigencia de anticipos para confirmar citas:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <strong className="text-zinc-950 dark:text-white block mb-0.5">Gestión Directa por la Barbería:</strong>
              El anticipo es cobrado y administrado directamente por el negocio (a través de transferencias bancarias, Nequi, Daviplata o efectivo). BarberOS <strong>no recauda ni retiene comisiones</strong> sobre los anticipos de servicios de barbería.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <strong className="text-zinc-950 dark:text-white block mb-0.5">Reembolso de Anticipos al Cliente:</strong>
              Si el cliente cancela oportunamente con la antelación fijada por el negocio, o si la barbería no puede prestar el servicio por fuerza mayor, el reembolso del anticipo será gestionado íntegramente por la barbería responsable.
            </div>
          </div>
        </section>

        {/* Sección 3: Suscripciones SaaS y Pagos de Planes */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              3. Cancelación de Membresías SaaS BarberOS
            </h2>
          </div>
          <p>
            Los propietarios de barberías que contraten los planes mensuales de BarberOS (Básico, Profesional o Premium VIP) disfrutan de total flexibilidad contractual:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Cancelación voluntaria en cualquier momento:</strong> El propietario puede pausar o cancelar la renovación de su plan desde el panel en <code className="font-mono text-zinc-800 dark:text-zinc-200">/subscription</code> sin penalidades ni cláusulas de permanencia forzosa.</li>
            <li><strong>Periodo de prueba gratuito (14 días):</strong> Todo nuevo negocio dispone de 14 días de prueba completa sin necesidad de ingresar tarjeta de crédito. Si no adquiere un plan al término del periodo, el servicio se suspende pacíficamente sin cobro retroactivo.</li>
            <li><strong>Política de no-reembolso sobre periodos devengados:</strong> Los pagos mensuales corresponden al acceso continuado a la infraestructura cloud durante el mes contratado. No se realizan reembolsos proporcionales por días no utilizados una vez iniciado el ciclo mensual.</li>
          </ul>
        </section>

        {/* Sección 4: Preservación de Datos tras Cancelación */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              4. Custodia y Exportación de Datos
            </h2>
          </div>
          <p className="text-xs">
            En caso de suspensión o no renovación, BarberOS conserva la base de clientes y registros contables del negocio durante un plazo prudencial de <strong>30 días calendario</strong>, permitiendo al propietario reactivar su cuenta o solicitar la exportación de sus datos contables antes de proceder con el archivo definitivo.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}

