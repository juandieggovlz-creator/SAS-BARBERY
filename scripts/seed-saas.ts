import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding BarberOS SaaS Super Admin data...')

  // 1. SEED PLANS
  const basicPlan = await prisma.plan.upsert({
    where: { slug: 'plan-basico' },
    update: {
      name: 'Plan Básico',
      price: 49000,
      billingPeriod: 'MONTHLY',
      maxBarbers: 3,
      maxClients: 500,
      maxAppointments: 1000,
      features: [
        'Hasta 3 Barberos Activos',
        'Agenda Digital & Reservas Online',
        'Catálogo de Servicios',
        'Fichas de Clientes Básicas',
        'Soporte por Tickets'
      ],
      isPopular: false,
      isActive: true
    },
    create: {
      name: 'Plan Básico',
      slug: 'plan-basico',
      price: 49000,
      billingPeriod: 'MONTHLY',
      maxBarbers: 3,
      maxClients: 500,
      maxAppointments: 1000,
      features: [
        'Hasta 3 Barberos Activos',
        'Agenda Digital & Reservas Online',
        'Catálogo de Servicios',
        'Fichas de Clientes Básicas',
        'Soporte por Tickets'
      ],
      isPopular: false,
      isActive: true
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'plan-profesional' },
    update: {
      name: 'Plan Profesional',
      price: 99000,
      billingPeriod: 'MONTHLY',
      maxBarbers: 10,
      maxClients: 2500,
      maxAppointments: 5000,
      features: [
        'Hasta 10 Barberos Activos',
        'Página Web Pública Personalizable',
        'Control de Comisiones & Rendimiento',
        'Chat de Equipo en Tiempo Real',
        'Cierres de Caja & Control de Gastos',
        'Módulo de Notas Internas de Clientes',
        'Soporte Prioritario'
      ],
      isPopular: true,
      isActive: true
    },
    create: {
      name: 'Plan Profesional',
      slug: 'plan-profesional',
      price: 99000,
      billingPeriod: 'MONTHLY',
      maxBarbers: 10,
      maxClients: 2500,
      maxAppointments: 5000,
      features: [
        'Hasta 10 Barberos Activos',
        'Página Web Pública Personalizable',
        'Control de Comisiones & Rendimiento',
        'Chat de Equipo en Tiempo Real',
        'Cierres de Caja & Control de Gastos',
        'Módulo de Notas Internas de Clientes',
        'Soporte Prioritario'
      ],
      isPopular: true,
      isActive: true
    }
  })

  const premiumPlan = await prisma.plan.upsert({
    where: { slug: 'plan-premium' },
    update: {
      name: 'Plan Premium VIP',
      price: 189000,
      billingPeriod: 'MONTHLY',
      maxBarbers: 30,
      maxClients: 15000,
      maxAppointments: 30000,
      features: [
        'Hasta 30 Barberos Activos',
        'Multi-Sucursales & Escalabilidad',
        'Personalización Web Completa & Temas VIP',
        'Reportes Financieros Avanzados',
        'Gestión Completa de Inventario',
        'Auditoría y Trazabilidad Total',
        'Soporte VIP Dedicado 24/7'
      ],
      isPopular: false,
      isActive: true
    },
    create: {
      name: 'Plan Premium VIP',
      slug: 'plan-premium',
      price: 189000,
      billingPeriod: 'MONTHLY',
      maxBarbers: 30,
      maxClients: 15000,
      maxAppointments: 30000,
      features: [
        'Hasta 30 Barberos Activos',
        'Multi-Sucursales & Escalabilidad',
        'Personalización Web Completa & Temas VIP',
        'Reportes Financieros Avanzados',
        'Gestión Completa de Inventario',
        'Auditoría y Trazabilidad Total',
        'Soporte VIP Dedicado 24/7'
      ],
      isPopular: false,
      isActive: true
    }
  })

  console.log('Plans created/updated:', [basicPlan.name, proPlan.name, premiumPlan.name])

  // 2. ASSIGN PLAN TO EXISTING BUSINESSES IF NONE
  const businesses = await prisma.business.findMany()
  for (const b of businesses) {
    if (!b.planId) {
      await prisma.business.update({
        where: { id: b.id },
        data: {
          planId: proPlan.id,
          status: 'ACTIVE',
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
      console.log(`Assigned Plan Profesional to business: ${b.name}`)
    }
  }

  // 3. CREATE / ENSURE SUPER ADMIN USER
  const superAdminEmail = 'superadmin@barberos.com'
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  })

  if (!existingSuperAdmin) {
    const hashed = await bcrypt.hash('superadmin123', 10)
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashed,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    })
    console.log(`Created Super Admin: ${superAdminEmail} / superadmin123`)
  } else {
    // Ensure role is SUPER_ADMIN
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: { role: 'SUPER_ADMIN', isActive: true }
    })
    console.log(`Super Admin verified: ${superAdminEmail}`)
  }

  // 4. SEED PLATFORM SETTINGS
  const defaultSettings = [
    { key: 'PLATFORM_NAME', value: 'BarberOS Master', description: 'Nombre oficial de la plataforma SaaS' },
    { key: 'SUPPORT_EMAIL', value: 'soporte@barberos.com', description: 'Correo de soporte y atención al cliente' },
    { key: 'SYSTEM_VERSION', value: 'v2.4.0-master', description: 'Versión del sistema BarberOS' },
    { key: 'ALLOW_NEW_REGISTRATIONS', value: 'true', description: 'Permite el registro de nuevas barberías' },
    { key: 'TRIAL_DAYS_DEFAULT', value: '14', description: 'Días de prueba gratuita para nuevos negocios' },
    { key: 'TERMS_URL', value: '/terms', description: 'URL de términos y condiciones' },
    { key: 'PRIVACY_URL', value: '/privacy', description: 'URL de políticas de privacidad' },
  ]

  for (const s of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s
    })
  }
  console.log('Platform settings initialized.')

  // 5. SEED SAMPLE ANNOUNCEMENT
  const existingAnnouncements = await prisma.platformAnnouncement.count()
  if (existingAnnouncements === 0) {
    await prisma.platformAnnouncement.create({
      data: {
        title: '¡Bienvenidos a la versión 2.4 de BarberOS!',
        content: 'Hemos optimizado la velocidad del sistema, mejorado el chat de equipo con citas adjuntas y habilitado el panel de control maestro.',
        type: 'UPDATE',
        targetType: 'ALL',
        isPublished: true
      }
    })
    console.log('Sample announcement created.')
  }

  console.log('SaaS Seed finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
