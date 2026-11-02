import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensurePaymentForAppointment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.businessId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    
    // Multi-tenant Ownership Verification
    const currentAppt = await prisma.appointment.findUnique({ 
      where: { id }, 
      include: { service: true, barber: true } 
    })
    if (!currentAppt || currentAppt.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    if (session.role === 'BARBER' && currentAppt.barberId !== session.barberId) {
       return NextResponse.json({ error: 'No tienes permiso para editar esta cita' }, { status: 403 })
    }

    const data: Record<string, unknown> = {}
    
    if (body.status !== undefined) data.status = body.status
    if (body.clientId !== undefined) data.clientId = body.clientId
    if (body.barberId !== undefined) data.barberId = body.barberId
    if (body.serviceId !== undefined) data.serviceId = body.serviceId
    if (body.date !== undefined) {
      const d = new Date(body.date)
      if (!isNaN(d.getTime())) data.date = d
    }

    const finalBarberId = (body.barberId as string) ?? currentAppt.barberId
    const finalServiceId = (body.serviceId as string) ?? currentAppt.serviceId
    const finalDate: Date = (data.date as Date) ?? currentAppt.date
    const finalStatus = (body.status as string) ?? currentAppt.status

    if (['PENDING', 'CONFIRMED'].includes(finalStatus)) {
      const service = finalServiceId === currentAppt.serviceId 
        ? currentAppt.service 
        : await prisma.service.findUnique({ where: { id: finalServiceId } })
      
      const duration = service?.duration ?? 30
      const newStart = finalDate
      const newEnd = new Date(newStart.getTime() + duration * 60000)

      const existingAppts = await prisma.appointment.findMany({
        where: {
          businessId: session.businessId,
          barberId: finalBarberId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: id },
          date: {
            gte: new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate()),
            lt: new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate() + 1)
          }
        },
        include: { service: true }
      })

      const hasConflict = existingAppts.some((appt: { date: Date | string; service: { duration?: number } | null }) => {
        const existingStart = new Date(appt.date)
        const apptDuration = appt.service?.duration ?? 30
        const existingEnd = new Date(existingStart.getTime() + apptDuration * 60000)
        return newStart < existingEnd && newEnd > existingStart
      })

      if (hasConflict) {
        return NextResponse.json({ error: 'Este barbero ya tiene una cita en ese horario' }, { status: 400 })
      }
    }
    
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: { client: true, barber: true, service: true },
    })

    if (finalStatus === 'COMPLETED') {
      await ensurePaymentForAppointment(id, { status: 'PENDING' })
    }

    return NextResponse.json(appointment)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar cita' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || !session.businessId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const apptToDelete = await prisma.appointment.findUnique({ 
      where: { id },
      include: { barber: true }
    })
    if (!apptToDelete || apptToDelete.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    if (session.role === 'BARBER' && apptToDelete.barberId !== session.barberId) {
       return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE ERROR:', error)
    return NextResponse.json({ error: 'Error al eliminar la cita' }, { status: 500 })
  }
}
