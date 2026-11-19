'use client'

import React, { useState } from 'react'
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
  Building2,
  AlertTriangle,
  RotateCcw,
  BadgePercent
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
  depositRequired?: number | string | null
  depositPaid?: boolean | null
  financials?: {
    totalPrice?: number
    totalDuration?: number
    serviceNamesJoined?: string
    depositRequired?: number
    isDepositApproved?: boolean
    depositPaidAmount?: number
    remainingBalance?: number
    depositStatus?: string
    proofUrl?: string | null
    depositChannelLabel?: string | null
    verifiedByName?: string | null
    verifiedAt?: string | null
    rejectionReason?: string | null
    hoursAwaitingReview?: number
    isProofOverdue?: boolean
    refundStatus?: 'NONE' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RETAINED' | 'PENDING_RESOLUTION' | string | null
    refundAmount?: number
    retainedAmount?: number
    pendingRefundAmount?: number
    isRefunded?: boolean
    refundMethod?: string | null
    refundReason?: string | null
    refundedAt?: string | null
    refundedByName?: string | null
    whatsappPaymentDeclared?: boolean
  } | null
  payment?: {
    id?: string
    amount?: number | string | null
    method?: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER' | string | null
    status?: 'PENDING' | 'PAID' | 'COMPLETED' | 'REFUNDED' | 'PARTIAL' | string | null
    paidAt?: string | null
  } | null
}

