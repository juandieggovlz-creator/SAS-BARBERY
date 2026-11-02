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
    const search = searchParams.get('search')?.trim() || ''
    const role = searchParams.get('role') || 'ALL'
    const status = searchParams.get('status') || 'ALL'

    const whereClause: Record<string, unknown> = {}

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
        { barber: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (role !== 'ALL') {
      whereClause.role = role
    }

    if (status === 'ACTIVE') {
      whereClause.isActive = true
    } else if (status === 'INACTIVE') {
      whereClause.isActive = false
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true, slug: true } },
          barber: { select: { id: true, name: true, specialty: true } }
        }
      }),
      prisma.user.count({ where: whereClause })
    ])

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        businessName: u.business?.name || (u.role === 'SUPER_ADMIN' ? 'BarberOS SaaS' : 'Sin Negocio'),
        businessId: u.business?.id || null,
        displayName: u.barber?.name || u.email.split('@')[0]
      })),
      total
    })
  } catch (error) {
    console.error('Super Admin Users API Error:', error)
    return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, isActive, role } = body

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Evitar que el Super Admin se bloquee a sí mismo
    if (targetUser.id === session.userId && isActive === false) {
      return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (role && ['SUPER_ADMIN', 'OWNER', 'BARBER'].includes(role)) updateData.role = role

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: userId,
      businessId: targetUser.businessId || undefined,
      details: { previous: { isActive: targetUser.isActive, role: targetUser.role }, updated: updateData }
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    if (userId === session.userId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: userId,
      businessId: targetUser.businessId || undefined,
      details: { email: targetUser.email, role: targetUser.role }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
