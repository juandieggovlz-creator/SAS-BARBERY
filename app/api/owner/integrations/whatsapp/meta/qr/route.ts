import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId: session.businessId }
    })

    if (!integration || !integration.phoneNumber) {
      return NextResponse.json(
        { error: 'No hay un número de teléfono configurado para Meta' },
        { status: 400 }
      )
    }

    const qr = await MetaCloudProvider.generateMetaChatQr({
      phoneNumber: integration.phoneNumber,
      prefilledText: '¡Hola! Deseo información y agendar una cita'
    })

    return NextResponse.json({
      success: true,
      phoneNumber: integration.phoneNumber,
      qrCodeDataUrl: qr.qrCodeDataUrl,
      chatUrl: qr.chatUrl,
      status: integration.connectionStatus
    })
  } catch (err: unknown) {
    console.error('Error generando QR de Meta:', err)
    return NextResponse.json({ error: 'Error al generar QR de Meta' }, { status: 500 })
  }
}
