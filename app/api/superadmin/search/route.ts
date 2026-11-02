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
    const q = searchParams.get('q')?.trim() || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ businesses: [], users: [] })
    }

    const [businesses, users] = await Promise.all([
      prisma.business.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ]
        },
        include: { plan: { select: { name: true } } },
        take: 6
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        },
        take: 6
      })
    ])

    return NextResponse.json({
      businesses: businesses.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        status: b.status,
        planName: b.plan?.name || 'Sin Plan'
      })),
      users
    })
  } catch (error) {
    console.error('Super Admin Global Search Error:', error)
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}
