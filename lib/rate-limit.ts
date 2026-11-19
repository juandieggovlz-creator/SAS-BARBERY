/**
 * BarberOS — Rate Limiting Helper
 * 
 * Implementa un limitador de frecuencia en memoria (Sliding Window / Leaky Bucket)
 * con limpieza periódica automática y extracción segura de IP.
 * Si en el futuro se conecta Upstash Redis o Redis distribuido, se puede
 * extender este módulo manteniendo la misma interfaz.
 */

import { prisma } from '@/lib/prisma'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// Almacén en memoria por clave
const memoryStore = new Map<string, RateLimitRecord>()

// Limpieza automática de registros expirados cada 5 minutos
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  for (const [key, record] of memoryStore.entries()) {
    if (record.resetTime <= now) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Obtiene la dirección IP del cliente de forma segura inspeccionando
 * cabeceras de proxies confiables (Cloudflare, Vercel, Nginx).
 */
export function getClientIp(request: Request): string {
  const headers = request.headers

  // 1. Cloudflare
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  // 2. Real-IP (Nginx / Load Balancer)
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  // 3. X-Forwarded-For (tomar la última IP externa confiable o primera si es proxy reverso)
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean)
    if (ips.length > 0) {
      return ips[0]
    }
  }

  return '127.0.0.1'
}

export interface RateLimitOptions {
  /** Número máximo de solicitudes permitidas en la ventana */
  limit: number
  /** Duración de la ventana en segundos */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetSeconds: number
}

/**
 * Verifica si una clave (IP, email, tenant) ha excedido el límite de solicitudes.
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanupExpired()

  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const record = memoryStore.get(key)

  if (!record || record.resetTime <= now) {
    // Primera petición o ventana expirada
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })

    return {
      success: true,
      remaining: options.limit - 1,
      resetSeconds: options.windowSeconds,
    }
  }

  // Si aún está dentro de la ventana
  if (record.count >= options.limit) {
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    }
  }

  record.count += 1
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000)

  return {
    success: true,
    remaining: options.limit - record.count,
    resetSeconds: Math.max(1, resetSeconds),
  }
}

/**
 * Resetea el conteo de una clave (ej: tras login exitoso)
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key)
}

/**
 * Limitador de frecuencia persistente en Neon PostgreSQL.
 * Solución compartida y sincronizada para despliegues Serverless en Vercel.
 */
export async function rateLimitDB(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date()
  const windowMs = options.windowSeconds * 1000
  const expireAt = new Date(now.getTime() + windowMs)

  try {
    const existing = await prisma.rateLimitStore.findUnique({
      where: { key }
    })

    if (!existing || existing.expireAt <= now) {
      await prisma.rateLimitStore.upsert({
        where: { key },
        create: { key, points: 1, expireAt },
        update: { points: 1, expireAt }
      })

      return {
        success: true,
        remaining: options.limit - 1,
        resetSeconds: options.windowSeconds,
      }
    }

    if (existing.points >= options.limit) {
      const resetSeconds = Math.ceil((existing.expireAt.getTime() - now.getTime()) / 1000)
      return {
        success: false,
        remaining: 0,
        resetSeconds: Math.max(1, resetSeconds),
      }
    }

    const updated = await prisma.rateLimitStore.update({
      where: { key },
      data: { points: { increment: 1 } }
    })

    const resetSeconds = Math.ceil((updated.expireAt.getTime() - now.getTime()) / 1000)

    return {
      success: true,
      remaining: Math.max(0, options.limit - updated.points),
      resetSeconds: Math.max(1, resetSeconds),
    }
  } catch (err) {
    // Si la DB tiene una contención temporal, recurrir transparentemente a memoria
    console.warn('[RateLimitDB Fallback to Memory]:', err)
    return rateLimit(key, options)
  }
}

/**
 * Resetea el conteo persistente en base de datos
 */
export async function resetRateLimitDB(key: string): Promise<void> {
  try {
    await prisma.rateLimitStore.delete({ where: { key } }).catch(() => {})
  } catch {
    // ignore
  }
  resetRateLimit(key)
}


