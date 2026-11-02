import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export interface ChatMember {
  id: string
  name: string
  role: 'OWNER' | 'BARBER' | 'SUPER_ADMIN'
  avatar: string | null
  specialty?: string | null
  phone?: string | null
  email?: string | null
  isCurrentUser: boolean
}

// GET /api/chat/members — returns team members for chat (Owner + Barbers of the business)
export async function GET() {
  const session = await getSession()
  if (!session || !session.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const businessId = session.businessId as string

    // 1. Get Business info and Owner user
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { role: { in: ['OWNER', 'SUPER_ADMIN'] } },
          select: { id: true, email: true, role: true }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const members: ChatMember[] = []

    // 2. Add Owner(s) to members list
    const ownerUser = business.users[0]
    const isCurrentOwner = session.role === 'OWNER' || session.role === 'SUPER_ADMIN'
    
    members.push({
      id: ownerUser ? `user_${ownerUser.id}` : 'owner_admin',
      name: business.name ? `Dueño (${business.name})` : 'Dueño / Administración',
      role: 'OWNER',
      avatar: business.logo || null,
      email: ownerUser?.email || null,
      isCurrentUser: isCurrentOwner
    })

    // 3. Get all active barbers of this business
    const barbers = await prisma.barber.findMany({
      where: { 
        businessId,
        status: { in: ['ACTIVE', 'PENDING'] }
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    for (const b of barbers) {
      const isCurrentBarber = Boolean(
        session.role === 'BARBER' && 
        (session.barberId === b.id || (b.user && session.userId === b.user.id))
      )

      members.push({
        id: `barber_${b.id}`,
        name: b.name,
        role: 'BARBER',
        avatar: b.avatar || null,
        specialty: b.specialty || 'Barbero Profesional',
        phone: b.phone || null,
        email: b.user?.email || null,
        isCurrentUser: isCurrentBarber
      })
    }

    return NextResponse.json({
      members,
      currentUserId: isCurrentOwner ? (ownerUser ? `user_${ownerUser.id}` : 'owner_admin') : `barber_${session.barberId}`,
      currentRole: session.role
    })
  } catch (error) {
    console.error('Error fetching chat members:', error)
    return NextResponse.json({ error: 'Error al obtener miembros del equipo' }, { status: 500 })
  }
}
