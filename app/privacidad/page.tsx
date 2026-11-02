'use client'

import React from 'react'
import Link from 'next/link'
import { Scissors, Shield, ArrowLeft, Lock, Database, Bell, Eye, FileText, CheckCircle2 } from 'lucide-react'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight">
              Barber<span className="text-amber-500">OS</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Regresar al inicio
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Tratamiento de Datos Personales
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-sm text-zinc-400 font-medium">
            Última actualización: Noviembre 2026 • En cumplimiento de la Ley Estatutaria 1581 de 2012 y Decreto Reglamentario 1377 de 2013 de la República de Colombia.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300 leading-relaxed">
          <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            En <span className="font-bold text-white">BarberOS</span> respetamos y salvaguardamos la privacidad de nuestros clientes, barberos y administradores. Este documento detalla cómo recolectamos, almacenamos, procesamos y protegemos la información personal que nos confías al utilizar nuestros servicios web, módulos de reservas y automatizaciones de mensajería.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2>1. Datos Personales que Recolectamos</h2>
            </div>
            <p>
              Dependiendo del rol con el que interactúes en BarberOS, podemos recolectar los siguientes datos mínimos necesarios:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Clientes que agendan citas:</strong> Nombre completo, número de teléfono (WhatsApp), correo electrónico (opcional) y notas sobre el servicio solicitado o preferencias de corte.
              </li>
              <li>
                <strong className="text-zinc-200">Barberos y Profesionales:</strong> Nombre, teléfono, correo de acceso, fotografía de perfil profesional, biografía laboral y horarios de atención asignados.
              </li>
              <li>
                <strong className="text-zinc-200">Propietarios y Administradores de Barberías:</strong> Nombre de contacto comercial, razón social, NIT o documento de identidad, dirección del establecimiento, teléfonos de contacto y credenciales de acceso seguras.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Bell className="w-5 h-5 text-emerald-400" />
              <h2>2. Finalidades del Tratamiento de Datos</h2>
            </div>
            <p>
              La información recolectada se utiliza estrictamente para las siguientes finalidades operativas y contractuales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Coordinación, confirmación, reprogramación y recordatorios automáticos de citas por WhatsApp o SMS.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Gestión de turnos, disponibilidades de los barberos y cálculo de comisiones operativas.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Historial de cortes y preferencias para brindar una atención personalizada en el salón.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Emisión de comprobantes de pago, reportes contables y cumplimiento tributario.</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 pt-2">
              <strong className="text-zinc-200">Garantía antispam:</strong> BarberOS <strong className="text-white">no vende, alquila ni comercializa</strong> tus bases de datos ni tu información personal con intermediarios publicitarios externos.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2>3. Medidas de Seguridad y Almacenamiento</h2>
            </div>
            <p>
              Aplicamos estrictos controles técnicos, criptográficos y organizacionales para proteger la información contra accesos no autorizados, pérdida o alteración:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Cifrado de todas las comunicaciones mediante protocolo seguro HTTPS/TLS con certificados SSL de 256 bits.</li>
              <li>Contraseñas de acceso hasheadas irreversibly mediante algoritmos seguros (bcrypt con factor de costo 10+).</li>
              <li>Bases de datos aisladas multi-inquilino en servidores certificados con replicación continua y copias de seguridad automáticas.</li>
              <li>Tokens de sesión efímeros firmados criptográficamente mediante JSON Web Tokens (JWT) con banderas de seguridad HttpOnly y SameSite.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Eye className="w-5 h-5 text-emerald-400" />
              <h2>4. Derechos de los Titulares (Habeas Data)</h2>
            </div>
            <p>
              Conforme a los artículos 8 y concordantes de la Ley 1581 de 2012, tú como titular de los datos tienes derecho en todo momento a:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <h4 className="font-bold text-white text-xs mb-1">Conocer y Consultar</h4>
                <p className="text-xs text-zinc-400">Solicitar copia de los datos personales almacenados en el sistema.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <h4 className="font-bold text-white text-xs mb-1">Actualizar y Rectificar</h4>
                <p className="text-xs text-zinc-400">Corregir datos inexactos, incompletos o desactualizados.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <h4 className="font-bold text-white text-xs mb-1">Suprimir y Eliminar</h4>
                <p className="text-xs text-zinc-400">Pedir la eliminación total de tus datos cuando no exista obligación contractual o legal vigente.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <h4 className="font-bold text-white text-xs mb-1">Revocar la Autorización</h4>
                <p className="text-xs text-zinc-400">Retirar el consentimiento para el tratamiento de tus datos personales en cualquier momento.</p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2>5. Canales de Atención para Peticiones, Quejas y Reclamos (PQR)</h2>
            </div>
            <p>
              Para ejercer cualquiera de tus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), puedes comunicarte con el Oficial de Protección de Datos de BarberOS o directamente con el administrador de la barbería en la que realizaste tu reserva a través del siguiente canal formal:
            </p>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
              <p><span className="text-zinc-400">Correo Electrónico de Privacidad:</span> <span className="font-mono text-emerald-400">privacidad@barberos.app</span></p>
              <p><span className="text-zinc-400">Tiempo de respuesta:</span> Máximo quince (15) días hábiles conforme a los plazos legales de la Superintendencia de Industria y Comercio (SIC).</p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} BarberOS Inc. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/terminos" className="hover:text-amber-400 transition-colors">
              Términos del Servicio
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">
              Página Principal
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
