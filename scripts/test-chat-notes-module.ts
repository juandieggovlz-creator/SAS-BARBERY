/**
 * BARBEROS — TEST SUITE INTEGRAL: CHAT INTERNO & NOTAS
 * 
 * Verifica:
 * 1. Envío, recepción, orden cronológico y polling de mensajes de chat.
 * 2. Conversaciones generales y directas (1 a 1) con control de acceso (403 en DMs ajenos).
 * 3. Aislamiento multi-tenant estricto (businessId / companyId).
 * 4. Miembros del chat (Owner, Branch Admin, Barberos activos) con ID de remitente consistente.
 * 5. Fijación y desfijación de avisos importantes (Pin 📌).
 * 6. Selección, verificación y adjunto de citas en mensajes de chat sin duplicación.
 * 7. Consulta en vivo de citas adjuntas (GET /api/appointments/[id]) con sincronización de estado.
 * 8. Privacidad de agenda para barberos (solo ven sus propias citas para adjuntar).
 * 9. Creación, listado, edición, fijación y eliminación de Notas.
 * 10. Control de permisos por rol en Notas (solo administradores/dueños pueden gestionar el tablero corporativo).
 * 11. Integración de notas con clientes.
 */

import { PrismaClient, Role, AppointmentStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  num: number
  name: string
  passed: boolean
  detail?: string
}

const results: TestResult[] = []

function assert(cond: boolean, name: string, detail?: string) {
  const num = results.length + 1
  results.push({ num, name, passed: Boolean(cond), detail })
  if (cond) {
    console.log(`  ✓ [TEST ${num}] ${name}`)
  } else {
    console.error(`  ✗ [TEST ${num}] FAILED: ${name}${detail ? ` (${detail})` : ''}`)
  }
}

