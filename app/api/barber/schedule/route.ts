import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession('BARBER')
  if (!session || session.role !== 'BARBER' || !session.barberId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const schedules = await prisma.barberSchedule.findMany({
      where: { barberId: session.barberId },
      orderBy: { dayOfWeek: 'asc' }
    })
    return NextResponse.json(schedules)
  } catch {
    return NextResponse.json({ error: 'Error al obtener horario' }, { status: 500 })
  }
}

// POST is intentionally disabled for barbers — the schedule is set exclusively by the owner.
export async function POST() {
  return NextResponse.json(
    { error: 'Los horarios son gestionados exclusivamente por el administrador del negocio.' },
    { status: 403 }
  )
}
