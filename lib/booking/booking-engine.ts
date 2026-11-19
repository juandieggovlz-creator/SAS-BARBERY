/**
 * BarberOS — Centralized Booking & Deposit Engine
 * ================================================
 * Fuente única de la verdad para:
 *  1. Creación de reservas (Web Pública, Dashboard Propietario, Dashboard Barbero, WhatsApp).
 *  2. Control de concurrencia atómico con bloqueos transaccionales PostgreSQL (`pg_advisory_xact_lock`).
 *  3. Cálculo de anticipos (monto fijo o porcentaje) y reservas temporales con vencimiento perezoso.
 *  4. Recepción de comprobantes de pago (sin marcar como pagado automáticamente).
 *  5. Aprobación / Rechazo de anticipos con idempotencia, auditoría y sincronización financiera (`PARTIAL` / `PAID`).
 *  6. Reprogramación y cancelación preservando trazabilidad financiera y multi-tenant isolation.
 */

import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { PaymentMethod } from '@prisma/client'
import { parseSchedule } from '@/lib/schedule'
import {
  expireStaleHoldsForBusiness,
  getEffectiveAppointmentDuration,
  resolveEffectiveShiftForBarber,
} from '@/lib/sync/availability-engine'
import {
  calculateDepositAmount,
  parseBusinessDepositConfig,
} from '@/lib/booking/deposit-config'
import {
  AppointmentBookingMeta,
  BookedServiceItem,
  RefundResolutionType,
  parseAppointmentNotesAndMeta,
  resolveAppointmentFinancials,
  serializeAppointmentNotesWithMeta,
} from '@/lib/booking/booking-metadata'
import { generatePaymentCode } from '@/lib/payments'
import { recordAuditLog } from '@/lib/audit'

