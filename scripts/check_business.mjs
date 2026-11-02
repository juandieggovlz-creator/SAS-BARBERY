import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, slug: true, logo: true }
  });
  console.log('Negocios registrados:', JSON.stringify(businesses, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
