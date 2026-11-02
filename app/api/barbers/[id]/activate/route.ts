import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Verify ownership
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!barber || barber.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    let inviteToken = barber.user?.inviteToken
    let inviteExpires = barber.user?.inviteExpires

    // Ensure a valid inviteToken exists with long-lived expiry (1 year)
    const isTokenExpired = !inviteExpires || new Date() > inviteExpires
    if (!inviteToken || isTokenExpired) {
      inviteToken = randomUUID()
      inviteExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

      if (barber.user) {
        await prisma.user.update({
          where: { id: barber.user.id },
          data: {
            inviteToken,
            inviteExpires
          }
        })
      } else {
        await prisma.user.create({
          data: {
            email: `${barber.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@barberia.com`,
            role: 'BARBER',
            barberId: barber.id,
            businessId: session.businessId,
            inviteToken,
            inviteExpires
          }
        })
      }
    }

    // Set barber status to ACTIVE
    const updatedBarber = await prisma.barber.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            email: true,
            inviteToken: true,
            password: true
          }
        }
      }
    })

    const origin = new URL(request.url).origin
    // Each barber gets their own dedicated dashboard access link
    const inviteLink = `${origin}/barber/access/${inviteToken}`

    return NextResponse.json({
      success: true,
      barber: updatedBarber,
      inviteLink,
      message: '¡Dashboard del barbero activado con éxito!'
    })
  } catch (error) {
    console.error('Barber Activation Error:', error)
    return NextResponse.json({ error: 'Error al activar el dashboard del barbero' }, { status: 500 })
  }
}
