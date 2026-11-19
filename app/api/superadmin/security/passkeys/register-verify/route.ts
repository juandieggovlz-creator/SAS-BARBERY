import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { verifyRegistrationResponse, getWebAuthnConfig } from '@/lib/webauthn'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const cookieStore = await cookies()
    const expectedChallenge = cookieStore.get('webauthn_reg_challenge')?.value
    cookieStore.delete('webauthn_reg_challenge')

    if (!expectedChallenge) {
      return NextResponse.json({ error: 'El desafío de registro expiró. Intenta de nuevo.' }, { status: 400 })
    }

    const { registrationResponse, deviceName } = await request.json()

    if (!registrationResponse || !registrationResponse.id) {
      return NextResponse.json({ error: 'Respuesta de registro WebAuthn inválida' }, { status: 400 })
    }

    const config = getWebAuthnConfig(request)

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'No se pudo verificar la credencial Passkey' }, { status: 400 })
    }

    const { credential, credentialDeviceType } = verification.registrationInfo
    const publicKeyBase64 = Buffer.from(credential.publicKey).toString('base64url')

    const newPasskey = await prisma.passkeyCredential.create({
      data: {
        userId: session.userId,
        credentialId: credential.id,
        publicKey: publicKeyBase64,
        counter: BigInt(credential.counter),
        transports: credential.transports ? JSON.stringify(credential.transports) : null,
        deviceName: deviceName?.trim() || `${credentialDeviceType || 'Dispositivo'} FIDO2`
      }
    })

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: 'PASSKEY_REGISTERED',
      entity: 'PasskeyCredential',
      entityId: newPasskey.id,
      details: { deviceName: newPasskey.deviceName }
    })

    return NextResponse.json({
      success: true,
      message: 'Passkey registrada con éxito',
      passkey: {
        id: newPasskey.id,
        deviceName: newPasskey.deviceName,
        createdAt: newPasskey.createdAt
      }
    })
  } catch (error: any) {
    console.error('Passkey register-verify error:', error)
    return NextResponse.json({ error: error?.message || 'Error al guardar la Passkey' }, { status: 500 })
  }
}

