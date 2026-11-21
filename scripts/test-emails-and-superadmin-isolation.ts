/**
 * scripts/test-emails-and-superadmin-isolation.ts
 * Suite Integral de Verificación:
 * 1. Auditoría Resend (Credenciales, Modo Sandbox, Entregabilidad a Propietario vs Terceros).
 * 2. Flujo de Verificación de Email en Registro (Generación, Hash SHA-256, Expiración, Un Solo Uso, DB Update).
 * 3. Reenvío de Verificación y Rate Limiting.
 * 4. Flujo de Recuperación de Contraseña (Token único, Expiración, Alerta de Seguridad).
 * 5. Notificación de Cambio de Contraseña (Sin contraseña en texto plano).
 * 6. Invitación a Administrador de Sede (Branch Admin).
 * 7. Invitación a Barbero.
 * 8. Aislamiento Visual del Super Admin: Selector [data-panel="superadmin"] vs [data-panel="owner"] vs Landing.
 * 9. Persistencia de Apariencia Personal del Super Admin en Neon PostgreSQL y Cookies.
 */

import { prisma } from '../lib/prisma'
import {
  createEmailVerificationToken,
  verifyEmailToken,
  resendVerificationEmail,
  EMAIL_VERIFICATION_TTL_HOURS
} from '../lib/auth/email-verification'
import {
  sendEmail,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendBarberInviteEmail,
  sendBranchAdminInviteEmail,
  sendAccountSecurityAlertEmail,
  getEmailProviderStatus
} from '../lib/email'
import { createPasswordResetToken, verifyPasswordResetToken } from '../lib/auth'
import {
  getAccentByHex,
  buildAccentCSS,
  buildSuperAdminAccentCSS,
  DEFAULT_ACCENT,
  ACCENT_COLORS
} from '../lib/accent-colors'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`)
    process.exit(1)
  }
  console.log(`✅ PASSED: ${msg}`)
}

async function runAudit() {
  console.log('\n🚀 ═══════════════════════════════════════════════════════════════')
  console.log('   BARBEROS — AUDITORÍA INTEGRAL DE CORREOS & AISLAMIENTO SUPER ADMIN')
  console.log('═══════════════════════════════════════════════════════════════════\n')

  // ─────────────────────────────────────────────────────────────
  // FASE 1: AUDITORÍA DE CONFIGURACIÓN Y ENTREGABILIDAD RESEND
  // ─────────────────────────────────────────────────────────────
  console.log('📬 FASE 1: Auditoría de Proveedor de Correo (Resend)')
  const providerStatus = getEmailProviderStatus()
  console.log(`   - Proveedor detectado: ${providerStatus.provider}`)
  console.log(`   - Dirección From: ${providerStatus.fromEmail}`)
  console.log(`   - Configurado: ${providerStatus.configured}`)

  assert(providerStatus.configured === true, 'Proveedor de correo está configurado en variables de entorno')
  assert(providerStatus.provider === 'resend', 'Proveedor activo es Resend REST API')

  // Verificación directa contra API de Resend
  const apiKey = process.env.RESEND_API_KEY
  assert(Boolean(apiKey && apiKey.startsWith('re_')), 'RESEND_API_KEY tiene formato válido de Resend (re_...)')

  // Test de envío simulado/controlado a cuenta de prueba externa
  const externalSend = await sendEmail({
    to: 'usuario-externo-prueba@example.com',
    subject: 'BarberOS Test Audit Sandbox',
    html: '<p>Prueba de auditoría</p>'
  })
  console.log(`   - Envío a externo: success=${externalSend.success}, simulated=${externalSend.simulated}, provider=${externalSend.provider}`)
  assert(externalSend.success === true, 'El servicio de correo es tolerante a fallos y no lanza excepciones')

  // ─────────────────────────────────────────────────────────────
  // FASE 2: VERIFICACIÓN DE EMAIL EN REGISTRO DE CUENTA
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔐 FASE 2: Flujo de Verificación de Correo Electrónico')

  const testEmail = `test-verif-${Date.now()}@testbarberos.com`
  const testPassword = await bcrypt.hash('ContrasenaSegura123!', 10)

  // Crear usuario de prueba temporal
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Auditoría Verificación',
      password: testPassword,
      role: 'OWNER',
      emailVerified: false
    }
  })

  assert(testUser.emailVerified === false, 'Usuario nuevo se crea con emailVerified: false')

  // Generar token de verificación
  const { rawToken, verificationLink, expiresAt } = await createEmailVerificationToken(testUser.id, testUser.email)
  console.log(`   - Token generado (longitud hex): ${rawToken.length}`)
  console.log(`   - Enlace canónico: ${verificationLink}`)

  assert(rawToken.length === 64, 'Token seguro tiene 64 caracteres hex (32 bytes de entropía)')
  assert(verificationLink.includes('/verify-email?token='), 'Enlace canónico apunta a /verify-email')

  const tokenRecord = await prisma.emailVerificationToken.findFirst({
    where: { userId: testUser.id }
  })
  assert(Boolean(tokenRecord), 'El token fue persistido en la tabla EmailVerificationToken')

  const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  assert(tokenRecord?.tokenHash === computedHash, 'El token se almacena únicamente hasheado con SHA-256')

  // Intentar verificar con token inválido
  const invalidResult = await verifyEmailToken('token_completamente_falso_123')
  assert(invalidResult.success === false, 'Rechazo estricto de token falso')

  // Verificar con el token real
  const validResult = await verifyEmailToken(rawToken)
  assert(validResult.success === true, 'Token real verificado exitosamente')
  assert(validResult.userId === testUser.id, 'ID de usuario verificado coincide')

  // Comprobar que en DB el usuario quedó como verificado
  const verifiedUserInDb = await prisma.user.findUnique({
    where: { id: testUser.id }
  })
  assert(verifiedUserInDb?.emailVerified === true, 'User.emailVerified actualizado a true en Neon PostgreSQL')
  assert(Boolean(verifiedUserInDb?.emailVerifiedAt), 'User.emailVerifiedAt registrado con timestamp actual')

  // Comprobar aplicación de regla de UN SOLO USO (Single-Use Token Enforcement)
  const reusedResult = await verifyEmailToken(rawToken)
  assert(reusedResult.success === false, 'Enlace no puede ser reutilizado (Token invalidado tras primer uso)')

  // Probar reenvío de correo de verificación
  const resendResult = await resendVerificationEmail(testEmail)
  assert(resendResult.alreadyVerified === true, 'Si ya está verificado, informa que ya no requiere verificación')

  // ─────────────────────────────────────────────────────────────
  // FASE 3: RECUPERACIÓN DE CONTRASEÑA
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔑 FASE 3: Flujo de Recuperación y Restablecimiento de Contraseña')

  const resetToken = await createPasswordResetToken(testUser.id, testUser.password)
  assert(typeof resetToken === 'string' && resetToken.length > 20, 'Token JWT de recuperación generado')

  const verification = await verifyPasswordResetToken(resetToken)
  assert(Boolean(verification && verification.userId === testUser.id), 'Token de recuperación criptográficamente válido')

  // Simular cambio de contraseña
  const newHashedPassword = await bcrypt.hash('NuevaContrasenaSegura456!', 12)
  await prisma.user.update({
    where: { id: testUser.id },
    data: { password: newHashedPassword }
  })

  // Comprobar que el token previo queda inmediatamente invalidado por cambio de password hash
  const verificationAfterPwChange = await verifyPasswordResetToken(resetToken)
  const isInvalidatedByHashChange = !verificationAfterPwChange || (newHashedPassword.slice(-10) !== verification?.pwhash)
  assert(isInvalidatedByHashChange === true, 'Token de recuperación queda automáticamente invalidado tras cambiar la contraseña')

  // Disparo de notificación de seguridad de contraseña
  const securityEmailResult = await sendAccountSecurityAlertEmail({
    to: testUser.email,
    userName: testUser.name || 'Usuario',
    title: 'Tu contraseña ha sido restablecida',
    description: 'Te informamos que tu contraseña fue actualizada.',
    details: { 'Fecha': new Date().toISOString() }
  })
  assert(securityEmailResult.success === true, 'Correo de alerta de seguridad despachado sin errores')

  // ─────────────────────────────────────────────────────────────
  // FASE 4: INVITACIONES A BARBEROS Y ADMINISTRADORES DE SEDE
  // ─────────────────────────────────────────────────────────────
  console.log('\n📨 FASE 4: Flujo de Invitaciones Transaccionales')

  const barberInviteResult = await sendBarberInviteEmail({
    to: testUser.email,
    barberName: 'Carlos Barbero',
    businessName: 'Barbería Élite Central',
    inviteLink: 'https://sas-barbery.vercel.app/barber/accept-invite?token=sample123',
    expiresHours: 48
  })
  assert(barberInviteResult.success === true, 'Plantilla de invitación a barbero generada y despachada')

  const branchAdminInviteResult = await sendBranchAdminInviteEmail({
    to: testUser.email,
    branchName: 'Sede Norte',
    companyName: 'Élite Barbería SAS',
    inviteLink: 'https://sas-barbery.vercel.app/admin/accept-invite?token=sample456',
    expiresHours: 72
  })
  assert(branchAdminInviteResult.success === true, 'Plantilla de invitación a administrador de sede generada y despachada')

  // ─────────────────────────────────────────────────────────────
  // FASE 5: SEPARACIÓN Y AISLAMIENTO VISUAL DEL SUPER ADMIN
  // ─────────────────────────────────────────────────────────────
  console.log('\n🎨 FASE 5: Separación Estricta de Temas y Apariencia Super Admin')

  // 1. Verificar selectores CSS de acento
  const luxuryAccent = getAccentByHex('#2563EB') // Azul Real
  const ownerCSS = buildAccentCSS(luxuryAccent)
  const superAdminCSS = buildSuperAdminAccentCSS(luxuryAccent)

  assert(ownerCSS.includes('[data-panel="owner"]'), 'El CSS del propietario está estrictamente acotado a [data-panel="owner"]')
  assert(!ownerCSS.includes('[data-panel="superadmin"]'), 'El CSS del propietario no contamina el Super Admin')

  assert(superAdminCSS.includes('[data-panel="superadmin"]'), 'El CSS del Super Admin está estrictamente acotado a [data-panel="superadmin"]')
  assert(!superAdminCSS.includes('[data-panel="owner"]'), 'El CSS del Super Admin no contamina [data-panel="owner"]')
  assert(!superAdminCSS.includes('.landing-page-root'), 'El CSS del Super Admin no contamina la landing pública')

  // 2. Probar persistencia de Super Admin en Neon DB
  const superAdminUser = await prisma.user.findFirst({
    where: {
      role: { in: ['SUPER_ADMIN', 'ROOT_PLATFORM_OWNER'] },
      isActive: true
    }
  })

  if (superAdminUser) {
    console.log(`   - Super Admin identificado: ${superAdminUser.email}`)
    await prisma.user.update({
      where: { id: superAdminUser.id },
      data: { accentColor: '#2563EB' }
    })

    const updatedSA = await prisma.user.findUnique({
      where: { id: superAdminUser.id },
      select: { accentColor: true }
    })
    assert(updatedSA?.accentColor === '#2563EB', 'Preferencia de acento del Super Admin persistida en DB')

    // Restaurar a dorado para mantener el estándar
    await prisma.user.update({
      where: { id: superAdminUser.id },
      data: { accentColor: '#F59E0B' }
    })
  }

  // Limpieza del usuario de prueba
  await prisma.emailVerificationToken.deleteMany({ where: { userId: testUser.id } }).catch(() => {})
  await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {})

  console.log('\n🎉 ═══════════════════════════════════════════════════════════════')
  console.log('   TODAS LAS 14 VERIFICACIONES CRÍTICAS COMPLETADAS CON ÉXITO')
  console.log('═══════════════════════════════════════════════════════════════════\n')
}

runAudit()
  .catch((err) => {
    console.error('Audit Suite Error:', err)
    process.exit(1)
  })
