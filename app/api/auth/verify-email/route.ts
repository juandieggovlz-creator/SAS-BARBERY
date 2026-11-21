import { NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/auth/email-verification'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rateCheck = rateLimit(`verify-email:ip:${ip}`, { limit: 15, windowSeconds: 15 * 60 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera unos minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token de verificación ausente o inválido' },
        { status: 400 }
      )
    }

    const result = await verifyEmailToken(token)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'No se pudo verificar el correo electrónico' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '¡Correo electrónico verificado exitosamente! Ya puedes utilizar todas las funciones de BarberOS.'
    })
  } catch (error) {
    console.error('Error en verify-email POST:', error)
    return NextResponse.json(
      { error: 'Error interno al procesar la verificación' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_verification_token', request.url))
  }

  const result = await verifyEmailToken(token)
  if (result.success) {
    return NextResponse.redirect(new URL('/login?verified=true', request.url))
  } else {
    return NextResponse.redirect(
      new URL(`/verify-email?error=${encodeURIComponent(result.error || 'Token inválido')}`, request.url)
    )
  }
}
