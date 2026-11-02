import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado o negocio no especificado' }, { status: 401 })
  }

  const services = await prisma.service.findMany({
    where: { 
      businessId: session.businessId,
      isActive: true 
    },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(services)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { name, duration, price } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'El nombre del servicio es obligatorio' }, { status: 400 })
  }

  const numDuration = Number(duration)
  const numPrice = Number(price)

  if (isNaN(numDuration) || numDuration <= 0) {
    return NextResponse.json({ error: 'La duración del servicio debe ser mayor a 0 minutos' }, { status: 400 })
  }

  if (isNaN(numPrice) || numPrice <= 0) {
    return NextResponse.json({ error: 'El precio del servicio debe ser mayor a 0' }, { status: 400 })
  }

  const service = await prisma.service.create({ 
    data: { 
      name: name.trim(), 
      duration: numDuration, 
      price: numPrice, 
      businessId: session.businessId,
      isActive: true
    } 
  })
  return NextResponse.json(service, { status: 201 })
}
