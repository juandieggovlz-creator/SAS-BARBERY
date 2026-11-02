import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const barbers = await prisma.barber.findMany({
    select: { id: true, name: true, avatar: true, businessId: true }
  });
  console.log('Barberos:', JSON.stringify(barbers, null, 2));

  const pages = await prisma.businessPage.findMany({
    select: { id: true, businessId: true, bannerUrl: true, gallery: true }
  });
  console.log('BusinessPages:', JSON.stringify(pages, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
