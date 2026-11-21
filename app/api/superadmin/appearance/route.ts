import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccentByHex, DEFAULT_ACCENT } from '@/lib/accent-colors'
import { recordAuditLog } from '@/lib/audit'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, accentColor: true }
    })

    const cookieStore = await cookies()
    const cookieTheme = cookieStore.get('barberos-superadmin-theme')?.value || 'dark'
    const validatedAccent = getAccentByHex(user?.accentColor || DEFAULT_ACCENT.hex)

    return NextResponse.json({
      theme: cookieTheme === 'light' ? 'light' : 'dark',
      accentColor: validatedAccent.hex,
      accentName: validatedAccent.name
    })
  } catch (error) {
    console.error('Super Admin Appearance GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar apariencia' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { theme, accentColor } = body

    const validatedAccent = accentColor ? getAccentByHex(accentColor) : DEFAULT_ACCENT
    const validatedTheme = theme === 'light' ? 'light' : 'dark'

    // 1. Persistir el color de acento personal en la base de datos para este usuario
    await prisma.user.update({
      where: { id: session.userId },
      data: { accentColor: validatedAccent.hex }
    })

    // 2. Establecer cookies específicas del Super Admin (NUNCA tocan barberos-theme global)
    const cookieStore = await cookies()
    cookieStore.set('barberos-superadmin-theme', validatedTheme, {
      path: '/superadmin',
      maxAge: 31536000,
      sameSite: 'lax'
    })
    cookieStore.set('barberos-superadmin-accent', validatedAccent.hex, {
      path: '/superadmin',
      maxAge: 31536000,
      sameSite: 'lax'
    })

    // 3. Auditoría de aislamiento
    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      action: 'SUPERADMIN_APPEARANCE_UPDATED',
      entity: 'User',
      entityId: session.userId,
      details: {
        theme: validatedTheme,
        accentColor: validatedAccent.hex,
        scope: 'SUPERADMIN_PERSONAL_ONLY'
      }
    })

    return NextResponse.json({
      success: true,
      theme: validatedTheme,
      accentColor: validatedAccent.hex,
      message: 'Apariencia de la consola Super Admin guardada exitosamente'
    })
  } catch (error) {
    console.error('Super Admin Appearance POST Error:', error)
    return NextResponse.json({ error: 'Error al guardar apariencia' }, { status: 500 })
  }
}
