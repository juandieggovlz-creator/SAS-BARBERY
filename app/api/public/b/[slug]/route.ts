import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        page: true,
        barbers: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            specialty: true,
            avatar: true
          },
          orderBy: { name: 'asc' }
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true
          },
          orderBy: { category: 'asc' }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    return NextResponse.json(business, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error) {
    console.error('Error fetching public business config:', error)
    return NextResponse.json({ error: 'Error al obtener la configuración' }, { status: 500 })
  }
}
