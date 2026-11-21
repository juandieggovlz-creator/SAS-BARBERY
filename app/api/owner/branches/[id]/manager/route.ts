import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getCanonicalAppUrl } from '@/lib/url'
import { sendBranchAdminInviteEmail } from '@/lib/email'
import { recordAuditLog } from '@/lib/audit'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/owner/branches/[id]/manager
 * Consulta el estado real del administrador e invitaciones de una sede específica.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params

    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      include: {
        company: true
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    if (session.role !== 'SUPER_ADMIN') {
      const isOwner = branch.company?.ownerId === session.userId ||
        (session.companyId && branch.companyId === session.companyId)
      if (!isOwner) {
        return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
      }
    }

    // Si es la sede principal, está a cargo del propietario
    if (branch.isMainBranch) {
      let ownerUser = null
      if (branch.company?.ownerId) {
        ownerUser = await prisma.user.findUnique({
          where: { id: branch.company.ownerId },
          select: { id: true, name: true, email: true }
        })
      }

      return NextResponse.json({
        success: true,
        isMainBranch: true,
        status: 'MAIN_BRANCH_OWNER',
        branchName: branch.name,
        companyName: branch.company?.name || branch.name,
        manager: {
          id: branch.company?.ownerId || session.userId,
          name: ownerUser?.name || 'Propietario Principal',
          email: ownerUser?.email || '',
          role: 'OWNER',
          isOwner: true
        },
        invitations: []
      })
    }

    // Buscar administrador activo si está asignado
    let manager = null
    if (branch.managerId) {
      manager = await prisma.user.findUnique({
        where: { id: branch.managerId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true
        }
      })
    }

    // Si no está por managerId pero hay un usuario con rol BRANCH_ADMIN para esta sede
    if (!manager) {
      const branchAdmin = await prisma.user.findFirst({
        where: {
          businessId: branchId,
          role: 'BRANCH_ADMIN'
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true
        }
      })
      if (branchAdmin) {
        manager = branchAdmin
        // Auto-sincronizar managerId en la sede si faltaba
        await prisma.business.update({
          where: { id: branchId },
          data: { managerId: branchAdmin.id }
        }).catch(() => {})
      }
    }

    // Buscar invitaciones históricas y recientes
    const rawInvitations = await prisma.branchInvitation.findMany({
      where: { businessId: branchId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const now = new Date()
    const invitations = rawInvitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      status: inv.status,
      token: inv.token,
      expiresAt: inv.expiresAt,
      isExpired: now > inv.expiresAt,
      createdAt: inv.createdAt,
      acceptedAt: inv.acceptedAt,
      inviteUrl: `${getCanonicalAppUrl()}/invite/${inv.token}`
    }))

    // Determinar la invitación activa más relevante
    const pendingInv = invitations.find(i => i.status === 'PENDING')

    // Determinar estado global
    let currentStatus: 'ACTIVE_MANAGER' | 'PENDING_INVITATION' | 'EXPIRED_INVITATION' | 'NO_MANAGER' = 'NO_MANAGER'

    if (manager) {
      currentStatus = 'ACTIVE_MANAGER'
    } else if (pendingInv) {
      currentStatus = pendingInv.isExpired ? 'EXPIRED_INVITATION' : 'PENDING_INVITATION'
    } else {
      currentStatus = 'NO_MANAGER'
    }

    return NextResponse.json({
      success: true,
      isMainBranch: false,
      status: currentStatus,
      branchId: branch.id,
      branchName: branch.name,
      companyName: branch.company?.name || branch.name,
      manager,
      activeInvitation: pendingInv || null,
      invitations
    })
  } catch (error) {
    console.error('Error in GET /api/owner/branches/[id]/manager:', error)
    return NextResponse.json({ error: 'Error al consultar estado del administrador' }, { status: 500 })
  }
}

