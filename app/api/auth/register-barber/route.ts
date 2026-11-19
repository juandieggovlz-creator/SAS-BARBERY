import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession, getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios (token o contraseña)' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ 
      where: { inviteToken: token },
      include: { 
        barber: true,
        business: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Este enlace de invitación no es válido o ya fue utilizado.' }, { status: 404 })
    }

    if (user.barber && user.barber.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Esta cuenta de barbero ha sido desactivada por el administrador.' }, { status: 403 })
    }

    if (!user.inviteExpires || new Date() > user.inviteExpires) {
      return NextResponse.json({ error: 'Este enlace de invitación ha expirado. Solicita un nuevo enlace al propietario.' }, { status: 400 })
    }

    let finalPasswordHash = user.password

    // 1. Caso Usuario Existente con contraseña previa
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return NextResponse.json({ 
          error: 'La contraseña ingresada no coincide con tu cuenta existente. Inténtalo nuevamente o restablece tu clave.',
          code: 'INVALID_EXISTING_PASSWORD'
        }, { status: 401 })
      }
    } else {
      // 2. Caso Usuario Nuevo configurando clave inicial
      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }
      finalPasswordHash = await bcrypt.hash(password, 10)
    }

    // Actualización transaccional: quema de token (Single-Use), activación de barbero y usuario
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: finalPasswordHash,
          isActive: true,
          inviteToken: null,
          inviteExpires: null
        }
      }),
      ...(user.barberId ? [
        prisma.barber.update({
          where: { id: user.barberId },
          data: { status: 'ACTIVE' }
        })
      ] : []),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.barber?.name || user.email,
          userRole: 'BARBER',
          businessId: user.businessId,
          action: user.password ? 'BARBER_PROFILE_LINKED' : 'BARBER_ACCOUNT_ACTIVATED',
          entity: 'User',
          entityId: user.id,
          details: {
            termsVersion: '1.0',
            acceptedAt: new Date().toISOString()
          }
        }
      })
    ])

    // Asegurar que el barbero tenga horarios de atención predeterminados si aún no los tiene
    if (user.barberId) {
      const scheduleCount = await prisma.barberSchedule.count({
        where: { barberId: user.barberId }
      })
      if (scheduleCount === 0) {
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
          }).catch(() => {})
        }
      }
    }

    // Comprobar si un Owner o SuperAdmin está probando el enlace para no sobreescribir su sesión
    const currentSession = await getSession()
    if (!currentSession || (currentSession.role !== 'OWNER' && currentSession.role !== 'SUPER_ADMIN')) {
      await createSession(user.id, 'BARBER', user.barberId || null, user.businessId || null)
      return NextResponse.json({ 
        success: true, 
        role: 'BARBER',
        redirect: '/barber/dashboard',
        message: '¡Cuenta activada con éxito!'
      })
    }

    return NextResponse.json({ 
      success: true, 
      role: currentSession.role,
      redirect: '/barber/dashboard',
      message: '¡Cuenta activada con éxito! (Sesión administrativa preservada)'
    })
  } catch (error: unknown) {
    console.error("Activation Error:", error)
    return NextResponse.json({ error: 'Error interno del servidor al activar cuenta' }, { status: 500 })
  }
}
