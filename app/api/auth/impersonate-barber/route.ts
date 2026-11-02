import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, createSession } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN' && !session.originalOwnerId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { barberId } = await request.json()
    if (!barberId) {
      return NextResponse.json({ error: 'Falta ID de barbero' }, { status: 400 })
    }

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: { user: true }
    })

    if (!barber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    // Retain original owner ID
    const originalOwnerId = session.originalOwnerId || session.userId
    const targetUserId = barber.user?.id || session.userId

    // Switch session to this BARBER
    await createSession(targetUserId, 'BARBER', barber.id, barber.businessId, originalOwnerId)

    return NextResponse.json({ success: true, redirect: '/barber/dashboard' })
  } catch (error) {
    console.error('Error impersonating barber:', error)
    return NextResponse.json({ error: 'Error al cambiar de sesión al barbero' }, { status: 500 })
  }
}
