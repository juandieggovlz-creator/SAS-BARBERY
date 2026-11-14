'use client'

import React from 'react'
import LegalLayout from '@/components/legal/LegalLayout'
import { getLegalDocBySlug } from '@/lib/legal-documents'
import {
  Lock,
  Database,
  KeyRound,
  Server,
  UserCheck,
  AlertCircle
} from 'lucide-react'

export default function SeguridadPage() {
  const meta = getLegalDocBySlug('seguridad')

  return (
    <LegalLayout currentSlug="seguridad" docMeta={meta}>
      {/* Disclaimer Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          <strong>Aviso de transparencia legal:</strong> Este documento describe los protocolos y controles técnicos implementados en la plataforma BarberOS para proteger tu información. No constituye una póliza de seguro ni garantía comercial absoluta. Ciertas directrices están sujetas a validación jurídica continua bajo la Ley 1581 de 2012 de Colombia.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Section 1: Cifrado en tránsito */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              1. Comunicaciones y Cifrado en Tránsito
            </h2>
          </div>
          <p>
            Toda interacción entre el navegador de tus clientes, tu panel de administración y los servidores de BarberOS se transmite mediante canales cifrados utilizando protocolos estándar de la industria (TLS 1.3 / HTTPS). Esto previene la interceptación de contraseñas, datos personales y registros de citas por parte de terceros no autorizados.
          </p>
        </section>

        {/* Section 2: Aislamiento Multi-Inquilino */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              2. Aislamiento Estricto de Negocios (Multi-Tenant)
            </h2>
          </div>
          <p>
            La información financiera, clientes, comisiones y configuración de cada barbería está estrictamente aislada a nivel de software y base de datos mediante identificadores únicos de negocio (<code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold">businessId</code>). Ningún barbero, cliente o administrador de otra barbería puede acceder a los datos de tu establecimiento.
          </p>
        </section>

        {/* Section 3: Control de Acceso y Roles */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              3. Control de Acceso por Roles (RBAC) y Credenciales Cifradas
            </h2>
          </div>
          <p>
            BarberOS implementa segregación de privilegios:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Propietario / Dueño:</strong> Acceso total a reportes consolidados, auditoría de caja, utilidades y administración de equipo.</li>
            <li><strong>Administrador de Sede:</strong> Acceso restringido a la sede asignada sin visibilidad de las demás sedes.</li>
            <li><strong>Portal del Barbero:</strong> Acceso individual protegido por credenciales cifradas y tokens criptográficos de un solo uso. El profesional únicamente visualiza sus turnos asignados y sus comisiones pactadas, permaneciendo las finanzas globales de la empresa completamente ocultas.</li>
          </ul>
        </section>

        {/* Section 4: Infraestructura y Respaldos */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              4. Infraestructura en la Nube y Respaldos Automáticos
            </h2>
          </div>
          <p>
            La base de datos relacional y los servicios en la nube cuentan con redundancia geográfica y copias de seguridad automáticas continuas. En caso de corte eléctrico local o pérdida de tu teléfono o computador en la barbería, tu información permanece intacta y accesible de inmediato desde cualquier otro dispositivo conectado.
          </p>
        </section>

        {/* Section 5: Buenas Prácticas del Usuario */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              5. Responsabilidad Compartida y Buenas Prácticas
            </h2>
          </div>
          <p>
            La seguridad requiere colaboración. Como dueño o administrador, te recomendamos:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Utilizar contraseñas robustas y únicas para la cuenta del propietario.</li>
            <li>No compartir tus credenciales maestras con el personal ni con clientes.</li>
            <li>Desactivar de inmediato el acceso de colaboradores que ya no pertenezcan al equipo.</li>
          </ul>
        </section>
      </div>
    </LegalLayout>
  )
}
