'use client'

import React from 'react'
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Scissors,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Ban,
  Copy,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Tag,
  CreditCard,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'

export interface AppointmentDetailData {
  id: string
  reservationCode?: string | null
  date: string
  createdAt?: string | Date | null
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string
  notes?: string | null
  client: {
    id?: string
    name: string
    phone?: string | null
    email?: string | null
    notes?: string | null
  }
  service: {
    id?: string
    name: string
    duration?: number | null
    price: number | string
    category?: string | null
  }
  barber: {
    id?: string
    name: string
    avatar?: string | null
    specialty?: string | null
    status?: string | null
    color?: string | null
  }
  payment?: {
    id?: string
    amount?: number | string | null
    method?: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER' | string | null
    status?: 'PENDING' | 'PAID' | 'COMPLETED' | 'REFUNDED' | string | null
    paidAt?: string | null
  } | null
}

interface AppointmentDetailModalProps {
  appointment: AppointmentDetailData | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus?: (id: string, newStatus: AppointmentDetailData['status']) => void
  onOpenPayment?: (appointment: AppointmentDetailData) => void
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: {
    label: 'Pendiente de Confirmación',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: Clock3
  },
  CONFIRMED: {
    label: 'Cita Confirmada',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: CheckCircle2
  },
  IN_PROGRESS: {
    label: 'Cliente en Servicio',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    icon: Scissors
  },
  COMPLETED: {
    label: 'Servicio Completado',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: CheckCircle2
  },
  CANCELLED: {
    label: 'Cita Cancelada',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    icon: Ban
  },
  NO_SHOW: {
    label: 'Cliente No Asistió',
    badge: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    icon: AlertCircle
  }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia / Nequi / Daviplata',
  CARD: 'Tarjeta Débito / Crédito',
  OTHER: 'Otro Medio'
}

function formatCOP(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(num || 0)
}

export default function AppointmentDetailModal({
  appointment,
  isOpen,
  onClose,
  onUpdateStatus,
  onOpenPayment
}: AppointmentDetailModalProps) {
  if (!isOpen || !appointment) return null

  const aptDate = new Date(appointment.date)
  const isValidDate = !isNaN(aptDate.getTime())

  const formattedDate = isValidDate
    ? aptDate.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Fecha no especificada'

  const formattedTime = isValidDate
    ? aptDate.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '--:--'

  const createdDate = appointment.createdAt
    ? new Date(appointment.createdAt).toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : null

  const statusInfo = STATUS_CONFIG[appointment.status] || {
    label: appointment.status,
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    icon: AlertCircle
  }
  const StatusIcon = statusInfo.icon

  const isPaid =
    appointment.payment?.status === 'PAID' ||
    appointment.payment?.status === 'COMPLETED'
  const isPendingPay = appointment.payment?.status === 'PENDING'

  const cleanPhone = appointment.client?.phone?.replace(/\D/g, '') || ''
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`}`
    : null

  const reservationCodeDisplay = appointment.reservationCode
    ? appointment.reservationCode.toUpperCase()
    : `RES-${appointment.id.slice(0, 6).toUpperCase()}`

  const copyCode = () => {
    navigator.clipboard.writeText(reservationCodeDisplay)
    toast.success('Código de reserva copiado al portapapeles')
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto text-zinc-950 dark:text-white animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* ─── MODAL HEADER ─── */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/90 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                Ficha Técnica de Cita
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <button
                onClick={copyCode}
                className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
                title="Copiar código de reserva"
              >
                <span>#{reservationCodeDisplay}</span>
                <Copy className="w-2.5 h-2.5 text-zinc-400" />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight capitalize">
                {formattedTime} · <span className="font-extrabold capitalize">{formattedDate}</span>
              </h2>
            </div>

            {createdDate && (
              <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 mt-1">
                Registrada en el sistema el {createdDate}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-2xs ${statusInfo.badge}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusInfo.label}</span>
            </span>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors shadow-2xs"
              title="Cerrar ficha"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── MODAL BODY (CARDS GRID) ─── */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Grid 2 Columnas para Cliente y Barbero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: CLIENTE */}
            <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  Cliente
                </span>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg transition-colors border border-transparent dark:border-emerald-800/40"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-zinc-950 dark:text-white uppercase tracking-tight">
                  {appointment.client?.name || 'Cliente sin nombre'}
                </h3>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                {appointment.client?.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{appointment.client.phone}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">Sin teléfono registrado</div>
                )}

                {appointment.client?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <span className="truncate text-zinc-800 dark:text-zinc-200">{appointment.client.email}</span>
                  </div>
                )}
              </div>

              {(appointment.client?.notes || appointment.notes) && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-400 block mb-1">
                    Observaciones / Notas:
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-700 leading-relaxed font-medium">
                    {appointment.client?.notes || appointment.notes}
                  </p>
                </div>
              )}
            </div>

            {/* CARD 2: BARBERO ASIGNADO */}
            <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Barbero Responsable
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-transparent dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  {appointment.barber?.status || 'Activo'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm uppercase shadow-xs shrink-0"
                  style={{
                    backgroundColor: appointment.barber?.color || '#09090b'
                  }}
                >
                  {appointment.barber?.name
                    ? appointment.barber.name.slice(0, 2).toUpperCase()
                    : 'B'}
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-black text-zinc-950 dark:text-white uppercase tracking-tight truncate">
                    {appointment.barber?.name || 'Sin barbero asignado'}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                    {appointment.barber?.specialty || 'Master Barber'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Turno programado:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Grid 2 Columnas para Servicio y Estado de Cobro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 3: SERVICIO SOLICITADO */}
            <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  Servicio
                </span>
                {appointment.service?.category && (
                  <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                    {appointment.service.category}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-zinc-950 dark:text-white tracking-tight">
                  {appointment.service?.name || 'Servicio General'}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{appointment.service?.duration || 30} minutos</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Tarifa Oficial</span>
                  <span className="text-lg font-black text-zinc-950 dark:text-white">
                    {formatCOP(appointment.service?.price || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 4: ESTADO FINANCIERO Y PAGO */}
            <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  Estado de Cobro
                </span>

                {isPaid ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Pagado
                  </span>
                ) : isPendingPay ? (
                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Por Cobrar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                    Pendiente
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-black block">Monto a Facturar</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCOP(Number(appointment.payment?.amount || appointment.service?.price || 0))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Método registrado:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {PAYMENT_METHOD_LABELS[appointment.payment?.method || 'CASH'] || 'Pendiente por definir'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MODAL FOOTER / ACCIONES RÁPIDAS ─── */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Quick status dropdown */}
          {onUpdateStatus && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
                Cambiar Estado:
              </span>
              <select
                value={appointment.status}
                onChange={(e) => onUpdateStatus(appointment.id, e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-amber-400 transition-colors cursor-pointer shadow-2xs"
              >
                <option value="PENDING">PENDIENTE</option>
                <option value="CONFIRMED">CONFIRMADA</option>
                <option value="IN_PROGRESS">EN PROGRESO</option>
                <option value="COMPLETED">COMPLETADA</option>
                <option value="CANCELLED">CANCELADA</option>
                <option value="NO_SHOW">NO ASISTIÓ</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 justify-end ml-auto">
            {!isPaid && onOpenPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenPayment(appointment)
                }}
                className="flex items-center gap-2 bg-zinc-950 dark:bg-amber-400 hover:bg-zinc-800 dark:hover:bg-amber-300 text-white dark:text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-emerald-400 dark:text-zinc-950" />
                <span>Cobrar Cita</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
