import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession('OWNER')

    if (!session || !session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { business: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      name: user.name || 'Propietario',
      email: user.email,
      avatar: user.avatar || user.business?.logo || null,
      businessName: user.business?.name && !user.business.name.startsWith('Barbería en Configuración')
        ? user.business.name
        : '',
      onboardingCompleted: Boolean(user.business?.onboardingCompleted),
    })
  } catch (err: unknown) {
    console.error('[Onboarding Info API] Error:', err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
