import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimitDB } from '@/lib/rate-limit'
import { resendVerificationEmail } from '@/lib/auth/email-verification'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const session = await getSession()

    const body = await request.json().catch(() => ({}))
    let targetEmail = body?.email

    // Si no se pasó email en body pero hay sesión activa, usar el del usuario autenticado
    if (!targetEmail && session?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true }
      })
      if (user?.email) {
        targetEmail = user.email
      }
    }

    if (!targetEmail || typeof targetEmail !== 'string') {
      return NextResponse.json(
        { error: 'Debes proporcionar una dirección de correo válida' },
        { status: 400 }
      )
    }

    const cleanEmail = targetEmail.trim().toLowerCase()

    // Rate limit estricto por IP y correo en Neon DB: máximo 3 intentos cada 15 minutos
    const ipCheck = await rateLimitDB(`resend-verif:ip:${ip}`, { limit: 5, windowSeconds: 15 * 60 })
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Por favor espera ${Math.ceil(ipCheck.resetSeconds / 60)} minutos.` },
        { status: 429 }
      )
    }

    const emailCheck = await rateLimitDB(`resend-verif:email:${cleanEmail}`, { limit: 3, windowSeconds: 15 * 60 })
    if (!emailCheck.success) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes para este correo. Por favor espera ${Math.ceil(emailCheck.resetSeconds / 60)} minutos.` },
        { status: 429 }
      )
    }

    const result = await resendVerificationEmail(cleanEmail)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en resend-verification:', error)
    return NextResponse.json(
      { error: 'Error al procesar el reenvío de verificación' },
      { status: 500 }
    )
  }
}
