import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  
  const clients = await prisma.client.findMany({
    where: { businessId: session.businessId }
  })
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, phone } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'Nombre y teléfono son requeridos' }, { status: 400 })
  }

  const client = await prisma.client.create({ 
    data: { 
      name, 
      phone, 
      businessId: session.businessId 
    } 
  })
  return NextResponse.json(client, { status: 201 })
}
