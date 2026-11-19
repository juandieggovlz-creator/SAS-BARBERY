import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado o negocio no especificado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const includeInactive = searchParams.get('includeInactive') === 'true' || searchParams.get('all') === 'true'
  const status = searchParams.get('status') // 'all' | 'active' | 'inactive'

  const whereClause: Prisma.ServiceWhereInput = {
    businessId: session.businessId,
  }

  if (status === 'active') {
    whereClause.isActive = true
  } else if (status === 'inactive') {
    whereClause.isActive = false
  } else if (!includeInactive) {
    whereClause.isActive = true
  }

  const services = await prisma.service.findMany({
    where: whereClause,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })
  return NextResponse.json(services)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { name, duration, price, category, description, isActive } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'El nombre del servicio es obligatorio' }, { status: 400 })
  }

  const trimmedName = name.trim()
  if (trimmedName.length > 100) {
    return NextResponse.json({ error: 'El nombre del servicio no puede exceder 100 caracteres' }, { status: 400 })
  }

  const numDuration = Number(duration)
  const numPrice = Number(price)

  if (isNaN(numDuration) || numDuration <= 0 || numDuration > 720) {
    return NextResponse.json({ error: 'La duración del servicio debe ser entre 1 y 720 minutos' }, { status: 400 })
  }

  if (isNaN(numPrice) || numPrice < 0) {
    return NextResponse.json({ error: 'El precio del servicio no puede ser negativo' }, { status: 400 })
  }

  // Prevenir duplicados accidentales activos en el mismo negocio
  const existingActive = await prisma.service.findFirst({
    where: {
      businessId: session.businessId,
      name: { equals: trimmedName, mode: 'insensitive' },
      isActive: true,
    }
  })

  if (existingActive) {
    return NextResponse.json({
      error: `Ya existe un servicio activo con el nombre "${trimmedName}" en este negocio.`
    }, { status: 409 })
  }

  const cleanDescription = typeof description === 'string' && description.trim()
    ? description.trim().slice(0, 500)
    : null

  const cleanCategory = typeof category === 'string' && category.trim()
    ? category.trim().slice(0, 50)
    : null

  const service = await prisma.service.create({ 
    data: { 
      name: trimmedName, 
      description: cleanDescription,
      category: cleanCategory,
      duration: Math.round(numDuration), 
      price: numPrice, 
      businessId: session.businessId,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    } 
  })

  return NextResponse.json(service, { status: 201 })
}
