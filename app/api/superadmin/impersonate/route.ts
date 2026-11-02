import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, createSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  try {
    const { businessId } = await request.json()
    if (!businessId) {
      return NextResponse.json({ error: 'Falta ID de la barbería' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { users: { where: { role: 'OWNER' } } }
    })

    if (!business) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 })
    }

    const ownerUser = business.users[0]
    const targetUserId = ownerUser?.id || session.userId

    // Switch session to OWNER of this business, keeping superAdminId
    await createSession(
      targetUserId,
      'OWNER',
      null,
      business.id,
      null,
      session.userId // superAdminId preserved
    )

    // Record audit log
    await recordAuditLog({
      userId: session.userId,
      userRole: 'SUPER_ADMIN',
      businessId: business.id,
      action: 'IMPERSONATE_LOGIN',
      entity: 'Business',
      entityId: business.id,
      details: {
        businessName: business.name,
        businessSlug: business.slug,
        reason: 'Soporte técnico y supervisión desde panel Super Admin'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Ingresando como propietario de ${business.name}`,
      redirect: '/dashboard'
    })
  } catch (error) {
    console.error('Error impersonating business owner:', error)
    return NextResponse.json({ error: 'Error al iniciar sesión de soporte' }, { status: 500 })
  }
}
