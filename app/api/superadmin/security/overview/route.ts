import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { listUserSessions } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        mfaEnabled: true,
        mfaConfirmedAt: true,
        googleSub: true,
        phoneNumber: true,
        phoneVerified: true,
        _count: {
          select: {
            passkeys: true,
            recoveryCodes: { where: { usedAt: null } }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const [passkeys, sessions, recentSecurityLogs] = await Promise.all([
      prisma.passkeyCredential.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          deviceName: true,
          createdAt: true,
          lastUsedAt: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      listUserSessions(user.id),
      prisma.auditLog.findMany({
        where: {
          userId: user.id,
          action: { in: ['MFA_LOGIN_SUCCESS', 'PASSKEY_LOGIN_SUCCESS', 'MFA_RECOVERY_CODE_CONSUMED', 'SESSION_REVOKED', 'PASSWORD_CHANGED', 'TOTP_ENABLED'] }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isRootOwner: user.role === 'ROOT_PLATFORM_OWNER',
        mfaEnabled: user.mfaEnabled,
        mfaConfirmedAt: user.mfaConfirmedAt,
        googleLinked: Boolean(user.googleSub),
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        availableRecoveryCodesCount: user._count.recoveryCodes,
      },
      passkeys,
      sessions,
      currentSessionId: session.sessionId || null,
      recentSecurityLogs
    })
  } catch (error: any) {
    console.error('Security overview error:', error)
    return NextResponse.json({ error: 'Error al consultar resumen de seguridad' }, { status: 500 })
  }
}

