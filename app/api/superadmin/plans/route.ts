import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { businesses: true, subscriptions: true }
        }
      }
    })

    return NextResponse.json({
      plans: plans.map(p => ({
        ...p,
        price: Number(p.price),
        businessesCount: p._count.businesses,
        subscriptionsCount: p._count.subscriptions
      }))
    })
  } catch (error) {
    console.error('Super Admin Plans GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar planes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      slug,
      price,
      billingPeriod = 'MONTHLY',
      maxBarbers = 3,
      maxClients = 500,
      maxAppointments = 1000,
      features = [],
      isPopular = false,
      isActive = true
    } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y identificador (slug) son requeridos' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
    const existing = await prisma.plan.findUnique({ where: { slug: cleanSlug } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un plan con este identificador (slug)' }, { status: 400 })
    }

    const newPlan = await prisma.plan.create({
      data: {
        name,
        slug: cleanSlug,
        price: Number(price) || 0,
        billingPeriod,
        maxBarbers: Number(maxBarbers) || 1,
        maxClients: Number(maxClients) || 100,
        maxAppointments: Number(maxAppointments) || 200,
        features: Array.isArray(features) ? features : [],
        isPopular: Boolean(isPopular),
        isActive: Boolean(isActive)
      }
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'PLAN_CREATED',
      entity: 'Plan',
      entityId: newPlan.id,
      details: { name: newPlan.name, slug: newPlan.slug, price: newPlan.price }
    })

    return NextResponse.json({ success: true, plan: newPlan }, { status: 201 })
  } catch (error) {
    console.error('Create Plan Error:', error)
    return NextResponse.json({ error: 'Error al crear plan' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, name, price, billingPeriod, maxBarbers, maxClients, maxAppointments, features, isPopular, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de plan requerido' }, { status: 400 })
    }

    const existing = await prisma.plan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = Number(price)
    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod
    if (maxBarbers !== undefined) updateData.maxBarbers = Number(maxBarbers)
    if (maxClients !== undefined) updateData.maxClients = Number(maxClients)
    if (maxAppointments !== undefined) updateData.maxAppointments = Number(maxAppointments)
    if (features !== undefined) updateData.features = Array.isArray(features) ? features : []
    if (isPopular !== undefined) updateData.isPopular = Boolean(isPopular)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const updated = await prisma.plan.update({
      where: { id },
      data: updateData
    })

    await recordAuditLog({
      userId: session.userId,
      action: 'PLAN_UPDATED',
      entity: 'Plan',
      entityId: id,
      details: { previous: existing, updated: updateData }
    })

    return NextResponse.json({ success: true, plan: updated })
  } catch (error) {
    console.error('Update Plan Error:', error)
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Check if there are businesses using this plan
    const businessesUsingPlan = await prisma.business.count({ where: { planId: id } })
    if (businessesUsingPlan > 0) {
      return NextResponse.json({
        error: `No puedes eliminar un plan asignado a ${businessesUsingPlan} barbería(s). Desactívalo en su lugar.`
      }, { status: 400 })
    }

    await prisma.plan.delete({ where: { id } })

    await recordAuditLog({
      userId: session.userId,
      action: 'PLAN_DELETED',
      entity: 'Plan',
      entityId: id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete Plan Error:', error)
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 })
  }
}
