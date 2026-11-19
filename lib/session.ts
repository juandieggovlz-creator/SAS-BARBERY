/**
 * BarberOS — Gestión Centralizada de Sesiones Persistentes y Revocables
 * 
 * Vincula cada JWT a un registro verificable en Neon PostgreSQL (`model Session`).
 * Permite revocación instantánea, cierre de sesiones remotas y auditoría de dispositivos.
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface CreateSessionParams {
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
  deviceInfo?: string | null
  durationDays?: number
}

/**
 * Parsea el User-Agent para presentar un nombre legible del dispositivo
 */
export function parseDeviceName(userAgent?: string | null): string {
  if (!userAgent) return 'Dispositivo Desconocido'
  const ua = userAgent.toLowerCase()

  let os = 'Dispositivo'
  if (ua.includes('windows')) os = 'Windows PC'
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'Mac'
  else if (ua.includes('iphone')) os = 'iPhone'
  else if (ua.includes('ipad')) os = 'iPad'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('linux')) os = 'Linux'

  let browser = ''
  if (ua.includes('edg/')) browser = 'Edge'
  else if (ua.includes('chrome/')) browser = 'Chrome'
  else if (ua.includes('firefox/')) browser = 'Firefox'
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari'

  return browser ? `${os} (${browser})` : os
}

/**
 * Crea una sesión persistente en base de datos
 */
export async function createPersistentSession(params: CreateSessionParams): Promise<{
  sessionId: string
  sessionToken: string
  expiresAt: Date
}> {
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const duration = params.durationDays ?? 7
  const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
  const deviceInfo = params.deviceInfo || parseDeviceName(params.userAgent)

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      sessionToken,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      deviceInfo,
      expiresAt,
    }
  })

  return {
    sessionId: session.id,
    sessionToken,
    expiresAt
  }
}

/**
 * Valida la existencia, vigencia y estado de una sesión en base de datos.
 * Actualiza lastActiveAt de forma periódica (cada 5 min máximo).
 */
export async function validateSession(sessionId: string): Promise<{
  valid: boolean
  user: any | null
  reason?: string
}> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            businessId: true,
            companyId: true,
            barberId: true,
            mfaEnabled: true,
            name: true,
          }
        }
      }
    })

    if (!session) {
      return { valid: false, user: null, reason: 'Sesión no encontrada en base de datos' }
    }

    if (session.isRevoked) {
      return { valid: false, user: null, reason: 'Sesión revocada administrativamente' }
    }

    if (new Date() > session.expiresAt) {
      return { valid: false, user: null, reason: 'Sesión expirada' }
    }

    if (!session.user || !session.user.isActive) {
      return { valid: false, user: null, reason: 'Usuario inactivo o suspendido' }
    }

    // Actualizar última actividad si pasaron más de 5 minutos desde la última escritura
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (session.lastActiveAt < fiveMinutesAgo) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastActiveAt: new Date() }
      }).catch(() => {})
    }

    return { valid: true, user: session.user }
  } catch (error) {
    console.error('[validateSession DB Error]:', error)
    return { valid: false, user: null, reason: 'Error de conexión' }
  }
}

/**
 * Revoca una sesión individual
 */
export async function revokeSession(sessionId: string, userId?: string): Promise<boolean> {
  try {
    const whereClause: any = { id: sessionId }
    if (userId) whereClause.userId = userId

    await prisma.session.updateMany({
      where: whereClause,
      data: { isRevoked: true }
    })
    return true
  } catch (error) {
    console.error('[revokeSession Error]:', error)
    return false
  }
}

/**
 * Revoca todas las sesiones de un usuario (ej: al cambiar contraseña o compromiso de cuenta),
 * con opción de preservar la sesión actual.
 */
export async function revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
  try {
    const whereClause: any = {
      userId,
      isRevoked: false
    }

    if (exceptSessionId) {
      whereClause.id = { not: exceptSessionId }
    }

    const res = await prisma.session.updateMany({
      where: whereClause,
      data: { isRevoked: true }
    })

    return res.count
  } catch (error) {
    console.error('[revokeAllUserSessions Error]:', error)
    return 0
  }
}

/**
 * Lista todas las sesiones activas de un usuario
 */
export async function listUserSessions(userId: string) {
  return await prisma.session.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      deviceInfo: true,
      createdAt: true,
      lastActiveAt: true,
      expiresAt: true
    }
  })
}

