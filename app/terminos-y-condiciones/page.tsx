'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ShieldCheck, 
  ArrowLeft, 
  Calendar, 
  UserCheck, 
  CreditCard, 
  AlertCircle, 
  Lock, 
  Zap, 
  FileCheck, 
  Scale, 
  Ban, 
  Server, 
  Mail 
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function TerminosCondicionesPage() {
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
                  SaaS
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
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap font-bold">
            Términos y Condiciones
          </span>
          <Link
            href="/politica-de-privacidad"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Política de Privacidad
          </Link>
          <Link
            href="/politica-de-cookies"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Política de Cookies
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-12">
        {/* Title & Metadata */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Marco Contractual y de Uso
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
            Términos y Condiciones Generales del Servicio
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Fecha de última actualización: <span className="text-zinc-800 dark:text-zinc-200">2 de noviembre de 2026</span> • Versión 1.0
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          
          {/* Section 1: Descripción del Servicio */}
          <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2>1. Descripción del Servicio BarberOS</h2>
            </div>
            <p>
              <strong className="text-zinc-950 dark:text-white">BarberOS</strong> es una plataforma de software en la nube (SaaS - Software as a Service) diseñada para la digitalización, organización y gestión operativa de barberías, peluquerías y centros de cuidado masculino y estético.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              La plataforma incluye herramientas de agendamiento digital, agenda multi-barbero interactiva, catálogo de servicios, control de caja y arqueos, cálculo automatizado de comisiones profesionales, página web pública de reservas para clientes y módulos de mensajería automatizada por WhatsApp.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <strong className="text-zinc-900 dark:text-zinc-200">Naturaleza del servicio:</strong> BarberOS proporciona la infraestructura técnica y el software de gestión. Los servicios de corte, barbería, estética y atención física son prestados de manera directa e independiente por cada establecimiento comercial y sus respectivos profesionales.
            </p>
          </section>

          {/* Section 2: Requisitos de Registro y Cuentas */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <h2>2. Requisitos de Registro y Veracidad de la Información</h2>
            </div>
            <p>
              Para registrar una barbería o activar una cuenta en BarberOS se requiere:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>Tener plena capacidad legal para obligarse comercialmente (mayor de 18 años).</li>
              <li>Suministrar información verídica, exacta y actualizada durante el proceso de registro (nombre del establecimiento, teléfonos de contacto y datos de cuenta).</li>
              <li>En caso de representar a una persona jurídica o establecimiento de comercio, contar con la debida personería o facultad para vincularlo comercialmente.</li>
            </ul>
          </section>

          {/* Section 3: Responsabilidades de las Partes */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Scale className="w-5 h-5 text-amber-500" />
              <h2>3. Responsabilidades de las Partes</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
                <span className="font-bold block text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Propietario / Negocio
                </span>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Configurar horarios y tarifas reales, atender puntualmente las citas reservadas, administrar adecuadamente los permisos de sus barberos colaboradores y custodiar las credenciales de acceso al panel administrativo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
                <span className="font-bold block text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Barbero Profesional
                </span>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Cumplir con los turnos y servicios aceptados en su agenda, brindar atención profesional y utilizar los datos de los clientes únicamente para fines propios de la cita asignada.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
                <span className="font-bold block text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Cliente de Reserva
                </span>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Proporcionar un número telefónico válido para recibir la confirmación de la cita, presentarse a la hora pautada en el salón y notificar cancelaciones o reprogramaciones con antelación razonable.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Gestión de Citas y Reservas */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h2>4. Gestión de Citas, Cancelaciones y Modificaciones</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Las citas reservadas mediante la página web pública o el bot de WhatsApp se sincronizan en tiempo real con la agenda del establecimiento.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Confirmación y código único:</strong> Cada reserva genera un código de referencia que el cliente puede utilizar para consultar el estado de su cita.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Políticas de cancelación y retraso:</strong> Cada barbería es libre de establecer sus propias políticas de tolerancia de espera y penalización por inasistencia. BarberOS no impone penalidades económicas directas a los clientes por cancelación.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Disponibilidad de turnos:</strong> Los bloques de horarios disponibles son determinados de forma exclusiva por la barbería según los horarios configurados para cada profesional.
              </li>
            </ul>
          </section>

          {/* Section 5: Pagos y Condiciones Comerciales */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <h2>5. Pagos, Caja y Condiciones Económicas</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              En su versión operativa actual, BarberOS facilita el registro y control de cobros en caja física (efectivo, transferencias o datáfono registrados por el administrador o barbero en el salón).
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              <strong className="text-zinc-900 dark:text-zinc-200">Suscripción al SaaS:</strong> El acceso a los módulos de administración de BarberOS puede estar sujeto a planes de suscripción mensual o anual, cuyas tarifas, características y períodos de prueba gratuita son informados al propietario del negocio al momento de la activación.
            </p>
          </section>

          {/* Section 6: Uso Adecuado y Actividades Prohibidas */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Ban className="w-5 h-5 text-amber-500" />
              <h2>6. Uso Adecuado de la Plataforma y Restricciones</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Queda estrictamente prohibido a cualquier usuario:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de BarberOS.</li>
              <li>Utilizar robots, scrapers, arañas web o scripts automatizados no autorizados para extraer datos de la plataforma.</li>
              <li>Suplantar la identidad de otra barbería, barbero, cliente o persona.</li>
              <li>Utilizar los canales de mensajería (WhatsApp/SMS) para enviar publicidad masiva no solicitada (SPAM) o contenido que viole normativas de Meta.</li>
              <li>Intentar eludir las medidas de seguridad, autenticación o aislamiento multi-tenant de la plataforma.</li>
            </ul>
          </section>

          {/* Section 7: Disponibilidad y Mantenimiento */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Server className="w-5 h-5 text-amber-500" />
              <h2>7. Disponibilidad del Servicio y Mantenimiento</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              BarberOS realiza sus mejores esfuerzos para garantizar una disponibilidad continua y óptima del servicio. No obstante, al tratarse de una solución tecnológica alojada en la nube, el servicio puede experimentar suspensiones o degradaciones temporales ocasionadas por mantenimientos programados, actualizaciones o fallas en los proveedores de infraestructura externa.
            </p>
          </section>

          {/* Section 8: Seguridad y Contraseñas */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Lock className="w-5 h-5 text-amber-500" />
              <h2>8. Seguridad de las Cuentas y Custodia de Contraseñas</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Cada usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso y de cualquier actividad efectuada desde su cuenta. Si sospechas de un acceso no autorizado a tu panel, debes notificar de inmediato al soporte técnico para revocar las sesiones activas.
            </p>
          </section>

          {/* Section 9: Propiedad Intelectual */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <FileCheck className="w-5 h-5 text-amber-500" />
              <h2>9. Propiedad Intelectual</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              La marca BarberOS, logotipos, diseño de interfaces, código fuente, modelos de datos, arquitectura de software y documentación asociada son propiedad exclusiva del operador de la plataforma. El usuario recibe una licencia de uso limitada, revocable, no exclusiva y no transferible para utilizar el software según el plan contratado.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Los logotipos, marcas comerciales, fotografías y textos específicos que cada barbería carga en su perfil público continúan siendo propiedad de cada establecimiento.
            </p>
          </section>

          {/* Section 10: Integraciones con Terceros */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2>10. Servicios e Integraciones de Terceros</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              BarberOS se integra con servicios de terceros tales como Meta Platforms Inc. (WhatsApp Business API) e infraestructura de base de datos Neon. El funcionamiento continuo de dichas funciones está sujeto a la disponibilidad y términos de servicio de dichos proveedores externos. BarberOS no se hace responsable por suspensiones de números de WhatsApp derivadas de prácticas indebidas o infracciones cometidas ante Meta.
            </p>
          </section>

          {/* Section 11: Suspensión y Terminación */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2>11. Suspensión o Terminación de Cuentas</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              BarberOS se reserva el derecho de suspender o cancelar temporal o definitivamente el acceso a cualquier cuenta que incurra en violación de estos Términos, actividades fraudulentas o conductas que atenten contra la integridad de otros usuarios o de la plataforma.
            </p>
          </section>

          {/* Section 12: Limitación de Responsabilidad */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h2>12. Limitaciones de Responsabilidad</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              En la máxima medida permitida por la legislación aplicable, BarberOS no asume responsabilidad por: (i) disputas de calidad o incumplimiento en el servicio de corte entre cliente y barbero; (ii) inasistencias o cancelaciones imprevistas de clientes; (iii) pérdidas económicas derivadas de interrupciones de telecomunicaciones ajenas al control razonable de la plataforma.
            </p>
          </section>

          {/* Section 13: Modificaciones de los Términos */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Scale className="w-5 h-5 text-amber-500" />
              <h2>13. Modificaciones de los Términos</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Podemos actualizar estos Términos periódicamente para reflejar mejoras operativas o exigencias legales. La versión vigente siempre estará publicada en esta ruta con su fecha de revisión visible. El uso continuo de la plataforma tras la publicación de cambios constituye la aceptación de los nuevos términos.
            </p>
          </section>

          {/* Section 14: Ley Aplicable y Jurisdicción */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Scale className="w-5 h-5 text-amber-500" />
              <h2>14. Legislación Aplicable y Resolución de Controversias</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Estos Términos y Condiciones se rigen e interpretan conforme a las leyes aplicables en materia de comercio electrónico y protección de datos. Cualquier controversia derivada del uso del servicio se resolverá prioritariamente por acuerdo directo entre las partes o a través de los mecanismos de conciliación legalmente habilitados.
            </p>
          </section>

          {/* Section 15: Contacto */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Mail className="w-5 h-5 text-amber-500" />
              <h2>15. Contacto Legal</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Para consultas relativas a estos Términos o solicitudes comerciales, puedes comunicarte a través de los canales oficiales de soporte disponibles en BarberOS.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} BarberOS. Plataforma integral de gestión para barberías.</p>
          <div className="flex items-center gap-4">
            <Link href="/politica-de-privacidad" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Política de Privacidad
            </Link>
            <span>•</span>
            <Link href="/politica-de-cookies" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Política de Cookies
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
              Página Principal
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
