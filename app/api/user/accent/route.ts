import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccentByHex, DEFAULT_ACCENT } from '@/lib/accent-colors'

async function resolveSession() {
  try {
    let session = await getSession('OWNER')
    if (session?.userId) return session
    session = await getSession('BRANCH_ADMIN')
    if (session?.userId) return session
    session = await getSession('BARBER')
    if (session?.userId) return session
    session = await getSession('SUPER_ADMIN')
    if (session?.userId) return session
    session = await getSession()
    if (session?.userId) return session
  } catch (e) {
    console.warn('[ACCENT] resolveSession error:', e)
  }
  return null
}

// GET /api/user/accent
// Resuelve el color de acento del negocio autenticado con estricto aislamiento multi-tenant y multi-sede.
export async function GET() {
  try {
    const session = await resolveSession()
    if (!session?.userId) {
      return NextResponse.json(
        { accentColor: DEFAULT_ACCENT.hex, businessId: null, companyId: null },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      )
    }

    // 1. Obtener usuario con sus relaciones de negocio y empresa
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        role: true,
        accentColor: true,
        businessId: true,
        companyId: true,
        business: {
          select: {
            id: true,
            companyId: true,
            page: { select: { accentColor: true } }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { accentColor: DEFAULT_ACCENT.hex, businessId: null, companyId: null },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      )
    }

    let resolvedAccent: string | null = null
    const effectiveCompanyId = user.companyId || user.business?.companyId
    const effectiveBusinessId = user.businessId || user.business?.id

    // 2. Si pertenece a una empresa multi-sede, el tema maestro es el de la empresa (sede principal u owner)
    if (effectiveCompanyId) {
      // a) BusinessPage de la sede principal
      const mainBranchPage = await prisma.businessPage.findFirst({
        where: {
          business: {
            companyId: effectiveCompanyId,
            isMainBranch: true
          }
        },
        select: { accentColor: true }
      })
      if (mainBranchPage?.accentColor) {
        resolvedAccent = mainBranchPage.accentColor
      }

      // b) Si no hay, BusinessPage de la sede actual
      if (!resolvedAccent && user.business?.page?.accentColor) {
        resolvedAccent = user.business.page.accentColor
      }

      // c) Si no hay, tema del OWNER de la empresa
      if (!resolvedAccent) {
        const ownerUser = await prisma.user.findFirst({
          where: {
            companyId: effectiveCompanyId,
            role: 'OWNER'
          },
          select: { accentColor: true }
        })
        if (ownerUser?.accentColor) {
          resolvedAccent = ownerUser.accentColor
        }
      }
    } else if (effectiveBusinessId) {
      // 3. Negocio de una sola sede
      if (user.business?.page?.accentColor) {
        resolvedAccent = user.business.page.accentColor
      } else {
        const ownerUser = await prisma.user.findFirst({
          where: {
            businessId: effectiveBusinessId,
            role: 'OWNER'
          },
          select: { accentColor: true }
        })
        if (ownerUser?.accentColor) {
          resolvedAccent = ownerUser.accentColor
        }
      }
    }

    // 4. Fallback al accent del propio usuario o al dorado por defecto
    if (!resolvedAccent && user.accentColor) {
      resolvedAccent = user.accentColor
    }

    const validatedAccent = getAccentByHex(resolvedAccent || DEFAULT_ACCENT.hex)

    return NextResponse.json(
      {
        accentColor: validatedAccent.hex,
        businessId: effectiveBusinessId || null,
        companyId: effectiveCompanyId || null
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (err) {
    console.error('GET /api/user/accent error:', err)
    return NextResponse.json(
      { accentColor: DEFAULT_ACCENT.hex, businessId: null, companyId: null },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  }
}

// PATCH /api/user/accent
// Modifica el color de acento del negocio garantizando autorización y propagación multi-sede.
export async function PATCH(request: Request) {
  try {
    const session = await resolveSession()
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión para modificar el tema.' },
        { status: 401 }
      )
    }

    // Si el usuario es un BARBERO, se le permite personalizar su experiencia visual individual (User.accentColor)
    // sin alterar el tema corporativo del negocio ni afectar a otros miembros o a la página pública.
    if (session.role === 'BARBER') {
      const body = await request.json().catch(() => ({}))
      const rawColor = body?.accentColor
      if (!rawColor || typeof rawColor !== 'string') {
        return NextResponse.json({ error: 'Color no especificado' }, { status: 400 })
      }

      const accent = getAccentByHex(rawColor)
      if (!accent) {
        return NextResponse.json(
          { error: 'Color no permitido. Debe ser uno de los 4 colores aprobados de la paleta BarberOS.' },
          { status: 400 }
        )
      }

      await prisma.user.update({
        where: { id: session.userId },
        data: { accentColor: accent.hex }
      })

      return NextResponse.json({
        success: true,
        accentColor: accent.hex,
        scope: 'USER_PERSONAL'
      })
    }

    const body = await request.json().catch(() => ({}))
    const rawColor = body?.accentColor
    if (!rawColor || typeof rawColor !== 'string') {
      return NextResponse.json({ error: 'Color no especificado' }, { status: 400 })
    }

    const accent = getAccentByHex(rawColor)
    if (!accent) {
      return NextResponse.json(
        { error: 'Color no permitido. Debe ser uno de los 4 colores aprobados de la paleta BarberOS.' },
        { status: 400 }
      )
    }

    // Cargar usuario autenticado en base de datos
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        role: true,
        businessId: true,
        companyId: true,
        business: {
          select: {
            id: true,
            companyId: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // PROTECCIÓN CONTRA MANIPULACIÓN CRUZADA (Anti-Tampering / Multi-Tenant Isolation):
    // Si el payload contiene un businessId o companyId ajeno, rechazar inmediatamente
    if (body.businessId && user.role !== 'SUPER_ADMIN') {
      const allowedBizId = user.businessId || user.business?.id
      if (body.businessId !== allowedBizId) {
        return NextResponse.json(
          { error: 'Violación de aislamiento multi-tenant: no puedes modificar el tema de otro negocio.' },
          { status: 403 }
        )
      }
    }
    if (body.companyId && user.role !== 'SUPER_ADMIN') {
      const allowedCompanyId = user.companyId || user.business?.companyId
      if (body.companyId !== allowedCompanyId) {
        return NextResponse.json(
          { error: 'Violación de aislamiento multi-tenant: no puedes modificar el tema de otra empresa.' },
          { status: 403 }
        )
      }
    }

    const targetCompanyId = user.companyId || user.business?.companyId
    const targetBusinessId = user.businessId || user.business?.id

    // 1. Actualizar el usuario solicitante
    await prisma.user.update({
      where: { id: user.id },
      data: { accentColor: accent.hex }
    })

    // 2. Si el negocio pertenece a una compañía multi-sede, propagar tema a TODAS las sedes y a TODOS los miembros
    if (targetCompanyId) {
      // a) Actualizar todas las BusinessPage de las sedes de la empresa
      await prisma.businessPage.updateMany({
        where: {
          business: {
            companyId: targetCompanyId
          }
        },
        data: { accentColor: accent.hex }
      })

      // b) Actualizar todos los usuarios miembros de esa empresa (barberos, branch admins, etc.)
      await prisma.user.updateMany({
        where: {
          OR: [
            { companyId: targetCompanyId },
            { business: { companyId: targetCompanyId } }
          ]
        },
        data: { accentColor: accent.hex }
      })
    } else if (targetBusinessId) {
      // 3. Negocio de sede única: actualizar BusinessPage y sus miembros
      await prisma.businessPage.updateMany({
        where: { businessId: targetBusinessId },
        data: { accentColor: accent.hex }
      })

      await prisma.user.updateMany({
        where: { businessId: targetBusinessId },
        data: { accentColor: accent.hex }
      })
    }

    return NextResponse.json({
      success: true,
      accentColor: accent.hex,
      businessId: targetBusinessId || null,
      companyId: targetCompanyId || null
    })
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('PATCH /api/user/accent error:', errorMsg)
    return NextResponse.json(
      { error: errorMsg || 'Error al guardar el color' },
      { status: 500 }
    )
  }
}
