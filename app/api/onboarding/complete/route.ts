import { NextResponse } from 'next/server'
import { getSession, createSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_SCHEDULE, DayScheduleItem } from '@/lib/schedule'

export async function POST(request: Request) {
  try {
    const session = await getSession('OWNER')

    if (!session || !session.userId || !session.businessId) {
      return NextResponse.json({ error: 'No autorizado o sin negocio asociado.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      department,
      city,
      address,
      phone,
      barbers, // string[] o { name: string }[]
      schedule, // DayScheduleItem[]
    } = body

    if (!businessName || !businessName.trim()) {
      return NextResponse.json({ error: 'El nombre de la barbería es obligatorio.' }, { status: 400 })
    }

    if (!department || !department.trim()) {
      return NextResponse.json({ error: 'El departamento es obligatorio.' }, { status: 400 })
    }

    if (!city || !city.trim()) {
      return NextResponse.json({ error: 'La ciudad es obligatoria.' }, { status: 400 })
    }

    const cleanBizName = businessName.trim()
    const cleanDept = department.trim()
    const cleanCity = city.trim()
    const cleanAddress = address?.trim() || ''

    // Dirección completa formateada
    const fullAddress = [cleanAddress, cleanCity, cleanDept, 'Colombia']
      .filter(Boolean)
      .join(', ')

    // Generar un slug único basado en el nombre final del negocio
    let baseSlug = cleanBizName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!baseSlug) {
      baseSlug = `barberia-${Date.now().toString().slice(-4)}`
    }

    let finalSlug = baseSlug
    const existing = await prisma.business.findFirst({
      where: {
        slug: finalSlug,
        id: { not: session.businessId },
      },
    })
    if (existing) {
      finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
    }

    // Calcular exactamente 30 días de prueba gratuita a FULL
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const defaultPlan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { price: 'desc' },
    })

    // Transacción atómica para actualizar el negocio y crear barberos/servicios iniciales
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar el negocio con onboarding completado y 30 días de prueba
      await tx.business.update({
        where: { id: session.businessId! },
        data: {
          name: cleanBizName,
          slug: finalSlug,
          address: fullAddress,
          phone: phone?.trim() || null,
          status: 'TRIAL',
          onboardingCompleted: true,
          planId: defaultPlan?.id || null,
          trialEndsAt: trialEndsAt,
          maxBarbers: defaultPlan?.maxBarbers || 30,
          maxClients: defaultPlan?.maxClients || 15000,
          maxAppointments: defaultPlan?.maxAppointments || 30000,
        },
      })

      // 2. Crear o actualizar BusinessPage (Página web pública)
      const hoursJson = schedule && Array.isArray(schedule) && schedule.length > 0
        ? JSON.stringify(schedule)
        : JSON.stringify(DEFAULT_SCHEDULE)

      const existingPage = await tx.businessPage.findUnique({
        where: { businessId: session.businessId! },
      })

      if (existingPage) {
        await tx.businessPage.update({
          where: { businessId: session.businessId! },
          data: {
            businessHours: hoursJson,
            coverTitle: `Bienvenido a ${cleanBizName}`,
            coverSubtitle: 'Reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería de primer nivel.',
          },
        })
      } else {
        await tx.businessPage.create({
          data: {
            businessId: session.businessId!,
            theme: 'ELEGANTE',
            primaryColor: '#09090b',
            accentColor: '#d4af37',
            businessHours: hoursJson,
            bannerUrl: '/landing/pagina-web-real.png',
            coverTitle: `Bienvenido a ${cleanBizName}`,
            coverSubtitle: 'Reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería de primer nivel.',
          },
        })
      }

      // 3. Crear barberos iniciales si fueron especificados
      if (Array.isArray(barbers) && barbers.length > 0) {
        for (const b of barbers) {
          const barberName = typeof b === 'string' ? b.trim() : (b?.name ? String(b.name).trim() : '')
          if (barberName) {
            await tx.barber.create({
              data: {
                name: barberName,
                businessId: session.businessId!,
                specialty: 'Barbero Profesional',
                status: 'ACTIVE',
              },
            })
          }
        }
      }

      // 4. Crear servicios base si no existen
      const existingServicesCount = await tx.service.count({
        where: { businessId: session.businessId! },
      })

      if (existingServicesCount === 0) {
        const defaultServices = [
          { name: 'Corte Clásico', duration: 30, price: 30000 },
          { name: 'Barba & Toalla Caliente', duration: 25, price: 25000 },
          { name: 'Combo Corte + Barba', duration: 50, price: 50000 },
        ]

        for (const s of defaultServices) {
          await tx.service.create({
            data: {
              businessId: session.businessId!,
              name: s.name,
              duration: s.duration,
              price: s.price,
              isActive: true,
            },
          })
        }
      }
    })

    // 5. Renovar la sesión del usuario con needsOnboarding = false
    await createSession(
      session.userId,
      'OWNER',
      null,
      session.businessId,
      session.originalOwnerId,
      session.superAdminId,
      false // onboarding completado
    )

    return NextResponse.json({
      success: true,
      redirectUrl: '/dashboard?welcome=google',
    })
  } catch (err: unknown) {
    console.error('[Onboarding Complete API] Error:', err)
    return NextResponse.json({ error: 'Error al finalizar la configuración.' }, { status: 500 })
  }
}
