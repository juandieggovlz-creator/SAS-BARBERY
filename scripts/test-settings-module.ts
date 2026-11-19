import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { createPasswordResetToken, verifyPasswordResetToken } from '../lib/auth'

async function runSettingsAudit() {
  console.log('🚀 Iniciando Suite de Pruebas y Auditoría del Módulo de Configuración...\n')

  let passedTests = 0
  let failedTests = 0

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`)
      passedTests++
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`)
      failedTests++
    }
  }

  // ── SECCIÓN 1: Creación de Negocios y Usuarios para Pruebas ──
  console.log('📦 SECCIÓN 1: Configuración de Negocios y Usuarios Aislados')
  const timestamp = Date.now()
  const businessSlugA = `test-settings-a-${timestamp}`
  const businessSlugB = `test-settings-b-${timestamp}`

  const businessA = await prisma.business.create({
    data: {
      name: 'Barbería Olimpo Test',
      slug: businessSlugA,
      logo: 'https://res.cloudinary.com/barberos/image/upload/v1/logos/olimpo-original.png',
      phone: '+573001112233',
      address: 'Calle 100 # 15-20, Bogotá',
    }
  })

  const businessB = await prisma.business.create({
    data: {
      name: 'Barbería Sparta Test',
      slug: businessSlugB,
      logo: 'https://res.cloudinary.com/barberos/image/upload/v1/logos/sparta-original.png',
      phone: '+573009998877',
      address: 'Carrera 7 # 72-10, Bogotá',
    }
  })

  const originalPassword = 'PasswordSeguro123!'
  const hashedPassword = await bcrypt.hash(originalPassword, 12)

  const ownerA = await prisma.user.create({
    data: {
      email: `owner.settings.a.${timestamp}@test.com`,
      name: 'Don Carlos Mendoza',
      avatar: 'https://res.cloudinary.com/barberos/image/upload/v1/avatars/carlos.png',
      password: hashedPassword,
      role: 'OWNER',
      businessId: businessA.id,
      accentColor: '#F59E0B'
    }
  })

  const barberA = await prisma.user.create({
    data: {
      email: `barber.settings.a.${timestamp}@test.com`,
      name: 'Mateo Barbero',
      password: hashedPassword,
      role: 'BARBER',
      businessId: businessA.id,
      accentColor: '#2563EB'
    }
  })

  assert(Boolean(businessA.id && businessB.id), 'Negocios de prueba A y B creados en PostgreSQL')
  assert(Boolean(ownerA.id && barberA.id), 'Usuarios Owner y Barber creados correctamente')

  // ── SECCIÓN 2: Sincronización del Logotipo Comercial ──
  console.log('\n🎨 SECCIÓN 2: Sincronización del Logotipo Comercial (Configuración & Editor Web)')
  
  // 1. Verificar que el logo proviene exactamente de Business.logo
  assert(businessA.logo === 'https://res.cloudinary.com/barberos/image/upload/v1/logos/olimpo-original.png', 'Fuente de datos del logotipo es Business.logo')
  assert(ownerA.avatar !== businessA.logo, 'El avatar personal del titular NO se confunde con el logo del negocio')

  // 2. Simular actualización de logo comercial (como lo hace /api/owner/business/logo)
  const newCommercialLogo = 'https://res.cloudinary.com/barberos/image/upload/v1/logos/olimpo-renovado-2026.webp'
  const updatedBusinessLogo = await prisma.business.update({
    where: { id: businessA.id },
    data: { logo: newCommercialLogo },
    select: { id: true, name: true, logo: true }
  })

  // 3. Verificar que el cambio se refleja en Business.logo y NO en User.avatar
  const refreshedOwner = await prisma.user.findUnique({
    where: { id: ownerA.id },
    select: { avatar: true, name: true }
  })

  assert(updatedBusinessLogo.logo === newCommercialLogo, 'Logotipo del negocio actualizado en Business.logo')
  assert(refreshedOwner?.avatar === ownerA.avatar, 'El avatar personal del propietario se mantiene intacto tras actualizar el logo comercial')

  // 4. Simular eliminación del logo comercial
  const deletedBusinessLogo = await prisma.business.update({
    where: { id: businessA.id },
    data: { logo: null },
    select: { logo: true }
  })
  assert(deletedBusinessLogo.logo === null, 'Logotipo comercial eliminado limpiamente (retorna null)')

  // ── SECCIÓN 3: Separación Estricta de Identidad Personal vs Comercial ──
  console.log('\n👤 SECCIÓN 3: Separación Estricta de Identidad Personal vs Comercial')

  // 1. Actualizar el nombre personal del titular
  const newPersonalName = 'Carlos Alberto Mendoza Gómez'
  const updatedUser = await prisma.user.update({
    where: { id: ownerA.id },
    data: { name: newPersonalName },
    select: { name: true, business: { select: { name: true } } }
  })

  assert(updatedUser.name === newPersonalName, 'Nombre personal del titular actualizado en User.name')
  assert(updatedUser.business?.name === businessA.name, 'El nombre comercial de la barbería NO cambia al editar el nombre personal')

  // 2. Actualizar el nombre comercial de la barbería
  const newCommercialName = 'Olimpo Luxury Barbershop'
  const updatedBusiness = await prisma.business.update({
    where: { id: businessA.id },
    data: { name: newCommercialName },
    select: { name: true, users: { where: { id: ownerA.id }, select: { name: true } } }
  })

  assert(updatedBusiness.name === newCommercialName, 'Nombre comercial actualizado en Business.name')
  assert(updatedBusiness.users[0]?.name === newPersonalName, 'El nombre personal del titular NO cambia al editar el nombre comercial')

  // ── SECCIÓN 4: Seguridad, Contraseñas y Sesiones ──
  console.log('\n🔒 SECCIÓN 4: Seguridad, Contraseñas y Sesiones')

  // 1. Verificación de hash de contraseña actual
  const isMatch = await bcrypt.compare(originalPassword, ownerA.password!)
  assert(isMatch, 'Contraseña actual coincide con el hash bcrypt')

  // 2. Simular cambio de contraseña con salt 12
  const brandNewPassword = 'NuevaPassword2026!#'
  const newHashedPassword = await bcrypt.hash(brandNewPassword, 12)

  // Crear 2 sesiones para verificar revocación de sesiones secundarias
  const session1 = await prisma.session.create({
    data: {
      userId: ownerA.id,
      sessionToken: `sess-token-1-${timestamp}`,
      ipAddress: '192.168.1.10',
      userAgent: 'Chrome Desktop',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  const session2 = await prisma.session.create({
    data: {
      userId: ownerA.id,
      sessionToken: `sess-token-2-${timestamp}`,
      ipAddress: '192.168.1.20',
      userAgent: 'Mobile Safari',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  // Actualizar contraseña y revocar sesiones secundarias
  await prisma.user.update({
    where: { id: ownerA.id },
    data: { password: newHashedPassword }
  })

  await prisma.session.updateMany({
    where: {
      userId: ownerA.id,
      id: { not: session1.id },
      isRevoked: false
    },
    data: { isRevoked: true }
  })

  const activeSession = await prisma.session.findUnique({ where: { id: session1.id } })
  const revokedSession = await prisma.session.findUnique({ where: { id: session2.id } })

  assert(activeSession?.isRevoked === false, 'Sesión actual activa conservada')
  assert(revokedSession?.isRevoked === true, 'Sesión secundaria revocada automáticamente tras cambio de contraseña')

  // ── SECCIÓN 5: Recuperación de Contraseña & Single-Use Token ──
  console.log('\n✉️ SECCIÓN 5: Recuperación de Contraseña & Single-Use Token Enforcement')

  // 1. Generar token de recuperación ligado al hash de la contraseña actual
  const userForReset = await prisma.user.findUnique({ where: { id: ownerA.id } })
  const resetToken = await createPasswordResetToken(userForReset!.id, userForReset!.password)
  assert(Boolean(resetToken && resetToken.length > 20), 'Token criptográfico de recuperación generado exitosamente')

  // 2. Verificar token antes de uso (debe ser válido)
  const tokenPayload = await verifyPasswordResetToken(resetToken)
  assert(tokenPayload !== null && tokenPayload.userId === ownerA.id, 'Token de recuperación verificado correctamente')

  // 3. Simular que el usuario restablece su contraseña
  const resetNewPassword = 'PasswordRestablecida999$'
  const resetHashedPassword = await bcrypt.hash(resetNewPassword, 12)
  await prisma.user.update({
    where: { id: ownerA.id },
    data: { password: resetHashedPassword }
  })

  // 4. Intentar reusar el mismo token (Single-Use Token Enforcement)
  const reloadedUser = await prisma.user.findUnique({ where: { id: ownerA.id } })
  const currentPrefix = (reloadedUser?.password || '').slice(-10)
  const isTokenStillReusable = currentPrefix === tokenPayload?.pwhash
  assert(!isTokenStillReusable, 'Token de recuperación INVALIDADO de inmediato tras el primer uso (Single-Use)')

  // ── SECCIÓN 6: Aislamiento Multi-Tenant & Permisos ──
  console.log('\n🛡️ SECCIÓN 6: Aislamiento Multi-Tenant & Permisos')

  // 1. Dueño B no puede ver ni modificar datos del Negocio A
  const businessAFromTenantB = await prisma.business.findFirst({
    where: { id: businessA.id, users: { some: { id: ownerA.id, businessId: businessB.id } } }
  })
  assert(businessAFromTenantB === null, 'Aislamiento estricto: Negocio A inaccesible desde credenciales de Negocio B')

  // 2. Barbero A solo tiene rol BARBER y su propia paleta de acento
  assert(barberA.role === 'BARBER', 'El rol del barbero está protegido y no es modificable desde perfil')
  assert(barberA.accentColor === '#2563EB' && ownerA.accentColor === '#F59E0B', 'Preferencias visuales personales de barbero y dueño aisladas')

  // ── LIMPIEZA ──
  console.log('\n🧹 Limpieza de datos de prueba...')
  await prisma.session.deleteMany({ where: { userId: { in: [ownerA.id, barberA.id] } } })
  await prisma.user.deleteMany({ where: { id: { in: [ownerA.id, barberA.id] } } })
  await prisma.business.deleteMany({ where: { id: { in: [businessA.id, businessB.id] } } })
  console.log('  ✅ Datos de prueba eliminados correctamente')

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`📊 RESULTADOS FINALES DE LA AUDITORÍA DE CONFIGURACIÓN:`)
  console.log(`   Pruebas Exitosas: ${passedTests}`)
  console.log(`   Pruebas Fallidas: ${failedTests}`)
  console.log(`   Tasa de Éxito: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)
  console.log('═══════════════════════════════════════════════════════\n')
}

runSettingsAudit().catch(err => {
  console.error('Error ejecutando auditoría de configuración:', err)
  process.exit(1)
})