interface AppointmentDetailModalProps {
  appointment: AppointmentDetailData | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus?: (id: string, newStatus: AppointmentDetailData['status']) => void
  onOpenPayment?: (appointment: AppointmentDetailData) => void
  onVerifyDeposit?: (id: string, action: 'APPROVE' | 'REJECT') => void
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
  onOpenPayment,
  onVerifyDeposit,
}: AppointmentDetailModalProps) {
  const [showCancelResolution, setShowCancelResolution] = useState(false)
  const [cancelResolutionType, setCancelResolutionType] = useState<
    'FULL_REFUND' | 'PARTIAL_REFUND' | 'RETAINED' | 'PENDING_RESOLUTION'
  >('FULL_REFUND')
  const [partialRefundAmount, setPartialRefundAmount] = useState<number>(0)
  const [refundMethod, setRefundMethod] = useState<'TRANSFER' | 'CASH' | 'CARD' | 'OTHER'>('TRANSFER')
  const [refundReason, setRefundReason] = useState('')
  const [submittingResolution, setSubmittingResolution] = useState(false)

  if (!isOpen || !appointment) return null

  const fin = appointment.financials || {}
  const totalPrice = Number(fin.totalPrice ?? appointment.service?.price ?? 0)
  const depositReq = Number(fin.depositRequired ?? appointment.depositRequired ?? 0)
  const isDepositApproved = Boolean(fin.isDepositApproved ?? appointment.depositPaid)
  const depositPaidAmt = isDepositApproved ? Number(fin.depositPaidAmount ?? depositReq) : 0
  const remainingBal =
    appointment.payment?.status === 'PAID' || appointment.payment?.status === 'COMPLETED'
      ? 0
      : Math.max(0, totalPrice - depositPaidAmt)

  const handleStatusSelect = (newStatus: string) => {
    if (newStatus === 'CANCELLED' && isDepositApproved && depositPaidAmt > 0) {
      setPartialRefundAmount(depositPaidAmt)
      setShowCancelResolution(true)
      return
    }
    onUpdateStatus?.(appointment.id, newStatus)
  }

  const handleConfirmCancelResolution = async () => {
    setSubmittingResolution(true)
    try {
      const calcRefundAmt =
        cancelResolutionType === 'FULL_REFUND'
          ? depositPaidAmt
          : cancelResolutionType === 'PARTIAL_REFUND'
          ? Math.min(depositPaidAmt, Math.max(0, Number(partialRefundAmount) || 0))
          : 0

      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_WITH_RESOLUTION',
          resolutionType: cancelResolutionType,
          refundAmount: calcRefundAmt,
          refundMethod,
          refundReason: refundReason.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Cita cancelada y resolución financiera guardada')
        setShowCancelResolution(false)
        onUpdateStatus?.(appointment.id, 'CANCELLED')
      } else {
        toast.error(data.error || 'Error al procesar la cancelación')
      }
    } catch {
      toast.error('Error de red al procesar cancelación')
    } finally {
      setSubmittingResolution(false)
    }
  }

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
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Tarifa Total</span>
                  <span className="text-lg font-black text-zinc-950 dark:text-white">
                    {formatCOP(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 4: ESTADO FINANCIERO, ANTICIPO Y SALDO */}
            <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  Estado de Cobro & Anticipo
                </span>

                {isPaid ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Pagado Total
                  </span>
                ) : isDepositApproved ? (
                  <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/40">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    Anticipo Verificado
                  </span>
                ) : fin.depositStatus === 'PROOF_SUBMITTED' ? (
                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Comprobante en Verificación
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

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Valor total servicio(s):</span>
                  <span className="font-black text-zinc-950 dark:text-white">{formatCOP(totalPrice)}</span>
                </div>

                {depositReq > 0 && (
                  <div className="flex justify-between">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {isDepositApproved ? 'Anticipo verificado:' : 'Anticipo requerido:'}
                    </span>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {formatCOP(depositReq)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-700 dark:text-zinc-300 font-black uppercase text-[11px]">
                    {isPaid ? 'Saldo pendiente:' : 'Saldo restante a cobrar:'}
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCOP(remainingBal)}
                  </span>
                </div>
              </div>

              {fin.verifiedByName && (
                <div className="text-[11px] text-zinc-400 pt-1">
                  Anticipo verificado por: <strong className="text-zinc-700 dark:text-zinc-200">{fin.verifiedByName}</strong>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Método registrado:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {fin.depositChannelLabel || PAYMENT_METHOD_LABELS[appointment.payment?.method || 'CASH'] || 'Pendiente por definir'}
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE RESOLUCIÓN FINANCIERA / DEVOLUCIÓN (SI EXISTE) */}
          {fin.refundStatus && fin.refundStatus !== 'NONE' && (
            <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Resolución Financiera / Devolución
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700">
                  {fin.refundStatus === 'FULL_REFUND'
                    ? 'Devolución Total Realizada'
                    : fin.refundStatus === 'PARTIAL_REFUND'
                    ? 'Devolución Parcial Realizada'
                    : fin.refundStatus === 'RETAINED'
                    ? 'Anticipo Retenido por Política'
                    : 'Devolución Pendiente por Resolver'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Monto Devuelto:</span>
                  <strong className="text-rose-600 dark:text-rose-400 font-black text-sm">
                    {formatCOP(fin.refundAmount || 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Monto Retenido:</span>
                  <strong className="text-zinc-700 dark:text-zinc-200 font-black text-sm">
                    {formatCOP(fin.retainedAmount || 0)}
                  </strong>
                </div>
                {fin.pendingRefundAmount && fin.pendingRefundAmount > 0 ? (
                  <div>
                    <span className="text-amber-500 block text-[11px]">Pendiente de Pago:</span>
                    <strong className="text-amber-600 font-black text-sm">
                      {formatCOP(fin.pendingRefundAmount)}
                    </strong>
                  </div>
                ) : null}
              </div>

              {fin.refundReason && (
                <div className="text-xs text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <strong>Motivo:</strong> {fin.refundReason}
                </div>
              )}

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-100 dark:border-rose-900/30">
                <span>
                  Medio: <strong>{PAYMENT_METHOD_LABELS[fin.refundMethod || 'TRANSFER'] || fin.refundMethod || 'Transferencia'}</strong>
                </span>
                {fin.refundedByName && (
                  <span>
                    Gestionado por: <strong>{fin.refundedByName}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN DE COMPROBANTE DE ANTICIPO (SI EXISTE) */}
          {fin.proofUrl && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              {fin.isProofOverdue && !isDepositApproved && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    Aviso: Este comprobante lleva <strong>{fin.hoursAwaitingReview} horas</strong> en espera. Por favor verifica el ingreso y resuelve la reserva (aprobar o rechazar).
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                    Comprobante de Anticipo Adjunto
                  </span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Anticipo por {formatCOP(depositReq)} {fin.depositChannelLabel ? `(${fin.depositChannelLabel})` : ''}
                  </p>
                </div>

                {onVerifyDeposit && !isDepositApproved && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onVerifyDeposit(appointment.id, 'REJECT')}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-black uppercase cursor-pointer"
                    >
                      Rechazar
                    </button>
                    <button
                      type="button"
                      onClick={() => onVerifyDeposit(appointment.id, 'APPROVE')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase cursor-pointer"
                    >
                      Aprobar Anticipo
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 max-h-64 flex items-center justify-center">
                <img
                  src={fin.proofUrl}
                  alt="Comprobante de anticipo"
                  className="max-h-64 w-auto object-contain"
                />
              </div>
            </div>
          )}
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
                data-status-badge="true"
                value={appointment.status}
                onChange={(e) => handleStatusSelect(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase outline-none cursor-pointer transition-colors border shadow-2xs ${
                  appointment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60' :
                  appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/60' :
                  appointment.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700/60' :
                  appointment.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/60' :
                  appointment.status === 'NO_SHOW' ? 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' :
                  'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60'
                }`}
              >
                <option value="PENDING" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">PENDIENTE</option>
                <option value="CONFIRMED" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">CONFIRMADA</option>
                <option value="IN_PROGRESS" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">EN PROGRESO</option>
                <option value="COMPLETED" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">COMPLETADA</option>
                <option value="CANCELLED" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">CANCELADA</option>
                <option value="NO_SHOW" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-bold py-1">NO ASISTIÓ</option>
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

        {/* SUBMODAL: RESOLUCIÓN FINANCIERA DE CANCELACIÓN */}
        {showCancelResolution && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-950 dark:text-white uppercase tracking-tight">
                    Cancelar Cita con Anticipo
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Esta cita tiene un anticipo pagado de <strong>{formatCOP(depositPaidAmt)}</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Resolución del Anticipo:
                </label>
                <div className="space-y-1.5">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      cancelResolutionType === 'FULL_REFUND'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelRes"
                      checked={cancelResolutionType === 'FULL_REFUND'}
                      onChange={() => setCancelResolutionType('FULL_REFUND')}
                      className="accent-rose-600"
                    />
                    <div className="flex-1">
                      <div>Devolución Total ({formatCOP(depositPaidAmt)})</div>
                      <span className="text-[10px] font-normal opacity-75">
                        Se devuelve todo el dinero al cliente
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      cancelResolutionType === 'PARTIAL_REFUND'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelRes"
                      checked={cancelResolutionType === 'PARTIAL_REFUND'}
                      onChange={() => setCancelResolutionType('PARTIAL_REFUND')}
                      className="accent-amber-600"
                    />
                    <div className="flex-1">
                      <div>Devolución Parcial</div>
                      <span className="text-[10px] font-normal opacity-75">
                        Se devuelve una parte y se retiene el resto
                      </span>
                    </div>
                  </label>

                  {cancelResolutionType === 'PARTIAL_REFUND' && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Monto a devolver:</span>
                        <span className="font-black text-rose-600">{formatCOP(partialRefundAmount)}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={depositPaidAmt}
                        value={partialRefundAmount}
                        onChange={(e) =>
                          setPartialRefundAmount(
                            Math.min(depositPaidAmt, Math.max(0, Number(e.target.value) || 0))
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>
                          Retenido: {formatCOP(Math.max(0, depositPaidAmt - partialRefundAmount))}
                        </span>
                        <span>Máximo: {formatCOP(depositPaidAmt)}</span>
                      </div>
                    </div>
                  )}

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      cancelResolutionType === 'RETAINED'
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 text-zinc-900 dark:text-white'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelRes"
                      checked={cancelResolutionType === 'RETAINED'}
                      onChange={() => setCancelResolutionType('RETAINED')}
                      className="accent-zinc-900"
                    />
                    <div className="flex-1">
                      <div>Retener Anticipo Completo ({formatCOP(depositPaidAmt)})</div>
                      <span className="text-[10px] font-normal opacity-75">
                        Por política de inasistencia o cancelación tardía
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      cancelResolutionType === 'PENDING_RESOLUTION'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelRes"
                      checked={cancelResolutionType === 'PENDING_RESOLUTION'}
                      onChange={() => setCancelResolutionType('PENDING_RESOLUTION')}
                      className="accent-blue-600"
                    />
                    <div className="flex-1">
                      <div>Dejar Pendiente de Pago</div>
                      <span className="text-[10px] font-normal opacity-75">
                        La cita se cancela y la devolución se gestiona luego
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {(cancelResolutionType === 'FULL_REFUND' || cancelResolutionType === 'PARTIAL_REFUND') && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Medio de Devolución:
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as 'TRANSFER' | 'CASH' | 'CARD' | 'OTHER')}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  >
                    <option value="TRANSFER" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-semibold py-1">Transferencia bancaria / Nequi / Daviplata</option>
                    <option value="CASH" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-semibold py-1">Efectivo en caja</option>
                    <option value="CARD" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-semibold py-1">Datáfono / Tarjeta</option>
                    <option value="OTHER" className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-semibold py-1">Otro medio</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Motivo o Justificación:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Solicitud directa del cliente por viaje"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCancelResolution(false)}
                  disabled={submittingResolution}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelResolution}
                  disabled={submittingResolution}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingResolution ? 'Procesando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
