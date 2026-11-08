'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  Database,
  Server,
  KeyRound,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function SeguridadPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-amber-500 selection:text-black transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-md shadow-zinc-950/15 shrink-0">
              <Image
                src="/logo.png"
                alt="BarberOS Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white uppercase flex items-center gap-1.5">
                Barber<span className="font-light text-zinc-500">OS</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                  Seguridad
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
              <ArrowLeft className="w-4 h-4" /> Regresar al inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Cross Navigation Bar */}
      <nav className="border-b border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-100/70 dark:bg-zinc-900/40 transition-colors">
        <div className="max-w-5xl mx-auto px-5 py-2.5 flex items-center gap-3 overflow-x-auto text-xs font-semibold">
          <Link
            href="/terminos-y-condiciones"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Términos y Condiciones
          </Link>
          <Link
            href="/politica-de-privacidad"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Política de Privacidad
          </Link>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap font-bold">
            Seguridad y Datos
          </span>
          <Link
            href="/sla"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Acuerdo SLA
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-12">
        {/* Title & Metadata */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Arquitectura & Protección Técnica
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
            Seguridad de la Plataforma y Protección de Datos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Última actualización: <span className="text-zinc-800 dark:text-zinc-200">Noviembre 2026</span> • Documento informativo de arquitectura
          </p>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>Aviso de transparencia legal:</strong> Este documento describe los protocolos y controles técnicos implementados en la plataforma BarberOS para proteger tu información. No constituye una póliza de seguro ni garantía comercial absoluta. Ciertas directrices están sujetas a validación jurídica continua bajo la Ley 1581 de 2012 de Colombia.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
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
                3. Control de Acceso por Roles (RBAC) y PIN de Barbero
              </h2>
            </div>
            <p>
              BarberOS implementa segregación de privilegios:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li><strong>Propietario / Dueño:</strong> Acceso total a reportes consolidados, auditoría de caja, utilidades y administración de equipo.</li>
              <li><strong>Administrador de Sede:</strong> Acceso restringido a la sede asignada sin visibilidad de las demás sedes.</li>
              <li><strong>Portal del Barbero:</strong> Acceso individual protegido por PIN o token único. El profesional únicamente visualiza sus turnos asignados y sus comisiones pactadas, permaneciendo las finanzas globales de la empresa completamente ocultas.</li>
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

          {/* Contact Box */}
          <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-2">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              ¿Tienes preguntas técnicas sobre la seguridad de tus datos?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Nuestro equipo técnico está a tu disposición para orientarte.
            </p>
            <div className="pt-2 flex justify-center gap-3 text-xs">
              <a
                href="https://wa.me/573242063393"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                WhatsApp: +57 324 206 3393
              </a>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-600 dark:text-zinc-400">Sincelejo, Sucre</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

