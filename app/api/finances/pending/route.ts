import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generatePaymentCode } from '@/lib/payments'
import {
  parseAppointmentNotesAndMeta,
  resolveAppointmentFinancials,
  serializeAppointmentNotesWithMeta,
} from '@/lib/booking/booking-metadata'
import { recordAuditLog } from '@/lib/audit'

const ALLOWED_ROLES = ['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN', 'ROOT_PLATFORM_OWNER']

// PATCH /api/finances/pending
// Body: { appointmentId, paymentMethod, action, status }
// Si la cita ya tenía un anticipo verificado (ej. $10.000 de $40.000), cobra únicamente
// el saldo restante ($30.000) y consolida el pago en total ($40.000) sin duplicar el anticipo.
export async function PATCH(request: Request) {
  const session = await getSession()
  if (
    !session ||
    !session.businessId ||
    !ALLOWED_ROLES.includes(session.role)
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const {
      appointmentId,
      paymentMethod,
      action,
      status: requestedStatus,
    } = await request.json()

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId requerido' },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, payment: true },
    })

    if (!appointment || appointment.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    const financials = resolveAppointmentFinancials(appointment)
    const { cleanNotes, meta } = parseAppointmentNotesAndMeta(appointment.notes)

    // ── Reembolso / Devolución con trazabilidad ──
    if (action === 'REFUND' || requestedStatus === 'REFUNDED') {
      if (!appointment.payment) {
        return NextResponse.json(
          { error: 'No existe un pago asociado a esta cita para reembolsar' },
          { status: 400 }
        )
      }

      const refundedPayment = await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: {
          status: 'REFUNDED',
          notes: `${appointment.payment.notes ? `${appointment.payment.notes} · ` : ''}Reembolsado el ${new Date().toISOString()}`,
        },
      })

      const refundedMeta = {
        ...meta,
        depositPaidAmount: 0,
        balancePaidAmount: 0,
        remainingBalance: financials.totalPrice,
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paidAt: null,
          depositPaid: false,
          notes: serializeAppointmentNotesWithMeta(cleanNotes, refundedMeta),
        },
      })

      await recordAuditLog({
        userId: session.userId,
        businessId: session.businessId,
        action: 'REFUND_APPOINTMENT_PAYMENT',
        entity: 'Appointment',
        entityId: appointmentId,
        details: {
          paymentId: refundedPayment.id,
          amountRefunded: Number(refundedPayment.amount),
        },
      })

      return NextResponse.json({
        success: true,
        payment: refundedPayment,
      })
    }

    // Idempotencia: si ya está completamente pagada, devolver estado actual sin duplicar
    if (
      appointment.payment &&
      (appointment.payment.status === 'PAID' ||
        appointment.payment.status === 'COMPLETED')
    ) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        payment: appointment.payment,
        collectedNow: 0,
        totalPrice: financials.totalPrice,
      })
    }

    const method = paymentMethod || 'CASH'
    const totalPrice = financials.totalPrice
    const alreadyPaidDeposit = financials.isDepositApproved
      ? financials.depositPaidAmount
      : 0
    const amountCollectedNow = Math.max(0, totalPrice - alreadyPaidDeposit)
    const now = new Date()

    const depositMethod = meta.depositPaymentMethod || 'TRANSFER'
    const paymentNotes =
      alreadyPaidDeposit > 0
        ? `Total: $${totalPrice.toLocaleString('es-CO')} (Anticipo: $${alreadyPaidDeposit.toLocaleString('es-CO')} [${depositMethod}] + Saldo: $${amountCollectedNow.toLocaleString('es-CO')} [${method}])`
        : `Pago total: $${totalPrice.toLocaleString('es-CO')} [${method}]`

    const updatedMeta = {
      ...meta,
      totalPrice,
      depositPaidAmount: alreadyPaidDeposit,
      depositPaymentMethod: alreadyPaidDeposit > 0 ? depositMethod : null,
      balancePaidAmount: amountCollectedNow,
      balancePaymentMethod: method,
      remainingBalance: 0,
    }

    const result = await prisma.$transaction(async (tx) => {
      let payment
      if (appointment.payment) {
        payment = await tx.payment.update({
          where: { id: appointment.payment.id },
          data: {
            amount: totalPrice,
            status: 'PAID',
            method,
            paidAt: now,
            paymentCode:
              appointment.payment.paymentCode || generatePaymentCode(),
            notes: paymentNotes,
          },
        })
      } else {
        payment = await tx.payment.create({
          data: {
            businessId: session.businessId!,
            appointmentId,
            amount: totalPrice,
            method,
            status: 'PAID',
            paidAt: now,
            paymentCode: generatePaymentCode(),
            notes: paymentNotes,
          },
        })
      }

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          paidAt: now,
          paymentMethod: method,
          status: 'COMPLETED',
          notes: serializeAppointmentNotesWithMeta(cleanNotes, updatedMeta),
        },
      })

      return { payment, updatedAppointment }
    })

    await recordAuditLog({
      userId: session.userId,
      businessId: session.businessId,
      action: 'COLLECT_APPOINTMENT_BALANCE',
      entity: 'Appointment',
      entityId: appointmentId,
      details: {
        paymentId: result.payment.id,
        totalPrice,
        alreadyPaidDeposit,
        amountCollectedNow,
        method,
      },
    })

    return NextResponse.json({
      success: true,
      payment: result.payment,
      collectedNow: amountCollectedNow,
      alreadyPaidDeposit,
      totalPrice,
    })
  } catch (error) {
    console.error('Mark Payment Error:', error)
    return NextResponse.json(
      { error: 'Error al registrar el pago' },
      { status: 500 }
    )
  }
}
