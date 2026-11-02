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
    const type = searchParams.get('type') || 'ALL'
    const limit = parseInt(searchParams.get('limit') || '40')

    // Fetch in parallel
    const [recentAppointments, recentBusinesses, recentPayments, recentClients] = await Promise.all([
      type === 'ALL' || type === 'APPOINTMENT'
        ? prisma.appointment.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              business: { select: { id: true, name: true, slug: true } },
              barber: { select: { name: true } },
              service: { select: { name: true, price: true } },
              client: { select: { name: true } }
            }
          })
        : [],
      type === 'ALL' || type === 'BUSINESS'
        ? prisma.business.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              plan: { select: { name: true } }
            }
          })
        : [],
      type === 'ALL' || type === 'PAYMENT'
        ? prisma.payment.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              business: { select: { id: true, name: true, slug: true } }
            }
          })
        : [],
      type === 'ALL' || type === 'CLIENT'
        ? prisma.client.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              business: { select: { id: true, name: true, slug: true } }
            }
          })
        : []
    ])

    // Normalize into unified activity items
    const activities: Array<{
      id: string
      type: 'APPOINTMENT' | 'BUSINESS' | 'PAYMENT' | 'CLIENT'
      title: string
      description: string
      businessName: string
      businessId: string
      businessSlug?: string
      amount?: number | null
      createdAt: string
    }> = []

    recentAppointments.forEach(a => {
      activities.push({
        id: `apt-${a.id}`,
        type: 'APPOINTMENT',
        title: `Nueva cita reservada`,
        description: `Cliente ${a.client.name} con ${a.barber.name} (${a.service.name})`,
        businessName: a.business.name,
        businessId: a.business.id,
        businessSlug: a.business.slug,
        amount: Number(a.service.price),
        createdAt: a.createdAt.toISOString()
      })
    })

    recentBusinesses.forEach(b => {
      activities.push({
        id: `biz-${b.id}`,
        type: 'BUSINESS',
        title: `Nueva barbería incorporada`,
        description: `Registro completado bajo plan "${b.plan?.name || 'Básico'}"`,
        businessName: b.name,
        businessId: b.id,
        businessSlug: b.slug,
        amount: null,
        createdAt: b.createdAt.toISOString()
      })
    })

    recentPayments.forEach(p => {
      activities.push({
        id: `pay-${p.id}`,
        type: 'PAYMENT',
        title: `Pago registrado en negocio`,
        description: `Método: ${p.method} - Estado: ${p.status}`,
        businessName: p.business.name,
        businessId: p.business.id,
        businessSlug: p.business.slug,
        amount: Number(p.amount),
        createdAt: p.createdAt.toISOString()
      })
    })

    recentClients.forEach(c => {
      activities.push({
        id: `cli-${c.id}`,
        type: 'CLIENT',
        title: `Nuevo cliente registrado`,
        description: `${c.name} (${c.phone})`,
        businessName: c.business.name,
        businessId: c.business.id,
        businessSlug: c.business.slug,
        amount: null,
        createdAt: c.createdAt.toISOString()
      })
    })

    // Sort all descending by date
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      activities: activities.slice(0, limit)
    })
  } catch (error) {
    console.error('Super Admin Activity Error:', error)
    return NextResponse.json({ error: 'Error al consultar actividad' }, { status: 500 })
  }
}
