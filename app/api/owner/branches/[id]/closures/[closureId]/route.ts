import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

async function verifyBranchAccess(
  session: { userId: string; role: string; companyId?: string | null; businessId?: string | null },
  branchId: string
) {
  if (session.role === 'SUPER_ADMIN') return true

  if (session.role === 'BRANCH_ADMIN') {
    return session.businessId === branchId
  }

  if (session.role === 'OWNER') {
    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      select: { companyId: true, company: { select: { ownerId: true } } },
    })
    if (!branch) return false
    if (branch.company?.ownerId === session.userId) return true
    if (session.companyId && branch.companyId === session.companyId) return true
  }

  return false
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; closureId: string }> }
) {
  try {
    const session = await getSession('OWNER')
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId, closureId } = await context.params
    const hasAccess = await verifyBranchAccess(session, branchId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
    }

    const closure = await prisma.branchClosure.findFirst({
      where: { id: closureId, businessId: branchId },
    })

    if (!closure) {
      return NextResponse.json({ error: 'Bloqueo no encontrado' }, { status: 404 })
    }

    await prisma.branchClosure.delete({
      where: { id: closureId },
    })

    await recordAuditLog({
      businessId: branchId,
      userId: session.userId,
      userRole: session.role as any,
      action: 'DELETE',
      entity: 'BranchClosure',
      entityId: closureId,
      details: {
        description: `Bloqueo de sede eliminado (ID: ${closureId})`,
        closureId,
        startDate: closure.startDate,
        endDate: closure.endDate,
      },
    })

    return NextResponse.json({ success: true, message: 'Bloqueo eliminado correctamente' })
  } catch (error: any) {
    console.error('Error deleting branch closure:', error)
    return NextResponse.json({ error: 'Error al eliminar bloqueo de sede' }, { status: 500 })
  }
}
