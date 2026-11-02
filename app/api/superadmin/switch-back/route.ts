import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, createSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function POST() {
  const session = await getSession('OWNER')
  if (!session || !session.superAdminId) {
    return NextResponse.json({ error: 'No estás en modo de soporte' }, { status: 400 })
  }

  try {
    const superAdminUser = await prisma.user.findUnique({
      where: { id: session.superAdminId }
    })

    if (!superAdminUser || superAdminUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Administrador no encontrado' }, { status: 404 })
    }

    // Restore SUPER_ADMIN session
    await createSession(
      superAdminUser.id,
      'SUPER_ADMIN',
      null,
      null,
      null,
      null
    )

    // Record audit log
    await recordAuditLog({
      userId: superAdminUser.id,
      userRole: 'SUPER_ADMIN',
      businessId: session.businessId,
      action: 'IMPERSONATE_EXIT',
      entity: 'Business',
      entityId: session.businessId,
      details: {
        reason: 'Finalización de soporte técnico y retorno a Super Admin'
      }
    })

    return NextResponse.json({
      success: true,
      redirect: '/superadmin/businesses'
    })
  } catch (error) {
    console.error('Error switching back to Super Admin:', error)
    return NextResponse.json({ error: 'Error al regresar a Super Admin' }, { status: 500 })
  }
}
