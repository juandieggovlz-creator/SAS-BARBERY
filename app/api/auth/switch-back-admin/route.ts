import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession, createSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function POST() {
  const barberSession = await getSession('BARBER')
  const fallbackSession = await getSession()
  const session = barberSession?.originalOwnerId ? barberSession : fallbackSession

  if (!session || !session.originalOwnerId) {
    return NextResponse.json({ error: 'No estás en modo supervisor de barbero' }, { status: 400 })
  }

  try {
    const ownerUser = await prisma.user.findUnique({
      where: { id: session.originalOwnerId }
    })

    if (!ownerUser) {
      return NextResponse.json({ error: 'Usuario propietario no encontrado' }, { status: 404 })
    }

    const cookieStore = await cookies()
    cookieStore.delete('barber_session')

    // Restaurar sesión del propietario preservando superAdminId si se encontraba en modo soporte
    await createSession(
      ownerUser.id,
      session.superAdminId ? 'OWNER' : ownerUser.role,
      null,
      session.businessId || ownerUser.businessId,
      null,
      session.superAdminId || null,
      false,
      session.companyId || ownerUser.companyId,
      null,
      false,
      session.impersonationReason || null
    )

    if (session.superAdminId) {
      await recordAuditLog({
        userId: session.superAdminId,
        userRole: 'SUPER_ADMIN',
        businessId: session.businessId || ownerUser.businessId,
        action: 'IMPERSONATE_BARBER_EXIT',
        entity: 'Barber',
        entityId: session.barberId,
        details: {
          reason: 'Retorno del panel de barbero al panel de propietario en modo soporte'
        }
      })
    }

    return NextResponse.json({ success: true, redirect: '/barbers' })
  } catch (error) {
    console.error('Error switching back to admin:', error)
    return NextResponse.json({ error: 'Error al regresar a la cuenta de propietario' }, { status: 500 })
  }
}
