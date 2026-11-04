import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getCanonicalAppUrl } from '@/lib/url'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/owner/branches/[id]/invite
 * Lista las invitaciones para una sede específica.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params

    // Verificar pertenencia de la sede a la empresa
    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        companyId: true,
        managerId: true,
        company: {
          select: {
            id: true,
            ownerId: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    if (session.role !== 'SUPER_ADMIN') {
      if (branch.company?.ownerId !== session.userId && branch.companyId !== session.companyId) {
        return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
      }
    }

    const invitations = await prisma.branchInvitation.findMany({
      where: { businessId: branchId },
      orderBy: { createdAt: 'desc' }
    })

    // Mapear con URLs canónicas
    const invitationsWithUrls = invitations.map(inv => ({
      ...inv,
      inviteUrl: `${getCanonicalAppUrl()}/invite/${inv.token}`,
      isExpired: new Date() > inv.expiresAt
    }))

    // Buscar info del manager actual si existe
    let currentManager = null
    if (branch.managerId) {
      currentManager = await prisma.user.findUnique({
        where: { id: branch.managerId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })
    }

    return NextResponse.json({
      invitations: invitationsWithUrls,
      currentManager,
      branchName: branch.name
    })
  } catch (error: unknown) {
    console.error('Error fetching branch invitations:', error)
    return NextResponse.json({ error: 'Error al obtener invitaciones' }, { status: 500 })
  }
}

/**
 * POST /api/owner/branches/[id]/invite
 * Invita a un administrador de sede (BRANCH_ADMIN).
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Correo electrónico válido requerido' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Verificar la sede y su empresa
    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      include: {
        company: true
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    if (!branch.companyId || !branch.company) {
      return NextResponse.json({ error: 'La sede no está asociada a una estructura empresarial' }, { status: 400 })
    }

    if (session.role !== 'SUPER_ADMIN') {
      if (branch.company.ownerId !== session.userId && branch.companyId !== session.companyId) {
        return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
      }
    }

    // Cancelar cualquier invitación previa pendiente para el mismo correo en esta sede
    await prisma.branchInvitation.updateMany({
      where: {
        businessId: branchId,
        email: cleanEmail,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    })

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    const invitation = await prisma.branchInvitation.create({
      data: {
        companyId: branch.companyId,
        businessId: branchId,
        email: cleanEmail,
        token,
        role: 'BRANCH_ADMIN',
        status: 'PENDING',
        invitedById: session.userId,
        expiresAt
      }
    })

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userRole: session.role,
        businessId: branchId,
        action: 'BRANCH_INVITATION_CREATED',
        entity: 'BranchInvitation',
        entityId: invitation.id,
        details: {
          email: cleanEmail,
          branchName: branch.name,
          expiresAt: expiresAt.toISOString()
        }
      }
    }).catch(err => console.warn('AuditLog error:', err))

    const inviteUrl = `${getCanonicalAppUrl()}/invite/${token}`

    return NextResponse.json({
      success: true,
      invitation: {
        ...invitation,
        inviteUrl
      },
      inviteUrl,
      message: `Invitación generada exitosamente para ${cleanEmail}`
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating branch invitation:', error)
    return NextResponse.json({ error: 'Error al crear la invitación' }, { status: 500 })
  }
}

/**
 * DELETE /api/owner/branches/[id]/invite
 * Revoca o cancela una invitación pendiente.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json({ error: 'ID de invitación requerido' }, { status: 400 })
    }

    const invitation = await prisma.branchInvitation.findUnique({
      where: { id: invitationId },
      include: {
        company: true
      }
    })

    if (!invitation || invitation.businessId !== branchId) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    if (session.role !== 'SUPER_ADMIN') {
      if (invitation.company.ownerId !== session.userId && invitation.companyId !== session.companyId) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

    const updated = await prisma.branchInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitación revocada correctamente',
      invitation: updated
    })
  } catch (error: unknown) {
    console.error('Error cancelling branch invitation:', error)
    return NextResponse.json({ error: 'Error al revocar la invitación' }, { status: 500 })
  }
}

