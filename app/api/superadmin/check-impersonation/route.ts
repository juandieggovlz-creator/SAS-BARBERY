import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ isImpersonated: false })
    }

    const isSuperAdminSupport = Boolean(session.superAdminId)
    const isBarberPreview = Boolean(session.role === 'BARBER' && session.originalOwnerId)

    if (!isSuperAdminSupport && !isBarberPreview) {
      return NextResponse.json({ isImpersonated: false })
    }

    const [business, barber] = await Promise.all([
      session.businessId
        ? prisma.business.findUnique({
            where: { id: session.businessId },
            select: { id: true, name: true, slug: true }
          })
        : Promise.resolve(null),
      session.barberId
        ? prisma.barber.findUnique({
            where: { id: session.barberId },
            select: { id: true, name: true }
          })
        : Promise.resolve(null)
    ])

    return NextResponse.json({
      isImpersonated: true,
      isSuperAdminSupport,
      isBarberPreview,
      superAdminId: session.superAdminId || null,
      originalOwnerId: session.originalOwnerId || null,
      businessId: session.businessId || null,
      businessName: business?.name || null,
      businessSlug: business?.slug || null,
      role: session.role,
      barberId: session.barberId || null,
      barberName: barber?.name || null,
      reason: session.impersonationReason || null,
      expiresAt: session.impersonationExpiresAt || null
    })
  } catch {
    return NextResponse.json({ isImpersonated: false })
  }
}
