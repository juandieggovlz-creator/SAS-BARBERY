import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession, getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Faltan datos (token o contraseña)' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ 
      where: { inviteToken: token },
      include: { barber: true }
    })
    
    if (!user || !user.inviteExpires || new Date() > user.inviteExpires) {
      return NextResponse.json({ error: 'Enlace de invitación inválido o expirado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword
        }
      }),
      prisma.barber.update({
        where: { id: user.barberId! },
        data: { status: 'ACTIVE' }
      })
    ])

    // Check if an Owner/Admin is testing this link to avoid overwriting their session
    const currentSession = await getSession()
    if (!currentSession || (currentSession.role !== 'OWNER' && currentSession.role !== 'SUPER_ADMIN')) {
      await createSession(user.id, 'BARBER', user.barberId || null, user.businessId || null)
      return NextResponse.json({ success: true, role: 'BARBER' })
    }

    return NextResponse.json({ success: true, role: currentSession.role })
  } catch (error: unknown) {
    console.error("Activation Error:", error)
    return NextResponse.json({ error: 'Error interno del servidor al activar cuenta' }, { status: 500 })
  }
}
