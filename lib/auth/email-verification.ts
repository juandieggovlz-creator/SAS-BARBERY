import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCanonicalAppUrl } from '@/lib/url'
import { recordAuditLog } from '@/lib/audit'
import { sendEmailVerificationEmail } from '@/lib/email'

export const EMAIL_VERIFICATION_TTL_HOURS = 24

/**
 * Genera un token criptográfico seguro de 32 bytes para verificación de correo,
 * almacena únicamente su hash SHA-256 en la base de datos (prevención de fugas en reposo)
 * y retorna el enlace canónico de verificación.
 */
export async function createEmailVerificationToken(
  userId: string,
  email: string
): Promise<{ rawToken: string; verificationLink: string; expiresAt: Date }> {
  const cleanEmail = email.trim().toLowerCase()
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000)

  // Invalidar cualquier token previo pendiente para este usuario/correo
  await prisma.emailVerificationToken.deleteMany({
    where: {
      OR: [
        { userId },
        { email: cleanEmail }
      ]
    }
  }).catch(() => {})

  // Crear nuevo token
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      email: cleanEmail,
      tokenHash,
      expiresAt
    }
  })

  const baseUrl = getCanonicalAppUrl()
  const verificationLink = `${baseUrl}/verify-email?token=${rawToken}`

  return {
    rawToken,
    verificationLink,
    expiresAt
  }
}

/**
 * Valida un token de verificación de correo electrónico.
 * Garantiza un solo uso: si es válido, actualiza el usuario y purga el token inmediatamente.
 */
export async function verifyEmailToken(
  rawToken: string
): Promise<{
  success: boolean
  userId?: string
  email?: string
  error?: string
}> {
  if (!rawToken || typeof rawToken !== 'string') {
    return { success: false, error: 'Token no especificado o inválido' }
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex')

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  })

  if (!record) {
    return {
      success: false,
      error: 'El enlace de verificación no es válido o ya fue utilizado.'
    }
  }

  if (new Date() > record.expiresAt) {
    // Limpieza de token expirado
    await prisma.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => {})
    return {
      success: false,
      error: 'El enlace de verificación ha expirado (vigencia de 24 horas). Por favor solicita uno nuevo.'
    }
  }

  // Actualizar usuario: marcar correo verificado
  const updatedUser = await prisma.user.update({
    where: { id: record.userId },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  })

  // Invalidar/eliminar todos los tokens pendientes de este usuario
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: record.userId }
  }).catch(() => {})

  // Registrar auditoría de seguridad
  await recordAuditLog({
    userId: updatedUser.id,
    userRole: updatedUser.role,
    action: 'EMAIL_VERIFIED',
    entity: 'User',
    entityId: updatedUser.id,
    details: {
      email: updatedUser.email,
      verifiedAt: new Date().toISOString()
    }
  })

  return {
    success: true,
    userId: updatedUser.id,
    email: updatedUser.email
  }
}

/**
 * Reenvía el correo de verificación para una cuenta que aún no ha confirmado su email.
 */
export async function resendVerificationEmail(
  email: string
): Promise<{
  success: boolean
  message: string
  alreadyVerified?: boolean
  error?: string
}> {
  const cleanEmail = email.trim().toLowerCase()

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: cleanEmail,
        mode: 'insensitive'
      }
    }
  })

  if (!user) {
    // Respuesta ambigua para prevenir enumeración de usuarios
    return {
      success: true,
      message: 'Si la cuenta existe y está pendiente de verificación, hemos enviado un nuevo enlace.'
    }
  }

  if (user.emailVerified) {
    return {
      success: true,
      alreadyVerified: true,
      message: 'Tu dirección de correo electrónico ya está verificada.'
    }
  }

  const { verificationLink } = await createEmailVerificationToken(user.id, user.email)

  // Enviar correo mediante el servicio centralizado (Resend)
  await sendEmailVerificationEmail({
    to: user.email,
    userName: user.name || 'Propietario',
    verificationLink,
    expiresHours: EMAIL_VERIFICATION_TTL_HOURS
  }).catch((err) => {
    console.warn('[Resend Verification Warning]:', err)
  })

  return {
    success: true,
    message: 'Hemos enviado un nuevo enlace de verificación a tu correo.'
  }
}
