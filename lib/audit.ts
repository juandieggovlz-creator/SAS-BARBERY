import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export interface RecordAuditParams {
  userId?: string | null
  userName?: string | null
  userRole?: Role | null
  businessId?: string | null
  action: string
  entity: 'Business' | 'User' | 'Plan' | 'Subscription' | 'SaaSSubscription' | 'Ticket' | 'SupportTicket' | 'Announcement' | 'PlatformAnnouncement' | 'System' | 'PlatformSetting' | (string & {})
  entityId?: string | null
  details?: Record<string, unknown> | null
  ipAddress?: string | null
}

/**
 * Record an immutable audit log entry in the system.
 */
export async function recordAuditLog(params: RecordAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userName: params.userName || null,
        userRole: params.userRole || null,
        businessId: params.businessId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
        ipAddress: params.ipAddress || null,
      }
    })
  } catch (error) {
    console.error('Failed to record audit log:', error)
    return null
  }
}
