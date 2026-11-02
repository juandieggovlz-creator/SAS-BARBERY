import { NextResponse } from 'next/server'
import { getAvailableSlotsForWeb } from '@/lib/sync/availability-engine'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/public/availability
 * Devuelve los turnos disponibles en tiempo real desde la BD.
 * Consulta directamente: BarberSchedule + BarberBlock + Appointment.
 * Ningún dato hardcodeado. Cambios del dueño se reflejan al instante.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')
    const barberId = searchParams.get('barberId')
    const dateStr = searchParams.get('date')
    const durationParam = searchParams.get('duration')
    const customDurationMinutes = durationParam ? parseInt(durationParam, 10) : undefined

    if (!businessId || !serviceId || !dateStr) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (businessId, serviceId, date)' },
        { status: 400 }
      )
    }

    const baseService = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!baseService || baseService.businessId !== businessId || !baseService.isActive) {
      return NextResponse.json({ error: 'Servicio no disponible o inactivo' }, { status: 404 })
    }

    const slots = await getAvailableSlotsForWeb({
      businessId,
      serviceId,
      dateStr,
      barberId: barberId || null,
      customDurationMinutes
    })

    return NextResponse.json(
      {
        slots,
        meta: {
          businessId,
          serviceId,
          dateStr,
          barberId: barberId || null,
          duration: customDurationMinutes || baseService.duration,
          totalSlots: slots.length,
          fetchedAt: new Date().toISOString()
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    )
  } catch (error: unknown) {
    console.error('Availability API Error:', error)
    return NextResponse.json({ error: 'Error al calcular disponibilidad' }, { status: 500 })
  }
}
