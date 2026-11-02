import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    const inviteToken = randomUUID()
    const inviteExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    // Multi-tenant Ownership Verification
    const barberToResetSpace = await prisma.barber.findUnique({ where: { id } })
    if (!barberToResetSpace || barberToResetSpace.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    // Reset user: clear password, set new token and 1-year expiry
    await prisma.$executeRaw`
      UPDATE "User"
      SET password = NULL, "inviteToken" = ${inviteToken}, "inviteExpires" = ${inviteExpires}
      WHERE "barberId" = ${id}
    `

    const origin = new URL(request.url).origin
    return NextResponse.json({ 
      ok: true, 
      inviteLink: `${origin}/barber/access/${inviteToken}` 
    })
  } catch (error) {
    console.error("Reset Access Error:", error)
    return NextResponse.json({ error: 'Error al reiniciar acceso' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request
) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    // Multi-tenant Ownership Verification
    const barberToDelete = await prisma.barber.findUnique({ where: { id } })
    if (!barberToDelete || barberToDelete.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }
    
    try {
      await prisma.$executeRaw`DELETE FROM "User" WHERE "barberId" = ${id}`
    } catch {
      console.warn("No user to delete or SQL failed")
    }

    await prisma.barber.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el barbero' }, { status: 500 })
  }
}
