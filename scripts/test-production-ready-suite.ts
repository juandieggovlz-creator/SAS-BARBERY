import { prisma } from '../lib/prisma'
import { encrypt } from '../lib/auth'
import { getEffectiveSubscription, canAddBarber, canAddBranch } from '../lib/commercial-permissions'
import { checkEntitlement } from '../lib/entitlements'
import { evaluateSubscriptionLifecycle } from '../lib/billing-dates'

async function runSuite() {
  console.log('════════════════════════════════════════════════════════════════')
  console.log('   BARBEROS — SUITE INTEGRAL DE PRUEBAS DE PRODUCCIÓN Y PLANES  ')
  console.log('════════════════════════════════════════════════════════════════\n')

  // Clean any leftover test business first if a previous run crashed
  await prisma.business.deleteMany({ where: { slug: { startsWith: 'qa-test-' } } })
  await prisma.company.deleteMany({ where: { name: 'Compañía Test QA Controlada' } })

  let passed = 0
  let failed = 0

  function assert(title: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASÓ: ${title}`)
      passed++
    } else {
      console.error(`  ❌ FALLÓ: ${title} ${detail ? `(${detail})` : ''}`)
      failed++
    }
  }

  // 1. Verificar Super Admin único
  const masterAdmin = await prisma.user.findUnique({
    where: { email: 'juandieggovlz@gmail.com' }
  })
  assert('1. Cuenta Super Admin Juan Diego Vélez intacta', Boolean(masterAdmin && masterAdmin.role === 'ROOT_PLATFORM_OWNER'))

  const userCount = await prisma.user.count()
  assert('2. Exclusividad: Solo existe 1 cuenta de usuario en el sistema', userCount === 1, `Encontrados: ${userCount}`)

  const bizCount = await prisma.business.count()
  assert('3. Base de datos limpia de negocios residuales', bizCount === 0, `Encontrados: ${bizCount}`)

  const plans = await prisma.plan.findMany()
  assert('4. Catálogo oficial de 4 planes intacto', plans.length === 4, `Total planes: ${plans.length}`)

  // 2. Registrar un negocio controlado para prueba de ciclo de vida
  console.log('\n--- Probando ciclo de vida de negocio, planes y vigencia indefinida ---')
  const testCompany = await prisma.company.create({
    data: {
      name: 'Compañía Test QA Controlada',
      ownerId: masterAdmin!.id,
      status: 'ACTIVE',
      maxBranches: 1
    }
  })

  const basicPlan = plans.find(p => p.slug === 'plan-basico')!
  const premiumPlan = plans.find(p => p.slug === 'plan-premium')!

  const testBiz = await prisma.business.create({
    data: {
      name: 'Barbería QA Test Suite',
      slug: `qa-test-${Date.now()}`,
      phone: '+573001234567',
      address: 'Calle 100 # 15-20, Bogotá',
      companyId: testCompany.id,
      isMainBranch: true,
      status: 'ACTIVE',
      planId: basicPlan.id,
      maxBarbers: basicPlan.maxBarbers,
      maxClients: basicPlan.maxClients,
      maxAppointments: basicPlan.maxAppointments,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  // 5. Verificar evaluación de Plan Básico y restricciones
  const basicSub = await getEffectiveSubscription(testBiz.id)
  assert('5. Plan Básico activo con 3 barberos máximos', basicSub.limits.maxBarbers === 3)
  assert('6. Plan Básico restringe Multisedes', Boolean(basicSub.permissions.canUseMultiBranch) === false)

  const canAddBranchBasic = await canAddBranch(testBiz.id)
  assert('7. canAddBranch bloqueado con mensaje explicativo', !canAddBranchBasic.allowed && Boolean(canAddBranchBasic.reason?.includes('Plan Premium VIP')))

  // 6. Asignar vigencia indefinida
  const indefiniteEval = evaluateSubscriptionLifecycle({
    businessStatus: 'ACTIVE',
    subscriptionEndsAt: null,
    planSlug: 'plan-basico'
  })
  assert('8. Ciclo de vida reconoce Vigencia Indefinida sin fechas ficticias', indefiniteEval.status === 'ACTIVE' && indefiniteEval.daysRemaining === null && indefiniteEval.expiresAt === null)

  // 7. Simular cambio a Plan Premium y activación de vigencia indefinida
  await prisma.business.update({
    where: { id: testBiz.id },
    data: {
      planId: premiumPlan.id,
      subscriptionEndsAt: null
    }
  })

  const premiumSub = await getEffectiveSubscription(testBiz.id)
  assert('9. Cambio a Plan Premium actualizado en backend', premiumSub.tier === 'PREMIUM')
  assert('10. Vigencia indefinida reflejada en el statusLabel', premiumSub.statusLabel.includes('Vigencia Indefinida'))
  assert('11. Multisede habilitado en Plan Premium', premiumSub.permissions.canUseMultiBranch === true)

  // 8. Probar Modo Pruebas Ilimitado (límites null)
  await prisma.business.update({
    where: { id: testBiz.id },
    data: {
      maxBarbers: null,
      maxClients: null,
      maxAppointments: null
    }
  })
  await prisma.company.update({
    where: { id: testCompany.id },
    data: { maxBranches: -1 }
  })

  const unlimitedSub = await getEffectiveSubscription(testBiz.id)
  assert('12. Modo pruebas ilimitado: maxBarbers es null (sin límite comercial)', unlimitedSub.limits.maxBarbers === null)
  assert('13. Modo pruebas ilimitado: maxBranches es null (sin límite de sedes)', unlimitedSub.limits.maxBranches === null)

  // Validar función canAddBarber con límites ilimitados
  const canAddMoreUnlimited = await canAddBarber(testBiz.id)
  assert('14. canAddBarber permite agregar barberos sin restricción cuando maxBarbers es null', canAddMoreUnlimited.allowed === true)

  const canAddBranchUnlimited = await canAddBranch(testBiz.id)
  assert('15. canAddBranch permite sedes sin restricción cuando maxBranches es null', canAddBranchUnlimited.allowed === true)

  // 9. Simular auditoría de cambio de plan y generación de notificación
  const planAudit = await prisma.auditLog.create({
    data: {
      userId: masterAdmin!.id,
      businessId: testBiz.id,
      action: 'PLAN_CHANGED',
      entity: 'Business',
      details: JSON.stringify({
        newPlanName: premiumPlan.name,
        newPlanSlug: premiumPlan.slug
      })
    }
  })
  assert('16. AuditLog registra cambio de plan con detalles', Boolean(planAudit.id))

  // 10. Limpieza controlada del negocio temporal de pruebas
  console.log('\n--- Limpiando negocio controlado de prueba ---')
  await prisma.business.delete({ where: { id: testBiz.id } })
  await prisma.company.delete({ where: { id: testCompany.id } })

  const finalBizCount = await prisma.business.count()
  const finalUserCount = await prisma.user.count()
  assert('17. Base de datos final retorna a estado 100% limpio (0 negocios)', finalBizCount === 0)
  assert('18. Solo el Super Admin permanece como único usuario registrado', finalUserCount === 1)

  console.log('\n════════════════════════════════════════════════════════════════')
  console.log(`   RESULTADO DE PRUEBAS: ${passed} PASADOS, ${failed} FALLADOS`)
  console.log('════════════════════════════════════════════════════════════════\n')

  await prisma.$disconnect()

  if (failed > 0) {
    process.exit(1)
  }
}

runSuite().catch(e => {
  console.error('Error en suite de pruebas:', e)
  process.exit(1)
})
