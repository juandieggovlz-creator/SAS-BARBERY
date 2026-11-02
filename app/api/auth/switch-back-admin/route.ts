import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, createSession } from '@/lib/auth'

export async function POST() {
  const session = await getSession()
  if (!session || !session.originalOwnerId) {
    return NextResponse.json({ error: 'No estás en modo supervisor/simulación' }, { status: 400 })
  }

  try {
    const ownerUser = await prisma.user.findUnique({
      where: { id: session.originalOwnerId }
    })

    if (!ownerUser) {
      return NextResponse.json({ error: 'Usuario administrador no encontrado' }, { status: 404 })
    }

    await createSession(ownerUser.id, ownerUser.role, null, ownerUser.businessId, null)

    return NextResponse.json({ success: true, redirect: '/barbers' })
  } catch (error) {
    console.error('Error switching back to admin:', error)
    return NextResponse.json({ error: 'Error al regresar a la cuenta admin' }, { status: 500 })
  }
}
