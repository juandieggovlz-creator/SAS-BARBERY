const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Preparando entorno para la pantalla de inicialización /setup/owner...');

  // 1. Resetear juandieggovlz@gmail.com a estado previo a la configuración
  const user = await prisma.user.findUnique({ where: { email: 'juandieggovlz@gmail.com' } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'OWNER',
        password: null,
        mfaEnabled: false,
        mfaSecret: null,
        mfaConfirmedAt: null,
        lastMfaUsedAt: null
      }
    });

    await prisma.recoveryCode.deleteMany({ where: { userId: user.id } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    console.log('✅ Usuario juandieggovlz@gmail.com preparado para /setup/owner (Sin Root Owner asignado).');
  }

  // 2. Reactivar temporalmente superadmin mientras el propietario completa el wizard
  await prisma.user.updateMany({
    where: { email: { in: ['superadmin@barberos.com', 'admin@barberos.co'] } },
    data: { isActive: true }
  });
  console.log('✅ Cuentas anteriores activas temporalmente hasta que se confirme la inicialización en /setup/owner.');

  // 3. Limpiar Rate Limits
  await prisma.rateLimitStore.deleteMany({});
  console.log('✅ RateLimitStore reiniciado.');

  console.log('\n🎉 Entorno listo. La ruta /setup/owner está abierta y disponible.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

