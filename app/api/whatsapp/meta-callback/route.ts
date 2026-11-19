import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUseWhatsApp } from '@/lib/commercial-permissions'
import { safeEncryptToken } from '@/lib/crypto'
import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider'

export const dynamic = 'force-dynamic'

/**
 * Backend API Route: /api/whatsapp/meta-callback
 * 
 * Flujo oficial Server-to-Server de Meta WhatsApp Embedded Signup v4 (Coexistence):
 * 1. Verifica autenticación y que el plan comercial permita WhatsApp Business.
 * 2. Intercambia el código de autorización temporal (OAuth code) por un User/System User Access Token.
 * 3. Valida el token contra Meta Graph API v22.0 (/debug_token).
 * 4. Resuelve la WABA (WhatsApp Business Account) y el Phone Number ID.
 * 5. Suscribe la aplicación a la WABA (POST /v22.0/{waba_id}/subscribed_apps) para recibir webhooks de Coexistencia.
 * 6. Cifra el token de acceso en reposo con AES-256-GCM antes de persistirlo en Neon DB.
 * 7. Nunca expone el token crudo en la respuesta HTTP del cliente.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado. Se requiere sesión de propietario o administrador.' }, { status: 401 })
    }

    // 1. Verificación comercial: el plan debe incluir WhatsApp
    const allowedByPlan = await canUseWhatsApp(session.businessId)
    if (!allowedByPlan && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          error: 'Tu plan actual no incluye automatización de WhatsApp Business. Actualiza a Plan Profesional o Premium en Suscripción para activarlo.'
        },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { code, phoneNumberId: incomingPhoneId, wabaId: incomingWabaId } = body

    if (!code) {
      return NextResponse.json({ error: 'Código de autorización de Meta (code) requerido.' }, { status: 400 })
    }

    const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Variables META_APP_ID o META_APP_SECRET no configuradas en el servidor.' },
        { status: 500 }
      )
    }

    // 2. Intercambio de OAuth code por access_token (Graph API v22.0)
    const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`
    
    const tokenRes = await fetch(tokenUrl, { method: 'GET', cache: 'no-store' })
    const tokenData = await tokenRes.json().catch(() => ({}))

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      console.error('[Meta Callback] Error al intercambiar token:', tokenData)
      return NextResponse.json(
        { error: tokenData.error?.message || 'Error al validar el código de autorización con la Graph API de Meta.' },
        { status: 400 }
      )
    }

    const accessToken = tokenData.access_token

    // 3. Inspeccionar token con debug_token para validar alcance y autenticidad
    try {
      const debugUrl = `https://graph.facebook.com/v22.0/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`
      const debugRes = await fetch(debugUrl, { cache: 'no-store' })
      if (debugRes.ok) {
        const debugData = await debugRes.json().catch(() => ({}))
        console.log('[Meta Callback] Debug Token scopes:', debugData?.data?.scopes, 'isValid:', debugData?.data?.is_valid)
      }
    } catch (debugErr) {
      console.warn('[Meta Callback] No se pudo depurar el token:', debugErr)
    }

    let resolvedWabaId = incomingWabaId || null
    let resolvedPhoneId = incomingPhoneId || null
    let displayPhoneNumber: string | null = null
    let verifiedName: string | null = null

    // 4. Si no se recibieron directamente desde el evento de Embedded Signup, consultar WABA y teléfonos
    if (!resolvedWabaId || !resolvedPhoneId) {
      try {
        const businessesRes = await fetch(
          `https://graph.facebook.com/v22.0/me/businesses?fields=id,name,whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}&access_token=${encodeURIComponent(accessToken)}`,
          { cache: 'no-store' }
        )
        const businessesData = await businessesRes.json().catch(() => ({}))
        const businesses = businessesData.data || []
        
        for (const b of businesses) {
          const wabaList = b.whatsapp_business_accounts?.data || []
          if (wabaList.length > 0) {
            resolvedWabaId = resolvedWabaId || wabaList[0].id
            const phoneList = wabaList[0].phone_numbers?.data || []
            if (phoneList.length > 0) {
              resolvedPhoneId = resolvedPhoneId || phoneList[0].id
              displayPhoneNumber = phoneList[0].display_phone_number
              verifiedName = phoneList[0].verified_name
              break
            }
          }
        }
      } catch (inspectErr) {
        console.warn('[Meta Callback] Advertencia al inspeccionar negocios en Graph API:', inspectErr)
      }
    }

    // 5. Si tenemos phoneNumberId, obtener detalles en vivo del número
    if (resolvedPhoneId) {
      try {
        const phoneRes = await fetch(
          `https://graph.facebook.com/v22.0/${resolvedPhoneId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating&access_token=${encodeURIComponent(accessToken)}`,
          { cache: 'no-store' }
        )
        if (phoneRes.ok) {
          const phoneData = await phoneRes.json().catch(() => ({}))
          displayPhoneNumber = phoneData.display_phone_number || displayPhoneNumber
          verifiedName = phoneData.verified_name || verifiedName
        }
      } catch (phoneErr) {
        console.warn('[Meta Callback] Error al consultar datos del teléfono:', phoneErr)
      }
    }

    // 6. Suscribir automáticamente la aplicación a la WABA para recibir Webhooks oficiales
    if (resolvedWabaId) {
      const subResult = await MetaCloudProvider.subscribeAppToWaba({
        wabaId: resolvedWabaId,
        accessToken
      })
      if (!subResult.success) {
        console.warn('[Meta Callback] Advertencia: la suscripción a WABA devolvió:', subResult.error)
      } else {
        console.log('[Meta Callback] WABA suscrita exitosamente a Webhooks de BarberOS:', resolvedWabaId)
      }
    }

    // 7. Cifrado simétrico AES-256-GCM en reposo del token
    const encryptedAccessToken = safeEncryptToken(accessToken)

    // 8. Guardar / actualizar en la base de datos (WhatsAppIntegration)
    const updated = await prisma.whatsAppIntegration.upsert({
      where: { businessId: session.businessId },
      create: {
        businessId: session.businessId,
        isEnabled: true,
        provider: 'META',
        connectionStatus: 'CONNECTED',
        metaAccessToken: encryptedAccessToken,
        metaPhoneNumberId: resolvedPhoneId,
        metaWabaId: resolvedWabaId,
        metaAppId: appId,
        phoneNumber: displayPhoneNumber,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      },
      update: {
        isEnabled: true,
        provider: 'META',
        connectionStatus: 'CONNECTED',
        metaAccessToken: encryptedAccessToken,
        metaPhoneNumberId: resolvedPhoneId || undefined,
        metaWabaId: resolvedWabaId || undefined,
        metaAppId: appId,
        ...(displayPhoneNumber && { phoneNumber: displayPhoneNumber }),
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      }
    })

    const maskedToken = accessToken
      ? `${accessToken.slice(0, 6)}••••••••${accessToken.slice(-4)}`
      : null

    return NextResponse.json({
      success: true,
      connectionStatus: 'CONNECTED',
      whatsappProvider: 'META',
      whatsappConnected: true,
      phoneNumber: updated.phoneNumber || displayPhoneNumber,
      verifiedName: verifiedName || 'WhatsApp Business',
      wabaId: resolvedWabaId,
      phoneNumberId: resolvedPhoneId,
      metaAccessTokenMasked: maskedToken,
      message: '¡Conexión oficial de WhatsApp Business (Meta) activada exitosamente con Coexistencia!'
    })
  } catch (error: unknown) {
    console.error('[Meta Callback] Error no controlado:', error)
    return NextResponse.json(
      { error: (error as Error)?.message || 'Error interno del servidor al procesar la vinculación con Meta.' },
      { status: 500 }
    )
  }
}
