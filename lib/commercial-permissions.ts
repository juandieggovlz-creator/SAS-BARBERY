/**
 * BarberOS — Motor Central de Permisos Comerciales y Estado de Suscripción
 * 
 * Reglas de negocio:
 * 1. 30 días de prueba gratuita en registro (TRIAL): acceso full a todas las funciones.
 * 2. Planes de pago activos:
 *    - Básico ($69.900): 1 sede, hasta 3 barberos, agenda y reservas públicas, caja básica.
 *    - Profesional ($119.900): 1 sede, hasta 10 barberos, WhatsApp, comisiones, caja ciega, reportes avanzados.
 *    - Premium VIP ($169.900): Multisede (2 sedes incluidas), hasta 30 barberos, soporte VIP.
 * 3. Modo Sandbox ($0 COP):
 *    - Activado automáticamente si la prueba o el plan de pago vencen sin renovación.
 *    - NO borra datos (barberos, citas, finanzas e historial quedan intactos).
 *    - Permite uso operativo manual interno (1 barbero activo, 1 sede, agenda interna manual).
 *    - Bloquea reservas públicas online, WhatsApp automatizado, comisiones y anticipos.
 */

import { prisma } from '@/lib/prisma'
import { checkEntitlement, FeatureKey } from '@/lib/entitlements'
import { evaluateSubscriptionLifecycle, GRACE_PERIOD_DAYS } from '@/lib/billing-dates'

export type CommercialTier = 'SANDBOX' | 'BASIC' | 'PRO' | 'PREMIUM' | 'TRIAL' | 'SUSPENDED'

export interface EffectiveSubscription {
  businessId: string
  businessName: string
  businessSlug: string
  tier: CommercialTier
  isTrial: boolean
  isSandbox: boolean
  isPaidActive: boolean
  isInGracePeriod: boolean
  graceDaysRemaining: number | null
  isSuspended: boolean
  daysRemaining: number | null
  statusLabel: string
  expiresAt: Date | null
  plan: {
    id?: string
    name: string
    slug: string
    price: number
    maxBarbers: number
    maxBranches: number
  }
  permissions: {
    canUsePublicBooking: boolean
    canUseWebEditor: boolean
    canUseWhatsApp: boolean
    canUseCommissions: boolean
    canUseAdvancedReports: boolean
    canUseDeposits: boolean
    canUseMultiBranch: boolean
  }
  moduleToggles: {
    webpage: boolean
    reports: boolean
    finances: boolean
    chat: boolean
    analytics: boolean
  }
  limits: {
    maxBarbers: number
    maxBranches: number
    maxClients: number
    maxAppointments: number
  }
}

const DEFAULT_MODULE_TOGGLES = {
  webpage: true,
  reports: true,
  finances: true,
  chat: true,
  analytics: true
}

/**
 * Obtiene el estado comercial efectivo de una barbería evaluando fechas de expiración en tiempo real (UTC)
 */
