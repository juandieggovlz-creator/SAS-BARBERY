import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider'
import { canUseWhatsApp } from '@/lib/commercial-permissions'
import { safeDecryptToken, safeEncryptToken } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

/**
 * GET /api/owner/integrations/whatsapp/meta/verify
 * 
 * Comprueba en vivo el estado real de la conexión de las credenciales guardadas
 * consultando la Graph API de Meta v22.0 (/v22.0/{phoneNumberId}).
 * No realiza envíos de prueba ni cobra tarifas de conversación.
 */
export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { businessId: session.businessId }
  })

  if (!integration || !integration.metaPhoneNumberId || !integration.metaAccessToken) {
    return NextResponse.json({
      valid: false,
      configured: false,
      error: 'No hay credenciales de Meta Cloud API configuradas para este negocio. Conéctate con WhatsApp Business o ingresa tus credenciales manualmente.'
    }, { status: 200 })
  }

  const decryptedToken = safeDecryptToken(integration.metaAccessToken)
  if (!decryptedToken) {
    return NextResponse.json({
      valid: false,
      configured: true,
      error: 'No se pudo descifrar el token de acceso de Meta almacenado.'
    }, { status: 400 })
  }

  const validation = await MetaCloudProvider.validateCredentials({
    phoneNumberId: integration.metaPhoneNumberId,
    accessToken: decryptedToken,
    wabaId: integration.metaWabaId || undefined
  })

  await prisma.whatsAppIntegration.update({
    where: { businessId: session.businessId },
    data: {
      connectionStatus: validation.valid ? 'CONNECTED' : 'FAILED',
      lastSyncedAt: new Date()
    }
  })

  if (!validation.valid) {
    return NextResponse.json({
      valid: false,
      configured: true,
      error: validation.error || 'Meta rechazó las credenciales almacenadas (token expirado o permisos insuficientes).'
    }, { status: 200 })
  }

  return NextResponse.json({
    valid: true,
    configured: true,
    verifiedName: validation.verifiedName || 'WhatsApp Business Verificado',
    displayPhoneNumber: validation.displayPhoneNumber,
    qualityRating: validation.qualityRating || 'UNKNOWN',
    message: 'Conexión con Meta Cloud API validada y operativa en tiempo real.'
  })
}

