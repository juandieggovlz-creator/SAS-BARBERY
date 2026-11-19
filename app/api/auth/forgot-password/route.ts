import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken } from '@/lib/auth'
import { getClientIp, rateLimitDB } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit'
import { sendPasswordResetEmail } from '@/lib/email'
import { getCanonicalAppUrl } from '@/lib/url'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)

    // Rate limit por IP persistente en DB: máximo 5 solicitudes cada 15 minutos
    const ipCheck = await rateLimitDB(`forgot-password:ip:${ip}`, { limit: 5, windowSeconds: 15 * 60 })
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
    const emailCheck = await rateLimitDB(`forgot-password:email:${cleanEmail}`, { limit: 3, windowSeconds: 15 * 60 })
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
      // Por seguridad extrema, el Propietario Raíz no puede restablecer contraseña por endpoint público genérico
      if (user.role === 'ROOT_PLATFORM_OWNER') {
        await recordAuditLog({
          userId: user.id,
          userRole: user.role,
          action: 'ROOT_PASSWORD_RESET_ATTEMPT_BLOCKED',
          entity: 'User',
          entityId: user.id,
          details: { ip, message: 'Intento de reseteo público bloqueado para Root Platform Owner' }
        })

        // Retornar misma respuesta genérica para evitar enumeración
        return NextResponse.json({
          success: true,
          message: 'Si el correo electrónico existe en nuestra base de datos, hemos generado las instrucciones de recuperación.'
        })
      }

      const resetToken = await createPasswordResetToken(user.id, user.password)
      const resetLink = `${getCanonicalAppUrl()}/reset-password?token=${resetToken}`

      // Disparo asíncrono no bloqueante de correo de recuperación
      sendPasswordResetEmail({
        to: user.email,
        userName: user.name || 'Usuario',
        resetLink,
        expiresMinutes: 60
      }).catch(err => {
        console.warn('Aviso: Envío de correo de recuperación diferido o simulado:', err)
      })

      // Auditoría sin exponer el token en texto plano en logs
      await recordAuditLog({
        userId: user.id,
        userRole: user.role,
        action: 'PASSWORD_RESET_TOKEN_GENERATED',
        entity: 'User',
        entityId: user.id,
        details: { ip, email: cleanEmail }
      })
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


