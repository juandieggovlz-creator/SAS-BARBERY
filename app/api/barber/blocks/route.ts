import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession('BARBER')
  if (!session || !session.barberId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const blocks = await prisma.barberBlock.findMany({
      where: { barberId: session.barberId },
      orderBy: { date: 'asc' }
    })
    return NextResponse.json(blocks)
  } catch {
    return NextResponse.json({ error: 'Error al obtener bloqueos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { date, startTime, endTime, reason } = await request.json()
    const block = await prisma.barberBlock.create({
      data: {
        barberId: session.barberId as string,
        date: new Date(date),
        startTime,
        endTime,
        reason
      }
    })
    return NextResponse.json(block)
  } catch {
    return NextResponse.json({ error: 'Error al crear bloqueo' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession('BARBER')
  if (!session || !session.barberId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    await prisma.barberBlock.delete({
      where: { id, barberId: session.barberId }
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar bloqueo' }, { status: 500 })
  }
}
