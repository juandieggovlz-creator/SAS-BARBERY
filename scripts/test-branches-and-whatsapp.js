const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function runTests() {
  console.log('=== TEST 1: Verificar Cuenta de Pruebas y Excepción de Sedes ===')
  const user = await prisma.user.findFirst({
    where: { email: 'admin@admin.com' },
    include: {
      company: {
        include: {
          branches: true,
          plan: true
        }
      }
    }
  })

  console.log('Usuario:', user?.email, 'Role:', user?.role)
  console.log('Empresa:', user?.company?.name, 'CompanyId:', user?.company?.id)
  console.log('Sedes actuales:', user?.company?.branches?.length)

  const exception = await prisma.platformSetting.findFirst({
    where: {
      key: {
        in: [
          `branch_exception_${user.company.id}`,
          `branch_exception_${user.businessId}`
        ]
      }
    }
  })
  console.log('Excepción activa:', Boolean(exception))
  if (exception) {
    const data = JSON.parse(exception.value)
    console.log('Datos de excepción:', { enabled: data.enabled, maxBranches: data.maxBranches })
  }

  console.log('\n=== TEST 2: Simulación de Creación de Sede de Prueba ===')
  const testBranchSlug = `sede-norte-test-${Date.now().toString().slice(-4)}`
  let createdBranch = null

  try {
    createdBranch = await prisma.business.create({
      data: {
        name: 'Sede Norte Medellín',
        slug: testBranchSlug,
        phone: '+573009876543',
        address: 'Cra 43A # 1-50, El Poblado, Medellín',
        company: { connect: { id: user.company.id } },
        isMainBranch: false,
        status: 'ACTIVE',
        page: {
          create: {
            theme: 'ELEGANTE',
            primaryColor: '#09090b',
            accentColor: '#F59E0B',
            coverTitle: 'Bienvenido a Sede Norte Medellín',
            coverSubtitle: 'Tu estilo en las mejores manos.'
          }
        },
        services: {
          create: [
            { name: 'Corte Ejecutivo VIP', duration: 40, price: 45000, isActive: true },
            { name: 'Barba Tradicional', duration: 25, price: 25000, isActive: true }
          ]
        },
        barbers: {
          create: [
            { name: 'Andrés Barbero Norte', phone: '+573111111111', specialty: 'Fade & Styling', status: 'ACTIVE' }
          ]
        }
      },
      include: {
        services: true,
        barbers: true
      }
    })
    console.log('✅ Sede creada exitosamente:', {
      id: createdBranch.id,
      name: createdBranch.name,
      slug: createdBranch.slug,
      servicesCount: createdBranch.services.length,
      barbersCount: createdBranch.barbers.length
    })
  } catch (err) {
    console.error('Error creando sede de prueba:', err)
  }

  console.log('\n=== TEST 3: Generación de Invitación para Administrador de Sede ===')
  const crypto = require('crypto')
  const testToken = crypto.randomBytes(32).toString('hex')
  const inviteEmail = `admin.norte.${Date.now().toString().slice(-4)}@test.com`

  const invitation = await prisma.branchInvitation.create({
    data: {
      companyId: user.company.id,
      businessId: createdBranch.id,
      email: inviteEmail,
      token: testToken,
      role: 'BRANCH_ADMIN',
      status: 'PENDING',
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
    }
  })
  console.log('✅ Invitación generada:', {
    id: invitation.id,
    email: invitation.email,
    token: invitation.token.slice(0, 10) + '...',
    branchId: invitation.businessId,
    expiresAt: invitation.expiresAt
  })

  console.log('\n=== TEST 4: Aislamiento Multisede (Permisos y Consultas) ===')
  // Comprobar que la Sede Norte sólo ve sus servicios
  const servicesNorte = await prisma.service.findMany({ where: { businessId: createdBranch.id } })
  const servicesPrincipal = await prisma.service.findMany({ where: { businessId: user.businessId } })

  console.log(`Servicios Sede Norte (${servicesNorte.length}):`, servicesNorte.map(s => s.name))
  console.log(`Servicios Sede Principal (${servicesPrincipal.length}):`, servicesPrincipal.map(s => s.name))

  const noOverlap = !servicesNorte.some(sn => servicesPrincipal.some(sp => sp.id === sn.id))
  console.log('Aislamiento de servicios estricto:', noOverlap ? '✅ CONFIRMADO' : '❌ FALLO')

  // Limpieza de prueba
  console.log('\n=== Limpieza de la sede de prueba ===')
  await prisma.branchInvitation.deleteMany({ where: { businessId: createdBranch.id } })
  await prisma.service.deleteMany({ where: { businessId: createdBranch.id } })
  await prisma.barber.deleteMany({ where: { businessId: createdBranch.id } })
  await prisma.businessPage.deleteMany({ where: { businessId: createdBranch.id } })
  await prisma.business.delete({ where: { id: createdBranch.id } })
  console.log('✅ Sede y registros de prueba eliminados limpiamente')
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
