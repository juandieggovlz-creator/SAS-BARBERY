import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { parseSchedule } from '@/lib/schedule'

export const dynamic = 'force-dynamic'

async function verifyBranchAccess(
  session: { userId: string; role: string; companyId?: string | null; businessId?: string | null },
  branchId: string
) {
  if (session.role === 'SUPER_ADMIN') return true

  if (session.role === 'BRANCH_ADMIN') {
    return session.businessId === branchId
  }

  if (session.role === 'OWNER') {
    // Verificar si la sede pertenece a una empresa del propietario
    const branch = await prisma.business.findUnique({
      where: { id: branchId },
      select: { companyId: true, company: { select: { ownerId: true } } },
    })
    if (!branch) return false
    if (branch.company?.ownerId === session.userId) return true
    if (session.companyId && branch.companyId === session.companyId) return true
  }

  return false
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('OWNER')
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params
    const hasAccess = await verifyBranchAccess(session, branchId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
    }

    const [closures, branchPage] = await Promise.all([
      prisma.branchClosure.findMany({
        where: { businessId: branchId },
        orderBy: { startDate: 'asc' },
      }),
      prisma.businessPage.findUnique({
        where: { businessId: branchId },
        select: { businessHours: true },
      }),
    ])

    const weeklySchedule = branchPage?.businessHours
      ? parseSchedule(branchPage.businessHours)
      : []

    return NextResponse.json({
      closures,
      weeklySchedule,
    })
  } catch (error: any) {
    console.error('Error fetching branch closures:', error)
    return NextResponse.json({ error: 'Error al obtener bloqueos de la sede' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('OWNER')
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: branchId } = await context.params
    const hasAccess = await verifyBranchAccess(session, branchId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a esta sede' }, { status: 403 })
    }

    const body = await request.json()
    const { startDate, endDate, reason, confirmWithConflicts } = body

    if (!startDate) {
      return NextResponse.json({ error: 'La fecha de inicio es obligatoria' }, { status: 400 })
    }

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = endDate ? new Date(endDate) : new Date(startDate)
    end.setHours(23, 59, 59, 999)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 })
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'La fecha de inicio no puede ser posterior a la fecha final' },
        { status: 400 }
      )
    }

    // 1. Verificar si existen citas agendadas en ese rango
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        businessId: branchId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        date: { gte: start, lte: end },
      },
      select: {
        id: true,
        date: true,
        client: { select: { name: true, phone: true } },
        service: { select: { name: true } },
        barber: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    })

    if (conflictingAppointments.length > 0 && !confirmWithConflicts) {
      return NextResponse.json({
        warning: true,
        conflictCount: conflictingAppointments.length,
        message: `Existen ${conflictingAppointments.length} cita(s) previamente agendada(s) en este período. No se cancelarán automáticamente. Por favor confirma si deseas aplicar el bloqueo.`,
        conflicts: conflictingAppointments.slice(0, 10).map((a) => ({
          id: a.id,
          date: a.date,
          clientName: a.client?.name || 'Cliente sin nombre',
          clientPhone: a.client?.phone || 'Sin teléfono',
          serviceName: a.service?.name || 'Servicio',
          barberName: a.barber?.name || 'Barbero asignado',
        })),
      }, { status: 200 })
    }

    // 2. Crear el bloqueo
    const closure = await prisma.branchClosure.create({
      data: {
        businessId: branchId,
        startDate: start,
        endDate: end,
        reason: reason?.trim() || null,
      },
    })

    await recordAuditLog({
      businessId: branchId,
      userId: session.userId,
      userRole: session.role as any,
      action: 'CREATE',
      entity: 'BranchClosure',
      entityId: closure.id,
      details: {
        description: `Bloqueo de sede creado del ${start.toLocaleDateString('es-CO')} al ${end.toLocaleDateString('es-CO')}${reason ? ` (${reason})` : ''}`,
        closureId: closure.id,
        startDate: start,
        endDate: end,
        reason,
        conflictingAppointmentsCount: conflictingAppointments.length,
      },
    })

    return NextResponse.json({
      success: true,
      closure,
      conflictsCount: conflictingAppointments.length,
    })
  } catch (error: any) {
    console.error('Error creating branch closure:', error)
    return NextResponse.json({ error: 'Error al registrar bloqueo de sede' }, { status: 500 })
  }
}
