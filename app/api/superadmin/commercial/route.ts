import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const now = new Date()
    const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const allBusinesses = await prisma.business.findMany({
      include: {
        plan: true,
        users: {
          where: { role: 'OWNER' },
          select: { id: true, email: true, lastLoginAt: true }
        },
        appointments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        },
        _count: {
          select: {
            appointments: true,
            clients: true
          }
        }
      }
    })

    const trialsEnding2Days: any[] = []
    const trialsEnding5Days: any[] = []
    const plansExpired: any[] = []
    const inactive30Days: any[] = []

    for (const b of allBusinesses) {
      const owner = b.users[0]
      const ownerEmail = owner?.email || b.email || ''
      const phone = b.phone || ''
      const isTrial = b.status === 'TRIAL' || Boolean(b.trialEndsAt && new Date(b.trialEndsAt) > now)

      // Check dates
      const trialEnd = b.trialEndsAt ? new Date(b.trialEndsAt) : null
      const subEnd = b.subscriptionEndsAt ? new Date(b.subscriptionEndsAt) : null

      const lastLogin = owner?.lastLoginAt ? new Date(owner.lastLoginAt) : null
      const lastAppt = b.appointments[0]?.createdAt ? new Date(b.appointments[0].createdAt) : null
      const lastActivityDate = lastLogin || lastAppt || new Date(b.createdAt)
      const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))

      // Check Inactivity
      if (daysSinceActivity >= 30 && b.status !== 'CANCELLED') {
        inactive30Days.push({
          id: b.id,
          name: b.name,
          slug: b.slug,
          phone,
          ownerEmail,
          status: b.status,
          planName: b.plan?.name || (isTrial ? 'Prueba' : 'Sin plan'),
          daysSinceActivity,
          lastActivityText: `Sin actividad hace ${daysSinceActivity} días`,
          suggestedMessage: `Hola ${b.name}, te escribe el equipo de BarberOS. Notamos que llevas ${daysSinceActivity} días sin actividad en tu cuenta. ¿Necesitas ayuda configurando tu agenda o citas? Estamos para apoyarte.`
        })
      }

      // Check Trial Ending in 2 days (0 < diff <= 2 days)
      if (isTrial && trialEnd) {
        const diffMs = trialEnd.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays > 0 && diffDays <= 2) {
          trialsEnding2Days.push({
            id: b.id,
            name: b.name,
            slug: b.slug,
            phone,
            ownerEmail,
            status: b.status,
            planName: b.plan?.name || 'Prueba Gratuita',
            daysRemaining: diffDays,
            trialEndsAt: trialEnd.toISOString(),
            suggestedMessage: `¡Hola ${b.name}! Tu período de prueba en BarberOS finaliza en ${diffDays} día(s). Nos encantaría continuar acompañándote a optimizar tus citas. ¿Deseas activar tu plan comercial hoy con descuento especial?`
          })
        } else if (diffDays > 2 && diffDays <= 5) {
          trialsEnding5Days.push({
            id: b.id,
            name: b.name,
            slug: b.slug,
            phone,
            ownerEmail,
            status: b.status,
            planName: b.plan?.name || 'Prueba Gratuita',
            daysRemaining: diffDays,
            trialEndsAt: trialEnd.toISOString(),
            suggestedMessage: `Hola ${b.name}, tu prueba en BarberOS finaliza en ${diffDays} días. ¿Cómo ha sido tu experiencia agendando clientes? Escríbenos si deseas revisar planes y métodos de pago disponibles.`
          })
        } else if (diffDays <= 0) {
          plansExpired.push({
            id: b.id,
            name: b.name,
            slug: b.slug,
            phone,
            ownerEmail,
            status: b.status,
            planName: b.plan?.name || 'Prueba Gratuita',
            daysExpired: Math.abs(diffDays),
            expiredDate: trialEnd.toISOString(),
            reason: 'Prueba vencida',
            suggestedMessage: `Hola ${b.name}, tu periodo de prueba en BarberOS ya venció. Para reactivar tu agenda y reservas online, reactiva tu plan respondiendo a este mensaje.`
          })
        }
      }

      // Check Subscriptions Expired (non-trial)
      if (!isTrial && subEnd) {
        const diffMs = subEnd.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays <= 0 || b.status === 'SUSPENDED') {
          // Avoid duplicate if already in list
          if (!plansExpired.some(item => item.id === b.id)) {
            plansExpired.push({
              id: b.id,
              name: b.name,
              slug: b.slug,
              phone,
              ownerEmail,
              status: b.status,
              planName: b.plan?.name || 'Profesional',
              daysExpired: Math.abs(diffDays),
              expiredDate: subEnd.toISOString(),
              reason: b.status === 'SUSPENDED' ? 'Acceso suspendido' : 'Plan vencido',
              suggestedMessage: `Hola ${b.name}, tu suscripción de BarberOS ha vencido. Regulariza tu membresía para mantener tu página web y módulo de reservas activo.`
            })
          }
        }
      }
    }

    return NextResponse.json({
      summary: {
        trialsEnding2DaysCount: trialsEnding2Days.length,
        trialsEnding5DaysCount: trialsEnding5Days.length,
        plansExpiredCount: plansExpired.length,
        inactive30DaysCount: inactive30Days.length,
        totalCriticalLeads: trialsEnding2Days.length + trialsEnding5Days.length + plansExpired.length + inactive30Days.length
      },
      trialsEnding2Days,
      trialsEnding5Days,
      plansExpired,
      inactive30Days
    })
  } catch (error) {
    console.error('Super Admin Commercial API Error:', error)
    return NextResponse.json({ error: 'Error al generar seguimiento comercial' }, { status: 500 })
  }
}
