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
        name: true,
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

    // Si la sesión activa tiene un businessId diferente al principal del usuario (cambio de sede activo)
    let activeBusiness = user?.business
    if (session.businessId && session.businessId !== user?.businessId) {
      const switchedBusiness = await prisma.business.findUnique({
        where: { id: session.businessId },
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
      })
      if (switchedBusiness) {
        activeBusiness = switchedBusiness
      }
    }

    const companyName = user?.company?.name || activeBusiness?.name || 'BarberOS'

    return NextResponse.json({
      authenticated: true,
      user: user ? {
        ...user,
        business: activeBusiness
      } : null,
      activeBranch: activeBusiness ? {
        id: activeBusiness.id,
        name: activeBusiness.name,
        slug: activeBusiness.slug,
        isMainBranch: activeBusiness.isMainBranch
      } : null,
      companyName,
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
