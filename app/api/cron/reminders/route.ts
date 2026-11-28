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
    const cronSecret = process.env.CRON_SECRET

    // Requerir exclusivamente Authorization: Bearer <CRON_SECRET>. No admitir secretos en parámetros de URL.
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET no está configurado en el servidor' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado. Se requiere cabecera Authorization: Bearer <CRON_SECRET>' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'window' | 'daily'
    const now = new Date()

    // 1. Limpieza preventiva de locks PENDING obsoletos (> 10 min) en caso de fallos de red previos
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
    await prisma.whatsAppMessageLog.deleteMany({
      where: {
        direction: 'OUTBOUND',
        status: 'PENDING',
        messageBody: { contains: 'RESERVA_BLOQUEADA_CRON' },
        createdAt: { lt: tenMinutesAgo }
      }
    }).catch(err => console.warn('[Cron Reminders] Error limpiando locks obsoletos:', err))

    // 2. Consultar integraciones de WhatsApp activas con recordatorios configurados (> 0 horas)
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
        // Modo Vercel Hobby (ejecución diaria 1 vez cada 24h a las 12:00 UTC)
        windowStart = new Date(now.getTime() + 15 * 60 * 1000) // Siempre futuro, nunca pasado
        windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      } else {
        // Modo ventana precisa (para cron externo ejecutado cada 5, 10 o 15 minutos)
        // Se buscan citas en la ventana [horas_antes - 20min, horas_antes + 20min] respecto a 'now'
        const targetMs = now.getTime() + hoursBefore * 60 * 60 * 1000
        const marginMs = 20 * 60 * 1000 // Tolerancia de +/- 20 minutos
        windowStart = new Date(targetMs - marginMs)
        windowEnd = new Date(targetMs + marginMs)
      }

      // Regla estricta: NO enviar recordatorios a citas cuyo horario ya pasó (date > now)
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          businessId: integration.businessId,
          date: {
            gt: now, // Garantiza que nunca se envíen recordatorios tardíos
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
                { status: 'SENT' },
                {
                  status: 'PENDING',
                  createdAt: { gte: tenMinutesAgo }
                }
              ]
            }
          }
        }
      })

      for (const appt of upcomingAppointments) {
        // Deduplicación estricta: si ya existe log enviado o lock PENDING activo reciente, saltar
        if (appt.whatsAppLogs.length > 0) {
          continue
        }

        // Concurrency Lock atómico: insertar log provisional PENDING para bloquear ejecuciones concurrentes
        let lockAcquired = false
        let lockLogId = ''
        try {
          const lockLog = await prisma.whatsAppMessageLog.create({
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
          lockLogId = lockLog.id
        } catch {
          lockAcquired = false
        }

        if (!lockAcquired) continue

        totalProcessed++
        try {
          const res = await WhatsAppService.sendAppointmentReminder(appt.id)
          // Limpiar el log provisional una vez procesado el envío real
          if (lockLogId) {
            await prisma.whatsAppMessageLog.delete({ where: { id: lockLogId } }).catch(() => {})
          }
          results.push({
            appointmentId: appt.id,
            client: appt.client?.name,
            success: res.success,
            messageId: res.messageId,
            error: res.error
          })
        } catch (e: unknown) {
          if (lockLogId) {
            await prisma.whatsAppMessageLog.delete({ where: { id: lockLogId } }).catch(() => {})
          }
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

