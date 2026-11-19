import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession, createSession, decrypt, isSuperAdminRole } from '@/lib/auth'
import { createPersistentSession } from '@/lib/session'
import { recordAuditLog } from '@/lib/audit'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const ownerSession = await getSession('OWNER')
  const barberSession = await getSession('BARBER')
  const genericCookie = cookieStore.get('session')?.value
  const genericSession = genericCookie ? await decrypt(genericCookie) : null

  const activeSupportSession =
    (ownerSession?.superAdminId ? ownerSession : null) ||
    (barberSession?.superAdminId ? barberSession : null) ||
    (genericSession?.superAdminId ? genericSession : null)

  if (!activeSupportSession || !activeSupportSession.superAdminId) {
    return NextResponse.json({ error: 'No estás en modo de soporte administrativo' }, { status: 400 })
  }

  try {
    const superAdminUser = await prisma.user.findUnique({
      where: { id: activeSupportSession.superAdminId }
    })

    if (!superAdminUser || !superAdminUser.isActive || !isSuperAdminRole(superAdminUser.role)) {
      return NextResponse.json({ error: 'Cuenta de Super Administrador no encontrada o inactiva' }, { status: 404 })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear sesión persistente verificable en DB para el Super Admin
    const persistent = await createPersistentSession({
      userId: superAdminUser.id,
      ipAddress,
      userAgent
    })

    // Limpiar cookies de contexto de tenant/barbero antes de restaurar Super Admin
    cookieStore.delete('barber_session')
    cookieStore.delete('active_branch_id')

    // Restaurar sesión de SUPER_ADMIN o ROOT_PLATFORM_OWNER con su rol real
    await createSession(
      superAdminUser.id,
      superAdminUser.role,
      null,
      null,
      null,
      null,
      false,
      null,
      persistent.sessionId,
      false,
      null
    )

    const targetBusinessId = activeSupportSession.businessId

    await recordAuditLog({
      userId: superAdminUser.id,
      userRole: superAdminUser.role,
      businessId: targetBusinessId,
      action: 'IMPERSONATE_EXIT',
      entity: 'Business',
      entityId: targetBusinessId,
      details: {
        exitedFromRole: activeSupportSession.role,
        barberId: activeSupportSession.barberId || null,
        reason: 'Finalización de sesión temporal de soporte técnico y retorno a Super Admin'
      }
    })

    return NextResponse.json({
      success: true,
      redirect: targetBusinessId
        ? `/superadmin/businesses/${targetBusinessId}`
        : '/superadmin/businesses'
    })
  } catch (error) {
    console.error('Error switching back to Super Admin:', error)
    return NextResponse.json({ error: 'Error al regresar a Super Admin' }, { status: 500 })
  }
}
