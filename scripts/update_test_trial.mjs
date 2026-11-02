import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const plan = await prisma.plan.findFirst({
    where: { slug: 'plan-profesional' }
  });

  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const updated = await prisma.business.updateMany({
    where: { slug: 'barberia-elite' },
    data: {
      status: 'TRIAL',
      planId: plan?.id || null,
      trialEndsAt: trialEndsAt,
      maxBarbers: 10,
      maxClients: 2500,
      maxAppointments: 5000
    }
  });

  console.log('✅ Barbería Elite SAS actualizada con 1 mes de prueba gratis a FULL:', updated);
  await prisma.$disconnect();
}

run().catch(console.error);
