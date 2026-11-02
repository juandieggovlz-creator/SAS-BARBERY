import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id: clientId } = await params
    const barber = await prisma.barber.findUnique({ where: { id: session.barberId } })
    if (!barber || barber.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no autorizado' }, { status: 403 })
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client || client.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, category, color, isPinned } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'El contenido de la nota es requerido' }, { status: 400 })
    }

    const noteCategory = ['GENERAL', 'PRIVATE', 'PREFERENCE', 'ALERT', 'PHOTO'].includes(category)
      ? category
      : 'GENERAL'

    const noteTitle = noteCategory === 'PRIVATE'
      ? (title?.trim() ? `[${barber.name}] (Privada): ${title.trim()}` : `[${barber.name}] (Nota Privada)`)
      : (title?.trim() || `Nota (${barber.name})`)

    const newNote = await prisma.note.create({
      data: {
        businessId: session.businessId,
        clientId: client.id,
        title: noteTitle,
        content: content.trim(),
        category: noteCategory,
        color: color || (noteCategory === 'ALERT' ? 'red' : noteCategory === 'PRIVATE' ? 'purple' : 'yellow'),
        isPinned: Boolean(isPinned)
      }
    })

    // If it's an alert or preference, also update client.internalNotes for quick visibility
    if (noteCategory === 'ALERT' || noteCategory === 'PREFERENCE') {
      try {
        await prisma.client.update({
          where: { id: client.id },
          data: { internalNotes: content.trim() }
        })
      } catch (e) {
        console.warn('Could not update client internalNotes:', e)
      }
    }

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error('Create Client Note Error:', error)
    return NextResponse.json({ error: 'Error al registrar nota' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id: clientId } = await params
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'ID de nota requerido' }, { status: 400 })
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note || note.businessId !== session.businessId || note.clientId !== clientId) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    await prisma.note.delete({ where: { id: noteId } })
    return NextResponse.json({ success: true, message: 'Nota eliminada' })
  } catch (error) {
    console.error('Delete Client Note Error:', error)
    return NextResponse.json({ error: 'Error al eliminar nota' }, { status: 500 })
  }
}
