'use client'

import React from 'react'
import LegalLayout from '@/components/legal/LegalLayout'
import { getLegalDocBySlug } from '@/lib/legal-documents'
import {
  Cookie,
  Lock,
  CheckCircle2,
  Info,
  Layers,
  SlidersHorizontal
} from 'lucide-react'

export default function PoliticaCookiesPage() {
  const meta = getLegalDocBySlug('politica-de-cookies')

  return (
    <LegalLayout currentSlug="politica-de-cookies" docMeta={meta}>
      {/* Sections */}
      <div className="space-y-8">
        {/* Section 1: Qué son las cookies */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
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
        <section className="space-y-4 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
            <Layers className="w-5 h-5 text-amber-500" />
            <h2>2. Tecnologías de Almacenamiento que Utiliza Realmente BarberOS</h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            En BarberOS aplicamos un principio de minimización: <strong className="text-zinc-900 dark:text-zinc-200">solo utilizamos los datos técnicos estrictamente necesarios para hacer funcionar la plataforma</strong> y no incorporamos rastreadores publicitarios invasivos.
          </p>

          <div className="space-y-3 pt-2">
            {/* Category A: Cookies estrictamente necesarias */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-xs">
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
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Son indispensables para que puedas navegar por BarberOS y utilizar funciones seguras (iniciar sesión con JWT encriptado, verificar tu rol como dueño o barbero, y mantener el aislamiento de datos entre barberías).
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-mono">
                      <th className="py-2 pr-3">Nombre</th>
                      <th className="py-2 px-3">Propósito</th>
                      <th className="py-2 px-3">Duración</th>
                      <th className="py-2 pl-3">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <td className="py-2.5 pr-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">owner_session</td>
                      <td className="py-2.5 px-3">Token JWT cifrado con la sesión y barbería del propietario o administrador.</td>
                      <td className="py-2.5 px-3">7 días / Persistente</td>
                      <td className="py-2.5 pl-3">HttpOnly, Secure</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">barber_session</td>
                      <td className="py-2.5 px-3">Token JWT cifrado exclusivo para el portal de barberos y citas.</td>
                      <td className="py-2.5 px-3">7 días / Persistente</td>
                      <td className="py-2.5 pl-3">HttpOnly, Secure</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">session</td>
                      <td className="py-2.5 px-3">Cookie de compatibilidad para validaciones auxiliares del middleware.</td>
                      <td className="py-2.5 px-3">Sesión / 7 días</td>
                      <td className="py-2.5 pl-3">HttpOnly, Secure</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category B: Preferencias de interfaz (localStorage) */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="font-bold text-zinc-950 dark:text-white text-xs uppercase tracking-wider">
                    B. Almacenamiento Local de Preferencias (localStorage)
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Funcionales
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Permiten que la interfaz recuerde tus decisiones visuales para que no tengas que reconfigurarlas cada vez que abres la plataforma en el mismo navegador.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-mono">
                      <th className="py-2 pr-3">Clave</th>
                      <th className="py-2 px-3">Propósito</th>
                      <th className="py-2 pl-3">Ámbito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <td className="py-2.5 pr-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">theme</td>
                      <td className="py-2.5 px-3">Preferencia de modo claro u oscuro del dispositivo.</td>
                      <td className="py-2.5 pl-3">Navegador local</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">barberos_accent_color</td>
                      <td className="py-2.5 px-3">Color de acento seleccionado por el usuario en su dashboard.</td>
                      <td className="py-2.5 pl-3">Navegador local</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">barberos_cookie_consent</td>
                      <td className="py-2.5 px-3">Registro de aceptación del aviso de cookies de la plataforma.</td>
                      <td className="py-2.5 pl-3">Navegador local</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Cómo administrar preferencias */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-zinc-950 dark:text-white font-bold text-base">
            <SlidersHorizontal className="w-5 h-5 text-amber-500" />
            <h2>3. Cómo Administrar o Retirar tu Consentimiento</h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Puedes modificar o retirar tu consentimiento sobre cookies en cualquier momento eliminando los datos almacenados en tu navegador o configurando las preferencias de privacidad del mismo. Consulta la sección 4 de este documento para instrucciones detalladas según tu navegador.
          </p>
        </section>

        {/* Section 4: Cómo bloquear o eliminar cookies en tu navegador */}
        <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
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
    </LegalLayout>
  )
}
