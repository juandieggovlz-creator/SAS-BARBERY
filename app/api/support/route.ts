import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { businessId: session.businessId },
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

    return NextResponse.json({ tickets })
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
    const { subject, description, priority = 'MEDIUM' } = body

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'El asunto y la descripción son obligatorios' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: session.businessId }
    })

    const senderUser = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    const senderName = senderUser?.email.split('@')[0] || (session.role === 'OWNER' ? 'Propietario' : 'Barbero')

    // Create SupportTicket with initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        businessId: session.businessId,
        userId: session.userId,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: 'OPEN',
        messages: {
          create: {
            senderId: session.userId,
            senderName,
            senderRole: session.role,
            message: description.trim()
          }
        }
      },
      include: {
        messages: true
      }
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'TICKET_CREATED',
      entity: 'SupportTicket',
      entityId: ticket.id,
      businessId: session.businessId,
      details: { subject: ticket.subject, priority: ticket.priority, businessName: business?.name }
    })

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error) {
    console.error('Owner Support Create Error:', error)
    return NextResponse.json({ error: 'Error al crear ticket de soporte' }, { status: 500 })
  }
}
