import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        billingPeriod: true,
        maxBarbers: true,
        maxClients: true,
        maxAppointments: true,
        features: true,
        isPopular: true,
        isActive: true,
      }
    })

    const formattedPlans = plans.map((p) => ({
      ...p,
      price: Number(p.price),
      features: Array.isArray(p.features) ? p.features : []
    }))

    return NextResponse.json({
      success: true,
      plans: formattedPlans
    })
  } catch (error) {
    console.error('Error fetching public plans:', error)
    return NextResponse.json(
      { error: 'Error al consultar planes' },
      { status: 500 }
    )
  }
}
