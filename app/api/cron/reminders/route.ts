import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'

export const dynamic = 'force-dynamic'

/**
 * Cron job para despachar recordatorios automáticos de citas por WhatsApp (ej. 2 horas antes)
 * Puede llamarse periódicamente cada 15-30 minutos mediante trigger externo o diariamente por Vercel.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const secretParam = searchParams.get('secret') || searchParams.get('key')
    const cronSecret = process.env.CRON_SECRET

    // CRON_SECRET es obligatorio para proteger el endpoint
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET no está configurado en el servidor' }, { status: 500 })
    }

    const isAuthorized = authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret
    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const mode = searchParams.get('mode') // 'window' | 'daily' | 'force'
    const now = new Date()

    // Traer todos los negocios que tienen WhatsApp activo y recordatorios configurados (> 0 horas)
    const activeIntegrations = await prisma.whatsAppIntegration.findMany({
      where: {
        isEnabled: true,
        reminderHoursBefore: { gt: 0 }
      },
      select: {
        businessId: true,
        reminderHoursBefore: true,
        notifyOnReminder: true
      }
    })

    if (activeIntegrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay negocios con recordatorios de WhatsApp activos',
        processed: 0
      })
    }

    const results = []
    let totalProcessed = 0

    for (const integration of activeIntegrations) {
      if (integration.notifyOnReminder === false) continue

      const hoursBefore = integration.reminderHoursBefore || 2

      let windowStart: Date
      let windowEnd: Date

      if (mode === 'daily') {
        // Modo Vercel Hobby (ejecución diaria 1 vez cada 24h)
        windowStart = new Date(now.getTime() - 15 * 60 * 1000)
        windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      } else {
        // Modo ventana precisa (para cron-job.org ejecutado cada 5, 10 o 15 minutos)
        // Se buscan citas cuya hora sea dentro de [horas_antes - 15m, horas_antes + 15m] respecto a 'now'
        const targetMs = now.getTime() + hoursBefore * 60 * 60 * 1000
        const marginMs = 20 * 60 * 1000 // Margen de +/- 20 minutos para tolerancia de reloj
        windowStart = new Date(targetMs - marginMs)
        windowEnd = new Date(targetMs + marginMs)
      }

      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          businessId: integration.businessId,
          date: {
            gte: windowStart,
            lte: windowEnd
          },
          status: { in: ['PENDING', 'CONFIRMED'] },
          client: {
            whatsappConsent: true // Respetar consentimiento del cliente
          }
        },
        include: {
          client: true,
          whatsAppLogs: {
            where: {
              direction: 'OUTBOUND',
              OR: [
                { messageBody: { contains: 'Recordatorio' } },
                { rawPayload: { path: ['tag'], equals: 'REMINDER' } },
                { rawPayload: { path: ['templateName'], equals: 'barberos_recordatorio_cita' } }
              ]
            }
          }
        }
      })

      for (const appt of upcomingAppointments) {
        // Deduplicación estricta: si ya existe log de recordatorio exitoso o en proceso para esta cita, saltar
        if (appt.whatsAppLogs.length > 0) {
          continue
        }

        // Concurrency Lock atómico: insertar log provisional SENDING para bloquear ejecuciones concurrentes
        let lockAcquired = false
        try {
          await prisma.whatsAppMessageLog.create({
            data: {
              businessId: integration.businessId,
              appointmentId: appt.id,
              direction: 'OUTBOUND',
              status: 'PENDING',
              provider: 'META',
              from: 'BARBEROS_CRON',
              to: appt.client?.phone || 'DESCONOCIDO',
              messageBody: `[RESERVA_BLOQUEADA_CRON_${appt.id}]`,
              rawPayload: { tag: 'REMINDER_LOCK' }
            }
          })
          lockAcquired = true
        } catch {
          // Si falló el insert provisional, otro proceso ya tomó la cita
          lockAcquired = false
        }

        if (!lockAcquired) continue

        totalProcessed++
        try {
          const res = await WhatsAppService.sendAppointmentReminder(appt.id)
          results.push({
            appointmentId: appt.id,
            client: appt.client?.name,
            success: res.success,
            messageId: res.messageId,
            error: res.error
          })
        } catch (e: unknown) {
          results.push({
            appointmentId: appt.id,
            client: appt.client?.name,
            success: false,
            error: e instanceof Error ? e.message : 'Error inesperado'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      mode: mode || 'window',
      processed: totalProcessed,
      details: results
    })
  } catch (err: unknown) {
    console.error('Error en cron de recordatorios:', err)
    return NextResponse.json({ error: 'Error procesando recordatorios' }, { status: 500 })
  }
}

export const POST = GET

