import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, encrypt } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: targetBranchId } = await context.params

    // Validar que la sede pertenezca a la empresa del propietario
    const branch = await prisma.business.findUnique({
      where: { id: targetBranchId },
      include: {
        company: { select: { id: true, ownerId: true } },
      },
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 })
    }

    if (session.role !== 'SUPER_ADMIN') {
      const isOwnerOfCompany =
        branch.company?.ownerId === session.userId ||
        (session.companyId && branch.companyId === session.companyId)

      if (!isOwnerOfCompany) {
        return NextResponse.json({ error: 'No tienes permisos para administrar esta sede' }, { status: 403 })
      }
    }

    // Generar un nuevo JWT de sesión con el nuevo businessId activo
    const updatedPayload = {
      userId: session.userId,
      role: session.role,
      businessId: branch.id,
      companyId: branch.companyId || session.companyId || null,
      barberId: session.barberId || null,
      sessionId: session.sessionId || null,
      needsOnboarding: false,
    }

    const sessionJwt = await encrypt(updatedPayload, '7d')

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    }

    const response = NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
      },
      redirectUrl: '/dashboard',
    })

    response.cookies.set('owner_session', sessionJwt, cookieOpts)
    response.cookies.set('session', sessionJwt, cookieOpts)
    response.cookies.set('active_branch_id', branch.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax' as const,
    })

    return response
  } catch (error: any) {
    console.error('Error switching branch:', error)
    return NextResponse.json({ error: 'Error al cambiar de sede' }, { status: 500 })
  }
}
