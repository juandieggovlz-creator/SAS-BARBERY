'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Shield, 
  ArrowLeft, 
  Lock, 
  Database, 
  Bell, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Server, 
  MessageSquare, 
  Clock, 
  Mail,
  ExternalLink
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function PoliticaPrivacidadPage() {
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
          <Link
            href="/terminos-y-condiciones"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Términos y Condiciones
          </Link>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap font-bold">
            Política de Privacidad
          </span>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Tratamiento de Datos Personales
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Fecha de última actualización: <span className="text-zinc-800 dark:text-zinc-200">2 de noviembre de 2026</span> • Versión 1.0
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          
          {/* Section 1: Identificación del Responsable */}
          <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Shield className="w-5 h-5 text-emerald-500" />
              <h2>1. Identificación del Responsable del Tratamiento</h2>
            </div>
            <p>
              La plataforma tecnológica <strong className="text-zinc-950 dark:text-white">BarberOS</strong> es operada por su titular. Para cualquier consulta o solicitud sobre la protección y tratamiento de tus datos personales, puedes contactar a nuestro equipo a través de los canales oficiales habilitados en la plataforma.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
              Cuando un cliente agenda una cita en una barbería específica mediante el enlace o página pública de la barbería, dicha barbería actúa como responsable directo de la relación comercial con el cliente, y BarberOS actúa como encargado tecnológico del almacenamiento seguro de la información.
            </p>
          </section>

          {/* Section 2: Datos que recopilamos */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Database className="w-5 h-5 text-emerald-500" />
              <h2>2. Información que Recopilamos</h2>
            </div>
            <p>
              Para prestar los servicios de gestión de reservas, agenda y portal web, recopilamos únicamente los datos pertinentes para cada tipo de usuario:
            </p>
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Clientes que agendan citas
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Nombre completo, número de teléfono móvil (utilizado para WhatsApp y validación de reserva), dirección de correo electrónico (opcional), historial de citas, servicio solicitado, barbero seleccionado, fecha y hora de la cita, notas sobre preferencias de corte y código único de reserva asignado por el sistema.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Propietarios y Administradores de Barberías
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Nombre completo, correo electrónico de acceso, número de teléfono comercial, nombre de la barbería, dirección física, horarios de atención, logotipo del establecimiento, configuración de servicios y tarifas, y contraseñas protegidas mediante algoritmos de hash unidireccionales.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Barberos y Profesionales
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Nombre profesional, número de teléfono, correo de invitación/acceso, especialidad, porcentaje o esquema de comisión asignado, fotografía de perfil profesional y horarios de disponibilidad semanal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" /> Datos técnicos y de navegación
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Dirección IP de origen, registros del servidor (logs de acceso y errores), tipo de navegador, sistema operativo y tokens de sesión criptográficos almacenados mediante cookies técnicas estrictamente necesarias con atributo HttpOnly.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Finalidades del tratamiento */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Bell className="w-5 h-5 text-emerald-500" />
              <h2>3. Finalidades del Tratamiento</h2>
            </div>
            <p>
              La información recopilada es tratada exclusivamente para los siguientes fines operacionales y contractuales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Coordinación, programación y control de la agenda de citas en tiempo real.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Envío de confirmaciones, recordatorios y reprogramaciones automáticas vía WhatsApp.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Cálculo transparente de comisiones por servicio para cada barbero del salón.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Gestión de caja, arqueo de turnos y registro contable de cobros.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Autenticación segura y prevención de accesos no autorizados a las cuentas.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Atención de soporte técnico y resolución de incidencias en la plataforma.</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
              <strong className="text-zinc-950 dark:text-white">Compromiso Antispam:</strong> BarberOS no vende, no alquila y no comparte bases de datos de clientes con intermediarios publicitarios, agencias de telemercadeo ni plataformas de terceros ajenas al servicio.
            </p>
          </section>

          {/* Section 4: Almacenamiento y Protección */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Lock className="w-5 h-5 text-emerald-500" />
              <h2>4. Almacenamiento y Medidas de Protección</h2>
            </div>
            <p>
              Implementamos controles técnicos, organizacionales y criptográficos acordes con los más altos estándares tecnológicos:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Cifrado en tránsito y en reposo:</strong> Todo el tráfico entre tu navegador y nuestros servidores viaja cifrado bajo protocolo HTTPS/TLS con certificados SSL modernos de 256 bits.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Hash irreversible de contraseñas:</strong> Las credenciales de acceso se almacenan utilizando algoritmos de derivación de claves seguros (bcrypt), impidiendo su lectura en texto plano.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Sesiones firmadas con JWT:</strong> La autenticación utiliza tokens criptográficos efímeros (JSON Web Tokens) transmitidos mediante cookies protegidas con atributos HttpOnly, Secure y SameSite=Lax.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Aislamiento de datos multi-tenant:</strong> La base de datos aplica separación estricta a nivel de consulta mediante identificadores únicos por barbería, garantizando la confidencialidad total entre negocios.
              </li>
            </ul>
          </section>

          {/* Section 5: Proveedores externos y servicios de terceros */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Server className="w-5 h-5 text-emerald-500" />
              <h2>5. Proveedores Externos y Servicios de Infraestructura</h2>
            </div>
            <p>
              Para garantizar alta disponibilidad, velocidad y confiabilidad, BarberOS se apoya en los siguientes proveedores tecnológicos de primer nivel:
            </p>
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 shadow-xs">
                <div>
                  <span className="font-bold text-zinc-950 dark:text-white block">Neon Database Inc. (PostgreSQL Serverless)</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Alojamiento de base de datos relacional y respaldos continuos en centros de datos con certificaciones SOC 2 e ISO 27001.</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">Base de datos</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 shadow-xs">
                <div>
                  <span className="font-bold text-zinc-950 dark:text-white block">Vercel Inc.</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Alojamiento de la aplicación web, ejecución de funciones serverless y red de distribución de contenido (CDN global).</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">Infraestructura</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 shadow-xs">
                <div>
                  <span className="font-bold text-zinc-950 dark:text-white block">Cloudinary Ltd.</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Almacenamiento y optimización de logotipos de barberías y fotografías de perfil de barberos.</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">Multimedia</span>
              </div>
            </div>
          </section>

          {/* Section 6: Tratamiento mediante WhatsApp y Meta */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <h2>6. Tratamiento de Información mediante WhatsApp y Meta</h2>
            </div>
            <p>
              BarberOS ofrece a las barberías la posibilidad de conectar su canal de WhatsApp (mediante la API oficial de Meta Cloud o soluciones de emparejamiento):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Envío de notificaciones transaccionales:</strong> El número telefónico del cliente se utiliza para enviarle confirmaciones, recordatorios de citas y enlaces de autogestión.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Bot interactivo de reservas:</strong> Si el cliente interactúa con el número de WhatsApp de la barbería, el sistema procesa los mensajes entrantes para consultar disponibilidad y agendar turnos.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Políticas de Meta:</strong> Al utilizar la integración con Meta, el tratamiento de metadatos se rige adicionalmente por las políticas oficiales de Meta Platforms Inc.
              </li>
            </ul>
          </section>

          {/* Section 7: Derechos de los Titulares */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Eye className="w-5 h-5 text-emerald-500" />
              <h2>7. Derechos de los Titulares de Datos (Habeas Data / ARCO)</h2>
            </div>
            <p>
              En cualquier momento, como titular de tus datos personales tienes derecho a:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                <h4 className="font-bold text-zinc-950 dark:text-white mb-1">Acceso y Consulta</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Conocer qué información personal se encuentra registrada y tratada en nuestros sistemas.</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                <h4 className="font-bold text-zinc-950 dark:text-white mb-1">Rectificación y Actualización</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Solicitar la corrección de datos inexactos, incompletos, desactualizados o erróneos.</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                <h4 className="font-bold text-zinc-950 dark:text-white mb-1">Supresión y Eliminación</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Pedir la eliminación de tus datos personales cuando no exista un deber legal o contractual de conservarlos.</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                <h4 className="font-bold text-zinc-950 dark:text-white mb-1">Revocación del Consentimiento</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Retirar en cualquier momento la autorización otorgada para el tratamiento de tus datos.</p>
              </div>
            </div>
          </section>

          {/* Section 8: Procedimiento y Tiempos de Respuesta */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h2>8. Procedimiento para Consultas, Corrección y Eliminación</h2>
            </div>
            <p>
              Para ejercer cualquiera de tus derechos, puedes presentar una solicitud formal a través de nuestros canales oficiales:
            </p>
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-2 shadow-xs">
              <p>
                <span className="text-zinc-500 dark:text-zinc-400">Canal de atención:</span>{' '}
                <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Canales oficiales de soporte y contacto de BarberOS</span>
              </p>
              <p>
                <span className="text-zinc-500 dark:text-zinc-400">Requisitos de la solicitud:</span> Indicar nombre completo, número de teléfono registrado, descripción clara del derecho que deseas ejercer y detalles de la consulta.
              </p>
              <p>
                <span className="text-zinc-500 dark:text-zinc-400">Plazo máximo de respuesta:</span> Máximo quince (15) días hábiles a partir de la recepción completa de la solicitud.
              </p>
            </div>
          </section>

          {/* Section 9: Tiempo de Conservación */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <FileText className="w-5 h-5 text-emerald-500" />
              <h2>9. Tiempo de Conservación de los Datos</h2>
            </div>
            <p>
              Conservamos los datos personales únicamente durante el tiempo estrictamente necesario para cumplir las finalidades descritas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>Los datos de cuentas de usuarios y barberías se conservan mientras la cuenta permanezca activa en la plataforma.</li>
              <li>Los registros de citas y arqueos de caja se mantienen por el período necesario para cumplimiento de obligaciones comerciales y de auditoría.</li>
              <li>Al finalizar la relación o solicitarse la baja, los datos serán eliminados o anonimizados de forma segura conforme a la normativa vigente.</li>
            </ul>
          </section>

          {/* Section 10: Transferencias Internacionales */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <ExternalLink className="w-5 h-5 text-emerald-500" />
              <h2>10. Transferencias y Transmisiones Internacionales de Datos</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Al utilizar infraestructura en la nube provista por empresas internacionales como Vercel Inc. y Neon Database Inc., tus datos personales pueden ser transmitidos y almacenados en centros de datos ubicados en los Estados Unidos de América. Dichos proveedores cumplen con rigurosos marcos de seguridad técnica, física y regulatoria homologables a los estándares internacionales de protección de datos personales.
            </p>
          </section>

          {/* Section 11: Contacto */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Mail className="w-5 h-5 text-emerald-500" />
              <h2>11. Contacto para Dudas o Reclamaciones</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Si tienes preguntas sobre esta Política de Privacidad o consideras que tus datos han sido tratados de forma indebida, por favor comunícate a través de los canales oficiales de atención y soporte disponibles en BarberOS.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} BarberOS. Plataforma integral de gestión para barberías.</p>
          <div className="flex items-center gap-4">
            <Link href="/terminos-y-condiciones" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Términos y Condiciones
            </Link>
            <span>•</span>
            <Link href="/politica-de-cookies" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
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
