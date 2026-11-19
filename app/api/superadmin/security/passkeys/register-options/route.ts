import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateRegistrationOptions, getWebAuthnConfig } from '@/lib/webauthn'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { passkeys: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const config = getWebAuthnConfig(request)

    const excludeCredentials = user.passkeys.map(p => ({
      id: p.credentialId,
      transports: p.transports ? JSON.parse(p.transports) : undefined
    }))

    const options = await generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      userID: Buffer.from(user.id),
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      timeout: 60000
    })

    const response = NextResponse.json(options)
    response.cookies.set('webauthn_reg_challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 5 * 60
    })

    return response
  } catch (error: any) {
    console.error('Passkey register-options error:', error)
    return NextResponse.json({ error: 'Error al generar opciones de registro de Passkey' }, { status: 500 })
  }
}

