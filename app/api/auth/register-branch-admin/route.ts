import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { token, name, password, acceptedTerms } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (token o contraseña)' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    if (!acceptedTerms) {
      return NextResponse.json({ error: 'Debes aceptar los Términos y Condiciones' }, { status: 400 })
    }

    // Buscar y validar la invitación
    const invitation = await prisma.branchInvitation.findUnique({
      where: { token },
      include: {
        branch: true,
        company: true
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Esta invitación ya fue aceptada previamente' }, { status: 400 })
    }

    if (invitation.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Esta invitación ha sido revocada o cancelada' }, { status: 400 })
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Esta invitación ha expirado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const cleanEmail = invitation.email.toLowerCase().trim()

    // Comprobar si el usuario ya existe con ese correo
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (user) {
      // Actualizar usuario existente como BRANCH_ADMIN
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name?.trim() || user.name,
          password: hashedPassword,
          role: 'BRANCH_ADMIN',
          businessId: invitation.businessId,
          companyId: invitation.companyId
        }
      })
    } else {
      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: name?.trim() || 'Administrador de Sede',
          password: hashedPassword,
          role: 'BRANCH_ADMIN',
          businessId: invitation.businessId,
          companyId: invitation.companyId
        }
      })
    }

    // Asignar como manager en la sede y marcar la invitación como aceptada
    await prisma.$transaction([
      prisma.business.update({
        where: { id: invitation.businessId },
        data: { managerId: user.id }
      }),
      prisma.branchInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          userRole: 'BRANCH_ADMIN',
          businessId: invitation.businessId,
          action: 'BRANCH_ADMIN_ACCEPTED',
          entity: 'BranchInvitation',
          entityId: invitation.id,
          details: {
            email: cleanEmail,
            branchName: invitation.branch.name,
            companyName: invitation.company.name
          }
        }
      })
    ])

    // Crear la sesión autenticada como BRANCH_ADMIN
    await createSession(
      user.id,
      'BRANCH_ADMIN',
      null,
      invitation.businessId,
      null,
      null,
      false,
      invitation.companyId
    )

    return NextResponse.json({
      success: true,
      message: 'Cuenta de Administrador de Sede configurada con éxito',
      redirectUrl: '/dashboard'
    })
  } catch (error: unknown) {
    console.error('Error registering branch admin:', error)
    return NextResponse.json({ error: 'Error interno al registrar el administrador de sede' }, { status: 500 })
  }
}