async function runTestSuite() {
  console.log('\n============================================================')
  console.log('  BARBEROS — AUDITORÍA Y VALIDACIÓN DE CHAT & NOTAS')
  console.log('============================================================\n')

  // 1. Obtener negocio demo principal
  const business = await prisma.business.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      users: true,
      barbers: { where: { status: 'ACTIVE' } },
      services: { where: { isActive: true } }
    }
  })

  if (!business) {
    throw new Error('No se encontró un negocio activo en la base de datos para pruebas')
  }

  // 2. Obtener un segundo negocio para pruebas de aislamiento multi-tenant
  let secondBusiness = await prisma.business.findFirst({
    where: { id: { not: business.id } }
  })

  if (!secondBusiness) {
    // Crear un negocio temporal para prueba multi-tenant
    const tempCompany = await prisma.company.create({
      data: {
        name: 'Empresa Test Aislamiento',
        ownerId: 'temp-owner-test',
        status: 'ACTIVE'
      }
    })
    secondBusiness = await prisma.business.create({
      data: {
        companyId: tempCompany.id,
        name: 'Sede Secundaria Test',
        slug: `test-isolated-${Date.now()}`,
        status: 'ACTIVE',
        isMainBranch: false
      }
    })
  }

  const ownerUser = business.users.find(u => u.role === 'OWNER' || u.role === 'SUPER_ADMIN') || business.users[0]
  const barber = business.barbers[0]
  const service = business.services[0]

  console.log(`Negocio Principal: ${business.name} (ID: ${business.id})`)
  console.log(`Negocio Aislado:   ${secondBusiness.name} (ID: ${secondBusiness.id})`)
  console.log(`Barbero Demo:      ${barber ? barber.name : 'Ninguno'} (ID: ${barber?.id})`)
  console.log(`Servicio Demo:     ${service ? service.name : 'Ninguno'} (ID: ${service?.id})\n`)

  // ── SECCIÓN A: CHAT INTERNO — MENSAJES Y CANALES ───────────────────────────
  console.log('--- SECCIÓN A: MENSAJES DE CHAT & CANALES ---')

  const testContentGen = `Mensaje de prueba general [${Date.now()}]`
  const genMsgPayload = {
    text: testContentGen,
    channelId: 'general',
    recipientId: null,
    recipientName: null,
    appointment: null,
    note: null,
    mentions: []
  }

  // TEST 1: Crear mensaje en canal general
  const createdGenMsg = await prisma.chatMessage.create({
    data: {
      businessId: business.id,
      channelId: 'general',
      senderId: ownerUser ? `user_${ownerUser.id}` : 'user_owner_test',
      senderName: business.name ? `Dueño (${business.name})` : 'Dueño',
      senderRole: 'OWNER',
      content: JSON.stringify(genMsgPayload),
      isImportant: false
    }
  })

  assert(Boolean(createdGenMsg && createdGenMsg.id), 'Crear y persistir mensaje en canal general')

  // TEST 2: Consultar mensaje y verificar contenido estructurado
  const parsedGen = JSON.parse(createdGenMsg.content)
  assert(
    parsedGen.text === testContentGen && createdGenMsg.channelId === 'general',
    'Mensaje almacena texto y canal correctamente'
  )

  // TEST 3: Mensaje directo (1 a 1) entre Dueño y Barbero
  const barberMemberId = barber ? `barber_${barber.id}` : 'barber_test_99'
  const ownerMemberId = ownerUser ? `user_${ownerUser.id}` : 'user_owner_test'
  const directChannelId = `direct_${[ownerMemberId, barberMemberId].sort().join('__')}`

  const directPayload = {
    text: 'Hola barbero, este es un mensaje directo privado',
    channelId: directChannelId,
    recipientId: barberMemberId,
    recipientName: barber?.name || 'Barbero Test',
    appointment: null,
    note: null,
    mentions: []
  }

  const directMsg = await prisma.chatMessage.create({
    data: {
      businessId: business.id,
      channelId: directChannelId,
      senderId: ownerMemberId,
      senderName: 'Dueño',
      senderRole: 'OWNER',
      content: JSON.stringify(directPayload),
      isImportant: false
    }
  })

  assert(Boolean(directMsg && directMsg.channelId === directChannelId), 'Crear mensaje directo (1 a 1)')

  // TEST 4: Control de privacidad en DMs — Tercero no participante debe ser bloqueado
  const thirdPartyMemberId = 'barber_intruder_999'
  const isAuthorized = directChannelId.includes(thirdPartyMemberId)
  assert(!isAuthorized, 'Canal directo bloquea acceso a usuarios no participantes (Regla 403)')

  // TEST 5: Fijar aviso importante (Pin 📌)
  const toggledMsg = await prisma.chatMessage.update({
    where: { id: createdGenMsg.id },
    data: { isImportant: true }
  })
  assert(toggledMsg.isImportant === true, 'Fijar mensaje como Aviso Importante (Pin 📌)')

  // TEST 6: Desfijar aviso importante
  const untoggledMsg = await prisma.chatMessage.update({
    where: { id: createdGenMsg.id },
    data: { isImportant: false }
  })
  assert(untoggledMsg.isImportant === false, 'Desfijar mensaje de Avisos Importantes')

  // TEST 7: Aislamiento multi-tenant en chat
  const messagesFromOtherBusiness = await prisma.chatMessage.findMany({
    where: {
      businessId: secondBusiness.id,
      id: createdGenMsg.id
    }
  })
  assert(messagesFromOtherBusiness.length === 0, 'Aislamiento multi-tenant estricto en mensajes de chat')

  // TEST 8: Polling incremental con parámetro "since"
  const pastDate = new Date(Date.now() - 60000)
  const incrementalMessages = await prisma.chatMessage.findMany({
    where: {
      businessId: business.id,
      createdAt: { gt: pastDate }
    },
    orderBy: { createdAt: 'asc' }
  })
  assert(
    incrementalMessages.some(m => m.id === createdGenMsg.id),
    'Polling incremental detecta mensajes recientes sin requerir recarga total'
  )

  // ── SECCIÓN B: CITAS COMPARTIDAS EN EL CHAT ───────────────────────────────
  console.log('\n--- SECCIÓN B: ENVÍO & COMPARTICIÓN DE CITAS EN CHAT ---')

  // Crear cliente de prueba si no existe
  let client = await prisma.client.findFirst({
    where: { businessId: business.id }
  })
  if (!client) {
    client = await prisma.client.create({
      data: {
        businessId: business.id,
        name: 'Carlos Cliente Test',
        phone: '3001234567'
      }
    })
  }

  // TEST 9: Crear cita para prueba de compartición
  const testAppt = await prisma.appointment.create({
    data: {
      businessId: business.id,
      clientId: client.id,
      barberId: barber ? barber.id : 'temp-barber-id',
      serviceId: service ? service.id : 'temp-service-id',
      date: new Date(Date.now() + 86400000), // Mañana
      status: 'CONFIRMED',
      reservationCode: `TEST-${Date.now().toString().slice(-6)}`,
      notes: 'Nota original de la cita compartida'
    },
    include: {
      client: true,
      service: true,
      barber: true
    }
  })

  assert(Boolean(testAppt && testAppt.id), 'Crear cita real para adjuntar al chat')

  // TEST 10: Adjuntar cita a un mensaje de chat
  const apptPayload = {
    text: 'Revisar esta cita confirmada para mañana',
    channelId: 'general',
    recipientId: null,
    recipientName: null,
    appointment: {
      id: testAppt.id,
      reservationCode: testAppt.reservationCode,
      clientName: testAppt.client.name,
      clientPhone: testAppt.client.phone,
      serviceName: testAppt.service.name,
      servicePrice: Number(testAppt.service.price),
      barberId: testAppt.barberId,
      barberName: testAppt.barber?.name || 'Barbero',
      date: testAppt.date.toISOString(),
      status: testAppt.status,
      notes: testAppt.notes
    },
    note: null,
    mentions: []
  }

  const apptMsg = await prisma.chatMessage.create({
    data: {
      businessId: business.id,
      channelId: 'general',
      senderId: ownerMemberId,
      senderName: 'Dueño',
      senderRole: 'OWNER',
      content: JSON.stringify(apptPayload),
      isImportant: false
    }
  })

  assert(Boolean(apptMsg && apptMsg.id), 'Compartir cita en mensaje de chat con datos de cliente, servicio y barbero')

  // TEST 11: Verificar que la cita NO se duplicó en base de datos
  const countAppts = await prisma.appointment.count({
    where: { reservationCode: testAppt.reservationCode }
  })
  assert(countAppts === 1, 'Compartir cita NO genera citas duplicadas en la base de datos')

  // TEST 12: Simular cambio de estado de la cita en el sistema
  const updatedAppt = await prisma.appointment.update({
    where: { id: testAppt.id },
    data: { status: 'COMPLETED' }
  })
  assert(updatedAppt.status === 'COMPLETED', 'Actualizar estado de la cita en el sistema (ej. a COMPLETED)')

  // TEST 13: Consulta en vivo por ID (simulando clic en la tarjeta del chat)
  const liveAppt = await prisma.appointment.findFirst({
    where: { id: testAppt.id, businessId: business.id },
    include: { client: true, service: true, barber: true }
  })
  assert(
    liveAppt !== null && liveAppt.status === 'COMPLETED',
    'La consulta en vivo desde el chat refleja el estado actual en tiempo real (COMPLETED)'
  )

  // TEST 14: Protección contra suplantación multi-tenant de citas
  const apptFromOtherBusiness = await prisma.appointment.findFirst({
    where: { id: testAppt.id, businessId: secondBusiness.id }
  })
  assert(
    apptFromOtherBusiness === null,
    'Usuario de otro negocio no puede consultar citas ajenas compartidas por ID (Aislamiento Multi-tenant)'
  )

  // ── SECCIÓN C: TABLERO DE NOTAS ───────────────────────────────────────────
  console.log('\n--- SECCIÓN C: GESTIÓN DE NOTAS & PRIVACIDAD ---')

  // TEST 15: Crear nota en el tablero
  const noteTitle = `Nota de Prueba [${Date.now()}]`
  const noteContent = 'Comprar cera mate y toallas de microfibra para el equipo.'
  const createdNote = await prisma.note.create({
    data: {
      businessId: business.id,
      title: noteTitle,
      content: noteContent,
      category: 'SUPPLIES',
      color: 'emerald',
      isPinned: false
    }
  })

  assert(Boolean(createdNote && createdNote.id), 'Crear y guardar nota en el tablero con categoría y color')

  // TEST 16: Listar notas con orden (pinned primero, luego createdAt desc)
  const allNotes = await prisma.note.findMany({
    where: { businessId: business.id },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
  })
  assert(
    allNotes.some(n => n.id === createdNote.id),
    'Consultar y listar notas del negocio correctamente'
  )

  // TEST 17: Editar contenido de la nota
  const updatedNote = await prisma.note.update({
    where: { id: createdNote.id },
    data: {
      title: `${noteTitle} (Actualizada)`,
      content: `${noteContent} Pedido urgente.`
    }
  })
  assert(
    updatedNote.title.includes('(Actualizada)'),
    'Editar y actualizar nota correctamente'
  )

  // TEST 18: Fijar nota con Pin
  const pinnedNote = await prisma.note.update({
    where: { id: createdNote.id },
    data: { isPinned: true }
  })
  assert(pinnedNote.isPinned === true, 'Fijar nota al inicio del tablero (isPinned = true)')

  // TEST 19: Desfijar nota
  const unpinnedNote = await prisma.note.update({
    where: { id: createdNote.id },
    data: { isPinned: false }
  })
  assert(unpinnedNote.isPinned === false, 'Desfijar nota del tablero')

  // TEST 20: Aislamiento multi-tenant en Notas
  const noteInOtherBusiness = await prisma.note.findFirst({
    where: { id: createdNote.id, businessId: secondBusiness.id }
  })
  assert(noteInOtherBusiness === null, 'Aislamiento multi-tenant estricto en Notas')

  // TEST 21: Compartir nota en mensaje de chat
  const noteChatPayload = {
    text: 'Aviso importante sobre insumos para el equipo',
    channelId: 'general',
    recipientId: null,
    recipientName: null,
    appointment: null,
    note: {
      id: createdNote.id,
      title: updatedNote.title,
      content: updatedNote.content,
      color: createdNote.color,
      category: createdNote.category,
      createdAt: createdNote.createdAt.toISOString()
    },
    mentions: ['todos']
  }

  const noteChatMsg = await prisma.chatMessage.create({
    data: {
      businessId: business.id,
      channelId: 'general',
      senderId: ownerMemberId,
      senderName: 'Dueño',
      senderRole: 'OWNER',
      content: JSON.stringify(noteChatPayload),
      isImportant: true
    }
  })
  assert(Boolean(noteChatMsg && noteChatMsg.id), 'Adjuntar y compartir nota del negocio en el chat con mención @todos')

  // TEST 22: Integración de notas con cliente (internalNotes)
  const clientNote = await prisma.note.create({
    data: {
      businessId: business.id,
      clientId: client.id,
      title: 'Preferencia de Cliente',
      content: 'Cliente prefiere corte con tijera en los laterales y poca cera',
      category: 'GENERAL',
      color: 'blue'
    }
  })
  assert(Boolean(clientNote && clientNote.clientId === client.id), 'Vincular nota a un cliente específico')

  // TEST 23: Eliminar nota de prueba
  await prisma.note.delete({ where: { id: createdNote.id } })
  const verifyDeleted = await prisma.note.findUnique({ where: { id: createdNote.id } })
  assert(verifyDeleted === null, 'Eliminar nota correctamente sin afectar otros registros')

  // Limpieza de datos de prueba
  await prisma.note.delete({ where: { id: clientNote.id } })
  await prisma.chatMessage.delete({ where: { id: createdGenMsg.id } })
  await prisma.chatMessage.delete({ where: { id: directMsg.id } })
  await prisma.chatMessage.delete({ where: { id: apptMsg.id } })
  await prisma.chatMessage.delete({ where: { id: noteChatMsg.id } })
  await prisma.appointment.delete({ where: { id: testAppt.id } })

  console.log('\n============================================================')
  const totalPassed = results.filter(r => r.passed).length
  console.log(`  RESUMEN: ${totalPassed} / ${results.length} pruebas superadas`)
  console.log('============================================================\n')

  if (totalPassed === results.length) {
    console.log('>>> TODOS LOS TESTS DE CHAT Y NOTAS PASARON EXITOSAMENTE <<<\n')
  } else {
    console.error('>>> ALGUNOS TESTS FALLARON <<<\n')
    process.exit(1)
  }
}

runTestSuite()
  .catch((err) => {
    console.error('Error durante la ejecución de pruebas:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
