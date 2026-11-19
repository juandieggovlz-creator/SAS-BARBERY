import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { createPersistentSession } from '@/lib/session'
import { verifyAuthenticationResponse, getWebAuthnConfig } from '@/lib/webauthn'
import { getClientIp } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const expectedChallenge = cookieStore.get('webauthn_challenge')?.value
    cookieStore.delete('webauthn_challenge')

    if (!expectedChallenge) {
      return NextResponse.json({ error: 'El desafío de autenticación ha expirado o es inválido.' }, { status: 400 })
    }

    const body = await request.json()
    const credentialId = body.id

    if (!credentialId) {
      return NextResponse.json({ error: 'Falta identificador de credencial' }, { status: 400 })
    }

    const passkey = await prisma.passkeyCredential.findUnique({
      where: { credentialId },
      include: { user: true }
    })

    if (!passkey || !passkey.user || !passkey.user.isActive) {
      return NextResponse.json({ error: 'Credencial o llave de seguridad no reconocida.' }, { status: 404 })
    }

    const config = getWebAuthnConfig(request)

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64url'),
        counter: Number(passkey.counter),
      },
    })

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json({ error: 'Fallo al verificar firma criptográfica de la llave.' }, { status: 401 })
    }

    // Actualizar contador para detección de clones y registrar último uso
    await prisma.passkeyCredential.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      }
    })

    const user = passkey.user
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent')

    const persistent = await createPersistentSession({
      userId: user.id,
      ipAddress: ip,
      userAgent,
      deviceInfo: passkey.deviceName || undefined
    })

    const sessionJwt = await createSession(
      user.id,
      user.role,
      user.barberId || null,
      user.businessId || null,
      null,
      null,
      false,
      user.companyId || null,
      persistent.sessionId,
      false
    )

    await recordAuditLog({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'PASSKEY_LOGIN_SUCCESS',
      entity: 'PasskeyCredential',
      entityId: passkey.id,
      details: { deviceName: passkey.deviceName, ip }
    })

    let targetPath = '/dashboard'
    if (user.role === 'ROOT_PLATFORM_OWNER' || user.role === 'SUPER_ADMIN') {
      targetPath = '/superadmin/dashboard'
    } else if (user.role === 'BARBER') {
      targetPath = '/barber/dashboard'
    }

    const response = NextResponse.json({
      success: true,
      redirect: targetPath,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 días de persistencia
    }

    response.cookies.delete('mfa_pending_session')
    response.cookies.set('owner_session', sessionJwt, cookieOpts)
    response.cookies.set('session', sessionJwt, cookieOpts)

    return response
  } catch (error: any) {
    console.error('WebAuthn verify error:', error)
    return NextResponse.json({ error: error?.message || 'Error al validar autenticación con Passkey' }, { status: 500 })
  }
}

