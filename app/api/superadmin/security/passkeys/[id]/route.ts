import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params

    const passkey = await prisma.passkeyCredential.findUnique({
      where: { id }
    })

    if (!passkey) {
      return NextResponse.json({ error: 'Passkey no encontrada' }, { status: 404 })
    }

    // Aislamiento: solo el dueño de la passkey puede revocarla
    if (passkey.userId !== session.userId && session.role !== 'ROOT_PLATFORM_OWNER') {
      return NextResponse.json({ error: 'No tienes permiso para revocar esta Passkey' }, { status: 403 })
    }

    await prisma.passkeyCredential.delete({
      where: { id }
    })

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: 'PASSKEY_REVOKED',
      entity: 'PasskeyCredential',
      entityId: id,
      details: { deviceName: passkey.deviceName }
    })

    return NextResponse.json({ success: true, message: 'Passkey revocada exitosamente' })
  } catch (error: any) {
    console.error('Revoke Passkey Error:', error)
    return NextResponse.json({ error: 'Error al revocar Passkey' }, { status: 500 })
  }
}

