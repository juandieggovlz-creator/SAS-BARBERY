import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession, getSession } from '@/lib/auth'

async function findUserByToken(token: string) {
  if (!token || typeof token !== 'string') return null
  const now = new Date()

  // Buscar estrictamente por inviteToken vigente (nunca por barberId ni user.id)
  return await prisma.user.findFirst({
    where: {
      inviteToken: token,
      OR: [
        { inviteExpires: null },
        { inviteExpires: { gt: now } }
      ]
    },
    include: { 
      barber: {
        include: {
          schedules: true
        }
      },
      business: { select: { id: true, name: true } }
    }
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Falta token de acceso' }, { status: 400 })
  }

  try {
    const user = await findUserByToken(token)

    if (!user || !user.barber) {
      return NextResponse.json({ error: 'Enlace de acceso no válido o expirado' }, { status: 404 })
    }

    if (user.barber.status === 'INACTIVE') {
      return NextResponse.json({ 
        error: 'Esta cuenta de barbero se encuentra inactiva. Contacta al administrador.' 
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      barberName: user.barber.name,
      avatar: user.barber.avatar,
      specialty: user.barber.specialty,
      businessName: user.business?.name || 'Barbería',
      hasPassword: Boolean(user.password)
    })
  } catch (error) {
    console.error('Error validating barber access token:', error)
    return NextResponse.json({ error: 'Error del servidor al validar enlace' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password, action } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contraseña son requeridos' }, { status: 400 })
    }

    // Read existing session to preserve owner ID if present
    const existingSession = await getSession('OWNER')
    const originalOwnerId = existingSession?.userId || null

    const user = await findUserByToken(token)

    if (!user || !user.barber) {
      return NextResponse.json({ error: 'Enlace de acceso no válido' }, { status: 404 })
    }

    if (user.barber.status === 'INACTIVE') {
      return NextResponse.json({ 
        error: 'Esta cuenta de barbero se encuentra inactiva' 
      }, { status: 403 })
    }

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    }

    // Ensure barber has status ACTIVE and has default schedules
    await prisma.barber.update({
      where: { id: user.barber.id },
      data: { status: 'ACTIVE' }
    })

    const existingSchedCount = await prisma.barberSchedule.count({
      where: { barberId: user.barber.id }
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
          data: { barberId: user.barber.id, ...s }
        })
      }
    }

    // Si es primera vez creando contraseña (cuenta sin clave)
    if (!user.password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      // Actualizar contraseña y quemar el token de invitación (Single-Use Token)
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          isActive: true,
          inviteToken: null,
          inviteExpires: null
        }
      })

      // Barber logging in via their own link — preserves owner session if owner was active
      const sessionJwt = await createSession(user.id, 'BARBER', user.barberId, user.businessId, originalOwnerId)

      const response = NextResponse.json({
        success: true,
        redirect: '/barber/dashboard',
        message: '¡Contraseña creada con éxito!'
      })
      response.cookies.set('barber_session', sessionJwt, cookieOpts)
      return response
    }

    // Si ya tiene contraseña y pretendía forzar SET_PASSWORD sin autenticación
    if (action === 'SET_PASSWORD') {
      return NextResponse.json({
        error: 'Esta cuenta ya tiene una contraseña activa. Por seguridad, ingresa con tu contraseña o solicita un nuevo enlace a tu administrador.'
      }, { status: 403 })
    }

    // Si ya tiene contraseña (LOGIN)
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta. Inténtalo de nuevo.' }, { status: 401 })
    }

    // Barber logging in via their own link — preserves owner session if owner was active
    const sessionJwt = await createSession(user.id, 'BARBER', user.barberId, user.businessId, originalOwnerId)

    const response = NextResponse.json({
      success: true,
      redirect: '/barber/dashboard',
      message: '¡Bienvenido a tu panel!'
    })
    response.cookies.set('barber_session', sessionJwt, cookieOpts)
    return response
  } catch (error) {
    console.error('Error processing barber login/password setup:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

