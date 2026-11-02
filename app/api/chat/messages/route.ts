import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface StructuredContent {
  text: string
  channelId?: string
  recipientId?: string | null
  recipientName?: string | null
  appointment?: {
    id: string
    reservationCode: string
    clientName: string
    clientPhone?: string
    clientNotes?: string | null
    serviceName: string
    servicePrice: number
    barberName: string
    date: string
    status: string
    notes?: string | null
  } | null
  note?: {
    id: string
    title: string
    content: string
    color?: string | null
    category?: string | null
    createdAt?: string
  } | null
  mentions?: string[]
}

function parseMessage(raw: {
  id: string
  senderId: string
  senderName: string
  senderRole: 'OWNER' | 'BARBER' | 'SUPER_ADMIN'
  content: string
  isImportant: boolean
  createdAt: Date
}) {
  let text = raw.content
  let channelId = 'general'
  let recipientId: string | null = null
  let recipientName: string | null = null
  let appointment = null
  let note = null
  let mentions: string[] = []

  try {
    if (raw.content.startsWith('{') && raw.content.endsWith('}')) {
      const parsed = JSON.parse(raw.content) as StructuredContent
      if (parsed && typeof parsed === 'object') {
        text = parsed.text || ''
        channelId = parsed.channelId || 'general'
        recipientId = parsed.recipientId || null
        recipientName = parsed.recipientName || null
        appointment = parsed.appointment || null
        note = parsed.note || null
        mentions = parsed.mentions || []
      }
    }
  } catch {
    // legacy plain text message
  }

  return {
    id: raw.id,
    senderId: raw.senderId,
    senderName: raw.senderName,
    senderRole: raw.senderRole,
    content: text,
    channelId,
    recipientId,
    recipientName,
    appointment,
    note,
    mentions,
    isImportant: raw.isImportant,
    createdAt: raw.createdAt.toISOString()
  }
}

// GET /api/chat/messages?channelId=general&since=ISO_DATE
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const targetChannel = searchParams.get('channelId') || 'general'
  const since = searchParams.get('since')

  try {
    const rawMessages = await prisma.chatMessage.findMany({
      where: {
        businessId: session.businessId,
        ...(since ? { createdAt: { gt: new Date(since) } } : {})
      },
      orderBy: { createdAt: 'asc' },
      take: since ? 60 : 150
    })

    const parsedMessages = rawMessages.map(parseMessage)

    // Filter by target channel
    const channelMessages = parsedMessages.filter(m => m.channelId === targetChannel)

    // Current user identifier for client
    const currentMemberId = session.role === 'BARBER' && session.barberId
      ? `barber_${session.barberId}`
      : `user_${session.userId}`

    return NextResponse.json({
      messages: channelMessages,
      allChannelStats: {
        // compute counts of unread or recent messages per channel if needed
      },
      currentUser: {
        id: session.userId,
        memberId: currentMemberId,
        role: session.role,
        barberId: session.barberId
      }
    })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
  }
}

// POST /api/chat/messages
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || !session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      content, 
      channelId = 'general', 
      recipientId = null, 
      recipientName = null,
      appointment = null,
      note = null,
      mentions = [],
      isImportant = false 
    } = body

    if ((!content || !content.trim()) && !appointment && !note) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }

    // Determine sender name and ID
    let senderName = 'Usuario'
    const senderMemberId = session.role === 'BARBER' && session.barberId
      ? `barber_${session.barberId}`
      : `user_${session.userId}`

    if (session.role === 'BARBER' && session.barberId) {
      const barber = await prisma.barber.findUnique({
        where: { id: session.barberId as string },
        select: { name: true }
      })
      senderName = barber?.name ?? 'Barbero'
    } else {
      const business = await prisma.business.findUnique({
        where: { id: session.businessId as string },
        select: { name: true }
      })
      senderName = business?.name ? `Dueño (${business.name})` : 'Dueño / Administración'
    }

    // Pack structured content
    const structuredPayload: StructuredContent = {
      text: (content || '').trim(),
      channelId,
      recipientId,
      recipientName,
      appointment: appointment || null,
      note: note || null,
      mentions: Array.isArray(mentions) ? mentions : []
    }

    const message = await prisma.chatMessage.create({
      data: {
        businessId: session.businessId as string,
        senderId: senderMemberId,
        senderName,
        senderRole: session.role,
        content: JSON.stringify(structuredPayload),
        isImportant: Boolean(isImportant)
      }
    })

    const parsed = parseMessage(message)
    return NextResponse.json({ message: parsed }, { status: 201 })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
