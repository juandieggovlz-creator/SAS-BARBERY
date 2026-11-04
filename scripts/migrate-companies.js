const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- INICIANDO MIGRACIÓN SEGURA MULTISEDES ---');

  // 1. Actualizar configuración de Planes en la base de datos
  console.log('\n1. Actualizando tarifas y configuración de planes...');
  
  const plans = await prisma.plan.findMany();
  for (const p of plans) {
    if (p.slug === 'plan-basico') {
      await prisma.plan.update({
        where: { id: p.id },
        data: {
          price: 69900,
          allowsMultiBranch: false,
          includedBranches: 1,
          defaultAdditionalBranchPrice: 50000
        }
      });
      console.log('✓ Plan Básico actualizado a $69.900 COP (1 sede)');
    } else if (p.slug === 'plan-profesional') {
      await prisma.plan.update({
        where: { id: p.id },
        data: {
          price: 119900,
          allowsMultiBranch: false,
          includedBranches: 1,
          defaultAdditionalBranchPrice: 50000
        }
      });
      console.log('✓ Plan Profesional actualizado a $119.900 COP (1 sede)');
    } else if (p.slug === 'plan-premium') {
      await prisma.plan.update({
        where: { id: p.id },
        data: {
          price: 169900,
          allowsMultiBranch: true,
          includedBranches: 1,
          defaultAdditionalBranchPrice: 50000
        }
      });
      console.log('✓ Plan Premium VIP actualizado a $169.900 COP (Multisede Habilitado, $50.000 / sede extra)');
    }
  }

  // 2. Backfill de empresas (Company) para cada negocio existente
  console.log('\n2. Verificando y vinculando negocios existentes a entidades Company...');
  const businesses = await prisma.business.findMany({
    include: {
      plan: true,
      users: { where: { role: 'OWNER' } }
    }
  });

  for (const biz of businesses) {
    if (!biz.companyId) {
      const ownerUser = biz.users[0] || await prisma.user.findFirst({ where: { businessId: biz.id } });
      const ownerId = ownerUser ? ownerUser.id : 'unknown-owner';

      const company = await prisma.company.create({
        data: {
          name: biz.name,
          ownerId: ownerId,
          planId: biz.planId,
          status: biz.status,
          trialEndsAt: biz.trialEndsAt,
          subscriptionEndsAt: biz.subscriptionEndsAt,
          maxBranches: biz.plan?.slug === 'plan-premium' ? 5 : 1,
          additionalBranchPrice: 50000
        }
      });

      await prisma.business.update({
        where: { id: biz.id },
        data: {
          companyId: company.id,
          isMainBranch: true
        }
      });

      if (ownerUser) {
        await prisma.user.update({
          where: { id: ownerUser.id },
          data: { companyId: company.id }
        });
      }

      console.log(`✓ Empresa creada: "${company.name}" (ID: ${company.id}) vinculada a Sede Principal "${biz.slug}"`);
    } else {
      console.log(`ℹ Negocio "${biz.slug}" ya tiene empresa vinculada (${biz.companyId})`);
    }
  }

  console.log('\n--- MIGRACIÓN COMPLETADA EXITOSAMENTE ---');
}

main()
  .catch(e => {
    console.error('Error durante migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

