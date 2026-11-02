import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generatePaymentCode } from '@/lib/payments'

// PATCH /api/finances/pending
// Body: { appointmentId, paymentMethod }
// Updates existing PENDING payment to PAID, or creates a new PAID payment
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { appointmentId, paymentMethod, action, status: requestedStatus } = await request.json()

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId requerido' }, { status: 400 })
    }

    // Verify appointment belongs to this business
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, payment: true }
    })

    if (!appointment || appointment.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    // Check for Refund Request
    if (action === 'REFUND' || requestedStatus === 'REFUNDED') {
      if (!appointment.payment) {
        return NextResponse.json({ error: 'No existe un pago asociado a esta cita para reembolsar' }, { status: 400 })
      }

      const refundedPayment = await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: {
          status: 'REFUNDED'
        }
      })

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paidAt: null
        }
      })

      return NextResponse.json({ success: true, payment: refundedPayment })
    }

    const method = paymentMethod || 'CASH'
    const amount = Number(appointment.service?.price || 0)
    const now = new Date()

    let payment

    if (appointment.payment) {
      if (appointment.payment.status === 'PAID' || appointment.payment.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Esta cita ya tiene un pago cobrado' }, { status: 400 })
      }

      // Update existing PENDING payment
      payment = await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: {
          status: 'PAID',
          method,
          paidAt: now,
          paymentCode: appointment.payment.paymentCode || generatePaymentCode()
        }
      })
    } else {
      // Create new payment record directly as PAID
      payment = await prisma.payment.create({
        data: {
          businessId: session.businessId,
          appointmentId,
          amount,
          method,
          status: 'PAID',
          paidAt: now,
          paymentCode: generatePaymentCode()
        }
      })
    }

    // Update appointment paidAt and paymentMethod
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paidAt: now,
        paymentMethod: method,
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Mark Payment Error:', error)
    return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 })
  }
}
