import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'
import { canUseWhatsApp } from '@/lib/commercial-permissions'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificación comercial del plan
  const allowedByPlan = await canUseWhatsApp(session.businessId)
  if (!allowedByPlan && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      {
        error: 'Tu plan comercial actual no incluye automatización de WhatsApp Business. Actualiza a Plan Profesional o Premium en Suscripción para enviar mensajes.'
      },
      { status: 403 }
    )
  }

  // Rate limit: máx 5 mensajes de prueba cada 10 minutos por negocio para evitar spam
  const limitCheck = rateLimit(`whatsapp-test:${session.businessId}`, { limit: 5, windowSeconds: 10 * 60 })
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: `Has alcanzado el límite de pruebas de WhatsApp (5 por cada 10 min). Reintenta en ${Math.ceil(limitCheck.resetSeconds / 60)} minutos.` },
      { status: 429 }
    )
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
