import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { createPersistentSession } from '@/lib/session'
import { getClientIp, rateLimitDB, resetRateLimitDB } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const ip = getClientIp(request)

    // 1. Verificación Anti-Fuerza Bruta global por IP (máx 30 intentos / 15 min en Neon DB)
    const ipLimit = await rateLimitDB(`login:ip:${ip}`, { limit: 30, windowSeconds: 15 * 60 })
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes desde esta conexión. Reintenta en ${ipLimit.resetSeconds} segundos.` },
        { status: 429 }
      )
    }

    // 2. Verificación Anti-Fuerza Bruta específica por cuenta + IP (máx 5 intentos fallidos / 15 min en Neon DB)
    const accountLimitKey = `login:acc:${ip}:${cleanEmail}`
    const accountCheck = await rateLimitDB(accountLimitKey, { limit: 5, windowSeconds: 15 * 60 })
    if (!accountCheck.success) {
      return NextResponse.json(
        { error: `Demasiados intentos fallidos para esta cuenta. Tu acceso está pausado temporalmente por seguridad. Reintenta en ${accountCheck.resetSeconds} segundos.` },
        { status: 429 }
      )
    }

    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive'
        }
      },
      include: {
        barber: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Esta cuenta ha sido desactivada por el administrador.' }, { status: 403 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Esta cuenta aún no ha sido activada. Por favor, revisa tu enlace de invitación.' }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Login exitoso: limpiar historial de intentos fallidos
    await resetRateLimitDB(accountLimitKey)

    // Si es un barbero inactivo, bloquear login
    if (user.role === 'BARBER' && user.barber?.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Tu cuenta de barbero ha sido desactivada por el administrador.' }, { status: 403 })
    }

    // Si el barbero estaba pendiente, activarlo al iniciar sesión
    if (user.role === 'BARBER' && user.barberId) {
      await prisma.barber.update({
        where: { id: user.barberId },
        data: { status: 'ACTIVE' }
      }).catch(() => { })
    }

    // ── BLINDAJE MFA / 2FA PARA ROOT_PLATFORM_OWNER Y CUENTAS CON MFA ACTIVO ──
    if (user.role === 'ROOT_PLATFORM_OWNER' || user.mfaEnabled) {
      const mfaPendingJwt = await createSession(
        user.id,
        user.role,
        user.barberId || null,
        user.businessId || null,
        null,
        null,
        false,
        user.companyId || null,
        null,
        true // mfaPending = true
      )

      const mfaCookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 5 * 60, // 5 minutos de vigencia
      }

      const response = NextResponse.json({
        success: true,
        mfaRequired: true,
        redirect: '/login/mfa',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      })

      response.cookies.set('mfa_pending_session', mfaPendingJwt, mfaCookieOpts)
      return response
    }

    // Crear sesión persistente en base de datos para usuarios sin MFA
    const userAgent = request.headers.get('user-agent')
    const persistent = await createPersistentSession({
      userId: user.id,
      ipAddress: ip,
      userAgent
    })

    const sessionJwt = await createSession(
      user.id,
      user.role,
      user.barberId || null,
      user.businessId || null,
      null,
      null,
      false,
      user.companyId || null,
      persistent.sessionId,
      false
    )

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 días de persistencia
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        barberId: user.barberId,
        businessId: user.businessId,
        companyId: user.companyId
      }
    })

    if (user.role === 'BARBER') {
      response.cookies.set('barber_session', sessionJwt, cookieOpts)
    } else {
      response.cookies.set('owner_session', sessionJwt, cookieOpts)
      response.cookies.set('session', sessionJwt, cookieOpts)
    }

    return response
  } catch (error: unknown) {
    console.error("Login Server Error:", error);
    const msg = error instanceof Error ? error.message : 'Error del servidor'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
