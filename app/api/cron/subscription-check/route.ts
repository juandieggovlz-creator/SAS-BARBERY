import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAuditLog } from '@/lib/audit'
import { sendSentinelNotification } from '@/lib/telegram-sentinel'
import { getEffectiveSubscription } from '@/lib/commercial-permissions'

export const dynamic = 'force-dynamic'

/**
 * Cron Job Diario para Verificación de Vencimiento de Pruebas y Suscripciones SaaS
 * Compatible con Vercel Hobby (ejecución diaria 1 vez al día).
 * 
 * NOTA CRÍTICA: La seguridad y bloqueo de accesos NO dependen exclusivamente de este cron.
 * `getEffectiveSubscription` evalúa en tiempo real `Date.now() > endsAt`, garantizando
 * protección instantánea e inquebrantable.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Permitir validación en producción con CRON_SECRET, o ejecución si no está definido en local
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    const allBusinesses = await prisma.business.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIAL'] }
      },
      include: {
        plan: true,
        users: { where: { role: 'OWNER' }, take: 1 }
      }
    })

    const results = {
      totalEvaluated: allBusinesses.length,
      expiringIn7Days: [] as string[],
      expiringIn3Days: [] as string[],
      expiringIn1Day: [] as string[],
      transitionedToSandbox: [] as string[]
    }

    for (const b of allBusinesses) {
      const sub = await getEffectiveSubscription(b.id)

      // 1. Caso: Expirado -> Transición transparente a Sandbox (cero borrado de datos)
      if (sub.isSandbox) {
        results.transitionedToSandbox.push(b.name)

        // Registrar aviso si no se ha registrado hoy
        await recordAuditLog({
          businessId: b.id,
          action: 'COMMERCIAL_SANDBOX_FALLBACK',
          entity: 'Business',
          entityId: b.id,
          details: {
            businessName: b.name,
            reason: 'Período comercial expirado sin pago activo. Degrada a Modo Sandbox sin pérdida de datos.'
          }
        }).catch(() => {})

        continue
      }

      // 2. Caso: Por expirar
      if (sub.expiresAt) {
        const remainingDays = sub.daysRemaining || 0

        if (remainingDays === 7) {
          results.expiringIn7Days.push(b.name)
          sendSentinelNotification({
            type: 'SUBSCRIPTION_EXPIRING_7D',
            priority: 'MEDIA',
            title: `⏳ Suscripción vence en 7 días: ${b.name}`,
            message:
              `<b>Barbería:</b> ${b.name} (<code>${b.slug}</code>)\n` +
              `<b>Estado:</b> ${sub.statusLabel}\n` +
              `<b>Contacto:</b> ${b.phone || b.email || 'Sin contacto directo'}\n` +
              `<i>Oportunidad de contactar al cliente para renovar su plan comercial.</i>`,
            actionUrl: `https://sas-barbery.vercel.app/superadmin/businesses/${b.id}`
          }).catch(() => {})
        } else if (remainingDays === 3) {
          results.expiringIn3Days.push(b.name)
          sendSentinelNotification({
            type: 'SUBSCRIPTION_EXPIRING_3D',
            priority: 'ALTA',
            title: `⚠️ Suscripción vence en 3 días: ${b.name}`,
            message:
              `<b>Barbería:</b> ${b.name} (<code>${b.slug}</code>)\n` +
              `<b>Vigencia:</b> 3 días restantes\n` +
              `<b>Plan actual:</b> ${sub.plan.name}\n` +
              `<i>Requiere seguimiento comercial urgente.</i>`,
            actionUrl: `https://sas-barbery.vercel.app/superadmin/businesses/${b.id}`
          }).catch(() => {})
        } else if (remainingDays === 1) {
          results.expiringIn1Day.push(b.name)
          sendSentinelNotification({
            type: 'SUBSCRIPTION_EXPIRING_1D',
            priority: 'CRITICA',
            title: `🚨 ÚLTIMO DÍA de suscripción: ${b.name}`,
            message:
              `<b>Barbería:</b> ${b.name} (<code>${b.slug}</code>)\n` +
              `<b>Vigencia:</b> Expira en menos de 24 horas.\n` +
              `<i>Si no renueva, sus reservas online pasarán a pausa en Modo Sandbox.</i>`,
            actionUrl: `https://sas-barbery.vercel.app/superadmin/businesses/${b.id}`
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: results
    })
  } catch (error) {
    console.error('Subscription Check Cron Error:', error)
    return NextResponse.json({ error: 'Error al ejecutar verificación de suscripciones' }, { status: 500 })
  }
}