export async function getEffectiveSubscription(businessId: string): Promise<EffectiveSubscription> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plan: true,
      company: {
        include: { plan: true }
      }
    }
  })

  if (!business) {
    throw new Error(`Negocio ${businessId} no encontrado`)
  }

  const now = new Date()

  // Consultar toggles de módulos individuales y excepciones administrativas en PlatformSetting
  const settingKeys = [
    `permissions_${business.id}`,
    `branch_exception_${business.id}`,
    ...(business.companyId ? [`branch_exception_${business.companyId}`] : [])
  ]
  const settings = await prisma.platformSetting.findMany({
    where: { key: { in: settingKeys } }
  })

  let moduleToggles = { ...DEFAULT_MODULE_TOGGLES }
  let hasBranchException = false
  let branchExceptionMax = 5

  for (const s of settings) {
    try {
      const parsed = JSON.parse(s.value)
      if (s.key === `permissions_${business.id}` && parsed && typeof parsed === 'object') {
        moduleToggles = { ...DEFAULT_MODULE_TOGGLES, ...parsed }
      } else if (s.key.startsWith('branch_exception_') && parsed?.enabled === true) {
        if (!parsed.expiresAt || new Date(parsed.expiresAt) > now) {
          hasBranchException = true
          if (parsed.maxCount || parsed.maxBranches) {
            branchExceptionMax = Number(parsed.maxCount || parsed.maxBranches) || 5
          }
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }

  // 1. Evaluar ciclo de vida completo mediante el motor central de fechas
  const targetPlan = business.plan || business.company?.plan
  const lifecycle = evaluateSubscriptionLifecycle({
    businessStatus: business.status,
    subscriptionEndsAt: business.subscriptionEndsAt,
    trialEndsAt: business.trialEndsAt || business.company?.trialEndsAt,
    planSlug: targetPlan?.slug,
    now
  })

  // 2. Si está explícitamente suspendido o cancelado
  if (lifecycle.isSuspended) {
    return {
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      tier: 'SUSPENDED',
      isTrial: false,
      isSandbox: false,
      isPaidActive: false,
      isInGracePeriod: false,
      graceDaysRemaining: null,
      isSuspended: true,
      daysRemaining: 0,
      statusLabel: 'Suspendido por falta de pago o infracción',
      expiresAt: null,
      plan: {
        name: 'Suspendido',
        slug: 'suspended',
        price: 0,
        maxBarbers: 0,
        maxBranches: 0
      },
      permissions: {
        canUsePublicBooking: false,
        canUseWebEditor: false,
        canUseWhatsApp: false,
        canUseCommissions: false,
        canUseAdvancedReports: false,
        canUseDeposits: false,
        canUseMultiBranch: false
      },
      moduleToggles: {
        webpage: false,
        reports: false,
        finances: false,
        chat: false,
        analytics: false
      },
      limits: {
        maxBarbers: 0,
        maxBranches: 0,
        maxClients: 0,
        maxAppointments: 0
      }
    }
  }

  // 3. Suscripción de pago activa vigente
  if (lifecycle.status === 'ACTIVE' || lifecycle.status === 'EXPIRING_SOON') {
    const end = lifecycle.expiresAt!
    const planSlug = targetPlan?.slug?.toLowerCase() || 'plan-basico'

    let tier: CommercialTier = 'BASIC'
    if (planSlug.includes('premium')) tier = 'PREMIUM'
    else if (planSlug.includes('pro')) tier = 'PRO'

    const isPremium = tier === 'PREMIUM'
    const isPro = tier === 'PRO' || isPremium
    const canMultiBranch = isPremium || Boolean(targetPlan?.allowsMultiBranch) || hasBranchException

    const effectiveMaxBarbers = business.maxBarbers ?? targetPlan?.maxBarbers ?? 3
    const effectiveMaxClients = business.maxClients ?? targetPlan?.maxClients ?? 500
    const effectiveMaxAppointments = business.maxAppointments ?? targetPlan?.maxAppointments ?? 1000
    const effectiveMaxBranches = hasBranchException
      ? Math.max(business.company?.maxBranches || 1, branchExceptionMax)
      : canMultiBranch
      ? Math.max(business.company?.maxBranches || 1, targetPlan?.includedBranches || 1)
      : 1

    return {
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      tier,
      isTrial: false,
      isSandbox: false,
      isPaidActive: true,
      isInGracePeriod: false,
      graceDaysRemaining: null,
      isSuspended: false,
      daysRemaining: lifecycle.daysRemaining,
      statusLabel: lifecycle.status === 'EXPIRING_SOON'
        ? `${targetPlan?.name || 'Plan'} (Vence en ${lifecycle.daysRemaining} días)`
        : `Plan ${targetPlan?.name || 'Comercial'} Activo`,
      expiresAt: end,
      plan: {
        id: targetPlan?.id,
        name: targetPlan?.name || 'Plan Activo',
        slug: targetPlan?.slug || 'plan-basico',
        price: Number(targetPlan?.price || 0),
        maxBarbers: effectiveMaxBarbers,
        maxBranches: effectiveMaxBranches
      },
      permissions: {
        canUsePublicBooking: moduleToggles.webpage,
        canUseWebEditor: moduleToggles.webpage,
        canUseWhatsApp: isPro,
        canUseCommissions: isPro && moduleToggles.finances,
        canUseAdvancedReports: isPro && moduleToggles.reports,
        canUseDeposits: isPro && moduleToggles.finances,
        canUseMultiBranch: canMultiBranch
      },
      moduleToggles,
      limits: {
        maxBarbers: effectiveMaxBarbers,
        maxBranches: effectiveMaxBranches,
        maxClients: effectiveMaxClients,
        maxAppointments: effectiveMaxAppointments
      }
    }
  }

  // 4. Período de Gracia (hasta 3 días calendario tras vencer suscripción de pago)
  if (lifecycle.isInGracePeriod && targetPlan) {
    const planSlug = targetPlan.slug.toLowerCase()
    let tier: CommercialTier = 'BASIC'
    if (planSlug.includes('premium')) tier = 'PREMIUM'
    else if (planSlug.includes('pro')) tier = 'PRO'

    const isPremium = tier === 'PREMIUM'
    const isPro = tier === 'PRO' || isPremium
    const canMultiBranch = isPremium || Boolean(targetPlan.allowsMultiBranch) || hasBranchException

    const effectiveMaxBarbers = business.maxBarbers ?? targetPlan.maxBarbers
    const effectiveMaxClients = business.maxClients ?? targetPlan.maxClients
    const effectiveMaxAppointments = business.maxAppointments ?? targetPlan.maxAppointments
    const effectiveMaxBranches = hasBranchException
      ? Math.max(business.company?.maxBranches || 1, branchExceptionMax)
      : canMultiBranch
      ? Math.max(business.company?.maxBranches || 1, targetPlan.includedBranches || 1)
      : 1

    return {
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      tier,
      isTrial: false,
      isSandbox: false,
      isPaidActive: true,
      isInGracePeriod: true,
      graceDaysRemaining: lifecycle.graceDaysRemaining,
      isSuspended: false,
      daysRemaining: 0,
      statusLabel: `Período de Gracia (${lifecycle.graceDaysRemaining} día(s) restante(s))`,
      expiresAt: lifecycle.expiresAt,
      plan: {
        id: targetPlan.id,
        name: `${targetPlan.name} (En Gracia)`,
        slug: targetPlan.slug,
        price: Number(targetPlan.price),
        maxBarbers: effectiveMaxBarbers,
        maxBranches: effectiveMaxBranches
      },
      permissions: {
        canUsePublicBooking: moduleToggles.webpage,
        canUseWebEditor: moduleToggles.webpage,
        canUseWhatsApp: isPro,
        canUseCommissions: isPro && moduleToggles.finances,
        canUseAdvancedReports: isPro && moduleToggles.reports,
        canUseDeposits: isPro && moduleToggles.finances,
        canUseMultiBranch: canMultiBranch
      },
      moduleToggles,
      limits: {
        maxBarbers: effectiveMaxBarbers,
        maxBranches: effectiveMaxBranches,
        maxClients: effectiveMaxClients,
        maxAppointments: effectiveMaxAppointments
      }
    }
  }

  // 5. Período de prueba gratuito activo (30 días)
  if (lifecycle.isTrial && lifecycle.expiresAt) {
    const end = lifecycle.expiresAt
    const trialMaxBranches = hasBranchException
      ? Math.max(business.company?.maxBranches || 2, branchExceptionMax)
      : Math.max(business.company?.maxBranches || 2, 2)

    return {
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      tier: 'TRIAL',
      isTrial: true,
      isSandbox: false,
      isPaidActive: false,
      isInGracePeriod: false,
      graceDaysRemaining: null,
      isSuspended: false,
      daysRemaining: lifecycle.daysRemaining,
      statusLabel: `Prueba Gratuita (${lifecycle.daysRemaining} días restantes)`,
      expiresAt: end,
      plan: {
        name: 'Prueba Gratuita Premium (30 días)',
        slug: 'trial',
        price: 0,
        maxBarbers: business.maxBarbers || 30,
        maxBranches: trialMaxBranches
      },
      permissions: {
        canUsePublicBooking: moduleToggles.webpage,
        canUseWebEditor: moduleToggles.webpage,
        canUseWhatsApp: true,
        canUseCommissions: moduleToggles.finances,
        canUseAdvancedReports: moduleToggles.reports,
        canUseDeposits: moduleToggles.finances,
        canUseMultiBranch: true
      },
      moduleToggles,
      limits: {
        maxBarbers: business.maxBarbers || 30,
        maxBranches: trialMaxBranches,
        maxClients: business.maxClients || 15000,
        maxAppointments: business.maxAppointments || 30000
      }
    }
  }

  // 6. Período de prueba o suscripción expirada -> Modo SANDBOX (Operación Manual Gratuita)
  // Ningún dato es borrado; la barbería opera internamente con 1 barbero y reservas públicas pausadas.
  return {
    businessId: business.id,
    businessName: business.name,
    businessSlug: business.slug,
    tier: 'SANDBOX',
    isTrial: false,
    isSandbox: true,
    isPaidActive: false,
    isInGracePeriod: false,
    graceDaysRemaining: 0,
    isSuspended: false,
    daysRemaining: 0,
    statusLabel: 'Modo Sandbox (Operación Manual)',
    expiresAt: null,
    plan: {
      name: 'Modo Sandbox',
      slug: 'sandbox',
      price: 0,
      maxBarbers: 1,
      maxBranches: hasBranchException ? branchExceptionMax : 1
    },
    permissions: {
      canUsePublicBooking: false, // Reservas públicas pausadas
      canUseWebEditor: moduleToggles.webpage, // Puede editar borrador, pero se notifica que reservas están en pausa
      canUseWhatsApp: false,     // Sin automatización externa
      canUseCommissions: false,
      canUseAdvancedReports: false,
      canUseDeposits: false,
      canUseMultiBranch: hasBranchException
    },
    moduleToggles,
    limits: {
      maxBarbers: 1,
      maxBranches: hasBranchException ? branchExceptionMax : 1,
      maxClients: 200,
      maxAppointments: 500
    }
  }
}

/**
 * Validar si un negocio puede recibir reservas públicas por la web
 */
export async function canUsePublicBooking(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
  const sub = await getEffectiveSubscription(businessId)
  if (sub.isSuspended) {
    return { allowed: false, reason: 'El establecimiento se encuentra temporalmente suspendido.' }
  }
  if (!sub.moduleToggles.webpage) {
    return { allowed: false, reason: 'El módulo de reservas públicas en línea está desactivado para este establecimiento.' }
  }
  if (sub.isSandbox) {
    return {
      allowed: false,
      reason: 'Las reservas públicas en línea de este establecimiento están pausadas. Comunícate directamente con la barbería por teléfono o WhatsApp para agendar tu cita.'
    }
  }
  return { allowed: true }
}

/**
 * Validar si un negocio puede agregar o activar un barbero
 */
export async function canAddBarber(businessId: string): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; reason?: string }> {
  const sub = await getEffectiveSubscription(businessId)
  // Solo contar barberos activos o pendientes (los inactivos no consumen cupo activo ni se borran al bajar de plan)
  const currentCount = await prisma.barber.count({
    where: {
      businessId,
      status: { not: 'INACTIVE' }
    }
  })

  if (sub.isSuspended) {
    return { allowed: false, currentCount, maxAllowed: 0, reason: 'Cuenta suspendida' }
  }

  const maxAllowed = sub.limits.maxBarbers

  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      currentCount,
      maxAllowed,
      reason: sub.isSandbox
        ? 'El Modo Sandbox permite 1 barbero activo. Actualiza a un plan de pago para habilitar más barberos.'
        : `Has alcanzado el límite de ${maxAllowed} barberos activos de tu plan actual. Solicita una actualización para ampliar tu equipo.`
    }
  }

  return { allowed: true, currentCount, maxAllowed }
}

