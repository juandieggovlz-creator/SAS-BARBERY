/**
 * BarberOS — Appointment & Deposit Lifecycle Metadata
 * ===================================================
 * Permite almacenar y consultar en `Appointment.notes` y `Payment.notes`:
 * - Servicios múltiples reservados y precio/duración total real.
 * - Ciclo de vida independiente del anticipo:
 *     NOT_REQUIRED | TEMP_HOLD | PROOF_SUBMITTED | APPROVED | REJECTED | EXPIRED
 * - URL segura del comprobante, medio utilizado, fecha de vencimiento de reserva
 *   temporal, quién verificó el pago, y desglose financiero exacto (anticipo vs saldo).
 */

export type DepositLifecycleStatus =
  | 'NOT_REQUIRED'
  | 'TEMP_HOLD'
  | 'PROOF_SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

export type RefundResolutionType =
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'RETAINED'
  | 'PENDING_RESOLUTION'

export interface BookedServiceItem {
  id: string
  name: string
  price: number
  duration: number
}

export interface AppointmentBookingMeta {
  services?: BookedServiceItem[]
  totalPrice?: number
  totalDuration?: number
  depositStatus?: DepositLifecycleStatus
  depositRequired?: number
  depositPaidAmount?: number
  depositPaymentMethod?: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER' | string | null
  depositChannelLabel?: string | null // ej: "Nequi", "Daviplata", "Bre-B", "Transferencia"
  remainingBalance?: number
  balancePaidAmount?: number
  balancePaymentMethod?: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER' | string | null
  holdExpiresAt?: string | null
  proofUrl?: string | null
  proofSubmittedAt?: string | null
  proofReference?: string | null
  verifiedByUserId?: string | null
  verifiedByName?: string | null
  verifiedAt?: string | null
  rejectionReason?: string | null
  source?: 'PUBLIC_WEB' | 'OWNER_DASHBOARD' | 'BARBER_DASHBOARD' | 'WHATSAPP'
  // ── Gestión Financiera de Cancelaciones y Devoluciones ──
  refundStatus?: RefundResolutionType | null
  refundAmount?: number | null
  retainedAmount?: number | null
  pendingRefundAmount?: number | null
  refundMethod?: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER' | string | null
  refundReason?: string | null
  refundedAt?: string | null
  refundedByUserId?: string | null
  refundedByName?: string | null
  refundProofUrl?: string | null
  // ── Declaración Manual por WhatsApp ──
  whatsappPaymentDeclared?: boolean | null
  whatsappDeclaredAt?: string | null
}

const META_MARKER_START = '<!--BARBEROS_META:'
const META_MARKER_END = '-->'

export function parseAppointmentNotesAndMeta(rawNotes?: string | null): {
  cleanNotes: string
  meta: AppointmentBookingMeta
} {
  if (!rawNotes || typeof rawNotes !== 'string') {
    return { cleanNotes: '', meta: {} }
  }

  const startIdx = rawNotes.indexOf(META_MARKER_START)
  if (startIdx === -1) {
    return { cleanNotes: rawNotes.trim(), meta: {} }
  }

  const cleanNotes = rawNotes.slice(0, startIdx).trim()
  const jsonStart = startIdx + META_MARKER_START.length
  const endIdx = rawNotes.indexOf(META_MARKER_END, jsonStart)
  if (endIdx === -1) {
    return { cleanNotes, meta: {} }
  }

  try {
    const parsed = JSON.parse(rawNotes.slice(jsonStart, endIdx))
    return {
      cleanNotes,
      meta: typeof parsed === 'object' && parsed !== null ? parsed : {},
    }
  } catch {
    return { cleanNotes, meta: {} }
  }
}

export function serializeAppointmentNotesWithMeta(
  cleanNotes: string | null | undefined,
  meta: AppointmentBookingMeta
): string {
  const clean = (cleanNotes || '').replace(/<!--BARBEROS_META:[\s\S]*?-->/g, '').trim()
  const metaJson = JSON.stringify(meta)
  if (!clean) {
    return `${META_MARKER_START}${metaJson}${META_MARKER_END}`
  }
  return `${clean}\n${META_MARKER_START}${metaJson}${META_MARKER_END}`
}

/**
 * Calcula los importes financieros reales de una cita (considerando multi-servicio,
 * anticipo requerido, anticipo verificado y saldo restante).
 */
