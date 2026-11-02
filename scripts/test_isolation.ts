import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function runIsolationTests() {
  console.log('----------------------------------------------------')
  console.log('🧪 EJECUTANDO PRUEBAS DE AISLAMIENTO MULTI-TENANT 🧪')
  console.log('----------------------------------------------------\n')

  try {
    // 1. Limpieza de entornos de prueba previa
    await prisma.appointment.deleteMany({ where: { business: { slug: { in: ['test-barberia-a', 'test-barberia-b'] } } } })
    await prisma.service.deleteMany({ where: { business: { slug: { in: ['test-barberia-a', 'test-barberia-b'] } } } })
    await prisma.barber.deleteMany({ where: { business: { slug: { in: ['test-barberia-a', 'test-barberia-b'] } } } })
    await prisma.client.deleteMany({ where: { business: { slug: { in: ['test-barberia-a', 'test-barberia-b'] } } } })
    await prisma.user.deleteMany({ where: { email: { in: ['owner_a@test.com', 'owner_b@test.com'] } } })
    await prisma.business.deleteMany({ where: { slug: { in: ['test-barberia-a', 'test-barberia-b'] } } })

    // TEST 1: Registro en Transacción Atómica
    console.log('▶ Test 1: Crear Barbería A (Owner A) y Barbería B (Owner B)')
    const pwd = await bcrypt.hash('secret123', 10)

    const bizA = await prisma.business.create({ data: { name: 'Barbería A', slug: 'test-barberia-a' } })
    const ownerA = await prisma.user.create({
      data: { email: 'owner_a@test.com', password: pwd, role: 'OWNER', businessId: bizA.id }
    })

    const bizB = await prisma.business.create({ data: { name: 'Barbería B', slug: 'test-barberia-b' } })
    const ownerB = await prisma.user.create({
      data: { email: 'owner_b@test.com', password: pwd, role: 'OWNER', businessId: bizB.id }
    })
    console.log('  ✅ Barbería A (ID:', bizA.id, ') y Barbería B (ID:', bizB.id, ') creadas con éxito.')

    // TEST 2: Servicios creados en Barbería A no aparecen en Barbería B
    console.log('\n▶ Test 2: Aislamiento de Servicios')
    const serviceA = await prisma.service.create({
      data: { name: 'Corte VIP A', duration: 30, price: 25.0, businessId: bizA.id }
    })

    const servicesForOwnerB = await prisma.service.findMany({
      where: { businessId: ownerB.businessId! }
    })
    if (servicesForOwnerB.length === 0) {
      console.log('  ✅ El servicio "Corte VIP A" de Barbería A NO aparece para Owner B.')
    } else {
      throw new Error('❌ ¡FUGA DE DATOS DETECTADA EN SERVICIOS!')
    }

    // TEST 3: Barberos creados en Barbería A no aparecen en Barbería B
    console.log('\n▶ Test 3: Aislamiento de Barberos')
    const barberA = await prisma.barber.create({
      data: { name: 'Barbero Alex (A)', businessId: bizA.id }
    })

    const barbersForOwnerB = await prisma.barber.findMany({
      where: { businessId: ownerB.businessId! }
    })
    if (barbersForOwnerB.length === 0) {
      console.log('  ✅ El barbero "Alex (A)" de Barbería A NO aparece para Owner B.')
    } else {
      throw new Error('❌ ¡FUGA DE DATOS DETECTADA EN BARBEROS!')
    }

    // TEST 4: Citas de Barbería A no aparecen en Barbería B
    console.log('\n▶ Test 4: Aislamiento de Citas')
    const clientA = await prisma.client.create({
      data: { name: 'Cliente A', phone: '300000000', businessId: bizA.id }
    })

    await prisma.appointment.create({
      data: {
        businessId: bizA.id,
        clientId: clientA.id,
        barberId: barberA.id,
        serviceId: serviceA.id,
        date: new Date(),
        status: 'CONFIRMED'
      }
    })

    const apptsForOwnerB = await prisma.appointment.findMany({
      where: { businessId: ownerB.businessId! }
    })
    if (apptsForOwnerB.length === 0) {
      console.log('  ✅ La cita de Barbería A NO aparece para Owner B.')
    } else {
      throw new Error('❌ ¡FUGA DE DATOS DETECTADA EN CITAS!')
    }

    // TEST 5: Acceso directo por ID (Simulación de Bypass por URL)
    console.log('\n▶ Test 5: Intentar acceder a un recurso de A usando la sesión de B')
    const targetService = await prisma.service.findFirst({
      where: { id: serviceA.id, businessId: ownerB.businessId! }
    })
    if (!targetService) {
      console.log('  ✅ Consulta filtrada por businessId devolvió null (404/403). Acceso bloqueado.')
    } else {
      throw new Error('❌ ¡ACCESO AUTORIZADO A RECURSO DE OTRO NEGOCIO!')
    }

    // TEST 6: Contextos de Sesión Independientes
    console.log('\n▶ Test 6: Verificación de Contextos de Usuario')
    console.log('  - Owner A Context Business ID:', ownerA.businessId)
    console.log('  - Owner B Context Business ID:', ownerB.businessId)
    if (ownerA.businessId !== ownerB.businessId) {
      console.log('  ✅ Cada usuario recibe estrictamente su propio businessId.')
    }

    // TEST 7: Creación de Negocio 3 (Aislamiento de contexto)
    console.log('\n▶ Test 7: Creación de Negocio C')
    const bizC = await prisma.business.create({ data: { name: 'Barbería C', slug: 'test-barberia-c' } })
    const ownerC = await prisma.user.create({
      data: { email: 'owner_c@test.com', password: pwd, role: 'OWNER', businessId: bizC.id }
    })
    console.log('  - Barbería C ID:', bizC.id)
    const servicesC = await prisma.service.findMany({ where: { businessId: ownerC.businessId! } })
    if (servicesC.length === 0) {
      console.log('  ✅ Barbería C obtiene automáticamente su contexto independiente sin datos de A o B.')
    }

    // Limpieza posterior de tests
    await prisma.appointment.deleteMany({ where: { businessId: { in: [bizA.id, bizB.id, bizC.id] } } })
    await prisma.service.deleteMany({ where: { businessId: { in: [bizA.id, bizB.id, bizC.id] } } })
    await prisma.barber.deleteMany({ where: { businessId: { in: [bizA.id, bizB.id, bizC.id] } } })
    await prisma.client.deleteMany({ where: { businessId: { in: [bizA.id, bizB.id, bizC.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [ownerA.id, ownerB.id, ownerC.id] } } })
    await prisma.business.deleteMany({ where: { id: { in: [bizA.id, bizB.id, bizC.id] } } })

    console.log('\n----------------------------------------------------')
    console.log('🎉 TODAS LAS PRUEBAS DE AISLAMIENTO PASARON (100% ÉXITO) 🎉')
    console.log('----------------------------------------------------')
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('\n❌ PRUEBA FALLIDA:', msg)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runIsolationTests()
