import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            service: true,
            barber: true,
            payment: true
          },
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!client || client.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const completedAppointments = client.appointments.filter(a => a.status === 'COMPLETED')
    const totalSpent = completedAppointments.reduce((acc, a) => acc + Number(a.service?.price || 0), 0)
    const totalVisits = completedAppointments.length

    const lastVisit = completedAppointments[0]?.date || null
    const futureAppts = client.appointments.filter(a => new Date(a.date) > new Date() && a.status !== 'CANCELLED')
    const nextVisit = futureAppts[futureAppts.length - 1]?.date || null

    return NextResponse.json({
      client,
      stats: {
        totalVisits,
        totalSpent,
        lastVisit,
        nextVisit
      }
    })
  } catch (error) {
    console.error("Get Client Detail Error:", error)
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, email, internalNotes } = body

    const existingClient = await prisma.client.findUnique({ where: { id } })
    if (!existingClient || existingClient.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(internalNotes !== undefined ? { internalNotes } : {})
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Update Client Error:", error)
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}
