import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const announcements = await prisma.platformAnnouncement.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Super Admin Announcements GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar comunicados' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, content, type = 'ANNOUNCEMENT', targetType = 'ALL', targetBusinessIds = [], isPublished = true } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Título y contenido son requeridos' }, { status: 400 })
    }

    const created = await prisma.platformAnnouncement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type,
        targetType,
        targetBusinessIds: Array.isArray(targetBusinessIds) ? targetBusinessIds : [],
        isPublished: Boolean(isPublished)
      }
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'ANNOUNCEMENT_CREATED',
      entity: 'PlatformAnnouncement',
      entityId: created.id,
      details: { title: created.title, type: created.type }
    })

    return NextResponse.json({ success: true, announcement: created }, { status: 201 })
  } catch (error) {
    console.error('Create Announcement Error:', error)
    return NextResponse.json({ error: 'Error al publicar comunicado' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, isPublished, title, content, type } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (type) updateData.type = type

    const updated = await prisma.platformAnnouncement.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, announcement: updated })
  } catch (error) {
    console.error('Update Announcement Error:', error)
    return NextResponse.json({ error: 'Error al actualizar comunicado' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.platformAnnouncement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete Announcement Error:', error)
    return NextResponse.json({ error: 'Error al eliminar comunicado' }, { status: 500 })
  }
}
