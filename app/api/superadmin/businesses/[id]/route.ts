import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        plan: true,
        company: {
          include: {
            branches: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                isMainBranch: true,
                createdAt: true,
                managerId: true,
                _count: {
                  select: {
                    barbers: true,
                    appointments: true
                  }
                }
              },
              orderBy: [{ isMainBranch: 'desc' }, { createdAt: 'asc' }]
            }
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true
          }
        },
        barbers: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            specialty: true,
            avatar: true,
            commission: true,
            createdAt: true,
            _count: { select: { appointments: true } }
          }
        },
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            isActive: true
          }
        },
        saasSubscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            appointments: true,
            clients: true,
            payments: true,
            expenses: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 })
    }

    // Aggregate financial totals from payment
    const totalPayments = await prisma.payment.aggregate({
      where: { businessId: id, status: 'COMPLETED' },
      _sum: { amount: true }
    })

    return NextResponse.json({
      business,
      totalIncomeRecorded: totalPayments._sum.amount || 0
    })
  } catch (error) {
    console.error('Super Admin Business Detail Error:', error)
    return NextResponse.json({ error: 'Error al obtener detalle del negocio' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      phone,
      address,
      email,
      description,
      status,
      planId,
      maxBarbers,
      maxClients,
      maxAppointments,
      maxBranches,
      additionalBranchPrice
    } = body

    const existing = await prisma.business.findUnique({
      where: { id },
      include: { company: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Actualizar configuración corporativa de la empresa si se modifican cupos o tarifas
    if (existing.companyId && (maxBranches !== undefined || additionalBranchPrice !== undefined)) {
      await prisma.company.update({
        where: { id: existing.companyId },
        data: {
          ...(maxBranches !== undefined && { maxBranches: Number(maxBranches) }),
          ...(additionalBranchPrice !== undefined && { additionalBranchPrice: Number(additionalBranchPrice) })
        }
      })
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(address !== undefined ? { address: address?.trim() || null } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(planId !== undefined ? { planId } : {}),
        ...(maxBarbers !== undefined ? { maxBarbers: Number(maxBarbers) } : {}),
        ...(maxClients !== undefined ? { maxClients: Number(maxClients) } : {}),
        ...(maxAppointments !== undefined ? { maxAppointments: Number(maxAppointments) } : {})
      }
    })

    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: id,
      action: 'BUSINESS_UPDATED',
      entity: 'Business',
      entityId: id,
      details: { changes: body }
    })

    return NextResponse.json({ success: true, business: updated })
  } catch (error) {
    console.error('Super Admin Update Business Error:', error)
    return NextResponse.json({ error: 'Error al actualizar negocio' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const existing = await prisma.business.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    await prisma.business.delete({ where: { id } })

    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: id,
      action: 'BUSINESS_DELETED',
      entity: 'Business',
      entityId: id,
      details: { businessName: existing.name, slug: existing.slug }
    })

    return NextResponse.json({ success: true, message: 'Barbería eliminada correctamente' })
  } catch (error) {
    console.error('Super Admin Delete Business Error:', error)
    return NextResponse.json({ error: 'Error al eliminar negocio' }, { status: 500 })
  }
}
