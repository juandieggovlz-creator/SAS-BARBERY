import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 })
  }

  let user: { id: string; email: string; inviteExpires?: Date | string | null } | null = null
  try {
    user = await prisma.user.findUnique({
      where: { inviteToken: token }
    })
  } catch (error) {
    console.warn("Fallback to RAW SQL for token validation:", error)
    const users = await prisma.$queryRaw<{ id: string; email: string; inviteExpires: Date | null }[]>`SELECT id, email, "inviteToken", "inviteExpires" FROM "User" WHERE "inviteToken" = ${token}`
    user = users.length > 0 ? users[0] : null
  }

  if (!user) {
    return NextResponse.json({ error: 'Este enlace de invitación no es válido' }, { status: 404 })
  }

  const expires = user.inviteExpires ? new Date(user.inviteExpires) : null
  if (expires && new Date() > expires) {
    return NextResponse.json({ error: 'Este enlace ha expirado' }, { status: 400 })
  }

  return NextResponse.json({ valid: true, email: user.email })
}