/**
 * DELETE /api/owner/branches/[id]/manager
 * Revoca el acceso del administrador activo de la sede:
 * - Invalida sesiones activas inmediatamente
 * - Desvincula el usuario de la sede
 * - Borra el managerId de la sede
 * - Cancela invitaciones pendientes
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params

    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      include: {
        company: true
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    if (branch.isMainBranch) {
      return NextResponse.json({ error: 'No es posible revocar al propietario de la sede principal' }, { status: 400 })
    }

    if (session.role !== 'SUPER_ADMIN') {
      const isOwner = branch.company?.ownerId === session.userId ||
        (session.companyId && branch.companyId === session.companyId)
      if (!isOwner) {
        return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
      }
    }

    const managerIdToRevoke = branch.managerId

    // Ejecutar revocación segura
    await prisma.$transaction(async (tx) => {
      // 1. Desvincular managerId de la sede
      await tx.business.update({
        where: { id: branchId },
        data: { managerId: null }
      })

      // 2. Si existía un usuario asignado, invalidar sus sesiones y desvincularlo
      if (managerIdToRevoke) {
        // Eliminar todas las sesiones persistentes para que el usuario sea desautenticado inmediatamente
        await tx.session.deleteMany({
          where: { userId: managerIdToRevoke }
        })

        // Desvincular de la sede y marcar inactivo como branch admin
        await tx.user.update({
          where: { id: managerIdToRevoke },
          data: {
            businessId: null,
            isActive: false
          }
        })
      }

      // 3. Cancelar todas las invitaciones pendientes para esta sede
      await tx.branchInvitation.updateMany({
        where: {
          businessId: branchId,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED'
        }
      })
    })

    // 4. Registrar en AuditLog
    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      businessId: branchId,
      action: 'BRANCH_MANAGER_REVOKED',
      entity: 'Business',
      entityId: branchId,
      details: {
        revokedUserId: managerIdToRevoke,
        branchName: branch.name,
        companyId: branch.companyId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Acceso de administrador revocado correctamente. Las sesiones activas han sido cerradas.'
    })
  } catch (error) {
    console.error('Error in DELETE /api/owner/branches/[id]/manager:', error)
    return NextResponse.json({ error: 'Error al revocar administrador' }, { status: 500 })
  }
}

/**
 * POST /api/owner/branches/[id]/manager
 * Permite:
 * - INVITE / REPLACE: Enviar nueva invitación (opcionalmente revocando al administrador previo)
 * - RESEND: Reenviar invitación pendiente o renovar una vencida
 * - DISCARD_EXPIRED: Descartar invitación vencida
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params
    const body = await request.json()
    const { action = 'INVITE', email } = body

    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      include: {
        company: true
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    if (branch.isMainBranch) {
      return NextResponse.json({ error: 'La sede principal es administrada directamente por el propietario' }, { status: 400 })
    }

    if (session.role !== 'SUPER_ADMIN') {
      const isOwner = branch.company?.ownerId === session.userId ||
        (session.companyId && branch.companyId === session.companyId)
      if (!isOwner) {
        return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
      }
    }

    // ACCIÓN 1: Descartar invitación vencida
    if (action === 'DISCARD_EXPIRED') {
      await prisma.branchInvitation.updateMany({
        where: {
          businessId: branchId,
          status: 'PENDING',
          expiresAt: { lt: new Date() }
        },
        data: { status: 'CANCELLED' }
      })
      return NextResponse.json({
        success: true,
        message: 'Invitación vencida descartada correctamente'
      })
    }

    // ACCIÓN 2: Reenviar invitación existente
    if (action === 'RESEND') {
      const invitationId = body.invitationId
      let inv = null

      if (invitationId) {
        inv = await prisma.branchInvitation.findUnique({ where: { id: invitationId } })
      } else {
        inv = await prisma.branchInvitation.findFirst({
          where: { businessId: branchId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' }
        })
      }

      if (!inv || inv.businessId !== branchId) {
        return NextResponse.json({ error: 'No se encontró la invitación a reenviar' }, { status: 404 })
      }

      // Renovar expiración a 72 horas adicionales
      const newExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
      const newToken = crypto.randomBytes(32).toString('hex')

      const updated = await prisma.branchInvitation.update({
        where: { id: inv.id },
        data: {
          token: newToken,
          status: 'PENDING',
          expiresAt: newExpiresAt
        }
      })

      const inviteUrl = `${getCanonicalAppUrl()}/invite/${newToken}`

      // Enviar correo de invitación
      sendBranchAdminInviteEmail({
        to: updated.email,
        branchName: branch.name,
        companyName: branch.company?.name || branch.name,
        inviteLink: inviteUrl
      }).catch(err => console.warn('Error reenviando correo de invitación:', err))

      return NextResponse.json({
        success: true,
        message: `Invitación renovada y reenviada exitosamente a ${updated.email}`,
        inviteUrl,
        invitation: {
          ...updated,
          inviteUrl
        }
      })
    }

    // ACCIÓN 3: INVITE / REPLACE
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Por favor ingresa un correo electrónico válido' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Si es REPLACE y había un administrador anterior, desvincularlo
    if (action === 'REPLACE' && branch.managerId) {
      await prisma.session.deleteMany({ where: { userId: branch.managerId } })
      await prisma.user.update({
        where: { id: branch.managerId },
        data: { businessId: null, isActive: false }
      }).catch(() => {})
      await prisma.business.update({
        where: { id: branchId },
        data: { managerId: null }
      })
    }

    // Cancelar cualquier invitación previa pendiente en esta sede
    await prisma.branchInvitation.updateMany({
      where: {
        businessId: branchId,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    })

    // Generar nuevo token criptográfico de 72 horas
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

    const invitation = await prisma.branchInvitation.create({
      data: {
        companyId: branch.companyId!,
        businessId: branchId,
        email: cleanEmail,
        token,
        role: 'BRANCH_ADMIN',
        status: 'PENDING',
        invitedById: session.userId,
        expiresAt
      }
    })

    const inviteUrl = `${getCanonicalAppUrl()}/invite/${token}`

    // Disparar envío de correo
    sendBranchAdminInviteEmail({
      to: cleanEmail,
      branchName: branch.name,
      companyName: branch.company?.name || branch.name,
      inviteLink: inviteUrl
    }).catch(err => console.warn('Error enviando correo de invitación:', err))

    // Registrar en auditoría
    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      businessId: branchId,
      action: action === 'REPLACE' ? 'BRANCH_MANAGER_REPLACED' : 'BRANCH_INVITATION_CREATED',
      entity: 'BranchInvitation',
      entityId: invitation.id,
      details: {
        email: cleanEmail,
        branchName: branch.name,
        companyId: branch.companyId,
        expiresAt: expiresAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Invitación enviada con éxito a ${cleanEmail}`,
      inviteUrl,
      invitation: {
        ...invitation,
        inviteUrl
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/owner/branches/[id]/manager:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud de administrador' }, { status: 500 })
  }
}
