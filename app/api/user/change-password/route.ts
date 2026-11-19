import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { verifyOtpCode } from '@/lib/verification-codes'
import { sendAccountSecurityAlertEmail } from '@/lib/email'
import { recordAuditLog } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const ip = getClientIp(request)

    // Rate limiting contra fuerza bruta: máximo 5 intentos por usuario cada 15 minutos
    const rateCheck = rateLimit(`change-password:user:${session.userId}:${ip}`, {
      limit: 5,
      windowSeconds: 15 * 60,
    })

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Demasiados intentos. Por seguridad, espera ${Math.ceil(
            rateCheck.resetSeconds / 60
          )} minutos antes de intentar de nuevo.`,
        },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { currentPassword, newPassword, confirmPassword, verificationCode } = body

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Debes ingresar una nueva contraseña' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'La confirmación de la nueva contraseña no coincide' },
        { status: 400 }
      )
    }

    // Obtener usuario actual con su hash de contraseña y correo
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        googleSub: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Caso A: El usuario tiene contraseña local previa -> Validar contraseña actual
    if (user.password) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return NextResponse.json(
          { error: 'Debes ingresar tu contraseña actual para autorizar el cambio' },
          { status: 400 }
        )
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'La contraseña actual ingresada es incorrecta' },
          { status: 400 }
        )
      }

      if (currentPassword === newPassword) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe ser diferente a la contraseña actual' },
          { status: 400 }
        )
      }

      // Si además se proporcionó código de verificación, validarlo
      if (verificationCode) {
        const otpCheck = await verifyOtpCode(user.id, 'password_change', verificationCode)
        if (!otpCheck.valid) {
          return NextResponse.json(
            { error: otpCheck.error || 'Código de confirmación incorrecto o expirado' },
            { status: 400 }
          )
        }
      }
    } else {
      // Caso B: Cuenta creada originalmente con Google (sin contraseña local previa)
      // Por seguridad extrema, no permitir que la sesión abierta por sí sola cree contraseña:
      // Exigir código de un solo uso enviado a su correo verificado de Google
      if (!verificationCode || typeof verificationCode !== 'string') {
        return NextResponse.json(
          {
            error: 'Para crear una contraseña en una cuenta de Google, solicita e ingresa el código de confirmación enviado a tu correo.',
            requiresCode: true,
          },
          { status: 400 }
        )
      }

      const otpCheck = await verifyOtpCode(user.id, 'password_change', verificationCode)
      if (!otpCheck.valid) {
        return NextResponse.json(
          { error: otpCheck.error || 'Código de confirmación incorrecto o expirado' },
          { status: 400 }
        )
      }
    }

    // Generar hash seguro de la nueva contraseña con salt de 12 rondas
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña en base de datos
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    })

    // Política de invalidación de sesiones secundarias: revocar otras sesiones
    if (session.sessionId) {
      await prisma.session.updateMany({
        where: {
          userId: session.userId,
          id: { not: session.sessionId },
          isRevoked: false,
        },
        data: { isRevoked: true },
      })
    }

    // Notificación oficial por correo al titular (Resend)
    sendAccountSecurityAlertEmail({
      to: user.email,
      userName: user.name || 'Titular BarberOS',
      title: 'Tu contraseña ha sido actualizada',
      description: 'Te notificamos que la contraseña de acceso a tu cuenta de BarberOS fue modificada exitosamente.',
      details: {
        'Fecha y hora': new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
        'Dirección IP': ip || 'Sesión verificada',
        'Seguridad': 'Otras sesiones abiertas han sido cerradas automáticamente.',
      },
      actionLabel: '¿No fuiste tú? Contacta a soporte urgente',
      actionLink: 'https://barberos.com/support',
    }).catch((err) => {
      console.warn('[Change Password Security Email Alert]:', err)
    })

    // Registro en auditoría
    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'PASSWORD_UPDATED_SUCCESS',
      entity: 'User',
      entityId: user.id,
      details: { ip, hadPreviousPassword: Boolean(user.password) },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Tu contraseña ha sido actualizada correctamente',
    })
  } catch (error) {
    console.error('[Change Password] Error:', error)
    return NextResponse.json(
      { error: 'Error del servidor al cambiar la contraseña' },
      { status: 500 }
    )
  }
}
