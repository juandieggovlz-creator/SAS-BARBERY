import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimitDB, resetRateLimitDB } from '@/lib/rate-limit'
import { SignJWT } from 'jose'

export const dynamic = 'force-dynamic'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET requerido')
  return new TextEncoder().encode(secret)
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de verificación de secreto. Para iniciar el asistente de configuración, ingresa a http://localhost:3000/setup/owner en tu navegador.',
    interfaceUrl: '/setup/owner',
    method: 'POST_REQUIRED'
  })
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'

    // Rate limiting: máximo 5 intentos fallidos cada 15 minutos por IP
    const rateCheck = await rateLimitDB(`setup_secret:${ip}`, { limit: 5, windowSeconds: 900 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.' },
        { status: 429 }
      )
    }

    // Verificar si ya existe un Propietario Raíz activo con MFA confirmado
    const existingOwner = await prisma.user.findFirst({
      where: {
        role: 'ROOT_PLATFORM_OWNER',
        mfaConfirmedAt: { not: null },
        isActive: true
      }
    })

    if (existingOwner) {
      return NextResponse.json(
        { error: 'La plataforma ya cuenta con un Propietario Raíz activo. Inicialización bloqueada.' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { secret } = body

    const expectedSecret = process.env.OWNER_SETUP_SECRET
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'OWNER_SETUP_SECRET no está configurado en las variables de entorno del servidor.' },
        { status: 500 }
      )
    }

    if (!secret || typeof secret !== 'string' || secret.trim() !== expectedSecret.trim()) {
      return NextResponse.json({ error: 'Secreto de autorización inválido' }, { status: 401 })
    }

    // Resetear rate limit tras verificación exitosa
    await resetRateLimitDB(`setup_secret:${ip}`)

    // Generar un token firmado temporal (15 minutos)
    const token = await new SignJWT({
      purpose: 'root_setup_authorized',
      email: 'juandieggovlz@gmail.com'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(getJwtSecret())

    return NextResponse.json({
      success: true,
      setupToken: token,
      targetEmail: 'juandieggovlz@gmail.com'
    })
  } catch (error) {
    console.error('Error verifying setup secret:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

