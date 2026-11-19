import { getBarberInviteUrl } from '@/lib/url'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { sendBarberInviteEmail } from '@/lib/email'
import { canAddBarber, getEffectiveSubscription } from '@/lib/commercial-permissions'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'BRANCH_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const barbers = await prisma.barber.findMany({
      where: { businessId: session.businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            inviteToken: true,
            inviteExpires: true,
            isActive: true,
            password: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const effectiveSub = await getEffectiveSubscription(session.businessId).catch(() => null)
    const effectiveMaxBarbers = effectiveSub?.limits.maxBarbers ?? 3
    const planName = effectiveSub?.plan.name || 'Básico'

    return NextResponse.json(barbers, {
      headers: {
        'X-Plan-Max-Barbers': String(effectiveMaxBarbers),
        'X-Plan-Name': planName
      }
    })
  } catch (error) {
    console.error("Prisma findMany failed:", error)
    return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, avatar, specialty, phone } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Nombre y Email son requeridos' }, { status: 400 })
  }

  const businessId = session.businessId

  // ── VALIDACIÓN ESTRICTA DE LÍMITES POR PLAN (FASE 3: ENTITLEMENTS) ──
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { plan: true, company: { include: { plan: true } } }
  })

  if (!business) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  }

  // Verificar estado de suscripción: Negocios suspendidos no pueden crear barberos
  if (business.status === 'SUSPENDED' || business.status === 'CANCELLED') {
    return NextResponse.json({
      error: `Tu cuenta se encuentra en estado ${business.status}. Contacta a soporte para reactivar tu servicio.`,
      code: 'SUBSCRIPTION_INACTIVE'
    }, { status: 403 })
  }

  // Comprobar excepciones manuales de SuperAdmin en PlatformSetting
  let exceptionLimit: number | null = null
  try {
    const exSetting = await prisma.platformSetting.findFirst({
      where: {
        key: {
          in: [
            `exception_${businessId}_UNLIMITED_BARBERS`,
            `exception_${businessId}_max_barbers`,
            ...(business.companyId ? [
              `exception_${business.companyId}_UNLIMITED_BARBERS`,
              `exception_${business.companyId}_max_barbers`
            ] : [])
          ]
        }
      }
    })
    if (exSetting?.value) {
      const exData = JSON.parse(exSetting.value)
      if (exData.enabled && (!exData.expiresAt || new Date(exData.expiresAt) > new Date())) {
        exceptionLimit = exData.maxCount || 999
      }
    }
  } catch { }

  const barberCheck = await canAddBarber(businessId)
  if (!barberCheck.allowed && exceptionLimit === null) {
    return NextResponse.json({
      error: barberCheck.reason || `Has alcanzado el límite de barberos permitido en tu plan actual. Actualiza tu plan para ampliar tu equipo.`,
      code: 'PLAN_LIMIT_REACHED',
      currentCount: barberCheck.currentCount,
      maxAllowed: barberCheck.maxAllowed
    }, { status: 403 })
  }

  const effectiveMaxBarbers = exceptionLimit !== null ? exceptionLimit : barberCheck.maxAllowed

  const cleanEmail = email.trim().toLowerCase()
  const inviteToken = randomUUID()
  // Vigencia estándar de 48 horas según especificación de seguridad
  const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000)

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { barber: true }
    })

    if (existingUser) {
      if (existingUser.barber && existingUser.barber.businessId === businessId) {
        return NextResponse.json({
          error: 'Ya existe un barbero registrado con este correo en tu barbería.',
          code: 'BARBER_ALREADY_EXISTS'
        }, { status: 400 })
      }

      if (existingUser.role === 'OWNER' || existingUser.role === 'SUPER_ADMIN' || existingUser.role === 'ROOT_PLATFORM_OWNER') {
        return NextResponse.json({
          error: 'Este correo pertenece a una cuenta administrativa principal de BarberOS.',
          code: 'EMAIL_IS_ADMIN'
        }, { status: 400 })
      }

      // Si el usuario existe pero no tiene barbero en este negocio, crear perfil y vincular
      const barber = await prisma.barber.create({
        data: {
          name,
          businessId,
          avatar: avatar ? String(avatar).trim() : existingUser.avatar,
          specialty: specialty ? String(specialty).trim() : null,
          phone: phone ? String(phone).trim() : existingUser.phoneNumber,
          status: 'PENDING',
          schedules: {
            create: [
              { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', isWorking: true },
              { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isWorking: true },
              { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isWorking: true },
              { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isWorking: true },
              { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isWorking: true },
              { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isWorking: true },
              { dayOfWeek: 6, startTime: '08:00', endTime: '19:00', isWorking: true },
            ]
          }
        },
        include: { schedules: true }
      })

      // Actualizar usuario existente vinculando el barbero y configurando token de activación
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          barberId: barber.id,
          businessId,
          role: 'BARBER',
          inviteToken,
          inviteExpires
        }
      })

      const inviteLink = getBarberInviteUrl(inviteToken)

      sendBarberInviteEmail({
        to: cleanEmail,
        barberName: name,
        businessName: business.name,
        inviteLink,
        expiresHours: 48
      }).catch(err => {
        console.warn('Aviso: Envío de correo a barbero diferido o simulado:', err)
      })

      return NextResponse.json({
        barber: { ...barber, user: updatedUser },
        inviteLink,
        message: 'Invitación generada y vinculada a cuenta existente'
      }, { status: 201 })
    }

    // Usuario completamente nuevo
    const barber = await prisma.barber.create({
      data: {
        name,
        businessId,
        avatar: avatar ? String(avatar).trim() : null,
        specialty: specialty ? String(specialty).trim() : null,
        phone: phone ? String(phone).trim() : null,
        status: 'PENDING',
        schedules: {
          create: [
            { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', isWorking: true },
            { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 6, startTime: '08:00', endTime: '19:00', isWorking: true },
          ]
        },
        user: {
          create: {
            email: cleanEmail,
            role: 'BARBER',
            inviteToken,
            inviteExpires,
            businessId
          }
        }
      },
      include: { user: true, schedules: true }
    })

    const inviteLink = getBarberInviteUrl(inviteToken)

    // Disparo asíncrono no bloqueante de invitación por correo
    sendBarberInviteEmail({
      to: cleanEmail,
      barberName: name,
      businessName: business.name,
      inviteLink,
      expiresHours: 48
    }).catch(err => {
      console.warn('Aviso: Envío de correo a barbero diferido o simulado:', err)
    })

    return NextResponse.json({ barber, inviteLink }, { status: 201 })
  } catch (error: unknown) {
    console.error("Barber creation failed:", error)
    return NextResponse.json({ error: 'No se pudo crear el barbero. Es posible que el email ya esté en uso o los datos sean inválidos.' }, { status: 500 })
  }
}
