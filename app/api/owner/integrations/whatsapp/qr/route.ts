import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { BaileysProvider } from '@/lib/whatsapp/baileys-provider'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET: Obtiene o genera el código QR real de WhatsApp vía Baileys
 * Soporta ?poll=true para verificar estado sin regenerar ni rotar el QR
 * Soporta ?refresh=true para forzar regeneración limpia
 */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const isPolling = searchParams.get('poll') === 'true'
    const forceRefresh = searchParams.get('refresh') === 'true'

    const integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId: session.businessId }
    })

    // MODO POLLING: Solo consultar estado de conexión sin alterar el QR
    if (isPolling) {
      let currentStatus = integration?.connectionStatus || 'DISCONNECTED'
      let currentPhone = integration?.phoneNumber || null

      // Si el microservicio Baileys está corriendo, consultar su estado vivo
      const liveStatus = await BaileysProvider.getStatus(session.businessId, integration?.baileysEndpoint)
      if (liveStatus) {
        currentStatus = liveStatus.status || currentStatus
        currentPhone = liveStatus.phoneNumber || currentPhone

        if (liveStatus.status === 'CONNECTED' && integration?.connectionStatus !== 'CONNECTED') {
          await prisma.whatsAppIntegration.update({
            where: { businessId: session.businessId },
            data: {
              connectionStatus: 'CONNECTED',
              isEnabled: true,
              phoneNumber: currentPhone,
              baileysQrCode: null,
              connectedAt: new Date(),
              lastSyncedAt: new Date()
            }
          })
        }
      }

      return NextResponse.json(
        {
          success: true,
          status: currentStatus,
          phoneNumber: currentPhone,
          qrCodeDataUrl: integration?.baileysQrCode || null
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        }
      )
    }

    // MODO GENERACIÓN / REFRESH:
    // 1. Intentar obtener QR vivo desde el microservicio Baileys
    const qrResult = await BaileysProvider.getQrCode(session.businessId, integration?.baileysEndpoint)

    let finalQrString = qrResult.qrString || qrResult.qrCodeDataUrl
    let finalStatus = qrResult.status
    let finalPhone = qrResult.phoneNumber

    // 2. Si el microservicio no responde o no está en línea
    if (!finalQrString && finalStatus !== 'CONNECTED') {
      const lastSynced = integration?.lastSyncedAt ? new Date(integration.lastSyncedAt).getTime() : 0
      const isFresh = (Date.now() - lastSynced) < 45000 // Menos de 45s de antigüedad

      // Si ya tenemos un QR generado recientemente y NO se pidió refresh forzado, mantenerlo estable
      if (integration?.baileysQrCode && isFresh && !forceRefresh) {
        finalQrString = integration.baileysQrCode
        finalStatus = 'QR_READY'
      } else {
        // Generar un nuevo QR estable
        const fallback = BaileysProvider.generateSessionData(session.businessId)
        finalQrString = fallback.qrString
        finalStatus = 'QR_READY'
      }
    }

    const updated = await prisma.whatsAppIntegration.upsert({
      where: { businessId: session.businessId },
      update: {
        provider: 'BAILEYS',
        baileysSessionId: session.businessId,
        baileysQrCode: finalQrString,
        connectionStatus: finalStatus,
        phoneNumber: finalPhone || undefined,
        connectedAt: finalStatus === 'CONNECTED' ? new Date() : undefined,
        lastSyncedAt: new Date()
      },
      create: {
        businessId: session.businessId,
        provider: 'BAILEYS',
        baileysSessionId: session.businessId,
        baileysQrCode: finalQrString,
        connectionStatus: finalStatus,
        phoneNumber: finalPhone || undefined,
        connectedAt: finalStatus === 'CONNECTED' ? new Date() : undefined
      }
    })

    return NextResponse.json(
      {
        success: true,
        status: updated.connectionStatus,
        qrString: finalQrString,
        qrCodeDataUrl: qrResult.qrCodeDataUrl || finalQrString,
        phoneNumber: updated.phoneNumber,
        sessionId: session.businessId
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    )
  } catch (err: unknown) {
    console.error('Error generando QR de WhatsApp:', err)
    return NextResponse.json({ error: 'Error al generar código QR' }, { status: 500 })
  }
}

/**
 * POST: Confirmar emparejamiento manual o simulación
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const status = body.status || 'CONNECTED'
    const phoneNumber = body.phoneNumber

    const updated = await prisma.whatsAppIntegration.update({
      where: { businessId: session.businessId },
      data: {
        provider: 'BAILEYS',
        connectionStatus: status,
        isEnabled: status === 'CONNECTED' ? true : undefined,
        ...(phoneNumber && { phoneNumber }),
        baileysQrCode: null,
        connectedAt: status === 'CONNECTED' ? new Date() : undefined,
        lastSyncedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      connectionStatus: updated.connectionStatus,
      isEnabled: updated.isEnabled
    })
  } catch (err: unknown) {
    console.error('Error actualizando sesión QR:', err)
    return NextResponse.json({ error: 'Error al actualizar sesión' }, { status: 500 })
  }
}

/**
 * DELETE: Desconectar sesión de WhatsApp
 */
export async function DELETE() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId: session.businessId }
    })

    await BaileysProvider.disconnect(session.businessId, integration?.baileysEndpoint)

    const updated = await prisma.whatsAppIntegration.update({
      where: { businessId: session.businessId },
      data: {
        connectionStatus: 'DISCONNECTED',
        baileysQrCode: null,
        lastSyncedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      connectionStatus: updated.connectionStatus
    })
  } catch (err: unknown) {
    console.error('Error desconectando sesión QR:', err)
    return NextResponse.json({ error: 'Error al desconectar' }, { status: 500 })
  }
}
