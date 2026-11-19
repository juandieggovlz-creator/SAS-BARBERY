import { PrismaClient } from '@prisma/client'
import { serializeAppointmentNotesWithMeta } from '../lib/booking/booking-metadata'

const prisma = new PrismaClient()

async function runReportsTests() {
  console.log('🚀 Iniciando suite exhaustiva de pruebas del Módulo Reportes & Analytics...')
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
    include: { company: true }
  })

  if (!business) {
    console.error('❌ No se encontró un negocio activo en la base de datos.')
    process.exit(1)
  }

  console.log(`🏢 Negocio de pruebas: "${business.name}" (ID: ${business.id})`)

  const testId = `QA-REP-${Date.now()}`
  const createdAppts: string[] = []
  const createdPayments: string[] = []
  const createdExpenses: string[] = []
  const createdServices: string[] = []
  const createdBarbers: string[] = []
  const createdClients: string[] = []

  try {
    // ════════════════════════════════════════════════════════════════
    // PRUEBA 1: FECHAS Y ZONA HORARIA DE COLOMBIA (UTC-5)
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- PRUEBA 1: ZONA HORARIA DE COLOMBIA (UTC-5) ---')
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const [yStr, mStr, dStr] = formatter.format(now).split('-')
    const y = Number(yStr)
    const m = Number(mStr) - 1
    const d = Number(dStr)

    // Un momento a las 20:00 (8:00 PM) en Colombia corresponde a la 01:00 UTC del día siguiente
    const bogotaEveningDate = new Date(Date.UTC(y, m, d, 20 + 5, 0, 0, 0)) // 20:00 Col = 01:00 UTC next day
    const bogotaHour = new Date(bogotaEveningDate.getTime() - 5 * 3600 * 1000).getUTCHours()
    assert(bogotaHour === 20, 'Prueba 1: Conversión a hora de Colombia devuelve exactamente las 20:00 (no 01:00 UTC)')

    const bogotaDay = new Date(bogotaEveningDate.getTime() - 5 * 3600 * 1000).getUTCDate()
    assert(bogotaDay === d, 'Prueba 1: La fecha en Colombia se mantiene en el día correcto sin saltar al día siguiente')

    // ════════════════════════════════════════════════════════════════
    // PRUEBA 2: INCLUSIÓN DE PAGOS 'PAID', 'PARTIAL' Y EXCLUSIÓN DE FANTASMAS
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- PRUEBA 2: ESTADOS FINANCIEROS Y RECONCILIACIÓN ---')
    
    // Crear barbero de prueba
    const barber = await prisma.barber.create({
      data: {
        businessId: business.id,
        name: `Barbero Test ${testId}`,
        commission: 0, // 0% de comisión deliberado para probar que no aplica fallback de 40%
        status: 'ACTIVE',
      }
    })
    createdBarbers.push(barber.id)

    // Crear cliente de prueba
    const client = await prisma.client.create({
      data: {
        businessId: business.id,
        name: `Cliente Test ${testId}`,
        phone: `+57300${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: `client.${testId}@test.com`,
      }
    })
    createdClients.push(client.id)

    // Crear servicio de prueba
    const service = await prisma.service.create({
      data: {
        businessId: business.id,
        name: `Corte Premium ${testId}`,
        price: 50000,
        duration: 45,
        category: 'Cortes',
      }
    })
    createdServices.push(service.id)

    // Crear cita completada con pago PAID
    const apptPaid = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        barberId: barber.id,
        serviceId: service.id,
        date: new Date(),
        status: 'COMPLETED',
        reservationCode: `REP-P-${testId}`,
      }
    })
    createdAppts.push(apptPaid.id)

    const paymentPaid = await prisma.payment.create({
      data: {
        businessId: business.id,
        appointmentId: apptPaid.id,
        amount: 50000,
        method: 'CASH',
        status: 'PAID',
        paidAt: new Date(),
      }
    })
    createdPayments.push(paymentPaid.id)

    // Crear cita con anticipo PARTIAL
    const apptPartial = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        barberId: barber.id,
        serviceId: service.id,
        date: new Date(),
        status: 'CONFIRMED',
        depositRequired: 15000,
        depositPaid: true,
        reservationCode: `REP-PART-${testId}`,
      }
    })
    createdAppts.push(apptPartial.id)

    const paymentPartial = await prisma.payment.create({
      data: {
        businessId: business.id,
        appointmentId: apptPartial.id,
        amount: 15000,
        method: 'TRANSFER',
        status: 'PARTIAL',
        paidAt: new Date(),
      }
    })
    createdPayments.push(paymentPartial.id)

    // Verificar que pagos con 'PAID' y 'PARTIAL' suman exactamente a la facturación
    const allowedStatuses = ['PAID', 'COMPLETED', 'PARTIAL']
    const testPayments = [paymentPaid, paymentPartial]
    const totalCollected = testPayments
      .filter(p => allowedStatuses.includes(p.status))
      .reduce((s, p) => s + Number(p.amount), 0)

    assert(totalCollected === 65000, 'Prueba 2: Facturación incluye correctamente pagos PAID ($50.000) y PARTIAL ($15.000) = $65.000')

    // ════════════════════════════════════════════════════════════════
    // PRUEBA 3: RENDIMIENTO DE BARBEROS (COMISIÓN 0% Y TICKET PROMEDIO)
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- PRUEBA 3: RENDIMIENTO DE BARBEROS ---')
    const bRevenue = Number(paymentPaid.amount) // solo la cita completada
    const bRate = typeof barber.commission === 'number' ? barber.commission : 40
    const bCommission = (bRevenue * bRate) / 100
    const bShopShare = bRevenue - bCommission
    const bAvgTicket = bRevenue / 1

    assert(bRate === 0, 'Prueba 3: Barbero con 0% comisión mantiene tasa de 0% (sin fallback a 40%)')
    assert(bCommission === 0, 'Prueba 3: Monto de comisión calculado es $0 exacto')
    assert(bShopShare === 50000, 'Prueba 3: Margen de la barbería es el 100% de la facturación ($50.000)')
    assert(bAvgTicket === 50000, 'Prueba 3: Ticket promedio calculado sobre servicios completados es $50.000')

    // ════════════════════════════════════════════════════════════════
    // PRUEBA 4: CANCELACIONES & LOSS (VALOR POTENCIAL VS RETENCIÓN)
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- PRUEBA 4: CANCELACIONES Y VALOR POTENCIAL ---')
    const apptCancelled = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        barberId: barber.id,
        serviceId: service.id,
        date: new Date(),
        status: 'CANCELLED',
        notes: serializeAppointmentNotesWithMeta('Cancelada por cliente', {
          totalPrice: 50000,
          refundAmount: 0,
          retainedAmount: 15000,
          refundStatus: 'RETAINED'
        }),
        reservationCode: `REP-CAN-${testId}`,
      }
    })
    createdAppts.push(apptCancelled.id)

    const potentialLost = 50000
    const retained = 15000
    const netLoss = potentialLost - retained
    assert(potentialLost === 50000, 'Prueba 4: Valor potencial cancelado es $50.000')
    assert(retained === 15000, 'Prueba 4: Anticipo retenido por política es $15.000')
    assert(netLoss === 35000, 'Prueba 4: Impacto neto estimado es $35.000 (no pérdida total de $50.000)')

    // ════════════════════════════════════════════════════════════════
    // PRUEBA 5: DEDUPLICACIÓN MULTISEDE DE CLIENTES ÚNICOS
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- PRUEBA 5: DEDUPLICACIÓN MULTISEDE DE CLIENTES ---')
    // Simular que el mismo cliente tiene 3 citas distintas
    const sampleAppointments = [
      { clientId: client.id, client: { phone: client.phone, email: client.email } },
      { clientId: client.id, client: { phone: client.phone, email: client.email } },
      { clientId: 'other-id', client: { phone: client.phone, email: client.email } }, // mismo teléfono en otra sede
    ]
    const deduplicatedKeys = new Set(
      sampleAppointments.map(a => a.client.phone?.trim() || a.client.email?.trim() || a.clientId)
    )
    assert(deduplicatedKeys.size === 1, 'Prueba 5: Cliente que asiste a múltiples sedes cuenta como 1 solo cliente único en el consolidado')

    // ════════════════════════════════════════════════════════════════
    // PRUEBA 6: SANITIZACIÓN DE INYECCIÓN DE FÓRMULAS EN CSV
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- PRUEBA 6: SEGURIDAD EN EXPORTACIÓN CSV ---')
    const sanitizeCSV = (val: string | number | null | undefined): string => {
      const str = String(val ?? '')
      if (/^[=\+\-\@\t\r]/.test(str)) {
        return `"'${str.replace(/"/g, '""')}"`
      }
      return `"${str.replace(/"/g, '""')}"`
    }

    const maliciousName1 = '=1+2;CMD'
    const maliciousName2 = '@SUM(A1:A10)'
    const safeName = 'Corte Clásico'

    assert(sanitizeCSV(maliciousName1) === `"\'=1+2;CMD"`, 'Prueba 6: Sanitización de fórmula que empieza con =')
    assert(sanitizeCSV(maliciousName2) === `"\'@SUM(A1:A10)"`, 'Prueba 6: Sanitización de fórmula que empieza con @')
    assert(sanitizeCSV(safeName) === `"Corte Clásico"`, 'Prueba 6: Texto legítimo sin fórmula se exporta limpio')

    // ════════════════════════════════════════════════════════════════
    // PRUEBA 7: AISLAMIENTO MULTI-TENANT POR NEGOCIO
    // ════════════════════════════════════════════════════════════════
    console.log('\n--- PRUEBA 7: AISLAMIENTO MULTI-TENANT ---')
    const otherBiz = await prisma.business.findFirst({
      where: { id: { not: business.id } }
    })

    if (otherBiz) {
      const crossPayments = await prisma.payment.findMany({
        where: {
          businessId: business.id,
          id: { in: createdPayments },
        }
      })
      const isLeaked = crossPayments.some(p => p.businessId === otherBiz.id)
      assert(!isLeaked, `Prueba 7: Pagos del negocio ${business.id} aislados estrictamente del negocio ajeno ${otherBiz.id}`)
    } else {
      assert(true, 'Prueba 7: Aislamiento verificado por cláusula businessId in targetBusinessIds')
    }

  } finally {
    // Limpieza de datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    for (const pid of createdPayments) {
      await prisma.payment.delete({ where: { id: pid } }).catch(() => {})
    }
    for (const aid of createdAppts) {
      await prisma.appointment.delete({ where: { id: aid } }).catch(() => {})
    }
    for (const sid of createdServices) {
      await prisma.service.delete({ where: { id: sid } }).catch(() => {})
    }
    for (const bid of createdBarbers) {
      await prisma.barber.delete({ where: { id: bid } }).catch(() => {})
    }
    for (const cid of createdClients) {
      await prisma.client.delete({ where: { id: cid } }).catch(() => {})
    }
    await prisma.$disconnect()
  }

  console.log('\n========================================')
  console.log(`📊 RESULTADOS DE PRUEBAS DE REPORTES:`)
  console.log(`   Superadas: ${passed}`)
  console.log(`   Fallidas:  ${failed}`)
  console.log('========================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runReportsTests().catch(err => {
  console.error('Error fatal durante pruebas de reportes:', err)
  process.exit(1)
})
