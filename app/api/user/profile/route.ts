import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        email: true,
        role: true,
        password: true,
        googleSub: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true,
          },
        },
        barber: {
          select: {
            id: true,
            business: {
              select: {
                id: true,
                name: true,
                logo: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const effectiveBusiness = user.business || user.barber?.business

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || '',
        avatar: user.avatar || null,
        email: user.email,
        role: user.role,
        hasPassword: Boolean(user.password),
        isGoogleUser: Boolean(user.googleSub && !user.password),
        createdAt: user.createdAt,
        businessName: effectiveBusiness?.name || 'Mi Barbería',
        businessLogo: effectiveBusiness?.logo || null,
        businessSlug: effectiveBusiness?.slug || null,
      },
    })
  } catch (error) {
    console.error('[User Profile GET] Error:', error)
    return NextResponse.json({ error: 'Error del servidor al obtener perfil' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { name } = body

    if (name !== undefined) {
      const cleanName = String(name).trim()
      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json(
          { error: 'El nombre debe tener al menos 2 caracteres' },
          { status: 400 }
        )
      }
      if (cleanName.length > 100) {
        return NextResponse.json(
          { error: 'El nombre no puede exceder 100 caracteres' },
          { status: 400 }
        )
      }

      const updated = await prisma.user.update({
        where: { id: session.userId },
        data: { name: cleanName },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          barberId: true,
        },
      })

      // Si el usuario es un barbero con perfil vinculado, mantener sincronizado su nombre operativo
      if (updated.barberId) {
        await prisma.barber.update({
          where: { id: updated.barberId },
          data: { name: cleanName },
        }).catch((err) => {
          console.warn('[User Profile PATCH] No se pudo sincronizar el nombre en Barber:', err)
        })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
        },
        message: 'Nombre de usuario actualizado correctamente',
      })
    }

    return NextResponse.json({ error: 'No se enviaron datos para actualizar' }, { status: 400 })
  } catch (error) {
    console.error('[User Profile PATCH] Error:', error)
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 })
  }
}
