import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { phoneNumberId, wabaId, accessToken, webhookSecret, appId, appSecret, isSimulation } = body

    // ── Modo Simulación Rápida (para probar el flujo de Meta sin credenciales previas)
    if (isSimulation) {
      const simPhone = '+57 300 987 6543'
      const qr = await MetaCloudProvider.generateMetaChatQr({
        phoneNumber: simPhone,
        prefilledText: '¡Hola! Deseo información y agendar una cita en la barbería'
      })

      const updated = await prisma.whatsAppIntegration.upsert({
        where: { businessId: session.businessId },
        update: {
          provider: 'META',
          connectionStatus: 'CONNECTED',
          isEnabled: true,
          phoneNumber: simPhone,
          metaPhoneNumberId: phoneNumberId || 'sim_meta_phone_id_9921',
          metaWabaId: wabaId || 'sim_waba_id_8812',
          metaAccessToken: accessToken || 'sim_meta_access_token_secure',
          metaWebhookSecret: webhookSecret || 'barberos_secure_webhook_token_2026',
          metaAppId: appId || undefined,
          metaAppSecret: appSecret || undefined,
          connectedAt: new Date(),
          lastSyncedAt: new Date()
        },
        create: {
          businessId: session.businessId,
          provider: 'META',
          connectionStatus: 'CONNECTED',
          isEnabled: true,
          phoneNumber: simPhone,
          metaPhoneNumberId: phoneNumberId || 'sim_meta_phone_id_9921',
          metaWabaId: wabaId || 'sim_waba_id_8812',
          metaAccessToken: accessToken || 'sim_meta_access_token_secure',
          metaWebhookSecret: webhookSecret || 'barberos_secure_webhook_token_2026',
          metaAppId: appId || undefined,
          metaAppSecret: appSecret || undefined,
          connectedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        isSimulation: true,
        verifiedName: 'Barbería Oficial (Meta Simulado)',
        phoneNumber: simPhone,
        qualityRating: 'GREEN',
        qrCodeDataUrl: qr.qrCodeDataUrl,
        chatUrl: qr.chatUrl,
        integration: updated,
        message: '¡Conexión de Meta simulada exitosamente con QR oficial!'
      })
    }

    // ── Modo Real: Verificación contra Meta Graph API
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Debes proporcionar Phone Number ID y Access Token de Meta' },
        { status: 400 }
      )
    }

    const validation = await MetaCloudProvider.validateCredentials({
      phoneNumberId,
      accessToken
    })

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'No se pudo validar el número en Meta Graph API'
        },
        { status: 400 }
      )
    }

    const displayPhone = validation.displayPhoneNumber || '+573000000000'

    // Generar el código QR oficial de WhatsApp para este número verificado
    const qr = await MetaCloudProvider.generateMetaChatQr({
      phoneNumber: displayPhone,
      prefilledText: '¡Hola! Deseo información y agendar una cita'
    })

    const updated = await prisma.whatsAppIntegration.upsert({
      where: { businessId: session.businessId },
      update: {
        provider: 'META',
        connectionStatus: 'CONNECTED',
        isEnabled: true,
        phoneNumber: displayPhone,
        metaPhoneNumberId: phoneNumberId,
        metaWabaId: wabaId || undefined,
        metaAccessToken: accessToken,
        metaWebhookSecret: webhookSecret || undefined,
        metaAppId: appId || undefined,
        metaAppSecret: appSecret || undefined,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      },
      create: {
        businessId: session.businessId,
        provider: 'META',
        connectionStatus: 'CONNECTED',
        isEnabled: true,
        phoneNumber: displayPhone,
        metaPhoneNumberId: phoneNumberId,
        metaWabaId: wabaId || undefined,
        metaAccessToken: accessToken,
        metaWebhookSecret: webhookSecret || undefined,
        metaAppId: appId || undefined,
        metaAppSecret: appSecret || undefined,
        connectedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      verifiedName: validation.verifiedName || 'Número Oficial Verificado',
      phoneNumber: displayPhone,
      qualityRating: validation.qualityRating || 'GREEN',
      qrCodeDataUrl: qr.qrCodeDataUrl,
      chatUrl: qr.chatUrl,
      integration: updated,
      message: '¡Conexión oficial de Meta Cloud API verificada con éxito!'
    })
  } catch (err: unknown) {
    console.error('Error en POST /api/owner/integrations/whatsapp/meta/verify:', err)
    return NextResponse.json(
      { error: 'Error interno al validar credenciales de Meta' },
      { status: 500 }
    )
  }
}
