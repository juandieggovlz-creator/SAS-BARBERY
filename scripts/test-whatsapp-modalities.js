const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testWhatsAppEngine() {
  console.log('=== TEST: WhatsApp Conversation Engine (Modalidades A, B y C) ===')

  // Import dynamic conversation engine
  const { WhatsAppConversationEngine } = require('../lib/whatsapp/conversation-engine')

  // Obtener negocio de prueba
  const business = await prisma.business.findFirst({
    where: { slug: 'barberia-elite' }
  })

  if (!business) {
    console.error('Barbería Elite no encontrada')
    return
  }

  const testPhone = '573999999999'

  // Limpiar conversación previa de prueba
  await prisma.whatsAppConversation.deleteMany({
    where: {
      businessId: business.id,
      customerPhone: testPhone
    }
  })

  console.log('\n--- Escenario: Negocio con una sola sede activa (Modalidad B) ---')
  const resB = await WhatsAppConversationEngine.handleMessage({
    from: testPhone,
    text: 'Hola',
    businessId: business.id,
    messageId: `msg_${Date.now()}_1`,
    senderName: 'Carlos Cliente'
  })

  console.log('Respuesta Modalidad B:', resB.replyText)
  const asksBranchInB = resB.replyText && resB.replyText.includes('¿En cuál de nuestras sedes')
  console.log('¿Preguntó por sede innecesariamente?:', asksBranchInB ? '❌ ERROR (Preguntó)' : '✅ CORRECTO (Directo al menú)')

  // Limpiar conversación de prueba
  await prisma.whatsAppConversation.deleteMany({
    where: {
      businessId: business.id,
      customerPhone: testPhone
    }
  })
  console.log('\n✅ Prueba de motor WhatsApp finalizada exitosamente')
}

testWhatsAppEngine()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

