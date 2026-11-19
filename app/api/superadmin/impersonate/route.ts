import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession, createSession, isSuperAdminRole } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { sendSentinelNotification } from '@/lib/telegram-sentinel'

export async function POST(request: Request) {
  const session = await getSession('SUPER_ADMIN')
  if (!session || !isSuperAdminRole(session.role)) {
    return NextResponse.json({ error: 'Acceso no autorizado. Exclusivo para Super Admin.' }, { status: 403 })
  }

  // Impedir iniciar una nueva sesión de soporte desde una sesión que ya está suplantando
  if (session.superAdminId) {
    return NextResponse.json(
      { error: 'Ya te encuentras en una sesión de soporte activa. Regresa primero a Super Admin.' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const {
      businessId,
      targetPanel = 'OWNER', // 'OWNER' | 'BRANCH_ADMIN' | 'BARBER'
      barberId,
      branchId,
      reason
    } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Falta ID de la barbería' }, { status: 400 })
    }

    const cleanReason =
      typeof reason === 'string' && reason.trim().length > 0
        ? reason.trim()
        : 'Soporte técnico, inspección y resolución de incidencias desde Super Admin'

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: true,
        barbers: {
          include: { user: true },
          orderBy: { createdAt: 'asc' }
        },
        company: {
          include: {
            branches: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 })
    }

    const cookieStore = await cookies()
    const ownerUser = business.users.find(u => u.role === 'OWNER') || business.users[0]
    const ownerUserId = ownerUser?.id || session.userId
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

    // ── MODO 1: ACCESO ADMINISTRATIVO A PANEL DE BARBERO ──
    if (targetPanel === 'BARBER') {
      const targetBarber = barberId
        ? business.barbers.find(b => b.id === barberId)
        : business.barbers.find(b => b.status === 'ACTIVE') || business.barbers[0]

      if (!targetBarber) {
        return NextResponse.json(
          { error: 'Esta barbería no tiene barberos registrados para inspeccionar su panel.' },
          { status: 404 }
        )
      }

      // Aislamiento estricto: el barbero debe pertenecer al negocio seleccionado
      if (targetBarber.businessId !== business.id) {
        return NextResponse.json(
          { error: 'Violación de aislamiento: el barbero no pertenece a este negocio.' },
          { status: 403 }
        )
      }

      const barberUserId = targetBarber.user?.id || ownerUserId

      // Establecer sesión de soporte base (acotada al negocio) y sesión de barbero (acotada al barbero)
      await createSession(
        ownerUserId,
        'OWNER',
        null,
        business.id,
        null,
        session.userId,
        false,
        business.companyId,
        null,
        false,
        cleanReason
      )

      await createSession(
        barberUserId,
        'BARBER',
        targetBarber.id,
        business.id,
        ownerUserId,
        session.userId,
        false,
        business.companyId,
        null,
        false,
        cleanReason
      )

      cookieStore.set('active_branch_id', business.id, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 2 * 60 * 60
      })

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: business.id,
        action: 'IMPERSONATE_LOGIN',
        entity: 'Barber',
        entityId: targetBarber.id,
        details: {
          businessName: business.name,
          businessSlug: business.slug,
          targetPanel: 'BARBER',
          barberId: targetBarber.id,
          barberName: targetBarber.name,
          reason: cleanReason,
          expiresAt
        }
      })

      return NextResponse.json({
        success: true,
        message: `Acceso temporal de soporte al panel del barbero ${targetBarber.name} (${business.name})`,
        redirect: '/barber/dashboard',
        expiresAt
      })
    }

    // ── MODO 2: ACCESO ADMINISTRATIVO A PANEL DE SEDES / SUCURSAL ──
    if (targetPanel === 'BRANCH_ADMIN') {
      let targetBranch = business
      if (branchId && branchId !== business.id) {
        const foundBranch = await prisma.business.findUnique({ where: { id: branchId } })
        if (!foundBranch || (business.companyId && foundBranch.companyId !== business.companyId)) {
          return NextResponse.json(
            { error: 'La sede seleccionada no pertenece a la empresa de este negocio.' },
            { status: 403 }
          )
        }
        targetBranch = foundBranch as any
      }

      // Limpiar cualquier barber_session previa
      cookieStore.delete('barber_session')
      cookieStore.set('active_branch_id', targetBranch.id, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 2 * 60 * 60
      })

      const branchAdminUser = business.users.find(u => u.role === 'BRANCH_ADMIN')
      const targetUserId = branchAdminUser?.id || ownerUserId

      await createSession(
        targetUserId,
        branchId ? 'BRANCH_ADMIN' : 'OWNER',
        null,
        targetBranch.id,
        null,
        session.userId,
        false,
        targetBranch.companyId,
        null,
        false,
        cleanReason
      )

      await recordAuditLog({
        userId: session.userId,
        userRole: session.role,
        businessId: targetBranch.id,
        action: 'IMPERSONATE_LOGIN',
        entity: 'Business',
        entityId: targetBranch.id,
        details: {
          businessName: targetBranch.name,
          businessSlug: targetBranch.slug,
          targetPanel: 'BRANCH_ADMIN',
          reason: cleanReason,
          expiresAt
        }
      })

      return NextResponse.json({
        success: true,
        message: `Acceso temporal al panel de sedes de ${targetBranch.name}`,
        redirect: '/branches',
        expiresAt
      })
    }

    // ── MODO 3 (POR DEFECTO): ACCESO ADMINISTRATIVO A DASHBOARD DEL PROPIETARIO ──
    cookieStore.delete('barber_session')
    cookieStore.set('active_branch_id', business.id, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 60 * 60
    })

    await createSession(
      ownerUserId,
      'OWNER',
      null,
      business.id,
      null,
      session.userId,
      false,
      business.companyId,
      null,
      false,
      cleanReason
    )

    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      businessId: business.id,
      action: 'IMPERSONATE_LOGIN',
      entity: 'Business',
      entityId: business.id,
      details: {
        businessName: business.name,
        businessSlug: business.slug,
        targetPanel: 'OWNER',
        targetOwnerEmail: ownerUser?.email || null,
        reason: cleanReason,
        expiresAt
      }
    })

    sendSentinelNotification({
      type: 'SUPERADMIN_IMPERSONATION',
      priority: 'MEDIA',
      title: '🛡️ Inicio de Sesión de Soporte (Impersonation)',
      message: `<b>Super Admin ID:</b> <code>${session.userId}</code>\n<b>Barbería Objetivo:</b> ${business.name} (<code>${business.slug}</code>)\n<b>Panel:</b> ${targetPanel}\n<b>Motivo:</b> ${cleanReason}`,
      actionUrl: `https://sas-barbery.vercel.app/superadmin/businesses/${business.id}`
    }).catch(err => console.error('[Sentinel Impersonate Dispatch Error]:', err))

    return NextResponse.json({
      success: true,
      message: `Ingresando en modo soporte a ${business.name}`,
      redirect: '/dashboard',
      expiresAt
    })
  } catch (error) {
    console.error('Error impersonating business:', error)
    return NextResponse.json({ error: 'Error al iniciar sesión de soporte' }, { status: 500 })
  }
}
