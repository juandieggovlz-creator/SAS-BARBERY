import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    const where: { barberId: string; date?: { gte: Date; lte: Date } } = { barberId: id }
    if (fromStr && toStr) {
      where.date = {
        gte: new Date(fromStr),
        lte: new Date(toStr)
      }
    }

    const blocks = await prisma.barberBlock.findMany({ where })
    return NextResponse.json(blocks)
  } catch {
    return NextResponse.json({ error: 'Error fetching blocks' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { date, startTime, endTime, reason } = body

    const block = await prisma.barberBlock.create({
      data: {
        barberId: id,
        date: new Date(date),
        startTime,
        endTime,
        reason
      }
    })

    return NextResponse.json(block, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error creating block' }, { status: 500 })
  }
}
