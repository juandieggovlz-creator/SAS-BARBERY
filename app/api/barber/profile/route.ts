import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession('BARBER')
  if (!session || session.role !== 'BARBER' || !session.barberId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const barber = await prisma.barber.findUnique({
      where: { id: session.barberId as string },
      include: { 
        user: { select: { email: true } },
        business: { select: { id: true, name: true, logo: true, slug: true } }
      }
    })
    if (!barber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }
    return NextResponse.json({
      ...barber,
      isImpersonating: Boolean(session.originalOwnerId)
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession('BARBER')
  if (!session || session.role !== 'BARBER' || !session.barberId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { name, specialty, avatar, phone } = await request.json()
    const updatedBarber = await prisma.barber.update({
      where: { id: session.barberId as string },
      data: { 
        ...(name && { name }), 
        ...(specialty !== undefined && { specialty }), 
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone })
      }
    })
    return NextResponse.json(updatedBarber)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }
}
