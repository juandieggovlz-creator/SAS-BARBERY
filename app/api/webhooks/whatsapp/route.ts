import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppConversationEngine } from '@/lib/whatsapp/conversation-engine'
import crypto from 'crypto'

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

    const defaultVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

    // Si se accede directamente desde el navegador o monitor de salud (sin filtrar secretos)
    if (!mode && !token && !challenge) {
      return NextResponse.json({
        status: 'online',
        service: 'BarberOS WhatsApp Webhook Engine',
        message: 'El Webhook está activo y listo para recibir eventos de Meta WhatsApp Business API.',
        timestamp: new Date().toISOString()
      }, { status: 200 })
    }

    let isValid = Boolean(defaultVerifyToken && mode === 'subscribe' && token === defaultVerifyToken)

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
 * POST: Recepción de eventos y mensajes entrantes (Meta Cloud API)
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const metaSignature = request.headers.get('x-hub-signature-256')
    const metaAppSecret = process.env.META_APP_SECRET

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
    }

    // ── Formato 1: Meta Cloud API Webhook Payload
    if (body.object === 'whatsapp_business_account') {
      // META_APP_SECRET MUST be set; without it every request would be accepted blindly.
      if (!metaAppSecret) {
        console.error('[Meta Webhook] META_APP_SECRET no configurado — rechazando payload para prevenir ingesta no autenticada')
        return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 })
      }

      if (!metaSignature) {
        console.warn('[Meta Webhook] Firma HMAC ausente')
        return NextResponse.json({ error: 'Firma HMAC ausente' }, { status: 401 })
      }

      const hmac = crypto.createHmac('sha256', metaAppSecret)
      hmac.update(rawBody)
      const expectedSignature = `sha256=${hmac.digest('hex')}`

      if (metaSignature !== expectedSignature) {
        console.warn('[Meta Webhook] Firma HMAC inválida')
        return NextResponse.json({ error: 'Firma HMAC inválida' }, { status: 401 })
      }

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

    return NextResponse.json({ error: 'Formato de webhook no reconocido. Solo se admiten eventos de Meta Cloud API.' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Error procesando webhook POST WhatsApp:', error)
    return NextResponse.json({ error: 'Procesado con advertencias' }, { status: 200 })
  }
}
