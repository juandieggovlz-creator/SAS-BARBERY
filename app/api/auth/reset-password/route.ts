import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPasswordResetToken } from '@/lib/auth'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)

    // Rate limit: máximo 10 intentos cada 15 minutos por IP
    const ipCheck = rateLimit(`reset-password:ip:${ip}`, { limit: 10, windowSeconds: 15 * 60 })
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: `Demasiados intentos. Por favor espera ${Math.ceil(ipCheck.resetSeconds / 60)} minutos.` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { token, password } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token de recuperación ausente o inválido' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // 1. Verificar firma criptográfica y vigencia (15 minutos)
    const verification = await verifyPasswordResetToken(token)
    if (!verification) {
      return NextResponse.json(
        { error: 'El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.' },
        { status: 400 }
      )
    }

    // 2. Localizar al usuario
    const user = await prisma.user.findUnique({
      where: { id: verification.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 3. Verificar estado de un solo uso (Single-Use Token Enforcement)
    // Si la contraseña ya fue modificada, el hash no coincidirá con el del token.
    const currentHashPrefix = (user.password || '').slice(-10)
    if (currentHashPrefix !== verification.pwhash) {
      return NextResponse.json(
        { error: 'Este enlace ya fue utilizado para cambiar la contraseña. Solicita uno nuevo si lo requieres.' },
        { status: 400 }
      )
    }

    // 4. Actualizar contraseña de forma segura
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // Limpiar tokens residuales si existieran
        inviteToken: null,
        inviteExpires: null,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión.'
    })
  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json({ error: 'Ocurrió un error al restablecer la contraseña.' }, { status: 500 })
  }
}

