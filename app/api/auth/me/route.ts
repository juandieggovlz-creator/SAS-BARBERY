import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        businessId: true,
        companyId: true,
        barberId: true,
        company: {
          select: {
            id: true,
            name: true,
            status: true,
            maxBranches: true,
            additionalBranchPrice: true,
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                allowsMultiBranch: true
              }
            },
            _count: {
              select: { branches: true }
            }
          }
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            logo: true,
            isMainBranch: true,
            companyId: true,
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                allowsMultiBranch: true
              }
            }
          }
        },
        barber: {
          select: {
            id: true,
            name: true,
            specialty: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      authenticated: true,
      user,
      session: {
        role: session.role,
        businessId: session.businessId,
        companyId: session.companyId || user?.companyId || null,
        barberId: session.barberId,
        isSupportMode: Boolean(session.superAdminId),
        superAdminId: session.superAdminId || null
      }
    })
  } catch (error) {
    console.error('Error fetching auth state:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
