import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractMotionConfigFromPage } from '@/lib/motion-presets'
import { parseBusinessDepositConfig } from '@/lib/booking/deposit-config'
import { getEffectiveSubscription } from '@/lib/commercial-permissions'

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
        company: {
          select: {
            id: true,
            name: true
          }
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

    // Sedes hermanas de la misma empresa para navegación cruzada
    let siblingBranches: {
      id: string
      name: string
      slug: string
      address: string | null
      phone: string | null
      isMainBranch: boolean
    }[] = []

    if (business.companyId) {
      siblingBranches = await prisma.business.findMany({
        where: {
          companyId: business.companyId,
          status: 'ACTIVE',
          id: { not: business.id }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          phone: true,
          isMainBranch: true
        },
        orderBy: [{ isMainBranch: 'desc' }, { name: 'asc' }]
      })
    }

    const depositConfig = parseBusinessDepositConfig(business)
    const advancePaymentConfig = {
      enabled: depositConfig.depositEnabled,
      ...depositConfig.paymentMethods,
    }

    const effectiveSub = await getEffectiveSubscription(business.id)

    return NextResponse.json(
      {
        ...business,
        effectiveSubscription: {
          tier: effectiveSub.tier,
          canUsePublicBooking: effectiveSub.permissions.canUsePublicBooking,
          isSandbox: effectiveSub.isSandbox,
          isSuspended: effectiveSub.isSuspended,
          statusLabel: effectiveSub.statusLabel
        },
        depositInstructions: depositConfig.cleanInstructions,
        advancePaymentConfig,
        page: business.page
          ? {
              ...business.page,
              advancePaymentConfig,
              ...extractMotionConfigFromPage(business.page),
            }
          : null,
        siblingBranches
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Error fetching public business config:', error)
    return NextResponse.json({ error: 'Error al obtener la configuración' }, { status: 500 })
  }
}
