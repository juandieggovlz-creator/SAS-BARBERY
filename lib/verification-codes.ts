/**
 * lib/verification-codes.ts
 * Generación y validación segura de códigos OTP de un solo uso (Single-Use OTP)
 * para operaciones críticas (Cambio de contraseña, Confirmación de correo, etc.)
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const CODE_EXPIRATION_MS = 10 * 60 * 1000 // 10 minutos
const MAX_ATTEMPTS = 5

function hashOtpCode(code: string, salt: string): string {
  return crypto.createHash('sha256').update(`${code}:${salt}`).digest('hex')
}

/**
 * Genera un código OTP de 6 dígitos numéricos, lo almacena de forma segura
 * (hasheado con SHA-256) y retorna el código en texto plano para ser enviado por correo.
 */
export async function generateOtpCode(userId: string, purpose: string): Promise<string> {
  // Generar número de 6 dígitos con generador de números aleatorios seguro
  const plainCode = crypto.randomInt(100000, 999999).toString()
  const salt = crypto.randomBytes(16).toString('hex')
  const hashedCode = hashOtpCode(plainCode, salt)
  const now = new Date()
  const expireAt = new Date(now.getTime() + CODE_EXPIRATION_MS)

  const key = `otp:${purpose}:${userId}`
  const valuePayload = JSON.stringify({
    hash: hashedCode,
    salt,
    attempts: 0,
    created: now.getTime()
  })

  // Almacenar en rateLimitStore o actualizar existente
  await prisma.rateLimitStore.upsert({
    where: { key },
    create: {
      key,
      points: 0,
      expireAt
    },
    update: {
      points: 0,
      expireAt
    }
  })

  // Guardar metadata en memoria / DB auxiliar o clave específica
  const metaKey = `otp_meta:${purpose}:${userId}`
  await prisma.rateLimitStore.upsert({
    where: { key: metaKey },
    create: {
      key: metaKey,
      points: 1,
      expireAt
    },
    update: {
      points: 1,
      expireAt
    }
  })

  // Usamos una clave combinada persistente en rateLimitStore
  // Para evitar guardar el código en texto plano, guardamos el hash codificado en points o un registro seguro
  // En rateLimitStore: key = `otp_hash:${purpose}:${userId}:${hashedCode}`
  await prisma.rateLimitStore.upsert({
    where: { key: `otp_hash:${purpose}:${userId}:${hashedCode}` },
    create: {
      key: `otp_hash:${purpose}:${userId}:${hashedCode}`,
      points: 1,
      expireAt
    },
    update: {
      points: 1,
      expireAt
    }
  })

  // Guardamos la sal asociada para poder recalcular el hash
  await prisma.rateLimitStore.upsert({
    where: { key: `otp_salt:${purpose}:${userId}` },
    create: {
      key: `otp_salt:${purpose}:${userId}:${salt}`,
      points: 1,
      expireAt
    },
    update: {
      expireAt
    }
  }).catch(() => {})

  return plainCode
}

/**
 * Valida un código OTP de 6 dígitos.
 * Si es válido, lo invalida de inmediato (de un solo uso).
 */
export async function verifyOtpCode(
  userId: string,
  purpose: string,
  inputCode: string
): Promise<{ valid: boolean; error?: string }> {
  if (!inputCode || typeof inputCode !== 'string' || inputCode.trim().length !== 6) {
    return { valid: false, error: 'El código de verificación debe ser de 6 dígitos' }
  }

  const clean = inputCode.trim()
  const now = new Date()

  // Buscar sales activas no expiradas para este usuario y propósito
  const saltPrefix = `otp_salt:${purpose}:${userId}:`
  const activeSalts = await prisma.rateLimitStore.findMany({
    where: {
      key: { startsWith: saltPrefix },
      expireAt: { gt: now }
    }
  })

  if (activeSalts.length === 0) {
    return { valid: false, error: 'El código ha expirado o no ha sido solicitado. Solicita uno nuevo.' }
  }

  // Verificar si alguno de los hashes coincide
  for (const saltRecord of activeSalts) {
    const salt = saltRecord.key.replace(saltPrefix, '')
    const testHash = hashOtpCode(clean, salt)
    const hashKey = `otp_hash:${purpose}:${userId}:${testHash}`

    const found = await prisma.rateLimitStore.findUnique({
      where: { key: hashKey }
    })

    if (found && found.expireAt > now) {
      // Código válido: INVALIDAR DE INMEDIATO (Un solo uso)
      await prisma.rateLimitStore.deleteMany({
        where: {
          key: {
            in: [
              hashKey,
              saltRecord.key,
              `otp:${purpose}:${userId}`,
              `otp_meta:${purpose}:${userId}`
            ]
          }
        }
      }).catch(() => {})

      return { valid: true }
    }
  }

  return { valid: false, error: 'Código de verificación incorrecto o expirado' }
}
