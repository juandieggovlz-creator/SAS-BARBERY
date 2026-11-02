'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Scissors, 
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
  AlertTriangle,
  ExternalLink,
  Cookie
} from 'lucide-react'

export default function PoliticaPrivacidadPage() {
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

      {/* Cross Navigation Bar */}
      <nav className="border-b border-zinc-800/50 bg-zinc-900/40">
        <div className="max-w-5xl mx-auto px-5 py-2.5 flex items-center gap-3 overflow-x-auto text-xs font-semibold">
          <Link
            href="/terminos-y-condiciones"
            className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Términos y Condiciones
          </Link>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            Política de Privacidad
          </span>
          <Link
            href="/politica-de-cookies"
            className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Política de Cookies
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-12">
        {/* Title & Metadata */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Tratamiento de Datos Personales
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-sm text-zinc-400 font-medium">
            Fecha de última actualización: <span className="text-zinc-200">2 de noviembre de 2026</span> • Versión 1.0
          </p>
        </div>

        {/* Legal Disclaimer / Notice for Customization */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Aviso importante de personalización legal:</p>
            <p>
              Este documento describe fielmente la arquitectura técnica, flujo de datos y medidas de seguridad de la plataforma BarberOS. Los campos señalados entre corchetes <span className="font-mono bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-200">[COMO ESTE]</span> deben completarse con los datos del titular o empresa operadora antes de la publicación definitiva.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          
          {/* Section 1: Identificación del Responsable */}
          <section className="space-y-3 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2>1. Identificación del Responsable del Tratamiento</h2>
            </div>
            <p>
              La plataforma tecnológica <strong className="text-white">BarberOS</strong> es operada por el siguiente responsable:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Razón Social / Operador:</span>
                <span className="font-mono text-amber-400 font-semibold">[NOMBRE O RAZÓN SOCIAL DEL RESPONSABLE]</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Identificación Tributaria:</span>
                <span className="font-mono text-amber-400 font-semibold">[NIT / RUT / CÉDULA DEL RESPONSABLE]</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Domicilio Principal:</span>
                <span className="font-mono text-amber-400 font-semibold">[DIRECCIÓN, CIUDAD Y PAÍS DEL RESPONSABLE]</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Correo Electrónico de Contacto Legal:</span>
                <span className="font-mono text-amber-400 font-semibold">[CORREO ELECTRÓNICO OFICIAL DE CONTACTO LEGAL]</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 pt-2">
              Cuando un cliente agenda una cita en una barbería específica mediante el subdominio o enlace de la barbería, la barbería actúa como responsable directo de la relación comercial, y BarberOS actúa como encargado tecnológico del tratamiento y almacenamiento de la información.
            </p>
          </section>

          {/* Section 2: Datos que recopilamos */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2>2. Información que Recopilamos</h2>
            </div>
            <p>
              Para prestar los servicios de gestión de reservas, agenda y portal web, recopilamos únicamente los datos pertinentes para cada tipo de usuario:
            </p>
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Clientes que agendan citas
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Nombre completo, número de teléfono móvil (utilizado para WhatsApp y validación de reserva), dirección de correo electrónico (opcional), historial de citas, servicio solicitado, barbero seleccionado, fecha y hora de la cita, notas sobre preferencias de corte y código único de reserva asignado por el sistema.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Propietarios y Administradores de Barberías
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Nombre completo, correo electrónico de acceso, número de teléfono/WhatsApp comercial, nombre de la barbería, dirección física, horarios de atención, logotipo del establecimiento, configuración de servicios y tarifas, y contraseñas protegidas mediante algoritmos de hash unidireccionales.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Barberos y Profesionales
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Nombre profesional, número de teléfono, correo de invitación/acceso, especialidad, porcentaje o esquema de comisión asignado, fotografía de perfil profesional y horarios de disponibilidad semanal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" /> Datos técnicos y de navegación
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Dirección IP de origen, registros del servidor (logs de acceso y errores), tipo de navegador, sistema operativo y tokens de sesión criptográficos almacenados mediante cookies técnicas estrictamente necesarias con atributo HttpOnly.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Finalidades del tratamiento */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Bell className="w-5 h-5 text-emerald-400" />
              <h2>3. Finalidades del Tratamiento</h2>
            </div>
            <p>
              La información recopilada es tratada exclusivamente para los siguientes fines operacionales y contractuales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Coordinación, programación y control de la agenda de citas en tiempo real.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Envío de confirmaciones, recordatorios y reprogramaciones automáticas vía WhatsApp.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Cálculo transparente de comisiones por servicio para cada barbero del salón.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Gestión de caja, arqueo de turnos y registro contable de cobros.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Autenticación segura y prevención de accesos no autorizados a las cuentas.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">Atención de soporte técnico y resolución de incidencias en la plataforma.</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 pt-2">
              <strong className="text-white">Compromiso Antispam:</strong> BarberOS no vende, no alquila y no comparte bases de datos de clientes con intermediarios publicitarios, agencias de telemercadeo ni plataformas de terceros ajenas al servicio.
            </p>
          </section>

          {/* Section 4: Almacenamiento y Protección */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2>4. Almacenamiento y Medidas de Protección</h2>
            </div>
            <p>
              Implementamos controles técnicos, organizacionales y criptográficos acordes con el estado del arte tecnológico:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400 text-xs">
              <li>
                <strong className="text-zinc-200">Cifrado en tránsito y en reposo:</strong> Todo el tráfico entre tu navegador y nuestros servidores viaja cifrado bajo protocolo HTTPS/TLS con certificados SSL de 256 bits.
              </li>
              <li>
                <strong className="text-zinc-200">Hash irreversible de contraseñas:</strong> Las credenciales de acceso se almacenan utilizando la función criptográfica segura bcrypt con factor de costo 10+, impidiendo su lectura incluso en caso de acceso no autorizado a la base de datos.
              </li>
              <li>
                <strong className="text-zinc-200">Sesiones firmadas con JWT:</strong> La autenticación utiliza tokens criptográficos efímeros (JSON Web Tokens) firmados con secretos seguros de 256 bits, transmitidos mediante cookies protegidas con las banderas HttpOnly, Secure y SameSite=Lax.
              </li>
              <li>
                <strong className="text-zinc-200">Aislamiento de datos multi-tenant:</strong> La base de datos aplica separación estricta a nivel de consulta mediante identificadores únicos por barbería (<code className="font-mono text-emerald-400">businessId</code>), evitando cualquier mezcla de información entre diferentes negocios.
              </li>
            </ul>
          </section>

          {/* Section 5: Proveedores externos y servicios de terceros */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Server className="w-5 h-5 text-emerald-400" />
              <h2>5. Proveedores Externos y Servicios de Infraestructura</h2>
            </div>
            <p>
              Para garantizar alta disponibilidad, velocidad y confiabilidad, BarberOS se apoya en los siguientes proveedores tecnológicos de primer nivel que actúan como encargados del tratamiento:
            </p>
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-white block">Neon Database Inc. (PostgreSQL Serverless)</span>
                  <span className="text-zinc-400">Alojamiento de la base de datos relacional y respaldos automatizados continuos (EE. UU., centros de datos certificados SOC 2 / ISO 27001).</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded shrink-0">Base de datos</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-white block">Vercel Inc.</span>
                  <span className="text-zinc-400">Alojamiento de la aplicación web, ejecución de funciones serverless y red de distribución de contenido (CDN global).</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded shrink-0">Infraestructura</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-white block">Cloudinary Ltd.</span>
                  <span className="text-zinc-400">Almacenamiento y optimización de logotipos de barberías y fotografías de perfil de barberos.</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded shrink-0">Multimedia</span>
              </div>
            </div>
          </section>

          {/* Section 6: Tratamiento mediante WhatsApp y Meta */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h2>6. Tratamiento de Información mediante WhatsApp y Meta</h2>
            </div>
            <p>
              BarberOS ofrece a las barberías la posibilidad de conectar su canal de WhatsApp (mediante la API oficial de Meta Cloud o soluciones de emparejamiento por código QR):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400 text-xs">
              <li>
                <strong className="text-zinc-200">Envío de notificaciones transaccionales:</strong> El número de teléfono proporcionado por el cliente al reservar se utiliza exclusivamente para enviarle el mensaje de confirmación, recordatorio previo y enlace de gestión de su cita.
              </li>
              <li>
                <strong className="text-zinc-200">Bot interactivo de reservas:</strong> Si el cliente inicia una conversación por WhatsApp con la barbería, el sistema interactivo procesa los mensajes entrantes para consultar la disponibilidad de servicios y turnos, guiándolo en el agendamiento.
              </li>
              <li>
                <strong className="text-zinc-200">Políticas de Meta:</strong> Cuando se utiliza la integración oficial de Meta Cloud API, la transmisión de mensajes se sujeta a las condiciones y políticas de privacidad de Meta Platforms Inc., quien procesa los metadatos de telecomunicación bajo sus propios estándares regulatorios.
              </li>
            </ul>
          </section>

          {/* Section 7: Derechos de los Titulares */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Eye className="w-5 h-5 text-emerald-400" />
              <h2>7. Derechos de los Titulares de Datos (Habeas Data / ARCO)</h2>
            </div>
            <p>
              En cualquier momento, como titular de los datos personales tienes derecho a:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <h4 className="font-bold text-white mb-1">Acceso y Consulta</h4>
                <p className="text-zinc-400">Conocer qué información personal se encuentra registrada y tratada en nuestros sistemas.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <h4 className="font-bold text-white mb-1">Rectificación y Actualización</h4>
                <p className="text-zinc-400">Solicitar la corrección de datos inexactos, incompletos, desactualizados o erróneos.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <h4 className="font-bold text-white mb-1">Supresión y Eliminación</h4>
                <p className="text-zinc-400">Pedir la eliminación total de tus datos personales cuando no subsista un deber legal o contractual de conservarlos.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <h4 className="font-bold text-white mb-1">Revocación del Consentimiento</h4>
                <p className="text-zinc-400">Retirar la autorización otorgada para el tratamiento de tus datos personales.</p>
              </div>
            </div>
          </section>

          {/* Section 8: Procedimiento y Tiempos de Respuesta */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h2>8. Procedimiento para Consultas, Corrección y Eliminación</h2>
            </div>
            <p>
              Para ejercer cualquiera de tus derechos, puedes presentar una solicitud formal enviando un correo electrónico a nuestro canal de privacidad:
            </p>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-2">
              <p>
                <span className="text-zinc-400">Canal oficial de atención:</span>{' '}
                <span className="font-mono text-emerald-400 font-bold">[CORREO ELECTRÓNICO OFICIAL DE PRIVACIDAD]</span>
              </p>
              <p>
                <span className="text-zinc-400">Requisitos de la solicitud:</span> Indicar nombre completo, número de documento o teléfono registrado, descripción clara del derecho que deseas ejercer y documentos de respaldo si aplica.
              </p>
              <p>
                <span className="text-zinc-400">Plazo máximo de respuesta:</span> Máximo quince (15) días hábiles a partir del día siguiente a la recepción completa de la solicitud.
              </p>
            </div>
          </section>

          {/* Section 9: Tiempo de Conservación */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2>9. Tiempo de Conservación de los Datos</h2>
            </div>
            <p>
              Conservamos los datos personales únicamente durante el tiempo estrictamente necesario para cumplir las finalidades mencionadas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs">
              <li>Los datos de cuentas de usuarios y barberías se conservan mientras la cuenta permanezca activa.</li>
              <li>Los registros de citas y arqueos de caja se mantienen por el período necesario para cumplimiento de obligaciones tributarias, comerciales o de auditoría.</li>
              <li>Al finalizar la relación contractual o solicitarse la baja, los datos serán eliminados o anonimizados de forma segura conforme a la ley aplicable.</li>
            </ul>
          </section>

          {/* Section 10: Transferencias Internacionales */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <ExternalLink className="w-5 h-5 text-emerald-400" />
              <h2>10. Transferencias y Transmisiones Internacionales de Datos</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Al utilizar infraestructura en la nube provista por empresas internacionales como Vercel Inc. y Neon Database Inc., tus datos personales pueden ser transmitidos y almacenados en centros de datos ubicados en los Estados Unidos de América. Dichos proveedores cumplen con rigurosos marcos de seguridad técnica, física y regulatoria homologables a los estándares internacionales de protección de datos personales.
            </p>
          </section>

          {/* Section 11: Contacto */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Mail className="w-5 h-5 text-emerald-400" />
              <h2>11. Contacto para Dudas o Reclamaciones</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Si tienes preguntas sobre esta Política de Privacidad o consideras que tus datos han sido tratados de forma indebida, por favor comunícate a través del canal oficial:{' '}
              <span className="font-mono text-amber-400 font-bold">[CORREO ELECTRÓNICO OFICIAL DE CONTACTO LEGAL]</span>.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} BarberOS. Plataforma integral de gestión para barberías.</p>
          <div className="flex items-center gap-4">
            <Link href="/terminos-y-condiciones" className="hover:text-amber-400 transition-colors">
              Términos y Condiciones
            </Link>
            <span>•</span>
            <Link href="/politica-de-cookies" className="hover:text-emerald-400 transition-colors">
              Política de Cookies
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
