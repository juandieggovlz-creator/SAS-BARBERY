import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MetaTemplateManager } from '@/lib/whatsapp/meta-template-manager'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession('OWNER')
    if (
      !session ||
      !session.businessId ||
      (session.role !== 'OWNER' && session.role !== 'BRANCH_ADMIN' && session.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const body = await request.json().catch(() => ({}))
    const branchId = body?.branchId || searchParams.get('branchId') || session.businessId

    if (!branchId) {
      return NextResponse.json({ error: 'Sede no especificada' }, { status: 400 })
    }

    // Validar pertenencia de la sede si no es SUPER_ADMIN
    if (session.role !== 'SUPER_ADMIN') {
      const branch = await prisma.business.findUnique({
        where: { id: branchId },
        select: { companyId: true, company: { select: { ownerId: true } } }
      })
      if (
        !branch ||
        (branch.companyId !== session.companyId && branch.company?.ownerId !== session.userId)
      ) {
        return NextResponse.json({ error: 'No tienes permisos sobre esta sede' }, { status: 403 })
      }
    }

    // Ejecutar verificación, consulta y registro de plantillas estándar en Meta Graph API v22.0
    const syncResult = await MetaTemplateManager.syncTemplatesForBusiness(branchId)

    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        error: syncResult.error || 'Error al sincronizar plantillas con Meta Graph API',
        details: syncResult
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Plantillas oficiales de Meta sincronizadas exitosamente.',
      data: syncResult
    })
  } catch (err: unknown) {
    console.error('Error en endpoint de sincronización de plantillas Meta:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Error interno al sincronizar plantillas'
    }, { status: 500 })
  }
}
