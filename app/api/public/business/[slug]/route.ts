import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            description: true,
            category: true
          },
          orderBy: { category: 'asc' }
        },
        barbers: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            specialty: true,
            avatar: true
          },
          orderBy: { name: 'asc' }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 })
    }

    return NextResponse.json(business, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error: unknown) {
    console.error('Public Business Route Error:', error)
    return NextResponse.json({ error: 'Error al consultar la barbería' }, { status: 500 })
  }
}
