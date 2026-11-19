import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppConversationEngine } from '@/lib/whatsapp/conversation-engine'
import { canUseWhatsApp } from '@/lib/commercial-permissions'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

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

    // Si se accede directamente desde el navegador o monitor de salud
    if (!mode && !token && !challenge) {
      return NextResponse.json({
        status: 'online',
        service: 'BarberOS WhatsApp Webhook Engine (Meta v22.0)',
        coexistenceSupported: true,
        message: 'El Webhook está activo y listo para recibir eventos de Meta WhatsApp Business Platform.',
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
 * POST: Recepción de eventos, mensajes y coexistencia (Meta Cloud API v22.0)
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

    // ── Validación de Firma Criptográfica HMAC SHA-256
    if (body.object === 'whatsapp_business_account') {
      if (!metaAppSecret) {
        console.error('[Meta Webhook] META_APP_SECRET no configurado — rechazando payload para prevenir ingesta no autenticada')
        return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 })
      }

      if (!metaSignature) {
        console.warn('[Meta Webhook] Firma HMAC ausente en cabecera x-hub-signature-256')
        return NextResponse.json({ error: 'Firma HMAC ausente' }, { status: 401 })
      }

      const hmac = crypto.createHmac('sha256', metaAppSecret)
      hmac.update(rawBody)
      const expectedSignature = `sha256=${hmac.digest('hex')}`

      if (metaSignature !== expectedSignature) {
        console.warn('[Meta Webhook] Firma HMAC inválida')
        return NextResponse.json({ error: 'Firma HMAC inválida' }, { status: 401 })
      }

      // Procesar entradas del webhook
      const entries = body.entry || []
      for (const entry of entries) {
        const changes = entry.changes || []
        for (const change of changes) {
          const value = change.value || {}
          const phoneNumberId = value.metadata?.phone_number_id
          const displayPhoneNumber = value.metadata?.display_phone_number

          // 1. Manejo de Estados de Mensaje (Statuses: sent, delivered, read, failed)
          if (value.statuses && Array.isArray(value.statuses)) {
            for (const status of value.statuses) {
              const metaMsgId = status.id
              const newStatus = status.status // 'sent' | 'delivered' | 'read' | 'failed'
              const recipientId = status.recipient_id

              if (metaMsgId) {
                let mappedStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null = null
                if (newStatus === 'delivered') mappedStatus = 'DELIVERED'
                else if (newStatus === 'read') mappedStatus = 'READ'
                else if (newStatus === 'failed') mappedStatus = 'FAILED'

                if (mappedStatus) {
                  // Actualizar log si coincide con el messageId en rawPayload
                  try {
                    await prisma.whatsAppMessageLog.updateMany({
                      where: {
                        to: recipientId ? { contains: recipientId.replace(/\D/g, '') } : undefined,
                        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                      },
                      data: {
                        status: mappedStatus
                      }
                    })
                  } catch (statusErr) {
                    console.warn('[Meta Webhook] Error al actualizar estado de entrega:', statusErr)
                  }
                }
              }
            }
          }

          // 2. Manejo de Coexistencia: Respuestas directas del barbero desde la app móvil (Echoes)
          const echoes = value.message_echoes || []
          if (echoes.length > 0 && phoneNumberId) {
            const integration = await prisma.whatsAppIntegration.findFirst({
              where: { metaPhoneNumberId: phoneNumberId }
            })

            if (integration) {
              for (const echo of echoes) {
                const customerPhone = String(echo.to || '').replace(/\D/g, '')
                if (customerPhone) {
                  console.log(`[Meta Coexistence] Barbero respondió manualmente en móvil a ${customerPhone}. Pausando bot.`)
                  await prisma.whatsAppConversation.upsert({
                    where: {
                      businessId_customerPhone: {
                        businessId: integration.businessId,
                        customerPhone
                      }
                    },
                    update: {
                      isBotActive: false,
                      isHumanAgent: true,
                      state: 'HUMAN_AGENT',
                      lastActivityAt: new Date()
                    },
                    create: {
                      businessId: integration.businessId,
                      customerPhone,
                      isBotActive: false,
                      isHumanAgent: true,
                      state: 'HUMAN_AGENT',
                      lastActivityAt: new Date()
                    }
                  })
                }
              }
            }
          }

          // 3. Manejo de Mensajes Entrantes de Clientes
          if (value.messages && Array.isArray(value.messages) && value.messages.length > 0 && phoneNumberId) {
            const integration = await prisma.whatsAppIntegration.findFirst({
              where: { metaPhoneNumberId: phoneNumberId }
            })

            if (integration && integration.isEnabled) {
              // Validar si el plan comercial permite respuestas de WhatsApp
              const allowedByPlan = await canUseWhatsApp(integration.businessId)

              for (const message of value.messages) {
                const from = message.from // Número del cliente
                const messageText = message.text?.body || message.button?.text || message.interactive?.list_reply?.id || message.interactive?.button_reply?.id || ''
                const messageId = message.id
                const senderName = value.contacts?.[0]?.profile?.name

                // Si es un echo donde el remitente es el propio número de la barbería
                const cleanPhone = displayPhoneNumber ? displayPhoneNumber.replace(/\D/g, '') : null
                if (cleanPhone && from && from.replace(/\D/g, '') === cleanPhone) {
                  // Mensaje manual enviado desde la app de WhatsApp del celular (Coexistencia)
                  const recipient = message.recipient_id ? String(message.recipient_id).replace(/\D/g, '') : ''
                  if (recipient) {
                    await prisma.whatsAppConversation.upsert({
                      where: {
                        businessId_customerPhone: {
                          businessId: integration.businessId,
                          customerPhone: recipient
                        }
                      },
                      update: {
                        isBotActive: false,
                        isHumanAgent: true,
                        state: 'HUMAN_AGENT',
                        lastActivityAt: new Date()
                      },
                      create: {
                        businessId: integration.businessId,
                        customerPhone: recipient,
                        isBotActive: false,
                        isHumanAgent: true,
                        state: 'HUMAN_AGENT',
                        lastActivityAt: new Date()
                      }
                    })
                  }
                  continue
                }

                if (from && messageText && allowedByPlan) {
                  // Procesar mensaje con el ConversationEngine guiado
                  WhatsAppConversationEngine.handleMessage({
                    from,
                    text: messageText,
                    businessId: integration.businessId,
                    messageId,
                    senderName
                  }).catch(e => console.error('[Meta Webhook] Error procesando mensaje en ConversationEngine:', e))
                }
              }
            }
          }
        }
      }

      // Meta requiere recibir 200 OK inmediatamente
      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ error: 'Formato de webhook no reconocido. Solo se admiten eventos de Meta Cloud API.' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Error procesando webhook POST WhatsApp:', error)
    return NextResponse.json({ error: 'Procesado con advertencias' }, { status: 200 })
  }
}
