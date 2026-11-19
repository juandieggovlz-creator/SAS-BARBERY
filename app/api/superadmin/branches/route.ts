import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getSession('SUPER_ADMIN')
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''
    const status = searchParams.get('status') || 'ALL'
    const type = searchParams.get('type') || 'ALL'

    const whereClause: any = {}

    if (status !== 'ALL') {
      whereClause.status = status
    }

    if (type === 'MAIN') {
      whereClause.isMainBranch = true
    } else if (type === 'SECONDARY') {
      whereClause.isMainBranch = false
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } }
      ]
    }

    const [branches, totalCount, mainCount, secondaryCount, activeCount, suspendedCount] = await Promise.all([
      prisma.business.findMany({
        where: whereClause,
        orderBy: [
          { isMainBranch: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          company: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              maxBranches: true,
              status: true
            }
          },
          plan: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              barbers: true,
              appointments: true,
              services: true,
              clients: true
            }
          },
          users: {
            where: { role: 'BRANCH_ADMIN' },
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.business.count(),
      prisma.business.count({ where: { isMainBranch: true } }),
      prisma.business.count({ where: { isMainBranch: false } }),
      prisma.business.count({ where: { status: 'ACTIVE' } }),
      prisma.business.count({ where: { status: 'SUSPENDED' } })
    ])

    // Resolver propietarios para las empresas encontradas
    const ownerIds = Array.from(
      new Set(branches.map(b => b.company?.ownerId).filter((id): id is string => Boolean(id)))
    )
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true, email: true }
    })
    const ownerMap = new Map(owners.map(o => [o.id, o]))

    const formattedBranches = branches.map(b => {
      const owner = b.company?.ownerId ? ownerMap.get(b.company.ownerId) : null
      const manager = b.users?.[0] || null

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        phone: b.phone,
        address: b.address,
        status: b.status,
        isMainBranch: b.isMainBranch,
        planName: (b as any).plan?.name || (b.isMainBranch ? 'Plan Principal' : 'Sede Adicional'),
        createdAt: b.createdAt,
        company: b.company ? {
          id: b.company.id,
          name: b.company.name,
          ownerName: owner?.name || 'Propietario',
          ownerEmail: owner?.email || 'N/A',
          ownerPhone: null as null,
          maxBranches: b.company.maxBranches
        } : null,
        manager: manager ? {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          phone: null as null
        } : null,
        metrics: {
          barbersCount: b._count.barbers,
          appointmentsCount: b._count.appointments,
          servicesCount: b._count.services,
          clientsCount: b._count.clients
        }
      }
    })

    return NextResponse.json({
      branches: formattedBranches,
      summary: {
        totalCount,
        mainCount,
        secondaryCount,
        activeCount,
        suspendedCount
      }
    })
  } catch (error: any) {
    console.error('Error fetching superadmin branches:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener sedes' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession('SUPER_ADMIN')
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { branchId, status, name, phone, address, isMainBranch } = body

    if (!branchId) {
      return NextResponse.json({ error: 'branchId es requerido' }, { status: 400 })
    }

    const currentBranch = await prisma.business.findUnique({
      where: { id: branchId },
      include: { company: true }
    })

    if (!currentBranch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone.trim()
    if (address !== undefined) updateData.address = address.trim()
    if (isMainBranch !== undefined) updateData.isMainBranch = Boolean(isMainBranch)

    const updated = await prisma.business.update({
      where: { id: branchId },
      data: updateData
    })

    await recordAuditLog({
      action: 'UPDATE_BRANCH',
      entity: 'Business',
      entityId: currentBranch.id,
      details: { changes: updateData, branchName: currentBranch.name },
      businessId: currentBranch.id,
      userId: session.userId
    })

    return NextResponse.json({
      success: true,
      branch: updated
    })
  } catch (error: any) {
    console.error('Error updating branch in superadmin:', error)
    return NextResponse.json({ error: error.message || 'Error al actualizar sede' }, { status: 500 })
  }
}
