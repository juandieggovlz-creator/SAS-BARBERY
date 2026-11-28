import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUseWhatsApp } from '@/lib/commercial-permissions'
import { safeDecryptToken, safeEncryptToken } from '@/lib/crypto'
import {
  DEFAULT_CONFIRM_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE,
  DEFAULT_WELCOME_BOT_MESSAGE,
  WhatsAppService
} from '@/lib/whatsapp/whatsapp-service'

async function resolveTargetBusinessId(
  request: Request,
  session: { role: string; businessId: string | null; companyId?: string | null; userId: string },
  bodyBranchId?: string
) {
  if (session.role === 'BRANCH_ADMIN') {
    return session.businessId
  }

  const url = new URL(request.url)
  const branchId = bodyBranchId || url.searchParams.get('branchId')

  if (branchId) {
    if (session.role === 'SUPER_ADMIN') return branchId
    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      select: { companyId: true, company: { select: { ownerId: true } } }
    })
    if (
      branch &&
      (branch.companyId === session.companyId || branch.company?.ownerId === session.userId)
    ) {
      return branchId
    }
  }

  return session.businessId
}

export async function GET(request: Request) {
  const session = await getSession('OWNER')
  if (
    !session ||
    !session.businessId ||
    (session.role !== 'OWNER' && session.role !== 'BRANCH_ADMIN' && session.role !== 'SUPER_ADMIN')
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const businessId = await resolveTargetBusinessId(request, session)
  if (!businessId) {
    return NextResponse.json({ error: 'Sede no identificada' }, { status: 400 })
  }

  try {
    let integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId }
    })

    if (!integration) {
      integration = await prisma.whatsAppIntegration.create({
        data: {
          businessId,
          isEnabled: false,
          provider: 'NONE',
          connectionStatus: 'DISCONNECTED',
          botEnabled: false,
          bookingEnabled: true,
          allowBarberSelection: true,
          welcomeMessage: DEFAULT_WELCOME_BOT_MESSAGE,
          confirmTemplate: DEFAULT_CONFIRM_TEMPLATE,
          reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
          reminderHoursBefore: 2
        }
      })
    }

    // Verificación comercial del plan
    const allowedByPlan = await canUseWhatsApp(businessId)

    // Sincronización y normalización: si no hay credenciales o el plan no lo permite, asegurar que no aparezca conectado ni falsamente activo
    const hasCredentials = Boolean(integration.metaAccessToken || integration.baileysSessionId)
    if ((!hasCredentials || !allowedByPlan) && (integration.isEnabled || integration.connectionStatus === 'CONNECTED' || (!hasCredentials && integration.botEnabled))) {
      integration = await prisma.whatsAppIntegration.update({
        where: { businessId },
        data: {
          isEnabled: false,
          connectionStatus: 'DISCONNECTED',
          ...(!hasCredentials ? { botEnabled: false } : {})
        }
      })
    }

    // Consultar chats de WhatsApp (con estado de bot activo y atención humana)
    const conversations = await prisma.whatsAppConversation.findMany({
      where: {
        businessId
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 20
    })

    const humanConversations = conversations.filter(c => !c.isBotActive || c.isHumanAgent)

    // Logs recientes de mensajería para auditoría de entrega
    const recentLogs = await prisma.whatsAppMessageLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        to: true,
        status: true,
        messageBody: true,
        errorDetails: true,
        direction: true,
        createdAt: true
      }
    })

    // Consultar datos de la barbería
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, slug: true }
    })

    // Máscara de seguridad para token de Meta (descifrando de forma segura en memoria solo para calcular la máscara)
    const realToken = safeDecryptToken(integration.metaAccessToken)
    const maskedToken = realToken
      ? `${realToken.slice(0, 6)}••••••••${realToken.slice(-4)}`
      : null

    // DTO Seguro: Nunca enviar tokens o secretos privados de Meta en texto plano al cliente
    const {
      metaAccessToken: _rawToken,
      metaAppSecret: _rawSecret,
      ...safeIntegration
    } = integration

    return NextResponse.json({
      ...safeIntegration,
      canUseWhatsApp: allowedByPlan,
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
  const session = await getSession('OWNER')
  if (
    !session ||
    !session.businessId ||
    (session.role !== 'OWNER' && session.role !== 'BRANCH_ADMIN' && session.role !== 'SUPER_ADMIN')
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      branchId: explicitBranchId,
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
      botEnabled,
      bookingEnabled,
      allowBarberSelection,
      welcomeMessage,
      advisorMessage,
      goodbyeMessage,
      notifyBusinessOnBooking,
      notifyOnConfirmation,
      notifyOnReminder,
      notifyOnReschedule,
      notifyOnCancellation,
      confirmTemplate,
      reminderTemplate,
      reminderHoursBefore,
      resumePhone,
      pausePhone,
      manualMessage,
      customerPhone
    } = body

    const businessId = await resolveTargetBusinessId(request, session, explicitBranchId)
    if (!businessId) {
      return NextResponse.json({ error: 'Sede no identificada' }, { status: 400 })
    }

    // 1. Pausar bot para un cliente específico (Tomar chat manual)
    if (pausePhone) {
      const cleanPhone = String(pausePhone).replace(/\D/g, '')
      await prisma.whatsAppConversation.updateMany({
        where: {
          businessId,
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
          businessId,
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
        businessId,
        to: cleanPhone,
        text: manualMessage
      })

      if (!sendRes.success) {
        return NextResponse.json({ success: false, error: sendRes.error || 'Error al enviar mensaje manual' }, { status: 400 })
      }

      await prisma.whatsAppConversation.upsert({
        where: {
          businessId_customerPhone: {
            businessId,
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
          businessId,
          customerPhone: cleanPhone,
          isBotActive: false,
          isHumanAgent: true,
          state: 'HUMAN_AGENT',
          lastActivityAt: new Date()
        }
      })

      return NextResponse.json({ success: true, message: 'Mensaje enviado y bot pausado para este chat' })
    }

    // 4. Validación comercial: Solo bloquear si se intenta encender WhatsApp explícitamente sin un plan que lo incluya
    const existingIntegration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId }
    })
    const allowedByPlan = await canUseWhatsApp(businessId)

    const isTryingToEnable = isEnabled === true && (!existingIntegration || !existingIntegration.isEnabled)
    if (isTryingToEnable && session.role !== 'SUPER_ADMIN') {
      if (!allowedByPlan) {
        return NextResponse.json(
          {
            error: 'Tu plan comercial actual no incluye automatización de WhatsApp Business. Actualiza a Plan Profesional o Premium en la sección Suscripción para activarlo.'
          },
          { status: 403 }
        )
      }
    }

    // Si el plan no permite WhatsApp, asegurar que isEnabled nunca quede forzado en true
    const finalIsEnabled = isEnabled !== undefined ? (allowedByPlan ? isEnabled : false) : undefined

    // Cifrar el token de acceso si se envía uno nuevo
    const encryptedToken = metaAccessToken !== undefined && metaAccessToken !== ''
      ? safeEncryptToken(metaAccessToken.trim())
      : undefined

    const updated = await prisma.whatsAppIntegration.upsert({
      where: { businessId },
      update: {
        ...(finalIsEnabled !== undefined && { isEnabled: finalIsEnabled }),
        ...(provider !== undefined && { provider }),
        ...(connectionStatus !== undefined && { connectionStatus }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(metaPhoneNumberId !== undefined && { metaPhoneNumberId }),
        ...(metaWabaId !== undefined && { metaWabaId }),
        ...(encryptedToken !== undefined && { metaAccessToken: encryptedToken }),
        ...(metaWebhookSecret !== undefined && { metaWebhookSecret }),
        ...(metaAppId !== undefined && { metaAppId }),
        ...(metaAppSecret !== undefined && { metaAppSecret }),
        ...(botEnabled !== undefined && { botEnabled }),
        ...(bookingEnabled !== undefined && { bookingEnabled }),
        ...(allowBarberSelection !== undefined && { allowBarberSelection }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(advisorMessage !== undefined && { advisorMessage }),
        ...(goodbyeMessage !== undefined && { goodbyeMessage }),
        ...(notifyBusinessOnBooking !== undefined && { notifyBusinessOnBooking }),
        ...(notifyOnConfirmation !== undefined && { notifyOnConfirmation }),
        ...(notifyOnReminder !== undefined && { notifyOnReminder }),
        ...(notifyOnReschedule !== undefined && { notifyOnReschedule }),
        ...(notifyOnCancellation !== undefined && { notifyOnCancellation }),
        ...(confirmTemplate !== undefined && { confirmTemplate }),
        ...(reminderTemplate !== undefined && { reminderTemplate }),
        ...(reminderHoursBefore !== undefined && { reminderHoursBefore: Number(reminderHoursBefore) || 2 }),
        ...(connectionStatus === 'CONNECTED' && { connectedAt: new Date() }),
        lastSyncedAt: new Date()
      },
      create: {
        businessId,
        isEnabled: finalIsEnabled ?? false,
        provider: provider ?? 'NONE',
        connectionStatus: connectionStatus ?? 'DISCONNECTED',
        phoneNumber,
        metaPhoneNumberId,
        metaWabaId,
        metaAccessToken: encryptedToken,
        metaWebhookSecret,
        metaAppId,
        metaAppSecret,
        botEnabled: botEnabled ?? false,
        bookingEnabled: bookingEnabled ?? true,
        allowBarberSelection: allowBarberSelection ?? true,
        welcomeMessage: welcomeMessage || DEFAULT_WELCOME_BOT_MESSAGE,
        confirmTemplate: confirmTemplate || DEFAULT_CONFIRM_TEMPLATE,
        reminderTemplate: reminderTemplate || DEFAULT_REMINDER_TEMPLATE,
        reminderHoursBefore: Number(reminderHoursBefore) || 2,
        notifyBusinessOnBooking: notifyBusinessOnBooking ?? false,
        notifyOnConfirmation: notifyOnConfirmation ?? true,
        notifyOnReminder: notifyOnReminder ?? true,
        notifyOnReschedule: notifyOnReschedule ?? true,
        notifyOnCancellation: notifyOnCancellation ?? true,
        advisorMessage,
        goodbyeMessage
      }
    })

    // Sincronización automática de plantillas en segundo plano al conectar credenciales de Meta
    if (updated.isEnabled && updated.metaWabaId && updated.metaAccessToken) {
      import('@/lib/whatsapp/meta-template-manager')
        .then(({ MetaTemplateManager }) => {
          MetaTemplateManager.syncTemplatesForBusiness(businessId)
            .then(syncRes => {
              console.log(`[AutoSync Meta Templates] Sincronización automática para sede ${businessId}: ${syncRes.success ? 'EXITOSA' : 'FALLIDA'}`)
            })
            .catch(err => console.warn('[AutoSync Meta Templates] Error en sincronización automática:', err))
        })
        .catch(() => {})
    }

    return NextResponse.json({
      success: true,
      integration: {
        ...updated,
        hasMetaAccessToken: Boolean(updated.metaAccessToken),
        hasMetaAppSecret: Boolean(updated.metaAppSecret)
      }
    })
  } catch (err: unknown) {
    console.error('Error al actualizar WhatsApp integration:', err)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
