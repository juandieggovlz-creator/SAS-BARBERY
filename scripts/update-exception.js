const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function run() {
  const companyId = '7a7da0f1-d3d5-4ca7-9d63-bd66b6f7e391'
  const businessId = 'd93ff19d-5055-4d51-ae66-2d27536e9964'

  const value = JSON.stringify({
    enabled: true,
    grantedAt: new Date().toISOString(),
    grantedBy: 'SUPER_ADMIN_MANUAL_TEST',
    notes: 'Excepción individual habilitada temporalmente para pruebas de sedes',
    businessId,
    companyId,
    maxBranches: 5
  })

  // Ensure key exists for both companyId and businessId so it never misses
  await prisma.platformSetting.upsert({
    where: { key: `branch_exception_${companyId}` },
    update: { value, description: 'Excepción de Sedes para Barbería Elite SAS (Company)' },
    create: { key: `branch_exception_${companyId}`, value, description: 'Excepción de Sedes para Barbería Elite SAS (Company)' }
  })

  await prisma.platformSetting.upsert({
    where: { key: `branch_exception_${businessId}` },
    update: { value, description: 'Excepción de Sedes para Barbería Elite SAS (Business)' },
    create: { key: `branch_exception_${businessId}`, value, description: 'Excepción de Sedes para Barbería Elite SAS (Business)' }
  })

  console.log('Exceptions updated successfully with maxBranches: 5')
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

