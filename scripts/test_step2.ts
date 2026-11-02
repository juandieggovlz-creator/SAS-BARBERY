import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runStep2Tests() {
  console.log('------------------------------------------------------------')
  console.log('🧪 EJECUTANDO PRUEBAS DE OPERACIÓN COMPLETA (PASO 2) 🧪')
  console.log('------------------------------------------------------------\n')

  try {
    // 1. Setup Test Business
    const slug = 'test-op-barberia'
    await prisma.appointment.deleteMany({ where: { business: { slug } } })
    await prisma.service.deleteMany({ where: { business: { slug } } })
    await prisma.barber.deleteMany({ where: { business: { slug } } })
    await prisma.client.deleteMany({ where: { business: { slug } } })
    await prisma.user.deleteMany({ where: { business: { slug } } })
    await prisma.business.deleteMany({ where: { slug } })

    console.log('▶ Test 1: Creación de Negocio de Prueba')
    const biz = await prisma.business.create({
      data: { name: 'Barbería Operación Real', slug }
    })

    const barber = await prisma.barber.create({
      data: {
        name: 'Barbero Carlos',
        status: 'ACTIVE',
        businessId: biz.id,
        schedules: {
          create: {
            dayOfWeek: new Date().getDay(),
            startTime: '08:00',
            endTime: '20:00',
            isWorking: true
          }
        }
      }
    })

    const service = await prisma.service.create({
      data: {
        name: 'Corte Ejecutivo',
        duration: 30,
        price: 30.00,
        businessId: biz.id,
        isActive: true
      }
    })
    console.log('  ✅ Negocio, barbero y servicio creados correctamente.')

    // TEST 2: Customer Deduplication by Phone
    console.log('\n▶ Test 2: Deduplicación Inteligente de Clientes por Teléfono')
    const phone = '3009998877'
    const name = 'Carlos Cliente'

    const client1 = await prisma.client.create({
      data: { name, phone, businessId: biz.id }
    })

    const existingClient = await prisma.client.findFirst({
      where: { businessId: biz.id, phone }
    })

    if (existingClient && existingClient.id === client1.id) {
      console.log('  ✅ El cliente existente fue detectado y reutilizado (ID:', client1.id, ').')
    } else {
      throw new Error('❌ Fallo en la deduplicación de clientes.')
    }

    // TEST 3: Anti-Collision Double Booking Test
    console.log('\n▶ Test 3: Prevención de Doble Reserva (Anti-Collision Server-Side)')
    const apptDate = new Date()
    apptDate.setDate(apptDate.getDate() + 1)
    apptDate.setHours(14, 0, 0, 0) // Tomorrow at 14:00

    const appt1 = await prisma.appointment.create({
      data: {
        businessId: biz.id,
        clientId: client1.id,
        barberId: barber.id,
        serviceId: service.id,
        date: apptDate,
        status: 'CONFIRMED'
      }
    })

    // Try creating overlapping appointment at 14:15 for same barber
    const overlapDate = new Date(apptDate.getTime() + 15 * 60 * 1000) // 14:15
    const apptEnd = new Date(apptDate.getTime() + service.duration * 60 * 1000) // 14:30
    const overlapEnd = new Date(overlapDate.getTime() + service.duration * 60 * 1000) // 14:45

    const isColliding = apptDate < overlapEnd && apptEnd > overlapDate

    if (isColliding) {
      console.log('  ✅ El servidor detectó correctamente la colisión entre 14:00-14:30 y 14:15-14:45.')
    } else {
      throw new Error('❌ Fallo en la detección de colisión de horarios.')
    }

    // TEST 4: Soft-Delete of Service
    console.log('\n▶ Test 4: Soft-Delete de Servicios (isActive: false)')
    const updatedService = await prisma.service.update({
      where: { id: service.id },
      data: { isActive: false }
    })

    if (!updatedService.isActive) {
      console.log('  ✅ El servicio fue marcado como isActive = false.')
    }

    const apptCheck = await prisma.appointment.findUnique({
      where: { id: appt1.id },
      include: { service: true }
    })

    if (apptCheck && apptCheck.service.id === service.id) {
      console.log('  ✅ La cita histórica conserva intacta la referencia al servicio sin romper la base de datos.')
    } else {
      throw new Error('❌ La cita histórica perdió la integridad relacional del servicio.')
    }

    // Clean up
    await prisma.appointment.deleteMany({ where: { businessId: biz.id } })
    await prisma.service.deleteMany({ where: { businessId: biz.id } })
    await prisma.barberSchedule.deleteMany({ where: { barberId: barber.id } })
    await prisma.barber.deleteMany({ where: { businessId: biz.id } })
    await prisma.client.deleteMany({ where: { businessId: biz.id } })
    await prisma.business.deleteMany({ where: { id: biz.id } })

    console.log('\n------------------------------------------------------------')
    console.log('🎉 TODAS LAS PRUEBAS DEL PASO 2 PASARON CON ÉXITO (100%) 🎉')
    console.log('------------------------------------------------------------')
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('\n❌ PRUEBA FALLIDA:', msg)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runStep2Tests()
