'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Cookie, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  Info,
  Layers, 
  SlidersHorizontal
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function PoliticaCookiesPage() {
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
          <Link
            href="/politica-de-privacidad"
            className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Política de Privacidad
          </Link>
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap font-bold">
            Política de Cookies
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-12">
        {/* Title & Metadata */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Cookie className="w-3.5 h-3.5" /> Transparencia y Tecnologías de Almacenamiento
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
            Política de Cookies y Almacenamiento Local
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Fecha de última actualización: <span className="text-zinc-800 dark:text-zinc-200">2 de noviembre de 2026</span> • Versión 1.0
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          
          {/* Section 1: Qué son las cookies */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Info className="w-5 h-5 text-amber-500" />
              <h2>1. ¿Qué son las Cookies y el Almacenamiento Local?</h2>
            </div>
            <p>
              Una cookie es un pequeño archivo de texto que un sitio web guarda en tu ordenador o dispositivo móvil cuando lo visitas. El almacenamiento local (<strong className="text-zinc-950 dark:text-white">localStorage</strong>) es una tecnología similar que permite al navegador guardar datos de configuración directamente en tu equipo sin transmitirlos automáticamente en cada petición de red.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Estas herramientas permiten que la aplicación recuerde si has iniciado sesión, tu barbería activa, tus preferencias de color o tema, y garantizan una navegación fluida y segura.
            </p>
          </section>

          {/* Section 2: Qué tecnologías utiliza REALMENTE BarberOS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Layers className="w-5 h-5 text-amber-500" />
              <h2>2. Tecnologías de Almacenamiento que Utiliza Realmente BarberOS</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              En BarberOS aplicamos un principio de minimización: <strong className="text-zinc-900 dark:text-zinc-200">solo utilizamos los datos técnicos estrictamente necesarios para hacer funcionar la plataforma</strong> y no incorporamos rastreadores publicitarios invasivos.
            </p>

            <div className="space-y-3 pt-2">
              {/* Category A: Cookies estrictamente necesarias */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider">
                      A. Cookies Técnicas y Estrictamente Necesarias (Siempre Activas)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Obligatorias
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Son indispensables para que la plataforma funcione de forma segura. Sin ellas, no podrías iniciar sesión en tu panel de dueño o barbero ni navegar por las páginas protegidas. No requieren consentimiento según la legislación aplicable.
                </p>

                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                        <th className="py-2 pr-3 font-bold">Nombre</th>
                        <th className="py-2 px-3 font-bold">Tipo / Mecanismo</th>
                        <th className="py-2 px-3 font-bold">Propósito</th>
                        <th className="py-2 pl-3 font-bold">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono text-zinc-800 dark:text-zinc-300">
                      <tr>
                        <td className="py-2 pr-3 text-amber-600 dark:text-amber-400 font-bold">owner_session</td>
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">Cookie HttpOnly (JWT)</td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-sans">Autenticación segura del Propietario / Administrador de la barbería.</td>
                        <td className="py-2 pl-3 text-zinc-500 dark:text-zinc-400">7 días</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-3 text-amber-600 dark:text-amber-400 font-bold">barber_session</td>
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">Cookie HttpOnly (JWT)</td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-sans">Autenticación del Barbero profesional a su panel de turnos.</td>
                        <td className="py-2 pl-3 text-zinc-500 dark:text-zinc-400">7 días</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-3 text-amber-600 dark:text-amber-400 font-bold">session</td>
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">Cookie HttpOnly (JWT)</td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-sans">Sesión general de superadministrador o acceso temporal.</td>
                        <td className="py-2 pl-3 text-zinc-500 dark:text-zinc-400">Sesión / 7 días</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category B: Almacenamiento Local (Preferencias) */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider">
                      B. Almacenamiento Local de Preferencias (localStorage)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Personalización
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Datos que se guardan en el navegador para recordar tus opciones visuales y no perder tus personalizaciones al recargar:
                </p>

                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                        <th className="py-2 pr-3 font-bold">Clave</th>
                        <th className="py-2 px-3 font-bold">Tecnología</th>
                        <th className="py-2 px-3 font-bold">Propósito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono text-zinc-800 dark:text-zinc-300">
                      <tr>
                        <td className="py-2 pr-3 text-blue-600 dark:text-blue-400 font-bold">barberos-theme</td>
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">localStorage</td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-sans">Recuerda si seleccionaste tema visual claro u oscuro.</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-3 text-blue-600 dark:text-blue-400 font-bold">barberos_accent_color</td>
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">localStorage</td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-sans">Guarda la paleta de color personalizada de tu barbería (ámbar, azul, esmeralda, etc.).</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-3 text-blue-600 dark:text-blue-400 font-bold">barberos_cookie_consent</td>
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">localStorage</td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-sans">Guarda la elección de consentimiento de cookies para no repetir el aviso inicial.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category C: Cookies analíticas y publicitarias */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider">
                      C. Cookies Analíticas, Publicitarias o de Terceros
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Opcionales
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                  <p className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Declaración de Transparencia de BarberOS:
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Actualmente BarberOS <strong className="text-zinc-900 dark:text-zinc-200">NO incluye Google Analytics, Meta Pixel ni herramientas de rastreo publicitario de terceros</strong> en el código de producción. Si en el futuro se habilitaran métricas opcionales de telemetría de rendimiento, estarán sujetas estrictamente a tu autorización previa mediante nuestro banner de consentimiento.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Cómo administrar preferencias */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <SlidersHorizontal className="w-5 h-5 text-amber-500" />
              <h2>3. Cómo Administrar o Retirar tu Consentimiento</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Puedes modificar o retirar tu consentimiento sobre cookies en cualquier momento eliminando los datos almacenados en tu navegador o configurando las preferencias de privacidad del mismo. Consulta la sección 4 de este documento para instrucciones detalladas según tu navegador.
            </p>
          </section>

          {/* Section 4: Cómo bloquear o eliminar cookies en tu navegador */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
              <Lock className="w-5 h-5 text-amber-500" />
              <h2>4. Desactivación o Eliminación desde el Navegador</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              También puedes restringir, bloquear o borrar las cookies configurando las opciones de privacidad de tu navegador web:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400 text-xs">
              <li><strong className="text-zinc-900 dark:text-zinc-300">Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
              <li><strong className="text-zinc-900 dark:text-zinc-300">Mozilla Firefox:</strong> Opciones &gt; Privacidad y seguridad &gt; Cookies y datos del sitio.</li>
              <li><strong className="text-zinc-900 dark:text-zinc-300">Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
              <li><strong className="text-zinc-900 dark:text-zinc-300">Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos del sitio.</li>
            </ul>
            <p className="text-xs text-amber-600 dark:text-amber-300/90 pt-1">
              * Nota: Si bloqueas completamente las cookies técnicas necesarias en tu navegador, no será posible iniciar sesión ni utilizar los módulos privados de BarberOS.
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
            <Link href="/politica-de-privacidad" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Política de Privacidad
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
