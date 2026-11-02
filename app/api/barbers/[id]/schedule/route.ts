import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const schedules = await prisma.barberSchedule.findMany({
      where: { barberId: id },
      orderBy: { dayOfWeek: 'asc' }
    })
    return NextResponse.json(schedules)
  } catch {
    return NextResponse.json({ error: 'Error fetching schedule' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { schedules } = await request.json()

    // Clear existing schedules for this barber and recreate
    await prisma.barberSchedule.deleteMany({
      where: { barberId: id }
    })

    const created = await prisma.barberSchedule.createMany({
      data: schedules.map((s: { dayOfWeek: number; startTime: string; endTime: string; isWorking?: boolean }) => ({
        barberId: id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isWorking: s.isWorking ?? true
      }))
    })

    return NextResponse.json({ success: true, created })
  } catch {
    return NextResponse.json({ error: 'Error updating schedule' }, { status: 500 })
  }
}
