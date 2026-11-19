import { prisma } from '../lib/prisma'

const OFFICIAL_PLANS = [
  {
    name: 'Modo Sandbox',
    slug: 'sandbox',
    price: 0,
    billingPeriod: 'MONTHLY',
    maxBarbers: 1,
    maxClients: 200,
    maxAppointments: 500,
    features: [
      '1 barbero activo (gestión manual)',
      '1 sede física',
      'Agenda interna manual desde el dashboard',
      'Gestión básica de clientes',
      'Sin reservas públicas online',
      'Sin automatizaciones de WhatsApp',
      'Sin módulo de anticipos / señas',
      'Datos e historial siempre protegidos'
    ],
    allowsMultiBranch: false,
    includedBranches: 1,
    defaultAdditionalBranchPrice: 50000,
    isPopular: false,
    isActive: true,
    isPublic: false
  },
  {
    name: 'Plan Básico',
    slug: 'plan-basico',
    price: 69900,
    billingPeriod: 'MONTHLY',
    maxBarbers: 3,
    maxClients: 500,
    maxAppointments: 1000,
    features: [
      '1 sede física incluida',
      'Hasta 3 barberos activos',
      'Panel de control & Agenda interactiva',
      'Gestión de clientes e historial',
      'Página web pública de reservas en línea',
      'Control de caja y reportes básicos',
      'Soporte técnico por tickets'
    ],
    allowsMultiBranch: false,
    includedBranches: 1,
    defaultAdditionalBranchPrice: 50000,
    isPopular: false,
    isActive: true,
    isPublic: true
  },
  {
    name: 'Plan Profesional',
    slug: 'plan-profesional',
    price: 119900,
    billingPeriod: 'MONTHLY',
    maxBarbers: 10,
    maxClients: 2500,
    maxAppointments: 5000,
    features: [
      '1 sede física incluida',
      'Hasta 10 barberos con portal individual',
      'Todo lo incluido en Básico',
      'Automatización de recordatorios por WhatsApp',
      'Cálculo y liquidación automática de comisiones',
      'Cierre de caja ciego anti-fugas',
      'Reportes avanzados y análisis de demanda',
      'Notas y chat interno del equipo'
    ],
    allowsMultiBranch: false,
    includedBranches: 1,
    defaultAdditionalBranchPrice: 50000,
    isPopular: true,
    isActive: true,
    isPublic: true
  },
  {
    name: 'Plan Premium VIP',
    slug: 'plan-premium',
    price: 169900,
    billingPeriod: 'MONTHLY',
    maxBarbers: 30,
    maxClients: 15000,
    maxAppointments: 30000,
    features: [
      '2 sedes incluidas (Multisedes)',
      'Hasta 30 barberos en total entre sedes',
      'Todo lo incluido en Profesional',
      'Panel consolidado y selector de sedes',
      'Administradores independientes por sede',
      'Sedes adicionales: $50.000 COP/mes c/u',
      'Páginas web y configuraciones independientes',
      'WhatsApp independiente por sede (Cloud API)',
      'Soporte VIP prioritario 24/7'
    ],
    allowsMultiBranch: true,
    includedBranches: 2,
    defaultAdditionalBranchPrice: 50000,
    isPopular: false,
    isActive: true,
    isPublic: true
  }
]

async function main() {
  console.log('Sincronizando planes oficiales en base de datos...')
  for (const plan of OFFICIAL_PLANS) {
    const upserted = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
        maxBarbers: plan.maxBarbers,
        maxClients: plan.maxClients,
        maxAppointments: plan.maxAppointments,
        features: plan.features,
        allowsMultiBranch: plan.allowsMultiBranch,
        includedBranches: plan.includedBranches,
        defaultAdditionalBranchPrice: plan.defaultAdditionalBranchPrice,
        isPopular: plan.isPopular,
        isActive: plan.isActive,
        isPublic: plan.isPublic
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
        maxBarbers: plan.maxBarbers,
        maxClients: plan.maxClients,
        maxAppointments: plan.maxAppointments,
        features: plan.features,
        allowsMultiBranch: plan.allowsMultiBranch,
        includedBranches: plan.includedBranches,
        defaultAdditionalBranchPrice: plan.defaultAdditionalBranchPrice,
        isPopular: plan.isPopular,
        isActive: plan.isActive,
        isPublic: plan.isPublic
      }
    })
    console.log(`Plan sincronizado: ${upserted.name} (${upserted.slug}) - $${upserted.price} COP | isPublic: ${upserted.isPublic}`)
  }
  console.log('✅ Sincronización de planes completada exitosamente.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
