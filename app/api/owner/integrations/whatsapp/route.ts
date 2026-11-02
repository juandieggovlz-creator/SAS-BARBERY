import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  DEFAULT_CONFIRM_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE,
  DEFAULT_WELCOME_BOT_MESSAGE,
  WhatsAppService
} from '@/lib/whatsapp/whatsapp-service'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    let integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId: session.businessId }
    })

    if (!integration) {
      integration = await prisma.whatsAppIntegration.create({
        data: {
          businessId: session.businessId,
          isEnabled: false,
          provider: 'NONE',
          connectionStatus: 'DISCONNECTED',
          botEnabled: true,
          bookingEnabled: true,
          allowBarberSelection: true,
          welcomeMessage: DEFAULT_WELCOME_BOT_MESSAGE,
          confirmTemplate: DEFAULT_CONFIRM_TEMPLATE,
          reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
          reminderHoursBefore: 2
        }
      })
    }

    // Consultar chats de WhatsApp (con estado de bot activo y atención humana)
    const conversations = await prisma.whatsAppConversation.findMany({
      where: {
        businessId: session.businessId
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 20
    })

    const humanConversations = conversations.filter(c => !c.isBotActive || c.isHumanAgent)

    // Consultar últimos logs de mensajes
    const recentLogs = await prisma.whatsAppMessageLog.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        direction: true,
        status: true,
        provider: true,
        from: true,
        to: true,
        messageBody: true,
        errorDetails: true,
        createdAt: true
      }
    })

    // Consultar datos de la barbería
    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      select: { name: true, slug: true }
    })

    // Máscara de seguridad para token de Meta
    const maskedToken = integration.metaAccessToken
      ? `${integration.metaAccessToken.slice(0, 6)}••••••••${integration.metaAccessToken.slice(-4)}`
      : null

    // DTO Seguro: Nunca enviar tokens o secretos privados de Meta en texto plano al cliente
    const {
      metaAccessToken: _rawToken,
      metaAppSecret: _rawSecret,
      ...safeIntegration
    } = integration

    return NextResponse.json({
      ...safeIntegration,
      businessName: business?.name || 'tu Barbería',
      businessSlug: business?.slug || 'demo',
      metaAccessTokenMasked: maskedToken,
      hasMetaAccessToken: Boolean(integration.metaAccessToken),
      hasMetaAppSecret: Boolean(integration.metaAppSecret),
      conversations,
      humanConversations,
      recentLogs,
      defaultTemplates: {
        confirm: DEFAULT_CONFIRM_TEMPLATE,
        reminder: DEFAULT_REMINDER_TEMPLATE,
        welcome: DEFAULT_WELCOME_BOT_MESSAGE
      }
    })
  } catch (err: unknown) {
    console.error('Error al obtener WhatsApp integration:', err)
    return NextResponse.json({ error: 'Error al consultar integración de WhatsApp' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      isEnabled,
      provider,
      connectionStatus,
      phoneNumber,
      metaPhoneNumberId,
      metaWabaId,
      metaAccessToken,
      metaWebhookSecret,
      metaAppId,
      metaAppSecret,
      baileysEndpoint,
      botEnabled,
      bookingEnabled,
      allowBarberSelection,
      welcomeMessage,
      advisorMessage,
      goodbyeMessage,
      notifyBusinessOnBooking,
      confirmTemplate,
      reminderTemplate,
      reminderHoursBefore,
      resumePhone, // Reanudar bot para un cliente específico
      pausePhone, // Pausar bot / tomar chat para un cliente específico
      manualMessage, // Mensaje manual enviado por humano
      customerPhone
    } = body

    // 1. Pausar bot para un cliente específico (Tomar chat manual)
    if (pausePhone) {
      const cleanPhone = String(pausePhone).replace(/\D/g, '')
      await prisma.whatsAppConversation.updateMany({
        where: {
          businessId: session.businessId,
          customerPhone: cleanPhone
        },
        data: {
          isBotActive: false,
          isHumanAgent: true,
          state: 'HUMAN_AGENT',
          lastActivityAt: new Date()
        }
      })
      return NextResponse.json({ success: true, message: 'Bot pausado para este chat. Atención humana activa.' })
    }

    // 2. Reanudar bot para un cliente específico
    if (resumePhone) {
      const cleanPhone = String(resumePhone).replace(/\D/g, '')
      await prisma.whatsAppConversation.updateMany({
        where: {
          businessId: session.businessId,
          customerPhone: cleanPhone
        },
        data: {
          isBotActive: true,
          isHumanAgent: false,
          state: 'IDLE',
          lastActivityAt: new Date()
        }
      })
      return NextResponse.json({ success: true, message: 'Bot reanudado para este cliente' })
    }

    // 3. Enviar mensaje manual desde el panel y pausar el bot automáticamente
    if (manualMessage && customerPhone) {
      const cleanPhone = String(customerPhone).replace(/\D/g, '')
      const sendRes = await WhatsAppService.sendDirectMessage({
        businessId: session.businessId,
        to: cleanPhone,
        text: manualMessage
      })

      if (!sendRes.success) {
        return NextResponse.json({ success: false, error: sendRes.error || 'Error al enviar mensaje manual' }, { status: 400 })
      }

      await prisma.whatsAppConversation.upsert({
        where: {
          businessId_customerPhone: {
            businessId: session.businessId,
            customerPhone: cleanPhone
          }
        },
        update: {
          isBotActive: false,
          isHumanAgent: true,
          state: 'HUMAN_AGENT',
          lastActivityAt: new Date()
        },
        create: {
          businessId: session.businessId,
          customerPhone: cleanPhone,
          isBotActive: false,
          isHumanAgent: true,
          state: 'HUMAN_AGENT',
          lastActivityAt: new Date()
        }
      })

      return NextResponse.json({ success: true, message: 'Mensaje enviado y bot pausado para este chat' })
    }

    const updated = await prisma.whatsAppIntegration.upsert({
      where: { businessId: session.businessId },
      update: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(provider !== undefined && { provider }),
        ...(connectionStatus !== undefined && { connectionStatus }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(metaPhoneNumberId !== undefined && { metaPhoneNumberId }),
        ...(metaWabaId !== undefined && { metaWabaId }),
        ...(metaAccessToken !== undefined && metaAccessToken !== '' && { metaAccessToken }),
        ...(metaWebhookSecret !== undefined && { metaWebhookSecret }),
        ...(metaAppId !== undefined && { metaAppId }),
        ...(metaAppSecret !== undefined && { metaAppSecret }),
        ...(baileysEndpoint !== undefined && { baileysEndpoint }),
        ...(botEnabled !== undefined && { botEnabled }),
        ...(bookingEnabled !== undefined && { bookingEnabled }),
        ...(allowBarberSelection !== undefined && { allowBarberSelection }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(advisorMessage !== undefined && { advisorMessage }),
        ...(goodbyeMessage !== undefined && { goodbyeMessage }),
        ...(notifyBusinessOnBooking !== undefined && { notifyBusinessOnBooking }),
        ...(confirmTemplate !== undefined && { confirmTemplate }),
        ...(reminderTemplate !== undefined && { reminderTemplate }),
        ...(reminderHoursBefore !== undefined && { reminderHoursBefore: Number(reminderHoursBefore) || 2 }),
        ...(connectionStatus === 'CONNECTED' && { connectedAt: new Date() }),
        lastSyncedAt: new Date()
      },
      create: {
        businessId: session.businessId,
        isEnabled: isEnabled ?? false,
        provider: provider ?? 'NONE',
        connectionStatus: connectionStatus ?? 'DISCONNECTED',
        phoneNumber,
        metaPhoneNumberId,
        metaWabaId,
        metaAccessToken,
        metaWebhookSecret,
        metaAppId,
        metaAppSecret,
        baileysEndpoint,
        botEnabled: botEnabled ?? true,
        bookingEnabled: bookingEnabled ?? true,
        allowBarberSelection: allowBarberSelection ?? true,
        welcomeMessage: welcomeMessage || DEFAULT_WELCOME_BOT_MESSAGE,
        advisorMessage,
        goodbyeMessage,
        notifyBusinessOnBooking: notifyBusinessOnBooking ?? true,
        confirmTemplate: confirmTemplate || DEFAULT_CONFIRM_TEMPLATE,
        reminderTemplate: reminderTemplate || DEFAULT_REMINDER_TEMPLATE,
        reminderHoursBefore: Number(reminderHoursBefore) || 2
      }
    })

    return NextResponse.json({
      success: true,
      integration: updated
    })
  } catch (err: unknown) {
    console.error('Error al actualizar WhatsApp integration:', err)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
