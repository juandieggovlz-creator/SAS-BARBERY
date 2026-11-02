import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function GET(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
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

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        business: { select: { id: true, name: true, slug: true, email: true, phone: true } },
        user: { select: { id: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

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
        messagesCount: t.messages.length,
        messages: t.messages
      }))
    })
  } catch (error) {
    console.error('Super Admin Support Tickets GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar tickets' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
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
      include: { business: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    // If there is a reply from the super admin
    if (replyMessage && replyMessage.trim()) {
      await prisma.ticketMessage.create({
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
      details: { status: updated.status, replyAdded: !!replyMessage }
    })

    return NextResponse.json({ success: true, ticket: updated })
  } catch (error) {
    console.error('Update Support Ticket Error:', error)
    return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 })
  }
}
