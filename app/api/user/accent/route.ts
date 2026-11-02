import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccentByHex } from '@/lib/accent-colors'

async function resolveSession() {
  try {
    let session = await getSession()
    if (session?.userId) return session
    session = await getSession('OWNER')
    if (session?.userId) return session
    session = await getSession('BARBER')
    if (session?.userId) return session
    session = await getSession('SUPER_ADMIN')
    if (session?.userId) return session
  } catch (e) {
    console.warn('[ACCENT] resolveSession error:', e)
  }
  return null
}

// GET /api/user/accent
export async function GET() {
  try {
    const session = await resolveSession()
    if (!session?.userId) {
      return NextResponse.json({ accentColor: '#F59E0B' })
    }

    // Intentar leer de Prisma
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { accentColor: true },
      })
      if (user?.accentColor) {
        return NextResponse.json({ accentColor: user.accentColor })
      }
    } catch {
      // Fallback a SQL crudo si Prisma DMMF no tiene el campo en memoria
      try {
        const rows: any = await prisma.$queryRawUnsafe(
          `SELECT "accentColor" FROM "User" WHERE "id" = $1 LIMIT 1`,
          session.userId
        )
        if (rows?.[0]?.accentColor) {
          return NextResponse.json({ accentColor: rows[0].accentColor })
        }
      } catch {
        /* fallback abajo */
      }
    }

    return NextResponse.json({ accentColor: '#F59E0B' })
  } catch (err) {
    console.error('GET /api/user/accent error:', err)
    return NextResponse.json({ accentColor: '#F59E0B' })
  }
}

// PATCH /api/user/accent
export async function PATCH(request: Request) {
  try {
    const session = await resolveSession()
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión para guardar tu color de acento.' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const rawColor = body?.accentColor
    if (!rawColor || typeof rawColor !== 'string') {
      return NextResponse.json({ error: 'Color no especificado' }, { status: 400 })
    }

    const accent = getAccentByHex(rawColor)
    if (!accent) {
      return NextResponse.json({ error: 'Color no permitido' }, { status: 400 })
    }

    // 1. Resolver el ID del usuario en la base de datos
    let targetUserId = session.userId

    // Verificar si existe el usuario por id
    const userById = await prisma.user
      .findUnique({ where: { id: targetUserId }, select: { id: true } })
      .catch(() => null)

    if (!userById) {
      // Buscar si es un barbero con barberId
      if (session.barberId) {
        const barberUser = await prisma.user
          .findFirst({ where: { barberId: session.barberId }, select: { id: true } })
          .catch(() => null)
        if (barberUser) targetUserId = barberUser.id
      } else if (session.businessId) {
        // Buscar el usuario OWNER de la barbería
        const ownerUser = await prisma.user
          .findFirst({ where: { businessId: session.businessId, role: 'OWNER' }, select: { id: true } })
          .catch(() => null)
        if (ownerUser) targetUserId = ownerUser.id
      }
    }

    // 2. Intentar actualizar mediante Prisma Client
    let saved = false
    try {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { accentColor: accent.hex },
      })
      saved = true
    } catch {
      // 3. Fallback directo a SQL si el modelo Prisma en memoria aún no recargó la columna
      try {
        const affected = await prisma.$executeRawUnsafe(
          `UPDATE "User" SET "accentColor" = $1 WHERE "id" = $2`,
          accent.hex,
          targetUserId
        )
        if (Number(affected) > 0) saved = true
      } catch (rawErr) {
        console.warn('[ACCENT PATCH] SQL fallback error:', rawErr)
      }
    }

    // 4. Si el usuario tiene businessId, sincronizar también en su BusinessPage
    if (session.businessId) {
      await prisma.businessPage
        .updateMany({
          where: { businessId: session.businessId },
          data: { accentColor: accent.hex },
        })
        .catch(() => {})
    }

    // Siempre devolvemos éxito para que la experiencia del usuario sea inmediata
    return NextResponse.json({
      success: true,
      savedInDb: saved,
      accentColor: accent.hex,
    })
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('PATCH /api/user/accent error:', errorMsg)
    return NextResponse.json(
      { error: errorMsg || 'Error al guardar el color' },
      { status: 400 }
    )
  }
}
