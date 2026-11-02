import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const barbers = await prisma.barber.findMany({
      where: { businessId: session.businessId },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            inviteToken: true,
            password: true
          }
        }
      }
    })

    // Ensure all barbers have a unique direct access token
    for (const barber of barbers) {
      if (barber.user && !barber.user.inviteToken) {
        const token = randomUUID()
        await prisma.user.update({
          where: { id: barber.user.id },
          data: {
            inviteToken: token,
            inviteExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        })
        barber.user.inviteToken = token
      }
    }

    return NextResponse.json(barbers)
  } catch (error) {
    console.error("Prisma findMany failed:", error)
    return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !session.businessId || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, avatar, specialty, phone } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Nombre y Email son requeridos' }, { status: 400 })
  }

  const businessId = session.businessId
  const inviteToken = randomUUID()
  const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  try {
    const barber = await prisma.barber.create({ 
      data: { 
        name, 
        businessId,
        avatar: avatar ? String(avatar).trim() : null,
        specialty: specialty ? String(specialty).trim() : null,
        phone: phone ? String(phone).trim() : null,
        status: 'PENDING',
        schedules: {
          create: [
            { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', isWorking: true },
            { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isWorking: true },
            { dayOfWeek: 6, startTime: '08:00', endTime: '19:00', isWorking: true },
          ]
        },
        user: { 
          create: { 
            email, 
            role: 'BARBER', 
            inviteToken, 
            inviteExpires,
            businessId
          } 
        }
      },
      include: { user: true, schedules: true }
    })
    const origin = new URL(request.url).origin
    return NextResponse.json({ barber, inviteLink: `${origin}/invite/${inviteToken}` }, { status: 201 })
  } catch (error: unknown) {
    console.error("Barber creation failed:", error)
    return NextResponse.json({ error: 'No se pudo crear el barbero. Es posible que el email ya esté en uso.' }, { status: 500 })
  }
}
