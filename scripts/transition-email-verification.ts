import { prisma } from '../lib/prisma'

async function main() {
  console.log('--- Migrando usuarios existentes a emailVerified: true ---')
  const count = await prisma.user.updateMany({
    where: {
      emailVerified: false,
    },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })
  console.log(`Usuarios actualizados con éxito: ${count.count}`)

  const superAdmin = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ROOT_PLATFORM_OWNER'] } },
    select: { email: true, emailVerified: true },
  })
  console.log('Superadmin verificado:', superAdmin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
