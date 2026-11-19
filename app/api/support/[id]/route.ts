import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { notifySentinelTicketReply } from '@/lib/telegram-sentinel'

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
    const { message, action } = body

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        business: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, name: true } }
      }
    })

    if (!ticket || ticket.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    // Aislamiento de barberos: solo pueden interactuar con sus propios tickets
    if (session.role === 'BARBER' && ticket.userId !== session.userId) {
      return NextResponse.json({ error: 'No tienes permiso para ver o responder este ticket' }, { status: 403 })
    }

    const senderUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true }
    })

    const senderName = senderUser?.name || senderUser?.email.split('@')[0] || (session.role === 'OWNER' ? 'Propietario' : 'Barbero')

    // Acción de reapertura explícita
    if (action === 'REOPEN') {
      const reopenMsg = message?.trim() || 'El usuario ha reabierto el ticket porque el problema persiste.'
      const newMsg = await prisma.ticketMessage.create({
        data: {
          ticketId,
          senderId: session.userId,
          senderName,
          senderRole: session.role,
          message: reopenMsg
        }
      })

      const updated = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        }
      })

      await recordAuditLog({
        userId: session.userId,
        action: 'SUPPORT_TICKET_REOPENED',
        entity: 'SupportTicket',
        entityId: ticketId,
        businessId: session.businessId,
        details: { previousStatus: ticket.status, newStatus: 'IN_PROGRESS' }
      })

      notifySentinelTicketReply({
        ticketCode: ticket.ticketCode,
        businessName: ticket.business.name,
        senderName,
        senderRole: session.role,
        message: `[REAPERTURA DE TICKET] ${reopenMsg}`,
        ticketId
      }).catch(err => console.error('[Sentinel Error - Ticket Reopened]:', err))

      return NextResponse.json({ success: true, message: newMsg, ticket: updated })
    }

    const cleanMessage = String(message || '').trim()
    if (!cleanMessage) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }

    if (cleanMessage.length > 5000) {
      return NextResponse.json({ error: 'El mensaje no debe superar 5000 caracteres' }, { status: 400 })
    }

    // Anti-duplicados por doble clic (5 segundos)
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000)
    const duplicate = await prisma.ticketMessage.findFirst({
      where: {
        ticketId,
        senderId: session.userId,
        message: cleanMessage,
        createdAt: { gte: fiveSecondsAgo }
      }
    })

    if (duplicate) {
      return NextResponse.json({ error: 'Mensaje ya enviado hace unos segundos.' }, { status: 429 })
    }

    const newMsg = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: session.userId,
        senderName,
        senderRole: session.role,
        message: cleanMessage
      }
    })

    // Si el ticket estaba resuelto o cerrado, reabrir a IN_PROGRESS automáticamente
    const shouldReopen = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
    const updatedStatus = shouldReopen ? 'IN_PROGRESS' : ticket.status

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: updatedStatus,
        updatedAt: new Date()
      }
    })

    // Notificación en Telegram Sentinel (No bloqueante)
    notifySentinelTicketReply({
      ticketCode: ticket.ticketCode,
      businessName: ticket.business.name,
      senderName,
      senderRole: session.role,
      message: cleanMessage,
      ticketId
    }).catch(err => {
      console.error('[Sentinel Error - Ticket Reply]:', err)
    })

    return NextResponse.json({ success: true, message: newMsg })
  } catch (error) {
    console.error('Send Ticket Message Error:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
