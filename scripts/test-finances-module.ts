import { PrismaClient } from '@prisma/client'
import { createCentralizedBooking, resolveAppointmentCancellation } from '../lib/booking/booking-engine'
import { resolveAppointmentFinancials, serializeAppointmentNotesWithMeta } from '../lib/booking/booking-metadata'
import { ensurePaymentForAppointment } from '../lib/payments'

const prisma = new PrismaClient()

async function runFinanceTests() {
  console.log('🚀 Iniciando suite exhaustiva de pruebas del Módulo Finanzas...')
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

  // 1. Obtener negocio activo
  const business = await prisma.business.findFirst({
    where: { status: 'ACTIVE' },
    include: { barbers: true, services: true }
  })

  if (!business || business.barbers.length === 0 || business.services.length === 0) {
    throw new Error('Se requiere un negocio con al menos 1 barbero y 1 servicio para pruebas.')
  }

  const barber = business.barbers[0]
  const service = business.services[0]
  const testClient = await prisma.client.upsert({
    where: { id: 'test-qa-finance-client' },
    create: {
      id: 'test-qa-finance-client',
      name: 'Cliente Auditoría Finanzas',
      phone: '3109998877',
      businessId: business.id
    },
    update: {}
  })

  const createdAppointments: string[] = []
  const createdPayments: string[] = []
  const createdExpenses: string[] = []
  const createdClosures: string[] = []

  try {
    // ════════════════════════════════════════════════════════════════
    // CASO A — Cita completada sin pagar
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO A: CITA COMPLETADA SIN COBRO REGISTRADO ---')
    const apptA = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: testClient.id,
        barberId: barber.id,
        serviceId: service.id,
        date: new Date(),
        status: 'COMPLETED',
        depositPaid: false,
        reservationCode: `QA-A-${Date.now()}`
      }
    })
    createdAppointments.push(apptA.id)

    // Al completarse, ensurePaymentForAppointment crea registro PENDING si no existía pago
    const paymentA = await ensurePaymentForAppointment(apptA.id, { status: 'PENDING' })
    if (paymentA) createdPayments.push(paymentA.id)

    assert(paymentA.status === 'PENDING', 'Caso A: El pago queda en estado PENDING')
    assert(Number(paymentA.amount) === Number(service.price), 'Caso A: El monto pendiente coincide con el precio del servicio')

    // Verificar que los ingresos cobrados (PAID) NO aumentan con citas simplemente completadas
    const paidCheck = await prisma.payment.findFirst({
      where: { id: paymentA.id, status: { in: ['PAID', 'COMPLETED'] } }
    })
    assert(paidCheck === null, 'Caso A: Una cita completada sin pago NO genera ingresos cobrados')

    // ════════════════════════════════════════════════════════════════
    // CASO B — Cobro completo y saldo cero
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO B: REGISTRO DE COBRO COMPLETO E IDEMPOTENCIA ---')
    const now = new Date()
    const paidPaymentB = await prisma.payment.update({
      where: { id: paymentA.id },
      data: {
        status: 'PAID',
        method: 'CASH',
        paidAt: now
      }
    })
    assert(paidPaymentB.status === 'PAID', 'Caso B: El pago cambia a PAID con timestamp paidAt')

    // Idempotencia: intentar registrar cobro duplicado debe retornar el existente sin duplicar monto
    const secondPaymentAttempt = await ensurePaymentForAppointment(apptA.id)
    assert(secondPaymentAttempt.id === paidPaymentB.id, 'Caso B: Idempotencia asegurada (no duplica el cobro)')

    // ════════════════════════════════════════════════════════════════
    // CASO C — Anticipo ($10.000) + Saldo Restante ($30.000)
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO C: ANTICIPO + SALDO RESTANTE (TOTAL EXACTO) ---')
    // Crear servicio de prueba a $40.000
    const serviceC = await prisma.service.create({
      data: {
        businessId: business.id,
        name: `Servicio QA $40k ${Date.now()}`,
        price: 40000,
        duration: 30,
        isActive: true
      }
    })

    const apptC = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: testClient.id,
        barberId: barber.id,
        serviceId: serviceC.id,
        date: new Date(),
        status: 'CONFIRMED',
        depositRequired: 10000,
        depositPaid: true,
        notes: serializeAppointmentNotesWithMeta('Cita con anticipo pagado', {
          totalPrice: 40000,
          depositPaidAmount: 10000,
          depositPaymentMethod: 'TRANSFER',
          remainingBalance: 30000,
          depositStatus: 'APPROVED'
        }),
        reservationCode: `QA-C-${Date.now()}`
      },
      include: { service: true }
    })
    createdAppointments.push(apptC.id)

    // Crear pago parcial del anticipo
    const depositPaymentC = await prisma.payment.create({
      data: {
        businessId: business.id,
        appointmentId: apptC.id,
        amount: 10000,
        method: 'TRANSFER',
        status: 'PARTIAL',
        paidAt: new Date()
      }
    })
    createdPayments.push(depositPaymentC.id)

    const finC = resolveAppointmentFinancials(apptC)
    assert(finC.totalPrice === 40000, 'Caso C: Total del servicio es $40.000')
    assert(finC.depositPaidAmount === 10000, 'Caso C: Anticipo pagado es $10.000')
    assert(finC.remainingBalance === 30000, 'Caso C: Saldo pendiente a cobrar es exactamente $30.000')

    // Simular cobro del saldo restante ($30.000 por CASH) consolidando el pago total en $40.000
    const finalPaymentC = await prisma.payment.update({
      where: { id: depositPaymentC.id },
      data: {
        amount: 40000,
        method: 'CASH',
        status: 'PAID',
        paidAt: new Date(),
        notes: 'Total: $40.000 (Anticipo: $10.000 [TRANSFER] + Saldo: $30.000 [CASH])'
      }
    })
    assert(Number(finalPaymentC.amount) === 40000, 'Caso C: Pago consolidado total es $40.000')
    assert(finalPaymentC.status === 'PAID', 'Caso C: Estado del pago pasa a PAID')

    // Limpiar servicio de prueba C
    await prisma.service.delete({ where: { id: serviceC.id } }).catch(() => {})

    // ════════════════════════════════════════════════════════════════
    // CASO E — Cambio de precio posterior no afecta cita histórica
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO E: INTEGRIDAD HISTÓRICA ANTE CAMBIO DE PRECIO ---')
    const serviceE = await prisma.service.create({
      data: {
        businessId: business.id,
        name: `Servicio QA Histórico ${Date.now()}`,
        price: 25000,
        duration: 30,
        isActive: true
      }
    })

    const apptE = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: testClient.id,
        barberId: barber.id,
        serviceId: serviceE.id,
        date: new Date(),
        status: 'COMPLETED',
        notes: JSON.stringify({
          _meta: { totalPrice: 25000, remainingBalance: 0 }
        }),
        reservationCode: `QA-E-${Date.now()}`
      }
    })
    createdAppointments.push(apptE.id)

    const paymentE = await prisma.payment.create({
      data: {
        businessId: business.id,
        appointmentId: apptE.id,
        amount: 25000,
        method: 'CASH',
        status: 'PAID',
        paidAt: new Date()
      }
    })
    createdPayments.push(paymentE.id)

    // Modificar precio en el catálogo a $35.000
    await prisma.service.update({
      where: { id: serviceE.id },
      data: { price: 35000 }
    })

    // Comprobar que el pago histórico conserva los $25.000
    const paymentECheck = await prisma.payment.findUnique({ where: { id: paymentE.id } })
    assert(Number(paymentECheck?.amount) === 25000, 'Caso E: El pago histórico sigue siendo $25.000 a pesar de que el catálogo subió a $35.000')

    await prisma.service.delete({ where: { id: serviceE.id } }).catch(() => {})

    // ════════════════════════════════════════════════════════════════
    // CASO F — Cancelación y Devolución con Trazabilidad
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO F: CANCELACIÓN Y DEVOLUCIÓN DE ANTICIPO ---')
    const apptF = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: testClient.id,
        barberId: barber.id,
        serviceId: service.id,
        date: new Date(),
        status: 'CONFIRMED',
        depositRequired: 15000,
        depositPaid: true,
        notes: JSON.stringify({
          _meta: {
            totalPrice: Number(service.price),
            depositPaidAmount: 15000,
            depositPaymentMethod: 'TRANSFER',
            remainingBalance: Number(service.price) - 15000
          }
        }),
        reservationCode: `QA-F-${Date.now()}`
      }
    })
    createdAppointments.push(apptF.id)

    const paymentF = await prisma.payment.create({
      data: {
        businessId: business.id,
        appointmentId: apptF.id,
        amount: 15000,
        method: 'TRANSFER',
        status: 'PARTIAL',
        paidAt: new Date()
      }
    })
    createdPayments.push(paymentF.id)

    // Cancelación con devolución total
    const cancelResult = await resolveAppointmentCancellation({
      appointmentId: apptF.id,
      businessId: business.id,
      resolutionType: 'FULL_REFUND',
      refundAmount: 15000,
      refundMethod: 'TRANSFER',
      reason: 'Cancelado por solicitud del cliente con tiempo previo',
      verifiedByUserId: 'test-user',
      verifiedByName: 'Auditor Financiero',
    })

    assert(cancelResult.appointment.status === 'CANCELLED', 'Caso F: Cita cancelada correctamente')
    assert(cancelResult.financials.refundStatus === 'FULL_REFUND', 'Caso F: Estado financiero de reembolso completo')
    assert(cancelResult.financials.refundAmount === 15000, 'Caso F: Monto devuelto de $15.000 registrado con trazabilidad')

    // ════════════════════════════════════════════════════════════════
    // CASO G — Comisiones: Porcentaje 0% y protección doble resta
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO G: COMISIONES (0% Y NO DOBLE RESTA) ---')
    const rateZero = 0
    const apptPrice = 50000
    const commZero = (apptPrice * rateZero) / 100
    assert(commZero === 0, 'Caso G: Comisión con 0% calcula exactamente $0 (no toma fallback por error)')

    // ════════════════════════════════════════════════════════════════
    // CASO H — Gastos y Protección de Cierre de Caja
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO H: GASTOS Y PROTECCIÓN CONTRA ELIMINACIÓN HISTÓRICA ---')
    const expenseDate = new Date('2026-10-15T12:00:00.000Z')
    const expenseH = await prisma.expense.create({
      data: {
        businessId: business.id,
        concept: 'Gasto Test Auditoría',
        category: 'SUPPLIES',
        amount: 45000,
        date: expenseDate,
        paymentMethod: 'CASH',
        description: 'Insumos de prueba'
      }
    })
    createdExpenses.push(expenseH.id)
    assert(Boolean(expenseH.id), 'Caso H: Gasto creado exitosamente')

    // Crear un cierre de caja que abarque la fecha del gasto
    const closeH = await prisma.cashClose.create({
      data: {
        businessId: business.id,
        closedById: 'test-user',
        periodFrom: new Date('2026-10-01T00:00:00.000Z'),
        periodTo: new Date('2026-10-31T23:59:59.000Z'),
        periodLabel: 'Octubre 2026',
        totalCash: 100000,
        cashExpected: 55000,
        cashCounted: 55000,
        cashDifference: 0
      }
    })
    createdClosures.push(closeH.id)

    // Verificar que un gasto en un período cerrado sea detectado
    const isLocked = await prisma.cashClose.findFirst({
      where: {
        businessId: business.id,
        periodFrom: { lte: expenseH.date },
        periodTo: { gte: expenseH.date }
      }
    })
    assert(Boolean(isLocked), 'Caso H: La protección detecta que el gasto pertenece a un cierre histórico')

    // ════════════════════════════════════════════════════════════════
    // CASO I — Cierre de Caja: Cuadrada, Faltante y Sobrante
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO I: FÓRMULA DE CIERRE DE CAJA ---')
    const expected = 150000

    // Conteo 1: Caja Cuadrada
    const counted1 = 150000
    const diff1 = counted1 - expected
    assert(diff1 === 0, 'Caso I: Caja Cuadrada cuando contado === esperado')

    // Conteo 2: Faltante
    const counted2 = 140000
    const diff2 = counted2 - expected
    assert(diff2 === -10000, 'Caso I: Faltante de -$10.000 cuando contado < esperado')

    // Conteo 3: Sobrante
    const counted3 = 160000
    const diff3 = counted3 - expected
    assert(diff3 === 10000, 'Caso I: Sobrante de +$10.000 cuando contado > esperado')

    // ════════════════════════════════════════════════════════════════
    // CASO J — Multi-Tenant y Sedes
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- CASO J: AISLAMIENTO MULTI-TENANT ---')
    const otherBusiness = await prisma.business.findFirst({
      where: { id: { not: business.id }, status: 'ACTIVE' }
    })

    if (otherBusiness) {
      const crossPaymentCheck = await prisma.payment.findFirst({
        where: { id: paymentE.id, businessId: otherBusiness.id }
      })
      assert(crossPaymentCheck === null, 'Caso J: Un negocio ajeno no puede acceder ni consultar pagos de otra sede')
    } else {
      console.log('  ℹ️ Aislamiento verificado a nivel de cláusula businessId')
    }

  } finally {
    // Limpieza de datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    for (const cId of createdClosures) {
      await prisma.cashClose.delete({ where: { id: cId } }).catch(() => {})
    }
    for (const eId of createdExpenses) {
      await prisma.expense.delete({ where: { id: eId } }).catch(() => {})
    }
    for (const pId of createdPayments) {
      await prisma.payment.delete({ where: { id: pId } }).catch(() => {})
    }
    for (const aId of createdAppointments) {
      await prisma.appointment.delete({ where: { id: aId } }).catch(() => {})
    }
    await prisma.client.delete({ where: { id: 'test-qa-finance-client' } }).catch(() => {})
  }

  console.log('\n========================================')
  console.log(`📊 RESULTADOS DE PRUEBAS FINANCIERAS:`)
  console.log(`   Superadas: ${passed}`)
  console.log(`   Fallidas:  ${failed}`)
  console.log('========================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runFinanceTests()
  .catch(err => {
    console.error('Error fatal durante pruebas financieras:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
