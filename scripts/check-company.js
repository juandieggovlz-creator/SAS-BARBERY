const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@admin.com' },
    include: {
      company: {
        include: {
          plan: true,
          branches: {
            select: { id: true, name: true, slug: true, isMainBranch: true, status: true }
          }
        }
      },
      business: {
        include: {
          plan: true
        }
      }
    }
  })

  console.log('User:', {
    id: user?.id,
    email: user?.email,
    role: user?.role,
    companyId: user?.companyId,
    businessId: user?.businessId
  })

  console.log('Company:', {
    id: user?.company?.id,
    name: user?.company?.name,
    maxBranches: user?.company?.maxBranches,
    plan: user?.company?.plan ? {
      name: user.company.plan.name,
      allowsMultiBranch: user.company.plan.allowsMultiBranch,
      includedBranches: user.company.plan.includedBranches
    } : null,
    branchesCount: user?.company?.branches?.length,
    branches: user?.company?.branches
  })

  if (user?.company?.id) {
    const exception = await prisma.platformSetting.findUnique({
      where: { key: `branch_exception_${user.company.id}` }
    })
    console.log('Branch Exception:', exception)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

