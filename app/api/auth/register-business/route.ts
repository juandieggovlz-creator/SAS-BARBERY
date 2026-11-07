import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import { DEFAULT_SCHEDULE } from '@/lib/schedule'
import { uploadImageFromString } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      password,
      businessName,
      slug,
      phone,
      whatsapp,
      businessEmail,
      country,
      department,
      city,
      address,
      logo,
      dashboardTheme,
      primaryColor,
      currency,
      schedule,
      services,
      firstBarber
    } = body

    if (!businessName || !email || !password) {
      return NextResponse.json(
        { error: 'El nombre de la barbería, correo y contraseña son obligatorios.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // Auto-generate slug if not explicitly provided
    let cleanSlug = (slug || businessName)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!cleanSlug) {
      cleanSlug = `barberia-${Date.now().toString().slice(-4)}`
    }

    // Check if slug or email already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: cleanSlug }
    })
    if (existingBusiness) {
      cleanSlug = `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}`
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive'
        }
      }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya tiene una cuenta registrada. Inicia sesión en su lugar.' },
        { status: 400 }
      )
    }

    // Process logo if provided (upload directly to Cloudinary)
    let logoUrl: string | null = null
    if (logo && typeof logo === 'string' && logo.startsWith('data:image/')) {
      try {
        const uploadResult = await uploadImageFromString(
          logo,
          `barberos/${cleanSlug}/logo`,
          {
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
          }
        )
        logoUrl = uploadResult.secureUrl
      } catch (uploadErr) {
        console.warn('[Register] Error subiendo logo a Cloudinary, continuando sin logo:', uploadErr)
      }
    } else if (logo && typeof logo === 'string' && (logo.startsWith('http://') || logo.startsWith('https://'))) {
      logoUrl = logo
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Format address
    const fullAddress = [address, city, department, country].filter(Boolean).join(', ')

    // ── Calcular 30 días exactos de prueba gratis con todo habilitado a FULL ──
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Buscar plan preferente o el más completo para la prueba
    const defaultTrialPlan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { price: 'desc' }
    })

    // Execute atomic transaction: All or Nothing
    const { business, user, company } = await prisma.$transaction(async (tx) => {
      // 1. Create Owner User
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: 'OWNER',
          accentColor: primaryColor || '#F59E0B'
        }
      })

      // 2. Create Company (Empresa Propietaria Multisedes)
      const newCompany = await tx.company.create({
        data: {
          name: businessName.trim(),
          ownerId: newUser.id,
          planId: defaultTrialPlan?.id || null,
          maxBranches: 1,
          additionalBranchPrice: 50000,
          status: 'ACTIVE'
        }
      })

      // 3. Create Business (Sede Principal) vinculada a la Company
      const newBusiness = await tx.business.create({
        data: {
          name: businessName.trim(),
          slug: cleanSlug,
          phone: phone?.trim() || whatsapp?.trim() || null,
          address: fullAddress || null,
          email: businessEmail?.trim() || cleanEmail,
          logo: logoUrl,
          status: 'TRIAL',
          companyId: newCompany.id,
          isMainBranch: true,
          planId: defaultTrialPlan?.id || null,
          trialEndsAt: trialEndsAt,
          maxBarbers: defaultTrialPlan?.maxBarbers || 30,
          maxClients: defaultTrialPlan?.maxClients || 15000,
          maxAppointments: defaultTrialPlan?.maxAppointments || 30000
        }
      })

      // 4. Vincular negocio y empresa al usuario
      await tx.user.update({
        where: { id: newUser.id },
        data: {
          businessId: newBusiness.id,
          companyId: newCompany.id
        }
      })

      // 5. Create BusinessPage (Public web portal)
      const hoursJson = schedule && Array.isArray(schedule) && schedule.length > 0
        ? JSON.stringify(schedule)
        : JSON.stringify(DEFAULT_SCHEDULE)

      await tx.businessPage.create({
        data: {
          businessId: newBusiness.id,
          theme: 'ELEGANTE',
          primaryColor: primaryColor || '#09090b',
          accentColor: primaryColor === '#d4af37' ? '#d4af37' : (primaryColor || '#d4af37'),
          whatsapp: whatsapp?.trim() || phone?.trim() || null,
          businessHours: hoursJson,
          bannerUrl: '/landing/pagina-web-real.png',
          coverTitle: `Bienvenido a ${businessName.trim()}`,
          coverSubtitle: 'Reserva tu cita con nuestros profesionales y disfruta de una experiencia de barbería diseñada para resaltar tu mejor estilo.',
        }
      })

      // 3.1 Registrar consentimiento de Términos y Política de Privacidad
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          userName: fullName ? fullName.trim() : newUser.email,
          userRole: 'OWNER',
          businessId: newBusiness.id,
          action: 'TERMS_AND_PRIVACY_ACCEPTED',
          entity: 'User',
          entityId: newUser.id,
          details: {
            termsVersion: body.termsVersion || '1.0',
            acceptedAt: body.termsAcceptedAt || new Date().toISOString(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'desconocida'
          }
        }
      })

      // 4. Create Services
      const servicesToCreate = Array.isArray(services) && services.length > 0
        ? services
        : [
            { name: 'Corte Clásico', duration: 30, price: 30000 },
            { name: 'Barba & Toalla Caliente', duration: 25, price: 25000 },
            { name: 'Combo Corte + Barba', duration: 50, price: 50000 }
          ]

      for (const s of servicesToCreate) {
        if (s.name && s.name.trim()) {
          await tx.service.create({
            data: {
              businessId: newBusiness.id,
              name: s.name.trim(),
              duration: Number(s.duration) || 30,
              price: Number(s.price) || 25000,
              isActive: true
            }
          })
        }
      }

      // 5. Create First Barber (if provided)
      if (firstBarber && firstBarber.name && firstBarber.name.trim()) {
        const barber = await tx.barber.create({
          data: {
            name: firstBarber.name.trim(),
            phone: firstBarber.phone?.trim() || null,
            specialty: firstBarber.specialty?.trim() || 'Barbero Profesional',
            businessId: newBusiness.id,
            status: 'ACTIVE'
          }
        })

        // Create weekly schedule for barber
        const scheduleList = Array.isArray(schedule) && schedule.length > 0 ? schedule : DEFAULT_SCHEDULE
        for (const item of scheduleList) {
          await tx.barberSchedule.create({
            data: {
              barberId: barber.id,
              dayOfWeek: item.dayIndex,
              startTime: item.openTime || '08:00',
              endTime: item.closeTime || '20:00',
              isWorking: item.isOpen !== false
            }
          })
        }
      }

      return { business: newBusiness, user: newUser, company: newCompany }
    })

    // Establish JWT session cookie
    await createSession(user.id, 'OWNER', null, business.id, null, null, false, company.id)

    return NextResponse.json({
      success: true,
      message: 'Barbería y cuenta creadas exitosamente',
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        address: business.address,
        logo: business.logo
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: unknown) {
    console.error('Register Business Wizard Error:', error)
    const msg = error instanceof Error ? error.message : 'Error inesperado al registrar la barbería'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
