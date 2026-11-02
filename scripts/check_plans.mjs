import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const plans = await prisma.plan.findMany({
    orderBy: { price: 'asc' }
  });
  console.log('Planes en DB:', JSON.stringify(plans, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
