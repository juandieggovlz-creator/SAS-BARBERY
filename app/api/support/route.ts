import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { notifySentinelTicketCreated } from '@/lib/telegram-sentinel'
import { sendSupportTicketCreatedEmail } from '@/lib/email'

async function generateUniqueTicketCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000)
    const code = `SUP-${randomDigits}`
    const existing = await prisma.supportTicket.findUnique({
      where: { ticketCode: code },
      select: { id: true }
    })
    if (!existing) return code
  }
  // Fallback seguro con timestamp
  return `SUP-${Date.now().toString().slice(-6)}`
}

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const whereClause: Record<string, unknown> = {
      businessId: session.businessId
    }

    // Si el usuario es un barbero, aislar a sus tickets propios
    if (session.role === 'BARBER') {
      whereClause.userId = session.userId
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: { email: true, role: true }
        }
      }
    })

    const openCount = tickets.filter(t => t.status === 'OPEN').length
    const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length

    return NextResponse.json({
      tickets,
      counts: {
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        total: tickets.length
      }
    })
  } catch (error) {
    console.error('Owner Support GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar tickets de soporte' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subject, description, priority = 'MEDIUM', category } = body

    const cleanSubject = String(subject || '').trim()
    const cleanDescription = String(description || '').trim()

    if (!cleanSubject || !cleanDescription) {
      return NextResponse.json({ error: 'El asunto y la descripción son obligatorios' }, { status: 400 })
    }

    if (cleanSubject.length > 150) {
      return NextResponse.json({ error: 'El asunto no debe superar 150 caracteres' }, { status: 400 })
    }

    if (cleanDescription.length > 5000) {
      return NextResponse.json({ error: 'La descripción no debe superar 5000 caracteres' }, { status: 400 })
    }

    // 1. Anti-doble envío (deduplicación en ventana de 10 segundos)
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000)
    const recentDuplicate = await prisma.supportTicket.findFirst({
      where: {
        businessId: session.businessId,
        userId: session.userId,
        subject: cleanSubject,
        createdAt: { gte: tenSecondsAgo }
      }
    })

    if (recentDuplicate) {
      return NextResponse.json({
        error: 'Ya enviaste un ticket con este mismo asunto hace un momento. Por favor espera.'
      }, { status: 429 })
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const assignedPriority = validPriorities.includes(priority) ? priority : 'MEDIUM'

    // Formatear asunto con categoría si fue provista
    const formattedSubject = category && !cleanSubject.startsWith('[')
      ? `[${category}] ${cleanSubject}`
      : cleanSubject

    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { id: true, name: true, slug: true, email: true, phone: true }
    })

    const senderUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true }
    })

    const senderName = senderUser?.name || senderUser?.email.split('@')[0] || (session.role === 'OWNER' ? 'Propietario' : 'Barbero')
    const ticketCode = await generateUniqueTicketCode()

    // Create SupportTicket with initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketCode,
        businessId: session.businessId,
        userId: session.userId,
        subject: formattedSubject,
        description: cleanDescription,
        priority: assignedPriority,
        status: 'OPEN',
        messages: {
          create: {
            senderId: session.userId,
            senderName,
            senderRole: session.role,
            message: cleanDescription
          }
        }
      },
      include: {
        messages: true
      }
    })

    // Registro de Auditoría
    await recordAuditLog({
      userId: session.userId,
      action: 'TICKET_CREATED',
      entity: 'SupportTicket',
      entityId: ticket.id,
      businessId: session.businessId,
      details: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        priority: ticket.priority,
        businessName: business?.name
      }
    })

    // URL canónica para acceder al ticket
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sas-barbery.vercel.app'
    const ticketLink = `${appUrl}/support`

    // ─── 1. Notificación a Telegram Sentinel (No bloqueante) ───
    notifySentinelTicketCreated({
      ticketCode: ticket.ticketCode,
      subject: ticket.subject,
      priority: ticket.priority,
      businessName: business?.name || 'Barbería BarberOS',
      userEmail: senderUser?.email || 'propietario@barberos.site',
      description: cleanDescription,
      ticketId: ticket.id
    }).catch(err => {
      console.error('[Sentinel Error - Ticket Created]:', err)
    })

    // ─── 2. Correo de Confirmación vía Resend (No bloqueante) ───
    if (senderUser?.email) {
      sendSupportTicketCreatedEmail({
        to: senderUser.email,
        userName: senderName,
        businessName: business?.name || 'Barbería',
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        priority: ticket.priority,
        description: cleanDescription,
        ticketLink
      }).catch(err => {
        console.error('[Resend Error - Ticket Created]:', err)
      })
    }

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error) {
    console.error('Owner Support Create Error:', error)
    return NextResponse.json({ error: 'Error al crear ticket de soporte' }, { status: 500 })
  }
}
