import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimitDB } from '@/lib/rate-limit'
import { generateOtpCode } from '@/lib/verification-codes'
import { sendAccountSecurityAlertEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.superAdminId || session.originalOwnerId) {
    return NextResponse.json(
      { error: 'Por seguridad, no se permite solicitar cambios de contraseña durante una sesión de soporte administrativo.' },
      { status: 403 }
    )
  }

  try {
    const ip = getClientIp(request)

    // Rate limiting: máximo 3 solicitudes de código cada 15 minutos por usuario
    const rateCheck = await rateLimitDB(`otp-req:${session.userId}`, {
      limit: 3,
      windowSeconds: 15 * 60,
    })

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Has solicitado demasiados códigos. Espera ${Math.ceil(
            rateCheck.resetSeconds / 60
          )} minutos antes de solicitar otro.`,
        },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, googleSub: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Generar código OTP seguro (hasheado, sin texto plano en base de datos)
    const otp = await generateOtpCode(user.id, 'password_change')

    // Enviar código por correo oficial mediante Resend
    await sendAccountSecurityAlertEmail({
      to: user.email,
      userName: user.name || 'Titular BarberOS',
      title: 'Código de verificación de seguridad',
      description: `Has solicitado actualizar tu contraseña de acceso en BarberOS. Usa el siguiente código de confirmación de un solo uso:`,
      details: {
        'Código de verificación': otp,
        'Validez': '10 minutos',
        'Solicitado desde': ip || 'Sesión activa',
      },
      actionLabel: 'Si no solicitaste este cambio, ignora este mensaje o contáctanos',
      actionLink: 'https://barberos.com/support',
    }).catch((err) => {
      console.warn('[OTP Email Send Warning]:', err)
    })

    return NextResponse.json({
      success: true,
      message: `Código de confirmación de 6 dígitos enviado a ${user.email}`,
      maskedEmail: `${user.email.slice(0, 3)}••••@${user.email.split('@')[1]}`,
    })
  } catch (error) {
    console.error('[Change Password Code Error]:', error)
    return NextResponse.json({ error: 'Error al enviar código de verificación' }, { status: 500 })
  }
}
