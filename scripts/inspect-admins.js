const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { role: 'ROOT_PLATFORM_OWNER' },
        { email: 'juandieggovlz@gmail.com' }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mfaEnabled: true,
      createdAt: true
    }
  });
  console.log('Admin & Root users found in DB:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

