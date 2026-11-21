import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'
import { getEffectiveSubscription, canAddBranch } from '@/lib/commercial-permissions'

export const dynamic = 'force-dynamic'

async function resolveOwnerCompany(session: { userId: string; companyId?: string | null; businessId?: string | null }) {
  if (session.companyId) {
    const comp = await prisma.company.findUnique({
      where: { id: session.companyId },
      include: { plan: true }
    })
    if (comp) return comp
  }

  // Fallback: buscar por businessId o por ownerId
  if (session.businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: {
        company: {
          include: { plan: true }
        }
      }
    })
    if (biz?.company) return biz.company
  }

  return await prisma.company.findFirst({
    where: { ownerId: session.userId },
    include: { plan: true }
  })
}

export async function GET() {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const company = await resolveOwnerCompany(session)
    if (!company) {
      return NextResponse.json({ error: 'No se encontró la empresa del propietario' }, { status: 404 })
    }

    const branches = await prisma.business.findMany({
      where: { companyId: company.id },
      orderBy: [
        { isMainBranch: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        _count: {
          select: {
            barbers: true,
            appointments: true,
            services: true,
            clients: true
          }
        },
        users: {
          where: { role: 'BRANCH_ADMIN' },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true
          }
        },
        invitations: {
          select: {
            id: true,
            email: true,
            status: true,
            token: true,
            expiresAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    // Resolver managers asignados por managerId
    const managerIds = branches.map(b => b.managerId).filter(Boolean) as string[]
    const managers = managerIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    }) : []
    const managerMap = new Map(managers.map(m => [m.id, m]))

    // Resolver usuario propietario de la empresa
    const ownerUser = await prisma.user.findUnique({
      where: { id: company.ownerId },
      select: { id: true, name: true, email: true }
    })

    // Check for SuperAdmin branch exception
    let hasBranchException = false
    let exData: any = null
    try {
      const exceptionSetting = await prisma.platformSetting.findFirst({
        where: {
          key: {
            in: [
              `branch_exception_${company.id}`,
              `branch_exception_${company.ownerId}`,
              ...(session.businessId ? [`branch_exception_${session.businessId}`] : [])
            ]
          }
        }
      })
      if (exceptionSetting) {
        exData = JSON.parse(exceptionSetting.value)
        hasBranchException = exData.enabled === true
      }
    } catch {}

    const mainBranch = branches.find(b => b.isMainBranch) || branches[0]
    const effectiveSub = mainBranch ? await getEffectiveSubscription(mainBranch.id).catch(() => null) : null

    const isMultiBranchAllowed = effectiveSub
      ? effectiveSub.permissions.canUseMultiBranch
      : (Boolean(company.plan?.allowsMultiBranch) || hasBranchException)

    const maxBranches = effectiveSub
      ? effectiveSub.limits.maxBranches
      : (hasBranchException
          ? Math.max(company.maxBranches || 1, exData?.maxBranches || 5)
          : (company.plan?.allowsMultiBranch ? (company.maxBranches || 2) : 1))

    const canCreateMore = isMultiBranchAllowed && branches.length < maxBranches

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        nit: company.nit,
        status: company.status,
        maxBranches,
        additionalBranchPrice: Number(company.additionalBranchPrice),
        plan: company.plan ? {
          id: company.plan.id,
          name: company.plan.name,
          slug: company.plan.slug,
          price: Number(company.plan.price),
          allowsMultiBranch: company.plan.allowsMultiBranch,
          includedBranches: company.plan.includedBranches,
          defaultAdditionalBranchPrice: Number(company.plan.defaultAdditionalBranchPrice)
        } : null
      },
      branches: branches.map(b => {
        let branchManager = null
        if (b.isMainBranch) {
          branchManager = {
            id: company.ownerId,
            name: ownerUser?.name || 'Propietario Principal',
            email: ownerUser?.email || '',
            role: 'OWNER',
            isOwner: true
          }
        } else if (b.managerId && managerMap.has(b.managerId)) {
          branchManager = managerMap.get(b.managerId)
        } else if (b.users[0]) {
          branchManager = b.users[0]
        }

        const now = new Date()
        const pendingInvs = b.invitations.filter(i => i.status === 'PENDING')
        const activePending = pendingInvs.find(i => now <= i.expiresAt)
        const expiredPending = pendingInvs.find(i => now > i.expiresAt)

        let adminStatus: 'ACTIVE_MANAGER' | 'PENDING_INVITATION' | 'EXPIRED_INVITATION' | 'MAIN_BRANCH_OWNER' | 'NO_MANAGER' = 'NO_MANAGER'
        if (b.isMainBranch) {
          adminStatus = 'MAIN_BRANCH_OWNER'
        } else if (branchManager) {
          adminStatus = 'ACTIVE_MANAGER'
        } else if (activePending) {
          adminStatus = 'PENDING_INVITATION'
        } else if (expiredPending) {
          adminStatus = 'EXPIRED_INVITATION'
        }

        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          phone: b.phone,
          address: b.address,
          mapsUrl: b.mapsUrl,
          description: b.description,
          logo: b.logo,
          status: b.status,
          isMainBranch: b.isMainBranch,
          createdAt: b.createdAt,
          managerId: b.managerId,
          manager: branchManager,
          adminStatus,
          pendingInvitations: pendingInvs.map(i => ({
            ...i,
            isExpired: now > i.expiresAt
          })),
          recentInvitations: b.invitations.map(i => ({
            ...i,
            isExpired: now > i.expiresAt
          })),
          counts: b._count
        }
      }),
      stats: {
        totalBranches: branches.length,
        activeBranches: branches.filter(b => b.status === 'ACTIVE').length,
        maxBranches,
        canCreateMore,
        isMultiBranchAllowed
      }
    })
  } catch (error) {
    console.error('Owner Branches GET Error:', error)
    return NextResponse.json({ error: 'Error al consultar sedes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession('OWNER')
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const company = await resolveOwnerCompany(session)
    if (!company) {
      return NextResponse.json({ error: 'No se encontró la empresa del propietario' }, { status: 404 })
    }

    // Check for SuperAdmin branch exception
    let hasBranchException = false
    let exData: any = null
    try {
      const exceptionSetting = await prisma.platformSetting.findFirst({
        where: {
          key: {
            in: [
              `branch_exception_${company.id}`,
              `branch_exception_${company.ownerId}`,
              ...(session.businessId ? [`branch_exception_${session.businessId}`] : [])
            ]
          }
        }
      })
      if (exceptionSetting) {
        exData = JSON.parse(exceptionSetting.value)
        hasBranchException = exData.enabled === true
      }
    } catch {}

    // 1. Validar permisos y límites reales mediante motor comercial central
    const targetBizId = session.businessId || (await prisma.business.findFirst({ where: { companyId: company.id }, select: { id: true } }))?.id
    if (targetBizId) {
      const branchCheck = await canAddBranch(targetBizId)
      if (!branchCheck.allowed) {
        return NextResponse.json({
          error: branchCheck.reason || 'Tu plan actual no permite agregar más sedes.',
          upgradeRequired: branchCheck.maxAllowed <= 1,
          limitReached: branchCheck.currentCount >= branchCheck.maxAllowed,
          currentCount: branchCheck.currentCount,
          maxAllowed: branchCheck.maxAllowed,
          additionalBranchPrice: Number(company.additionalBranchPrice)
        }, { status: 403 })
      }
    }

    // 3. Procesar datos del formulario
    const body = await request.json()
    const { name, phone, address, mapsUrl, description } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre de la sede es obligatorio (mínimo 2 caracteres)' }, { status: 400 })
    }

    const cleanName = name.trim()

    // 4. Generar slug único basado en el nombre de la sede
    let baseSlug = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!baseSlug) baseSlug = `sede-${Date.now().toString().slice(-4)}`

    let uniqueSlug = baseSlug
    let counter = 1
    while (await prisma.business.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`
      counter++
    }

    // Heredar configuración visual de la sede principal
    const mainBranchPage = await prisma.businessPage.findFirst({
      where: {
        business: {
          companyId: company.id,
          isMainBranch: true
        }
      },
      select: {
        theme: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true
      }
    })

    // 5. Crear la nueva sede vinculada a la empresa
    const newBranch = await prisma.business.create({
      data: {
        name: cleanName,
        slug: uniqueSlug,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        mapsUrl: mapsUrl ? mapsUrl.trim() : null,
        description: description ? description.trim() : null,
        company: { connect: { id: company.id } },
        isMainBranch: false,
        status: 'ACTIVE',
        ...(company.planId ? { plan: { connect: { id: company.planId } } } : {}),
        trialEndsAt: company.trialEndsAt,
        subscriptionEndsAt: company.subscriptionEndsAt,
        page: {
          create: {
            theme: mainBranchPage?.theme || 'ELEGANT',
            primaryColor: mainBranchPage?.primaryColor || '#000000',
            secondaryColor: mainBranchPage?.secondaryColor || '#ffffff',
            accentColor: mainBranchPage?.accentColor || '#d4af37',
            fontFamily: mainBranchPage?.fontFamily || 'inter',
            coverTitle: cleanName,
            coverSubtitle: 'Experiencia premium de barbería clásica y moderna.',
            showPrices: true,
            showTeam: true,
            showServices: true
          }
        }
      },
      include: {
        page: true
      }
    })

    // 6. Registrar en auditoría
    await recordAuditLog({
      userId: session.userId,
      userRole: session.role,
      businessId: newBranch.id,
      action: 'BRANCH_CREATED',
      entity: 'Business',
      entityId: newBranch.id,
      details: {
        companyId: company.id,
        companyName: company.name,
        branchName: newBranch.name,
        branchSlug: newBranch.slug
      }
    })

    return NextResponse.json({
      success: true,
      branch: newBranch,
      message: `Sede "${newBranch.name}" creada exitosamente.`
    }, { status: 201 })
  } catch (error) {
    console.error('Owner Branches POST Error:', error)
    return NextResponse.json({ error: 'Error al registrar la nueva sede' }, { status: 500 })
  }
}

