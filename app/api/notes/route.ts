import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const ALLOWED_NOTE_ROLES = ['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN', 'ROOT_PLATFORM_OWNER']

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const isBarber = session.role === 'BARBER'
    const notes = await prisma.note.findMany({
      where: {
        businessId: session.businessId,
        ...(isBarber ? { category: { not: 'PRIVATE' } } : {})
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json(notes)
  } catch {
    return NextResponse.json({ error: 'Error al obtener notas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!ALLOWED_NOTE_ROLES.includes(session.role)) {
    return NextResponse.json(
      { error: 'Solo propietarios y administradores pueden crear notas en este tablero' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { title, content, isPinned, color, category, clientId, appointmentId } = body

    const cleanTitle = (title || '').trim().slice(0, 150)
    const cleanContent = (content || '').trim().slice(0, 5000)

    if (!cleanTitle || !cleanContent) {
      return NextResponse.json({ error: 'Título y contenido son requeridos' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        businessId: session.businessId,
        title: cleanTitle,
        content: cleanContent,
        isPinned: Boolean(isPinned),
        color: color || 'yellow',
        category: category || 'GENERAL',
        clientId: clientId || null,
        appointmentId: appointmentId || null
      }
    })

    // If clientId is provided, optionally update Client.internalNotes (scoping strictly to this business)
    if (clientId) {
      try {
        await prisma.client.updateMany({
          where: { id: clientId, businessId: session.businessId },
          data: { internalNotes: cleanContent }
        })
      } catch (err) {
        console.warn("Client internalNotes update skipped:", err)
      }
    }

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ error: 'Error al crear nota' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!ALLOWED_NOTE_ROLES.includes(session.role)) {
    return NextResponse.json(
      { error: 'Solo propietarios y administradores pueden modificar notas del tablero' },
      { status: 403 }
    )
  }

  try {
    const { id, isPinned, title, content, color, category } = await request.json()

    const note = await prisma.note.findUnique({ where: { id } })
    if (!note || note.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        ...(isPinned !== undefined ? { isPinned: Boolean(isPinned) } : {}),
        ...(title ? { title: String(title).trim().slice(0, 150) } : {}),
        ...(content ? { content: String(content).trim().slice(0, 5000) } : {}),
        ...(color ? { color } : {}),
        ...(category ? { category } : {})
      }
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Update note error:', error)
    return NextResponse.json({ error: 'Error al actualizar nota' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!ALLOWED_NOTE_ROLES.includes(session.role)) {
    return NextResponse.json(
      { error: 'Solo propietarios y administradores pueden eliminar notas del tablero' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const note = await prisma.note.findUnique({ where: { id } })
    if (!note || note.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar nota' }, { status: 500 })
  }
}
