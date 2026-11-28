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
      if (metaAppSecret) {
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
      } else {
        console.warn('[Meta Webhook] META_APP_SECRET no configurado en variables de entorno — procesando webhook de Meta')
      }

      // Procesar entradas del webhook
      const entries = body.entry || []
      for (const entry of entries) {
        const changes = entry.changes || []
        for (const change of changes) {
          const value = change.value || {}
          const phoneNumberId = value.metadata?.phone_number_id
          const displayPhoneNumber = value.metadata?.display_phone_number

          // ── A. Eventos de Estado de Plantillas de Meta (message_template_status_update) ──
          if (change.field === 'message_template_status_update' || value.event) {
            const templateId = value.message_template_id
            const templateName = value.message_template_name
            const eventStatus = value.event // 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'
            const reason = value.reason || null
            const wabaId = entry.id

            console.log(`[Meta Webhook] Actualización de plantilla: ${templateName} -> ${eventStatus} (WABA: ${wabaId})`)

            if (wabaId && templateName) {
              try {
                const affectedIntegrations = await prisma.whatsAppIntegration.findMany({
                  where: { metaWabaId: wabaId }
                })

                for (const integ of affectedIntegrations) {
                  const currentData = (integ.metaTemplatesData as Record<string, any>) || {}
                  currentData[templateName] = {
                    ...(currentData[templateName] || {}),
                    id: templateId || currentData[templateName]?.id,
                    name: templateName,
                    status: eventStatus,
                    rejectedReason: reason,
                    lastUpdated: new Date().toISOString()
                  }

                  await prisma.whatsAppIntegration.update({
                    where: { id: integ.id },
                    data: {
                      metaTemplatesData: currentData,
                      templatesLastSyncedAt: new Date()
                    }
                  })
                }
              } catch (tplErr) {
                console.error('[Meta Webhook] Error actualizando estado de plantilla:', tplErr)
              }
            }
            continue
          }

          // ── B. Manejo de Estados de Mensaje (Statuses: sent, delivered, read, failed) ──
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

          // ── C. Manejo de Coexistencia: Respuestas directas del barbero desde la app móvil (Echoes) ──
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

          // ── D. Manejo de Mensajes Entrantes de Clientes (Botones, Opt-Out y Texto) ──
          if (value.messages && Array.isArray(value.messages) && value.messages.length > 0 && phoneNumberId) {
            const integration = await prisma.whatsAppIntegration.findFirst({
              where: { metaPhoneNumberId: phoneNumberId },
              include: { business: true }
            })

            if (integration && integration.isEnabled) {
              const allowedByPlan = await canUseWhatsApp(integration.businessId)

              for (const message of value.messages) {
                const from = message.from // Número del cliente
                const cleanFrom = from ? from.replace(/\D/g, '') : ''
                const buttonPayload = message.button?.payload || message.interactive?.button_reply?.id || ''
                const buttonText = message.button?.text || message.interactive?.button_reply?.title || ''
                const messageText = message.text?.body || buttonText || message.interactive?.list_reply?.title || ''
                const messageId = message.id
                const senderName = value.contacts?.[0]?.profile?.name

                // Si es un echo donde el remitente es el propio número de la barbería
                const cleanPhone = displayPhoneNumber ? displayPhoneNumber.replace(/\D/g, '') : null
                if (cleanPhone && cleanFrom === cleanPhone) {
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

                if (!cleanFrom) continue

                // 1. Refrescar la ventana de 24 horas del cliente
                await prisma.whatsAppConversation.upsert({
                  where: {
                    businessId_customerPhone: {
                      businessId: integration.businessId,
                      customerPhone: cleanFrom
                    }
                  },
                  update: {
                    lastActivityAt: new Date(),
                    lastCustomerMessageAt: new Date()
                  },
                  create: {
                    businessId: integration.businessId,
                    customerPhone: cleanFrom,
                    lastActivityAt: new Date(),
                    lastCustomerMessageAt: new Date()
                  }
                })

                // 2. Control de Consentimiento y Opt-Out (STOP / BAJA / ALTA)
                const upperText = (messageText || '').trim().toUpperCase()
                const optOutKeywords = ['STOP', 'BAJA', 'CANCELAR MENSAJES', 'DEJAR DE RECIBIR MENSAJES', 'NO MAS MENSAJES', 'DESUSCRIBIR']
                const optInKeywords = ['ALTA', 'ACTIVAR', 'REANUDAR MENSAJES', 'START']

                if (optOutKeywords.includes(upperText)) {
                  await prisma.client.updateMany({
                    where: {
                      businessId: integration.businessId,
                      phone: { contains: cleanFrom.slice(-10) }
                    },
                    data: {
                      whatsappConsent: false,
                      whatsappOptOutAt: new Date()
                    }
                  })

                  const { WhatsAppService } = await import('@/lib/whatsapp/whatsapp-service')
                  await WhatsAppService.sendDirectMessage({
                    businessId: integration.businessId,
                    to: cleanFrom,
                    text: `Has sido dado de baja de las notificaciones automáticas por WhatsApp de *${integration.business.name}*. No recibirás más recordatorios de citas. Para reactivar las notificaciones en cualquier momento, responde con la palabra *ALTA*.`,
                    tag: 'OPT_OUT_CONFIRMATION'
                  })
                  continue
                }

                if (optInKeywords.includes(upperText)) {
                  await prisma.client.updateMany({
                    where: {
                      businessId: integration.businessId,
                      phone: { contains: cleanFrom.slice(-10) }
                    },
                    data: {
                      whatsappConsent: true,
                      whatsappOptOutAt: null
                    }
                  })

                  const { WhatsAppService } = await import('@/lib/whatsapp/whatsapp-service')
                  await WhatsAppService.sendDirectMessage({
                    businessId: integration.businessId,
                    to: cleanFrom,
                    text: `✅ ¡Perfecto! Has reactivado las notificaciones por WhatsApp de *${integration.business.name}*. Volverás a recibir confirmaciones y recordatorios de tus citas.`,
                    tag: 'OPT_IN_CONFIRMATION'
                  })
                  continue
                }

                // 3. Control de Confirmación de Cancelación Pendiente (Segundo Paso Obligatorio)
                const conversationRecord = await prisma.whatsAppConversation.findUnique({
                  where: {
                    businessId_customerPhone: {
                      businessId: integration.businessId,
                      customerPhone: cleanFrom
                    }
                  }
                })

                const convMetadata = (conversationRecord?.metadata as Record<string, any>) || {}
                const pendingCancelApptId = convMetadata?.pendingCancelAppointmentId

                if (pendingCancelApptId) {
                  const { WhatsAppService } = await import('@/lib/whatsapp/whatsapp-service')
                  const { getPublicPageUrl } = await import('@/lib/url')
                  const bookingUrl = getPublicPageUrl(integration.business.slug)

                  if (upperText === 'CONFIRMAR CANCELAR' || upperText === 'SI CANCELAR' || buttonPayload === `CONFIRM_CANCEL_${pendingCancelApptId}`) {
                    const apptToCancel = await prisma.appointment.findFirst({
                      where: { id: pendingCancelApptId, businessId: integration.businessId },
                      include: { client: true, barber: true }
                    })

                    if (apptToCancel) {
                      if (apptToCancel.status === 'CANCELLED') {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ Esta cita ya se encuentra cancelada.`,
                          appointmentId: apptToCancel.id,
                          tag: 'BUTTON_ALREADY_CANCELLED'
                        })
                      } else if (apptToCancel.status === 'COMPLETED' || new Date(apptToCancel.date).getTime() < Date.now()) {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ Esta cita ya pasó o fue completada. No es posible cancelarla.`,
                          appointmentId: apptToCancel.id,
                          tag: 'CANCEL_REJECTED_PAST_OR_COMPLETED'
                        })
                      } else {
                        await prisma.appointment.update({
                          where: { id: apptToCancel.id },
                          data: { status: 'CANCELLED' }
                        })

                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `❌ Tu cita con *${apptToCancel.barber?.name || 'tu barbero'}* ha sido cancelada exitosamente. Si deseas volver a agendar en el futuro, puedes hacerlo cuando desees en:\n${bookingUrl}`,
                          appointmentId: apptToCancel.id,
                          tag: 'BUTTON_CANCEL_CONFIRMED'
                        })
                      }
                    }

                    // Limpiar estado pendiente de cancelación
                    const { pendingCancelAppointmentId: _, ...restMeta } = convMetadata
                    if (conversationRecord) {
                      await prisma.whatsAppConversation.update({
                        where: { id: conversationRecord.id },
                        data: { metadata: restMeta }
                      })
                    }
                    continue
                  } else if (upperText === 'NO' || upperText === 'CANCELAR NO' || upperText === 'MANTENER') {
                    const { pendingCancelAppointmentId: _, ...restMeta } = convMetadata
                    if (conversationRecord) {
                      await prisma.whatsAppConversation.update({
                        where: { id: conversationRecord.id },
                        data: { metadata: restMeta }
                      })
                    }

                    await WhatsAppService.sendDirectMessage({
                      businessId: integration.businessId,
                      to: cleanFrom,
                      text: `✅ Entendido. Tu cita se mantiene programada sin cambios. ¡Te esperamos puntualmente en *${integration.business.name}*!`,
                      tag: 'CANCEL_ABORTED'
                    })
                    continue
                  }
                }

                // 4. Procesamiento de Clics en Botones Nativos de Plantillas Oficiales
                if (buttonPayload) {
                  const { WhatsAppService } = await import('@/lib/whatsapp/whatsapp-service')
                  const { getPublicPageUrl } = await import('@/lib/url')
                  const bookingUrl = getPublicPageUrl(integration.business.slug)

                  // A) Botón: "Sí, asistiré"
                  if (buttonPayload.startsWith('CONFIRM_')) {
                    const appointmentId = buttonPayload.replace('CONFIRM_', '').trim()
                    const appt = await prisma.appointment.findFirst({
                      where: {
                        id: appointmentId,
                        businessId: integration.businessId
                      },
                      include: { client: true, barber: true, service: true, business: true }
                    })

                    if (appt) {
                      const nowMs = Date.now()
                      const apptDateMs = new Date(appt.date).getTime()

                      if (appt.status === 'COMPLETED') {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ Esta cita ya figura como completada y finalizada.`,
                          appointmentId: appt.id,
                          tag: 'BUTTON_CONFIRM_ALREADY_COMPLETED'
                        })
                      } else if (apptDateMs < nowMs) {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ El horario programado para esta cita ya pasó. No es posible modificar su estado.`,
                          appointmentId: appt.id,
                          tag: 'BUTTON_CONFIRM_EXPIRED_DATE'
                        })
                      } else if (appt.status === 'CANCELLED') {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ Esta cita fue cancelada previamente y no puede ser confirmada. Si deseas agendar un nuevo horario, ingresa aquí:\n${bookingUrl}`,
                          appointmentId: appt.id,
                          tag: 'BUTTON_CONFIRM_ALREADY_CANCELLED'
                        })
                      } else if (appt.clientConfirmedAttendance) {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ Tu asistencia a esta cita ya se encuentra confirmada. ¡Te esperamos!`,
                          appointmentId: appt.id,
                          tag: 'BUTTON_ALREADY_CONFIRMED'
                        })
                      } else {
                        // Confirmar asistencia de forma idempotente
                        await prisma.appointment.update({
                          where: { id: appt.id },
                          data: {
                            status: 'CONFIRMED',
                            clientConfirmedAttendance: true,
                            confirmedViaWhatsAppAt: new Date()
                          }
                        })

                        const { formattedDate, formattedTime } = WhatsAppService.formatDateTime(new Date(appt.date))
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `✅ ¡Excelente, *${appt.client?.name || 'Cliente'}*! Tu asistencia a la cita del *${formattedDate}* a las *${formattedTime}* con *${appt.barber?.name || 'tu barbero'}* ha sido confirmada con éxito. 💈✂️\n\n¡Te esperamos puntualmente en *${integration.business.name}*!`,
                          appointmentId: appt.id,
                          tag: 'BUTTON_CONFIRM_ATTENDANCE'
                        })
                      }
                    }
                    continue
                  }

                  // B) Botón: "Reprogramar cita"
                  if (buttonPayload.startsWith('RESCHEDULE_')) {
                    const appointmentId = buttonPayload.replace('RESCHEDULE_', '').trim()
                    const appt = await prisma.appointment.findFirst({
                      where: { id: appointmentId, businessId: integration.businessId }
                    })

                    if (appt && appt.status === 'CANCELLED') {
                      await WhatsAppService.sendDirectMessage({
                        businessId: integration.businessId,
                        to: cleanFrom,
                        text: `ℹ️ Esta cita se encuentra cancelada. Si deseas agendar un nuevo horario en nuestra agenda digital, ingresa aquí:\n${bookingUrl}`,
                        appointmentId,
                        tag: 'RESCHEDULE_ON_CANCELLED'
                      })
                    } else if (appt && appt.status === 'COMPLETED') {
                      await WhatsAppService.sendDirectMessage({
                        businessId: integration.businessId,
                        to: cleanFrom,
                        text: `ℹ️ Esta cita ya fue completada. Si deseas agendar tu próximo servicio, ingresa aquí:\n${bookingUrl}`,
                        appointmentId,
                        tag: 'RESCHEDULE_ON_COMPLETED'
                      })
                    } else {
                      await WhatsAppService.sendDirectMessage({
                        businessId: integration.businessId,
                        to: cleanFrom,
                        text: `🔄 Con gusto te ayudamos a reprogramar tu cita. Puedes elegir tu nuevo horario directamente en nuestra agenda digital:\n${bookingUrl}\n\nO indícanos qué fecha y hora prefieres para verificar disponibilidad.`,
                        appointmentId,
                        tag: 'BUTTON_RESCHEDULE_REQUEST'
                      })
                    }
                    continue
                  }

                  // C) Botón: "Cancelar cita" -> Requiere confirmación adicional obligatoria
                  if (buttonPayload.startsWith('CANCEL_')) {
                    const appointmentId = buttonPayload.replace('CANCEL_', '').trim()
                    const appt = await prisma.appointment.findFirst({
                      where: {
                        id: appointmentId,
                        businessId: integration.businessId
                      },
                      include: { client: true, barber: true }
                    })

                    if (appt) {
                      const nowMs = Date.now()
                      const apptDateMs = new Date(appt.date).getTime()

                      if (appt.status === 'CANCELLED') {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ Tu cita ya se encuentra cancelada.`,
                          appointmentId: appt.id,
                          tag: 'BUTTON_ALREADY_CANCELLED'
                        })
                      } else if (appt.status === 'COMPLETED') {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ Esta cita ya figura como completada y no puede ser cancelada.`,
                          appointmentId: appt.id,
                          tag: 'CANCEL_REJECTED_COMPLETED'
                        })
                      } else if (apptDateMs < nowMs) {
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `ℹ️ El horario de esta cita ya pasó y no puede ser modificada.`,
                          appointmentId: appt.id,
                          tag: 'CANCEL_REJECTED_EXPIRED'
                        })
                      } else {
                        // Guardar en la conversación el id de la cita pendiente por confirmar cancelación
                        await prisma.whatsAppConversation.upsert({
                          where: {
                            businessId_customerPhone: {
                              businessId: integration.businessId,
                              customerPhone: cleanFrom
                            }
                          },
                          update: {
                            metadata: {
                              ...convMetadata,
                              pendingCancelAppointmentId: appt.id
                            }
                          },
                          create: {
                            businessId: integration.businessId,
                            customerPhone: cleanFrom,
                            metadata: { pendingCancelAppointmentId: appt.id }
                          }
                        })

                        const { formattedDate, formattedTime } = WhatsAppService.formatDateTime(new Date(appt.date))
                        await WhatsAppService.sendDirectMessage({
                          businessId: integration.businessId,
                          to: cleanFrom,
                          text: `⚠️ *Confirmación requerida para cancelar tu cita*\n\n¿Estás seguro de que deseas cancelar tu cita en *${integration.business.name}* para el *${formattedDate}* a las *${formattedTime}* con *${appt.barber?.name || 'tu barbero'}*?\n\n👉 Para confirmar la cancelación definitiva, responde con: *CONFIRMAR CANCELAR*\n👉 Para mantener tu cita intacta, responde con: *NO*`,
                          appointmentId: appt.id,
                          tag: 'BUTTON_CANCEL_CONFIRMATION_PROMPT'
                        })
                      }
                    }
                    continue
                  }
                }

                // 4. Procesar mensaje con el ConversationEngine si está habilitado por plan
                if (cleanFrom && messageText && allowedByPlan) {
                  WhatsAppConversationEngine.handleMessage({
                    from: cleanFrom,
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
