import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

function parseMessage(raw: {
  id: string
  senderId: string
  senderName: string
  senderRole: 'OWNER' | 'BRANCH_ADMIN' | 'BARBER' | 'SUPER_ADMIN'
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
      const parsed = JSON.parse(raw.content)
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
  } catch {}

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

// PATCH /api/chat/messages/[id]/important — Toggle important
export async function PATCH(
  _request: Request,
  ctx: RouteContext<'/api/chat/messages/[id]/important'>
) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await ctx.params

  try {
    const msg = await prisma.chatMessage.findFirst({
      where: { id, businessId: session.businessId as string }
    })
    if (!msg) return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: { isImportant: !msg.isImportant }
    })
    
    return NextResponse.json({ message: parseMessage(updated) })
  } catch (error) {
    console.error('Toggle important error:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