export class BookingEngineError extends Error {
  statusCode: number
  code: string
  constructor(message: string, statusCode = 400, code = 'BOOKING_ERROR') {
    super(message)
    this.name = 'BookingEngineError'
    this.statusCode = statusCode
    this.code = code
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function generateReservationCode(prefix = ''): string {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const hex = randomBytes(3).toString('hex').toUpperCase()
  return prefix ? `${prefix}-${dateStr}-${hex}` : `${dateStr}-${hex}`
}

/**
 * Normaliza teléfonos para coincidencia consistente entre Web, Dashboard y WhatsApp.
 * Retorna tanto el teléfono limpio como los últimos 10 dígitos para búsqueda flexible.
 */
export function normalizeCustomerPhone(rawPhone: string): {
  cleanPhone: string
  last10Digits: string
} {
  const digits = (rawPhone || '').replace(/\D/g, '')
  if (!digits) {
    return { cleanPhone: '0000000000', last10Digits: '0000000000' }
  }
  const last10Digits = digits.length > 10 ? digits.slice(-10) : digits
  const cleanPhone =
    digits.length === 10 && digits.startsWith('3') ? `57${digits}` : digits
  return { cleanPhone, last10Digits }
}

export interface CreateBookingInput {
  businessId: string
  serviceId: string
  serviceIds?: string[]
  barberId?: string | null
  date: Date | string
  clientId?: string | null
  clientName?: string | null
  clientPhone?: string | null
  clientEmail?: string | null
  notes?: string | null
  source?: 'PUBLIC_WEB' | 'OWNER_DASHBOARD' | 'BARBER_DASHBOARD' | 'WHATSAPP'
  proofUrl?: string | null
  depositChannelLabel?: string | null
  proofReference?: string | null
  skipPastDateCheck?: boolean
}

export async function createCentralizedBooking(input: CreateBookingInput) {
  const {
    businessId,
    serviceId,
    serviceIds,
    barberId,
    date,
    clientId,
    clientName,
    clientPhone,
    clientEmail,
    notes,
    source = 'PUBLIC_WEB',
    proofUrl,
    depositChannelLabel,
    proofReference,
    skipPastDateCheck = false,
  } = input

  if (!businessId || (!serviceId && (!serviceIds || serviceIds.length === 0)) || !date) {
    throw new BookingEngineError(
      'Faltan datos obligatorios para procesar la reserva (barbería, servicio o fecha).',
      400,
      'MISSING_FIELDS'
    )
  }

  // 1. Liberar reservas temporales vencidas antes de validar disponibilidad
  await expireStaleHoldsForBusiness(businessId)

  // 2. Validar negocio y configuración de anticipos
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      page: { select: { businessHours: true, requireBarber: true } },
    },
  })

  if (!business || ['SUSPENDED', 'CANCELLED'].includes(business.status)) {
    throw new BookingEngineError(
      'Esta barbería no se encuentra disponible para recibir reservas en este momento.',
      400,
      'BUSINESS_UNAVAILABLE'
    )
  }

  // 3. Validar todos los servicios seleccionados contra el negocio (anti-manipulación de precios)
  const requestedServiceIds = Array.from(
    new Set(
      Array.isArray(serviceIds) && serviceIds.length > 0
        ? serviceIds
        : [serviceId]
    )
  ).filter(Boolean)

  const dbServices = await prisma.service.findMany({
    where: {
      id: { in: requestedServiceIds },
      businessId,
      isActive: true,
    },
  })

  if (dbServices.length === 0 || dbServices.length !== requestedServiceIds.length) {
    throw new BookingEngineError(
      'Uno o más servicios seleccionados no existen o no pertenecen a esta barbería.',
      400,
      'INVALID_SERVICE'
    )
  }

  // Ordenar manteniendo el servicio principal primero
  const primaryService =
    dbServices.find((s) => s.id === serviceId) || dbServices[0]

  const bookedServices: BookedServiceItem[] = dbServices.map((s) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    duration: Number(s.duration || 30),
  }))

  const totalPrice = bookedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = bookedServices.reduce((sum, s) => sum + s.duration, 0)

  // 4. Validar fecha y hora
  const appointmentStart = date instanceof Date ? date : new Date(date)
  if (isNaN(appointmentStart.getTime())) {
    throw new BookingEngineError('La fecha y hora seleccionadas no son válidas.', 400, 'INVALID_DATE')
  }

  // Permitir margen de 2 minutos por latencia de red
  if (!skipPastDateCheck && appointmentStart.getTime() < Date.now() - 2 * 60 * 1000) {
    throw new BookingEngineError(
      'No es posible agendar citas en fechas u horarios pasados.',
      400,
      'PAST_DATE'
    )
  }

  const appointmentEnd = new Date(appointmentStart.getTime() + totalDuration * 60 * 1000)
  const year = appointmentStart.getFullYear()
  const month = appointmentStart.getMonth()
  const day = appointmentStart.getDate()
  const dayOfWeek = appointmentStart.getDay()
  const startOfDay = new Date(year, month, day, 0, 0, 0)
  const endOfDay = new Date(year, month, day, 23, 59, 59)
  const dateDayKey = `${year}-${pad(month + 1)}-${pad(day)}`
  const reqTimeStr = `${pad(appointmentStart.getHours())}:${pad(appointmentStart.getMinutes())}`
  const reqEndTimeStr = `${pad(appointmentEnd.getHours())}:${pad(appointmentEnd.getMinutes())}`

  // Verificar horario general de la barbería
  const parsedBusinessSchedule = business.page?.businessHours
    ? parseSchedule(business.page.businessHours)
    : null
  const businessDaySchedule = parsedBusinessSchedule
    ? parsedBusinessSchedule.find((d) => d.dayIndex === dayOfWeek) || null
    : null

  if (businessDaySchedule && !businessDaySchedule.isOpen) {
    throw new BookingEngineError(
      `La barbería se encuentra cerrada los días ${businessDaySchedule.day}.`,
      400,
      'BUSINESS_CLOSED_DAY'
    )
  }

  // 5. Resolver candidatos de barbero (si no se envió o es 'ANY', probar todos los activos)
  const normalizedBarberId =
    barberId && barberId !== 'ANY' && barberId.trim() !== '' ? barberId.trim() : null

  const candidateBarbers = await prisma.barber.findMany({
    where: {
      businessId,
      status: 'ACTIVE',
      ...(normalizedBarberId ? { id: normalizedBarberId } : {}),
    },
    orderBy: { name: 'asc' },
  })

  if (candidateBarbers.length === 0) {
    throw new BookingEngineError(
      normalizedBarberId
        ? 'El barbero seleccionado no existe o no pertenece a esta barbería.'
        : 'No hay barberos activos disponibles en esta sede.',
      400,
      'BARBER_NOT_FOUND'
    )
  }

  // 6. Transacción interactiva con bloqueo transaccional PostgreSQL para evitar doble reserva concurrente
  const result = await prisma.$transaction(async (tx) => {
    let selectedBarber: (typeof candidateBarbers)[0] | null = null
    let lastRejectionReason = 'El horario seleccionado ya no está disponible.'

    for (const candidate of candidateBarbers) {
      // Bloqueo exclusivo por negocio + barbero + fecha durante la transacción
      const lockKey = `${businessId}:${candidate.id}:${dateDayKey}`
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`

      const schedules = await tx.barberSchedule.findMany({
        where: { barberId: candidate.id, dayOfWeek },
      })

      const effectiveShift = resolveEffectiveShiftForBarber(
        schedules,
        dayOfWeek,
        businessDaySchedule
      )

      if (!effectiveShift.isWorking) {
        lastRejectionReason = 'El barbero no trabaja en este día.'
        continue
      }

      if (
        reqTimeStr < effectiveShift.startTime ||
        reqEndTimeStr > effectiveShift.endTime
      ) {
        lastRejectionReason = `El horario laboral para este día es de ${effectiveShift.startTime} a ${effectiveShift.endTime}.`
        continue
      }

      const blocks = await tx.barberBlock.findMany({
        where: {
          barberId: candidate.id,
          date: { gte: startOfDay, lte: endOfDay },
        },
      })

      const overlapsBlock = blocks.some((b) => {
        return reqTimeStr < b.endTime && reqEndTimeStr > b.startTime
      })

      if (overlapsBlock) {
        lastRejectionReason =
          'El horario seleccionado coincide con una pausa o bloqueo del barbero.'
        continue
      }

      const existingAppts = await tx.appointment.findMany({
        where: {
          businessId,
          barberId: candidate.id,
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          date: { gte: startOfDay, lte: endOfDay },
        },
        include: { service: true },
      })

      const hasConflict = existingAppts.some((appt) => {
        const apptStart = new Date(appt.date)
        const apptDuration = getEffectiveAppointmentDuration(appt)
        const apptEnd = new Date(apptStart.getTime() + apptDuration * 60 * 1000)
        return appointmentStart < apptEnd && appointmentEnd > apptStart
      })

      if (hasConflict) {
        lastRejectionReason =
          'El horario seleccionado ya está ocupado. Por favor elige otra hora.'
        continue
      }

      selectedBarber = candidate
      break
    }

    if (!selectedBarber) {
      throw new BookingEngineError(lastRejectionReason, 409, 'SLOT_CONFLICT')
    }

    // 7. Resolver o crear Cliente dentro de la barbería (multi-tenant)
    let resolvedClient = null
    if (clientId) {
      resolvedClient = await tx.client.findUnique({ where: { id: clientId } })
      if (!resolvedClient || resolvedClient.businessId !== businessId) {
        throw new BookingEngineError(
          'El cliente seleccionado no pertenece a esta barbería.',
          403,
          'CROSS_TENANT_CLIENT'
        )
      }
    } else {
      const cleanName = (clientName || 'Cliente').trim()
      const { cleanPhone, last10Digits } = normalizeCustomerPhone(clientPhone || '')

      resolvedClient = await tx.client.findFirst({
        where: {
          businessId,
          OR: [
            { phone: cleanPhone },
            { phone: (clientPhone || '').trim() },
            ...(last10Digits.length === 10
              ? [{ phone: { endsWith: last10Digits } }]
              : []),
          ],
        },
      })

      if (!resolvedClient) {
        resolvedClient = await tx.client.create({
          data: {
            businessId,
            name: cleanName,
            phone: cleanPhone,
            email: clientEmail ? String(clientEmail).trim() : null,
          },
        })
      } else if (clientEmail && !resolvedClient.email) {
        resolvedClient = await tx.client.update({
          where: { id: resolvedClient.id },
          data: { email: String(clientEmail).trim() },
        })
      }
    }

    // 8. Calcular configuración de anticipo
    const depositConfig = parseBusinessDepositConfig(business)
    const { depositRequired, remainingBalance } = calculateDepositAmount(
      totalPrice,
      depositConfig
    )

    const isDepositRequiredForChannel =
      depositConfig.depositEnabled &&
      depositRequired > 0 &&
      (source === 'PUBLIC_WEB' || source === 'WHATSAPP')

    const effectiveDepositRequired = isDepositRequiredForChannel ? depositRequired : 0
    const effectiveRemainingBalance = isDepositRequiredForChannel
      ? remainingBalance
      : totalPrice

    const holdMinutes = depositConfig.paymentMethods.holdMinutes || 30
    const holdExpiresAt =
      effectiveDepositRequired > 0
        ? new Date(Date.now() + holdMinutes * 60 * 1000).toISOString()
        : null

    const hasInitialProof = Boolean(proofUrl && String(proofUrl).trim().length > 0)

    // ── CONFIRMACIÓN AUTOMÁTICA INTELIGENTE ──
    // Cuando la barbería no exige anticipo (o la reserva es creada por el dueño/barbero desde su panel):
    // La cita se CONFIRMA AUTOMÁTICAMENTE de inmediato, ocupando el horario en la agenda.
    // Solo cuando se exige anticipo y aún no ha sido aprobado, la cita inicia como 'PENDING' protegida temporalmente.
    const isAutoConfirmed =
      effectiveDepositRequired === 0 ||
      source === 'OWNER_DASHBOARD' ||
      source === 'BARBER_DASHBOARD'

    const initialAppointmentStatus = isAutoConfirmed ? 'CONFIRMED' : 'PENDING'

    const bookingMeta: AppointmentBookingMeta = {
      services: bookedServices,
      totalPrice,
      totalDuration,
      depositRequired: effectiveDepositRequired,
      depositPaidAmount: 0,
      remainingBalance: effectiveRemainingBalance,
      depositStatus:
        effectiveDepositRequired > 0
          ? hasInitialProof
            ? 'PROOF_SUBMITTED'
            : 'TEMP_HOLD'
          : 'NOT_REQUIRED',
      holdExpiresAt,
      proofUrl: hasInitialProof ? String(proofUrl).trim() : null,
      proofSubmittedAt: hasInitialProof ? new Date().toISOString() : null,
      depositChannelLabel: depositChannelLabel || null,
      proofReference: proofReference || null,
      source,
    }

    const serializedNotes = serializeAppointmentNotesWithMeta(notes, bookingMeta)
    const codePrefix = source === 'WHATSAPP' ? 'WAPP' : ''
    const reservationCode = generateReservationCode(codePrefix)

    const createdAppointment = await tx.appointment.create({
      data: {
        businessId,
        clientId: resolvedClient.id,
        barberId: selectedBarber.id,
        serviceId: primaryService.id,
        date: appointmentStart,
        status: initialAppointmentStatus,
        depositRequired: effectiveDepositRequired,
        depositPaid: false,
        notes: serializedNotes,
        reservationCode,
      },
      include: {
        client: true,
        barber: true,
        service: true,
        payment: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            depositEnabled: true,
            depositType: true,
            depositPercentage: true,
            depositFixedAmount: true,
            depositInstructions: true,
          },
        },
      },
    })

    return {
      appointment: createdAppointment,
      depositConfig,
      financials: resolveAppointmentFinancials(createdAppointment),
    }
  })

  return result
}

export interface SubmitDepositProofInput {
  appointmentId?: string
  reservationCode?: string
  businessId?: string
  slug?: string
  proofUrl: string
  depositChannelLabel?: string | null
  proofReference?: string | null
}

/**
 * Registra el comprobante enviado por el cliente (desde la web pública o WhatsApp).
 * REGLA DE SEGURIDAD: NUNCA marca `depositPaid = true` ni aprueba el pago automáticamente.
 * Pasa el estado del anticipo a `PROOF_SUBMITTED` ("Pago en verificación").
 */
export async function submitDepositProof(input: SubmitDepositProofInput) {
  const {
    appointmentId,
    reservationCode,
    businessId,
    slug,
    proofUrl,
    depositChannelLabel,
    proofReference,
  } = input

  if (!proofUrl || typeof proofUrl !== 'string' || proofUrl.trim().length < 5) {
    throw new BookingEngineError(
      'Debes adjuntar un comprobante de pago válido.',
      400,
      'INVALID_PROOF'
    )
  }

  // Validar formato seguro de imagen/comprobante (DataURL de imagen o URL https de Cloudinary/almacenamiento)
  const trimmedProof = proofUrl.trim()
  const isSafeDataUrl = /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(trimmedProof)
  const isSafeHttpsUrl = /^https?:\/\//i.test(trimmedProof)
  if (!isSafeDataUrl && !isSafeHttpsUrl) {
    throw new BookingEngineError(
      'Formato de comprobante no permitido. Usa PNG, JPG o WEBP.',
      400,
      'UNSUPPORTED_PROOF_FORMAT'
    )
  }

  // Límite de tamaño (~5MB en base64)
  if (trimmedProof.length > 7_200_000) {
    throw new BookingEngineError(
      'El archivo del comprobante supera el tamaño máximo permitido (5MB).',
      400,
      'PROOF_TOO_LARGE'
    )
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      ...(appointmentId ? { id: appointmentId } : {}),
      ...(reservationCode ? { reservationCode } : {}),
      ...(businessId ? { businessId } : {}),
      ...(slug ? { business: { slug } } : {}),
    },
    include: {
      service: true,
      barber: true,
      client: true,
      business: true,
      payment: true,
    },
  })

  if (!appointment) {
    throw new BookingEngineError(
      'No se encontró la reserva correspondiente a este comprobante.',
      404,
      'APPOINTMENT_NOT_FOUND'
    )
  }

  const { cleanNotes, meta } = parseAppointmentNotesAndMeta(appointment.notes)

  if (appointment.depositPaid || meta.depositStatus === 'APPROVED') {
    return {
      alreadyApproved: true,
      appointment,
      financials: resolveAppointmentFinancials(appointment),
    }
  }

  // Si la reserva temporal había expirado justo antes de subir el comprobante,
  // verificamos si el horario sigue libre para reactivarla de forma segura.
  let nextAppointmentStatus = appointment.status
  if (appointment.status === 'CANCELLED' && meta.depositStatus === 'EXPIRED') {
    const apptStart = new Date(appointment.date)
    const duration = getEffectiveAppointmentDuration(appointment)
    const apptEnd = new Date(apptStart.getTime() + duration * 60 * 1000)
    const startOfDay = new Date(apptStart.getFullYear(), apptStart.getMonth(), apptStart.getDate(), 0, 0, 0)
    const endOfDay = new Date(apptStart.getFullYear(), apptStart.getMonth(), apptStart.getDate(), 23, 59, 59)

    const conflicting = await prisma.appointment.findMany({
      where: {
        businessId: appointment.businessId,
        barberId: appointment.barberId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        id: { not: appointment.id },
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { service: true },
    })

    const hasConflict = conflicting.some((other) => {
      const oStart = new Date(other.date)
      const oEnd = new Date(oStart.getTime() + getEffectiveAppointmentDuration(other) * 60 * 1000)
      return apptStart < oEnd && apptEnd > oStart
    })

    if (hasConflict) {
      throw new BookingEngineError(
        'El plazo de tu reserva temporal venció y otro cliente tomó el horario. Comunícate con la barbería para elegir una nueva hora con tu comprobante.',
        409,
        'HOLD_EXPIRED_AND_TAKEN'
      )
    }

    nextAppointmentStatus = 'PENDING'
  }

  const updatedMeta: AppointmentBookingMeta = {
    ...meta,
    depositStatus: 'PROOF_SUBMITTED',
    proofUrl: trimmedProof,
    proofSubmittedAt: new Date().toISOString(),
    depositChannelLabel: depositChannelLabel || meta.depositChannelLabel || 'Transferencia / Digital',
    proofReference: proofReference || meta.proofReference || null,
    rejectionReason: null,
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: nextAppointmentStatus,
      notes: serializeAppointmentNotesWithMeta(cleanNotes, updatedMeta),
    },
    include: {
      client: true,
      barber: true,
      service: true,
      payment: true,
      business: { select: { id: true, name: true, slug: true } },
    },
  })

  return {
    alreadyApproved: false,
    appointment: updatedAppointment,
    financials: resolveAppointmentFinancials(updatedAppointment),
  }
}

export interface VerifyDepositInput {
  appointmentId: string
  businessId: string
  action: 'APPROVE' | 'REJECT'
  verifiedByUserId: string
  verifiedByName: string
  paymentMethod?: PaymentMethod
  rejectionReason?: string | null
  cancelAppointmentOnReject?: boolean
}

/**
 * Permite al propietario / administrador verificar (aprobar o rechazar) un anticipo.
 * - Idempotente: si ya fue aprobado, no duplica pagos ni ingresos.
 * - Si el pago fue verificado tarde (después del vencimiento temporal), comprueba que el
 *   horario no haya sido ocupado antes de reactivar y confirmar la cita.
 * - Registra un `Payment` con estado `PARTIAL` (por el monto del anticipo) o `PAID`
 *   (si el anticipo cubre el 100% del servicio), evitando doble cobro al finalizar la cita.
 */
export async function verifyAppointmentDeposit(input: VerifyDepositInput) {
  const {
    appointmentId,
    businessId,
    action,
    verifiedByUserId,
    verifiedByName,
    paymentMethod = 'TRANSFER',
    rejectionReason,
    cancelAppointmentOnReject = false,
  } = input

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: true,
      barber: true,
      service: true,
      payment: true,
      business: true,
    },
  })

  if (!appointment || appointment.businessId !== businessId) {
    throw new BookingEngineError(
      'Cita no encontrada o no pertenece a tu barbería.',
      404,
      'NOT_FOUND'
    )
  }

  const financials = resolveAppointmentFinancials(appointment)
  const { cleanNotes, meta } = financials
  const depositAmount =
    financials.depositRequired > 0
      ? financials.depositRequired
      : Math.round(financials.totalPrice * 0.3)

  // Idempotencia en aprobación
  if (action === 'APPROVE' && appointment.depositPaid && meta.depositStatus === 'APPROVED') {
    return {
      idempotent: true,
      appointment,
      financials,
    }
  }

  const now = new Date()

  if (action === 'APPROVE') {
    // Si la cita estaba cancelada/vencida por tardanza, verificar que el horario siga libre
    if (appointment.status === 'CANCELLED') {
      const apptStart = new Date(appointment.date)
      const apptEnd = new Date(apptStart.getTime() + financials.totalDuration * 60 * 1000)
      const startOfDay = new Date(apptStart.getFullYear(), apptStart.getMonth(), apptStart.getDate(), 0, 0, 0)
      const endOfDay = new Date(apptStart.getFullYear(), apptStart.getMonth(), apptStart.getDate(), 23, 59, 59)

      const conflicts = await prisma.appointment.findMany({
        where: {
          businessId,
          barberId: appointment.barberId,
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          id: { not: appointment.id },
          date: { gte: startOfDay, lte: endOfDay },
        },
        include: { service: true },
      })

      const hasConflict = conflicts.some((other) => {
        const oStart = new Date(other.date)
        const oEnd = new Date(oStart.getTime() + getEffectiveAppointmentDuration(other) * 60 * 1000)
        return apptStart < oEnd && apptEnd > oStart
      })

      if (hasConflict) {
        throw new BookingEngineError(
          'No se puede reactivar automáticamente esta cita vencida porque el horario ya fue ocupado por otra reserva. Reprograma primero la fecha/hora de la cita.',
          409,
          'LATE_APPROVAL_CONFLICT'
        )
      }
    }

    const rawMethodStr = String(paymentMethod || 'TRANSFER').toUpperCase()
    const validPrismaMethod: PaymentMethod = 
      rawMethodStr === 'CASH' ? 'CASH' :
      rawMethodStr === 'CARD' ? 'CARD' :
      rawMethodStr === 'OTHER' ? 'OTHER' : 'TRANSFER'

    const updatedMeta: AppointmentBookingMeta = {
      ...meta,
      totalPrice: financials.totalPrice,
      totalDuration: financials.totalDuration,
      depositRequired: depositAmount,
      depositPaidAmount: depositAmount,
      depositPaymentMethod: rawMethodStr,
      remainingBalance: Math.max(0, financials.totalPrice - depositAmount),
      depositStatus: 'APPROVED',
      verifiedByUserId,
      verifiedByName,
      verifiedAt: now.toISOString(),
      rejectionReason: null,
    }

    const isFullPayment = depositAmount >= financials.totalPrice
    const nextPaymentStatus = isFullPayment ? 'PAID' : 'PARTIAL'
    const nextAppointmentStatus =
      appointment.status === 'COMPLETED' || appointment.status === 'IN_PROGRESS'
        ? appointment.status
        : 'CONFIRMED'

    const updated = await prisma.$transaction(async (tx) => {
      if (appointment.payment) {
        // Si aún no estaba pagado el total, registramos el anticipo cobrado
        if (
          appointment.payment.status !== 'PAID' &&
          appointment.payment.status !== 'COMPLETED'
        ) {
          await tx.payment.update({
            where: { id: appointment.payment.id },
            data: {
              amount: depositAmount,
              method: validPrismaMethod,
              status: nextPaymentStatus,
              paidAt: now,
              notes: `Anticipo verificado por ${verifiedByName} (${rawMethodStr})`,
            },
          })
        }
      } else {
        await tx.payment.create({
          data: {
            businessId,
            appointmentId: appointment.id,
            paymentCode: generatePaymentCode(),
            amount: depositAmount,
            method: validPrismaMethod,
            status: nextPaymentStatus,
            paidAt: now,
            notes: `Anticipo verificado por ${verifiedByName} (${rawMethodStr})`,
          },
        })
      }

      return tx.appointment.update({
        where: { id: appointment.id },
        data: {
          depositRequired: depositAmount,
          depositPaid: true,
          status: nextAppointmentStatus,
          ...(isFullPayment ? { paidAt: now, paymentMethod: validPrismaMethod } : {}),
          notes: serializeAppointmentNotesWithMeta(cleanNotes, updatedMeta),
        },
        include: {
          client: true,
          barber: true,
          service: true,
          payment: true,
          business: { select: { id: true, name: true, slug: true } },
        },
      })
    })

    await recordAuditLog({
      userId: verifiedByUserId,
      userName: verifiedByName,
      businessId,
      action: 'APPROVE_APPOINTMENT_DEPOSIT',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        reservationCode: appointment.reservationCode,
        depositAmount,
        remainingBalance: Math.max(0, financials.totalPrice - depositAmount),
        paymentMethod,
      },
    })

    // Notificar confirmación por WhatsApp de forma asíncrona
    import('@/lib/whatsapp/whatsapp-service')
      .then(({ WhatsAppService }) => {
        WhatsAppService.sendAppointmentConfirmation(updated.id).catch(() => {})
      })
      .catch(() => {})

    return {
      idempotent: false,
      appointment: updated,
      financials: resolveAppointmentFinancials(updated),
    }
  } else {
    // REJECT
    const depositCfg = parseBusinessDepositConfig(appointment.business)
    const retryHoldMinutes = depositCfg.paymentMethods.holdMinutes || 30
    const nextHoldExpiresAt = cancelAppointmentOnReject
      ? meta.holdExpiresAt
      : new Date(Date.now() + retryHoldMinutes * 60 * 1000).toISOString()

    const updatedMeta: AppointmentBookingMeta = {
      ...meta,
      depositPaidAmount: 0,
      remainingBalance: financials.totalPrice,
      depositStatus: 'REJECTED',
      holdExpiresAt: nextHoldExpiresAt,
      verifiedByUserId,
      verifiedByName,
      verifiedAt: now.toISOString(),
      rejectionReason:
        (rejectionReason || '').trim() ||
        'El comprobante adjunto no pudo ser verificado. Por favor adjunta un comprobante válido.',
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (appointment.payment && appointment.payment.status === 'PARTIAL') {
        await tx.payment.update({
          where: { id: appointment.payment.id },
          data: {
            status: 'PENDING',
            paidAt: null,
            notes: `Anticipo rechazado por ${verifiedByName}: ${updatedMeta.rejectionReason}`,
          },
        })
      }

      return tx.appointment.update({
        where: { id: appointment.id },
        data: {
          depositPaid: false,
          status: cancelAppointmentOnReject ? 'CANCELLED' : 'PENDING',
          notes: serializeAppointmentNotesWithMeta(cleanNotes, updatedMeta),
        },
        include: {
          client: true,
          barber: true,
          service: true,
          payment: true,
          business: { select: { id: true, name: true, slug: true } },
        },
      })
    })

    await recordAuditLog({
      userId: verifiedByUserId,
      userName: verifiedByName,
      businessId,
      action: 'REJECT_APPOINTMENT_DEPOSIT',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        reservationCode: appointment.reservationCode,
        rejectionReason: updatedMeta.rejectionReason,
        cancelled: cancelAppointmentOnReject,
      },
    })

    return {
      idempotent: false,
      appointment: updated,
      financials: resolveAppointmentFinancials(updated),
    }
  }
}

/**
 * Reprograma una cita existente en el mismo registro (preservando código de reserva,
 * anticipo pagado, comprobante e historial de pago).
 */
export async function rescheduleCentralizedBooking(params: {
  appointmentId: string
  businessId: string
  newDate: Date | string
  newBarberId?: string | null
  newServiceId?: string | null
}) {
  const { appointmentId, businessId, newDate, newBarberId, newServiceId } = params

  await expireStaleHoldsForBusiness(businessId)

  const currentAppt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: true,
      barber: true,
      client: true,
      payment: true,
      business: { include: { page: { select: { businessHours: true } } } },
    },
  })

  if (!currentAppt || currentAppt.businessId !== businessId) {
    throw new BookingEngineError('Cita no encontrada.', 404, 'NOT_FOUND')
  }

  const targetDate = newDate instanceof Date ? newDate : new Date(newDate)
  if (isNaN(targetDate.getTime())) {
    throw new BookingEngineError('Nueva fecha inválida.', 400, 'INVALID_DATE')
  }

  const targetBarberId = newBarberId || currentAppt.barberId
  const targetServiceId = newServiceId || currentAppt.serviceId

  const service =
    targetServiceId === currentAppt.serviceId
      ? currentAppt.service
      : await prisma.service.findUnique({ where: { id: targetServiceId } })

  if (!service || service.businessId !== businessId || !service.isActive) {
    throw new BookingEngineError('El servicio seleccionado no es válido.', 400, 'INVALID_SERVICE')
  }

  const barber =
    targetBarberId === currentAppt.barberId
      ? currentAppt.barber
      : await prisma.barber.findUnique({ where: { id: targetBarberId } })

  if (!barber || barber.businessId !== businessId || barber.status !== 'ACTIVE') {
    throw new BookingEngineError('El barbero seleccionado no es válido.', 400, 'INVALID_BARBER')
  }

  const duration = getEffectiveAppointmentDuration(currentAppt)
  const targetEnd = new Date(targetDate.getTime() + duration * 60 * 1000)
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()
  const day = targetDate.getDate()
  const dayOfWeek = targetDate.getDay()
  const startOfDay = new Date(year, month, day, 0, 0, 0)
  const endOfDay = new Date(year, month, day, 23, 59, 59)
  const dateDayKey = `${year}-${pad(month + 1)}-${pad(day)}`
  const reqTimeStr = `${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`
  const reqEndTimeStr = `${pad(targetEnd.getHours())}:${pad(targetEnd.getMinutes())}`

  const parsedBusinessSchedule = currentAppt.business.page?.businessHours
    ? parseSchedule(currentAppt.business.page.businessHours)
    : null
  const businessDaySchedule = parsedBusinessSchedule
    ? parsedBusinessSchedule.find((d) => d.dayIndex === dayOfWeek) || null
    : null

  if (businessDaySchedule && !businessDaySchedule.isOpen) {
    throw new BookingEngineError(
      `La barbería se encuentra cerrada los días ${businessDaySchedule.day}.`,
      400,
      'BUSINESS_CLOSED_DAY'
    )
  }

  const updated = await prisma.$transaction(async (tx) => {
    const lockKey = `${businessId}:${targetBarberId}:${dateDayKey}`
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`

    const schedules = await tx.barberSchedule.findMany({
      where: { barberId: targetBarberId, dayOfWeek },
    })

    const effectiveShift = resolveEffectiveShiftForBarber(
      schedules,
      dayOfWeek,
      businessDaySchedule
    )

    if (!effectiveShift.isWorking) {
      throw new BookingEngineError('El barbero no labora en la nueva fecha seleccionada.', 400, 'BARBER_OFF')
    }

    if (reqTimeStr < effectiveShift.startTime || reqEndTimeStr > effectiveShift.endTime) {
      throw new BookingEngineError(
        `El horario laboral para ese día es de ${effectiveShift.startTime} a ${effectiveShift.endTime}.`,
        400,
        'OUT_OF_HOURS'
      )
    }

    const blocks = await tx.barberBlock.findMany({
      where: {
        barberId: targetBarberId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    })

    if (blocks.some((b) => reqTimeStr < b.endTime && reqEndTimeStr > b.startTime)) {
      throw new BookingEngineError('El nuevo horario coincide con una pausa del barbero.', 400, 'BLOCK_OVERLAP')
    }

    const existingAppts = await tx.appointment.findMany({
      where: {
        businessId,
        barberId: targetBarberId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        id: { not: appointmentId },
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { service: true },
    })

    const hasConflict = existingAppts.some((other) => {
      const oStart = new Date(other.date)
      const oEnd = new Date(oStart.getTime() + getEffectiveAppointmentDuration(other) * 60 * 1000)
      return targetDate < oEnd && targetEnd > oStart
    })

    if (hasConflict) {
      throw new BookingEngineError(
        'Este barbero ya tiene una cita asignada en ese horario.',
        409,
        'SLOT_CONFLICT'
      )
    }

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        date: targetDate,
        barberId: targetBarberId,
        serviceId: targetServiceId,
        status: currentAppt.depositPaid ? 'CONFIRMED' : currentAppt.status === 'CANCELLED' ? 'PENDING' : currentAppt.status,
      },
      include: {
        client: true,
        barber: true,
        service: true,
        payment: true,
        business: { select: { id: true, name: true, slug: true } },
      },
    })
  })

  return updated
}

