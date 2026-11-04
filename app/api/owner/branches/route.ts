import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

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
      include: { company: { include: { plan: true } } }
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
            isActive: true
          }
        },
        invitations: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            email: true,
            status: true,
            expiresAt: true,
            createdAt: true
          }
        }
      }
    })

    const isMultiBranchAllowed = Boolean(company.plan?.allowsMultiBranch)
    const maxBranches = company.maxBranches || (isMultiBranchAllowed ? 5 : 1)
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
      branches: branches.map(b => ({
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
        manager: b.users[0] || null,
        pendingInvitations: b.invitations,
        counts: b._count
      })),
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

    // 1. Validar que el plan admita multisedes
    if (!company.plan?.allowsMultiBranch && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: 'Tu plan actual no permite agregar sedes adicionales. Se requiere el Plan Premium VIP.',
        upgradeRequired: true
      }, { status: 403 })
    }

    // 2. Validar límite de sedes contratadas
    const currentBranchesCount = await prisma.business.count({
      where: { companyId: company.id }
    })

    if (currentBranchesCount >= company.maxBranches && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: `Has alcanzado el límite de ${company.maxBranches} sedes contratadas. Puedes habilitar cupos adicionales por $${Number(company.additionalBranchPrice).toLocaleString('es-CO')} COP/mes desde tu suscripción.`,
        limitReached: true,
        currentCount: currentBranchesCount,
        maxAllowed: company.maxBranches,
        additionalBranchPrice: Number(company.additionalBranchPrice)
      }, { status: 403 })
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

    // 5. Crear la nueva sede vinculada a la empresa
    const newBranch = await prisma.business.create({
      data: {
        name: cleanName,
        slug: uniqueSlug,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        mapsUrl: mapsUrl ? mapsUrl.trim() : null,
        description: description ? description.trim() : null,
        companyId: company.id,
        isMainBranch: false,
        status: 'ACTIVE',
        planId: company.planId,
        trialEndsAt: company.trialEndsAt,
        subscriptionEndsAt: company.subscriptionEndsAt,
        page: {
          create: {
            theme: 'ELEGANT',
            primaryColor: '#000000',
            secondaryColor: '#ffffff',
            accentColor: '#d4af37',
            fontFamily: 'inter',
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

