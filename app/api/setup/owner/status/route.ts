import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verificar si ya existe un Propietario Raíz activo con MFA confirmado
    const existingOwner = await prisma.user.findFirst({
      where: {
        role: 'ROOT_PLATFORM_OWNER',
        mfaConfirmedAt: { not: null },
        isActive: true
      },
      select: { id: true, email: true, createdAt: true }
    })

    if (existingOwner) {
      return NextResponse.json({
        setupAvailable: false,
        message: 'El Propietario Raíz (Root Platform Owner) ya ha sido configurado y asegurado.'
      })
    }

    return NextResponse.json({
      setupAvailable: true,
      targetEmail: 'juandieggovlz@gmail.com',
      message: 'Inicialización de cuenta de Propietario Raíz disponible.'
    })
  } catch (error) {
    console.error('Error checking setup status:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

