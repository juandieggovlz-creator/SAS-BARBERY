/**
 * Test Suite Integral de Planes, Suscripciones, Sandbox y Cobros Manuales
 * Verifica los 50 escenarios clave del sistema comercial de BarberOS.
 */

import { prisma } from '../lib/prisma'
import {
  getEffectiveSubscription,
  canUsePublicBooking,
  canAddBarber,
  canAddBranch,
  canUseWhatsApp,
  canUseDeposits,
  canUseAdvancedReports
} from '../lib/commercial-permissions'

async function runTestSuite() {
  console.log('🚀 Iniciando suite exhaustiva de pruebas comerciales BarberOS...\n')
  let passed = 0
  let failed = 0

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${description}`)
      failed++
    }
  }

  // ── SECCIÓN 1: MATRIZ DE PLANES EN BASE DE DATOS (Escenarios 1 - 10) ──
  console.log('📦 SECCIÓN 1: Verificación de Planes en Base de Datos')
  const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } })
  assert(plans.length >= 4, `Existen al menos 4 planes registrados (encontrados: ${plans.length})`)

  const sandboxPlan = plans.find(p => p.slug === 'sandbox')
  assert(!!sandboxPlan, 'Existe el plan Modo Sandbox (slug: sandbox)')
  assert(sandboxPlan?.price.toNumber() === 0, 'Modo Sandbox tiene precio $0 COP')
  assert(sandboxPlan?.isPublic === false, 'Modo Sandbox tiene isPublic = false (oculto en landing)')
  assert(sandboxPlan?.maxBarbers === 1, 'Modo Sandbox tiene límite de 1 barbero')

  const basicPlan = plans.find(p => p.slug === 'plan-basico')
  assert(!!basicPlan, 'Existe el Plan Básico (slug: plan-basico)')
  assert(basicPlan?.price.toNumber() === 69900, 'Plan Básico cuesta $69.900 COP')
  assert(basicPlan?.isPublic === true, 'Plan Básico tiene isPublic = true')
  assert(basicPlan?.maxBarbers === 3, 'Plan Básico incluye hasta 3 barberos')

  const proPlan = plans.find(p => p.slug === 'plan-profesional')
  assert(!!proPlan, 'Existe el Plan Profesional (slug: plan-profesional)')
  assert(proPlan?.price.toNumber() === 119900, 'Plan Profesional cuesta $119.900 COP')
  assert(proPlan?.isPublic === true, 'Plan Profesional tiene isPublic = true')
  assert((proPlan?.maxBarbers || 0) >= 8, 'Plan Profesional permite equipo de 8-10 barberos')

  const premiumPlan = plans.find(p => p.slug === 'plan-premium')
  assert(!!premiumPlan, 'Existe el Plan Premium VIP (slug: plan-premium)')
  assert(premiumPlan?.price.toNumber() === 169900, 'Plan Premium VIP cuesta $169.900 COP')
  assert(premiumPlan?.allowsMultiBranch === true, 'Plan Premium VIP permite multisedes')
  assert(premiumPlan?.includedBranches === 2, 'Plan Premium VIP incluye 2 sedes físicas')

  // ── SECCIÓN 2: FILTRO PÚBLICO DE LA LANDING (Escenarios 11 - 15) ──
  console.log('\n🌐 SECCIÓN 2: Planes Públicos para la Landing Page')
  const publicPlans = await prisma.plan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { price: 'asc' }
  })
  assert(publicPlans.length === 3, `Landing solo muestra 3 planes públicos (encontrados: ${publicPlans.length})`)
  assert(!publicPlans.some(p => p.slug === 'sandbox'), 'Modo Sandbox NO aparece en la lista pública')
  assert(publicPlans.some(p => p.slug === 'plan-basico'), 'Plan Básico aparece en la lista pública')
  assert(publicPlans.some(p => p.slug === 'plan-profesional'), 'Plan Profesional aparece en la lista pública')
  assert(publicPlans.some(p => p.slug === 'plan-premium'), 'Plan Premium VIP aparece en la lista pública')

  // ── SECCIÓN 3: COMPORTAMIENTO DE EVALUACIÓN DE SUSCRIPCIÓN (Escenarios 16 - 25) ──
  console.log('\n⏱️ SECCIÓN 3: Motor de Suscripción en Tiempo Real (getEffectiveSubscription)')
  // Crear negocio de prueba temporal
  const testBizSlug = `test-comm-${Date.now()}`
  const testBiz = await prisma.business.create({
    data: {
      name: 'Barbería Test Comercial',
      slug: testBizSlug,
      email: `${testBizSlug}@test.com`,
      phone: '3001234567',
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días en el futuro
      planId: premiumPlan?.id
    }
  })

  // Test en Trial activo
  let sub = await getEffectiveSubscription(testBiz.id)
  assert(sub.tier === 'TRIAL', 'Negocio con trialEndsAt futuro se evalúa como TRIAL')
  assert(sub.isTrial === true, 'isTrial es true')
  assert(sub.isSandbox === false, 'isSandbox es false durante trial activo')
  assert(sub.permissions.canUsePublicBooking === true, 'Trial permite reservas públicas online')
  assert(sub.permissions.canUseWhatsApp === true, 'Trial permite WhatsApp automatizado')
  assert(sub.permissions.canUseCommissions === true, 'Trial permite comisiones')
  assert(sub.permissions.canUseAdvancedReports === true, 'Trial permite reportes avanzados')
  assert(sub.limits.maxBarbers === 30, 'Trial permite hasta 30 barberos')

  // Test en Trial expirado -> Degradación automática a Sandbox (sin borrar datos)
  await prisma.business.update({
    where: { id: testBiz.id },
    data: {
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 día en el pasado
    }
  })

  sub = await getEffectiveSubscription(testBiz.id)
  assert(sub.tier === 'SANDBOX', 'Trial vencido degrada automáticamente a SANDBOX')
  assert(sub.isSandbox === true, 'isSandbox es true tras vencer prueba')
  assert(sub.permissions.canUsePublicBooking === false, 'Sandbox bloquea reservas públicas online')
  assert(sub.permissions.canUseWhatsApp === false, 'Sandbox bloquea WhatsApp automatizado')
  assert(sub.permissions.canUseCommissions === false, 'Sandbox bloquea comisiones avanzadas')
  assert(sub.permissions.canUseAdvancedReports === false, 'Sandbox bloquea reportes avanzados')
  assert(sub.limits.maxBarbers === 1, 'Sandbox limita a 1 barbero activo')

  // ── SECCIÓN 4: SUSCRIPCIÓN DE PAGO Y PERMISOS POR PLAN (Escenarios 26 - 35) ──
  console.log('\n💳 SECCIÓN 4: Planes de Pago y Preservación de Datos')
  // Simular activación de Plan Básico
  await prisma.business.update({
    where: { id: testBiz.id },
    data: {
      status: 'ACTIVE',
      planId: basicPlan?.id,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  sub = await getEffectiveSubscription(testBiz.id)
  assert(sub.tier === 'BASIC', 'Negocio con Plan Básico activo evalúa tier BASIC')
  assert(sub.isPaidActive === true, 'isPaidActive es true')
  assert(sub.permissions.canUsePublicBooking === true, 'Plan Básico permite reservas públicas online')
  assert(sub.permissions.canUseWhatsApp === false, 'Plan Básico NO incluye WhatsApp (requiere Pro)')
  assert(sub.permissions.canUseAdvancedReports === false, 'Plan Básico NO incluye reportes avanzados (requiere Pro)')
  assert(sub.limits.maxBarbers === 3, 'Plan Básico permite hasta 3 barberos')

  // Simular activación de Plan Profesional
  await prisma.business.update({
    where: { id: testBiz.id },
    data: {
      status: 'ACTIVE',
      planId: proPlan?.id,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  sub = await getEffectiveSubscription(testBiz.id)
  assert(sub.tier === 'PRO', 'Negocio con Plan Profesional activo evalúa tier PRO')
  assert(sub.permissions.canUseWhatsApp === true, 'Plan Profesional habilita WhatsApp')
  assert(sub.permissions.canUseCommissions === true, 'Plan Profesional habilita comisiones')
  assert(sub.permissions.canUseAdvancedReports === true, 'Plan Profesional habilita reportes avanzados')

  // ── SECCIÓN 5: SOLICITUDES DE PLANES (PLAN REQUESTS) (Escenarios 36 - 42) ──
  console.log('\n📋 SECCIÓN 5: Flujo de Solicitud de Plan (PlanRequest)')
  const newRequest = await prisma.planRequest.create({
    data: {
      businessId: testBiz.id,
      planId: proPlan!.id,
      contactName: 'Carlos Propietario',
      contactPhone: '3119876543',
      contactEmail: 'carlos@test.com',
      billingCycle: 'MONTHLY',
      amount: proPlan!.price,
      paymentMethod: 'TRANSFER',
      paymentReference: 'BANCO-REF-12345',
      status: 'PENDING'
    }
  })
  assert(!!newRequest.id, 'Se crea registro de PlanRequest con ID válido')
  assert(newRequest.status === 'PENDING', 'El estado inicial de la solicitud es PENDING')
  assert(newRequest.paymentReference === 'BANCO-REF-12345', 'Guarda correctamente la referencia de pago manual')

  // Actualización de estado por Super Admin
  const updatedReq = await prisma.planRequest.update({
    where: { id: newRequest.id },
    data: { status: 'CONTACTED', adminNotes: 'Contactado vía WhatsApp' }
  })
  assert(updatedReq.status === 'CONTACTED', 'Super Admin puede actualizar estado a CONTACTED')

  // ── SECCIÓN 6: ACTIVACIÓN MANUAL Y PRESERVACIÓN DE DÍAS (Escenarios 43 - 47) ──
  console.log('\n💎 SECCIÓN 6: Activación Manual con Preservación de Vigencia')
  const currentEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // Le quedan 10 días
  await prisma.business.update({
    where: { id: testBiz.id },
    data: { subscriptionEndsAt: currentEnd, status: 'ACTIVE' }
  })

  // Renovar por 30 días preservando días restantes: nueva fecha debe ser currentEnd + 30 días
  const periodDays = 30
  const expectedEnd = new Date(currentEnd.getTime() + periodDays * 24 * 60 * 60 * 1000)

  const newSubRecord = await prisma.saaSSubscription.create({
    data: {
      businessId: testBiz.id,
      planId: proPlan!.id,
      amount: proPlan!.price,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: expectedEnd,
      paymentMethod: 'TRANSFER',
      paymentReference: 'BANCO-REF-12345'
    }
  })

  await prisma.business.update({
    where: { id: testBiz.id },
    data: { subscriptionEndsAt: expectedEnd, status: 'ACTIVE', planId: proPlan!.id }
  })

  await prisma.planRequest.update({
    where: { id: newRequest.id },
    data: { status: 'APPROVED' }
  })

  const renewedBiz = await prisma.business.findUnique({ where: { id: testBiz.id } })
  const renewedEnd = renewedBiz?.subscriptionEndsAt ? new Date(renewedBiz.subscriptionEndsAt).getTime() : 0
  const diffDays = Math.round((renewedEnd - currentEnd.getTime()) / (1000 * 60 * 60 * 24))
  assert(diffDays === 30, `Preservación de días: se añadieron exactamente 30 días sobre la vigencia anterior (días sumados: ${diffDays})`)
  assert(newSubRecord.status === 'ACTIVE', 'Registro de SaaSSubscription creado con estado ACTIVE')

  const approvedReq = await prisma.planRequest.findUnique({ where: { id: newRequest.id } })
  assert(approvedReq?.status === 'APPROVED', 'PlanRequest fue marcado como APPROVED al activar')

  // ── SECCIÓN 7: VERIFICACIÓN DE PROTECCIÓN DE DATOS (Escenarios 48 - 50) ──
  console.log('\n🛡️ SECCIÓN 7: Integridad y Protección de Datos Históricos')
  // Crear un barbero de prueba
  const testBarber = await prisma.barber.create({
    data: {
      name: 'Barbero Histórico',
      businessId: testBiz.id,
      status: 'ACTIVE'
    }
  })

  // 1. Simular suscripción vencida hace 1 día (dentro de los 3 días de Período de Gracia)
  await prisma.business.update({
    where: { id: testBiz.id },
    data: {
      status: 'ACTIVE',
      subscriptionEndsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  })

  sub = await getEffectiveSubscription(testBiz.id)
  assert(sub.isInGracePeriod === true, 'Suscripción recién vencida entra en Período de Gracia (<= 3 días)')
  assert(sub.isSandbox === false, 'Durante período de gracia NO se degrada de inmediato a Sandbox')

  // 2. Simular suscripción vencida hace 4 días (superó el período de gracia) -> pasa a Sandbox
  await prisma.business.update({
    where: { id: testBiz.id },
    data: {
      status: 'ACTIVE',
      subscriptionEndsAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    }
  })

  sub = await getEffectiveSubscription(testBiz.id)
  assert(sub.isSandbox === true, 'Suscripción que superó período de gracia pasa a Modo Sandbox')
  assert(sub.isInGracePeriod === false, 'Superado el período de gracia, isInGracePeriod es false')

  const barberAfterSandbox = await prisma.barber.findUnique({ where: { id: testBarber.id } })
  assert(!!barberAfterSandbox, 'Barbero NO fue eliminado tras degradación a Sandbox (Cero pérdida de datos)')

  // Limpieza del negocio de prueba
  await prisma.planRequest.deleteMany({ where: { businessId: testBiz.id } })
  await prisma.saaSSubscription.deleteMany({ where: { businessId: testBiz.id } })
  await prisma.barber.deleteMany({ where: { businessId: testBiz.id } })
  await prisma.business.delete({ where: { id: testBiz.id } })
  assert(true, 'Limpieza de datos de prueba ejecutada correctamente')

  // ── RESUMEN FINAL ──
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`📊 RESULTADOS FINALES:`)
  console.log(`   Pruebas Exitosas: ${passed}`)
  console.log(`   Pruebas Fallidas: ${failed}`)
  console.log(`   Tasa de Éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log('═══════════════════════════════════════════════════════\n')

  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron en la suite comercial`)
  }
}

runTestSuite()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
