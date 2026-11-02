import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Backend API Route: /api/whatsapp/meta-callback
 * Intercambia el código de autorización de Meta Embedded Signup por el token de acceso,
 * resuelve la WABA y el Phone Number ID asignado, y activa la conexión oficial en la base de datos.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado. Se requiere sesión de propietario.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { code, phoneNumberId: incomingPhoneId, wabaId: incomingWabaId } = body

    if (!code) {
      return NextResponse.json({ error: 'Código de autorización de Meta (code) requerido.' }, { status: 400 })
    }

    const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID || '1798187644961786'
    const appSecret = process.env.META_APP_SECRET
    const configId = process.env.META_CONFIG_ID || process.env.NEXT_PUBLIC_META_CONFIG_ID || '2369676903865189'

    if (!appSecret) {
      return NextResponse.json(
        { error: 'Clave secreta META_APP_SECRET no configurada en las variables de entorno del servidor.' },
        { status: 500 }
      )
    }

    // 1. Petición Server-to-Server a la Graph API de Meta para intercambiar code por access_token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`
    
    const tokenRes = await fetch(tokenUrl, { method: 'GET', cache: 'no-store' })
    const tokenData = await tokenRes.json().catch(() => ({}))

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      console.error('[Meta Callback] Error de intercambio de token:', tokenData)
      return NextResponse.json(
        { error: tokenData.error?.message || 'Error al validar el código de autorización con la Graph API de Meta.' },
        { status: 400 }
      )
    }

    const accessToken = tokenData.access_token

    let resolvedWabaId = incomingWabaId || null
    let resolvedPhoneId = incomingPhoneId || null
    let displayPhoneNumber: string | null = null
    let verifiedName: string | null = null

    // 2. Si no se recibieron directamente desde el evento de Embedded Signup, consultar WABA y teléfonos
    if (!resolvedWabaId || !resolvedPhoneId) {
      try {
        const businessesRes = await fetch(
          `https://graph.facebook.com/v21.0/me/businesses?fields=id,name,whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}&access_token=${encodeURIComponent(accessToken)}`,
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
        console.warn('[Meta Callback] Advertencia al inspeccionar negocios:', inspectErr)
      }
    }

    // 3. Si tenemos phoneNumberId, obtener detalles en vivo del número
    if (resolvedPhoneId) {
      try {
        const phoneRes = await fetch(
          `https://graph.facebook.com/v21.0/${resolvedPhoneId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating&access_token=${encodeURIComponent(accessToken)}`,
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

    // 4. Guardar / actualizar en la base de datos (WhatsAppIntegration)
    const updated = await prisma.whatsAppIntegration.upsert({
      where: { businessId: session.businessId },
      create: {
        businessId: session.businessId,
        isEnabled: true,
        provider: 'META',
        connectionStatus: 'CONNECTED',
        metaAccessToken: accessToken,
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
        metaAccessToken: accessToken,
        metaPhoneNumberId: resolvedPhoneId || undefined,
        metaWabaId: resolvedWabaId || undefined,
        metaAppId: appId,
        ...(displayPhoneNumber && { phoneNumber: displayPhoneNumber }),
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      connectionStatus: 'CONNECTED',
      whatsappProvider: 'META',
      whatsappConnected: true,
      phoneNumber: updated.phoneNumber || displayPhoneNumber,
      verifiedName: verifiedName || 'WhatsApp Business',
      wabaId: resolvedWabaId,
      phoneNumberId: resolvedPhoneId,
      message: '¡Conexión oficial de WhatsApp Business (Meta) activada exitosamente!'
    })
  } catch (error: unknown) {
    console.error('[Meta Callback] Error no controlado:', error)
    return NextResponse.json(
      { error: (error as Error)?.message || 'Error interno del servidor al procesar la vinculación con Meta.' },
      { status: 500 }
    )
  }
}
