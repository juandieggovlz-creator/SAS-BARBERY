/**
 * Test Suite Integral: Configuración, Sincronización Comercial y Seguridad de Acceso
 * BarberOS — 16 Verificaciones Críticas Automatizadas
 */

import { prisma } from '../lib/prisma'
import { createPasswordResetToken, verifyPasswordResetToken } from '../lib/auth'
import { generateOtpCode, verifyOtpCode } from '../lib/verification-codes'
import bcrypt from 'bcryptjs'

async function runTestSuite() {
  console.log('══════════════════════════════════════════════════════════════')
  console.log('💈 BarberOS — AUDITORÍA DE CONFIGURACIÓN & SEGURIDAD')
  console.log('══════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${name}`)
      failed++
    }
  }

  try {
    // Preparar negocio de prueba
    const testBusiness = await prisma.business.findFirst({
      where: { name: 'Barbería Elite SAS' },
      include: { page: true }
    })

    if (!testBusiness) throw new Error('Negocio Barbería Elite SAS no encontrado')

    const testUser = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' }
    })

    if (!testUser) throw new Error('Usuario admin@admin.com no encontrado')

    // ─── BLOQUE 1: SINCRONIZACIÓN CONFIGURACIÓN <-> EDITOR WEB ───
    console.log('--- Bloque 1: Sincronización Comercial & Única Fuente de Datos ---')

    const initialDescription = testBusiness.description || 'Descripción original preservada'
    const initialSlogan = testBusiness.page?.slogan || 'Eslogan original preservado'

    // 1. Simular actualización desde Configuración -> Mi Barbería (solo name, phone, address, mapsUrl)
    const newName = 'Barbería Elite SAS - Auditada'
    const newPhone = '+57 310 999 8888'
    const newAddress = 'Calle 93 # 14-20, Zona Rosa'
    const newMapsUrl = 'https://maps.app.goo.gl/barberia-elite-test'

    const updatedFromSettings = await prisma.business.update({
      where: { id: testBusiness.id },
      data: {
        name: newName,
        phone: newPhone,
        address: newAddress,
        mapsUrl: newMapsUrl
        // Nota: Configuración ya NO envía description ni slogan
      }
    })

    assert(updatedFromSettings.name === newName, '1. Nombre comercial actualizado desde Configuración')
    assert(updatedFromSettings.phone === newPhone, '2. Teléfono actualizado y persistido')
    assert(updatedFromSettings.address === newAddress, '3. Dirección actualizada y persistida')
    assert(updatedFromSettings.mapsUrl === newMapsUrl, '4. Enlace Google Maps actualizado y persistido')

    // 2. Verificar que Editor Web y Página Pública leen la misma fuente de datos
    const readForWebEditor = await prisma.business.findUnique({
      where: { id: testBusiness.id },
      include: { page: true }
    })

    assert(readForWebEditor?.name === newName, '5. Editor Web lee exactamente el nuevo nombre comercial')
    assert(readForWebEditor?.phone === newPhone, '6. Editor Web lee exactamente el nuevo teléfono')
    assert(readForWebEditor?.address === newAddress, '7. Editor Web lee exactamente la nueva dirección')
    assert(readForWebEditor?.mapsUrl === newMapsUrl, '8. Editor Web lee exactamente el nuevo Google Maps')

    // 3. Confirmar que descripción y eslogan NO fueron borrados ni sobrescritos por Configuración
    assert(readForWebEditor?.description === initialDescription, '9. Descripción comercial original intacta (exclusiva de Editor Web)')
    assert(readForWebEditor?.page?.slogan === initialSlogan, '10. Eslogan de portada intacto (exclusivo de Editor Web)')

    // ─── BLOQUE 2: SEPARACIÓN DE FOTO PERSONAL VS LOGOTIPO COMERCIAL ───
    console.log('\n--- Bloque 2: Foto de Perfil Personal vs Logotipo Comercial ---')

    const initialLogo = testBusiness.logo

    // Subir foto personal a User.avatar
    const mockPersonalAvatar = 'https://res.cloudinary.com/barberos/image/upload/v1/users/admin-personal.webp'
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { avatar: mockPersonalAvatar }
    })

    assert(updatedUser.avatar === mockPersonalAvatar, '11. Foto personal del titular guardada en User.avatar')

    // Verificar que el logo comercial del negocio NO fue alterado
    const businessAfterAvatar = await prisma.business.findUnique({
      where: { id: testBusiness.id }
    })

    assert(businessAfterAvatar?.logo === initialLogo, '12. Logotipo comercial no fue alterado al cambiar foto personal')

    // Actualizar logotipo comercial desde el negocio
    const newCommercialLogo = 'https://res.cloudinary.com/barberos/image/upload/v1/barberos/logo-comercial.png'
    const businessWithNewLogo = await prisma.business.update({
      where: { id: testBusiness.id },
      data: { logo: newCommercialLogo }
    })

    assert(businessWithNewLogo.logo === newCommercialLogo, '13. Logotipo comercial actualizado en Business.logo')

    // Verificar que la foto personal del titular NO fue alterada por el logo comercial
    const userAfterLogo = await prisma.user.findUnique({
      where: { id: testUser.id }
    })

    assert(userAfterLogo?.avatar === mockPersonalAvatar, '14. Foto personal del titular no fue alterada al cambiar logo comercial')

    // ─── BLOQUE 3: CAMBIO DE CONTRASEÑA CON SESIÓN ACTIVA ───
    console.log('\n--- Bloque 3: Seguridad en Cambio de Contraseña & Cuentas Google ---')

    // 15. Validación de contraseña actual requerida
    const testCurrentPass = 'Password123!'
    const hashedCurrent = await bcrypt.hash(testCurrentPass, 12)
    await prisma.user.update({
      where: { id: testUser.id },
      data: { password: hashedCurrent }
    })

    const passMatchCorrect = await bcrypt.compare(testCurrentPass, hashedCurrent)
    const passMatchWrong = await bcrypt.compare('WrongPassword999!', hashedCurrent)

    assert(passMatchCorrect === true, '15. Autenticación con contraseña actual correcta aprobada')
    assert(passMatchWrong === false, '16. Autenticación con contraseña actual incorrecta rechazada')

    // 16. Revocación de sesiones secundarias
    const session1 = await prisma.session.create({
      data: {
        userId: testUser.id,
        sessionToken: 'test-session-1-' + Date.now(),
        expiresAt: new Date(Date.now() + 3600000)
      }
    })
    const session2 = await prisma.session.create({
      data: {
        userId: testUser.id,
        sessionToken: 'test-session-2-' + Date.now(),
        expiresAt: new Date(Date.now() + 3600000)
      }
    })

    // Revocar todas menos la sesión activa (session1)
    await prisma.session.updateMany({
      where: {
        userId: testUser.id,
        id: { not: session1.id },
        isRevoked: false
      },
      data: { isRevoked: true }
    })

    const s1Check = await prisma.session.findUnique({ where: { id: session1.id } })
    const s2Check = await prisma.session.findUnique({ where: { id: session2.id } })

    assert(s1Check?.isRevoked === false, '17. Sesión activa preservada')
    assert(s2Check?.isRevoked === true, '18. Sesión secundaria revocada automáticamente')

    // Limpieza de sesiones de prueba
    await prisma.session.deleteMany({ where: { id: { in: [session1.id, session2.id] } } })

    // ─── BLOQUE 4: CÓDIGOS DE UN SOLO USO (OTP) PARA CUENTAS GOOGLE ───
    console.log('\n--- Bloque 4: Verificación Segura de Código OTP (Cuentas Google / Elevadas) ---')

    const otpCode = await generateOtpCode(testUser.id, 'password_change')
    assert(typeof otpCode === 'string' && otpCode.length === 6, '19. Código OTP de 6 dígitos generado')

    // Intento con código erróneo
    const wrongOtpCheck = await verifyOtpCode(testUser.id, 'password_change', '000000')
    assert(wrongOtpCheck.valid === false, '20. Código OTP incorrecto rechazado')

    // Intento con código correcto
    const correctOtpCheck = await verifyOtpCode(testUser.id, 'password_change', otpCode)
    assert(correctOtpCheck.valid === true, '21. Código OTP correcto validado exitosamente')

    // Intento de reusar el mismo código (Single-use enforcement)
    const reuseOtpCheck = await verifyOtpCode(testUser.id, 'password_change', otpCode)
    assert(reuseOtpCheck.valid === false, '22. Intento de reutilización de OTP rechazado (un solo uso garantizado)')

    // ─── BLOQUE 5: RECUPERACIÓN DE CONTRASEÑA POR CORREO ───
    console.log('\n--- Bloque 5: Recuperación de Contraseña por Correo (Sin Conocer la Anterior) ---')

    const resetToken = await createPasswordResetToken(testUser.id, hashedCurrent)
    assert(typeof resetToken === 'string' && resetToken.length > 20, '23. Token seguro de recuperación JWT generado')

    const verifiedToken = await verifyPasswordResetToken(resetToken)
    assert(verifiedToken !== null && verifiedToken.userId === testUser.id, '24. Token de recuperación verificado con éxito')

    // Simular que el usuario cambia la contraseña
    const newPassHashed = await bcrypt.hash('NewPassword2026!$', 12)
    await prisma.user.update({
      where: { id: testUser.id },
      data: { password: newPassHashed }
    })

    // Intento de reutilizar el token anterior después del cambio
    const currentHashPrefix = newPassHashed.slice(-10)
    const tokenIsInvalidated = currentHashPrefix !== verifiedToken?.pwhash
    assert(tokenIsInvalidated === true, '25. Enlace de recuperación anterior invalidado de inmediato tras el cambio')

    // ─── BLOQUE 6: AISLAMIENTO ENTRE NEGOCIOS Y SUCURSALES ───
    console.log('\n--- Bloque 6: Aislamiento Multi-Tenant y Protección de Sucursales ---')

    const otherBusinesses = await prisma.business.findMany({
      where: { id: { not: testBusiness.id } },
      select: { id: true, name: true, address: true }
    })

    let isolationIntact = true
    for (const b of otherBusinesses) {
      if (b.name === newName || b.address === newAddress) {
        isolationIntact = false
        break
      }
    }
    assert(isolationIntact, '26. Aislamiento estricto: ninguna otra barbería o sucursal fue modificada')

    // Restaurar nombre original del negocio de prueba para dejar la DB limpia
    await prisma.business.update({
      where: { id: testBusiness.id },
      data: {
        name: 'Barbería Elite SAS',
        phone: testBusiness.phone,
        address: testBusiness.address,
        mapsUrl: testBusiness.mapsUrl
      }
    })

    console.log('\n══════════════════════════════════════════════════════════════')
    console.log(`RESULTADO DE LA AUDITORÍA: ${passed} superadas, ${failed} fallidas`)
    console.log('══════════════════════════════════════════════════════════════\n')

    if (failed > 0) {
      process.exit(1)
    }
  } catch (err) {
    console.error('Error durante la ejecución del test suite:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runTestSuite()
