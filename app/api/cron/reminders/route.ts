import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'

/**
 * Cron job para despachar recordatorios automáticos de citas por WhatsApp (ej. 2 horas antes)
 * Puede llamarse periódicamente cada 15-30 minutos mediante Vercel Cron o trigger externo.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    // Ventana de búsqueda: citas entre 1 hora y media y 2 horas y media en el futuro
    const windowStart = new Date(now.getTime() + 90 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 150 * 60 * 1000)

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