/**
 * Matriz de transiciones válidas de estado de cita.
 * Garantiza que ninguna cita cancelada o vencida pueda saltar arbitrariamente a completada
 * sin seguir el ciclo de vida operacional y financiero auditado.
 */
export const VALID_APPOINTMENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Un servicio completado es un estado terminal
  CANCELLED: [], // Una cita cancelada es un estado terminal
  NO_SHOW: ['CANCELLED'], // No asistió es terminal (o cierre por cancelación)
}

export function validateAppointmentStatusTransition(
  currentStatus: string,
  targetStatus: string
): { valid: boolean; error?: string } {
  if (currentStatus === targetStatus) return { valid: true }
  const allowed = VALID_APPOINTMENT_TRANSITIONS[currentStatus] || []
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Transición no permitida de estado '${currentStatus}' a '${targetStatus}'.`,
    }
  }
  return { valid: true }
}

export interface CancelWithResolutionInput {
  appointmentId: string
  businessId: string
  resolutionType: 'NO_PAYMENT_CANCEL' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RETAINED' | 'PENDING_RESOLUTION'
  refundAmount?: number
  refundMethod?: PaymentMethod
  reason?: string | null
  verifiedByUserId: string
  verifiedByName: string
}

/**
 * Gestiona de forma centralizada y segura la cancelación de citas con resolución financiera
 * de anticipos (Devolución total, parcial, retención por política o pendiente).
 * Preserva movimientos históricos y crea asientos compensatorios auditados.
 */
export async function resolveAppointmentCancellation(input: CancelWithResolutionInput) {
  const {
    appointmentId,
    businessId,
    resolutionType,
    refundAmount = 0,
    refundMethod = 'TRANSFER',
    reason,
    verifiedByUserId,
    verifiedByName,
  } = input

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { payment: true, service: true, client: true, barber: true, business: true },
  })

  if (!appointment || appointment.businessId !== businessId) {
    throw new BookingEngineError(
      'Cita no encontrada o no pertenece a este negocio.',
      404,
      'APPOINTMENT_NOT_FOUND'
    )
  }

  const financials = resolveAppointmentFinancials(appointment)
  const { cleanNotes, meta } = parseAppointmentNotesAndMeta(appointment.notes)
  const depositPaidAmount = financials.isDepositApproved
    ? financials.depositPaidAmount
    : Number(financials.pendingRefundAmount || 0)

  let effectiveRefund = 0
  let effectiveRetained = 0
  let effectivePendingRefund = 0

  if (resolutionType === 'FULL_REFUND') {
    if (depositPaidAmount <= 0) {
      throw new BookingEngineError(
        'No hay anticipo pagado para realizar una devolución total.',
        400,
        'NO_DEPOSIT_PAID'
      )
    }
    effectiveRefund = depositPaidAmount
    effectiveRetained = 0
  } else if (resolutionType === 'PARTIAL_REFUND') {
    if (depositPaidAmount <= 0) {
      throw new BookingEngineError(
        'No hay anticipo pagado para realizar una devolución parcial.',
        400,
        'NO_DEPOSIT_PAID'
      )
    }
    if (refundAmount <= 0 || refundAmount >= depositPaidAmount) {
      throw new BookingEngineError(
        `El monto a devolver debe ser mayor a 0 y menor al anticipo recibido ($${depositPaidAmount.toLocaleString('es-CO')}).`,
        400,
        'INVALID_PARTIAL_REFUND_AMOUNT'
      )
    }
    effectiveRefund = refundAmount
    effectiveRetained = depositPaidAmount - refundAmount
  } else if (resolutionType === 'RETAINED') {
    effectiveRefund = 0
    effectiveRetained = depositPaidAmount
  } else if (resolutionType === 'PENDING_RESOLUTION') {
    effectiveRefund = 0
    effectiveRetained = 0
    effectivePendingRefund = depositPaidAmount
  }

  const now = new Date()
  const updatedMeta: AppointmentBookingMeta = {
    ...meta,
    refundStatus: resolutionType === 'NO_PAYMENT_CANCEL' ? null : resolutionType,
    refundAmount: effectiveRefund,
    retainedAmount: effectiveRetained,
    pendingRefundAmount: effectivePendingRefund,
    refundMethod: effectiveRefund > 0 ? refundMethod : null,
    refundReason: reason || null,
    refundedAt: effectiveRefund > 0 ? now.toISOString() : null,
    refundedByUserId: verifiedByUserId,
    refundedByName: verifiedByName,
  }

  const result = await prisma.$transaction(async (tx) => {
    // Si hay devolución efectiva de dinero, registrar el movimiento financiero compensatorio
    let compensatoryPayment = null
    if (effectiveRefund > 0) {
      const refundPaymentCode = `REF-${now.getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`
      compensatoryPayment = await tx.payment.create({
        data: {
          businessId,
          appointmentId: null, // Respetar 1-a-1 de appointmentId y permitir salida contable
          amount: effectiveRefund,
          method: refundMethod,
          status: 'REFUNDED',
          paidAt: now,
          paymentCode: refundPaymentCode,
          notes: `DEVOLUCIÓN ${resolutionType === 'FULL_REFUND' ? 'TOTAL' : 'PARCIAL'} | Anticipo Cita #${appointment.reservationCode} (Devuelto: $${effectiveRefund.toLocaleString('es-CO')}${effectiveRetained > 0 ? `, Retenido: $${effectiveRetained.toLocaleString('es-CO')}` : ''}) · Motivo: ${reason || 'Cancelación de servicio'}`,
        },
      })
    }

    const updatedAppt = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        notes: serializeAppointmentNotesWithMeta(cleanNotes, updatedMeta),
      },
      include: {
        client: true,
        barber: true,
        service: true,
        payment: true,
        business: { select: { id: true, name: true, slug: true } },
      },
    })

    return { updatedAppt, compensatoryPayment }
  })

  await recordAuditLog({
    userId: verifiedByUserId,
    businessId,
    action: 'CANCEL_APPOINTMENT_WITH_RESOLUTION',
    entity: 'Appointment',
    entityId: appointmentId,
    details: {
      reservationCode: appointment.reservationCode,
      resolutionType,
      depositPaidAmount,
      refundAmount: effectiveRefund,
      retainedAmount: effectiveRetained,
      pendingRefundAmount: effectivePendingRefund,
      refundMethod,
      compensatoryPaymentId: result.compensatoryPayment?.id,
    },
  })

  return {
    success: true,
    appointment: result.updatedAppt,
    financials: resolveAppointmentFinancials(result.updatedAppt),
    compensatoryPayment: result.compensatoryPayment,
  }
}

