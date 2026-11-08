'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  DollarSign,
  UserCheck,
  LayoutDashboard,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Scissors,
  Receipt,
  Layers,
  ChevronRight,
  Check,
  Smartphone,
  Star,
  Users,
  MessageSquare,
  Lock,
  Wallet,
  Building2,
  FileSpreadsheet
} from 'lucide-react'

interface ShowcaseTab {
  id: string
  label: string
  shortTitle: string
  icon: React.ComponentType<{ className?: string }>
  headline: string
  description: string
  badgeText: string
  metrics: { label: string; value: string }[]
  bullets: string[]
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'agenda',
    label: 'Agenda Inteligente',
    shortTitle: 'Agenda Multi-Barbero',
    icon: Calendar,
    headline: 'Agenda sincronizada en tiempo real sin solapamientos',
    description: 'Visualiza a todo tu equipo en columnas dinámicas. Cada barbero tiene sus tiempos exactos por servicio, pausas de almuerzo y descansos configurados sin llamadas ni desorden.',
    badgeText: 'Control de Turnos en Vivo',
    metrics: [
      { label: 'Citas al día', value: '45+ turnos' },
      { label: 'Tiempo ahorrado', value: '3h diarias' },
      { label: 'Conflictos', value: '0 cruces' }
    ],
    bullets: [
      'Bloqueo instantáneo de horarios con un solo clic',
      'Sincronización en vivo con las reservas de tus clientes',
      'Alertas sonoras y visuales cuando entra una nueva cita'
    ]
  },
  {
    id: 'dashboard',
    label: 'Dashboard Dueño',
    shortTitle: 'Control Administrativo',
    icon: LayoutDashboard,
    headline: 'Control total de ingresos, métricas y equipo en una sola pantalla',
    description: 'Toma decisiones con números reales. Supervisa la facturación del día, el rendimiento de cada barbero y el estado de tu negocio desde cualquier dispositivo.',
    badgeText: 'Mando Central del Negocio',
    metrics: [
      { label: 'Facturación hoy', value: '$1.840.000' },
      { label: 'Barberos activos', value: '3 en turno' },
      { label: 'Ocupación', value: '94% sillones' }
    ],
    bullets: [
      'Ingresos desglosados por efectivo, transferencias y datáfono',
      'Indicador en vivo de barberos disponibles y ocupados',
      'Historial de auditoría para evitar citas borradas sin rastro'
    ]
  },
  {
    id: 'finanzas',
    label: 'Caja & Comisiones',
    shortTitle: 'Cierre de Caja Ciego',
    icon: DollarSign,
    headline: 'Cierre de caja ciego y cálculo exacto de comisiones',
    description: 'Elimina las fugas de dinero y los cuadernos arrugados. Cada servicio liquida automáticamente su comisión y el arqueo de caja cuadra al centavo con los métodos de pago.',
    badgeText: 'Auditoría Anti-Fugas',
    metrics: [
      { label: 'Descuadre caja', value: '$0 COP' },
      { label: 'Comisiones', value: '100% exactas' },
      { label: 'Liquidación', value: '1 solo clic' }
    ],
    bullets: [
      'Arqueo ciego para que la recepción cuente sin ver el sistema',
      'Liquidación automática según el porcentaje pactado con cada barbero',
      'Registro de egresos operativos para calcular utilidad neta'
    ]
  },
  {
    id: 'barbero',
    label: 'Portal del Barbero',
    shortTitle: 'Acceso Barbero',
    icon: UserCheck,
    headline: 'Cada barbero con su enlace privado y control de turnos',
    description: 'Motiva a tu equipo dándoles acceso directo a su agenda y comisiones del día sin revelar información financiera confidencial de la empresa.',
    badgeText: 'Autonomía y Transparencia',
    metrics: [
      { label: 'Transparencia', value: '100% clara' },
      { label: 'Acceso privado', value: 'PIN / Link' },
      { label: 'Motivación', value: '+35% ventas' }
    ],
    bullets: [
      'Enlace único personal que funciona en cualquier celular',
      'Gestión de estados: Cliente en camino, En sillón, Terminado',
      'Historial de propinas y comisiones acumuladas en tiempo real'
    ]
  },
  {
    id: 'webpage',
    label: 'Página Web Oficial',
    shortTitle: 'Página de Reservas',
    icon: Globe,
    headline: 'Tu propia página web profesional autogenerada al instante',
    description: 'Tus clientes reservan 24/7 desde un portal con tu logo, fotos de trabajos, catálogo de servicios y mapa de ubicación. Olvídate de pagar páginas web costosas.',
    badgeText: 'Presencia Digital 24/7',
    metrics: [
      { label: 'Disponibilidad', value: '24/7 online' },
      { label: 'Pasos reserva', value: 'Solo 3 clics' },
      { label: 'Costo extra', value: '$0 incluido' }
    ],
    bullets: [
      'Enlace personalizado listo para tu bio de Instagram y WhatsApp',
      'Clientes escogen su barbero preferido y horario disponible',
      'Confirmación digital instantánea con recordatorio automático'
    ]
  }
]

