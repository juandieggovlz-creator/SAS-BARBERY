const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'juandieggovlz@gmail.com' },
    include: {
      business: true,
      sessions: true,
      passkeys: true,
      recoveryCodes: true
    }
  });
  console.log('User juandieggovlz@gmail.com details:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