/**
 * Permite al cliente declarar que ha transferido el anticipo vía WhatsApp
 * (cuando la barbería no dispone de API oficial de WhatsApp para recibir archivos).
 * Protege el horario y traslada la reserva a la cola de verificación del propietario.
 */
export async function declareWhatsAppPayment(params: {
  reservationCode: string
  businessId?: string
  slug?: string
  clientPhone?: string
}) {
  const { reservationCode, businessId, slug } = params
  const appointment = await prisma.appointment.findFirst({
    where: {
      reservationCode,
      ...(businessId ? { businessId } : {}),
      ...(slug ? { business: { slug } } : {}),
    },
    include: { business: true },
  })

  if (!appointment) {
    throw new BookingEngineError('Reserva no encontrada.', 404, 'APPOINTMENT_NOT_FOUND')
  }

  const { cleanNotes, meta } = parseAppointmentNotesAndMeta(appointment.notes)

  if (appointment.depositPaid || meta.depositStatus === 'APPROVED') {
    return {
      alreadyApproved: true,
      appointment,
      financials: resolveAppointmentFinancials(appointment),
    }
  }

  const updatedMeta: AppointmentBookingMeta = {
    ...meta,
    depositStatus: 'PROOF_SUBMITTED',
    depositChannelLabel: 'WhatsApp',
    proofReference: 'Declarado por cliente vía WhatsApp (en espera de comprobante)',
    whatsappPaymentDeclared: true,
    whatsappDeclaredAt: new Date().toISOString(),
  }

  const updatedAppt = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: 'PENDING',
      notes: serializeAppointmentNotesWithMeta(cleanNotes, updatedMeta),
    },
    include: {
      client: true,
      barber: true,
      service: true,
      payment: true,
      business: { select: { id: true, name: true, slug: true } },
    },
  })

  return {
    alreadyApproved: false,
    appointment: updatedAppt,
    financials: resolveAppointmentFinancials(updatedAppt),
  }
}