/**
 * POST /api/owner/integrations/whatsapp/meta/verify
 * 
 * Verificación Real de Credenciales Manuales de Meta Cloud API:
 * 1. Valida permisos del usuario y habilitación en el plan comercial.
 * 2. Consulta en vivo la Graph API de Meta (GET /v22.0/{phoneNumberId}).
 * 3. Si la respuesta es exitosa, suscribe la WABA (si se provee) a los Webhooks oficiales.
 * 4. Cifra el Access Token con AES-256-GCM en reposo.
 * 5. Genera el enlace y QR oficial Click-to-Chat (wa.me) para que los clientes inicien chats.
 * 6. Sin simulaciones ficticias: solo conecta si Meta valida las credenciales.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado. Se requiere sesión de propietario o administrador.' }, { status: 401 })
  }

  // 1. Verificación comercial: el plan debe incluir WhatsApp
  const allowedByPlan = await canUseWhatsApp(session.businessId)
  if (!allowedByPlan && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      {
        error: 'Tu plan comercial actual no incluye automatización de WhatsApp Business. Actualiza a Plan Profesional o Premium en la sección Suscripción para conectarlo.'
      },
      { status: 403 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { phoneNumberId, wabaId, accessToken, webhookSecret, appId, appSecret, useStored } = body

    if (useStored || (!phoneNumberId && !accessToken)) {
      return GET()
    }

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Debes proporcionar Phone Number ID y Access Token de Meta Graph API.' },
        { status: 400 }
      )
    }

    // 2. Validación en vivo contra Meta Graph API v22.0
    const validation = await MetaCloudProvider.validateCredentials({
      phoneNumberId: String(phoneNumberId).trim(),
      accessToken: String(accessToken).trim(),
      wabaId: wabaId ? String(wabaId).trim() : undefined
    })

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Credenciales de Meta inválidas o rechazadas por la Graph API.'
        },
        { status: 400 }
      )
    }

    const displayPhone = validation.displayPhoneNumber || ''

    // 3. Suscripción automática de WABA a webhooks si se suministró wabaId
    if (wabaId && String(wabaId).trim()) {
      await MetaCloudProvider.subscribeAppToWaba({
        wabaId: String(wabaId).trim(),
        accessToken: String(accessToken).trim()
      })
    }

    // 4. Generar código QR oficial Click-to-Chat (wa.me) si el número está disponible
    let qrData = { qrCodeDataUrl: '', chatUrl: '' }
    if (displayPhone) {
      try {
        qrData = await MetaCloudProvider.generateMetaChatQr({
          phoneNumber: displayPhone,
          prefilledText: '¡Hola! Deseo información y agendar una cita'
        })
      } catch (qrErr) {
        console.warn('[Meta Verify] No se pudo generar QR Click-to-Chat:', qrErr)
      }
    }

    // 5. Cifrar Access Token en reposo
    const encryptedToken = safeEncryptToken(String(accessToken).trim())

    // 6. Persistir en la base de datos
    const updated = await prisma.whatsAppIntegration.upsert({
      where: { businessId: session.businessId },
      update: {
        provider: 'META',
        connectionStatus: 'CONNECTED',
        isEnabled: true,
        phoneNumber: displayPhone || undefined,
        metaPhoneNumberId: String(phoneNumberId).trim(),
        metaWabaId: wabaId ? String(wabaId).trim() : undefined,
        metaAccessToken: encryptedToken,
        metaWebhookSecret: webhookSecret ? String(webhookSecret).trim() : undefined,
        metaAppId: appId ? String(appId).trim() : undefined,
        metaAppSecret: appSecret ? String(appSecret).trim() : undefined,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      },
      create: {
        businessId: session.businessId,
        provider: 'META',
        connectionStatus: 'CONNECTED',
        isEnabled: true,
        phoneNumber: displayPhone,
        metaPhoneNumberId: String(phoneNumberId).trim(),
        metaWabaId: wabaId ? String(wabaId).trim() : undefined,
        metaAccessToken: encryptedToken,
        metaWebhookSecret: webhookSecret ? String(webhookSecret).trim() : undefined,
        metaAppId: appId ? String(appId).trim() : undefined,
        metaAppSecret: appSecret ? String(appSecret).trim() : undefined,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      }
    })

    // Sincronización automática de plantillas en segundo plano al verificar credenciales con éxito
    if (updated.metaWabaId && accessToken) {
      import('@/lib/whatsapp/meta-template-manager')
        .then(({ MetaTemplateManager }) => {
          MetaTemplateManager.ensureAndSyncTemplates({
            businessId: session.businessId!,
            wabaId: String(updated.metaWabaId).trim(),
            accessToken: String(accessToken).trim()
          })
            .then(syncRes => {
              console.log(`[AutoSync Meta Templates] Sincronización automática para sede ${session.businessId}: ${syncRes.success ? 'EXITOSA' : 'FALLIDA'}`)
            })
            .catch(err => console.warn('[AutoSync Meta Templates] Error en auto-sync tras verificación:', err))
        })
        .catch(() => {})
    }

    const maskedToken = `${String(accessToken).trim().slice(0, 6)}••••••••${String(accessToken).trim().slice(-4)}`

    return NextResponse.json({
      success: true,
      verifiedName: validation.verifiedName || 'Número Oficial Verificado',
      phoneNumber: displayPhone,
      qualityRating: validation.qualityRating || 'UNKNOWN',
      qrCodeDataUrl: qrData.qrCodeDataUrl,
      chatUrl: qrData.chatUrl,
      metaAccessTokenMasked: maskedToken,
      integration: {
        id: updated.id,
        businessId: updated.businessId,
        provider: updated.provider,
        connectionStatus: updated.connectionStatus,
        phoneNumber: updated.phoneNumber,
        metaPhoneNumberId: updated.metaPhoneNumberId,
        metaWabaId: updated.metaWabaId,
        isEnabled: updated.isEnabled
      },
      message: '¡Credenciales de Meta Cloud API verificadas y guardadas exitosamente!'
    })
  } catch (err: unknown) {
    console.error('Error en POST /api/owner/integrations/whatsapp/meta/verify:', err)
    return NextResponse.json(
      { error: (err as Error)?.message || 'Error interno al validar credenciales de Meta con la Graph API.' },
      { status: 500 }
    )
  }
}
