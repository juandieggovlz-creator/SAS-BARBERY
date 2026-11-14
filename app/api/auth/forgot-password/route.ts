import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken } from '@/lib/auth'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)

    // Rate limit por IP: máximo 5 solicitudes cada 15 minutos
    const ipCheck = rateLimit(`forgot-password:ip:${ip}`, { limit: 5, windowSeconds: 15 * 60 })
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Por favor espera ${Math.ceil(ipCheck.resetSeconds / 60)} minutos antes de reintentar.` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Debes ingresar un correo electrónico válido' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Rate limit específico por correo: máximo 3 solicitudes cada 15 minutos
    const emailCheck = rateLimit(`forgot-password:email:${cleanEmail}`, { limit: 3, windowSeconds: 15 * 60 })
    if (!emailCheck.success) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes para este correo. Por favor espera ${Math.ceil(emailCheck.resetSeconds / 60)} minutos.` },
        { status: 429 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive'
        }
      }
    })

    if (user) {
      const resetToken = await createPasswordResetToken(user.id, user.password)
      const host = request.headers.get('host') || 'localhost:3000'
      const protocol = host.includes('localhost') ? 'http' : 'https'
      const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`

      // Registro seguro del evento para auditoría / entrega en logs del servidor
      console.log(`[PASSWORD_RESET_DISPATCH] Solicitud para usuario ID: ${user.id}. URL de restablecimiento generada (válida 15 min): ${resetUrl}`)
    }

    // Respuesta genérica unificada (Previene enumeración de usuarios registrados)
    return NextResponse.json({
      success: true,
      message: 'Si el correo electrónico existe en nuestra base de datos, hemos generado las instrucciones de recuperación.'
    })
  } catch (error) {
    console.error('Error en forgot-password:', error)
    return NextResponse.json({ error: 'Ocurrió un error al procesar tu solicitud.' }, { status: 500 })
  }
}

