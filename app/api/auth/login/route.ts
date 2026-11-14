import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { getClientIp, rateLimit, resetRateLimit } from '@/lib/rate-limit'
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

    // 1. Verificación Anti-Fuerza Bruta global por IP (máx 30 intentos / 15 min para evitar ataques distribuidos de diccionario)
    const ipLimit = rateLimit(`login:ip:${ip}`, { limit: 30, windowSeconds: 15 * 60 })
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes desde esta conexión. Reintenta en ${ipLimit.resetSeconds} segundos.` },
        { status: 429 }
      )
    }

    // 2. Verificación Anti-Fuerza Bruta específica por cuenta + IP (máx 5 intentos fallidos / 15 min)
    const accountLimitKey = `login:acc:${ip}:${cleanEmail}`
    const accountCheck = rateLimit(accountLimitKey, { limit: 5, windowSeconds: 15 * 60 })
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

    // Auto-recovery / Self-healing SOLO en entorno de desarrollo local (inhabilitado en producción)
    if (process.env.NODE_ENV !== 'production') {
      if (!user && cleanEmail === 'admin@admin.com') {
        let business = await prisma.business.findFirst()
        if (!business) {
          business = await prisma.business.create({
            data: {
              name: "Barbería Elite SAS",
              slug: "barberia-elite",
              phone: "+57 300 123 4567",
              address: "Calle 85 # 14-20, Bogotá",
              description: "Barbería clásica y moderna con atención personalizada.",
              email: "admin@admin.com"
            }
          })
        }
        const hashedPassword = await bcrypt.hash('admin123', 10)
        user = await prisma.user.create({
          data: {
            email: 'admin@admin.com',
            password: hashedPassword,
            role: 'OWNER',
            businessId: business.id
          },
          include: { barber: true }
        })
      }

      if (!user && cleanEmail === 'superadmin@barberos.com') {
        const hashedPassword = await bcrypt.hash('superadmin123', 10)
        user = await prisma.user.create({
          data: {
            email: 'superadmin@barberos.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true
          },
          include: { barber: true }
        })
      }

      if (cleanEmail === 'carlos@barberia.com' && password === 'admin123') {
        const hashedPassword = await bcrypt.hash('admin123', 10)
        if (user) {
          const isMatch = user.password ? await bcrypt.compare(password, user.password) : false
          if (!isMatch) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword, isActive: true },
              include: { barber: true }
            })
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Esta cuenta aún no ha sido activada. Por favor, revisa tu enlace de invitación.' }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Login exitoso: limpiar historial de intentos fallidos
    resetRateLimit(accountLimitKey)

    // If barber is inactive, block login
    if (user.role === 'BARBER' && user.barber?.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Tu cuenta de barbero ha sido desactivada por el administrador.' }, { status: 403 })
    }

    // If barber is pending, activate upon successful login
    if (user.role === 'BARBER' && user.barberId) {
      await prisma.barber.update({
        where: { id: user.barberId },
        data: { status: 'ACTIVE' }
      }).catch(() => { })

      // Ensure default schedules exist
      const existingSchedCount = await prisma.barberSchedule.count({
        where: { barberId: user.barberId }
      })
      if (existingSchedCount === 0) {
        const defaultSchedules = [
          { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', isWorking: true },
          { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isWorking: true },
          { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isWorking: true },
          { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isWorking: true },
          { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isWorking: true },
          { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isWorking: true },
          { dayOfWeek: 6, startTime: '08:00', endTime: '19:00', isWorking: true },
        ]
        for (const s of defaultSchedules) {
          await prisma.barberSchedule.create({
            data: { barberId: user.barberId, ...s }
          }).catch(() => { })
        }
      }
    }

    // Set JWT cookie session
    const sessionJwt = await createSession(
      user.id,
      user.role,
      user.barberId || null,
      user.businessId || null,
      null,
      null,
      false,
      user.companyId || null
    )

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
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


