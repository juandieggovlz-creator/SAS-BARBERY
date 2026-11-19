import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUseWhatsApp } from '@/lib/commercial-permissions'
import { safeEncryptToken } from '@/lib/crypto'
import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 0. Validar permisos por plan comercial
    const allowedByPlan = await canUseWhatsApp(session.businessId)
    if (!allowedByPlan && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Tu plan comercial actual no incluye automatización de WhatsApp Business. Actualiza a Plan Profesional o Premium en la sección Suscripción.' },
        { status: 403 }
      )
    }

    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'Código de autorización requerido' }, { status: 400 })
    }

    const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Variables de entorno META_APP_ID y META_APP_SECRET no configuradas' },
        { status: 500 }
      )
    }

    // 1. Exchange code for user token (v22.0)
    const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || tokenData.error) {
      console.error('[Meta Embedded Signup] Token exchange error:', tokenData)
      return NextResponse.json(
        { error: tokenData.error?.message || 'Error al intercambiar el código de autorización con Meta' },
        { status: 400 }
      )
    }

    const shortLivedToken = tokenData.access_token

    // 2. Get the WhatsApp Business accounts linked to this token
    const wabaRes = await fetch(
      `https://graph.facebook.com/v22.0/me/businesses?fields=id,name,whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}&access_token=${shortLivedToken}`
    )
    const wabaData = await wabaRes.json()

    // Extract first WABA + phone number
    const businesses = wabaData.data || []
    const firstBusiness = businesses[0]
    const wabaAccounts = firstBusiness?.whatsapp_business_accounts?.data || []
    const firstWaba = wabaAccounts[0]
    const phoneNumbers = firstWaba?.phone_numbers?.data || []
    const firstPhone = phoneNumbers[0]

    if (!firstWaba?.id) {
      return NextResponse.json(
        { error: 'No se encontró una cuenta de WhatsApp Business vinculada. Asegúrate de completar el proceso en el popup de Meta.' },
        { status: 400 }
      )
    }

    // Suscribir WABA a Webhooks
    await MetaCloudProvider.subscribeAppToWaba({
      wabaId: firstWaba.id,
      accessToken: shortLivedToken
    })

    const encryptedToken = safeEncryptToken(shortLivedToken)

    // 3. Save to database with AES-256 encrypted token
    await prisma.whatsAppIntegration.upsert({
      where: { businessId: session.businessId },
      create: {
        businessId: session.businessId,
        isEnabled: true,
        provider: 'META',
        connectionStatus: 'CONNECTED',
        metaWabaId: firstWaba.id,
        metaPhoneNumberId: firstPhone?.id || null,
        metaAccessToken: encryptedToken,
        metaAppId: appId,
        phoneNumber: firstPhone?.display_phone_number || null,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      },
      update: {
        provider: 'META',
        connectionStatus: 'CONNECTED',
        metaWabaId: firstWaba.id,
        metaPhoneNumberId: firstPhone?.id || null,
        metaAccessToken: encryptedToken,
        metaAppId: appId,
        phoneNumber: firstPhone?.display_phone_number || null,
        isEnabled: true,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      wabaId: firstWaba.id,
      wabaName: firstWaba.name,
      phoneNumberId: firstPhone?.id,
      phoneNumber: firstPhone?.display_phone_number,
      verifiedName: firstPhone?.verified_name,
      message: '¡WhatsApp Business conectado exitosamente via Meta Embedded Signup! 🚀'
    })
  } catch (error) {
    console.error('[Meta Embedded Signup] Error:', error)
    return NextResponse.json({ error: 'Error interno al procesar la autenticación de Meta' }, { status: 500 })
  }
}
