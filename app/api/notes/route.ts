import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const notes = await prisma.note.findMany({
      where: { businessId: session.businessId },
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

  try {
    const body = await request.json()
    const { title, content, isPinned, color, category, clientId, appointmentId } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Título y contenido son requeridos' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        businessId: session.businessId,
        title,
        content,
        isPinned: Boolean(isPinned),
        color: color || 'yellow',
        category: category || 'GENERAL',
        clientId: clientId || null,
        appointmentId: appointmentId || null
      }
    })

    // If clientId is provided, optionally update Client.internalNotes
    if (clientId) {
      try {
        await prisma.client.update({
          where: { id: clientId },
          data: { internalNotes: content }
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

  try {
    const { id, isPinned, title, content, color, category } = await request.json()

    const note = await prisma.note.findUnique({ where: { id } })
    if (!note || note.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        ...(isPinned !== undefined ? { isPinned } : {}),
        ...(title ? { title } : {}),
        ...(content ? { content } : {}),
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
