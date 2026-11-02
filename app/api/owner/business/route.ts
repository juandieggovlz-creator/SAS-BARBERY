import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    let business = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: { plan: true }
    })

    if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

    // ── Auto-set trialEndsAt if missing (for legacy accounts) ──
    if (!business.trialEndsAt) {
      const trialEndsAt = new Date(business.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      business = await prisma.business.update({
        where: { id: business.id },
        data: {
          trialEndsAt,
          // Also set status to TRIAL if it's still ACTIVE with no plan
          status: business.status === 'ACTIVE' && !business.planId ? 'TRIAL' : business.status
        },
        include: { plan: true }
      })
    }

    // ── Compute trial info ──
    const now = Date.now()
    const trialEnd = business.trialEndsAt!
    const msLeft = trialEnd.getTime() - now
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
    const isTrialActive = business.status === 'TRIAL' && msLeft > 0

    return NextResponse.json({
      ...business,
      trialEndsAt: trialEnd.toISOString(),
      daysLeft,
      isTrialActive
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener negocio' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, phone, address, description, email, logo } = body

    const updatedBusiness = await prisma.business.update({
      where: { id: session.businessId },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(logo !== undefined ? { logo } : {})
      }
    })

    return NextResponse.json(updatedBusiness)
  } catch (error) {
    console.error("Update Business Error:", error)
    return NextResponse.json({ error: 'Error al actualizar información del negocio' }, { status: 500 })
  }
}
