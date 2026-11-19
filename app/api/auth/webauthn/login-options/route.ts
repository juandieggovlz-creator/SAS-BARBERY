import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/auth'
import { generateAuthenticationOptions, getWebAuthnConfig } from '@/lib/webauthn'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const mfaPending = cookieStore.get('mfa_pending_session')?.value
    let targetUserId: string | null = null

    if (mfaPending) {
      const payload = await decrypt(mfaPending)
      if (payload && payload.userId) {
        targetUserId = payload.userId
      }
    }

    if (!targetUserId) {
      const body = await request.json().catch(() => ({}))
      if (body.email) {
        const user = await prisma.user.findFirst({
          where: { email: { equals: body.email.trim().toLowerCase(), mode: 'insensitive' } }
        })
        if (user) targetUserId = user.id
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'No se pudo identificar al usuario para la autenticación WebAuthn' }, { status: 400 })
    }

    const passkeys = await prisma.passkeyCredential.findMany({
      where: { userId: targetUserId }
    })

    if (passkeys.length === 0) {
      return NextResponse.json({ error: 'No hay llaves de acceso ni Passkeys registradas para esta cuenta.' }, { status: 404 })
    }

    const config = getWebAuthnConfig(request)

    const allowCredentials = passkeys.map(p => ({
      id: p.credentialId,
      transports: p.transports ? JSON.parse(p.transports) : undefined
    }))

    const options = await generateAuthenticationOptions({
      rpID: config.rpID,
      allowCredentials,
      userVerification: 'preferred',
      timeout: 60000,
    })

    const response = NextResponse.json(options)
    response.cookies.set('webauthn_challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 5 * 60
    })

    return response
  } catch (error: any) {
    console.error('WebAuthn login-options error:', error)
    return NextResponse.json({ error: 'Error al generar opciones de autenticación Passkey' }, { status: 500 })
  }
}

