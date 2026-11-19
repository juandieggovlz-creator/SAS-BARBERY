/**
 * BarberOS — Step-Up Authentication (Reautenticación para Operaciones Críticas)
 * 
 * Exige confirmación de segundo factor (TOTP o contraseña) antes de permitir
 * acciones destructivas o de máxima sensibilidad.
 */

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyTotpCode } from '@/lib/totp'
import { decryptData } from '@/lib/crypto'
import bcrypt from 'bcryptjs'

const STEP_UP_MAX_AGE_MS = 15 * 60 * 1000 // 15 minutos de ventana de elevación

/**
 * Comprueba si la sesión actual cuenta con una reautenticación reciente
 */
export async function hasValidStepUpAuth(userId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const stepUpCookie = cookieStore.get('step_up_elevated_at')?.value

  if (!stepUpCookie) return false

  const timestamp = Number(stepUpCookie)
  if (isNaN(timestamp)) return false

  const elapsed = Date.now() - timestamp
  return elapsed >= 0 && elapsed <= STEP_UP_MAX_AGE_MS
}

/**
 * Valida un código TOTP o contraseña en tiempo real para autorizar una acción crítica
 */
export async function verifyCriticalActionAuth(
  userId: string,
  authSecret: string // TOTP de 6 dígitos o contraseña actual
): Promise<{ verified: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user || !user.isActive) {
    return { verified: false, error: 'Usuario no encontrado o inactivo' }
  }

  const clean = authSecret.trim()

  // 1. Si son 6 dígitos y el usuario tiene TOTP configurado
  if (/^\d{6}$/.test(clean) && user.mfaSecret) {
    try {
      const secretBase32 = decryptData(user.mfaSecret)
      const totpCheck = verifyTotpCode(secretBase32, clean, 1)
      if (totpCheck.valid) {
        return { verified: true }
      }
    } catch {
      // fallback a contraseña
    }
  }

  // 2. Si no es TOTP o falló, comprobar si coincide con la contraseña
  if (user.password) {
    const isPassMatch = await bcrypt.compare(clean, user.password)
    if (isPassMatch) {
      return { verified: true }
    }
  }

  return { verified: false, error: 'Código de seguridad o contraseña incorrecta para autorizar esta acción crítica.' }
}

