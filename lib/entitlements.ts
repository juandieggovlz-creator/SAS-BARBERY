import { prisma } from '@/lib/prisma'
import { recordAuditLog } from '@/lib/audit'

export type FeatureKey =
  | 'MULTI_BRANCH'
  | 'WHATSAPP_AUTOMATIONS'
  | 'FINANCIAL_REPORTS'
  | 'MARKETING_BROADCAST'
  | 'UNLIMITED_BARBERS'

export interface EntitlementResult {
  allowed: boolean
  source: 'PLAN' | 'EXCEPTION' | 'TRIAL' | 'DENIED'
  reason?: string
  expiresAt?: Date | null
  maxCount?: number
}

export interface FeatureExceptionData {
  enabled: boolean
  feature: FeatureKey
  reason: string
  grantedAt: string
  expiresAt?: string | null
  grantedBy?: string | null
  maxCount?: number
}

/**
 * Check if a business has access to a specific SaaS feature.
 * Evaluates:
 * 1. Business & Company status (must not be SUSPENDED or CANCELLED)
 * 2. Active PlatformSetting exceptions
 * 3. Base Plan capabilities and feature flags
 */
export async function checkEntitlement(
  businessId: string,
  feature: FeatureKey
): Promise<EntitlementResult> {
  try {
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
      return { allowed: false, source: 'DENIED', reason: 'Barbería no encontrada' }
    }

    if (business.status === 'SUSPENDED' || business.status === 'CANCELLED') {
      return { allowed: false, source: 'DENIED', reason: `Negocio en estado ${business.status}` }
    }

    // 1. Check for active individual exception in PlatformSetting
    const exceptionKeys = [
      `exception_${business.id}_${feature}`,
      `branch_exception_${business.id}`,
      ...(business.companyId ? [
        `exception_${business.companyId}_${feature}`,
        `branch_exception_${business.companyId}`
      ] : [])
    ]

    const activeException = await prisma.platformSetting.findFirst({
      where: { key: { in: exceptionKeys } }
    })

    if (activeException) {
      try {
        const data = JSON.parse(activeException.value) as FeatureExceptionData
        if (data.enabled) {
          if (!data.expiresAt || new Date(data.expiresAt) > new Date()) {
            return {
              allowed: true,
              source: 'EXCEPTION',
              reason: data.reason || 'Excepción manual concedida por SuperAdmin',
              expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
              maxCount: data.maxCount
            }
          }
        }
      } catch {
        // Fallback to plan check if JSON parsing fails
      }
    }

    // 2. Check Plan capabilities
    const activePlan = business.company?.plan || business.plan
    const isTrial = business.status === 'TRIAL' || business.company?.status === 'TRIAL'

    // If on Free Trial, all core features are enabled during trial period
    if (isTrial) {
      const trialEndsAt = business.trialEndsAt || business.company?.trialEndsAt
      if (!trialEndsAt || new Date(trialEndsAt) > new Date()) {
        return {
          allowed: true,
          source: 'TRIAL',
          expiresAt: trialEndsAt,
          reason: 'Periodo de prueba activo'
        }
      }
    }

    if (!activePlan) {
      return { allowed: false, source: 'DENIED', reason: 'Sin plan asignado' }
    }

    switch (feature) {
      case 'MULTI_BRANCH': {
        const allows = Boolean(activePlan.allowsMultiBranch) || (business.company && business.company.maxBranches > 1)
        return {
          allowed: Boolean(allows),
          source: allows ? 'PLAN' : 'DENIED',
          maxCount: activePlan.includedBranches || 1
        }
      }

      case 'WHATSAPP_AUTOMATIONS': {
        // Included in Pro and Premium plans
        const allows = activePlan.slug.includes('pro') || activePlan.slug.includes('premium')
        return {
          allowed: allows,
          source: allows ? 'PLAN' : 'DENIED',
          reason: allows ? undefined : 'Requiere Plan Profesional o Premium'
        }
      }

      case 'FINANCIAL_REPORTS':
      case 'MARKETING_BROADCAST': {
        const allows = activePlan.slug.includes('pro') || activePlan.slug.includes('premium')
        return {
          allowed: allows,
          source: allows ? 'PLAN' : 'DENIED',
          reason: allows ? undefined : 'Requiere Plan Profesional o superior'
        }
      }

      case 'UNLIMITED_BARBERS': {
        const allows = activePlan.slug.includes('premium')
        return {
          allowed: allows,
          source: allows ? 'PLAN' : 'DENIED',
          maxCount: activePlan.maxBarbers
        }
      }

      default:
        return { allowed: false, source: 'DENIED' }
    }
  } catch (error) {
    console.error('Error checking entitlement:', error)
    return { allowed: false, source: 'DENIED', reason: 'Error interno en verificación' }
  }
}

/**
 * Grant a temporary or permanent feature exception for a business/company.
 */
export async function grantFeatureException(params: {
  businessId: string
  feature: FeatureKey
  reason: string
  durationDays?: number
  maxCount?: number
  grantedByUserId: string
}) {
  const { businessId, feature, reason, durationDays, maxCount, grantedByUserId } = params

  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 86400 * 1000).toISOString()
    : null

  const data: FeatureExceptionData = {
    enabled: true,
    feature,
    reason,
    grantedAt: new Date().toISOString(),
    expiresAt,
    grantedBy: grantedByUserId,
    maxCount
  }

  const key = feature === 'MULTI_BRANCH'
    ? `branch_exception_${businessId}`
    : `exception_${businessId}_${feature}`

  const setting = await prisma.platformSetting.upsert({
    where: { key },
    create: {
      key,
      value: JSON.stringify(data),
      description: `Excepción para ${feature} en negocio ${businessId}`
    },
    update: {
      value: JSON.stringify(data)
    }
  })

  await recordAuditLog({
    action: 'GRANT_FEATURE_EXCEPTION',
    entity: 'PlatformSetting',
    entityId: setting.id,
    businessId,
    userId: grantedByUserId,
    details: { feature, reason, durationDays, expiresAt, maxCount }
  })

  return { success: true, setting, data }
}

/**
 * Revoke a feature exception.
 */
export async function revokeFeatureException(params: {
  businessId: string
  feature: FeatureKey
  revokedByUserId: string
}) {
  const { businessId, feature, revokedByUserId } = params

  const key = feature === 'MULTI_BRANCH'
    ? `branch_exception_${businessId}`
    : `exception_${businessId}_${feature}`

  await prisma.platformSetting.deleteMany({
    where: { key }
  })

  await recordAuditLog({
    action: 'REVOKE_FEATURE_EXCEPTION',
    entity: 'PlatformSetting',
    businessId,
    userId: revokedByUserId,
    details: { feature }
  })

  return { success: true }
}

