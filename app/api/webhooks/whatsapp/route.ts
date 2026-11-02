import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppConversationEngine } from '@/lib/whatsapp/conversation-engine'

/**
 * GET: Verificación de Webhook para Meta Cloud API (Facebook Developers)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')
    const businessId = searchParams.get('businessId')

    const defaultVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'barberos_secure_webhook_token_2026'

    // Si se accede directamente desde el navegador o monitor de salud
    if (!mode && !token && !challenge) {
      return NextResponse.json({
        status: 'online',
        service: 'BarberOS WhatsApp Webhook Engine',
        message: 'El Webhook está activo y listo para recibir eventos de Meta WhatsApp Business API.',
        timestamp: new Date().toISOString(),
        defaultVerifyToken
      }, { status: 200 })
    }

    let isValid = (mode === 'subscribe' && token === defaultVerifyToken)

    if (!isValid && mode === 'subscribe' && token) {
      if (businessId) {
        const customMatch = await prisma.whatsAppIntegration.findFirst({
          where: { businessId, metaWebhookSecret: token }
        })
        if (customMatch) isValid = true
      } else {
        const customMatch = await prisma.whatsAppIntegration.findFirst({
          where: { metaWebhookSecret: token }
        })
        if (customMatch) isValid = true
      }
    }

    if (isValid && challenge) {
      console.log('[Meta Webhook] Verificado exitosamente con challenge de Meta')
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    console.warn('[Meta Webhook] Intento de verificación fallido. Token recibido:', token)
    return new Response('Token de verificación inválido', { status: 403 })
  } catch (err: unknown) {
    console.error('Error en webhook GET WhatsApp:', err)
    return new Response('Error interno', { status: 500 })
  }
}

/**
 * POST: Recepción de eventos y mensajes entrantes (Meta o Baileys)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // ── Formato 1: Meta Cloud API Webhook Payload
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0]
      const change = entry?.changes?.[0]?.value

      if (change?.messages && change.messages.length > 0) {
        const message = change.messages[0]
        const from = message.from // Número del cliente
        const messageText = message.text?.body || message.button?.text || message.interactive?.list_reply?.id || message.interactive?.button_reply?.id || ''
        const phoneNumberId = change.metadata?.phone_number_id
        const messageId = message.id
        const senderName = change.contacts?.[0]?.profile?.name

        if (from && messageText && phoneNumberId) {
          // Localizar la barbería asociada a este número de Meta
          const integration = await prisma.whatsAppIntegration.findFirst({
            where: { metaPhoneNumberId: phoneNumberId }
          })

          if (integration && integration.isEnabled) {
            // Procesar con el motor conversacional guiado
            WhatsAppConversationEngine.handleMessage({
              from,
              text: messageText,
              businessId: integration.businessId,
              messageId,
              senderName
            }).catch(e => console.error('Error procesando mensaje en ConversationEngine:', e))
          }
        }
      }

      // Meta siempre requiere responder 200 OK inmediatamente
      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    // ── Formato 2: Baileys Webhook (desde microservicio o cliente Baileys)
    if (body.provider === 'BAILEYS' || body.sessionId) {
      const { from, text, businessId, messageId, senderName } = body

      if (from && text && businessId) {
        WhatsAppConversationEngine.handleMessage({
          from,
          text,
          businessId,
          messageId,
          senderName
        }).catch(e => console.error('Error procesando webhook Baileys:', e))
      }
      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error procesando webhook POST WhatsApp:', error)
    return NextResponse.json({ error: 'Procesado con advertencias' }, { status: 200 })
  }
}
