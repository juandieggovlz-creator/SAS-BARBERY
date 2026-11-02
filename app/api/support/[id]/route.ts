import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id: ticketId } = await context.params

  try {
    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket || ticket.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const senderUser = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    const senderName = senderUser?.email.split('@')[0] || (session.role === 'OWNER' ? 'Propietario' : 'Barbero')

    const newMsg = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: session.userId,
        senderName,
        senderRole: session.role,
        message: message.trim()
      }
    })

    // If ticket was closed or resolved, reopen it or mark in progress
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
      })
    } else {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      })
    }

    return NextResponse.json({ success: true, message: newMsg })
  } catch (error) {
    console.error('Send Ticket Message Error:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
