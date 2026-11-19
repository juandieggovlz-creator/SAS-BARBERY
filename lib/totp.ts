/**
 * BarberOS — Motor TOTP (RFC 6238 / RFC 4226)
 * 
 * Implementación criptográfica pura, compatible con Google Authenticator,
 * Microsoft Authenticator, 1Password, Authy y Bitwarden.
 * 
 * Parámetros estándar:
 * - Algoritmo: HMAC-SHA1
 * - Dígitos: 6
 * - Intervalo (Period): 30 segundos
 */

import crypto from 'crypto'
import QRCode from 'qrcode'

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Codifica un buffer de bytes a formato Base32
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31]
  }

  return output
}

/**
 * Decodifica una cadena Base32 a Buffer
 */
export function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i])
    if (idx === -1) {
      throw new Error(`Carácter Base32 no válido: ${clean[i]}`)
    }

    value = (value << 5) | idx
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

/**
 * Genera un secreto aleatorio Base32 de 20 bytes (160 bits, estándar recomendado por RFC 4226)
 */
export function generateTotpSecret(bytes = 20): string {
  const buffer = crypto.randomBytes(bytes)
  return base32Encode(buffer)
}

/**
 * Genera el código numérico TOTP de 6 dígitos para un contador o timestamp dado
 */
export function generateTotpCode(secretBase32: string, counterOffset = 0): string {
  const key = base32Decode(secretBase32)
  const currentStep = Math.floor(Date.now() / 1000 / 30) + counterOffset

  // Buffer de 8 bytes para el contador (Big Endian)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(currentStep), 0)

  const hmac = crypto.createHmac('sha1', key)
  hmac.update(counterBuffer)
  const digest = hmac.digest()

  // Truncamiento dinámico (Dynamic Truncation - RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  const otp = binary % 1000000
  return otp.toString().padStart(6, '0')
}

/**
 * Valida un código TOTP ingresado por el usuario.
 * @param secretBase32 Secreto Base32 del usuario
 * @param token Código de 6 dígitos ingresado
 * @param window Ventana de tolerancia en pasos de 30s (+-1 permite +-30s para compensar desincronización de reloj)
 * @returns { valid: boolean, matchedStep: number | null }
 */
export function verifyTotpCode(
  secretBase32: string,
  token: string,
  window = 1
): { valid: boolean; matchedStep: number | null } {
  if (!token || typeof token !== 'string') return { valid: false, matchedStep: null }
  const cleanToken = token.trim().replace(/\s+/g, '')
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return { valid: false, matchedStep: null }
  }

  const currentStep = Math.floor(Date.now() / 1000 / 30)

  for (let offset = -window; offset <= window; offset++) {
    const candidate = generateTotpCode(secretBase32, offset)
    if (candidate === cleanToken) {
      return { valid: true, matchedStep: currentStep + offset }
    }
  }

  return { valid: false, matchedStep: null }
}

/**
 * Genera el URI estándar otpauth:// para escaneo en aplicaciones de autenticación
 */
export function getTotpUri(issuer: string, accountEmail: string, secretBase32: string): string {
  const cleanIssuer = encodeURIComponent(issuer.trim())
  const cleanAccount = encodeURIComponent(accountEmail.trim().toLowerCase())
  return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${secretBase32}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`
}

/**
 * Genera una imagen QR en formato Data URL para mostrar en el modal de enrolamiento
 */
export async function generateTotpQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 260,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}

