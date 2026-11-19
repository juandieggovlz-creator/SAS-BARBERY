import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { sendSupportTicketReplyEmail, sendSupportTicketResolvedEmail } from '@/lib/email'

export async function GET(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ALL'
    const priority = searchParams.get('priority') || 'ALL'
    const search = searchParams.get('search')?.trim() || ''

    const whereClause: Record<string, unknown> = {}
    if (status !== 'ALL') whereClause.status = status
    if (priority !== 'ALL') whereClause.priority = priority
    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketCode: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [tickets, openCount, inProgressCount, resolvedCount, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
          business: { select: { id: true, name: true, slug: true, email: true, phone: true } },
          user: { select: { id: true, email: true, name: true, role: true } },
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.supportTicket.count()
    ])

    return NextResponse.json({
      tickets: tickets.map(t => ({
        id: t.id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        businessId: t.business.id,
        businessName: t.business.name,
        businessSlug: t.business.slug,
        userEmail: t.user.email,
        userName: t.user.name || t.user.email.split('@')[0],
        messagesCount: t.messages.length,
        messages: t.messages
      })),
      counts: {
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        total: totalCount
      }
    })
  } catch (error) {
    console.error('Super Admin Support Tickets GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar tickets' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, status, priority, replyMessage } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de ticket requerido' }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, email: true, name: true } }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    let newAdminMessage: any = null

    // If there is a reply from the super admin
    if (replyMessage && replyMessage.trim()) {
      newAdminMessage = await prisma.ticketMessage.create({
        data: {
          ticketId: id,
          senderId: session.userId,
          senderName: 'BarberOS Soporte Master',
          senderRole: 'SUPER_ADMIN',
          message: replyMessage.trim()
        }
      })
      // If status wasn't explicitly changed, mark in progress or resolved
      if (!status && ticket.status === 'OPEN') {
        updateData.status = 'IN_PROGRESS'
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        business: { select: { id: true, name: true } }
      }
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'SUPPORT_TICKET_UPDATED',
      entity: 'SupportTicket',
      entityId: id,
      businessId: ticket.businessId,
      details: {
        status: updated.status,
        previousStatus: ticket.status,
        replyAdded: !!replyMessage
      }
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sas-barbery.vercel.app'
    const ticketLink = `${appUrl}/support`
    const clientEmail = ticket.user.email
    const clientName = ticket.user.name || clientEmail.split('@')[0]

    // ─── 1. Notificación por Correo: Nueva respuesta del Super Admin (No bloqueante) ───
    if (replyMessage && replyMessage.trim() && clientEmail) {
      sendSupportTicketReplyEmail({
        to: clientEmail,
        userName: clientName,
        businessName: ticket.business.name,
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        senderName: 'Equipo de Soporte BarberOS',
        replySnippet: replyMessage.trim(),
        ticketLink
      }).catch(err => {
        console.error('[Resend Error - Admin Reply]:', err)
      })
    }

    // ─── 2. Notificación por Correo: Ticket Resuelto (No bloqueante) ───
    if (status === 'RESOLVED' && ticket.status !== 'RESOLVED' && clientEmail) {
      sendSupportTicketResolvedEmail({
        to: clientEmail,
        userName: clientName,
        businessName: ticket.business.name,
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        ticketLink
      }).catch(err => {
        console.error('[Resend Error - Ticket Resolved]:', err)
      })
    }

    return NextResponse.json({ success: true, ticket: updated, message: newAdminMessage })
  } catch (error) {
    console.error('Update Support Ticket Error:', error)
    return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 })
  }
}
