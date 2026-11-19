import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { revokeSession, revokeAllUserSessions } from '@/lib/session'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { sessionId, revokeAllOthers } = await request.json()

    if (revokeAllOthers) {
      const count = await revokeAllUserSessions(session.userId, session.sessionId || undefined)
      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        action: 'ALL_OTHER_SESSIONS_REVOKED',
        entity: 'Session',
        details: { revokedCount: count }
      })

      return NextResponse.json({
        success: true,
        message: `Se han cerrado ${count} sesiones activas en otros dispositivos.`
      })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de sesión requerido' }, { status: 400 })
    }

    const success = await revokeSession(sessionId, session.userId)

    if (success) {
      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        action: 'SESSION_REVOKED',
        entity: 'Session',
        entityId: sessionId,
        details: { targetSessionId: sessionId }
      })

      return NextResponse.json({ success: true, message: 'Sesión cerrada exitosamente.' })
    } else {
      return NextResponse.json({ error: 'No se pudo revocar la sesión' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Revoke Session Error:', error)
    return NextResponse.json({ error: 'Error al revocar sesión' }, { status: 500 })
  }
}

