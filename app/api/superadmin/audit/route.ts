import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'ALL'
    const entity = searchParams.get('entity') || 'ALL'
    const search = searchParams.get('search')?.trim() || ''

    const whereClause: Record<string, unknown> = {}

    if (action !== 'ALL') whereClause.action = action
    if (entity !== 'ALL') whereClause.entity = entity

    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        business: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, email: true, role: true } }
      }
    })

    return NextResponse.json({
      logs: logs.map(l => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        userName: l.userName || l.user?.email || 'Sistema',
        userRole: l.userRole || l.user?.role || 'SUPER_ADMIN',
        businessName: l.business?.name || null,
        businessId: l.businessId,
        ipAddress: l.ipAddress || '127.0.0.1',
        details: l.details,
        createdAt: l.createdAt
      }))
    })
  } catch (error) {
    console.error('Super Admin Audit GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar auditoría' }, { status: 500 })
  }
}