/**
 * Registra el cobro del saldo restante en Finanzas (Liquidación total de cita).
 * Actualiza el registro de pago unificado (Anticipo + Saldo) sin duplicar ingresos contables.
 */
export async function registerBalancePayment(params: {
  appointmentId: string
  businessId: string
  balanceAmount?: number
  balanceMethod?: PaymentMethod
  collectedByName?: string
  collectedByUserId?: string
}) {
  const {
    appointmentId,
    businessId,
    balanceMethod = 'CASH',
    collectedByName,
    collectedByUserId,
  } = params

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { payment: true, service: true, client: true, barber: true, business: true },
  })

  if (!appointment || appointment.businessId !== businessId) {
    throw new BookingEngineError(
      'Cita no encontrada o no pertenece a este negocio.',
      404,
      'APPOINTMENT_NOT_FOUND'
    )
  }

  const financials = resolveAppointmentFinancials(appointment)
  const { cleanNotes, meta } = parseAppointmentNotesAndMeta(appointment.notes)

  if (
    appointment.payment &&
    (appointment.payment.status === 'PAID' || appointment.payment.status === 'COMPLETED')
  ) {
    return appointment
  }

  const totalPrice = financials.totalPrice
  const alreadyPaidDeposit = financials.isDepositApproved ? financials.depositPaidAmount : 0
  const amountCollectedNow = Math.max(0, totalPrice - alreadyPaidDeposit)
  const now = new Date()

  const depositMethod = meta.depositPaymentMethod || 'TRANSFER'
  const paymentNotes =
    alreadyPaidDeposit > 0
      ? `Total: $${totalPrice.toLocaleString('es-CO')} (Anticipo: $${alreadyPaidDeposit.toLocaleString('es-CO')} [${depositMethod}] + Saldo: $${amountCollectedNow.toLocaleString('es-CO')} [${balanceMethod}])`
      : `Pago total: $${totalPrice.toLocaleString('es-CO')} [${balanceMethod}]`

  const updatedMeta: AppointmentBookingMeta = {
    ...meta,
    totalPrice,
    depositPaidAmount: alreadyPaidDeposit,
    depositPaymentMethod: alreadyPaidDeposit > 0 ? depositMethod : null,
    balancePaidAmount: amountCollectedNow,
    balancePaymentMethod: balanceMethod,
    remainingBalance: 0,
  }

  return await prisma.$transaction(async (tx) => {
    let payment
    if (appointment.payment) {
      payment = await tx.payment.update({
        where: { id: appointment.payment.id },
        data: {
          amount: totalPrice,
          status: 'PAID',
          method: balanceMethod,
          paidAt: now,
          paymentCode: appointment.payment.paymentCode || generatePaymentCode(),
          notes: paymentNotes,
        },
      })
    } else {
      payment = await tx.payment.create({
        data: {
          businessId,
          appointmentId,
          amount: totalPrice,
          method: balanceMethod,
          status: 'PAID',
          paidAt: now,
          paymentCode: generatePaymentCode(),
          notes: paymentNotes,
        },
      })
    }

    return await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        paidAt: now,
        paymentMethod: balanceMethod,
        notes: serializeAppointmentNotesWithMeta(cleanNotes, updatedMeta),
      },
      include: {
        payment: true,
        service: true,
        client: true,
        barber: true,
        business: true,
      },
    })
  })
}
