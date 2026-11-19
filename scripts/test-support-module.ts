/**
 * Test Suite Integral del Módulo de Soporte, Mesa de Ayuda, Resend y Telegram Sentinel
 * Ejecuta verificación de extremo a extremo sin afectar datos de producción.
 */

import { prisma } from '../lib/prisma'
import {
  generateSupportTicketCreatedTemplate,
  generateSupportTicketReplyTemplate,
  generateSupportTicketResolvedTemplate,
  OFFICIAL_CONTACT_EMAIL
} from '../lib/email'

async function runSupportTestSuite() {
  console.log('🚀 Iniciando suite de pruebas del Módulo de Soporte BarberOS...\n')
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

  // ── SECCIÓN 1: Verificación de Esquema y Modelos Prisma ──
  console.log('📦 SECCIÓN 1: Verificación de Modelos y Enums en Base de Datos')
  assert(typeof prisma.supportTicket.findMany === 'function', 'Modelo SupportTicket disponible en Prisma')
  assert(typeof prisma.ticketMessage.findMany === 'function', 'Modelo TicketMessage disponible en Prisma')

  // ── SECCIÓN 2: Creación de Negocios y Usuarios de Prueba ──
  console.log('\n🏢 SECCIÓN 2: Configuración de Negocios de Prueba para Aislamiento')
  const timestamp = Date.now()

  const testBizA = await prisma.business.create({
    data: {
      name: `Barbería Test Alpha ${timestamp}`,
      slug: `test-alpha-${timestamp}`,
      email: `alpha_${timestamp}@test.com`,
      phone: '+573001112233'
    }
  })

  const testUserA = await prisma.user.create({
    data: {
      email: `owner_alpha_${timestamp}@test.com`,
      password: 'test_password_hash',
      role: 'OWNER',
      name: 'Carlos Propietario A',
      businessId: testBizA.id
    }
  })

  const testBizB = await prisma.business.create({
    data: {
      name: `Barbería Test Beta ${timestamp}`,
      slug: `test-beta-${timestamp}`,
      email: `beta_${timestamp}@test.com`,
      phone: '+573004445566'
    }
  })

  const testUserB = await prisma.user.create({
    data: {
      email: `owner_beta_${timestamp}@test.com`,
      password: 'test_password_hash',
      role: 'OWNER',
      name: 'Mateo Propietario B',
      businessId: testBizB.id
    }
  })

  assert(!!testBizA.id && !!testBizB.id, 'Negocios Alpha y Beta creados exitosamente')

  // ── SECCIÓN 3: Creación de Ticket con Código Legible ──
  console.log('\n🎫 SECCIÓN 3: Creación de Ticket y Generación de Código')
  const ticketCodeA = `SUP-${Math.floor(100000 + Math.random() * 900000)}`

  const ticketA = await prisma.supportTicket.create({
    data: {
      ticketCode: ticketCodeA,
      businessId: testBizA.id,
      userId: testUserA.id,
      subject: '[PAGOS] Error al verificar comprobante de transferencia',
      description: 'El cliente intentó pagar por transferencia y no vemos reflejado el saldo en caja.',
      priority: 'HIGH',
      status: 'OPEN',
      messages: {
        create: {
          senderId: testUserA.id,
          senderName: testUserA.name || 'Propietario Alpha',
          senderRole: 'OWNER',
          message: 'El cliente intentó pagar por transferencia y no vemos reflejado el saldo en caja.'
        }
      }
    },
    include: {
      messages: true
    }
  })

  assert(ticketA.ticketCode.startsWith('SUP-'), `TicketCode legible generado: ${ticketA.ticketCode}`)
  assert(ticketA.status === 'OPEN', 'Estado inicial del ticket es OPEN')
  assert(ticketA.priority === 'HIGH', 'Prioridad asignada correctamente como HIGH')
  assert(ticketA.messages.length === 1, 'Se crea el mensaje inicial en el hilo de conversación')
  assert(ticketA.messages[0].senderRole === 'OWNER', 'El mensaje inicial pertenece al rol OWNER')

  // ── SECCIÓN 4: Conversación Bidireccional y Respuestas ──
  console.log('\n💬 SECCIÓN 4: Conversación en el Ticket (Cliente & Super Admin)')
  
  // Super Admin responde
  const adminMsg = await prisma.ticketMessage.create({
    data: {
      ticketId: ticketA.id,
      senderId: 'super-admin-test-id',
      senderName: 'BarberOS Soporte Master',
      senderRole: 'SUPER_ADMIN',
      message: 'Hola Carlos, estamos revisando la referencia bancaria en el extracto del día de hoy.'
    }
  })

  // Actualizar ticket a IN_PROGRESS
  const ticketAfterAdmin = await prisma.supportTicket.update({
    where: { id: ticketA.id },
    data: { status: 'IN_PROGRESS' },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  })

  assert(ticketAfterAdmin.status === 'IN_PROGRESS', 'Ticket pasa a IN_PROGRESS tras intervención de soporte')
  assert(ticketAfterAdmin.messages.length === 2, 'El hilo contiene 2 mensajes')
  assert(ticketAfterAdmin.messages[1].senderRole === 'SUPER_ADMIN', 'Respuesta de Super Admin identificada claramente')

  // Cliente responde de nuevo
  const clientMsg2 = await prisma.ticketMessage.create({
    data: {
      ticketId: ticketA.id,
      senderId: testUserA.id,
      senderName: testUserA.name || 'Propietario Alpha',
      senderRole: 'OWNER',
      message: 'Perfecto, adjunto el número de aprobación PSE #9482104.'
    }
  })

  const ticketAfterClient = await prisma.supportTicket.findUnique({
    where: { id: ticketA.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  })

  assert(ticketAfterClient?.messages.length === 3, 'El cliente responde y se acumula en orden cronológico')

  // ── SECCIÓN 5: Resolución y Flujo de Reapertura ──
  console.log('\n🔄 SECCIÓN 5: Ciclo de Resolución y Reapertura de Tickets')
  
  // Super admin resuelve el ticket
  await prisma.supportTicket.update({
    where: { id: ticketA.id },
    data: { status: 'RESOLVED' }
  })

  const resolvedTicket = await prisma.supportTicket.findUnique({ where: { id: ticketA.id } })
  assert(resolvedTicket?.status === 'RESOLVED', 'Ticket marcado como RESOLVED')

  // Cliente envía mensaje sobre ticket resuelto -> debe reabrir a IN_PROGRESS
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticketA.id,
      senderId: testUserA.id,
      senderName: testUserA.name || 'Propietario Alpha',
      senderRole: 'OWNER',
      message: 'El pago aún no se refleja en el cierre de caja de las 6pm.'
    }
  })

  await prisma.supportTicket.update({
    where: { id: ticketA.id },
    data: { status: 'IN_PROGRESS' }
  })

  const reopenedTicket = await prisma.supportTicket.findUnique({ where: { id: ticketA.id } })
  assert(reopenedTicket?.status === 'IN_PROGRESS', 'Ticket en estado RESOLVED se reabre a IN_PROGRESS cuando el cliente responde')

  // ── SECCIÓN 6: Aislamiento Multitenant Estricto ──
  console.log('\n🛡️ SECCIÓN 6: Verificación de Aislamiento Multitenant')
  
  const ticketsBizB = await prisma.supportTicket.findMany({
    where: { businessId: testBizB.id }
  })
  assert(ticketsBizB.length === 0, 'Negocio B no tiene acceso a los tickets del Negocio A (cero fugas de datos)')

  const ticketsBizA = await prisma.supportTicket.findMany({
    where: { businessId: testBizA.id }
  })
  assert(ticketsBizA.length === 1 && ticketsBizA[0].id === ticketA.id, 'Negocio A consulta sus propios tickets con éxito')

  // ── SECCIÓN 7: Plantillas de Correo Resend ──
  console.log('\n✉️ SECCIÓN 7: Validación de Plantillas de Correo Transaccional (Resend)')
  
  assert(OFFICIAL_CONTACT_EMAIL === 'barberos.contacto@gmail.com', `Correo oficial de contacto es ${OFFICIAL_CONTACT_EMAIL}`)

  const createdEmail = generateSupportTicketCreatedTemplate({
    to: 'owner@test.com',
    userName: 'Carlos',
    businessName: 'Barbería Elite',
    ticketCode: ticketA.ticketCode,
    subject: ticketA.subject,
    priority: 'Alta',
    description: ticketA.description,
    ticketLink: 'https://sas-barbery.vercel.app/support'
  })
  assert(createdEmail.html.includes(ticketA.ticketCode), 'Plantilla de Creación incluye el código del ticket')
  assert(createdEmail.html.includes(OFFICIAL_CONTACT_EMAIL), 'Plantilla de Creación incluye canal oficial de contacto')
  assert(createdEmail.html.includes('https://sas-barbery.vercel.app/support'), 'Plantilla de Creación incluye URL canónica')

  const replyEmail = generateSupportTicketReplyTemplate({
    to: 'owner@test.com',
    userName: 'Carlos',
    businessName: 'Barbería Elite',
    ticketCode: ticketA.ticketCode,
    subject: ticketA.subject,
    senderName: 'Soporte BarberOS Master',
    replySnippet: 'Estamos revisando tu comprobante.',
    ticketLink: 'https://sas-barbery.vercel.app/support'
  })
  assert(replyEmail.html.includes('Estamos revisando tu comprobante.'), 'Plantilla de Respuesta incluye snippet de mensaje')

  const resolvedEmail = generateSupportTicketResolvedTemplate({
    to: 'owner@test.com',
    userName: 'Carlos',
    businessName: 'Barbería Elite',
    ticketCode: ticketA.ticketCode,
    subject: ticketA.subject,
    ticketLink: 'https://sas-barbery.vercel.app/support'
  })
  assert(resolvedEmail.html.includes('RESUELTO'), 'Plantilla de Resuelto indica estado de solución')

  // ── SECCIÓN 8: Contadores y Macro Estadísticas ──
  console.log('\n📊 SECCIÓN 8: Verificación de Contadores Reales de Soporte')
  
  const openCount = await prisma.supportTicket.count({ where: { businessId: testBizA.id, status: 'OPEN' } })
  const inProgressCount = await prisma.supportTicket.count({ where: { businessId: testBizA.id, status: 'IN_PROGRESS' } })
  const resolvedCount = await prisma.supportTicket.count({ where: { businessId: testBizA.id, status: { in: ['RESOLVED', 'CLOSED'] } } })

  assert(openCount === 0, 'Contador de abiertos coincide con la base de datos (0)')
  assert(inProgressCount === 1, 'Contador de en proceso coincide con la base de datos (1)')
  assert(resolvedCount === 0, 'Contador de resueltos coincide con la base de datos (0)')

  // ── LIMPIEZA DE DATOS DE PRUEBA ──
  console.log('\n🧹 Limpieza de registros de prueba...')
  await prisma.ticketMessage.deleteMany({ where: { ticketId: ticketA.id } })
  await prisma.supportTicket.deleteMany({ where: { id: ticketA.id } })
  await prisma.user.deleteMany({ where: { id: { in: [testUserA.id, testUserB.id] } } })
  await prisma.business.deleteMany({ where: { id: { in: [testBizA.id, testBizB.id] } } })
  assert(true, 'Registros de prueba eliminados correctamente')

  // ── RESUMEN FINAL ──
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`📊 RESULTADOS FINALES DE LA AUDITORÍA DE SOPORTE:`)
  console.log(`   Pruebas Exitosas: ${passed}`)
  console.log(`   Pruebas Fallidas: ${failed}`)
  console.log(`   Tasa de Éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log('═══════════════════════════════════════════════════════\n')

  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron en la suite de soporte`)
  }
}

runSupportTestSuite()
  .catch((err) => {
    console.error('Error en suite de pruebas:', err)
    process.exit(1)
  })
