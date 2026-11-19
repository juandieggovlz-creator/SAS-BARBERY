import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 })
  }

  try {
    // 1. Verificar si es una invitación de Administrador de Sede (BranchInvitation)
    const branchInv = await prisma.branchInvitation.findUnique({
      where: { token },
      include: {
        branch: {
          select: { id: true, name: true, address: true, logo: true }
        },
        company: {
          select: { id: true, name: true }
        }
      }
    })

    if (branchInv) {
      if (branchInv.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Esta invitación ya ha sido aceptada previamente.' }, { status: 400 })
      }
      if (branchInv.status === 'CANCELLED') {
        return NextResponse.json({ error: 'Esta invitación ha sido revocada o cancelada por el propietario.' }, { status: 400 })
      }
      if (new Date() > branchInv.expiresAt) {
        return NextResponse.json({ error: 'Este enlace de invitación ha expirado. Solicita uno nuevo al propietario.' }, { status: 400 })
      }

      return NextResponse.json({
        valid: true,
        type: 'BRANCH_ADMIN',
        email: branchInv.email,
        branchName: branchInv.branch.name,
        companyName: branchInv.company.name,
        branchAddress: branchInv.branch.address,
        branchLogo: branchInv.branch.logo
      })
    }

    // 2. Si no es de sede, verificar si es una invitación de Barbero tradicional (User.inviteToken)
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            status: true,
            avatar: true,
            specialty: true
          }
        },
        business: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Este enlace de invitación no es válido o ya fue utilizado.' }, { status: 404 })
    }

    if (user.barber && user.barber.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Esta cuenta de barbero ha sido desactivada por el propietario.' }, { status: 403 })
    }

    const expires = user.inviteExpires ? new Date(user.inviteExpires) : null
    if (expires && new Date() > expires) {
      return NextResponse.json({ error: 'Este enlace de invitación ha expirado. Solicita un nuevo enlace al propietario.' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      type: 'BARBER',
      email: user.email,
      barberName: user.barber?.name || user.name || 'Barbero',
      businessName: user.business?.name || 'BarberOS',
      hasPassword: Boolean(user.password),
      expiresAt: user.inviteExpires
    })
  } catch (err: unknown) {
    console.error('Error in validate-invite route:', err)
    return NextResponse.json({ error: 'Error al procesar la invitación' }, { status: 500 })
  }
}
