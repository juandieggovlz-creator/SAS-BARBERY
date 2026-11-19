import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Role } from '@prisma/client'

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
  channelId?: string | null
  senderId: string
  senderName: string
  senderRole: string
  content: string
  isImportant: boolean
  createdAt: Date
}) {
  let text = raw.content
  let channelId = raw.channelId || 'general'
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
        channelId = raw.channelId || parsed.channelId || 'general'
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
    // Current user identifier for client
    const currentMemberId = session.role === 'BARBER' && session.barberId
      ? `barber_${session.barberId}`
      : `user_${session.userId}`

    // Control de privacidad: canales directos (DMs) solo accesibles para sus participantes
    if (targetChannel.startsWith('direct_') && session.role !== 'SUPER_ADMIN' && (session.role as string) !== 'ROOT_PLATFORM_OWNER') {
      const isOwnerOrAdmin = session.role === 'OWNER' || session.role === 'BRANCH_ADMIN'
      const matchesDirect =
        targetChannel.includes(currentMemberId) ||
        targetChannel.includes(session.userId) ||
        (isOwnerOrAdmin && targetChannel.includes('owner_admin'))

      if (!matchesDirect) {
        return NextResponse.json({ error: 'No tienes acceso a esta conversación privada' }, { status: 403 })
      }
    }

    // Filtro optimizado por canal con compatibilidad para mensajes legacy
    const channelFilter = targetChannel === 'general'
      ? {
        OR: [
          { channelId: 'general' },
          { channelId: null },
          { content: { contains: '"channelId":"general"' } }
        ]
      }
      : {
        OR: [
          { channelId: targetChannel },
          { content: { contains: `"channelId":"${targetChannel}"` } }
        ]
      }

    let rawMessages
    if (since) {
      rawMessages = await prisma.chatMessage.findMany({
        where: {
          businessId: session.businessId,
          ...channelFilter,
          createdAt: { gt: new Date(since) }
        },
        orderBy: { createdAt: 'asc' },
        take: 60
      })
    } else {
      rawMessages = await prisma.chatMessage.findMany({
        where: {
          businessId: session.businessId,
          ...channelFilter
        },
        orderBy: { createdAt: 'desc' },
        take: 150
      })
      rawMessages.reverse()
    }

    const parsedMessages = rawMessages.map(parseMessage)

    return NextResponse.json({
      messages: parsedMessages,
      allChannelStats: {},
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

    const cleanContent = (content || '').trim().slice(0, 2000)

    if (!cleanContent && !appointment && !note) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }

    // Determine sender name and ID
    let senderName = 'Usuario'
    const senderMemberId = session.role === 'BARBER' && session.barberId
      ? `barber_${session.barberId}`
      : `user_${session.userId}`

    // Control de privacidad: el usuario no puede enviar mensajes a conversaciones directas de otros
    if (channelId.startsWith('direct_') && session.role !== 'SUPER_ADMIN' && (session.role as string) !== 'ROOT_PLATFORM_OWNER') {
      const isOwnerOrAdmin = session.role === 'OWNER' || session.role === 'BRANCH_ADMIN'
      const matchesDirect =
        channelId.includes(senderMemberId) ||
        channelId.includes(session.userId) ||
        (isOwnerOrAdmin && channelId.includes('owner_admin'))

      if (!matchesDirect) {
        return NextResponse.json({ error: 'No tienes autorización para enviar mensajes a esta conversación privada' }, { status: 403 })
      }
    }

    if (session.role === 'BARBER' && session.barberId) {
      const barber = await prisma.barber.findUnique({
        where: { id: session.barberId as string },
        select: { name: true }
      })
      senderName = barber?.name ?? 'Barbero'
    } else if (session.role === 'BRANCH_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true }
      })
      senderName = user?.name ? `Admin (${user.name})` : 'Administrador de Sede'
    } else {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true }
      })
      const business = await prisma.business.findUnique({
        where: { id: session.businessId as string },
        select: { name: true }
      })
      senderName = user?.name || (business?.name ? `Dueño (${business.name})` : 'Dueño')
    }

    // Validar cita adjunta: asegurar que pertenezca al negocio del usuario (prevención de manipulación)
    let verifiedAppointment = null
    if (appointment && appointment.id) {
      const dbAppt = await prisma.appointment.findFirst({
        where: { id: appointment.id, businessId: session.businessId as string },
        include: {
          client: { select: { name: true, phone: true, internalNotes: true } },
          service: { select: { name: true, price: true } },
          barber: { select: { id: true, name: true } }
        }
      })
      if (dbAppt) {
        verifiedAppointment = {
          id: dbAppt.id,
          reservationCode: dbAppt.reservationCode,
          clientName: dbAppt.client?.name || 'Cliente sin nombre',
          clientPhone: dbAppt.client?.phone || '',
          clientNotes: dbAppt.client?.internalNotes || null,
          serviceName: dbAppt.service?.name || 'Servicio',
          servicePrice: Number(dbAppt.service?.price || 0),
          barberId: dbAppt.barber?.id || '',
          barberName: dbAppt.barber?.name || 'Barbero asignado',
          date: dbAppt.date.toISOString(),
          status: dbAppt.status,
          notes: dbAppt.notes || null
        }
      } else {
        verifiedAppointment = appointment
      }
    } else if (appointment) {
      verifiedAppointment = appointment
    }

    // Validar nota adjunta: asegurar que pertenezca al negocio
    let verifiedNote = null
    if (note && note.id) {
      const dbNote = await prisma.note.findFirst({
        where: { id: note.id, businessId: session.businessId as string }
      })
      if (dbNote) {
        verifiedNote = {
          id: dbNote.id,
          title: dbNote.title,
          content: dbNote.content,
          color: dbNote.color,
          category: dbNote.category,
          createdAt: dbNote.createdAt.toISOString()
        }
      } else {
        verifiedNote = note
      }
    } else if (note) {
      verifiedNote = note
    }

    // Pack structured content
    const structuredPayload: StructuredContent = {
      text: cleanContent,
      channelId,
      recipientId,
      recipientName,
      appointment: verifiedAppointment,
      note: verifiedNote,
      mentions: Array.isArray(mentions) ? mentions.slice(0, 20) : []
    }

    const message = await prisma.chatMessage.create({
      data: {
        businessId: session.businessId as string,
        channelId: channelId || 'general',
        senderId: senderMemberId,
        senderName,
        senderRole: session.role as Role,
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
