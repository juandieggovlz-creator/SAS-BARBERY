import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, createSession, isSuperAdminRole } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function POST(request: Request) {
  const session = await getSession()
  if (
    !session ||
    (session.role !== 'OWNER' &&
      session.role !== 'BRANCH_ADMIN' &&
      !isSuperAdminRole(session.role) &&
      !session.originalOwnerId)
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { barberId } = await request.json()
    if (!barberId) {
      return NextResponse.json({ error: 'Falta ID de barbero' }, { status: 400 })
    }

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: { user: true, business: true }
    })

    if (!barber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    // Aislamiento Multi-Tenant estricto:
    // Incluso en modo soporte (cuando session.role === 'OWNER' y session.superAdminId existe),
    // NO se puede escapar del negocio seleccionado hacia un barbero de otro negocio.
    if (!isSuperAdminRole(session.role) || session.superAdminId) {
      const sameBusiness = barber.businessId === session.businessId
      const sameCompany =
        Boolean(session.companyId) &&
        Boolean(barber.business?.companyId) &&
        barber.business.companyId === session.companyId

      if (!sameBusiness && !sameCompany) {
        return NextResponse.json(
          { error: 'Acceso denegado: El barbero pertenece a otra barbería fuera del alcance actual.' },
          { status: 403 }
        )
      }
    }

    const originalOwnerId = session.originalOwnerId || session.userId
    const targetUserId = barber.user?.id || session.userId

    // Cambiar a sesión de BARBER preservando superAdminId e impersonationReason si aplica
    await createSession(
      targetUserId,
      'BARBER',
      barber.id,
      barber.businessId,
      originalOwnerId,
      session.superAdminId || null,
      false,
      session.companyId || barber.business?.companyId || null,
      null,
      false,
      session.impersonationReason || null
    )

    if (session.superAdminId || isSuperAdminRole(session.role)) {
      await recordAuditLog({
        userId: session.superAdminId || session.userId,
        userRole: 'SUPER_ADMIN',
        businessId: barber.businessId,
        action: 'IMPERSONATE_BARBER_LOGIN',
        entity: 'Barber',
        entityId: barber.id,
        details: {
          barberName: barber.name,
          businessName: barber.business?.name,
          reason: session.impersonationReason || 'Supervisión de panel de barbero'
        }
      })
    }

    return NextResponse.json({ success: true, redirect: '/barber/dashboard' })
  } catch (error) {
    console.error('Error impersonating barber:', error)
    return NextResponse.json({ error: 'Error al cambiar de sesión al barbero' }, { status: 500 })
  }
}
