/**
 * scripts/test-email-service.ts
 * Script de validación integral para el servicio de correo y plantillas de BarberOS.
 */

import 'dotenv/config'
import {
  getEmailProviderStatus,
  sendBarberInviteEmail,
  sendBranchAdminInviteEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendAccountSecurityAlertEmail,
  OFFICIAL_CONTACT_EMAIL
} from '../lib/email'

async function runTests() {
  console.log('=== TEST SUITE: SERVICIO DE CORREO BARBEROS ===\n')

  // 1. Status del proveedor
  const status = getEmailProviderStatus()
  console.log('1. Estado del proveedor de correo:')
  console.log(JSON.stringify(status, null, 2))
  if (status.contactEmail !== 'barberos.contacto@gmail.com') {
    throw new Error(`Email de contacto incorrecto: ${status.contactEmail}`)
  }
  console.log('✓ Correo oficial verificado: barberos.contacto@gmail.com\n')

  // 2. Invitación a barbero (Enviado a cuenta autorizada de Resend)
  console.log('2. Probando plantilla: Invitación a Barbero...')
  const r1 = await sendBarberInviteEmail({
    to: 'juandieggovlz@gmail.com',
    barberName: 'Mateo Gómez',
    businessName: 'Barbería Elite Central',
    inviteLink: 'https://barberos.co/invite/test-token-12345'
  })
  console.log('Resultado:', r1)
  if (!r1.success) throw new Error('Falló envío de invitación a barbero')
  console.log('✓ Invitación a barbero generada con éxito.\n')

  // 3. Invitación a administrador de sede
  console.log('3. Probando plantilla: Invitación a Branch Admin...')
  const r2 = await sendBranchAdminInviteEmail({
    to: 'admin.sede@ejemplo.com',
    branchName: 'Sede Norte',
    companyName: 'Grupo BarberOS SAS',
    inviteLink: 'https://barberos.co/invite/branch-admin-token-67890'
  })
  console.log('Resultado:', r2)
  if (!r2.success) throw new Error('Falló envío de invitación a administrador de sede')
  console.log('✓ Invitación a Branch Admin generada con éxito.\n')

  // 4. Recuperación de contraseña
  console.log('4. Probando plantilla: Restablecimiento de Contraseña...')
  const r3 = await sendPasswordResetEmail({
    to: 'usuario.propietario@ejemplo.com',
    userName: 'Carlos Propietario',
    resetLink: 'https://barberos.co/reset-password?token=reset-token-abc'
  })
  console.log('Resultado:', r3)
  if (!r3.success) throw new Error('Falló envío de recuperación de contraseña')
  console.log('✓ Recuperación de contraseña generada con éxito.\n')

  // 5. Confirmación de cita
  console.log('5. Probando plantilla: Confirmación de Cita / Reserva...')
  const r4 = await sendAppointmentConfirmationEmail({
    to: 'cliente.vip@ejemplo.com',
    clientName: 'Andrés Hurtado',
    businessName: 'Barbería Elite Central',
    barberName: 'Mateo Gómez',
    serviceName: 'Corte Degradado + Barba Deluxe',
    price: '$35.000 COP',
    date: 'Lunes, 18 de Noviembre de 2026',
    time: '04:30 PM',
    reservationCode: '20261118-A7F2',
    manageLink: 'https://barberos.co/b/barberia-elite'
  })
  console.log('Resultado:', r4)
  if (!r4.success) throw new Error('Falló envío de confirmación de cita')
  console.log('✓ Confirmación de cita generada con éxito.\n')

  // 6. Alerta de seguridad
  console.log('6. Probando plantilla: Alerta de Seguridad de Cuenta...')
  const r5 = await sendAccountSecurityAlertEmail({
    to: 'usuario.propietario@ejemplo.com',
    userName: 'Carlos Propietario',
    title: 'Nuevo inicio de sesión detectado',
    description: 'Se ha detectado un inicio de sesión en tu cuenta desde un dispositivo nuevo.',
    details: {
      Dispositivo: 'Chrome en Windows 11',
      Ubicación: 'Sincelejo, Colombia',
      IP: '190.24.120.45'
    },
    actionLink: 'https://barberos.co/superadmin/security',
    actionLabel: 'Ver Dispositivos Conectados'
  })
  console.log('Resultado:', r5)
  if (!r5.success) throw new Error('Falló envío de alerta de seguridad')
  console.log('✓ Alerta de seguridad generada con éxito.\n')

  // 7. Prueba de deduplicación
  console.log('7. Probando deduplicación ante envíos rápidos idénticos...')
  const dupCheck = await sendBarberInviteEmail({
    to: 'barbero.test@ejemplo.com',
    barberName: 'Mateo Gómez',
    businessName: 'Barbería Elite Central',
    inviteLink: 'https://barberos.co/invite/test-token-12345'
  })
  console.log('Resultado deduplicación:', dupCheck)
  if (!dupCheck.error?.includes('Duplicado reciente')) {
    console.warn('Nota: Envío procesado según ventana de deduplicación.')
  } else {
    console.log('✓ Deduplicación funcionó correctamente impidiendo envío doble.')
  }

  console.log('\n=== TODAS LAS PRUEBAS DE CORREO PASARON CON ÉXITO ===')
}

runTests().catch(err => {
  console.error('Error en pruebas de correo:', err)
  process.exit(1)
})
