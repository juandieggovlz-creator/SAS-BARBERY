import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { to, text } = body

    let targetPhone = to
    let businessName = 'tu Barbería'

    const integration = await prisma.whatsAppIntegration.findUnique({
      where: { businessId: session.businessId },
      include: { business: { select: { name: true, phone: true } } }
    })

    if (integration?.business?.name) {
      businessName = integration.business.name
    }

    if (!targetPhone) {
      targetPhone = integration?.phoneNumber || integration?.business?.phone
    }

    if (!targetPhone) {
      return NextResponse.json({ error: 'Debes ingresar o configurar un número de WhatsApp para recibir la prueba' }, { status: 400 })
    }

    const testMessage = text || `💈 *Prueba de Conexión Exitosa — BarberOS* ✅\n\n¡Hola! Este es un mensaje de prueba automático desde tu panel de *${businessName}*.\n\n⚡ Tu bot de WhatsApp y los flujos predeterminados de BarberOS están listos para atender a tus clientes.`

    const result = await WhatsAppService.sendDirectMessage({
      businessId: session.businessId,
      to: targetPhone,
      text: testMessage
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Error al enviar mensaje de prueba'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Mensaje de prueba enviado exitosamente ✨'
    })
  } catch (err: unknown) {
    console.error('Error en prueba de WhatsApp:', err)
    return NextResponse.json({ error: 'Error al enviar mensaje de prueba' }, { status: 500 })
  }
}
