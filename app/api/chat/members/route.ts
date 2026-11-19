import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export interface ChatMember {
  id: string
  name: string
  role: 'OWNER' | 'BRANCH_ADMIN' | 'BARBER' | 'SUPER_ADMIN'
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
          where: { role: { in: ['OWNER', 'BRANCH_ADMIN', 'SUPER_ADMIN'] } },
          select: { id: true, email: true, role: true }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const members: ChatMember[] = []

    const currentMemberId = session.role === 'BARBER' && session.barberId
      ? `barber_${session.barberId}`
      : `user_${session.userId}`

    // 2. Add Owner(s) and Branch Admin(s) to members list
    if (business.users.length > 0) {
      for (const u of business.users) {
        const isSelf = session.userId === u.id
        const isOwnerRole = u.role === 'OWNER' || u.role === 'SUPER_ADMIN' || (u.role as string) === 'ROOT_PLATFORM_OWNER'
        members.push({
          id: `user_${u.id}`,
          name: isOwnerRole
            ? (business.name ? `Dueño (${business.name})` : 'Dueño / Administración')
            : `Administrador de Sede (${business.name})`,
          role: isOwnerRole ? 'OWNER' : 'BRANCH_ADMIN',
          avatar: business.logo || null,
          email: u.email || null,
          isCurrentUser: isSelf
        })
      }
    } else {
      const isCurrentOwner = session.role !== 'BARBER'
      members.push({
        id: 'owner_admin',
        name: business.name ? `Dueño (${business.name})` : 'Dueño / Administración',
        role: 'OWNER',
        avatar: business.logo || null,
        email: null,
        isCurrentUser: isCurrentOwner
      })
    }

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
      currentUserId: currentMemberId,
      currentRole: session.role
    })
  } catch (error) {
    console.error('Error fetching chat members:', error)
    return NextResponse.json({ error: 'Error al obtener miembros del equipo' }, { status: 500 })
  }
}
