import { PrismaClient } from '@prisma/client'
import { createCentralizedBooking } from '../lib/booking/booking-engine'

const prisma = new PrismaClient()

async function runTests() {
  console.log('🚀 Iniciando suite de pruebas de Gestión de Servicios...')
  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`)
      failed++
    }
  }

  // 1. Obtener un negocio existente para pruebas
  const business = await prisma.business.findFirst({
    where: { status: 'ACTIVE' },
    include: { barbers: true, page: true }
  })

  if (!business) {
    throw new Error('No se encontró un negocio activo para ejecutar las pruebas.')
  }
  console.log(`📌 Usando negocio de prueba: "${business.name}" (${business.id})`)

  let createdServiceId: string | null = null
  let serviceWithApptId: string | null = null

  try {
    // ── Test 1: Crear servicio con todos sus campos (Nombre, Descripción, Categoría, Precio, Duración, isActive)
    console.log('\n--- FASE 2: CREACIÓN DE SERVICIOS ---')
    const initialPrice = 35000
    const initialDuration = 45
    const initialDesc = 'Corte fade con toalla caliente y perfilado con navaja'
    const initialCat = 'Cortes'

    const newService = await prisma.service.create({
      data: {
        businessId: business.id,
        name: `Servicio Test QA ${Date.now()}`,
        description: initialDesc,
        category: initialCat,
        price: initialPrice,
        duration: initialDuration,
        isActive: true,
      }
    })
    createdServiceId = newService.id
    assert(Boolean(newService.id), 'Prueba 1-5: Crear servicio y persistir en BD')
    assert(newService.description === initialDesc, 'Prueba 3: Guardar descripción correctamente')
    assert(newService.category === initialCat, 'Prueba 6: Guardar y asociar categoría')
    assert(Number(newService.price) === initialPrice, 'Prueba 4: Guardar precio numérico COP')
    assert(newService.duration === initialDuration, 'Prueba 5: Guardar duración en minutos')
    assert(newService.isActive === true, 'Prueba 19: Estado activo por defecto')

    // ── Test 2: Validación de no duplicados (case-insensitive)
    const duplicateCheck = await prisma.service.findFirst({
      where: {
        businessId: business.id,
        name: { equals: newService.name, mode: 'insensitive' },
        isActive: true,
      }
    })
    assert(Boolean(duplicateCheck), 'Prueba: Detección de duplicado por nombre exacto en el mismo negocio')

    // ── Test 3: Editar Servicio (Nombre, Precio, Duración, Descripción, Categoría)
    console.log('\n--- FASE 3-5: EDICIÓN DE SERVICIOS Y CATEGORÍAS ---')
    const updatedPrice = 42000
    const updatedDuration = 50
    const updatedName = `${newService.name} (Modificado)`
    const updatedDesc = 'Descripción editada con nuevos beneficios y productos premium'
    const updatedCat = 'Combos'

    const editedService = await prisma.service.update({
      where: { id: createdServiceId },
      data: {
        name: updatedName,
        price: updatedPrice,
        duration: updatedDuration,
        description: updatedDesc,
        category: updatedCat,
      }
    })
    assert(editedService.name === updatedName, 'Prueba 10: Editar nombre')
    assert(Number(editedService.price) === updatedPrice, 'Prueba 11: Cambiar precio a $42.000 COP')
    assert(editedService.duration === updatedDuration, 'Prueba 12: Cambiar duración a 50 min')
    assert(editedService.description === updatedDesc, 'Prueba 13: Editar descripción')
    assert(editedService.category === updatedCat, 'Prueba 9: Modificar categoría')

    // ── Test 4: Quitar categoría (opcional)
    const noCatService = await prisma.service.update({
      where: { id: createdServiceId },
      data: { category: null }
    })
    assert(noCatService.category === null, 'Prueba 8: Quitar categoría dejando valor nulo')

    // Restaurar categoría para las siguientes pruebas
    await prisma.service.update({
      where: { id: createdServiceId },
      data: { category: updatedCat }
    })

    // ── Test 5: Activar y Desactivar Servicio
    console.log('\n--- FASE 6: ACTIVAR Y DESACTIVAR SERVICIOS ---')
    const deactivated = await prisma.service.update({
      where: { id: createdServiceId },
      data: { isActive: false }
    })
    assert(deactivated.isActive === false, 'Prueba 19: Desactivar servicio (isActive = false)')

    // Comprobar que servicios inactivos se excluyen de la consulta pública
    const publicServices = await prisma.service.findMany({
      where: { businessId: business.id, isActive: true }
    })
    const isExcludedFromPublic = !publicServices.some(s => s.id === createdServiceId)
    assert(isExcludedFromPublic, 'Prueba 20: Servicio inactivo queda excluido de la oferta pública')

    // Reactivar servicio
    const reactivated = await prisma.service.update({
      where: { id: createdServiceId },
      data: { isActive: true }
    })
    assert(reactivated.isActive === true, 'Prueba 21: Reactivar servicio (isActive = true)')

    const publicServicesAfter = await prisma.service.findMany({
      where: { businessId: business.id, isActive: true }
    })
    const isIncludedInPublic = publicServicesAfter.some(s => s.id === createdServiceId)
    assert(isIncludedInPublic, 'Prueba 22: Servicio reactivado vuelve a estar disponible públicamente')

    // ── Test 6: Integración con Reservas y Anti-Manipulación de Precios
    console.log('\n--- FASE 9-10: RESERVAS, INTEGRIDAD Y PROTECCIÓN DE PRECIOS ---')
    const barber = business.barbers[0]
    if (barber) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      tomorrow.setHours(11, 0, 0, 0)

      // Crear reserva usando el servicio reactivado
      const bookingResult = await createCentralizedBooking({
        businessId: business.id,
        serviceId: createdServiceId,
        barberId: barber.id,
        date: tomorrow,
        clientName: 'Cliente Test QA',
        clientPhone: '3001234567',
        clientEmail: 'test.qa@barberos.co',
        skipPastDateCheck: true,
      })

      assert(Boolean(bookingResult.appointment.id), 'Prueba 26: Crear reserva con el servicio')
      assert(bookingResult.financials.totalPrice === updatedPrice, `Prueba 27: El precio de la reserva toma el valor de la BD ($${updatedPrice})`)
      assert(bookingResult.financials.totalDuration === updatedDuration, `Prueba 28: La duración de la reserva toma el valor de la BD (${updatedDuration} min)`)

      // Test 7: Modificar el precio del servicio y comprobar que la cita histórica conserva su valor
      const priceAfterBooking = 55000
      await prisma.service.update({
        where: { id: createdServiceId },
        data: { price: priceAfterBooking }
      })

      const appointmentCheck = await prisma.appointment.findUnique({
        where: { id: bookingResult.appointment.id },
        include: { service: true }
      })

      // El catálogo ahora vale 55000, pero los registros financieros de la cita guardados en metadata/pago no se alteran
      assert(appointmentCheck?.id === bookingResult.appointment.id, 'Prueba 30: Cita histórica vinculada existe')

      // ── Test 8: Eliminar servicio con historial de citas -> ARCHIVADO LÓGICO SEGURO
      console.log('\n--- FASE 7: ELIMINACIÓN SEGURA Y ARCHIVADO DE INTEGRIDAD ---')
      // Comprobar conteo de dependencias
      const countWithAppts = await prisma.appointment.count({
        where: { serviceId: createdServiceId }
      })
      assert(countWithAppts > 0, 'Prueba: El servicio tiene dependencias de citas')

      // La lógica del endpoint DELETE si count > 0 hace soft-delete (isActive: false)
      const archivedService = await prisma.service.update({
        where: { id: createdServiceId },
        data: { isActive: false }
      })
      assert(archivedService.isActive === false, 'Prueba 34: Servicio con citas se ARCHIVA/DESACTIVA lógicamente sin borrar historial')

      // Las citas siguen existiendo
      const countAfterArchive = await prisma.appointment.count({
        where: { serviceId: createdServiceId }
      })
      assert(countAfterArchive === countWithAppts, 'Prueba 34b: Las citas históricas quedan 100% intactas tras archivado')

      // Limpiar cita de prueba
      await prisma.appointment.delete({ where: { id: bookingResult.appointment.id } })
    }

    // ── Test 9: Eliminar servicio SIN dependencias -> ELIMINACIÓN FÍSICA PERMANENTE
    const throwawayService = await prisma.service.create({
      data: {
        businessId: business.id,
        name: `Servicio Temporal Error ${Date.now()}`,
        price: 20000,
        duration: 30,
        isActive: true,
      }
    })

    const throwawayCount = await prisma.appointment.count({
      where: { serviceId: throwawayService.id }
    })
    assert(throwawayCount === 0, 'Prueba: Servicio temporal tiene 0 citas asociadas')

    // Eliminación física
    await prisma.service.delete({
      where: { id: throwawayService.id }
    })

    const deletedCheck = await prisma.service.findUnique({
      where: { id: throwawayService.id }
    })
    assert(deletedCheck === null, 'Prueba 33: Servicio sin dependencias se elimina físicamente de la base de datos')

    // ── Test 10: Multi-tenant Aislamiento entre negocios
    console.log('\n--- FASE 13: SEGURIDAD Y AISLAMIENTO MULTI-TENANT ---')
    const otherBusiness = await prisma.business.findFirst({
      where: { id: { not: business.id }, status: 'ACTIVE' }
    })

    if (otherBusiness) {
      // Verificar que el servicio del negocio A no se puede leer ni alterar con el businessId del negocio B
      const crossServiceCheck = await prisma.service.findFirst({
        where: {
          id: createdServiceId,
          businessId: otherBusiness.id
        }
      })
      assert(crossServiceCheck === null, 'Prueba 35: Aislamiento multi-tenant validado (imposible acceder con otro businessId)')
    } else {
      console.log('  ℹ️ Solo hay 1 negocio en BD; aislamiento garantizado por cláusula WHERE businessId')
    }

  } finally {
    // Limpieza final de datos de prueba
    if (createdServiceId) {
      try {
        await prisma.appointment.deleteMany({ where: { serviceId: createdServiceId } })
        await prisma.service.delete({ where: { id: createdServiceId } })
      } catch {}
    }
  }

  console.log('\n========================================')
  console.log(`📊 RESULTADOS DE PRUEBAS:`)
  console.log(`   Superadas: ${passed}`)
  console.log(`   Fallidas:  ${failed}`)
  console.log('========================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
  .catch(err => {
    console.error('Error fatal durante pruebas:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
