'use client'

import React from 'react'
import LegalLayout from '@/components/legal/LegalLayout'
import { getLegalDocBySlug } from '@/lib/legal-documents'
import { LEGAL_CONFIG } from '@/lib/legal-config'
import { ShieldCheck, FileText, UserCheck, AlertCircle, HelpCircle, Mail, Database, Lock } from 'lucide-react'

export default function TratamientoDatosPage() {
  const meta = getLegalDocBySlug('tratamiento-de-datos')

  return (
    <LegalLayout currentSlug="tratamiento-de-datos" docMeta={meta}>
      {/* Alerta de Marco Legal */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          <strong>Marco Legal Colombiano:</strong> La presente política se expide en estricto cumplimiento del Artículo 15 de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012 y el Decreto Reglamentario 1074 de 2015. BarberOS actúa en calidad de Encargado del Tratamiento respecto a los datos recolectados por cada barbería usuaria, y en calidad de Responsable frente a los datos de registro de suscriptores y operadores de la plataforma.
        </p>
      </div>

      {/* Secciones */}
      <div className="space-y-8">
        {/* Sección 1: Identificación del Responsable */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              1. Identificación y Rol del Tratamiento
            </h2>
          </div>
          <p>
            El proyecto tecnológico <strong>BarberOS</strong> es operado de forma independiente por su titular y desarrollador responsable en Sincelejo, Sucre, Colombia, en condición de persona natural desarrolladora de software:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Canal de Notificaciones y Habeas Data:</strong> {LEGAL_CONFIG.operator.habeasDataEmail}</li>
            <li><strong>Canal de Soporte Oficial:</strong> {LEGAL_CONFIG.operator.supportWhatsApp}</li>
            <li><strong>Domicilio Principal:</strong> {LEGAL_CONFIG.operator.city}, {LEGAL_CONFIG.operator.department}, Colombia.</li>
            <li><strong>Rol como Proveedor SaaS:</strong> BarberOS provee la infraestructura tecnológica y base de datos donde cada barbería custodia y gestiona su propia clientela.</li>
          </ul>
        </section>

        {/* Sección 2: Principios Rectores */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              2. Principios Rectores del Tratamiento
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <strong className="text-zinc-950 dark:text-white block mb-1">Principio de Legalidad:</strong>
              El tratamiento de datos se sujeta estrictamente a lo establecido en la Ley 1581 de 2012 y demás normas aplicables.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <strong className="text-zinc-950 dark:text-white block mb-1">Principio de Finalidad:</strong>
              Los datos se recolectan exclusivamente para la gestión de citas, recordatorios automáticos y control contable.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <strong className="text-zinc-950 dark:text-white block mb-1">Principio de Libertad:</strong>
              Los datos solo se tratan con el consentimiento previo, expreso e informado del titular (cliente o barbero).
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <strong className="text-zinc-950 dark:text-white block mb-1">Principio de Seguridad y Confidencialidad:</strong>
              Aislamiento multi-tenant por software y cifrado de conexiones para evitar accesos no autorizados.
            </div>
          </div>
        </section>

        {/* Sección 3: Datos Tratados y Finalidades */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              3. Categorías de Datos y Finalidades del Tratamiento
            </h2>
          </div>
          <p>
            BarberOS procesa únicamente datos de naturaleza pública, semiprivada y comercial indispensables para la prestación del servicio:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-950 dark:text-white mb-0.5">A. Clientes Finales de las Barberías:</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Nombre completo, número de teléfono celular (WhatsApp) e historial de citas agendadas. Se emplean para confirmar el turno, enviar recordatorios automatizados de asistencia y coordinar cancelaciones o reasignaciones de horario.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-950 dark:text-white mb-0.5">B. Propietarios y Barberos Registrados:</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Nombre, correo electrónico, credenciales de acceso seguras (hash bcrypt), horarios de disponibilidad, porcentaje de comisiones y registro de servicios prestados.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 4: Derechos de los Titulares (Derechos ARCO) */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              4. Derechos de los Titulares (Derechos ARCO)
            </h2>
          </div>
          <p>
            De conformidad con el Artículo 8 de la Ley 1581 de 2012, todo titular de datos personales cuenta con los siguientes derechos irrevocables:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Conocer, actualizar y rectificar:</strong> Sus datos personales frente a BarberOS o la barbería responsable en cualquier momento.</li>
            <li><strong>Solicitar prueba de la autorización:</strong> Conocer cuándo y cómo otorgó su consentimiento.</li>
            <li><strong>Ser informado:</strong> Sobre el uso específico que se le ha dado a su información.</li>
            <li><strong>Revocar la autorización o solicitar la supresión:</strong> Solicitar la eliminación de sus datos cuando considere que no se respetan los principios legales.</li>
            <li><strong>Presentar quejas ante la SIC:</strong> Acudir ante la Superintendencia de Industria y Comercio por infracciones a la normatividad de Habeas Data.</li>
          </ul>
        </section>

        {/* Sección 5: Procedimiento para Ejercer Derechos */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              5. Canales y Procedimiento de Consulta y Reclamo
            </h2>
          </div>
          <p>
            El titular puede remitir su solicitud indicando su nombre completo, número de documento y la descripción precisa del derecho que desea ejercer:
          </p>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
            <p><strong>Correo electrónico exclusivo:</strong> <a href={`mailto:${LEGAL_CONFIG.operator.habeasDataEmail}`} className="text-amber-600 dark:text-amber-400 font-bold hover:underline">{LEGAL_CONFIG.operator.habeasDataEmail}</a></p>
            <p><strong>Términos de respuesta legal:</strong> Las consultas se resolverán en un término máximo de <strong>diez (10) días hábiles</strong>. Los reclamos o solicitudes de supresión se atenderán en un término máximo de <strong>quince (15) días hábiles</strong>, conforme a la ley colombiana.</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}

