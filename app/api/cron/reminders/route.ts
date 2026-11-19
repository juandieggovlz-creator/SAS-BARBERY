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

    // CRON_SECRET is required in ALL environments to prevent unauthenticated trigger of this endpoint.
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET no está configurado en las variables de entorno' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'hourly' | 'daily' | null (auto)
    const windowHoursParam = searchParams.get('windowHours')

    const now = new Date()
    let windowStart = now
    let windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Predeterminado para Vercel Hobby (próximas 24 horas)

    if (mode === 'hourly' || windowHoursParam) {
      // Modo de alta frecuencia (para disparadores externos como cron-job.org / QStash cada 15-30 min)
      const hours = Number(windowHoursParam) || 2
      const windowMarginMs = 45 * 60 * 1000 // margen de 45 minutos
      const targetTimeMs = now.getTime() + hours * 60 * 60 * 1000
      windowStart = new Date(targetTimeMs - windowMarginMs)
      windowEnd = new Date(targetTimeMs + windowMarginMs)
    } else {
      // Modo Vercel Hobby (ejecución diaria 1 vez cada 24h a las 12:00 UTC / 7:00 AM Colombia)
      // Cubre las citas de la jornada en curso para que no se omitan citas
      windowStart = new Date(now.getTime() - 15 * 60 * 1000)
      windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }

    // Citas que caen en este rango y pertenecen a negocios con WhatsApp activado
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: windowStart,
          lte: windowEnd
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
        business: {
          whatsAppIntegration: {
            isEnabled: true
          }
        }
      },
      include: {
        client: true,
        business: {
          include: {
            whatsAppIntegration: true
          }
        },
        whatsAppLogs: {
          where: {
            direction: 'OUTBOUND',
            status: 'SENT'
          }
        }
      }
    })

    const results = []

    for (const appt of upcomingAppointments) {
      // Verificar si ya se envió un recordatorio a esta cita
      const alreadyReminded = appt.whatsAppLogs.some(log =>
        log.messageBody.toLowerCase().includes('recordatorio')
      )

      if (!alreadyReminded) {
        try {
          const res = await WhatsAppService.sendAppointmentReminder(appt.id)
          results.push({ appointmentId: appt.id, success: res.success, error: res.error })
        } catch (e: unknown) {
          results.push({ appointmentId: appt.id, success: false, error: e instanceof Error ? e.message : 'Error' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results
    })
  } catch (err: unknown) {
    console.error('Error en cron de recordatorios:', err)
    return NextResponse.json({ error: 'Error procesando recordatorios' }, { status: 500 })
  }
}

export const POST = GET