// ─────────────────────────────────────────────────────────────
// 1. COMPONENTE: VISTA AGENDA INTELIGENTE (HIGH-DPI REACT UI)
// ─────────────────────────────────────────────────────────────
function AgendaView() {
  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between text-left select-none font-sans bg-[#090b10] text-zinc-100 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">Agenda Multi-Barbero</h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                3 en Turno
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Martes, 7 de Noviembre · Sede Principal El Poblado</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase font-bold text-zinc-400">Proyección Hoy</p>
            <p className="text-xs font-black text-amber-400 font-mono">$1.840.000 COP</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all">
            <span>+ Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Grid of Barbers & Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
        {/* Column 1: Carlos Ruiz */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">
                CR
              </div>
              <div>
                <p className="text-xs font-bold text-white">Carlos Ruiz</p>
                <p className="text-[10px] text-zinc-400">Sillón 1 · Master Fade</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">40% com.</span>
          </div>

          {/* Appointment 1 - Active */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono font-bold text-emerald-400">09:00 - 09:45</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[9px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                EN SILLÓN
              </span>
            </div>
            <p className="text-xs font-bold text-white">Andrés Gómez (VIP)</p>
            <div className="flex items-center justify-between text-[11px] text-zinc-300">
              <span>Degradado + Barba Ritual</span>
              <span className="font-black font-mono text-emerald-400">$45.000</span>
            </div>
          </div>

          {/* Appointment 2 - Upcoming */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-zinc-400">10:00 - 10:40</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold text-[9px]">
                WhatsApp ✓
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-200">Camilo Valencia</p>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Corte Clásico a Tijera</span>
              <span className="font-black font-mono text-white">$32.000</span>
            </div>
          </div>

          {/* Slot Available */}
          <div className="p-2.5 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center cursor-pointer hover:bg-amber-500/10 transition-colors">
            <span className="text-[11px] font-bold text-amber-400">+ 11:00 AM · Turno Libre</span>
          </div>
        </div>

        {/* Column 2: Mateo Valencia */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-black flex items-center justify-center">
                MV
              </div>
              <div>
                <p className="text-xs font-bold text-white">Mateo Valencia</p>
                <p className="text-[10px] text-zinc-400">Sillón 2 · Texturizado</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">40% com.</span>
          </div>

          {/* Appointment 1 */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono font-bold text-emerald-400">09:15 - 10:00</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[9px]">
                EN SILLÓN
              </span>
            </div>
            <p className="text-xs font-bold text-white">Luis Martínez</p>
            <div className="flex items-center justify-between text-[11px] text-zinc-300">
              <span>Combo Elite (Corte + Barba)</span>
              <span className="font-black font-mono text-emerald-400">$55.000</span>
            </div>
          </div>

          {/* Appointment 2 */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-zinc-400">10:15 - 11:00</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold text-[9px]">
                Confirmada
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-200">David Restrepo</p>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Corte Urbano Fade</span>
              <span className="font-black font-mono text-white">$30.000</span>
            </div>
          </div>

          {/* Slot Available */}
          <div className="p-2.5 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center cursor-pointer hover:bg-amber-500/10 transition-colors">
            <span className="text-[11px] font-bold text-amber-400">+ 11:15 AM · Turno Libre</span>
          </div>
        </div>

        {/* Column 3: Julián Fade */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center">
                JF
              </div>
              <div>
                <p className="text-xs font-bold text-white">Julián Fade</p>
                <p className="text-[10px] text-zinc-400">Sillón 3 · Color & Spa</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">40% com.</span>
          </div>

          {/* Appointment 1 */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono font-bold text-amber-400">09:00 - 10:15</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[9px]">
                COLORIMETRÍA
              </span>
            </div>
            <p className="text-xs font-bold text-white">Sebastián Mora</p>
            <div className="flex items-center justify-between text-[11px] text-zinc-300">
              <span>Platinado Global + Perfilado</span>
              <span className="font-black font-mono text-amber-400">$110.000</span>
            </div>
          </div>

          {/* Slot Available */}
          <div className="p-2.5 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center cursor-pointer hover:bg-amber-500/10 transition-colors">
            <span className="text-[11px] font-bold text-amber-400">+ 10:30 AM · Turno Libre</span>
          </div>

          {/* Appointment 3 */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-zinc-400">11:00 - 11:45</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold text-[9px]">
                Confirmada
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-200">Alejandro Peña</p>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Arreglo Barba Toalla Caliente</span>
              <span className="font-black font-mono text-white">$28.000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            3 Servicios en Curso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            14 Citas Programadas Hoy
          </span>
        </div>
        <span className="font-mono text-amber-400 font-bold">Sin solapamientos de horario detectados ✓</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. COMPONENTE: VISTA DASHBOARD DUEÑO (ANALYTICS & OPERACIÓN)
// ─────────────────────────────────────────────────────────────
function DashboardView() {
  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between text-left select-none font-sans bg-[#090b10] text-zinc-100 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Centro de Mando Administrativo</h3>
            <p className="text-[11px] text-zinc-400">Métricas en tiempo real · Sede Poblado</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            Hoy, 7 Nov 2026
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <p className="text-[10px] uppercase font-bold text-zinc-400">Ventas Totales Hoy</p>
          <p className="text-xl font-black text-amber-400 font-mono mt-1">$1.840.000</p>
          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">↑ +24.5% vs ayer</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <p className="text-[10px] uppercase font-bold text-zinc-400">Citas Atendidas</p>
          <p className="text-xl font-black text-white font-mono mt-1">38 <span className="text-xs text-zinc-400 font-normal">/ 42</span></p>
          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">90.4% asistencia</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <p className="text-[10px] uppercase font-bold text-zinc-400">Ticket Promedio</p>
          <p className="text-xl font-black text-white font-mono mt-1">$48.420</p>
          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Por servicio</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <p className="text-[10px] uppercase font-bold text-zinc-400">Ocupación Sillones</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">94%</p>
          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">3 de 3 activos</p>
        </div>
      </div>

      {/* Split Section: Leaderboard + Recent Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-2">
        {/* Leaderboard */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
          <p className="text-xs font-bold text-white flex items-center justify-between">
            <span>Rendimiento del Equipo Hoy</span>
            <span className="text-[10px] text-zinc-400">Total Producido</span>
          </p>
          <div className="space-y-2">
            {[
              { name: 'Carlos Ruiz', role: 'Master Barber', turns: 14, val: '$580.000', com: '$232.000' },
              { name: 'Mateo Valencia', role: 'Texturizado', turns: 13, val: '$460.000', com: '$184.000' },
              { name: 'Julián Fade', role: 'Colorimetría', turns: 11, val: '$410.000', com: '$164.000' }
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{b.name}</p>
                    <p className="text-[10px] text-zinc-400">{b.turns} servicios</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white font-mono">{b.val}</p>
                  <p className="text-[10px] text-amber-400 font-mono">Com: {b.com}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
          <p className="text-xs font-bold text-white flex items-center justify-between">
            <span>Pagos Recibidos en Vivo</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado
            </span>
          </p>
          <div className="space-y-2">
            {[
              { client: 'Andrés Gómez', serv: 'Skin Fade + Barba', method: 'Nequi', amount: '$45.000', time: '10:45 AM' },
              { client: 'Luis Martínez', serv: 'Combo Elite VIP', method: 'Datáfono', amount: '$55.000', time: '10:28 AM' },
              { client: 'Sebastián Mora', serv: 'Platinado Global', method: 'Efectivo', amount: '$110.000', time: '09:55 AM' }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                <div>
                  <p className="font-bold text-white leading-tight">{p.client}</p>
                  <p className="text-[10px] text-zinc-400">{p.serv} · <strong className="text-amber-400">{p.method}</strong></p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-400 font-mono">{p.amount}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{p.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. COMPONENTE: VISTA CIERRE DE CAJA CIEGO & COMISIONES
// ─────────────────────────────────────────────────────────────
function FinanzasView() {
  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between text-left select-none font-sans bg-[#090b10] text-zinc-100 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">Cierre de Caja Ciego & Liquidación</h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Anti-Fugas
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Arqueo diario oficial con conciliación bancaria instantánea</p>
          </div>
        </div>

        <button className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
          <span>Imprimir Arqueo PDF</span>
        </button>
      </div>

      {/* Main Comparison: Conteo Ciego vs Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* Left: Conteo en Recepción */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
              1. Conteo Físico en Gaveta (Ciego)
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              Digitado por Recepción
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span className="text-zinc-400">Efectivo físico en gaveta:</span>
              <span className="font-mono font-bold text-white">$840.000 COP</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span className="text-zinc-400">Comprobantes Nequi / Daviplata:</span>
              <span className="font-mono font-bold text-white">$680.000 COP</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span className="text-zinc-400">Vouchers Datáfono Redeban:</span>
              <span className="font-mono font-bold text-white">$320.000 COP</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 font-bold">
              <span className="text-amber-300">Total Físico Contado:</span>
              <span className="font-mono font-black text-amber-400 text-sm">$1.840.000 COP</span>
            </div>
          </div>
        </div>

        {/* Right: Registro BarberOS */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              2. Auditoría BarberOS
            </span>
            <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              100% CONCILIADO
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span className="text-zinc-400">Total Servicios Facturados:</span>
              <span className="font-mono font-bold text-white">$1.840.000 COP</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span className="text-zinc-400">Diferencia de Caja:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">$0 COP (Exacto)</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-0.5">
              <p className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                ✓ CUADRE DE CAJA PERFECTO
              </p>
              <p className="text-[10px] text-emerald-400">Cero faltantes · Cero sobrantes · Cero fugas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Commission Settlement */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
        <p className="text-xs font-bold text-white flex items-center justify-between">
          <span>Liquidación de Comisiones del Día</span>
          <span className="text-[10px] text-amber-400">Pago inmediato con 1 clic</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {[
            { name: 'Carlos Ruiz', split: '40%', pay: '$232.000', status: 'Pagado ✓' },
            { name: 'Mateo Valencia', split: '40%', pay: '$184.000', status: 'Listo para pagar' },
            { name: 'Julián Fade', split: '40%', pay: '$164.000', status: 'Listo para pagar' }
          ].map((barber, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{barber.name}</p>
                <p className="text-[10px] text-zinc-400">Pacto: {barber.split}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-black text-amber-400">{barber.pay}</p>
                <span className="text-[9px] font-bold text-emerald-400">{barber.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 4. COMPONENTE: VISTA PORTAL MÓVIL DEL BARBERO
// ─────────────────────────────────────────────────────────────
function BarberoView() {
  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between text-left select-none font-sans bg-[#090b10] text-zinc-100 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">Portal Móvil Personal del Barbero</h3>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                PIN Privado
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Cada profesional consulta únicamente sus clientes y comisiones</p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Carlos Ruiz (En Turno)
        </span>
      </div>

      {/* Smartphone Mockup Stage */}
      <div className="max-w-md mx-auto w-full my-4 p-4 rounded-3xl bg-[#0f131c] border border-white/15 shadow-2xl space-y-3.5">
        {/* Profile Row */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm border border-amber-500/30">
              CR
            </div>
            <div>
              <p className="text-xs font-bold text-white">Hola, Carlos Ruiz 👋</p>
              <p className="text-[10px] text-zinc-400">Sillón 1 · Master Barber</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-zinc-400">Comisión Hoy</span>
            <p className="text-lg font-black text-amber-400 font-mono">$232.000</p>
          </div>
        </div>

        {/* Current Turn Status */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              Cliente en Sillón Ahora
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
              Termina en 18 min
            </span>
          </div>
          <p className="text-sm font-extrabold text-white">Andrés Gómez (Cliente VIP)</p>
          <p className="text-xs text-zinc-300">Degradado Skin Fade + Barba Ritual ($45.000)</p>
          <div className="p-2 rounded-xl bg-black/40 text-[10px] text-amber-300 border border-amber-500/20">
            📌 <em>Nota: Prefiere navaja en patillas, toalla caliente y sin alcohol en la nuca.</em>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button className="flex-1 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors">
              ✓ Terminar Servicio
            </button>
            <button className="px-3 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-colors">
              + Extra
            </button>
          </div>
        </div>

        {/* Next Turn */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-400">Siguiente a las 10:00 AM</span>
            <p className="text-xs font-bold text-white mt-0.5">Camilo Valencia · Corte a Tijera</p>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-300">$32.000</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
        <span>Información financiera global oculta al barbero ✓</span>
        <span className="text-emerald-400 font-bold">Propinas hoy: +$35.000 COP</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 5. COMPONENTE: VISTA PÁGINA WEB OFICIAL CLIENTES
// ─────────────────────────────────────────────────────────────
function WebpageView() {
  const [selectedService, setSelectedService] = useState(0)
  const [selectedTime, setSelectedTime] = useState('11:30 AM')

  const services = [
    { title: 'Corte Degradado Skin Fade', duration: '40 min', price: '$35.000' },
    { title: 'Barba Ritual & Toalla Caliente', duration: '25 min', price: '$25.000' },
    { title: 'Combo Titán VIP (Corte + Barba + Mascarilla)', duration: '60 min', price: '$55.000' }
  ]

  const times = ['11:30 AM', '12:15 PM', '02:00 PM', '03:30 PM', '04:15 PM']

  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between text-left select-none font-sans bg-[#090b10] text-zinc-100 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">Página Web de Reservas Autogenerada</h3>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Sin Programar
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Tus clientes reservan directamente sin descargar apps</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-zinc-300 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
          barberos.app/b/barberia-elite
        </span>
      </div>

      {/* Simulated Customer Booking Experience */}
      <div className="max-w-2xl mx-auto w-full my-4 space-y-4">
        {/* Barber Header */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 font-black text-base shadow-lg shadow-amber-500/20">
              BE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-white">Barbería Elite Medellín</h4>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Abierto</span>
              </div>
              <p className="text-[11px] text-zinc-400">Calle 10 # 36-24, El Poblado · Medellín</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>4.9</span>
            <span className="text-zinc-500">(240 reseñas)</span>
          </div>
        </div>

        {/* Step 1: Select Service */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
            1. Selecciona tu servicio
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {services.map((s, i) => (
              <div
                key={i}
                onClick={() => setSelectedService(i)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedService === i
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{s.title}</span>
                  {selectedService === i && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px]">
                  <span className="text-zinc-400">{s.duration}</span>
                  <span className="font-mono font-black text-amber-400">{s.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Select Time */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
            2. Horario disponible para hoy
          </p>
          <div className="flex flex-wrap gap-2">
            {times.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedTime === time
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Confirmation Button */}
        <button className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2">
          <span>Confirmar Cita para las {selectedTime}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
        <span>Reserva confirmada en 3 clics directamente al WhatsApp del cliente</span>
        <span className="text-emerald-400 font-bold">100% Autónomo 24/7 ✓</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: SYSTEM SHOWCASE (FLUIDO, SIN BLOQUEO)
// ─────────────────────────────────────────────────────────────
export default function ScrollExpandShowcase() {
  const [activeTab, setActiveTab] = useState<string>('agenda')

  const currentTab = SHOWCASE_TABS.find((t) => t.id === activeTab) || SHOWCASE_TABS[0]

  return (
    <section
      id="sistema"
      className="py-20 md:py-28 relative overflow-hidden bg-white dark:bg-[#06070a] text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
      aria-labelledby="system-showcase-title"
    >
      {/* Background Soft Ambient Light */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="uppercase tracking-wider font-black text-[10px]">Arquitectura BarberOS</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="font-medium text-xs">Simulación en Vivo</span>
          </div>

          <h2
            id="system-showcase-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-white leading-[1.08]"
          >
            Toda tu barbería en un solo{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-100 animate-shiny">
              centro de control.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Interactúa con los módulos reales que transformarán tu barbería en un negocio organizado, transparente y altamente rentable.
          </p>
        </motion.div>

        {/* Tab Selector Bar */}
        <div className="flex justify-center mb-10">
          <div className="liquid-glass inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl shadow-lg border border-zinc-200/90 dark:border-white/10 max-w-full overflow-x-auto">
            {SHOWCASE_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'text-zinc-950 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeShowcaseTab"
                      className="absolute inset-0 rounded-xl bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span className="hidden sm:inline font-bold">{tab.label}</span>
                    <span className="sm:hidden font-bold">{tab.shortTitle}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════
            MAJESTIC FULL-DPI SCREEN CONTAINER (FLUIDO, SIN PINNING)
        ═════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-6xl mx-auto rounded-3xl overflow-hidden bg-white dark:bg-[#0c0e15] border border-zinc-200/90 dark:border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* Browser macOS Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-100/90 dark:bg-[#12151e] border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>

            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white dark:bg-[#090b10] border border-zinc-200/90 dark:border-white/10 text-xs font-mono text-zinc-600 dark:text-zinc-400 shadow-xs">
              <span className="text-zinc-400">https://</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-200">
                barberos.app/{currentTab.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                {currentTab.badgeText}
              </span>
            </div>
          </div>

          {/* Screen Content Frame */}
          <div className="relative min-h-[500px] sm:min-h-[560px] w-full overflow-hidden bg-zinc-50 dark:bg-[#090b10]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full min-h-[500px] sm:min-h-[560px] flex flex-col"
              >
                {activeTab === 'agenda' && <AgendaView />}
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'finanzas' && <FinanzasView />}
                {activeTab === 'barbero' && <BarberoView />}
                {activeTab === 'webpage' && <WebpageView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tab Detail Info & Real Metrics Strip */}
        <motion.div
          key={`info-${activeTab}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 max-w-4xl mx-auto space-y-6"
        >
          {/* Headline & Description */}
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white">
              {currentTab.headline}
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {currentTab.description}
            </p>
          </div>

          {/* 3 Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentTab.metrics.map((m, i) => (
              <div
                key={i}
                className="liquid-glass p-4 rounded-2xl text-center space-y-1 shadow-sm border border-zinc-200/80 dark:border-white/10"
              >
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                  {m.value}
                </p>
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          {/* Bullets & CTA */}
          <div className="liquid-glass p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2.5">
              {currentTab.bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <Link
              href="/register"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all shrink-0 cursor-pointer text-center"
            >
              <span>Probar Este Módulo Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