export function resolveAppointmentFinancials(appointment: {
  depositRequired?: unknown
  depositPaid?: boolean | null
  notes?: string | null
  service?: { id?: string; name?: string; price?: unknown; duration?: number | null } | null
  payment?: {
    id?: string
    amount?: unknown
    method?: string | null
    status?: string | null
    notes?: string | null
    paidAt?: Date | string | null
  } | null
}) {
  const { cleanNotes, meta } = parseAppointmentNotesAndMeta(appointment.notes)
  const baseServicePrice = Number(appointment.service?.price || 0)
  const baseServiceDuration = Number(appointment.service?.duration || 30)

  const totalPrice =
    typeof meta.totalPrice === 'number' && meta.totalPrice > 0
      ? meta.totalPrice
      : baseServicePrice

  const totalDuration =
    typeof meta.totalDuration === 'number' && meta.totalDuration > 0
      ? meta.totalDuration
      : baseServiceDuration

  const depositRequired = Math.max(
    0,
    Number(appointment.depositRequired ?? meta.depositRequired ?? 0)
  )

  const isDepositApproved =
    Boolean(appointment.depositPaid) || meta.depositStatus === 'APPROVED'

  const depositPaidAmount = isDepositApproved
    ? Math.max(0, Number(meta.depositPaidAmount || depositRequired))
    : 0

  const isFullyPaid =
    appointment.payment?.status === 'PAID' ||
    appointment.payment?.status === 'COMPLETED'

  const remainingBalance = isFullyPaid
    ? 0
    : Math.max(0, totalPrice - depositPaidAmount)

  const depositStatus: DepositLifecycleStatus =
    meta.depositStatus ||
    (depositRequired > 0
      ? isDepositApproved
        ? 'APPROVED'
        : 'TEMP_HOLD'
      : 'NOT_REQUIRED')

  const services: BookedServiceItem[] =
    Array.isArray(meta.services) && meta.services.length > 0
      ? meta.services
      : appointment.service
        ? [
            {
              id: appointment.service.id || 'default',
              name: appointment.service.name || 'Servicio',
              price: baseServicePrice,
              duration: baseServiceDuration,
            },
          ]
        : []

  const hoursAwaitingReview =
    meta.proofSubmittedAt && !isDepositApproved && depositStatus === 'PROOF_SUBMITTED'
      ? Math.max(0, Math.floor((Date.now() - new Date(meta.proofSubmittedAt).getTime()) / (60 * 60 * 1000)))
      : 0

  const isProofOverdue = Boolean(
    !isDepositApproved &&
    depositStatus === 'PROOF_SUBMITTED' &&
    hoursAwaitingReview >= 12
  )

  return {
    cleanNotes,
    meta,
    services,
    serviceNamesJoined: services.map((s) => s.name).join(' + '),
    totalPrice,
    totalDuration,
    depositRequired,
    isDepositApproved,
    depositPaidAmount,
    remainingBalance,
    isFullyPaid,
    depositStatus,
    proofUrl: meta.proofUrl || null,
    proofSubmittedAt: meta.proofSubmittedAt || null,
    proofReference: meta.proofReference || null,
    depositChannelLabel: meta.depositChannelLabel || null,
    holdExpiresAt: meta.holdExpiresAt || null,
    verifiedByName: meta.verifiedByName || null,
    verifiedAt: meta.verifiedAt || null,
    rejectionReason: meta.rejectionReason || null,
    hoursAwaitingReview,
    isProofOverdue,
    refundStatus: meta.refundStatus || null,
    refundAmount: typeof meta.refundAmount === 'number' ? meta.refundAmount : 0,
    retainedAmount: typeof meta.retainedAmount === 'number' ? meta.retainedAmount : 0,
    pendingRefundAmount: typeof meta.pendingRefundAmount === 'number' ? meta.pendingRefundAmount : 0,
    isRefunded: meta.refundStatus === 'FULL_REFUND' || meta.refundStatus === 'PARTIAL_REFUND',
    refundMethod: meta.refundMethod || null,
    refundReason: meta.refundReason || null,
    refundedAt: meta.refundedAt || null,
    refundedByName: meta.refundedByName || null,
    whatsappPaymentDeclared: Boolean(meta.whatsappPaymentDeclared),
  }
}
