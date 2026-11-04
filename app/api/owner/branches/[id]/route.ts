import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

async function resolveOwnerCompany(session: { userId: string; companyId?: string | null; businessId?: string | null }) {
  if (session.companyId) {
    const comp = await prisma.company.findUnique({
      where: { id: session.companyId }
    })
    if (comp) return comp
  }

  if (session.businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: { company: true }
    })
    if (biz?.company) return biz.company
  }

  return await prisma.company.findFirst({
    where: { ownerId: session.userId }
  })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await context.params
    const company = await resolveOwnerCompany(session)
    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    const branch = await prisma.business.findFirst({
      where: { id, companyId: company.id },
      include: {
        page: true,
        users: {
          where: { role: 'BRANCH_ADMIN' },
          select: { id: true, name: true, email: true, avatar: true, isActive: true }
        },
        invitations: {
          where: { status: 'PENDING' },
          select: { id: true, email: true, status: true, expiresAt: true, createdAt: true }
        },
        _count: {
          select: {
            barbers: true,
            services: true,
            appointments: true,
            clients: true,
            payments: true,
            expenses: true,
            cashCloses: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada o no pertenece a tu empresa' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      branch: {
        ...branch,
        manager: branch.users[0] || null,
        counts: branch._count
      }
    })
  } catch (error) {
    console.error('Owner Branch Details GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar detalles de la sede' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await context.params
    const company = await resolveOwnerCompany(session)
    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    const existingBranch = await prisma.business.findFirst({
      where: { id, companyId: company.id }
    })

    if (!existingBranch) {
      return NextResponse.json({ error: 'Sede no encontrada o no pertenece a tu empresa' }, { status: 404 })
    }

    const body = await request.json()
    const { name, phone, address, mapsUrl, description, status } = body

    // Validación de estado de sede principal
    if (existingBranch.isMainBranch && status && status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'La sede principal no puede ser suspendida o desactivada.'
      }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (name && typeof name === 'string' && name.trim().length >= 2) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null
    if (address !== undefined) updateData.address = address ? address.trim() : null
    if (mapsUrl !== undefined) updateData.mapsUrl = mapsUrl ? mapsUrl.trim() : null
    if (description !== undefined) updateData.description = description ? description.trim() : null
    if (status && ['ACTIVE', 'SUSPENDED'].includes(status)) updateData.status = status

    const updatedBranch = await prisma.business.update({
      where: { id: existingBranch.id },
      data: updateData
    })

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      businessId: updatedBranch.id,
      action: 'BRANCH_UPDATED',
      entity: 'Business',
      entityId: updatedBranch.id,
      details: {
        changes: updateData,
        branchName: updatedBranch.name
      }
    })

    return NextResponse.json({
      success: true,
      branch: updatedBranch,
      message: 'Sede actualizada correctamente.'
    })
  } catch (error) {
    console.error('Owner Branch PATCH Error:', error)
    return NextResponse.json({ error: 'Error al actualizar la sede' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await context.params
    const company = await resolveOwnerCompany(session)
    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    const branch = await prisma.business.findFirst({
      where: { id, companyId: company.id },
      include: {
        _count: {
          select: {
            appointments: true,
            payments: true,
            expenses: true,
            cashCloses: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    if (branch.isMainBranch) {
      return NextResponse.json({
        error: 'No es posible eliminar la sede principal de la empresa.'
      }, { status: 400 })
    }

    // Procedimiento seguro para preservar datos financieros e históricos
    const hasHistoricalData = (
      branch._count.appointments > 0 ||
      branch._count.payments > 0 ||
      branch._count.expenses > 0 ||
      branch._count.cashCloses > 0
    )

    if (hasHistoricalData) {
      // Desactivación segura (soft-delete / archive)
      await prisma.business.update({
        where: { id: branch.id },
        data: {
          status: 'CANCELLED'
        }
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: branch.id,
        action: 'BRANCH_ARCHIVED_SAFE',
        entity: 'Business',
        entityId: branch.id,
        details: {
          reason: 'Sede contiene registros históricos financieros/citas; se archivó de forma segura',
          branchName: branch.name
        }
      })

      return NextResponse.json({
        success: true,
        archived: true,
        message: 'La sede contiene registros históricos y financieros. Ha sido desactivada y archivada de forma segura para preservar tu contabilidad.'
      })
    }

    // Si no tiene registros históricos, se puede eliminar limpiamente
    await prisma.business.delete({
      where: { id: branch.id }
    })

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      businessId: branch.id,
      action: 'BRANCH_DELETED',
      entity: 'Business',
      entityId: branch.id,
      details: {
        branchName: branch.name,
        branchSlug: branch.slug
      }
    })

    return NextResponse.json({
      success: true,
      message: `Sede "${branch.name}" eliminada exitosamente.`
    })
  } catch (error) {
    console.error('Owner Branch DELETE Error:', error)
    return NextResponse.json({ error: 'Error al procesar la eliminación de la sede' }, { status: 500 })
  }
}

