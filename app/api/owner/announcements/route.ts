import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET /api/owner/announcements
 * Retorna los comunicados publicados del Super Admin relevantes para este negocio.
 * No expone comunicados de otros negocios ni datos internos de la plataforma.
 */
export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'BRANCH_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // targetBusinessIds is stored as JSON array in DB
    // We fetch all published announcements and filter client-side for SPECIFIC ones
    const allAnnouncements = await prisma.platformAnnouncement.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        targetType: true,
        targetBusinessIds: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Filter: ALL targets or SPECIFIC that includes this business
    const announcements = allAnnouncements
      .filter(a => {
        if (a.targetType === 'ALL') return true
        if (a.targetType === 'SPECIFIC') {
          const ids = Array.isArray(a.targetBusinessIds) ? a.targetBusinessIds : []
          return ids.includes(session.businessId)
        }
        return false
      })
      .slice(0, 10)

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Owner Announcements GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar comunicados' }, { status: 500 })
  }
}
