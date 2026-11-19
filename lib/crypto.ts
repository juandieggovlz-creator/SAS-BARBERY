/**
 * BarberOS — Módulo Criptográfico de Seguridad Máxima
 * 
 * Implementa:
 * 1. Cifrado simétrico AES-256-GCM en reposo para secretos TOTP y datos sensibles.
 * 2. Generación y validación de Códigos de Recuperación de un solo uso.
 */

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits recomendado para GCM
const AUTH_TAG_LENGTH = 16

/**
 * Deriva una clave de 32 bytes (256 bits) usando HKDF o SHA-256
 * a partir de JWT_SECRET de forma determinista y segura.
 */
function getDerivedKey(): Buffer {
  const secret = process.env.JWT_SECRET || 'barberos_fallback_key_32_bytes_len_secure'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Cifra una cadena de texto plano con AES-256-GCM.
 * Formato de retorno: ivHex:authTagHex:ciphertextHex
 */
export function encryptData(plaintext: string): string {
  const key = getDerivedKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`
}

/**
 * Descifra una cadena previamente cifrada con encryptData.
 */
export function decryptData(encryptedString: string): string {
  const parts = encryptedString.split(':')
  if (parts.length !== 3) {
    throw new Error('Formato cifrado inválido')
  }

  const [ivHex, authTagHex, ciphertextHex] = parts
  const key = getDerivedKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  let plaintext = decipher.update(ciphertextHex, 'hex', 'utf8')
  plaintext += decipher.final('utf8')

  return plaintext
}

/**
 * Descifra de forma segura un token o secreto almacenado en base de datos.
 * Si el texto está cifrado en formato AES-256-GCM (iv:authTag:ciphertext), lo descifra.
 * Si no está cifrado (legacy texto plano), lo retorna tal cual sin romper el flujo.
 */
export function safeDecryptToken(token: string | null | undefined): string | null {
  if (!token) return null
  const parts = token.split(':')
  if (parts.length === 3 && parts.every(p => /^[0-9a-fA-F]+$/.test(p))) {
    try {
      return decryptData(token)
    } catch {
      return token
    }
  }
  return token
}

/**
 * Cifra un token si aún no está cifrado. Si ya está cifrado con AES-256-GCM, lo retorna intacto.
 */
export function safeEncryptToken(token: string | null | undefined): string | null {
  if (!token) return null
  const parts = token.split(':')
  if (parts.length === 3 && parts.every(p => /^[0-9a-fA-F]+$/.test(p))) {
    return token
  }
  return encryptData(token)
}

/**
 * Genera un conjunto de códigos de recuperación criptográficamente seguros de un solo uso.
 * Retorna tanto los códigos en texto plano (para mostrárselos al usuario una única vez)
 * como sus hashes bcrypt (para almacenarlos en base de datos).
 */
export async function generateRecoveryCodes(count = 8): Promise<{
  plainCodes: string[]
  hashedCodes: string[]
}> {
  const plainCodes: string[] = []
  const hashedCodes: string[] = []

  for (let i = 0; i < count; i++) {
    // Generar 8 caracteres alfanuméricos legibles en formato XXXX-XXXX
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase()
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase()
    const code = `${p1}-${p2}`
    plainCodes.push(code)

    const hash = await bcrypt.hash(code, 10)
    hashedCodes.push(hash)
  }

  return { plainCodes, hashedCodes }
}

