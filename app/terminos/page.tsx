'use client'

import React from 'react'
import Link from 'next/link'
import { Scissors, ShieldCheck, ArrowLeft, Calendar, UserCheck, CreditCard, AlertCircle } from 'lucide-react'

export default function TerminosPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Marco Legal y Condiciones
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Términos y Condiciones del Servicio
          </h1>
          <p className="text-sm text-zinc-400 font-medium">
            Última actualización: Noviembre 2026 • Válido para la República de Colombia y usuarios internacionales de la plataforma BarberOS.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Al registrar una barbería, operar como barbero o agendar una cita mediante BarberOS (web o WhatsApp), aceptas estos Términos en su totalidad. Si representas a una persona jurídica o establecimiento de comercio, garantizas contar con la personería suficiente para vincularlo legalmente.
          </p>
        </div>

        {/* Artículos de Términos */}
        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs flex items-center justify-center font-mono">1</span>
              Naturaleza y Objeto de BarberOS
            </h2>
            <p>
              BarberOS es una plataforma tecnológica SaaS (Software as a Service) diseñada para la gestión operativa, agenda digital, control de comisiones y atención interactiva de barberías y salones de belleza. BarberOS actúa como facilitador tecnológico entre el establecimiento (Dueño), sus profesionales (Barberos) y los usuarios finales (Clientes). BarberOS no presta directamente servicios de peluquería ni estética.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs flex items-center justify-center font-mono">2</span>
              Cuentas, Roles y Responsabilidad de Seguridad
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Propietario (Owner):</strong> Responsable legal de la exactitud de los datos de su barbería, precios de servicios, vinculación de barberos y custodia de sus credenciales.
              </p>
              <p>
                <strong>Barbero:</strong> Usuario profesional con acceso exclusivo a su agenda, control de disponibilidad y cálculo de sus comisiones generadas. El barbero no podrá acceder a estados financieros globales de la barbería.
              </p>
              <p>
                Cada usuario es el único custodio de su contraseña o enlace de acceso. Toda acción realizada desde una sesión autenticada se presume ejecutada por su titular.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs flex items-center justify-center font-mono">3</span>
              Políticas de Reservas, Puntualidad y Cancelación
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                  <Calendar className="w-4 h-4" /> Tolerancia de Llegada
                </div>
                <p className="text-xs text-zinc-400">
                  El cliente dispone de una tolerancia máxima de 10 minutos respecto a la hora agendada. Pasado este lapso, el barbero podrá disponer del turno para respetar la agenda de los demás clientes.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                  <UserCheck className="w-4 h-4" /> Cancelación Oportuna
                </div>
                <p className="text-xs text-zinc-400">
                  Las citas podrán cancelarse o reprogramarse sin penalidad con un preaviso mínimo de 1 hora mediante la página web de reservas o el canal oficial de WhatsApp del negocio.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs flex items-center justify-center font-mono">4</span>
              Precios, Pagos y Facturación
            </h2>
            <p>
              Los precios de cada servicio publicados en la página web y en el bot interactivo son fijados autónomamente por cada barbería en moneda de curso legal (COP / USD según configuración). El pago se efectúa directamente en el establecimiento mediante los medios acordados (efectivo, datáfono o transferencias digitales), salvo acuerdos de reserva prepagada habilitados expresamente por el negocio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs flex items-center justify-center font-mono">5</span>
              Disponibilidad de la Plataforma e Integraciones Externas
            </h2>
            <p>
              BarberOS procura una disponibilidad superior al 99% mediante infraestructura en la nube. No obstante, el servicio puede experimentar interrupciones programadas por mantenimiento o fallas imputables a proveedores de terceros (Meta Cloud API, WhatsApp, redes de telecomunicaciones o servicios de DNS). BarberOS no responderá por lucro cesante derivado de fallas técnicas externas imprevistas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs flex items-center justify-center font-mono">6</span>
              Ley Aplicable y Resolución de Controversias
            </h2>
            <p>
              Estos Términos se rigen e interpretan de conformidad con las leyes de la República de Colombia, en especial el Código de Comercio y la Ley 1480 de 2011 (Estatuto del Consumidor) en lo que resulte aplicable. Cualquier controversia será resuelta preferentemente mediante mecanismos de arreglo directo o centros de conciliación autorizados.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} BarberOS. Plataforma SaaS multiempresa.</p>
          <div className="flex items-center gap-4 font-semibold text-zinc-400">
            <Link href="/privacidad" className="hover:text-amber-400 transition-colors">
              Política de Privacidad
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
