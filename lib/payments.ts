import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

export function generatePaymentCode(): string {
  const hex = randomBytes(3).toString('hex').toUpperCase()
  const dateStr = new Date().getFullYear().toString()
  return `PAY-${dateStr}-${hex}`
}

export async function ensurePaymentForAppointment(
  appointmentId: string,
  options?: {
    paymentMethod?: PaymentMethod
    status?: PaymentStatus
    notes?: string
  }
) {
  // Check if payment already exists
  const existingPayment = await prisma.payment.findUnique({
    where: { appointmentId }
  })

  if (existingPayment) {
    return existingPayment
  }

  // Fetch appointment details
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true }
  })

  if (!appointment) {
    throw new Error(`Appointment with ID ${appointmentId} not found`)
  }

  const amount = appointment.service?.price ? Number(appointment.service.price) : 0
  const method = options?.paymentMethod || appointment.paymentMethod || 'CASH'
  const status = options?.status || 'PENDING'
  const paidAt = (status === 'PAID' || status === 'COMPLETED') ? new Date() : null

  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      const paymentCode = generatePaymentCode()
      const newPayment = await prisma.payment.create({
        data: {
          businessId: appointment.businessId,
          appointmentId: appointment.id,
          paymentCode,
          amount,
          method,
          status,
          paidAt,
          notes: options?.notes || null
        }
      })
      return newPayment
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002' && attempts < maxAttempts - 1) {
        attempts++
        continue
      }
      throw error
    }
  }

  throw new Error('Failed to generate unique payment code')
}