/**
 * Validar si un negocio puede crear una nueva sede
 */
export async function canAddBranch(businessId: string): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; reason?: string }> {
  const sub = await getEffectiveSubscription(businessId)

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { companyId: true }
  })

  let currentCount = 1
  if (business?.companyId) {
    currentCount = await prisma.business.count({ where: { companyId: business.companyId } })
  }

  if (sub.isSuspended) {
    return { allowed: false, currentCount, maxAllowed: 0, reason: 'La cuenta se encuentra suspendida.' }
  }

  if (!sub.permissions.canUseMultiBranch) {
    return {
      allowed: false,
      currentCount,
      maxAllowed: 1,
      reason: `Tu plan actual (${sub.plan.name}) no permite crear sedes adicionales. Se requiere el Plan Premium VIP.`
    }
  }

  const maxAllowed = sub.limits.maxBranches

  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      currentCount,
      maxAllowed,
      reason: `Has alcanzado el límite de ${maxAllowed} sede(s) de tu plan actual (${sub.plan.name}).`
    }
  }

  return { allowed: true, currentCount, maxAllowed }
}

/**
 * Validar si un negocio puede usar WhatsApp automatizado
 */
export async function canUseWhatsApp(businessId: string): Promise<boolean> {
  const sub = await getEffectiveSubscription(businessId)
  return sub.permissions.canUseWhatsApp
}

/**
 * Validar si un negocio puede cobrar anticipos y depósitos
 */
export async function canUseDeposits(businessId: string): Promise<boolean> {
  const sub = await getEffectiveSubscription(businessId)
  return sub.permissions.canUseDeposits
}

/**
 * Validar si un negocio puede ver reportes financieros avanzados y comisiones
 */
export async function canUseAdvancedReports(businessId: string): Promise<boolean> {
  const sub = await getEffectiveSubscription(businessId)
  return sub.permissions.canUseAdvancedReports
}
