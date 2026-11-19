import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { sendBarberInviteEmail } from '@/lib/email'
import { getBarberInviteUrl } from '@/lib/url'

/**
 * PUT: Reenviar invitación / Reiniciar acceso del barbero
 */
export async function PUT(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Falta ID del barbero' }, { status: 400 })
    }

    // Multi-tenant Ownership Verification
    const barberToResetSpace = await prisma.barber.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true } },
        user: true
      }
    })

    if (!barberToResetSpace || barberToResetSpace.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    const inviteToken = randomUUID()
    // Vigencia estándar de 48 horas según directrices de seguridad
    const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000)

    // Actualizar usuario: asignar nuevo token de invitación y vigencia de 48 horas
    if (barberToResetSpace.user) {
      await prisma.user.update({
        where: { id: barberToResetSpace.user.id },
        data: {
          inviteToken,
          inviteExpires
        }
      })
    } else {
      await prisma.user.create({
        data: {
          email: `${barberToResetSpace.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@barberia.com`,
          role: 'BARBER',
          barberId: barberToResetSpace.id,
          businessId: session.businessId,
          inviteToken,
          inviteExpires
        }
      })
    }

    const inviteLink = getBarberInviteUrl(inviteToken)
    const targetEmail = barberToResetSpace.user?.email

    if (targetEmail) {
      sendBarberInviteEmail({
        to: targetEmail,
        barberName: barberToResetSpace.name,
        businessName: barberToResetSpace.business?.name || 'tu barbería',
        inviteLink,
        expiresHours: 48
      }).catch(err => {
        console.warn('Aviso: Envío de correo a barbero diferido o simulado:', err)
      })
    }

    return NextResponse.json({ 
      ok: true, 
      inviteLink,
      message: 'Nuevo enlace generado y enviado exitosamente'
    })
  } catch (error) {
    console.error("Reset Access Error:", error)
    return NextResponse.json({ error: 'Error al reiniciar acceso' }, { status: 500 })
  }
}

/**
 * PATCH: Revocar invitación pendiente (deja la invitación inválida de inmediato)
 */
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Falta ID del barbero' }, { status: 400 })
    }

    // Multi-tenant Ownership Verification
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!barber || barber.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    if (barber.user?.inviteToken) {
      await prisma.user.update({
        where: { id: barber.user.id },
        data: {
          inviteToken: null,
          inviteExpires: null
        }
      })
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Invitación revocada exitosamente' 
    })
  } catch (error) {
    console.error("Revoke Invite Error:", error)
    return NextResponse.json({ error: 'Error al revocar la invitación' }, { status: 500 })
  }
}

/**
 * DELETE: Desactivación segura o eliminación si no tiene registros históricos
 */
export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Falta ID del barbero' }, { status: 400 })
    }

    // Multi-tenant Ownership Verification
    const barberToDelete = await prisma.barber.findUnique({ 
      where: { id },
      include: { user: true }
    })

    if (!barberToDelete || barberToDelete.businessId !== session.businessId) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 })
    }

    // FASE 9: Comprobar si tiene historial operativo (citas)
    const appointmentCount = await prisma.appointment.count({
      where: { barberId: id }
    })

    if (appointmentCount > 0) {
      // PROTEGER HISTORIAL: No eliminar físicamente. Desactivar para preservar auditoría contable.
      await prisma.$transaction([
        prisma.barber.update({
          where: { id },
          data: { status: 'INACTIVE' }
        }),
        prisma.user.updateMany({
          where: { barberId: id },
          data: {
            isActive: false,
            inviteToken: null,
            inviteExpires: null
          }
        })
      ])

      return NextResponse.json({ 
        ok: true, 
        deactivated: true,
        message: 'El barbero tiene historial de citas. Su cuenta ha sido desactivada para salvaguardar la contabilidad y el registro histórico del negocio.' 
      })
    }

    // Si no tiene citas registradas, eliminar de forma limpia y segura
    await prisma.$transaction([
      prisma.barberSchedule.deleteMany({ where: { barberId: id } }),
      prisma.barberBlock.deleteMany({ where: { barberId: id } }),
      prisma.user.deleteMany({ where: { barberId: id } }),
      prisma.barber.delete({ where: { id } })
    ])

    return NextResponse.json({ ok: true, message: 'Barbero eliminado exitosamente' })
  } catch (error) {
    console.error("Delete Barber Error:", error)
    return NextResponse.json({ error: 'Error al procesar la eliminación del barbero' }, { status: 500 })
  }
}
